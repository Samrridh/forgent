import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  getAllRankedAgents,
  getLeaderboardSummary,
  queryLeaderboard,
  getAgentLeaderboardBySlug,
  verifyAgentBenchmarkReceipt,
} from "@/server/analytics/leaderboard-engine";
import {
  getCreatorAnalyticsTelemetry,
} from "@/server/analytics/creator-analytics-engine";
import { GET as getLeaderboardRoute } from "@/app/api/leaderboard/route";
import { GET as getCreatorAnalyticsRoute } from "@/app/api/creator/analytics/route";

describe("Benchmark Leaderboard Engine (500 Catalog Agents)", () => {
  it("evaluates and ranks all 500 catalog agents with unique ranks #1 to #500", () => {
    const agents = getAllRankedAgents();
    expect(agents.length).toBe(500);

    const ranks = agents.map((a) => a.rank);
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(500);
    expect(Math.min(...ranks)).toBe(1);
    expect(Math.max(...ranks)).toBe(500);

    // Verify sorted order by composite score
    for (let i = 0; i < agents.length - 1; i++) {
      expect(agents[i].compositeScore).toBeGreaterThanOrEqual(
        agents[i + 1].compositeScore
      );
    }
  });

  it("computes deterministic Trust Index (0-100) and qualification pass rates", () => {
    const agents = getAllRankedAgents();
    for (const agent of agents) {
      expect(agent.trustIndex).toBeGreaterThanOrEqual(85.0);
      expect(agent.trustIndex).toBeLessThanOrEqual(100.0);
      expect(agent.qualificationPassRate).toBeGreaterThanOrEqual(90.0);
      expect(agent.qualificationPassRate).toBeLessThanOrEqual(100.0);
    }
  });

  it("benchmarks SLA response latency (p50 and p95 ms) with SLA tier classifications", () => {
    const agents = getAllRankedAgents();
    for (const agent of agents) {
      expect(agent.p50LatencyMs).toBeGreaterThan(0);
      expect(agent.p95LatencyMs).toBeGreaterThan(agent.p50LatencyMs);
      expect(["SUB_300MS", "ENTERPRISE_LOW", "STANDARD"]).toContain(
        agent.slaTier
      );
      expect(agent.slaComplianceRate).toBeGreaterThanOrEqual(99.0);
    }
  });

  it("evaluates adversarial resilience rating for prompt injection defense", () => {
    const agents = getAllRankedAgents();
    for (const agent of agents) {
      expect(agent.adversarialResilience).toBeGreaterThanOrEqual(90.0);
      expect(agent.adversarialResilience).toBeLessThanOrEqual(100.0);
    }
  });

  it("computes dual-currency volume and exact 85% creator cut vs 15% platform fee", () => {
    const agents = getAllRankedAgents();
    for (const agent of agents) {
      expect(agent.grossVolumeUsd).toBeGreaterThan(0);
      expect(agent.grossVolumeInr).toBeGreaterThan(0);

      // Verify 85% net earnings + 15% platform fee matches gross within rounding
      const sumUsd = Number(
        (agent.creatorEarningsUsd + agent.platformFeeUsd).toFixed(2)
      );
      expect(Math.abs(sumUsd - agent.grossVolumeUsd)).toBeLessThanOrEqual(0.02);

      const sumInr = Number(
        (agent.creatorEarningsInr + agent.platformFeeInr).toFixed(2)
      );
      expect(Math.abs(sumInr - agent.grossVolumeInr)).toBeLessThanOrEqual(1.0);

      // Confirm exchange rate consistency (1 USD ~ 80 INR)
      expect(agent.priceInr).toBe(Math.round(agent.priceUsd * 80));
    }
  });

  it("cryptographically verifies SHA-256 benchmark evidence receipts", () => {
    const agents = getAllRankedAgents();
    const sampleAgent = agents[0];

    const verification = verifyAgentBenchmarkReceipt(sampleAgent.slug);
    expect(verification.valid).toBe(true);
    expect(verification.receiptHash).toBe(sampleAgent.receiptHash);
    expect(verification.receiptHash.length).toBe(64); // SHA-256 hex string
    expect(verification.calculatedHash).toBe(verification.receiptHash);

    // Non-existent slug returns valid: false
    const invalidVerif = verifyAgentBenchmarkReceipt("non-existent-agent-slug");
    expect(invalidVerif.valid).toBe(false);
  });

  it("filters agents accurately by domain across all catalog categories", () => {
    const summary = getLeaderboardSummary();
    expect(summary.domains.length).toBeGreaterThanOrEqual(12);

    for (const domain of summary.domains) {
      const response = queryLeaderboard({ domain, limit: 100 });
      expect(response.items.length).toBeGreaterThan(0);
      for (const item of response.items) {
        expect(item.category.toLowerCase()).toBe(domain.toLowerCase());
      }
    }
  });

  it("supports full-text search across title, description, and author", () => {
    const response = queryLeaderboard({ search: "invoice", limit: 25 });
    expect(response.items.length).toBeGreaterThan(0);
    for (const item of response.items) {
      const matched =
        item.name.toLowerCase().includes("invoice") ||
        item.description.toLowerCase().includes("invoice") ||
        item.authorName.toLowerCase().includes("invoice") ||
        item.category.toLowerCase().includes("invoice") ||
        item.slug.toLowerCase().includes("invoice");
      expect(matched).toBe(true);
    }
  });

  it("sorts rankings correctly by trust index, SLA latency, resilience, and earnings", () => {
    // Sort by Trust Index descending
    const trustSorted = queryLeaderboard({
      sortBy: "trust",
      order: "desc",
      limit: 20,
    });
    for (let i = 0; i < trustSorted.items.length - 1; i++) {
      expect(trustSorted.items[i].trustIndex).toBeGreaterThanOrEqual(
        trustSorted.items[i + 1].trustIndex
      );
    }

    // Sort by SLA Latency ascending (fastest first)
    const latencySorted = queryLeaderboard({
      sortBy: "latency",
      order: "asc",
      limit: 20,
    });
    for (let i = 0; i < latencySorted.items.length - 1; i++) {
      expect(latencySorted.items[i].p95LatencyMs).toBeLessThanOrEqual(
        latencySorted.items[i + 1].p95LatencyMs
      );
    }

    // Sort by Earnings descending
    const earningsSorted = queryLeaderboard({
      sortBy: "earnings",
      order: "desc",
      limit: 20,
    });
    for (let i = 0; i < earningsSorted.items.length - 1; i++) {
      expect(earningsSorted.items[i].creatorEarningsUsd).toBeGreaterThanOrEqual(
        earningsSorted.items[i + 1].creatorEarningsUsd
      );
    }
  });

  it("computes accurate network summary telemetry across all 500 agents", () => {
    const summary = getLeaderboardSummary();
    expect(summary.totalAgents).toBe(500);
    expect(summary.totalVolumeUsd).toBeGreaterThan(100000);
    expect(summary.totalCreatorEarningsUsd).toBeGreaterThan(80000);
    expect(summary.totalPlatformFeeUsd).toBeGreaterThan(15000);
    expect(summary.avgTrustIndex).toBeGreaterThanOrEqual(95.0);
    expect(summary.avgP95LatencyMs).toBeGreaterThan(0);
  });
});

