import { describe, it, expect, vi } from "vitest";
import { POST as createJobRoute, GET as getJobsRoute } from "@/app/api/jobs/route";
import { GET as streamJobRoute } from "@/app/api/jobs/[id]/stream/route";
import { POST as verifyPostRoute, GET as verifyGetRoute } from "@/app/api/verify/route";
import { NextRequest } from "next/server";
import { generateEvidenceReceipt } from "@/server/engine/receipt";
import { jobStore } from "@/server/engine/job-store";

describe("Jobs & SSE Streaming API Suite", () => {
  it("creates a job and locks escrow via POST /api/jobs", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentSlug: "sec-10k-financial-analyst",
        input: { ticker: "MSFT", fiscalYear: 2024 },
      }),
    });

    const res = await createJobRoute(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.jobId).toBeDefined();
    expect(json.status).toBe("ESCROW_LOCKED");
    expect(json.agentSlug).toBe("sec-10k-financial-analyst");
    expect(json.budgetCents).toBe(350);
    expect(json.budgetPaise).toBe(28000);
    expect(json.streamUrl).toBe(`/api/jobs/${json.jobId}/stream`);
  });

  it("returns 404 if agent slug is not found in catalog", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentSlug: "non-existent-agent",
        input: {},
      }),
    });

    const res = await createJobRoute(req);
    expect(res.status).toBe(404);
  });

  it("lists recent jobs via GET /api/jobs", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs", { method: "GET" });
    const res = await getJobsRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.jobs)).toBe(true);
    expect(json.jobs.length).toBeGreaterThanOrEqual(1);
  });

  it("streams Server-Sent Events via GET /api/jobs/[id]/stream", async () => {
    // 1. Create a job first
    const createReq = new NextRequest("http://localhost:3000/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentSlug: "invoice-ledger-reconciler",
        input: { invoiceId: "INV-100" },
      }),
    });
    const createRes = await createJobRoute(createReq);
    const { jobId } = await createRes.json();

    // 2. Connect to SSE stream
    const streamReq = new NextRequest(`http://localhost:3000/api/jobs/${jobId}/stream`, { method: "GET" });
    const streamRes = await streamJobRoute(streamReq, {
      params: Promise.resolve({ id: jobId }),
    });

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get("Content-Type")).toContain("text/event-stream");

    // Read initial chunks from stream
    const reader = streamRes.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain("event: job:submitted");
      expect(text).toContain("SUBMITTED");
      await reader.cancel();
    }
  });

  it("verifies valid and tampered receipts via POST /api/verify", async () => {
    const validReceipt = generateEvidenceReceipt({
      jobId: "job-verify-api-01",
      agentSlug: "credit-risk-evaluator",
      input: { annualRevenue: 5000000 },
      systemPrompt: "Evaluate credit",
      executionLogs: [{ timestamp: "2026-10-30T10:00:00Z", step: "ASSESS", message: "Underwriting complete" }],
      deliverable: { summaryMarkdown: "Prime credit", structuredJson: { prime: true } },
    });

    // 1. Valid Receipt Verification
    const validReq = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validReceipt),
    });

    const validRes = await verifyPostRoute(validReq);
    const validJson = await validRes.json();
    expect(validJson.valid).toBe(true);
    expect(validJson.calculatedHash).toBe(validReceipt.integrityHash);

    // 2. Tampered Receipt Verification
    const tamperedReq = new NextRequest("http://localhost:3000/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validReceipt,
        integrityHash: "0000000000000000000000000000000000000000000000000000000000000000",
      }),
    });

    const tamperedRes = await verifyPostRoute(tamperedReq);
    const tamperedJson = await tamperedRes.json();
    expect(tamperedJson.valid).toBe(false);
    expect(tamperedJson.error).toContain("Cryptographic verification failure");
  });
});
