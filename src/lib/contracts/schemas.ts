import { z } from "zod";
import {
  CAPABILITIES,
  PERMISSIONS,
  JOB_STATUSES,
  STAGE_STATUSES,
  EXECUTION_STATUSES,
  PACKAGE_SUBMISSION_STATUSES,
  USER_ROLES,
  ACCEPTANCE_CHECK_CODES,
} from "./constants";

// Capability & Permission Enums
export const CapabilityKeySchema = z.enum(CAPABILITIES);
export const PermissionKeySchema = z.enum(PERMISSIONS);
export const JobStatusSchema = z.enum(JOB_STATUSES);
export const StageStatusSchema = z.enum(STAGE_STATUSES);
export const ExecutionStatusSchema = z.enum(EXECUTION_STATUSES);
export const PackageSubmissionStatusSchema = z.enum(PACKAGE_SUBMISSION_STATUSES);
export const UserRoleSchema = z.enum(USER_ROLES);
export const AcceptanceCheckCodeSchema = z.enum(ACCEPTANCE_CHECK_CODES);

// Session Payload
export const SessionPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

// Acceptance Check Schema
export const AcceptanceCheckSchema = z.object({
  checkCode: AcceptanceCheckCodeSchema,
  name: z.string().min(1),
  description: z.string(),
  required: z.boolean().default(true),
  passed: z.boolean().optional(),
  observedValue: z.unknown().optional(),
  expectedValue: z.unknown().optional(),
});

// Acceptance Contract
export const AcceptanceContractSchema = z.object({
  contractId: z.string().min(1),
  jobId: z.string().min(1),
  version: z.number().int().positive().default(1),
  checks: z.array(AcceptanceCheckSchema).length(10),
  requiredInventoryInvariant: z.object({
    expectedInitialOnHand: z.number().int().nonnegative(),
    expectedFinalOnHand: z.number().int().nonnegative(),
    commitBlocked: z.boolean().default(true),
  }),
  humanReviewRequired: z.boolean().default(true),
  discrepancyThresholdPercent: z.number().nonnegative().max(100).default(5),
});