describe("Creator Revenue Analytics Telemetry Engine", () => {
  it("returns creator financial telemetry: gross GMV, 85% net earnings, 15% platform fee", () => {
    const telemetry = getCreatorAnalyticsTelemetry({ timeframe: "30d" });

    expect(telemetry.summary.grossGmvUsd).toBeGreaterThan(0);
    expect(telemetry.summary.grossGmvInr).toBeGreaterThan(0);
    expect(telemetry.summary.netEarningsUsd).toBeGreaterThan(0);
    expect(telemetry.summary.platformFeeUsd).toBeGreaterThan(0);

    // Mathematical precision: Net (85%) + Fee (15%) = Gross GMV
    const sumUsd = Number(
      (telemetry.summary.netEarningsUsd + telemetry.summary.platformFeeUsd).toFixed(2)
    );
    expect(Math.abs(sumUsd - telemetry.summary.grossGmvUsd)).toBeLessThanOrEqual(0.05);

    expect(telemetry.summary.availablePayoutUsd).toBe(4250.0);
    expect(telemetry.summary.pendingEscrowUsd).toBe(850.0);
  });

  it("provides 30-day earnings velocity telemetry points with positive trajectory", () => {
    const telemetry = getCreatorAnalyticsTelemetry({ timeframe: "30d" });
    expect(telemetry.velocity.points.length).toBe(30);

    for (const point of telemetry.velocity.points) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(point.tasksCompleted).toBeGreaterThan(0);
      expect(point.grossGmvUsd).toBeGreaterThan(0);
      expect(point.netEarningsUsd).toBeGreaterThan(0);
      expect(point.tokenCostUsd).toBeGreaterThan(0);
    }

    expect(telemetry.velocity.velocity7dGrowthPercent).toBeGreaterThan(0);
    expect(telemetry.velocity.velocityAverageDailyGrossUsd).toBeGreaterThan(0);
  });

  it("computes token margin efficiency, caching hit rates, and compute costs", () => {
    const telemetry = getCreatorAnalyticsTelemetry();
    expect(telemetry.tokenMargins.totalTokensProcessed).toBeGreaterThan(1000000);
    expect(telemetry.tokenMargins.blendedCostPer1kTokensUsd).toBe(0.0018);
    expect(telemetry.tokenMargins.grossMarginPercent).toBeGreaterThan(90.0);
    expect(telemetry.tokenMargins.promptCachingHitRatePercent).toBeGreaterThan(40.0);
    expect(
      telemetry.tokenMargins.llmAssistedRatioPercent +
        telemetry.tokenMargins.deterministicRatioPercent
    ).toBe(100);
  });

  it("audits payout ledger rails history with SHA-256 settlement evidence receipts", () => {
    const telemetry = getCreatorAnalyticsTelemetry();
    expect(telemetry.payouts.settledHistory.length).toBeGreaterThan(0);
    expect(telemetry.payouts.activeRequests.length).toBeGreaterThan(0);

    for (const payout of [
      ...telemetry.payouts.activeRequests,
      ...telemetry.payouts.settledHistory,
    ]) {
      expect(["UPI", "BANK_TRANSFER", "STRIPE"]).toContain(payout.method);
      expect(payout.destinationAccount.length).toBeGreaterThan(3);
      expect(payout.transactionHash.length).toBeGreaterThan(10);
      expect(payout.settlementReceiptHash.length).toBe(64);
      expect(payout.amountUsd).toBeGreaterThan(0);
      expect(payout.amountInr).toBe(Math.round(payout.amountUsd * 80));
    }
  });

  it("ranks top-earning agents with individual margins and execution volume", () => {
    const telemetry = getCreatorAnalyticsTelemetry();
    expect(telemetry.topAgents.length).toBeGreaterThan(0);

    for (const agent of telemetry.topAgents) {
      expect(agent.taskVolume30d).toBeGreaterThan(0);
      expect(agent.grossGmvUsd).toBeGreaterThan(0);
      expect(agent.netEarningsUsd).toBe(
        Number((agent.grossGmvUsd * 0.85).toFixed(2))
      );
      expect(agent.marginPercent).toBeGreaterThan(80.0);
      expect(agent.successRate).toBeGreaterThanOrEqual(98.0);
    }
  });
});

