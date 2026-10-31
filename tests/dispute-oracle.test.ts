import { describe, it, expect, beforeEach } from "vitest";
import {
  fileDispute,
  arbitrateDispute,
  getDispute,
  listDisputes,
  disputeStore,
} from "@/server/arbitration/oracle-arbiter";
import {
  lockEscrow,
  resolveDispute,
  escrowHoldStore,
  settlementRecordStore,
  getEscrowHold,
} from "@/server/economics/escrow";
import { jobStore, JobRecord } from "@/server/engine/job-store";
import { GET as getDisputes, POST as postDispute } from "@/app/api/disputes/route";
import { POST as arbitrateRoute } from "@/app/api/disputes/[id]/arbitrate/route";
import { GET as getSingleDispute } from "@/app/api/disputes/[id]/route";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { canonicalStringify } from "@/server/engine/receipt";

describe("Autonomous AI Dispute Arbitration & Cryptographic Escrow Resolution", () => {
  beforeEach(() => {
    disputeStore.clear();
    escrowHoldStore.clear();
    settlementRecordStore.clear();
  });

  describe("Dispute Filing & Evidence Assembly", () => {
    it("files a dispute for an existing job and sets status to PENDING_ARBITRATION", async () => {
      const jobId = "job_sec10k_nvda_2024";
      const dispute = await fileDispute({
        jobId,
        category: "SCHEMA_FAILURE",
        title: "Missing XBRL GAAP reconciliation tag in structured JSON",
        description:
          "The extraction deliverable omitted tag gaapAdherenceRatio from required schema definitions.",
        complainantId: "usr_enterprise_auditor",
      });

      expect(dispute.id).toMatch(/^disp_job_sec10k_nvda_2024_\d+/);
      expect(dispute.jobId).toBe(jobId);
      expect(dispute.agentSlug).toBe("sec-10k-financial-analyst");
      expect(dispute.category).toBe("SCHEMA_FAILURE");
      expect(dispute.status).toBe("PENDING_ARBITRATION");
      expect(dispute.claimAmountPaise).toBe(28000);
      expect(dispute.claimAmountCents).toBe(350);
      expect(dispute.evidence.hashIntegrityMatched).toBe(true);

      const retrieved = getDispute(dispute.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(dispute.id);
    });

    it("evaluates cryptographic hash integrity on contested deliverable", async () => {
      const jobId = "job_custom_tamper_test";
      const fakeDeliverable = { status: "COMPLETED", report: "Authentic report" };
      const authenticHash = crypto
        .createHash("sha256")
        .update(canonicalStringify(fakeDeliverable), "utf8")
        .digest("hex");

      const jobRecord: JobRecord = {
        id: jobId,
        jobId,
        agentSlug: "custom-agent",
        title: "Custom Agent Job",
        status: "COMPLETED",
        input: { query: "audit" },
        budgetCents: 500,
        budgetPaise: 40000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        events: [],
        deliverable: {
          summaryMarkdown: "Summary",
          structuredJson: fakeDeliverable,
          sha256Receipt: authenticHash,
          modelUsed: "gemini-1.5-flash",
          tokensUsed: 100,
          latencyMs: 500,
        },
      };
      jobStore.set(jobId, jobRecord);

      // File dispute with deliberately altered hash
      const tamperedDispute = await fileDispute({
        jobId,
        category: "CORRUPTED_DELIVERABLE",
        title: "Hash checksum mismatch on downloaded deliverable",
        description: "The downloaded JSON deliverable fails SHA-256 digest validation.",
        claimedDeliverableHash: "deadbeef00000000000000000000000000000000000000000000000000000000",
      });

      expect(tamperedDispute.evidence.hashIntegrityMatched).toBe(false);
    });
  });

  describe("Deterministic Oracle Arbitration Engine", () => {
    it("arbitrates SCHEMA_FAILURE by ruling REFUND_BUYER with 100% refund", async () => {
      const jobId = "job_schema_dispute_01";
      await lockEscrow({
        jobId,
        buyerId: "usr_buyer_alice",
        amountPaise: 40000,
        amountCents: 500,
      });

      const dispute = await fileDispute({
        jobId,
        category: "SCHEMA_FAILURE",
        title: "Payload schema validation failed",
        description: "Expected numeric float but string received in field interestRate.",
      });

      const { dispute: resolved, resolution } = await arbitrateDispute(dispute.id);

      expect(resolved.status).toBe("RESOLVED");
      expect(resolution.verdict).toBe("REFUND_BUYER");
      expect(resolution.refundPercentage).toBe(100);
      expect(resolution.buyerRefundPaise).toBe(40000);
      expect(resolution.buyerRefundCents).toBe(500);
      expect(resolution.creatorPayoutPaise).toBe(0);
      expect(resolution.platformFeePaise).toBe(0);
      expect(resolution.integrityDigest).toHaveLength(64);
      expect(resolution.receiptId).toMatch(/^rcpt_disp_/);

      const hold = getEscrowHold(jobId);
      expect(hold?.status).toBe("REFUNDED");
    });

    it("arbitrates INVENTORY_DISCREPANCY by ruling PARTIAL_SETTLEMENT with 50/50 split", async () => {
      const jobId = "job_inv_dispute_02";
      await lockEscrow({
        jobId,
        buyerId: "usr_buyer_logistics",
        builderId: "bld_warehouse_agent",
        amountPaise: 60000,
        amountCents: 750,
      });

      const dispute = await fileDispute({
        jobId,
        category: "INVENTORY_DISCREPANCY",
        title: "Receiving scan shortfall of 4 units",
        description: "Receiving report shows 14 units received against PO total of 18 units.",
      });

      const { dispute: resolved, resolution } = await arbitrateDispute(dispute.id);

      expect(resolved.status).toBe("RESOLVED");
      expect(resolution.verdict).toBe("PARTIAL_SETTLEMENT");
      expect(resolution.refundPercentage).toBe(50);

      // 50% refund to buyer: 30,000 paise
      expect(resolution.buyerRefundPaise).toBe(30000);
      expect(resolution.buyerRefundCents).toBe(375);

      // Remaining 30,000 paise split: 85% creator (25,500 paise), 15% platform (4,500 paise)
      expect(resolution.creatorPayoutPaise).toBe(25500);
      expect(resolution.platformFeePaise).toBe(4500);

      // Exact zero-leakage invariant
      expect(
        resolution.buyerRefundPaise + resolution.creatorPayoutPaise + resolution.platformFeePaise
      ).toBe(60000);

      const hold = getEscrowHold(jobId);
      expect(hold?.status).toBe("SETTLED");
    });

    it("arbitrates tampered deliverable digest by ruling REFUND_BUYER", async () => {
      const jobId = "job_tamper_adjudicate";
      await lockEscrow({
        jobId,
        amountPaise: 50000,
        amountCents: 625,
      });

      const dispute = await fileDispute({
        jobId,
        category: "CORRUPTED_DELIVERABLE",
        title: "Corrupted deliverable payload",
        description: "Payload digest does not match declared execution hash.",
        claimedDeliverableHash: "corrupt_hash_000000000000000000000000000000000000000000000000000000",
      });

      // Force mismatch in evidence
      dispute.evidence.hashIntegrityMatched = false;
      disputeStore.set(dispute.id, dispute);

      const { resolution } = await arbitrateDispute(dispute.id);
      expect(resolution.verdict).toBe("REFUND_BUYER");
      expect(resolution.refundPercentage).toBe(100);
      expect(resolution.reasoning).toContain("SHA-256 integrity digest failed verification");
    });

    it("arbitrates compliant deliverable by ruling RELEASE_CREATOR", async () => {
      const jobId = "job_compliant_dispute";
      await lockEscrow({
        jobId,
        amountPaise: 20000,
        amountCents: 250,
      });

      const dispute = await fileDispute({
        jobId,
        category: "OTHER",
        title: "Query regarding formatting style",
        description: "Deliverable satisfies all criteria but client requested different formatting.",
      });

      const { resolution } = await arbitrateDispute(dispute.id);
      expect(resolution.verdict).toBe("RELEASE_CREATOR");
      expect(resolution.refundPercentage).toBe(0);
      expect(resolution.creatorPayoutPaise).toBe(17000); // 85% of 20,000
      expect(resolution.platformFeePaise).toBe(3000); // 15% of 20,000
      expect(resolution.buyerRefundPaise).toBe(0);
    });
  });

  describe("Escrow Settlement Engine & Invariant Guarantees", () => {
    it("guarantees zero penny and paise leaks across odd and prime escrow balances", async () => {
      const testCases = [
        { totalPaise: 28001, totalCents: 351, refundPct: 50 },
        { totalPaise: 9999, totalCents: 125, refundPct: 33 },
        { totalPaise: 101, totalCents: 1, refundPct: 25 },
        { totalPaise: 1, totalCents: 1, refundPct: 50 },
        { totalPaise: 77777, totalCents: 972, refundPct: 70 },
      ];

      for (const tc of testCases) {
        const jobId = `job_prime_${tc.totalPaise}`;
        await lockEscrow({
          jobId,
          amountPaise: tc.totalPaise,
          amountCents: tc.totalCents,
        });

        const res = await resolveDispute(jobId, "PARTIAL_SETTLEMENT", tc.refundPct);

        expect(res.buyerRefundPaise + res.creatorPayoutPaise + res.platformFeePaise).toBe(
          tc.totalPaise
        );
        expect(res.buyerRefundCents + res.creatorPayoutCents + res.platformFeeCents).toBe(
          tc.totalCents
        );
      }
    });
  });

  describe("Disputes REST API Routes", () => {
    it("lists disputes on GET /api/disputes with status filtering", async () => {
      await fileDispute({
        jobId: "job_api_01",
        category: "SCHEMA_FAILURE",
        title: "Test Dispute 1",
        description: "Schema validation failure in line 42.",
      });

      const req = new NextRequest("http://localhost:3000/api/disputes?status=PENDING_ARBITRATION");
      const res = await getDisputes(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.disputes).toBeInstanceOf(Array);
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.pendingCount).toBeGreaterThanOrEqual(1);
    });

    it("creates a dispute on POST /api/disputes and validates schema", async () => {
      // 1. Invalid payload: missing required title
      const badReq = new NextRequest("http://localhost:3000/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: "job_test_invalid" }),
      });
      const badRes = await postDispute(badReq);
      expect(badRes.status).toBe(400);

      // 2. Valid payload
      const validReq = new NextRequest("http://localhost:3000/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "job_api_valid_post",
          category: "INVENTORY_DISCREPANCY",
          title: "Physical count shortfall of 8 units",
          description: "Physical reconciliation scan indicates a warehouse deficit of 8 units.",
        }),
      });
      const validRes = await postDispute(validReq);
      expect(validRes.status).toBe(201);
      const data = await validRes.json();
      expect(data.success).toBe(true);
      expect(data.dispute.category).toBe("INVENTORY_DISCREPANCY");
      expect(data.dispute.status).toBe("PENDING_ARBITRATION");
    });

    it("executes arbitration on POST /api/disputes/[id]/arbitrate", async () => {
      const created = await fileDispute({
        jobId: "job_route_arbitrate",
        category: "SCHEMA_FAILURE",
        title: "Format error in JSON result",
        description: "Required field companyName was null in deliverable output.",
      });

      const req = new NextRequest(
        `http://localhost:3000/api/disputes/${created.id}/arbitrate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluationPrompt: "Strict adherence to GAAP standards" }),
        }
      );

      const res = await arbitrateRoute(req, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.dispute.status).toBe("RESOLVED");
      expect(data.resolution.verdict).toBe("REFUND_BUYER");
      expect(data.resolution.integrityDigest).toBeDefined();
    });

    it("returns 404 on arbitrate route for nonexistent dispute ID", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/disputes/disp_nonexistent/arbitrate",
        { method: "POST" }
      );
      const res = await arbitrateRoute(req, {
        params: Promise.resolve({ id: "disp_nonexistent" }),
      });
      expect(res.status).toBe(404);
    });

    it("retrieves a single dispute on GET /api/disputes/[id]", async () => {
      const created = await fileDispute({
        jobId: "job_get_single",
        category: "LATENCY_SLA_BREACH",
        title: "Watchdog timer exceeded",
        description: "Job execution latency exceeded 60 seconds without receipt.",
      });

      const req = new NextRequest(`http://localhost:3000/api/disputes/${created.id}`);
      const res = await getSingleDispute(req, {
        params: Promise.resolve({ id: created.id }),
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.dispute.id).toBe(created.id);
      expect(data.dispute.category).toBe("LATENCY_SLA_BREACH");
    });
  });

  describe("Cryptographic Resolution Receipt Integrity", () => {
    it("generates deterministic SHA-256 digest matching canonical JSON payload", async () => {
      const jobId = "job_crypto_receipt_test";
      const dispute = await fileDispute({
        jobId,
        category: "SCHEMA_FAILURE",
        title: "Cryptographic receipt verification",
        description: "Verifying exact SHA-256 digest reproducibility.",
      });

      const { resolution } = await arbitrateDispute(dispute.id);

      const verificationPayload = {
        disputeId: dispute.id,
        jobId: dispute.jobId,
        verdict: resolution.verdict,
        refundPercentage: resolution.refundPercentage,
        buyerRefundPaise: resolution.buyerRefundPaise,
        creatorPayoutPaise: resolution.creatorPayoutPaise,
        platformFeePaise: resolution.platformFeePaise,
        reasoning: resolution.reasoning,
        arbitratedAt: resolution.arbitratedAt,
      };

      const expectedDigest = crypto
        .createHash("sha256")
        .update(canonicalStringify(verificationPayload), "utf8")
        .digest("hex");

      expect(resolution.integrityDigest).toBe(expectedDigest);
      expect(resolution.receiptId).toBe(`rcpt_disp_${expectedDigest.slice(0, 16)}`);
    });
  });
});
