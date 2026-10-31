import { z } from "zod";

export const PolicyVerdictSchema = z.enum(["ALLOWED", "REDACTED", "BLOCKED"]);
export type PolicyVerdict = z.infer<typeof PolicyVerdictSchema>;

export const RedactionCategorySchema = z.enum(["SECRET", "PII"]);
export type RedactionCategory = z.infer<typeof RedactionCategorySchema>;

export const RedactedFieldRecordSchema = z.object({
  path: z.string(),
  patternType: z.string(),
  category: RedactionCategorySchema,
  replacement: z.string(),
});
export type RedactedFieldRecord = z.infer<typeof RedactedFieldRecordSchema>;

export const GatewayPolicyConfigSchema = z.object({
  zeroTrustPiiMasking: z.boolean().default(true),
  networkEgressContainment: z.boolean().default(true),
  consequentialStateMutationLock: z.boolean().default(true),
  allowedCapabilities: z.array(z.string()).default([]),
  blockedOperations: z
    .array(z.string())
    .default([
      "commit:inventory",
      "shell:unrestricted",
      "db:drop",
      "db:truncate",
      "fs:write_root",
      "network:raw_socket",
      "crypto:exfiltrate",
      "admin:grant_role",
    ]),
  allowedEgressDomains: z
    .array(z.string())
    .default([
      "api.forgent.internal",
      "localhost",
      "127.0.0.1",
      "webhooks.enterprise.internal",
    ]),
});
export type GatewayPolicyConfig = z.infer<typeof GatewayPolicyConfigSchema>;

export const ToolInvocationRequestSchema = z.object({
  callerAgentId: z.string().min(1, "Caller agent ID is required"),
  toolName: z.string().min(1, "Tool name is required"),
  operation: z.string().min(1, "Operation name is required"),
  payload: z.unknown().default({}),
  declaredCapabilities: z.array(z.string()).optional(),
  targetUrl: z.string().url().optional(),
  configOverride: GatewayPolicyConfigSchema.partial().optional(),
});
export type ToolInvocationRequest = z.infer<typeof ToolInvocationRequestSchema>;

export const PolicyEvaluationsSchema = z.object({
  piiMasked: z.boolean(),
  secretsRedacted: z.boolean(),
  scopeAuthorized: z.boolean(),
  egressContained: z.boolean(),
  stateMutationLocked: z.boolean(),
});
export type PolicyEvaluations = z.infer<typeof PolicyEvaluationsSchema>;

export const GatewayAuditRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  callerAgentId: z.string(),
  toolName: z.string(),
  operation: z.string(),
  verdict: PolicyVerdictSchema,
  blockedReason: z.string().optional(),
  redactedKeys: z.array(z.string()),
  redactedDetails: z.array(RedactedFieldRecordSchema).default([]),
  originalPayloadPreview: z.string().optional(),
  sanitizedPayloadPreview: z.string().optional(),
  sanitizedPayload: z.unknown().optional(),
  policyEvaluations: PolicyEvaluationsSchema,
  executionLatencyMs: z.number().int().nonnegative(),
});
export type GatewayAuditRecord = z.infer<typeof GatewayAuditRecordSchema>;

export const InterceptResultSchema = z.object({
  success: z.boolean(),
  verdict: PolicyVerdictSchema,
  sanitizedPayload: z.unknown(),
  redactedKeys: z.array(z.string()),
  redactedCount: z.number().int().nonnegative(),
  blockedReason: z.string().optional(),
  auditRecord: GatewayAuditRecordSchema,
});
export type InterceptResult = z.infer<typeof InterceptResultSchema>;

export const AuditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  verdict: PolicyVerdictSchema.optional(),
  toolName: z.string().optional(),
  search: z.string().optional(),
});
export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;
