import { runMekoDemo } from "@/server/forgent/meko-handoff";

export const dynamic = "force-dynamic";
export async function POST() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (value: unknown) => { if (open) try { controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); } catch { open = false; } };
      try {
        const result = await runMekoDemo(stage => send({ type: "progress", stage }));
        send({ type: "complete", result });
      } catch (error) {
        const message = error instanceof Error && (error.message.startsWith("Set MEKO_") || error.message.startsWith("Meko could") || error.message.startsWith("The support model")) ? error.message : "The demo service could not be reached or returned an invalid response.";
        send({ type: "error", message });
      } finally { if (open) controller.close(); }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store, no-transform" } });
}
