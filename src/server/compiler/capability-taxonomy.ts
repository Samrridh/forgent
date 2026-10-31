import {
  CAPABILITIES,
  CapabilityKey,
  PermissionKey,
} from "@/lib/contracts/constants";

// Schema IDs for Stage Contract validation
export const STAGE_SCHEMA_IDS = {
  DOC_EXTRACT_INPUT: "schema-doc-extract-input-v1",
  DOC_EXTRACT_OUTPUT: "schema-doc-extract-output-v1",
  RECONCILIATION_INPUT: "schema-doc-extract-output-v1",
  RECONCILIATION_OUTPUT: "schema-reconciliation-output-v1",
  POLICY_INPUT: "schema-reconciliation-output-v1",
  POLICY_OUTPUT: "schema-policy-output-v1",
  EXCEPTION_INPUT: "schema-policy-output-v1",
  EXCEPTION_OUTPUT: "schema-exception-output-v1",
  INVENTORY_PROPOSAL_INPUT: "schema-reconciliation-output-v1",
  INVENTORY_PROPOSAL_OUTPUT: "schema-inventory-proposal-v1",
  HUMAN_APPROVAL_INPUT: "schema-inventory-proposal-v1",
  HUMAN_APPROVAL_OUTPUT: "schema-human-approval-v1",
} as const;

// Capability Constants
export const CAP_DOCUMENT_EVIDENCE_EXTRACTION: CapabilityKey = "document_evidence_extraction";
export const CAP_QUANTITY_RECONCILIATION: CapabilityKey = "quantity_reconciliation";
export const CAP_POLICY_VALIDATION: CapabilityKey = "policy_validation";
export const CAP_EXCEPTION_REPORTING: CapabilityKey = "exception_reporting";
export const CAP_INVENTORY_PROPOSAL: CapabilityKey = "inventory_proposal";
export const CAP_HUMAN_APPROVAL: CapabilityKey = "human_approval";

// Permission Constants
export const PERM_READ_PURCHASE_ORDERS: PermissionKey = "read:purchase_orders";
export const PERM_READ_INVOICES: PermissionKey = "read:invoices";
export const PERM_READ_RECEIVING_SCANS: PermissionKey = "read:receiving_scans";
export const PERM_READ_RECONCILIATION_RESULTS: PermissionKey = "read:reconciliation_results";
export const PERM_READ_INVENTORY_LEDGER: PermissionKey = "read:inventory_ledger";
export const PERM_PROPOSE_INVENTORY_DELTA: PermissionKey = "propose:inventory_delta";
export const PERM_COMMIT_INVENTORY: PermissionKey = "commit:inventory"; // Strictly forbidden for agents

export type CapabilityOwner = "MARKETPLACE" | "PLATFORM";

export interface CapabilityDefinition {
  readonly key: CapabilityKey;
  readonly label: string;
  readonly description: string;
  readonly owner: CapabilityOwner;
  readonly isPlatformOwned: boolean;
  readonly wh204Required: boolean;
  readonly inputSchemaId: string;
  readonly outputSchemaId: string;
  readonly requiredPermissions: readonly PermissionKey[];
  readonly isDemoCritical: boolean;
}

