import { z } from "zod";
import { InterceptResultSchema } from "./gateway-types";

export const ExecutionModeSchema = z.enum(["mock", "live"]);
export type ExecutionMode = z.infer<typeof ExecutionModeSchema>;

export const SandboxToolPermissionsSchema = z.object({
  zeroTrustPiiMasking: z.boolean().default(true),
  networkEgressContainment: z.boolean().default(true),
  consequentialStateMutationLock: z.boolean().default(true),
  allowedCapabilities: z.array(z.string()).default([
    "read:analytics",
    "compute:variance",
    "extract:evidence",
  ]),
});
export type SandboxToolPermissions = z.infer<typeof SandboxToolPermissionsSchema>;

export const SandboxRunRequestSchema = z.object({
  agentSlug: z.string().min(1, "Agent slug is required"),
  inputPayload: z.record(z.string(), z.unknown()).default({}),
  executionMode: ExecutionModeSchema.default("mock"),
  latencyCeilingMs: z.number().int().min(100).max(10000).default(3500),
  toolPermissions: SandboxToolPermissionsSchema.optional(),
  testToolPayload: z.record(z.string(), z.unknown()).optional(),
});
export type SandboxRunRequest = z.infer<typeof SandboxRunRequestSchema>;

export const LatencyWaterfallSchema = z.object({
  dnsConnectMs: z.number().int().nonnegative(),
  gatewayMs: z.number().int().nonnegative(),
  ttftMs: z.number().int().nonnegative(),
  generationMs: z.number().int().nonnegative(),
  totalLatencyMs: z.number().int().nonnegative(),
  slaThresholdMs: z.number().int().nonnegative(),
  slaViolated: z.boolean(),
});
export type LatencyWaterfall = z.infer<typeof LatencyWaterfallSchema>;

export const MemoryTelemetrySchema = z.object({
  heapUsedBytes: z.number().int().nonnegative(),
  heapTotalBytes: z.number().int().nonnegative(),
  rssBytes: z.number().int().nonnegative(),
  formattedHeapUsed: z.string(),
});
export type MemoryTelemetry = z.infer<typeof MemoryTelemetrySchema>;

export const TokenTelemetrySchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  costPaise: z.number().int().nonnegative(),
  formattedCostUsd: z.string(),
  formattedCostInr: z.string(),
});
export type TokenTelemetry = z.infer<typeof TokenTelemetrySchema>;

export const SandboxTelemetryChunkStageSchema = z.enum([
  "INIT",
  "CONNECTING",
  "GATEWAY_INSPECTION",
  "FIRST_TOKEN",
  "STREAMING",
  "COMPLETED",
  "ERROR",
]);
export type SandboxTelemetryChunkStage = z.infer<typeof SandboxTelemetryChunkStageSchema>;

export const SandboxTelemetryChunkSchema = z.object({
  stage: SandboxTelemetryChunkStageSchema,
  message: z.string(),
  deltaText: z.string().optional(),
  accumulatedText: z.string().optional(),
  waterfall: LatencyWaterfallSchema.partial().optional(),
  memory: MemoryTelemetrySchema.optional(),
  tokens: TokenTelemetrySchema.optional(),
  toolVerdict: InterceptResultSchema.optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});
export type SandboxTelemetryChunk = z.infer<typeof SandboxTelemetryChunkSchema>;

export const ToolInspectionResultSchema = z.object({
  rawPayload: z.record(z.string(), z.unknown()),
  sanitizedPayload: z.unknown(),
  verdict: z.enum(["ALLOWED", "REDACTED", "BLOCKED"]),
  redactedKeys: z.array(z.string()),
  policyEvaluations: z.record(z.string(), z.boolean()),
  blockedReason: z.string().optional(),
  executionLatencyMs: z.number().int().nonnegative(),
});
export type ToolInspectionResult = z.infer<typeof ToolInspectionResultSchema>;

export const SandboxExecutionResultSchema = z.object({
  executionId: z.string(),
  agentSlug: z.string(),
  agentTitle: z.string(),
  category: z.string(),
  executionMode: ExecutionModeSchema,
  status: z.enum(["COMPLETED", "FAILED", "SLA_BREACH"]),
  summaryMarkdown: string(),
  structuredOutput: z.record(z.string(), z.unknown()),
  waterfall: LatencyWaterfallSchema,
  tokens: TokenTelemetrySchema,
  memory: MemoryTelemetrySchema,
  toolInspection: ToolInspectionResultSchema.optional(),
  systemPrompt: z.string(),
  completedAt: z.string(),
  diagnostic: z.object({
    openaiConfigured: z.boolean(),
    geminiConfigured: z.boolean(),
    hint: z.string(),
  }).optional(),
});

function string() {
  return z.string();
}

export type SandboxExecutionResult = z.infer<typeof SandboxExecutionResultSchema>;

export const SandboxExportTestRequestSchema = z.object({
  agentSlug: z.string().min(1),
  inputPayload: z.record(z.string(), z.unknown()).default({}),
  expectedOutput: z.record(z.string(), z.unknown()).default({}),
  latencyCeilingMs: z.number().int().min(100).max(10000).default(3500),
  toolPermissions: SandboxToolPermissionsSchema.optional(),
  testName: z.string().optional(),
  targetStage: z.enum(["schema", "injection", "latency", "consistency", "economics"]).default("consistency"),
});
export type SandboxExportTestRequest = z.infer<typeof SandboxExportTestRequestSchema>;

export const QualificationTestFixtureSchema = z.object({
  fixtureId: z.string(),
  version: z.string(),
  createdAt: z.string(),
  agentSlug: z.string(),
  agentTitle: z.string(),
  category: z.string(),
  targetStage: z.enum(["schema", "injection", "latency", "consistency", "economics"]),
  inputContract: z.record(z.string(), z.unknown()),
  expectedOutputContract: z.record(z.string(), z.unknown()),
  assertions: z.object({
    maxLatencyMs: z.number().int(),
    requireZeroTrustRedaction: z.boolean(),
    forbiddenOutputTokens: z.array(z.string()),
    requiredOutputKeys: z.array(z.string()),
  }),
  qualifyEnginePayload: z.object({
    name: z.string(),
    category: z.string(),
    inputSchema: z.string(),
    outputSchema: z.string(),
    pricePerTaskUsd: z.number(),
    endpointType: z.literal("hosted_starter"),
  }),
  fixtureChecksum: z.string(),
});
export type QualificationTestFixture = z.infer<typeof QualificationTestFixtureSchema>;
