import { describe, it, expect } from "vitest";
import {
  JobSchema,
  AcceptanceContractSchema,
  AgentManifestSchema,
  WH204TruthSchema,
  ErrorEnvelopeSchema,
} from "@/lib/contracts/schemas";
import {
  CANONICAL_WH204_TRUTH,
  CANONICAL_WH204_JOB,
  CANONICAL_WH204_CONTRACT,
} from "@/lib/contracts/fixtures/wh204";
import { NAVIGATION_REGISTRY, getNavigationForRole } from "@/lib/navigation";

describe("P0 Contract Verification Suite", () => {
  it("validates canonical WH-204 truth contract successfully", () => {
    const parsed = WH204TruthSchema.safeParse(CANONICAL_WH204_TRUTH);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.initialInventoryOnHand).toBe(42);
      expect(parsed.data.expectedFinalInventoryOnHand).toBe(42);
      expect(parsed.data.expectedDiscrepancy).toBe(2);
      expect(parsed.data.inventoryCommitStatus).toBe("BLOCKED_PENDING_APPROVAL");
    }
  });

  it("rejects invalid WH-204 truth with mutated inventory", () => {
    const invalid = {
      ...CANONICAL_WH204_TRUTH,
      expectedFinalInventoryOnHand: 44, // Invariant violation!
    };
    const parsed = WH204TruthSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("validates canonical WH-204 Job contract successfully", () => {
    const parsed = JobSchema.safeParse(CANONICAL_WH204_JOB);
    expect(parsed.success).toBe(true);
  });

  it("rejects Job with invalid status enum", () => {
    const invalidJob = {
      ...CANONICAL_WH204_JOB,
      status: "COMPLETED_WITHOUT_VERIFICATION", // Invalid enum!
    };
    const parsed = JobSchema.safeParse(invalidJob);
    expect(parsed.success).toBe(false);
  });

  it("rejects AcceptanceContract if checks length is not exactly 10", () => {
    const invalidContract = {
      ...CANONICAL_WH204_CONTRACT,
      checks: CANONICAL_WH204_CONTRACT.checks.slice(0, 8), // Only 8 checks!
    };
    const parsed = AcceptanceContractSchema.safeParse(invalidContract);
    expect(parsed.success).toBe(false);
  });

  it("validates a compliant AgentManifest", () => {
    const validManifest = {
      manifestVersion: "1.0.0",
      agentId: "ag-reconciliation",
      version: "1.0.0",
      name: "Reconciliation Specialist",
      summary: "Rule-based reconciliation engine",
      builderId: "builder-jordan-lee",
      capabilities: ["quantity_reconciliation"],
      permissions: ["read:purchase_orders", "read:invoices", "read:receiving_scans"],
      pricing: {
        model: "PER_STAGE",
        pricePaise: 250000,
      },
      estimatedLatencyMs: 1200,
      limitations: ["Standard PO formats only"],
      fallbackVersionIds: ["1.1.0"],
      runtimeAdapter: "src/server/agents/reconciliation.ts",
      executionEligible: true,
    };
    const parsed = AgentManifestSchema.safeParse(validManifest);
    expect(parsed.success).toBe(true);
  });

  it("rejects AgentManifest with unknown capability or commit:inventory permission", () => {
    const maliciousManifest = {
      manifestVersion: "1.0.0",
      agentId: "ag-rogue",
      version: "1.0.0",
      name: "Rogue Agent",
      summary: "Attempts dangerous inventory writes",
      builderId: "builder-unknown",
      capabilities: ["autonomous_superintelligence"], // Unknown!
      permissions: ["commit:inventory"],
      pricing: { model: "FIXED", pricePaise: 1000 },
      estimatedLatencyMs: 500,
    };
    const parsed = AgentManifestSchema.safeParse(maliciousManifest);
    expect(parsed.success).toBe(false);
  });

  it("validates ErrorEnvelope schema strictly", () => {
    const envelope = {
      status: "error",
      code: "ADAPTER_NOT_FOUND",
      message: "Target adapter version not found",
      timestamp: new Date().toISOString(),
    };
    const parsed = ErrorEnvelopeSchema.safeParse(envelope);
    expect(parsed.success).toBe(true);
  });

  it("verifies navigation registry consistency and role isolation", () => {
    expect(NAVIGATION_REGISTRY.length).toBeGreaterThanOrEqual(10);
    const buyerNav = getNavigationForRole("BUYER");
    expect(buyerNav.some((n) => n.route === "/buyer/overview")).toBe(true);
    expect(buyerNav.some((n) => n.route === "/builder/overview")).toBe(false);

    const builderNav = getNavigationForRole("BUILDER");
    expect(builderNav.some((n) => n.route === "/builder/overview")).toBe(true);
    expect(builderNav.some((n) => n.route === "/buyer/overview")).toBe(false);
  });
});
