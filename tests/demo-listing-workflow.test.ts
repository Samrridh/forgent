import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as publish, GET as list } from "@/app/api/demo/listings/route";
import { POST as run } from "@/app/api/demo/listings/[id]/run/route";
let directory: string;
beforeAll(async () => { directory = await mkdtemp(path.join(os.tmpdir(), "forgent-listing-")); process.env.FORGENT_DATA_DIR = directory; });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
afterAll(async () => { delete process.env.FORGENT_DATA_DIR; await rm(directory, { recursive: true, force: true }); });
const request = (url: string, body: unknown) => new NextRequest(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
describe("builder to individual demo", () => {
  it("publishes a labelled listing and returns a no-charge simulated result", async () => {
    const report = { summary: "Static review", findings: [], limitations: ["Not executed"], proposedTests: [] };
    const created = await publish(request("http://localhost/api/demo/listings", { name: "Demo agent", description: "Drafts concise summaries from provided text.", category: "Research", pricePaise: 20000, report }));
    expect(created.status).toBe(201);
    const { listing } = await created.json();
    expect((await (await list()).json()).listings.map((item: { id: string }) => item.id)).toContain(listing.id);
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "Demo result" } }] }), { status: 200 }));
    const result = await run(request("http://localhost/api/demo/listings/run", { task: "Summarize this sample" }), { params: Promise.resolve({ id: listing.id }) });
    expect(await result.json()).toEqual({ answer: "Demo result", mode: "simulation", chargedPaise: 0 });
  });
  it("rejects malformed listings", async () => {
    expect((await publish(request("http://localhost/api/demo/listings", { name: "x" }))).status).toBe(400);
  });
});
