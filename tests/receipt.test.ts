import { describe, it, expect } from "vitest";
import {
  canonicalStringify,
  computeReceiptHash,
  generateEvidenceReceipt,
  verifyEvidenceReceipt,
} from "@/server/engine/receipt";

describe("Cryptographic SHA-256 Evidence Receipt Suite", () => {
  it("sorts object keys deterministically with canonicalStringify", () => {
    const objA = { z: 1, a: 2, m: { y: "test", b: 10 } };
    const objB = { a: 2, m: { b: 10, y: "test" }, z: 1 };

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalStringify(objA)).toBe('{"a":2,"m":{"b":10,"y":"test"},"z":1}');
  });

  it("generates a valid cryptographic SHA-256 evidence receipt", () => {
    const sampleInput = { ticker: "AAPL", fiscalYear: 2024 };
    const systemPrompt = "You are SEC 10-K extraction agent.";
    const executionLogs = [
      { timestamp: "2026-10-30T10:00:00Z", step: "INIT", message: "Job initialized" },
      { timestamp: "2026-10-30T10:00:01Z", step: "EXECUTE", message: "Parsing balance sheet" },
    ];
    const deliverable = {
      summaryMarkdown: "Financials extracted cleanly.",
      structuredJson: { revenueUsd: 383285000000, netIncomeUsd: 96995000000 },
    };

    const receipt = generateEvidenceReceipt({
      jobId: "job-test-001",
      agentSlug: "sec-10k-financial-analyst",
      input: sampleInput,
      systemPrompt,
      executionLogs,
      deliverable,
      issuedAt: "2026-10-30T10:00:02Z",
    });

    expect(receipt.receiptId).toBeDefined();
    expect(receipt.receiptId.startsWith("rcpt_")).toBe(true);
    expect(receipt.integrityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.hashScope).toContain("SHA256:CANONICAL_JSON");

    // Verify receipt
    const verification = verifyEvidenceReceipt(receipt);
    expect(verification.valid).toBe(true);
    expect(verification.calculatedHash).toBe(receipt.integrityHash);
  });

  it("detects tampering when input, prompt, or deliverable is altered", () => {
    const receipt = generateEvidenceReceipt({
      jobId: "job-tamper-test",
      agentSlug: "invoice-ledger-reconciler",
      input: { invoiceAmount: 1000 },
      systemPrompt: "Reconcile invoices",
      executionLogs: [{ timestamp: "2026-10-30T10:00:00Z", step: "MATCH", message: "Matched" }],
      deliverable: { summaryMarkdown: "Clean match", structuredJson: { status: "MATCHED" } },
      issuedAt: "2026-10-30T10:00:02Z",
    });

    // Valid initially
    expect(verifyEvidenceReceipt(receipt).valid).toBe(true);

    // Tamper with input
    const tamperedReceipt = {
      ...receipt,
      receiptData: {
        ...receipt.receiptData,
        input: { invoiceAmount: 999999 }, // Tampered value
      },
    };

    const failedVerification = verifyEvidenceReceipt(tamperedReceipt);
    expect(failedVerification.valid).toBe(false);
    expect(failedVerification.error).toContain("Cryptographic verification failure");
  });
});
