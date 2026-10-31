import { describe, it, expect } from "vitest";
import {
  CANONICAL_CAPABILITIES,
  CAPABILITY_TAXONOMY,
  STAGE_SCHEMA_IDS,
  CAP_DOCUMENT_EVIDENCE_EXTRACTION,
  CAP_QUANTITY_RECONCILIATION,
  CAP_POLICY_VALIDATION,
  CAP_EXCEPTION_REPORTING,
  CAP_INVENTORY_PROPOSAL,
  CAP_HUMAN_APPROVAL,
  PERM_COMMIT_INVENTORY,
  isKnownCapability,
  getCapabilityDefinition,
  getRequiredWH204Capabilities,
  getMarketplaceCapabilities,
  getPlatformCapabilities,
  validateCapabilityRequirements,
  checkPermissionSafety,
} from "@/server/compiler/capability-taxonomy";
import {
  VERSION_EVIDENCE_READER_100,
  VERSION_RECONCILIATION_100,
  VERSION_RECONCILIATION_110,
  VERSION_EXCEPTION_REPORTER_100,
  VERSION_BASELINE_SINGLE_AGENT,
  EVIDENCE_READER_V1_MANIFEST,
  RECONCILIATION_V1_MANIFEST,
  RECONCILIATION_V11_MANIFEST,
  EXCEPTION_REPORTER_V1_MANIFEST,
  BASELINE_SINGLE_AGENT_MANIFEST,
  SEEDED_MANIFESTS,
  EXECUTABLE_ADAPTER_BINDINGS,
  getManifestById,
  getAllManifests,
  getMarketplaceManifests,
  getManifestsForCapability,
  isMarketplaceCallable,
  getCapabilityToManifestMatrix,
} from "@/server/agents/manifests";
import { AgentManifestSchema } from "@/lib/contracts/schemas";

