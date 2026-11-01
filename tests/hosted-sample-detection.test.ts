import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/builder/package-review/route";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("hosted sample detection", () => {
  it("recognizes the repository manifest-only support package", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: "Sample", findings: [], limitations: ["Not run"], proposedTests: [] }) } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const bytes = await readFile(path.join(process.cwd(), "public/samples/support-agent.zip"));
    const form = new FormData(); form.set("package", new File([bytes], "support-agent.zip")); form.set("name", "Support sample"); form.set("description", "A sample support agent."); form.set("inputSchema", "{}"); form.set("outputSchema", "{}");
    const response = await POST(new NextRequest("http://localhost/api/builder/package-review", { method: "POST", body: form }));
    expect(response.status).toBe(200);
    expect((await response.json()).hostedRuntime).toBe("knowledge-support-v1");
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.messages[0].content).toContain("platform-owned deterministic support sample");
    const payload = JSON.parse(sent.messages[1].content);
    expect(payload.evaluator.comparison).toBe("exact");
    expect(payload.platformSampleFixtures.length).toBeGreaterThan(0);
  });
});
