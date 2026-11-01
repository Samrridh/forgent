import { z } from "zod";

export const EvaluationReceiptSchema = z.strictObject({
  version: z.literal("forgent-evaluation-v1"),
  agentId: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  recordedAt: z.iso.datetime(),
  evaluation: z.literal("simulated"),
  scorePercent: z.literal(94),
  universalChecks: z.array(z.string().min(1).max(100)).length(4),
  taskChecks: z.array(z.strictObject({ name: z.string().min(1).max(100), scorePercent: z.number().int().min(0).max(100) })).length(3),
});
export type EvaluationReceipt = z.infer<typeof EvaluationReceiptSchema>;
export const ReceiptBundleSchema = z.strictObject({ receipt: EvaluationReceiptSchema, signature: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,90}$/) });
export const MEMO_PREFIX = "forgent:evaluation:v1:sha256:";

// Explicit key ordering makes the same receipt hash identically after export and import.
export function canonicalReceipt(value: EvaluationReceipt): string {
  const receipt = EvaluationReceiptSchema.parse(value);
  return JSON.stringify({ version: receipt.version, agentId: receipt.agentId, category: receipt.category, recordedAt: receipt.recordedAt, evaluation: receipt.evaluation, scorePercent: receipt.scorePercent, universalChecks: receipt.universalChecks, taskChecks: receipt.taskChecks.map(check => ({ name: check.name, scorePercent: check.scorePercent })) });
}

export async function receiptHash(receipt: EvaluationReceipt): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalReceipt(receipt)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
