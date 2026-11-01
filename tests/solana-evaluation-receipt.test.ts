import { describe, expect, it } from "vitest";
import { canonicalReceipt, receiptHash, ReceiptBundleSchema, type EvaluationReceipt } from "@/lib/solana-evaluation-receipt";

const receipt: EvaluationReceipt = { version: "forgent-evaluation-v1", agentId: "support", category: "Customer support", recordedAt: "2026-11-01T00:00:00.000Z", evaluation: "simulated", scorePercent: 94, universalChecks: ["Endpoint responds", "Response format", "Timeout handling", "Required fields"], taskChecks: [{ name: "Answer relevance", scorePercent: 96 }, { name: "Source alignment", scorePercent: 94 }, { name: "Escalation handling", scorePercent: 91 }] };

describe("Solana evaluation receipts", () => {
  it("uses a stable hash and detects changes to report contents", async () => {
    const reordered = Object.fromEntries(Object.entries(receipt).reverse()) as EvaluationReceipt;
    expect(canonicalReceipt(reordered)).toBe(canonicalReceipt(receipt));
    expect(await receiptHash(reordered)).toBe(await receiptHash(receipt));
    expect(await receiptHash({ ...receipt, agentId: "another-agent" })).not.toBe(await receiptHash(receipt));
  });
  it("rejects a receipt that claims a real evaluation", () => {
    expect(ReceiptBundleSchema.safeParse({ receipt: { ...receipt, evaluation: "real" }, signature: "1".repeat(88) }).success).toBe(false);
  });
});
