import { EnterprisePipeline } from "@/lib/contracts/enterprise-types";
import { EvidenceReceipt } from "../engine/receipt";

export interface PipelineExecutionLog {
  timestamp: string;
  step: string;
  message: string;
}

export interface PipelineNodeResult {
  nodeId: string;
  agentId: string;
  agentName: string;
  stage: string;
  status: "verified" | "error";
  latencyMs: number;
  tokensUsed: number;
  costPaise: number;
  outputData: Record<string, unknown>;
  logs: PipelineExecutionLog[];
}

export interface PipelineExecutionRecord {
  executionId: string;
  pipelineId: string;
  pipeline: EnterprisePipeline;
  initialInputs: Record<string, unknown>;
  status: "INITIALIZED" | "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  currentNodeId?: string;
  currentStageIndex: number;
  totalTokens: number;
  totalLatencyMs: number;
  totalCostPaise: number;
  nodeResults: Record<string, PipelineNodeResult>;
  deliverable?: {
    summaryMarkdown: string;
    structuredJson: Record<string, unknown>;
  };
  receipt?: EvidenceReceipt;
  error?: string;
}

const globalStore = globalThis as unknown as {
  __forgentPipelineExecutionStore?: Map<string, PipelineExecutionRecord>;
};

if (!globalStore.__forgentPipelineExecutionStore) {
  globalStore.__forgentPipelineExecutionStore = new Map<string, PipelineExecutionRecord>();
}

export const pipelineExecutionStore = globalStore.__forgentPipelineExecutionStore;

export function createPipelineExecution(
  pipeline: EnterprisePipeline,
  initialInputs: Record<string, unknown> = {}
): PipelineExecutionRecord {
  const executionId = `pexec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const record: PipelineExecutionRecord = {
    executionId,
    pipelineId: pipeline.id,
    pipeline,
    initialInputs,
    status: "INITIALIZED",
    createdAt: new Date().toISOString(),
    currentStageIndex: 0,
    totalTokens: 0,
    totalLatencyMs: 0,
    totalCostPaise: pipeline.totalCostPaise,
    nodeResults: {},
  };

  pipelineExecutionStore.set(executionId, record);
  return record;
}

export function getPipelineExecution(executionId: string): PipelineExecutionRecord | undefined {
  return pipelineExecutionStore.get(executionId);
}

export function updatePipelineExecution(
  executionId: string,
  updates: Partial<PipelineExecutionRecord>
): PipelineExecutionRecord | undefined {
  const existing = pipelineExecutionStore.get(executionId);
  if (!existing) return undefined;

  const updated = {
    ...existing,
    ...updates,
  };
  pipelineExecutionStore.set(executionId, updated);
  return updated;
}