describe("Analytics API Route Endpoints", () => {
  it("GET /api/leaderboard returns paginated, sorted agent rankings with meta", async () => {
    const req = new NextRequest("http://localhost:3000/api/leaderboard?limit=10&page=1");
    const res = await getLeaderboardRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.items.length).toBe(10);
    expect(data.pagination.total).toBe(500);
    expect(data.pagination.totalPages).toBe(50);
    expect(data.pagination.page).toBe(1);
    expect(data.summary.totalAgents).toBe(500);
    expect(data.meta.sha256VerificationStandard).toBe(
      "NIST-FIPS-180-4-CANONICAL-V2"
    );
  });

  it("GET /api/leaderboard filters by domain and verifies receipt proof", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/leaderboard?domain=DevOps&limit=5"
    );
    const res = await getLeaderboardRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    for (const item of data.items) {
      expect(item.category).toBe("DevOps");
    }

    // Single agent lookup with cryptographic receipt verification
    const firstSlug = data.items[0].slug;
    const verifyReq = new NextRequest(
      `http://localhost:3000/api/leaderboard?slug=${firstSlug}&verifyReceipt=true`
    );
    const verifyRes = await getLeaderboardRoute(verifyReq);
    expect(verifyRes.status).toBe(200);

    const verifyData = await verifyRes.json();
    expect(verifyData.valid).toBe(true);
    expect(verifyData.slug).toBe(firstSlug);
    expect(verifyData.receiptHash.length).toBe(64);
  });

  it("GET /api/leaderboard returns 400 for invalid query parameters", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/leaderboard?sortBy=unsupported_metric"
    );
    const res = await getLeaderboardRoute(req);
    expect(res.status).toBe(400);
  });

  it("GET /api/creator/analytics returns financial telemetry and rails ledger", async () => {
    const req = new NextRequest("http://localhost:3000/api/creator/analytics?timeframe=30d");
    const res = await getCreatorAnalyticsRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary.grossGmvUsd).toBeGreaterThan(0);
    expect(data.summary.netEarningsUsd).toBeGreaterThan(0);
    expect(data.summary.platformFeeUsd).toBeGreaterThan(0);
    expect(data.velocity.points.length).toBe(30);
    expect(data.tokenMargins.grossMarginPercent).toBeGreaterThan(90);
    expect(data.payouts.activeRequests.length).toBeGreaterThan(0);
    expect(data.payouts.settledHistory.length).toBeGreaterThan(0);
    expect(data.topAgents.length).toBeGreaterThan(0);
  });

  it("GET /api/creator/analytics returns 400 for invalid timeframe parameter", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/creator/analytics?timeframe=invalid_tf"
    );
    const res = await getCreatorAnalyticsRoute(req);
    expect(res.status).toBe(400);
  });
});
