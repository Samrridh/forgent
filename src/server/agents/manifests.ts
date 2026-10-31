import { AgentManifest } from "@/lib/contracts/domain";
import { AgentManifestSchema } from "@/lib/contracts/schemas";
import { CapabilityKey } from "@/lib/contracts/constants";
import {
  CAP_DOCUMENT_EVIDENCE_EXTRACTION,
  CAP_QUANTITY_RECONCILIATION,
  CAP_EXCEPTION_REPORTING,
  PERM_READ_PURCHASE_ORDERS,
  PERM_READ_INVOICES,
  PERM_READ_RECEIVING_SCANS,
  PERM_READ_RECONCILIATION_RESULTS,
  CANONICAL_CAPABILITIES,
} from "../compiler/capability-taxonomy";

// Canonical Version IDs
export const VERSION_EVIDENCE_READER_100 = "av-evidence-reader-100";
export const VERSION_RECONCILIATION_100 = "av-reconciliation-100";
export const VERSION_RECONCILIATION_110 = "av-reconciliation-110";
export const VERSION_EXCEPTION_REPORTER_100 = "av-exception-reporter-100";
export const VERSION_BASELINE_SINGLE_AGENT = "baseline-single-agent";

// 1. Evidence Reader v1.0.0
export const EVIDENCE_READER_V1_MANIFEST: AgentManifest = AgentManifestSchema.parse({
  manifestVersion: "1.0.0",
  agentId: "agent-evidence-reader",
  version: "1.0.0",
  name: "Evidence Reader",
  summary:
    "Extracts structured line-item quantities and identifiers from purchase orders, invoices, and physical receiving scans using OCR and vision extraction.",
  builderId: "builder-jordan-lee",
  capabilities: [CAP_DOCUMENT_EVIDENCE_EXTRACTION],
  permissions: [
    PERM_READ_PURCHASE_ORDERS,
    PERM_READ_INVOICES,
    PERM_READ_RECEIVING_SCANS,
  ],
  pricing: {
    model: "PER_STAGE",
    pricePaise: 200000, // ₹2,000.00
  },
  estimatedLatencyMs: 900,
  limitations: [
    "Standard PDF and JSON evidence formats only",
    "Requires legible scan images",
  ],
  fallbackVersionIds: [],
  runtimeAdapter: "evidence-reader",
  executionEligible: true,
  registryVisible: true,
});

// 2. Reconciliation Specialist v1.0.0 (Primary with deliberate injected failure for demo)
export const RECONCILIATION_V1_MANIFEST: AgentManifest = AgentManifestSchema.parse({
  manifestVersion: "1.0.0",
  agentId: "agent-reconciliation-specialist",
  version: "1.0.0",
  name: "Reconciliation Specialist",
  summary:
    "Primary reconciliation engine that performs 3-way match across documents and computes received vs expected variances.",
  builderId: "builder-jordan-lee",
  capabilities: [CAP_QUANTITY_RECONCILIATION],
  permissions: [PERM_READ_RECONCILIATION_RESULTS],
  pricing: {
    model: "PER_STAGE",
    pricePaise: 250000, // ₹2,500.00
  },
  estimatedLatencyMs: 1200,
  limitations: [
    "Demo primary version with injected simulated failure on batch edge-cases",
  ],
  fallbackVersionIds: [VERSION_RECONCILIATION_110],
  runtimeAdapter: "reconciliation-v1",
  executionEligible: true,
  registryVisible: true,
});

// 3. Reconciliation Specialist v1.1.0 (Patched Fallback)
export const RECONCILIATION_V11_MANIFEST: AgentManifest = AgentManifestSchema.parse({
  manifestVersion: "1.0.0",
  agentId: "agent-reconciliation-specialist",
  version: "1.1.0",
  name: "Reconciliation Specialist (Patched)",
  summary:
    "Hardened deterministic reconciliation specialist patched for edge-case discrepancy handling; serves as active fallback.",
  builderId: "builder-jordan-lee",
  capabilities: [CAP_QUANTITY_RECONCILIATION],
  permissions: [PERM_READ_RECONCILIATION_RESULTS],
  pricing: {
    model: "PER_STAGE",
    pricePaise: 250000, // ₹2,500.00
  },
  estimatedLatencyMs: 1100,
  limitations: ["Strict deterministic variance logic"],
  fallbackVersionIds: [],
  runtimeAdapter: "reconciliation-v11",
  executionEligible: true,
  registryVisible: true,
});

// 4. Exception Reporter v1.0.0
export const EXCEPTION_REPORTER_V1_MANIFEST: AgentManifest = AgentManifestSchema.parse({
  manifestVersion: "1.0.0",
  agentId: "agent-exception-reporter",
  version: "1.0.0",
  name: "Exception Reporter",
  summary:
    "Synthesizes discrepancies and tolerance policy breaches into auditable warehouse exception notifications.",
  builderId: "builder-jordan-lee",
  capabilities: [CAP_EXCEPTION_REPORTING],
  permissions: [PERM_READ_RECONCILIATION_RESULTS],
  pricing: {
    model: "PER_STAGE",
    pricePaise: 100000, // ₹1,000.00
  },
  estimatedLatencyMs: 700,
  limitations: ["Standard warehouse exception reporting template only"],
  fallbackVersionIds: [],
  runtimeAdapter: "exception-reporter",
  executionEligible: true,
  registryVisible: true,
});

