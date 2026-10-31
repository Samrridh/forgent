import { z } from "zod";

export type PipelineStageKey = "INGESTION" | "PROCESSING" | "VERIFICATION";

export interface NodeParameter {
  key: string;
  label: string;
  type: "string" | "number" | "json" | "boolean";
  required: boolean;
  value: string;
  mappedFrom?: {
    nodeId: string;
    outputKey: string;
  };
}

export interface NodeOutput {
  key: string;
  label: string;
  type: "string" | "number" | "json" | "boolean";
  sampleValue: string;
}

export interface PipelineNode {
  id: string;
  stage: PipelineStageKey;
  stageName: string;
  agentId: string;
  agentName: string;
  category: string;
  version: string;
  description: string;
  estimatedLatencyMs: number;
  costPaise: number;
  inputParameters: NodeParameter[];
  outputParameters: NodeOutput[];
  status: "idle" | "running" | "verified" | "error";
}

export interface PipelineConnection {
  id: string;
  fromNodeId: string;
  fromOutputKey: string;
  toNodeId: string;
  toInputKey: string;
}

export interface EnterprisePipeline {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  nodes: PipelineNode[];
  connections: PipelineConnection[];
  totalCostPaise: number;
  estimatedLatencyMs: number;
  certificationStatus: "UNCERTIFIED" | "TESTING" | "CERTIFIED";
  deploymentStatus: "DRAFT" | "DEPLOYED_ORG" | "PAUSED";
  lastTestedAt?: string;
  certificationSeal?: string;
}

export type SyntheticTestVectorKey =
  | "HAPPY_PATH"
  | "MALFORMED_EDGE"
  | "HIGH_VOLUME_STRESS";

export interface SyntheticTestVector {
  key: SyntheticTestVectorKey;
  name: string;
  badge: string;
  description: string;
  payloadSize: string;
  concurrency: number;
  expectedOutcome: string;
  status: "pending" | "running" | "passed" | "failed";
  latencyMs: number;
  schemaMatchRate: number;
  costPaise: number;
  logs: string[];
}

export interface TelemetryGauges {
  schemaIntegrityPercent: number;
  latencyPerStageMs: Record<string, number>;
  totalLatencyMs: number;
  maxStageLatencyMs: number;
  slaThresholdMs: number;
  slaMet: boolean;
  totalExecutionCostPaise: number;
  tokensProcessed: number;
  tokenEfficiencyTokensPerRupee: number;
  certified: boolean;
  certificationHash?: string;
}

export interface DepartmentBudget {
  id: string;
  department: string;
  allocatedPaise: number;
  spentPaise: number;
  escrowLockedPaise: number;
  activePipelines: number;
  authorizedOwner: string;
}

export type AuditStatus = "COMMITTED" | "SETTLED" | "ESCROW_LOCKED" | "REVERTED";

export interface AuditLedgerEntry {
  id: string;
  timestamp: string;
  executor: string;
  department: string;
  pipelineId: string;
  pipelineName: string;
  escrowDebitedPaise: number;
  status: AuditStatus;
  verificationHash: string;
  durationMs: number;
  stageResultsSummary: string;
}

// Zod schemas for validation and API contracts
export const NodeParameterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["string", "number", "json", "boolean"]),
  required: z.boolean(),
  value: z.string(),
  mappedFrom: z
    .object({
      nodeId: z.string(),
      outputKey: z.string(),
    })
    .optional(),
});

export const NodeOutputSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["string", "number", "json", "boolean"]),
  sampleValue: z.string(),
});

export const PipelineNodeSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(["INGESTION", "PROCESSING", "VERIFICATION"]),
  stageName: z.string().min(1),
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  category: z.string().min(1),
  version: z.string().min(1),
  description: z.string(),
  estimatedLatencyMs: z.number().int().nonnegative(),
  costPaise: z.number().int().nonnegative(),
  inputParameters: z.array(NodeParameterSchema),
  outputParameters: z.array(NodeOutputSchema),
  status: z.enum(["idle", "running", "verified", "error"]),
});

export const PipelineConnectionSchema = z.object({
  id: z.string().min(1),
  fromNodeId: z.string().min(1),
  fromOutputKey: z.string().min(1),
  toNodeId: z.string().min(1),
  toInputKey: z.string().min(1),
});

export const EnterprisePipelineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  createdAt: z.string(),
  nodes: z.array(PipelineNodeSchema).min(1),
  connections: z.array(PipelineConnectionSchema),
  totalCostPaise: z.number().int().nonnegative(),
  estimatedLatencyMs: z.number().int().nonnegative(),
  certificationStatus: z.enum(["UNCERTIFIED", "TESTING", "CERTIFIED"]),
  deploymentStatus: z.enum(["DRAFT", "DEPLOYED_ORG", "PAUSED"]),
  lastTestedAt: z.string().optional(),
  certificationSeal: z.string().optional(),
});

export const TestFlightRequestSchema = z.object({
  pipeline: EnterprisePipelineSchema,
  vectorKeys: z.array(z.enum(["HAPPY_PATH", "MALFORMED_EDGE", "HIGH_VOLUME_STRESS"])).optional(),
});

export type TestFlightRequest = z.infer<typeof TestFlightRequestSchema>;
