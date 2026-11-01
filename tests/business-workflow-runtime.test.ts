import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), invoke: vi.fn() }));
vi.mock("@/server/db", () => ({ db: { marketplaceListing: { findMany: mocks.findMany } } }));
vi.mock("@/server/forgent/hosted-task-agent", () => ({ invokeHostedTask: mocks.invoke }));
import { POST as evaluate } from "@/app/api/builder/evaluate-hosted/route";
import { POST as run } from "@/app/api/business/workflows/[id]/route";
import { HOSTED_SAMPLE_AGENT_ID, HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";

const testCase = { title: "Workflow", category: "functional", purpose: "Check output", inputJson: '{"task":"start"}', expectedJson: '{"result":"done"}', expectation: "Exact output" };
const evaluateRequest = () => new NextRequest("http://localhost/api/builder/evaluate-hosted", { method: "POST", body: JSON.stringify({ endpointUrl: "", hostedRuntime: null, agentIds: ["listing:a", "listing:b"], approved: true, cases: [testCase] }) });
beforeEach(() => { mocks.findMany.mockResolvedValue([{ id: "a", endpointUrl: "https://a.example/run" }, { id: "b", endpointUrl: "https://b.example/run" }]); mocks.invoke.mockReset().mockImplementation(async (url: string, task: string) => url.includes("a.example") && task === "start" ? "middle" : "done"); });
describe("business workflow execution", () => {
  it("tests the registered stages and exposes a temporary endpoint only after all cases pass", async () => {
    const response = await evaluate(evaluateRequest());
    const { evaluation } = await response.json();
    expect(evaluation.scorePercent).toBe(100);
    expect(mocks.invoke).toHaveBeenNthCalledWith(1, "https://a.example/run", "start");
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, "https://b.example/run", "middle");
    const id = evaluation.workflowPath.split("/").pop();
    const result = await run(new NextRequest(`http://localhost${evaluation.workflowPath}`, { method: "POST", body: JSON.stringify({ task: "start" }) }), { params: Promise.resolve({ id }) });
    expect(await result.json()).toEqual({ result: "done" });
  });
  it("does not issue an endpoint if a case fails", async () => {
    mocks.invoke.mockResolvedValue("unexpected");
    const response = await evaluate(evaluateRequest());
    const { evaluation } = await response.json();
    expect(evaluation.failed).toBe(1); expect(evaluation.workflowPath).toBeUndefined();
  });
  it("invalidates the endpoint if a registered stage changes after testing", async () => {
    const response = await evaluate(evaluateRequest());
    const { evaluation } = await response.json();
    const id = evaluation.workflowPath.split("/").pop();
    mocks.findMany.mockResolvedValue([{ id: "a", endpointUrl: "https://changed.example/run" }, { id: "b", endpointUrl: "https://b.example/run" }]);
    const result = await run(new NextRequest(`http://localhost${evaluation.workflowPath}`, { method: "POST", body: JSON.stringify({ task: "start" }) }), { params: Promise.resolve({ id }) });
    expect(result.status).toBe(404);
  });
  it("rejects candidates whose registered listings are unavailable", async () => {
    mocks.findMany.mockResolvedValue([]);
    expect((await evaluate(evaluateRequest())).status).toBe(400);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("runs the actual platform support sample without a builder endpoint", async () => {
    const request = new NextRequest("http://localhost/api/builder/evaluate-hosted", { method: "POST", body: JSON.stringify({ endpointUrl: "", hostedRuntime: null, agentIds: [HOSTED_SAMPLE_AGENT_ID], approved: true, cases: HOSTED_SAMPLE_CASES }) });
    const response = await evaluate(request);
    const { evaluation } = await response.json();
    expect(evaluation.passed).toBe(HOSTED_SAMPLE_CASES.length);
    expect(evaluation.workflowPath).toMatch(/^\/api\/business\/workflows\//);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
});