// 5. Single-Agent Monolithic Baseline (Candidate A - Evaluation Only, strictly hidden from marketplace)
export const BASELINE_SINGLE_AGENT_MANIFEST: AgentManifest = AgentManifestSchema.parse({
  manifestVersion: "1.0.0",
  agentId: "baseline-single-agent",
  version: "1.0.0",
  name: "Single-Agent Baseline (Evaluation Only)",
  summary:
    "Monolithic baseline agent combining document extraction, reconciliation, and reporting into a single step for audition comparison. Not available for marketplace hire.",
  builderId: "platform-baseline",
  capabilities: [
    CAP_DOCUMENT_EVIDENCE_EXTRACTION,
    CAP_QUANTITY_RECONCILIATION,
    CAP_EXCEPTION_REPORTING,
  ],
  permissions: [
    PERM_READ_PURCHASE_ORDERS,
    PERM_READ_INVOICES,
    PERM_READ_RECEIVING_SCANS,
    PERM_READ_RECONCILIATION_RESULTS,
  ],
  pricing: {
    model: "FIXED",
    pricePaise: 300000, // ₹3,000.00 (notional evaluation pricing)
  },
  estimatedLatencyMs: 2500,
  limitations: [
    "Monolithic execution; no fallback recovery; evaluation baseline only",
  ],
  fallbackVersionIds: [],
  runtimeAdapter: null, // Non-callable via marketplace adapter
  executionEligible: false,
  registryVisible: false, // CRITICAL: Excluded from catalog, search, and matching for hire
});

// Registry of all 5 frozen manifests keyed by versionId
export const SEEDED_MANIFESTS: Readonly<Record<string, AgentManifest>> = Object.freeze({
  [VERSION_EVIDENCE_READER_100]: EVIDENCE_READER_V1_MANIFEST,
  [VERSION_RECONCILIATION_100]: RECONCILIATION_V1_MANIFEST,
  [VERSION_RECONCILIATION_110]: RECONCILIATION_V11_MANIFEST,
  [VERSION_EXCEPTION_REPORTER_100]: EXCEPTION_REPORTER_V1_MANIFEST,
  [VERSION_BASELINE_SINGLE_AGENT]: BASELINE_SINGLE_AGENT_MANIFEST,
});

/**
 * 4 Executable Marketplace Adapter Bindings
 * Manifest 5 (baseline-single-agent) is an evaluation-only monolithic comparator
 * and has NO callable marketplace adapter binding.
 */
export const EXECUTABLE_ADAPTER_BINDINGS = [
  { versionId: VERSION_EVIDENCE_READER_100, adapter: "evidence-reader", manifest: EVIDENCE_READER_V1_MANIFEST },
  { versionId: VERSION_RECONCILIATION_100, adapter: "reconciliation-v1", manifest: RECONCILIATION_V1_MANIFEST },
  { versionId: VERSION_RECONCILIATION_110, adapter: "reconciliation-v11", manifest: RECONCILIATION_V11_MANIFEST },
  { versionId: VERSION_EXCEPTION_REPORTER_100, adapter: "exception-reporter", manifest: EXCEPTION_REPORTER_V1_MANIFEST },
] as const;

/**
 * Returns manifest by its version ID.
 */
export function getManifestById(versionId: string): AgentManifest | undefined {
  return SEEDED_MANIFESTS[versionId];
}

/**
 * Returns all 5 manifests (including hidden evaluation baseline).
 */
export function getAllManifests(): AgentManifest[] {
  return Object.values(SEEDED_MANIFESTS);
}

/**
 * Returns only the marketplace-visible agents available for hire (4 agents).
 */
export function getMarketplaceManifests(): AgentManifest[] {
  return getAllManifests().filter((m) => m.registryVisible);
}

/**
 * Returns manifests implementing a specific capability.
 */
export function getManifestsForCapability(
  capabilityKey: CapabilityKey,
  options: { includeHidden?: boolean } = {}
): AgentManifest[] {
  return getAllManifests().filter((manifest) => {
    if (!options.includeHidden && !manifest.registryVisible) {
      return false;
    }
    return manifest.capabilities.includes(capabilityKey);
  });
}

/**
 * Verifies if an agent version is marketplace-callable.
 * Baseline single-agent is strictly evaluation-only and returns false.
 */
export function isMarketplaceCallable(manifest: AgentManifest): boolean {
  return (
    manifest.registryVisible === true &&
    manifest.executionEligible === true &&
    manifest.runtimeAdapter !== null
  );
}

/**
 * Builds the Capability-to-Manifest matrix for WH-204 capabilities.
 */
export function getCapabilityToManifestMatrix(): Record<CapabilityKey, string[]> {
  const matrix: Partial<Record<CapabilityKey, string[]>> = {};

  for (const cap of CANONICAL_CAPABILITIES) {
    const matching = getManifestsForCapability(cap.key, { includeHidden: true });
    matrix[cap.key] = matching.map((m) => m.agentId);
  }

  return matrix as Record<CapabilityKey, string[]>;
}