describe("P1-C-001: Capability Taxonomy & Manifests Suite", () => {
  describe("TC-ADAPT-01: Capability Taxonomy & Schema Contract Integrity", () => {
    it("defines exactly 6 canonical capabilities for WH-204", () => {
      expect(CANONICAL_CAPABILITIES).toHaveLength(6);
      expect(CAPABILITY_TAXONOMY.size).toBe(6);

      const required = getRequiredWH204Capabilities();
      expect(required).toHaveLength(6);
      expect(required.every((c) => c.wh204Required)).toBe(true);
      expect(required.every((c) => c.isDemoCritical)).toBe(true);
    });

    it("verifies capability ownership separation (3 marketplace, 3 platform)", () => {
      const marketplaceCaps = getMarketplaceCapabilities();
      const platformCaps = getPlatformCapabilities();

      expect(marketplaceCaps).toHaveLength(3);
      expect(platformCaps).toHaveLength(3);

      expect(marketplaceCaps.map((c) => c.key)).toEqual([
        CAP_DOCUMENT_EVIDENCE_EXTRACTION,
        CAP_QUANTITY_RECONCILIATION,
        CAP_EXCEPTION_REPORTING,
      ]);

      expect(platformCaps.map((c) => c.key)).toEqual([
        CAP_POLICY_VALIDATION,
        CAP_INVENTORY_PROPOSAL,
        CAP_HUMAN_APPROVAL,
      ]);
    });

    it("maps every capability to valid input/output stage schemas", () => {
      for (const cap of CANONICAL_CAPABILITIES) {
        expect(cap.inputSchemaId).toMatch(/^schema-[a-z0-9-]+-v1$/);
        expect(cap.outputSchemaId).toMatch(/^schema-[a-z0-9-]+-v1$/);
      }

      expect(STAGE_SCHEMA_IDS.DOC_EXTRACT_INPUT).toBe("schema-doc-extract-input-v1");
      expect(STAGE_SCHEMA_IDS.DOC_EXTRACT_OUTPUT).toBe("schema-doc-extract-output-v1");
      expect(STAGE_SCHEMA_IDS.RECONCILIATION_INPUT).toBe("schema-doc-extract-output-v1");
    });

    it("verifies capability requirement validator", () => {
      const allKeys = CANONICAL_CAPABILITIES.map((c) => c.key);
      const validationSuccess = validateCapabilityRequirements(allKeys);
      expect(validationSuccess.valid).toBe(true);
      expect(validationSuccess.missing).toHaveLength(0);

      const partialKeys = [CAP_DOCUMENT_EVIDENCE_EXTRACTION, CAP_QUANTITY_RECONCILIATION];
      const validationFailure = validateCapabilityRequirements(partialKeys);
      expect(validationFailure.valid).toBe(false);
      expect(validationFailure.missing).toContain(CAP_POLICY_VALIDATION);
      expect(validationFailure.missing).toContain(CAP_EXCEPTION_REPORTING);
    });

    it("enforces strict permission safety boundary (blocks commit:inventory)", () => {
      const safePermissions = ["read:purchase_orders", "read:invoices", "propose:inventory_delta"];
      expect(checkPermissionSafety(safePermissions).safe).toBe(true);

      const dangerousPermissions = ["read:purchase_orders", PERM_COMMIT_INVENTORY];
      const safetyCheck = checkPermissionSafety(dangerousPermissions);
      expect(safetyCheck.safe).toBe(false);
      expect(safetyCheck.forbiddenPermissions).toContain(PERM_COMMIT_INVENTORY);
    });
  });

  describe("TC-ADAPT-02: Evidence Reader v1.0.0 Manifest", () => {
    it("validates manifest against AgentManifestSchema with extraction permissions", () => {
      const parsed = AgentManifestSchema.safeParse(EVIDENCE_READER_V1_MANIFEST);
      expect(parsed.success).toBe(true);

      expect(EVIDENCE_READER_V1_MANIFEST.agentId).toBe("agent-evidence-reader");
      expect(EVIDENCE_READER_V1_MANIFEST.version).toBe("1.0.0");
      expect(EVIDENCE_READER_V1_MANIFEST.capabilities).toEqual([CAP_DOCUMENT_EVIDENCE_EXTRACTION]);
      expect(EVIDENCE_READER_V1_MANIFEST.permissions).toContain("read:purchase_orders");
      expect(EVIDENCE_READER_V1_MANIFEST.permissions).toContain("read:invoices");
      expect(EVIDENCE_READER_V1_MANIFEST.permissions).toContain("read:receiving_scans");
      expect(EVIDENCE_READER_V1_MANIFEST.pricing.pricePaise).toBe(200000);
      expect(EVIDENCE_READER_V1_MANIFEST.estimatedLatencyMs).toBe(900);
      expect(EVIDENCE_READER_V1_MANIFEST.executionEligible).toBe(true);
      expect(EVIDENCE_READER_V1_MANIFEST.registryVisible).toBe(true);
    });
  });

  describe("TC-ADAPT-03: Reconciliation Specialist v1.0.0 Manifest & Fallback Link", () => {
    it("validates primary reconciliation agent with active fallback link to v1.1.0", () => {
      const parsed = AgentManifestSchema.safeParse(RECONCILIATION_V1_MANIFEST);
      expect(parsed.success).toBe(true);

      expect(RECONCILIATION_V1_MANIFEST.agentId).toBe("agent-reconciliation-specialist");
      expect(RECONCILIATION_V1_MANIFEST.version).toBe("1.0.0");
      expect(RECONCILIATION_V1_MANIFEST.pricing.pricePaise).toBe(250000);
      expect(RECONCILIATION_V1_MANIFEST.estimatedLatencyMs).toBe(1200);
      expect(RECONCILIATION_V1_MANIFEST.fallbackVersionIds).toEqual([VERSION_RECONCILIATION_110]);
      expect(RECONCILIATION_V1_MANIFEST.runtimeAdapter).toBe("reconciliation-v1");
      expect(RECONCILIATION_V1_MANIFEST.registryVisible).toBe(true);
    });
  });

  describe("TC-ADAPT-04: Reconciliation Specialist v1.1.0 Manifest (Patched)", () => {
    it("validates patched fallback agent with no further fallback", () => {
      const parsed = AgentManifestSchema.safeParse(RECONCILIATION_V11_MANIFEST);
      expect(parsed.success).toBe(true);

      expect(RECONCILIATION_V11_MANIFEST.agentId).toBe("agent-reconciliation-specialist");
      expect(RECONCILIATION_V11_MANIFEST.version).toBe("1.1.0");
      expect(RECONCILIATION_V11_MANIFEST.pricing.pricePaise).toBe(250000);
      expect(RECONCILIATION_V11_MANIFEST.estimatedLatencyMs).toBe(1100);
      expect(RECONCILIATION_V11_MANIFEST.fallbackVersionIds).toHaveLength(0);
      expect(RECONCILIATION_V11_MANIFEST.runtimeAdapter).toBe("reconciliation-v11");
      expect(RECONCILIATION_V11_MANIFEST.registryVisible).toBe(true);
    });
  });

  describe("TC-ADAPT-05: Exception Reporter v1.0.0 Manifest", () => {
    it("validates exception reporter manifest", () => {
      const parsed = AgentManifestSchema.safeParse(EXCEPTION_REPORTER_V1_MANIFEST);
      expect(parsed.success).toBe(true);

      expect(EXCEPTION_REPORTER_V1_MANIFEST.agentId).toBe("agent-exception-reporter");
      expect(EXCEPTION_REPORTER_V1_MANIFEST.version).toBe("1.0.0");
      expect(EXCEPTION_REPORTER_V1_MANIFEST.capabilities).toEqual([CAP_EXCEPTION_REPORTING]);
      expect(EXCEPTION_REPORTER_V1_MANIFEST.pricing.pricePaise).toBe(100000);
      expect(EXCEPTION_REPORTER_V1_MANIFEST.estimatedLatencyMs).toBe(700);
      expect(EXCEPTION_REPORTER_V1_MANIFEST.runtimeAdapter).toBe("exception-reporter");
      expect(EXCEPTION_REPORTER_V1_MANIFEST.registryVisible).toBe(true);
    });
  });

  describe("TC-ADAPT-06: 5-Manifest vs 4-Adapter Resolution & Monolithic Baseline", () => {
    it("validates baseline-single-agent as strictly evaluation-only (registryVisible: false)", () => {
      const parsed = AgentManifestSchema.safeParse(BASELINE_SINGLE_AGENT_MANIFEST);
      expect(parsed.success).toBe(true);

      expect(BASELINE_SINGLE_AGENT_MANIFEST.agentId).toBe("baseline-single-agent");
      expect(BASELINE_SINGLE_AGENT_MANIFEST.registryVisible).toBe(false);
      expect(BASELINE_SINGLE_AGENT_MANIFEST.executionEligible).toBe(false);
      expect(BASELINE_SINGLE_AGENT_MANIFEST.runtimeAdapter).toBeNull();
      expect(BASELINE_SINGLE_AGENT_MANIFEST.builderId).toBe("platform-baseline");

      // Covers all worker capabilities for monolithic execution
      expect(BASELINE_SINGLE_AGENT_MANIFEST.capabilities).toContain(CAP_DOCUMENT_EVIDENCE_EXTRACTION);
      expect(BASELINE_SINGLE_AGENT_MANIFEST.capabilities).toContain(CAP_QUANTITY_RECONCILIATION);
      expect(BASELINE_SINGLE_AGENT_MANIFEST.capabilities).toContain(CAP_EXCEPTION_REPORTING);

      // Must NOT be marketplace callable
      expect(isMarketplaceCallable(BASELINE_SINGLE_AGENT_MANIFEST)).toBe(false);
    });

    it("verifies exactly 5 manifests total and exactly 4 marketplace-visible manifests", () => {
      const all = getAllManifests();
      expect(all).toHaveLength(5);

      const marketplaceOnly = getMarketplaceManifests();
      expect(marketplaceOnly).toHaveLength(4);

      // Verify marketplace agents are callable
      for (const manifest of marketplaceOnly) {
        expect(isMarketplaceCallable(manifest)).toBe(true);
        expect(manifest.registryVisible).toBe(true);
        expect(manifest.executionEligible).toBe(true);
        expect(manifest.runtimeAdapter).not.toBeNull();
      }

      // Verify baseline is excluded from marketplace
      expect(marketplaceOnly.some((m) => m.agentId === "baseline-single-agent")).toBe(false);
    });

    it("verifies exactly 4 executable adapter bindings", () => {
      expect(EXECUTABLE_ADAPTER_BINDINGS).toHaveLength(4);
      const adapterVersionIds = EXECUTABLE_ADAPTER_BINDINGS.map((b) => b.versionId);
      expect(adapterVersionIds).toEqual([
        VERSION_EVIDENCE_READER_100,
        VERSION_RECONCILIATION_100,
        VERSION_RECONCILIATION_110,
        VERSION_EXCEPTION_REPORTER_100,
      ]);
      expect(adapterVersionIds).not.toContain(VERSION_BASELINE_SINGLE_AGENT);
    });

    it("validates the Capability-to-Manifest matrix covers all worker capabilities", () => {
      const matrix = getCapabilityToManifestMatrix();
      expect(matrix[CAP_DOCUMENT_EVIDENCE_EXTRACTION]).toContain("agent-evidence-reader");
      expect(matrix[CAP_QUANTITY_RECONCILIATION]).toContain("agent-reconciliation-specialist");
      expect(matrix[CAP_EXCEPTION_REPORTING]).toContain("agent-exception-reporter");

      // Baseline agent appears in capability query ONLY if includeHidden is true
      const publicExtraction = getManifestsForCapability(CAP_DOCUMENT_EVIDENCE_EXTRACTION);
      expect(publicExtraction.map((m) => m.agentId)).toEqual(["agent-evidence-reader"]);

      const allExtraction = getManifestsForCapability(CAP_DOCUMENT_EVIDENCE_EXTRACTION, { includeHidden: true });
      expect(allExtraction.map((m) => m.agentId)).toEqual(["agent-evidence-reader", "baseline-single-agent"]);
    });
  });
});
