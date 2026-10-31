import crypto from "crypto";
import { canonicalStringify } from "@/server/engine/receipt";
import {
  ReceivingDocumentBundle,
  ReconciliationResult,
  ErpStateDiff,
  HumanCheckpoint,
  ReceivingPipelineStageRecord,
  SealedReceivingReceipt,
} from "@/lib/contracts/receiving-types";

/**
 * Computes a deterministic SHA-256 hash using canonical JSON stringification.
 */
export function computeSha256(data: unknown): string {
  const canonical = canonicalStringify(data);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Cryptographically seals a receiving evidence receipt with SHA-256 over
 * input hashes, stage output digests, ERP state diff, checkpoint, and timestamp.
 */
export function sealReceivingReceipt(params: {
  bundle: ReceivingDocumentBundle;
  stages: ReceivingPipelineStageRecord[];
  reconciliation: ReconciliationResult;
  erpStateDiff: ErpStateDiff;
  checkpoint?: HumanCheckpoint;
}): SealedReceivingReceipt {
  const { bundle, stages, reconciliation, erpStateDiff, checkpoint } = params;
  const issuedAt = new Date().toISOString();

  const inputHash = computeSha256(bundle);
  const reconciliationDigest = computeSha256(reconciliation);
  const stateDiffDigest = computeSha256(erpStateDiff);
  const checkpointDigest = checkpoint ? computeSha256(checkpoint) : undefined;

  const sealPayload = {
    inputHash,
    poNumber: bundle.purchaseOrder.poNumber,
    vendorId: bundle.purchaseOrder.vendorId,
    warehouseId: bundle.receivingLog.warehouseId,
    stages,
    reconciliationDigest,
    stateDiffDigest,
    checkpointDigest,
    issuedAt,
    sealedBy: "Forgent Cryptographic Receipt Engine v1.0",
  };

  const sha256Hash = computeSha256(sealPayload);
  const receiptId = `rcpt_recv_${sha256Hash.slice(0, 16)}`;

  return {
    receiptId,
    sha256Hash,
    inputHash,
    issuedAt,
    algorithm: "SHA256:CANONICAL_JSON",
    sealedBy: "Forgent Cryptographic Receipt Engine v1.0",
    poNumber: bundle.purchaseOrder.poNumber,
    vendorId: bundle.purchaseOrder.vendorId,
    warehouseId: bundle.receivingLog.warehouseId,
    stages,
    reconciliationDigest,
    stateDiffDigest,
    checkpointDigest,
  };
}

/**
 * Verifies the integrity of a sealed receiving receipt.
 */
export function verifyReceivingReceipt(receipt: SealedReceivingReceipt): {
  valid: boolean;
  computedHash: string;
  expectedHash: string;
} {
  const sealPayload = {
    inputHash: receipt.inputHash,
    poNumber: receipt.poNumber,
    vendorId: receipt.vendorId,
    warehouseId: receipt.warehouseId,
    stages: receipt.stages,
    reconciliationDigest: receipt.reconciliationDigest,
    stateDiffDigest: receipt.stateDiffDigest,
    checkpointDigest: receipt.checkpointDigest,
    issuedAt: receipt.issuedAt,
    sealedBy: receipt.sealedBy,
  };

  const computedHash = computeSha256(sealPayload);
  return {
    valid: computedHash === receipt.sha256Hash,
    computedHash,
    expectedHash: receipt.sha256Hash,
  };
}
