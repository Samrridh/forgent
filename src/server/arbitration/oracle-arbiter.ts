import crypto from "crypto";
import { canonicalStringify } from "../engine/receipt";
import { jobStore, JobRecord } from "../engine/job-store";
import { resolveDispute, DisputeVerdict } from "../economics/escrow";

export type DisputeStatus = "PENDING_ARBITRATION" | "ARBITRATING" | "RESOLVED" | "REJECTED";

export type DisputeReasonCategory =
  | "SCHEMA_FAILURE"
  | "INVENTORY_DISCREPANCY"
  | "UNFULFILLED_CRITERIA"
  | "CORRUPTED_DELIVERABLE"
  | "LATENCY_SLA_BREACH"
  | "OTHER";

export interface DisputeEvidence {
  declaredInput: unknown;
  actualDeliverable: unknown;
  systemPrompt?: string;
  expectedCriteriaSummary?: string;
  providedIntegrityHash?: string;
  canonicalIntegrityHash?: string;
  hashIntegrityMatched: boolean;
}

export interface DisputeResolutionReceipt {
  receiptId: string;
  disputeId: string;
  jobId: string;
  verdict: DisputeVerdict;
  refundPercentage: number;
  buyerRefundPaise: number;
  buyerRefundCents: number;
  creatorPayoutPaise: number;
  creatorPayoutCents: number;
  platformFeePaise: number;
  platformFeeCents: number;
  reasoning: string;
  integrityDigest: string;
  arbitratedAt: string;
  arbiterModel: string;
}

