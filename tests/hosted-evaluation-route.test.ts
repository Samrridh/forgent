import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/server/forgent/hosted-task-agent", () => ({ invokeHostedTask: mocks.invoke }));
import { POST } from "@/app/api/builder/evaluate-hosted/route";
const test = { title: "Example", category: "functional", purpose: "Check response", inputJson: '{"task":"hello"}', expectedJson: '{"result":"hi"}', expectation: "Match exactly" };
const request = (body: unknown) => new NextRequest("http://localhost/api/builder/evaluate-hosted", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => vi.clearAllMocks());
describe("approved hosted evaluation", () => {
  it("refuses to run without approval", async () => {
    const response = await POST(request({ endpointUrl: "https://example.com/run", approved: false, cases: [test] }));
    expect(response.status).toBe(400); expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("returns measured results from the hosted endpoint", async () => {
    mocks.invoke.mockResolvedValue("hi");
    const response = await POST(request({ endpointUrl: "https://example.com/run", approved: true, cases: [test] }));
    const data = await response.json();
    expect(response.status).toBe(200); expect(data.evaluation.scorePercent).toBe(100);
    expect(data.evaluation.cases[0].status).toBe("passed");
  });
  it("streams actual case outcomes before the final report", async () => {
    mocks.invoke.mockResolvedValue("hi");
    const response = await POST(new NextRequest("http://localhost/api/builder/evaluate-hosted", { method: "POST", headers: { accept: "text/event-stream" }, body: JSON.stringify({ endpointUrl: "https://example.com/run", approved: true, cases: [test] }) }));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const frames = (await response.text()).trim().split("\n\n").map((frame) => JSON.parse(frame.slice(6)));
    expect(frames[0]).toMatchObject({ type: "progress", completed: 1, total: 1, result: { status: "passed" } });
    expect(frames[1]).toMatchObject({ type: "complete", evaluation: { passed: 1, scorePercent: 100 } });
  });
  it("runs the platform-owned sample when no endpoint is supplied", async () => {
    const sample = { ...test, inputJson: JSON.stringify({ task: "Explain the refund policy" }), expectedJson: JSON.stringify({ result: "I’ll send this question to a person." }) };
    const response = await POST(request({ endpointUrl: "", hostedRuntime: "knowledge-support-v1", approved: true, cases: [sample] }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.evaluation.cases[0].status).toBe("passed");
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("does not run arbitrary packages without an endpoint", async () => {
    const response = await POST(request({ endpointUrl: "", hostedRuntime: null, approved: true, cases: [test] }));
    expect(response.status).toBe(400);
  });
});
