import { NextRequest, NextResponse } from "next/server";
import {
  SandboxRunRequestSchema,
  SandboxTelemetryChunk,
} from "@/lib/contracts/sandbox-types";
import { executeSandboxTask } from "@/server/sandbox/sandbox-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const isStreamRequested =
      req.nextUrl.searchParams.get("stream") === "true" ||
      req.headers.get("accept")?.includes("text/event-stream");

    const body = await req.json();
    const parseResult = SandboxRunRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          issues: parseResult.error.format(),
          message: "Sandbox execution parameters failed schema validation.",
        },
        { status: 400 }
      );
    }

    const validatedRequest = parseResult.data;

    // SSE Streaming Mode
    if (isStreamRequested) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          };

          try {
            const result = await executeSandboxTask(validatedRequest, (chunk: SandboxTelemetryChunk) => {
              sendEvent("chunk", chunk);
            });

            sendEvent("complete", result);
            controller.close();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Execution streaming failed";
            sendEvent("error", { message });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Direct Non-Streaming JSON Response
    const result = await executeSandboxTask(validatedRequest);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: "SANDBOX_EXECUTION_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