export const CANONICAL_CAPABILITIES: readonly CapabilityDefinition[] = [
  {
    key: CAP_DOCUMENT_EVIDENCE_EXTRACTION,
    label: "Document Evidence Extraction",
    description: "Extracts structured line-item quantities and identifiers from purchase orders, invoices, and physical receiving scan logs.",
    owner: "MARKETPLACE",
    isPlatformOwned: false,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.DOC_EXTRACT_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.DOC_EXTRACT_OUTPUT,
    requiredPermissions: [PERM_READ_PURCHASE_ORDERS, PERM_READ_INVOICES, PERM_READ_RECEIVING_SCANS],
    isDemoCritical: true,
  },
  {
    key: CAP_QUANTITY_RECONCILIATION,
    label: "Quantity Reconciliation",
    description: "Cross-checks extracted line items across documents, detects discrepancies, and computes received vs expected variances.",
    owner: "MARKETPLACE",
    isPlatformOwned: false,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.RECONCILIATION_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.RECONCILIATION_OUTPUT,
    requiredPermissions: [PERM_READ_RECONCILIATION_RESULTS],
    isDemoCritical: true,
  },
  {
    key: CAP_POLICY_VALIDATION,
    label: "Policy Validation",
    description: "Platform-enforced tolerance rules and automated discrepancy thresholds.",
    owner: "PLATFORM",
    isPlatformOwned: true,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.POLICY_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.POLICY_OUTPUT,
    requiredPermissions: [],
    isDemoCritical: true,
  },
  {
    key: CAP_EXCEPTION_REPORTING,
    label: "Exception Reporting",
    description: "Generates concise, auditable variance exception reports for warehouse operators when policy thresholds are breached.",
    owner: "MARKETPLACE",
    isPlatformOwned: false,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.EXCEPTION_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.EXCEPTION_OUTPUT,
    requiredPermissions: [PERM_READ_RECONCILIATION_RESULTS],
    isDemoCritical: true,
  },
  {
    key: CAP_INVENTORY_PROPOSAL,
    label: "Inventory Proposal",
    description: "Proposes provisional inventory adjustments without commit authority.",
    owner: "PLATFORM",
    isPlatformOwned: true,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.INVENTORY_PROPOSAL_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.INVENTORY_PROPOSAL_OUTPUT,
    requiredPermissions: [PERM_READ_INVENTORY_LEDGER, PERM_PROPOSE_INVENTORY_DELTA],
    isDemoCritical: true,
  },
  {
    key: CAP_HUMAN_APPROVAL,
    label: "Human Approval Checkpoint",
    description: "Human review checkpoint requiring explicit buyer sign-off before inventory commit.",
    owner: "PLATFORM",
    isPlatformOwned: true,
    wh204Required: true,
    inputSchemaId: STAGE_SCHEMA_IDS.HUMAN_APPROVAL_INPUT,
    outputSchemaId: STAGE_SCHEMA_IDS.HUMAN_APPROVAL_OUTPUT,
    requiredPermissions: [],
    isDemoCritical: true,
  },
] as const;

export const CAPABILITY_TAXONOMY: ReadonlyMap<CapabilityKey, CapabilityDefinition> = new Map(
  CANONICAL_CAPABILITIES.map((cap) => [cap.key, cap])
);

/**
 * Validates whether a given key is a known canonical CapabilityKey.
 */
export function isKnownCapability(key: string): key is CapabilityKey {
  return (CAPABILITIES as readonly string[]).includes(key);
}

/**
 * Returns the definition for a specific capability key.
 */
export function getCapabilityDefinition(key: CapabilityKey): CapabilityDefinition | undefined {
  return CAPABILITY_TAXONOMY.get(key);
}

/**
 * Returns all capabilities marked as required for the WH-204 job.
 */
export function getRequiredWH204Capabilities(): CapabilityDefinition[] {
  return CANONICAL_CAPABILITIES.filter((cap) => cap.wh204Required);
}

/**
 * Returns all marketplace-owned capabilities (supplied by independent builders).
 */
export function getMarketplaceCapabilities(): CapabilityDefinition[] {
  return CANONICAL_CAPABILITIES.filter((cap) => !cap.isPlatformOwned);
}

/**
 * Returns all platform-owned capabilities (internal deterministic functions).
 */
export function getPlatformCapabilities(): CapabilityDefinition[] {
  return CANONICAL_CAPABILITIES.filter((cap) => cap.isPlatformOwned);
}

/**
 * Validates that an array of capability keys covers all required WH-204 capabilities.
 */
export function validateCapabilityRequirements(declaredKeys: readonly string[]): {
  valid: boolean;
  missing: CapabilityKey[];
} {
  const declaredSet = new Set(declaredKeys);
  const required = getRequiredWH204Capabilities();
  const missing = required
    .map((r) => r.key)
    .filter((key) => !declaredSet.has(key));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates that agent permissions do NOT violate safety boundaries.
 * In Forgent, no agent is EVER permitted to hold `commit:inventory`.
 */
export function checkPermissionSafety(permissions: readonly string[]): {
  safe: boolean;
  forbiddenPermissions: string[];
} {
  const forbidden = permissions.filter((p) => p === PERM_COMMIT_INVENTORY);
  return {
    safe: forbidden.length === 0,
    forbiddenPermissions: forbidden,
  };
}
