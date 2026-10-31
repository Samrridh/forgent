import crypto from "crypto";

export interface ExecutionLogItem {
  timestamp: string;
  step: string;
  message: string;
}

export interface DeliverablePayload {
  summaryMarkdown: string;
  structuredJson: Record<string, unknown> | Array<unknown> | unknown;
}

export interface EvidenceReceiptPayload {
  jobId: string;
  agentSlug: string;
  input: unknown;
  systemPrompt: string;
  executionLogs: ExecutionLogItem[];
  deliverable: DeliverablePayload;
  issuedAt: string;
}

export interface EvidenceReceipt {
  receiptId: string;
  jobId: string;
  agentSlug: string;
  integrityHash: string;
  hashScope: string;
  issuedAt: string;
  receiptData: EvidenceReceiptPayload;
}

export interface VerificationResult {
  valid: boolean;
  calculatedHash: string;
  providedHash: string;
  issuedAt: string;
  verifiedAt: string;
  error?: string;
}

/**
 * Deterministically serialize any JavaScript value to canonical JSON.
 * Sorts object keys recursively to ensure cryptographic SHA-256 reproducibility.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map(canonicalStringify).join(",") + "]";
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`;
  });

  return "{" + pairs.join(",") + "}";
}

/**
 * Computes a SHA-256 hash of the canonical JSON string of the receipt payload.
 */
export function computeReceiptHash(data: EvidenceReceiptPayload): string {
  const canonicalJson = canonicalStringify(data);
  return crypto.createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

/**
 * Generates an immutable cryptographic evidence receipt for an agent job execution.
 */
export function generateEvidenceReceipt(
  params: Omit<EvidenceReceiptPayload, "issuedAt"> & { issuedAt?: string }
): EvidenceReceipt {
  const issuedAt = params.issuedAt || new Date().toISOString();
  const receiptData: EvidenceReceiptPayload = {
    jobId: params.jobId,
    agentSlug: params.agentSlug,
    input: params.input,
    systemPrompt: params.systemPrompt,
    executionLogs: params.executionLogs,
    deliverable: params.deliverable,
    issuedAt,
  };

  const integrityHash = computeReceiptHash(receiptData);
  const receiptId = `rcpt_${integrityHash.slice(0, 16)}`;

  return {
    receiptId,
    jobId: params.jobId,
    agentSlug: params.agentSlug,
    integrityHash,
    hashScope: "SHA256:CANONICAL_JSON(input,systemPrompt,executionLogs,deliverable,issuedAt)",
    issuedAt,
    receiptData,
  };
}

/**
 * Verifies the integrity of an evidence receipt by recomputing the cryptographic hash.
 */
export function verifyEvidenceReceipt(receipt: {
  receiptId?: string;
  integrityHash: string;
  receiptData: EvidenceReceiptPayload;
}): VerificationResult {
  const verifiedAt = new Date().toISOString();

  if (!receipt || !receipt.integrityHash || !receipt.receiptData) {
    return {
      valid: false,
      calculatedHash: "",
      providedHash: receipt?.integrityHash || "",
      issuedAt: "",
      verifiedAt,
      error: "Missing required receipt or integrityHash property",
    };
  }

  const calculatedHash = computeReceiptHash(receipt.receiptData);
  const valid = calculatedHash === receipt.integrityHash;

  return {
    valid,
    calculatedHash,
    providedHash: receipt.integrityHash,
    issuedAt: receipt.receiptData.issuedAt || "",
    verifiedAt,
    ...(!valid
      ? { error: "Cryptographic verification failure: computed SHA-256 does not match provided integrity hash" }
      : {}),
  };
}
