import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/server/compiler/business-agent-catalog", () => ({ listCompilerAgents: mocks.list }));
import { POST } from "@/app/api/business/test-plan/route";

const requirements = { objective: "Classify support requests", schema: "", inputs: "", outputs: "", rules: "", constraints: "", answers: [] };
const candidate = { title: "Support", rationale: "Classifies requests", agentIds: ["agent-1"] };
const testCase = { title: "Classify request", category: "functional", purpose: "Check classification", inputJson: '"classify: refund"', expectedJson: "null", expectation: "Reviewer must define the expected answer." };
const request = (body: unknown) => new NextRequest("http://localhost/api/business/test-plan", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv("GEMINI_API_KEY", "test-key"); mocks.list.mockResolvedValue({ agents: [{ id: "agent-1", name: "Support" }] }); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("business test plan", () => {
  it("rejects unknown agents before contacting the model", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request({ requirements, candidate: { ...candidate, agentIds: ["unknown"] } }));
    expect(response.status).toBe(400); expect(fetchMock).not.toHaveBeenCalled();
  });
  it("returns validated model cases, including unscorable cases needing review", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ tests: [testCase] }) }] } }] }), { status: 200 })));
    const response = await POST(request({ requirements, candidate }));
    expect(response.status).toBe(200); expect((await response.json()).tests).toEqual([testCase]);
  });
  it("rejects malformed model output", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ tests: [{ ...testCase, inputJson: "not json" }] }) }] } }] }), { status: 200 })));
    expect((await POST(request({ requirements, candidate }))).status).toBe(502);
  });
  it("reports quota errors without exposing the provider response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "sensitive provider detail" } }), { status: 429 })));
    const response = await POST(request({ requirements, candidate }));
    const data = await response.json();
    expect(response.status).toBe(429);
    expect(data.error).toContain("rate limit or quota");
    expect(data.error).not.toContain("sensitive provider detail");
  });
});