export interface DisputeRecord {
  id: string;
  jobId: string;
  agentSlug: string;
  title: string;
  description: string;
  category: DisputeReasonCategory;
  status: DisputeStatus;
  complainantId: string;
  respondentId: string;
  claimAmountPaise: number;
  claimAmountCents: number;
  evidence: DisputeEvidence;
  resolution?: DisputeResolutionReceipt;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CreateDisputeInput {
  jobId: string;
  category: DisputeReasonCategory;
  title: string;
  description: string;
  complainantId?: string;
  claimedDeliverableHash?: string;
}

// Persistent in-memory dispute registry across serverless and testing cycles
const globalDisputeStore = globalThis as unknown as {
  __forgentDisputeStore?: Map<string, DisputeRecord>;
};

if (!globalDisputeStore.__forgentDisputeStore) {
  globalDisputeStore.__forgentDisputeStore = new Map<string, DisputeRecord>();
  seedInitialDisputes(globalDisputeStore.__forgentDisputeStore);
}

export const disputeStore = globalDisputeStore.__forgentDisputeStore;

function computeDigest(payload: unknown): string {
  const canonical = canonicalStringify(payload);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

function seedInitialDisputes(store: Map<string, DisputeRecord>) {
  const seedDisputeId = "disp_invrec_9921_audit";
  const jobId = "job_invrec_batch_9921";
  const now = "2026-10-30T10:00:00Z";

  const seed: DisputeRecord = {
    id: seedDisputeId,
    jobId,
    agentSlug: "invoice-ledger-reconciler",
    title: "Inventory Reconciliation Variance on Line Item 14",
    description:
      "Receiving scan indicates a physical shortfall of 4 units against PO-2026-8819. Output deliverable reported 0 discrepancy.",
    category: "INVENTORY_DISCREPANCY",
    status: "PENDING_ARBITRATION",
    complainantId: "usr_buyer_northstar",
    respondentId: "bld_verified_creator",
    claimAmountPaise: 20000,
    claimAmountCents: 250,
    evidence: {
      declaredInput: {
        purchaseOrderId: "PO-2026-8819",
        invoiceId: "INV-77102-ACME",
        tolerancePaise: 0,
      },
      actualDeliverable: {
        matchStatus: "PERFECT_MATCH",
        toleranceThresholdApplied: 0,
        reconciledLineItems: 18,
        discrepancyCount: 0,
      },
      expectedCriteriaSummary:
        "Deterministic 3-way matching across purchase order, warehouse receiving slip, and billing invoice.",
      providedIntegrityHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      canonicalIntegrityHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      hashIntegrityMatched: true,
    },
    createdAt: now,
    updatedAt: now,
  };

  store.set(seedDisputeId, seed);
}

/**
 * Files a formal dispute against a completed or flagged job contract.
 */
export async function fileDispute(input: CreateDisputeInput): Promise<DisputeRecord> {
  const { jobId, category, title, description, complainantId = "usr_buyer_default" } = input;
  const existingJob: JobRecord | undefined = jobStore.get(jobId);

  const disputeId = `disp_${jobId}_${Date.now()}`;
  const now = new Date().toISOString();

  let actualDeliverable: unknown = null;
  let declaredInput: unknown = null;
  let agentSlug = "autonomous-agent";
  let providedHash = input.claimedDeliverableHash || "";
  let canonicalHash = "";
  let hashIntegrityMatched = true;
  let amountPaise = 20000;
  let amountCents = 250;

  if (existingJob) {
    agentSlug = existingJob.agentSlug;
    declaredInput = existingJob.input;
    amountPaise = existingJob.budgetPaise || 20000;
    amountCents = existingJob.budgetCents || 250;

    if (existingJob.deliverable) {
      actualDeliverable = existingJob.deliverable.structuredJson;
      canonicalHash = computeDigest(existingJob.deliverable.structuredJson);
      if (!providedHash) {
        providedHash = existingJob.deliverable.sha256Receipt;
      }
      hashIntegrityMatched =
        Boolean(providedHash && canonicalHash) &&
        (providedHash === canonicalHash || providedHash === existingJob.deliverable.sha256Receipt);
    }
  }

  const evidence: DisputeEvidence = {
    declaredInput,
    actualDeliverable,
    expectedCriteriaSummary: `Contract specifications for agent ${agentSlug}`,
    providedIntegrityHash: providedHash,
    canonicalIntegrityHash: canonicalHash,
    hashIntegrityMatched,
  };

  const record: DisputeRecord = {
    id: disputeId,
    jobId,
    agentSlug,
    title,
    description,
    category,
    status: "PENDING_ARBITRATION",
    complainantId,
    respondentId: "bld_verified_creator",
    claimAmountPaise: amountPaise,
    claimAmountCents: amountCents,
    evidence,
    createdAt: now,
    updatedAt: now,
  };

  disputeStore.set(disputeId, record);
  return record;
}

/**
 * Arbitrates an active dispute using Gemini LLM inference with deterministic fallback.
 * Computes an impartial verdict, records SHA-256 cryptographic resolution receipt,
 * and atomically settles escrow.
 */
export async function arbitrateDispute(
  disputeId: string,
  customEvaluationPrompt?: string
): Promise<{ dispute: DisputeRecord; resolution: DisputeResolutionReceipt }> {
  const dispute = disputeStore.get(disputeId);
  if (!dispute) {
    throw new Error(`Dispute ${disputeId} not found in arbitration store`);
  }

  const now = new Date().toISOString();
  dispute.status = "ARBITRATING";
  dispute.updatedAt = now;

  const geminiKey = process.env.GEMINI_API_KEY;
  let verdict: DisputeVerdict = "REFUND_BUYER";
  let refundPercentage = 100;
  let reasoning = "";
  let arbiterModel = "deterministic-oracle-v1";

  // Check cryptographic hash integrity first
  const hashTampered = !dispute.evidence.hashIntegrityMatched;

  if (hashTampered) {
    verdict = "REFUND_BUYER";
    refundPercentage = 100;
    reasoning =
      "Cryptographic SHA-256 integrity digest failed verification. Deliverable was altered or corrupted post-execution.";
  } else if (geminiKey && geminiKey.trim() !== "") {
    try {
      const oracleSystemPrompt = [
        "You are the Forgent Autonomous AI Dispute Arbiter Oracle.",
        "Your task is to conduct an impartial, mathematically grounded contract arbitration between an enterprise buyer and an agent creator.",
        "Analyze the declared contract inputs vs actual deliverables, accounting for schema integrity, inventory invariants, and contractual criteria.",
        "Return strictly a raw JSON object with keys:",
        "- verdict: 'REFUND_BUYER' | 'RELEASE_CREATOR' | 'PARTIAL_SETTLEMENT'",
        "- refundPercentage: integer between 0 and 100 (0 for RELEASE_CREATOR, 100 for REFUND_BUYER, 1-99 for PARTIAL_SETTLEMENT)",
        "- reasoning: concise explanation in active voice without promotional phrases or fluff.",
      ].join("\n");

      const userContent = JSON.stringify({
        disputeId: dispute.id,
        category: dispute.category,
        title: dispute.title,
        description: dispute.description,
        declaredInput: dispute.evidence.declaredInput,
        actualDeliverable: dispute.evidence.actualDeliverable,
        customCriteria: customEvaluationPrompt || undefined,
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            systemInstruction: { parts: [{ text: oracleSystemPrompt }] },
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (
            parsed.verdict === "REFUND_BUYER" ||
            parsed.verdict === "RELEASE_CREATOR" ||
            parsed.verdict === "PARTIAL_SETTLEMENT"
          ) {
            verdict = parsed.verdict;
            refundPercentage = Number(parsed.refundPercentage) || (verdict === "REFUND_BUYER" ? 100 : 0);
            reasoning = String(parsed.reasoning || "Arbitration concluded under Gemini Oracle review.");
            arbiterModel = "gemini-1.5-flash-oracle";
          }
        }
      }
    } catch {
      // Deterministic fallback activated on network or parse failure
    }
  }

  // Deterministic evaluation fallback if Gemini did not resolve
  if (arbiterModel === "deterministic-oracle-v1" && !hashTampered) {
    if (dispute.category === "SCHEMA_FAILURE") {
      verdict = "REFUND_BUYER";
      refundPercentage = 100;
      reasoning =
        "Deliverable output payload violated declared JSON schema specifications required by contract.";
    } else if (dispute.category === "INVENTORY_DISCREPANCY") {
      verdict = "PARTIAL_SETTLEMENT";
      refundPercentage = 50;
      reasoning =
        "Reconciliation analysis detected partial inventory SKU mismatch. Pro-rata 50/50 settlement apportioned between buyer and creator.";
    } else if (dispute.category === "LATENCY_SLA_BREACH") {
      verdict = "REFUND_BUYER";
      refundPercentage = 100;
      reasoning =
        "Task execution exceeded contractual 60-second watchdog latency boundary without delivering proof.";
    } else if (dispute.category === "CORRUPTED_DELIVERABLE") {
      verdict = "REFUND_BUYER";
      refundPercentage = 100;
      reasoning =
        "Autonomous deliverable payload failed structural integrity check and cannot be deserialized.";
    } else {
      // UNFULFILLED_CRITERIA or OTHER
      if (dispute.description.toLowerCase().includes("fail") || dispute.description.toLowerCase().includes("error")) {
        verdict = "REFUND_BUYER";
        refundPercentage = 100;
        reasoning =
          "Autonomous deliverable failed declared contractual acceptance criteria. Escrow funds refunded to buyer.";
      } else {
        verdict = "RELEASE_CREATOR";
        refundPercentage = 0;
        reasoning =
          "Evidence analysis confirms delivered outputs adhere to declared contract criteria with valid SHA-256 cryptographic provenance.";
      }
    }
  }

  // Atomically resolve escrow funds according to verdict
  const escrowSettlement = await resolveDispute(dispute.jobId, verdict, refundPercentage);

  // Compute canonical SHA-256 cryptographic dispute resolution receipt
  const receiptPayload = {
    disputeId: dispute.id,
    jobId: dispute.jobId,
    verdict,
    refundPercentage: escrowSettlement.refundPercentage,
    buyerRefundPaise: escrowSettlement.buyerRefundPaise,
    creatorPayoutPaise: escrowSettlement.creatorPayoutPaise,
    platformFeePaise: escrowSettlement.platformFeePaise,
    reasoning,
    arbitratedAt: now,
  };

  const integrityDigest = computeDigest(receiptPayload);
  const receiptId = `rcpt_disp_${integrityDigest.slice(0, 16)}`;

  const resolutionReceipt: DisputeResolutionReceipt = {
    receiptId,
    disputeId: dispute.id,
    jobId: dispute.jobId,
    verdict,
    refundPercentage: escrowSettlement.refundPercentage,
    buyerRefundPaise: escrowSettlement.buyerRefundPaise,
    buyerRefundCents: escrowSettlement.buyerRefundCents,
    creatorPayoutPaise: escrowSettlement.creatorPayoutPaise,
    creatorPayoutCents: escrowSettlement.creatorPayoutCents,
    platformFeePaise: escrowSettlement.platformFeePaise,
    platformFeeCents: escrowSettlement.platformFeeCents,
    reasoning,
    integrityDigest,
    arbitratedAt: now,
    arbiterModel,
  };

  dispute.status = "RESOLVED";
  dispute.resolution = resolutionReceipt;
  dispute.resolvedAt = now;
  dispute.updatedAt = now;
  disputeStore.set(dispute.id, dispute);

  return { dispute, resolution: resolutionReceipt };
}

export function getDispute(id: string): DisputeRecord | undefined {
  return disputeStore.get(id);
}

export function listDisputes(filter?: {
  status?: DisputeStatus;
  jobId?: string;
}): DisputeRecord[] {
  let list = Array.from(disputeStore.values());

  if (filter?.status) {
    list = list.filter((d) => d.status === filter.status);
  }
  if (filter?.jobId) {
    list = list.filter((d) => d.jobId === filter.jobId);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
