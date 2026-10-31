export const CAPABILITIES = [
  "document_evidence_extraction",
  "quantity_reconciliation",
  "policy_validation",
  "exception_reporting",
  "inventory_proposal",
  "human_approval",
  // Creation Agent Capabilities (Roadmap)
  "repository_analysis",
  "code_generation",
  "test_generation",
  "test_execution",
] as const;

export type CapabilityKey = (typeof CAPABILITIES)[number];

export const PERMISSIONS = [
  "read:purchase_orders",
  "read:invoices",
  "read:receiving_scans",
  "read:reconciliation_results",
  "read:inventory_ledger",
  "propose:inventory_delta",
  "commit:inventory", // Never granted to agents in MVP
  // Creation Agent Permissions (Roadmap)
  "read:repository",
  "write:workspace_code",
  "exec:workspace_tests",
  "create:pull_request",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const JOB_STATUSES = [
  "DRAFT",
  "CONTRACT_READY",
  "COMPILING",
  "AUDITIONING",
  "READY_FOR_WORK_ORDER",
  "WORK_ORDER_APPROVED",
  "EXECUTING",
  "VERIFYING",
  "EXCEPTION_REVIEW",
  "SETTLED",
  "FAILED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STAGE_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "REPLACED",
  "SKIPPED",
] as const;

export type StageStatus = (typeof STAGE_STATUSES)[number];

export const EXECUTION_STATUSES = [
  "NOT_STARTED",
  "INITIALIZING",
  "STAGE_RUNNING",
  "STAGE_FAILED",
  "RECOVERING",
  "RECOVERY_FAILED",
  "COMPLETED",
  "TERMINATED_FAIL_CLOSED",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const PACKAGE_SUBMISSION_STATUSES = [
  "UPLOADED",
  "VALIDATED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
] as const;

export type PackageSubmissionStatus = (typeof PACKAGE_SUBMISSION_STATUSES)[number];

export const USER_ROLES = ["BUYER", "BUILDER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCEPTANCE_CHECK_CODES = [
  "CHK-DOC-01",
  "CHK-DOC-02",
  "CHK-REC-01",
  "CHK-REC-02",
  "CHK-REC-03",
  "CHK-POL-01",
  "CHK-POL-02",
  "CHK-EXC-01",
  "CHK-INV-01",
  "CHK-HUM-01",
] as const;

export type AcceptanceCheckCode = (typeof ACCEPTANCE_CHECK_CODES)[number];

export const DEMO_IDENTITIES = {
  JOB_ID: "job-wh-204",
  BUYER_ID: "buyer-northstar",
  BUILDER_ID: "builder-jordan-lee",
  TOTAL_BUDGET_PAISE: 1000000, // ₹10,000.00
  BUILDER_ELIGIBLE_PAISE: 550000, // ₹5,500.00
  PLATFORM_FEE_PAISE: 250000, // ₹2,500.00
  INITIAL_INVENTORY_ON_HAND: 42,
  FINAL_INVENTORY_ON_HAND: 42,
} as const;
