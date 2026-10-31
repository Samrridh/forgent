import { describe, it, expect } from "vitest";
import { getAgentPortfolioData } from "@/lib/agent-portfolio";
import { getSampleInputForAgent, CATEGORY_SAMPLE_INPUTS } from "@/lib/sample-inputs";
import { GET as getJobRoute } from "@/app/api/jobs/[id]/route";
import { GET as verifyGetRoute, POST as verifyPostRoute } from "@/app/api/verify/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

describe("Agent Portfolio & Hiring Lifecycle Suite", () => {
  it("retrieves comprehensive agent portfolio data for showcase agent", () => {
    const portfolio = getAgentPortfolioData("sec-10k-financial-analyst");
    expect(portfolio).toBeDefined();
    expect(portfolio?.title).toContain("SEC 10-K");
    expect(portfolio?.category).toBe("Finance");

    // Pricing & Escrow split
    expect(portfolio?.priceUsd).toBe(3.5);
    expect(portfolio?.creatorPayoutUsd).toBe(2.98); // 85%
    expect(portfolio?.platformFeeUsd).toBe(0.52); // 15%
    expect(portfolio?.pricePaise).toBe(28000);

    // Schemas
    expect(portfolio?.inputSchema).toBeDefined();
    expect(portfolio?.outputSchema).toBeDefined();

    // Proof-of-work
    expect(portfolio?.benchmarkScore).toBeGreaterThanOrEqual(95);
    expect(portfolio?.benchmarkTestSuites.length).toBeGreaterThanOrEqual(2);
    expect(portfolio?.recentExecutions.length).toBeGreaterThanOrEqual(1);
    expect(portfolio?.recentExecutions[0].integrityHash).toBeDefined();

    // Reviews & Verified Hire badges
    expect(portfolio?.rating).toBeGreaterThanOrEqual(4.5);
    expect(portfolio?.reviews.length).toBeGreaterThanOrEqual(3);
    expect(portfolio?.reviews.every((r) => r.verifiedHire)).toBe(true);
  });

  it("retrieves agent portfolio data for generated dataset slug", () => {
    const portfolio = getAgentPortfolioData("agent-001");
    expect(portfolio).toBeDefined();
    expect(portfolio?.title).toBeDefined();
    expect(portfolio?.creatorPayoutUsd).toBeDefined();
    expect(portfolio?.platformFeeUsd).toBeDefined();
    expect(portfolio?.recentExecutions.length).toBeGreaterThan(0);
  });

  it("returns undefined for unknown agent slug", () => {
    const portfolio = getAgentPortfolioData("unknown-nonexistent-agent-slug");
    expect(portfolio).toBeUndefined();
  });

  it("generates realistic domain sample inputs for job wizard", () => {
    const portfolio = getAgentPortfolioData("sec-10k-financial-analyst")!;
    const sample = getSampleInputForAgent(portfolio);
    expect(sample).toBeDefined();
    expect(sample.ticker).toBe("NVDA");
    expect(sample.fiscalYear).toBe(2024);

    // Test category sample inputs
    expect(CATEGORY_SAMPLE_INPUTS.Legal).toBeDefined();
    expect(CATEGORY_SAMPLE_INPUTS.Legal.contractType).toBe("MUTUAL_NDA");
    expect(CATEGORY_SAMPLE_INPUTS.DevOps).toBeDefined();
    expect(CATEGORY_SAMPLE_INPUTS.DevOps.reason).toBe("OOMKilled");
  });

  it("fetches single job details via GET /api/jobs/[id]", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/job_sec10k_nvda_2024");
    const res = await getJobRoute(req, {
      params: Promise.resolve({ id: "job_sec10k_nvda_2024" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.jobId).toBe("job_sec10k_nvda_2024");
    expect(json.status).toBe("COMPLETED");
    expect(json.deliverable).toBeDefined();
    expect(json.receipt).toBeDefined();
  });

  it("verifies pre-seeded proof receipt by SHA-256 hash via GET /api/verify?hash=...", async () => {
    const knownHash = "65f35fd2e5a1ee98544b77368891b442b688ef47e423ed4a6802c845209e540f";
    const req = new NextRequest(`http://localhost:3000/api/verify?hash=${knownHash}`);
    const res = await verifyGetRoute(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.valid).toBe(true);
    expect(json.calculatedHash).toBe(knownHash);
    expect(json.receipt).toBeDefined();
    expect(json.agentSlug).toBe("sec-10k-financial-analyst");
  });

  it("enforces strict zero-emoji policy across all new UI components", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const filesToCheck = [
      "src/app/agents/[slug]/page.tsx",
      "src/components/agent/agent-hero.tsx",
      "src/components/agent/agent-overview-tab.tsx",
      "src/components/agent/agent-proof-tab.tsx",
      "src/components/agent/agent-reviews-tab.tsx",
      "src/components/agent/agent-hire-card.tsx",
      "src/app/jobs/new/page.tsx",
      "src/components/jobs/dynamic-schema-form.tsx",
      "src/components/jobs/escrow-breakdown-card.tsx",
      "src/app/jobs/[id]/page.tsx",
      "src/components/jobs/job-status-stepper.tsx",
      "src/components/jobs/job-logs-terminal.tsx",
      "src/components/jobs/deliverable-viewer.tsx",
      "src/components/jobs/watchdog-banner.tsx",
      "src/components/jobs/post-job-review-card.tsx",
      "src/app/verify/page.tsx",
      "src/components/verify/verification-badge.tsx",
      "src/components/verify/audit-trail-card.tsx",
      "src/lib/agent-portfolio.ts",
      "src/lib/sample-inputs.ts",
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasEmoji = emojiRegex.test(content);
      expect(hasEmoji, `File ${relPath} contains prohibited emojis`).toBe(false);
    }
  });

  it("enforces strict line count limit under 1,000 lines across all project files", () => {
    const filesToCheck = [
      "src/app/agents/[slug]/page.tsx",
      "src/components/agent/agent-hero.tsx",
      "src/components/agent/agent-overview-tab.tsx",
      "src/components/agent/agent-proof-tab.tsx",
      "src/components/agent/agent-reviews-tab.tsx",
      "src/components/agent/agent-hire-card.tsx",
      "src/app/jobs/new/page.tsx",
      "src/components/jobs/dynamic-schema-form.tsx",
      "src/components/jobs/escrow-breakdown-card.tsx",
      "src/app/jobs/[id]/page.tsx",
      "src/components/jobs/job-status-stepper.tsx",
      "src/components/jobs/job-logs-terminal.tsx",
      "src/components/jobs/deliverable-viewer.tsx",
      "src/components/jobs/watchdog-banner.tsx",
      "src/components/jobs/post-job-review-card.tsx",
      "src/app/verify/page.tsx",
      "src/components/verify/verification-badge.tsx",
      "src/components/verify/audit-trail-card.tsx",
      "src/lib/agent-portfolio.ts",
      "src/lib/sample-inputs.ts",
      "src/server/engine/job-store.ts",
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      const lineCount = content.split("\n").length;
      expect(lineCount, `File ${relPath} exceeds 1,000 lines (current: ${lineCount})`).toBeLessThan(1000);
    }
  });
});
