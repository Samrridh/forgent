import { AgentManifest } from "@/lib/contracts/domain";
import { AgentManifestSchema } from "@/lib/contracts/schemas";

export interface AgentExecutionContext {
  jobId: string;
  stageId: string;
  allocatedPricePaise: number;
  deadlineMs: number;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionResult<TOutput = unknown> {
  status: "SUCCESS" | "FAILED";
  durationMs: number;
  output?: TOutput;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AgentAdapter<TInput = unknown, TOutput = unknown> {
  readonly manifest: AgentManifest;
  execute(input: TInput, context: AgentExecutionContext): Promise<AgentExecutionResult<TOutput>>;
}

export function validateAgentManifest(raw: unknown): AgentManifest {
  return AgentManifestSchema.parse(raw);
}
