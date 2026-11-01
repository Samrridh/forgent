import { afterEach, describe, expect, it, vi } from "vitest";
import { runMekoDemo } from "@/server/forgent/meko-handoff";

vi.mock("@/server/forgent/meko-conversation", () => ({ saveMekoConversation: vi.fn().mockResolvedValue({ conversationId: "demo", memoryStatus: "saved" }) }));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Meko handoff demo", () => {
  it("reports missing configuration", async () => {
    vi.stubEnv("MEKO_API_KEY", "");
    await expect(runMekoDemo()).rejects.toThrow("Set MEKO_API_KEY");
  });
  it("passes the context retrieved from Meko to the second agent", async () => {
    vi.stubEnv("MEKO_API_KEY", "test-key"); vi.stubEnv("MEKO_DATAPACK_ID", "demo"); vi.stubEnv("OPENROUTER_API_KEY", "model-key");
    const context = { question: "Retrieved question", reason: "Unknown policy", facts: "Fictional case" };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ data: { content_hash: "a".repeat(64) } }))
      .mockResolvedValueOnce(Response.json({ data: { content_base64: Buffer.from(JSON.stringify(context)).toString("base64") } }))
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: "Please ask a human to review." } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const stages:string[] = [];
    const result = await runMekoDemo(stage => stages.push(stage));
    expect(stages).toEqual(["preparing", "saving", "retrieving", "drafting"]);
    expect(result.retrieved).toEqual(context);
    expect(result.answer).toContain("human");
    const modelBody = JSON.parse(fetchMock.mock.calls[2][1].body as string);
    expect(modelBody.messages[1].content).toBe(JSON.stringify(context));
  });
  it("retries empty model output without saving the handoff again", async () => {
    vi.stubEnv("MEKO_API_KEY", "test-key"); vi.stubEnv("MEKO_DATAPACK_ID", "demo"); vi.stubEnv("OPENROUTER_API_KEY", "model-key");
    const context = { question: "Question", reason: "Unknown", facts: "Fictional" };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ data: { content_hash: "a".repeat(64) } }))
      .mockResolvedValueOnce(Response.json({ data: { content_base64: Buffer.from(JSON.stringify(context)).toString("base64") } }))
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: "" } }] }))
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: "A person can review this." } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await runMekoDemo();
    expect(result.answerSource).toBe("model"); expect(result.answer).toContain("review"); expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("labels the predefined fallback when both model responses are empty", async () => {
    vi.stubEnv("MEKO_API_KEY", "test-key"); vi.stubEnv("MEKO_DATAPACK_ID", "demo"); vi.stubEnv("OPENROUTER_API_KEY", "model-key");
    const context = { question: "Question", reason: "Unknown", facts: "Fictional" };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ data: { content_hash: "a".repeat(64) } }))
      .mockResolvedValueOnce(Response.json({ data: { content_base64: Buffer.from(JSON.stringify(context)).toString("base64") } }))
      .mockImplementation(async () => Response.json({ choices: [{ message: { content: null } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await runMekoDemo();
    expect(result.answerSource).toBe("fallback"); expect(result.answer).toContain("support team member"); expect(fetchMock).toHaveBeenCalledTimes(4);
  });

});
