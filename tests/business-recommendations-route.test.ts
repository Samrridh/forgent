import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ list: vi.fn(), compile: vi.fn() }));
vi.mock("@/server/compiler/business-agent-catalog", () => ({ listCompilerAgents: mocks.list }));
vi.mock("@/server/compiler/business-compiler", () => ({ compileBusinessRequest: mocks.compile }));
import { POST } from "@/app/api/business/recommendations/route";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("candidate recommendations", () => {
  it("serves the demo catalog in production and labels the fallback", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.list.mockResolvedValue({ agents: [], source: "seed", fallbackReason: "unavailable" });
    mocks.compile.mockResolvedValue({ notices: [] });
    const response = await POST(new NextRequest("https://forgent.example/api/business/recommendations", { method: "POST", body: JSON.stringify({ objective: "Summarize support tickets" }) }));
    expect(response.status).toBe(200);
    expect((await response.json()).notices).toContain("Database unavailable; using seeded demo agents.");
  });

  it("rejects a cross-origin request", async () => {
    const response = await POST(new NextRequest("https://forgent.example/api/business/recommendations", { method: "POST", headers: { origin: "https://other.example" }, body: "{}" }));
    expect(response.status).toBe(403);
    expect(mocks.compile).not.toHaveBeenCalled();
  });
});
