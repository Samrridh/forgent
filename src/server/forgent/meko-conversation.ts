import { z } from "zod";

const rpcResponse = z.object({ result: z.object({ isError: z.boolean().optional(), content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(), structuredContent: z.unknown().optional() }).optional(), error: z.object({ message: z.string() }).optional() });

async function callMeko(key: string, name: string, args: Record<string, string>) {
  const response = await fetch("https://mcp.mekodata.ai/mcp", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-03-26" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Meko ${name} failed (HTTP ${response.status}).`);
  const raw = await response.text();
  const data = raw.startsWith("event:") ? raw.split("\n").find(line => line.startsWith("data: "))?.slice(6) : raw;
  if (!data) throw new Error(`Meko ${name} returned an empty response.`);
  const parsed = rpcResponse.parse(JSON.parse(data));
  const content = parsed.result?.content?.find(item => item.type === "text")?.text;
  if (parsed.error || parsed.result?.isError) throw new Error(`Meko ${name} failed: ${parsed.error?.message || content || "unknown error"}`);
  const value: unknown = parsed.result?.structuredContent ?? (content ? JSON.parse(content) : {});
  const wrapper = z.object({ result: z.string() }).safeParse(value);
  const result: unknown = wrapper.success ? JSON.parse(wrapper.data.result) : value;
  const failure = z.object({ error: z.string(), detail: z.unknown().optional() }).safeParse(result);
  if (failure.success) throw new Error(`Meko ${name} failed: ${failure.data.error}${typeof failure.data.detail === "string" ? ` (${failure.data.detail})` : ""}`);
  return result;
}

export async function saveMekoConversation(key: string, datapack: string, question: string, answer: string, facts: string) {
  const agent_id = "forgent-support-demo";
  const created = await callMeko(key, "conversation_create", { agent_id, datapack_id: datapack, title: "Forgent support handoff demo" });
  const conversation = z.object({ id: z.string().optional(), conversation_id: z.string().optional() }).parse(created);
  const conversation_id = conversation.id || conversation.conversation_id;
  if (!conversation_id) throw new Error("Meko did not return a conversation ID.");
  const common = { conversation_id, agent_id, datapack_id: datapack };
  await callMeko(key, "conversation_add_message", { ...common, input: question, output: answer });
  try {
    await callMeko(key, "memory_add", { ...common, text: `Fictional Forgent demo: ${facts}` });
    return { conversationId: conversation_id, memoryStatus: "saved" as const };
  } catch (error) {
    return { conversationId: conversation_id, memoryStatus: "failed" as const, memoryError: error instanceof Error ? error.message : "Memory could not be saved." };
  }
}
