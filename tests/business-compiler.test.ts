import { afterEach, describe, expect, it, vi } from "vitest";
import { compileBusinessRequest } from "@/server/compiler/business-compiler";
import type { CompilerAgent, BusinessRequest } from "@/server/compiler/business-compiler-contracts";
const input: BusinessRequest = { objective: "Reconcile receiving documents", schema: "", inputs: "", outputs: "", rules: "", constraints: "", answers: [] };
const agents: CompilerAgent[] = [{ id: "reader-v1", name: "Receiving reader", summary: "Reads receiving documents", capabilities: [], permissions: [], limitations: [], pricePaise: 100, latencyMs: 100, inputSchema: null, outputSchema: null }];
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("business compiler", () => {
  it("returns labelled offline matches and identifies missing information", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", ""); vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    const result = await compileBusinessRequest(input, agents);
    expect(result.mode).toBe("offline");
    expect(result.candidates[0].agentIds).toEqual(["reader-v1"]);
    expect(result.candidates[0].warnings.join(" ")).toContain("schema is missing");
    expect(result.questions.length).toBeGreaterThan(0);
  });
  it("rejects invented agents in OpenRouter output", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ questions: [], candidates: [{ title: "Invented", rationale: "example", agentIds: ["unknown"], warnings: [] }] }) } }] }) }));
    const result = await compileBusinessRequest(input, agents);
    expect(result.mode).toBe("openrouter");
    expect(result.candidates).toEqual([]);
  });
  it("sends follow-up answers with agent data and requests structured output", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ questions: [], candidates: [{ title: "Reader", rationale: "Extracts records", agentIds: ["reader-v1"], warnings: [] }] }) } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await compileBusinessRequest({ ...input, answers: [{ question: "What data will the workflow receive?", answer: "Purchase orders" }] }, agents);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.parse(request.messages[1].content).responseSchema).toBeDefined();
    expect(request.messages[1].content).toContain("Purchase orders");
    expect(request.messages[1].content).toContain("reader-v1");
    expect(result.questions).not.toContain("What data will the workflow receive?");
    expect(result.candidates[0].agentIds).toEqual(["reader-v1"]);
  });
  it("falls back if OpenRouter adds an unexpected response field", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ questions: [], candidates: [], unexpected: true }) } }] }) }));
    const result = await compileBusinessRequest(input, agents);
    expect(result.mode).toBe("offline");
  });
});