// Job Schema
export const JobSchema = z.object({
  jobId: z.string().min(1),
  buyerId: z.string().min(1),
  title: z.string().min(1),
  status: JobStatusSchema,
  budgetPaise: z.number().int().positive(),
  deadlineMinutes: z.number().int().positive(),
  acceptanceContract: AcceptanceContractSchema.optional(),
  evidenceDocuments: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Agent Manifest Schema
export const AgentManifestSchema = z.object({
  manifestVersion: z.literal("1.0.0"),
  agentId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string().min(1),
  summary: z.string(),
  builderId: z.string().min(1),
  capabilities: z.array(CapabilityKeySchema).min(1),
  permissions: z.array(PermissionKeySchema),
  pricing: z.object({
    model: z.enum(["PER_STAGE", "FIXED"]),
    pricePaise: z.number().int().nonnegative(),
  }),
  estimatedLatencyMs: z.number().int().positive(),
  limitations: z.array(z.string()).default([]),
  fallbackVersionIds: z.array(z.string()).default([]),
  runtimeAdapter: z.string().nullable().default(null),
  executionEligible: z.boolean().default(false),
  registryVisible: z.boolean().default(true),
});

// Workflow Stage & Graph
export const WorkflowStageSchema = z.object({
  stageId: z.string().min(1),
  capabilityKey: CapabilityKeySchema,
  status: StageStatusSchema,
  assignedAgentId: z.string().optional(),
  assignedVersion: z.string().optional(),
  allocatedPricePaise: z.number().int().nonnegative(),
  dependsOn: z.array(z.string()).default([]),
  isPlatformOwned: z.boolean().default(false),
});

export const WorkflowGraphSchema = z.object({
  workflowId: z.string().min(1),
  jobId: z.string().min(1),
  candidateType: z.enum(["BASELINE_A", "FIXED_TEAM_B", "COMPILER_SELECTED_C"]),
  stages: z.array(WorkflowStageSchema).min(1),
  totalCostPaise: z.number().int().nonnegative(),
  estimatedLatencyMs: z.number().int().positive(),
  selectedForExecution: z.boolean().default(false),
});

// Evaluation Run Schema
export const EvaluationRunSchema = z.object({
  evaluationId: z.string().min(1),
  workflowId: z.string().min(1),
  candidateType: z.enum(["BASELINE_A", "FIXED_TEAM_B", "COMPILER_SELECTED_C"]),
  fixtureSuiteId: z.string().default("wh204-suite-v1"),
  totalFixtures: z.number().int().positive().default(10),
  passedFixtures: z.number().int().nonnegative(),
  accuracyPercent: z.number().min(0).max(100),
  totalCostPaise: z.number().int().nonnegative(),
  passHardConstraints: z.boolean(),
  evaluatedAt: z.string().datetime(),
});

// Execution Event Schema
export const ExecutionEventSchema = z.object({
  eventId: z.string().min(1),
  executionId: z.string().min(1),
  stageId: z.string().min(1),
  stageStatus: StageStatusSchema,
  agentId: z.string().optional(),
  version: z.string().optional(),
  timestamp: z.string().datetime(),
  durationMs: z.number().int().nonnegative(),
  message: z.string(),
  payloadJson: z.unknown().optional(),
  errorJson: z.unknown().optional(),
});

// Recovery Event Schema
export const RecoveryEventSchema = z.object({
  recoveryId: z.string().min(1),
  executionId: z.string().min(1),
  failedStageId: z.string().min(1),
  failedVersionId: z.string().min(1),
  failureReason: z.string(),
  replacementVersionId: z.string().min(1),
  recoveryStatus: z.enum(["REPLACED_SUCCESS", "SAFE_STOP_TRIGGERED"]),
  payoutVoidedForFailedVersion: z.boolean().default(true),
  timestamp: z.string().datetime(),
});

// Evidence Receipt Schema
export const EvidenceReceiptSchema = z.object({
  receiptId: z.string().min(1),
  jobId: z.string().min(1),
  executionId: z.string().min(1),
  tamperEvidentSha256: z.string().length(64),
  verificationSummary: z.object({
    checksEvaluated: z.number().int().default(10),
    checksPassed: z.number().int().default(10),
    allChecksSatisfied: z.boolean(),
  }),
  inventoryStateDiff: z.object({
    initialOnHand: z.number().int().default(42),
    finalOnHand: z.number().int().default(42),
    statePreserved: z.boolean().default(true),
    commitActionStatus: z.literal("BLOCKED_PENDING_APPROVAL"),
  }),
  financialAttribution: z.object({
    totalBuyerSpendPaise: z.number().int().default(1000000),
    builderTotalPaise: z.number().int().default(550000),
    platformFeePaise: z.number().int().default(250000),
    contingencyReservePaise: z.number().int().default(200000),
  }),
  generatedAt: z.string().datetime(),
});

// Canonical WH-204 Truth Schema
export const WH204TruthSchema = z.object({
  jobId: z.literal("job-wh-204"),
  poQuantity: z.literal(12),
  invoiceQuantity: z.literal(12),
  scannedQuantity: z.literal(10),
  expectedReceived: z.literal(10),
  expectedDiscrepancy: z.literal(2),
  discrepancyType: z.literal("UNEXPLAINED_SHORTAGE"),
  expectedOutcome: z.literal("EXCEPTION_REQUIRES_REVIEW"),
  inventoryCommitStatus: z.literal("BLOCKED_PENDING_APPROVAL"),
  initialInventoryOnHand: z.literal(42),
  expectedFinalInventoryOnHand: z.literal(42),
});

// Error Envelope Schema
export const ErrorEnvelopeSchema = z.object({
  status: z.literal("error"),
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});
