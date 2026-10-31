import { z } from "zod";

export const JurisdictionSchema = z.enum(["US", "EU", "INDIA", "GLOBAL"]);
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

export const ComplianceVerdictStatusSchema = z.enum([
  "PASSED",
  "VIOLATION",
  "CHECKPOINT_REQUIRED",
]);
export type ComplianceVerdictStatus = z.infer<typeof ComplianceVerdictStatusSchema>;

export const ProviderFilterModeSchema = z.enum(["WHITELIST", "BLACKLIST"]);
export type ProviderFilterMode = z.infer<typeof ProviderFilterModeSchema>;

export const BudgetCapPolicySchema = z.object({
  maxBudgetPaise: z.number().int().nonnegative().default(5000000), // ₹50,000 ($625 USD)
  requireApprovalAbovePaise: z.number().int().nonnegative().default(4000000), // ₹40,000 ($500 USD)
  currency: z.enum(["USD", "INR"]).default("USD"),
});
export type BudgetCapPolicy = z.infer<typeof BudgetCapPolicySchema>;

export const DataResidencyPolicySchema = z.object({
  primaryJurisdiction: JurisdictionSchema.default("US"),
  enforceSovereignty: z.boolean().default(true),
  allowedJurisdictions: z.array(JurisdictionSchema).default(["US", "EU"]),
});
export type DataResidencyPolicy = z.infer<typeof DataResidencyPolicySchema>;

export const ProviderPolicySchema = z.object({
  mode: ProviderFilterModeSchema.default("BLACKLIST"),
  allowedProviders: z
    .array(z.string())
    .default([
      "OPENAI",
      "ANTHROPIC",
      "GOOGLE",
      "AWS_BEDROCK",
      "MICROSOFT_AZURE",
    ]),
  forbiddenProviders: z
    .array(z.string())
    .default(["DEEPSEEK", "UNVERIFIED_COMMUNITY", "TIKTOK_AI"]),
  allowedModels: z
    .array(z.string())
    .default([
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "claude-3-haiku",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ]),
  forbiddenModels: z
    .array(z.string())
    .default(["unfiltered-uncensored-v1", "deepseek-r1-distill"]),
});
export type ProviderPolicy = z.infer<typeof ProviderPolicySchema>;

export const HumanInTheLoopPolicySchema = z.object({
  requireCheckpointOnStateMutation: z.boolean().default(true),
  requireCheckpointOnPaymentAbovePaise: z
    .number()
    .int()
    .nonnegative()
    .default(4000000), // ₹40,000 ($500 USD)
  requireCheckpointOnPiiExport: z.boolean().default(true),
  requireCheckpointOnExternalWebhook: z.boolean().default(true),
  restrictedOperations: z
    .array(z.string())
    .default([
      "commit:inventory",
      "db:mutate",
      "db:drop",
      "db:truncate",
      "payout:transfer",
      "export:pii",
      "network:egress_untrusted",
    ]),
});
export type HumanInTheLoopPolicy = z.infer<typeof HumanInTheLoopPolicySchema>;

export const EnterprisePolicyConfigSchema = z.object({
  id: z.string().min(1).default("pol_enterprise_default"),
  orgId: z.string().min(1).default("org_acme_logistics"),
  policyName: z.string().min(1).default("Acme Enterprise Sovereign Guardrails"),
  version: z.string().default("2.1.0"),
  updatedAt: z.string(),
  latencySlaCeilingMs: z.number().int().min(100).max(60000).default(3500),
  budgetCap: BudgetCapPolicySchema,
  dataResidency: DataResidencyPolicySchema,
  providers: ProviderPolicySchema,
  humanInTheLoop: HumanInTheLoopPolicySchema,
});
export type EnterprisePolicyConfig = z.infer<typeof EnterprisePolicyConfigSchema>;

export const CandidateActionSchema = z.object({
  name: z.string().min(1),
  operation: z.string().min(1),
  isStateMutation: z.boolean().default(false),
  costPaise: z.number().int().nonnegative().default(0),
  containsPii: z.boolean().default(false),
  externalWebhook: z.boolean().default(false),
});
export type CandidateAction = z.infer<typeof CandidateActionSchema>;

export const CandidateNodeSchema = z.object({
  id: z.string().min(1),
  agentName: z.string().min(1),
  estimatedLatencyMs: z.number().int().nonnegative(),
  costPaise: z.number().int().nonnegative(),
  provider: z.string().optional(),
  model: z.string().optional(),
  jurisdiction: JurisdictionSchema.optional(),
  operations: z.array(z.string()).default([]),
});
export type CandidateNode = z.infer<typeof CandidateNodeSchema>;

export const CandidateWorkflowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("Operations"),
  estimatedLatencyMs: z.number().int().nonnegative(),
  costPaise: z.number().int().nonnegative(),
  jurisdiction: JurisdictionSchema.default("US"),
  provider: z.string().default("OPENAI"),
  model: z.string().default("gpt-4o"),
  actions: z.array(CandidateActionSchema).default([]),
  nodes: z.array(CandidateNodeSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CandidateWorkflow = z.infer<typeof CandidateWorkflowSchema>;

export const RuleDiagnosticCategorySchema = z.enum([
  "LATENCY_SLA",
  "BUDGET_CAP",
  "DATA_RESIDENCY",
  "PROVIDER_POLICY",
  "HUMAN_CHECKPOINT",
]);
export type RuleDiagnosticCategory = z.infer<typeof RuleDiagnosticCategorySchema>;

export const RuleDiagnosticSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  category: RuleDiagnosticCategorySchema,
  status: ComplianceVerdictStatusSchema,
  message: z.string(),
  remediationHint: z.string().optional(),
  observedValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  thresholdValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});
export type RuleDiagnostic = z.infer<typeof RuleDiagnosticSchema>;

export const ComplianceCertificatePayloadSchema = z.object({
  workflowId: z.string(),
  workflowName: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  issuer: z.string(),
  policyId: z.string(),
  policyVersion: z.string(),
  verdict: ComplianceVerdictStatusSchema,
  complianceScore: z.number().min(0).max(100),
  jurisdiction: JurisdictionSchema,
  latencySlaCeilingMs: z.number().int(),
  measuredLatencyMs: z.number().int(),
  budgetCapPaise: z.number().int(),
  committedCostPaise: z.number().int(),
  rulesEvaluated: z.array(z.string()),
  rulesPassed: z.array(z.string()),
  issuedAt: z.string(),
  expiresAt: z.string(),
});
export type ComplianceCertificatePayload = z.infer<
  typeof ComplianceCertificatePayloadSchema
>;

export const ComplianceCertificateSchema = z.object({
  id: z.string(),
  certificateNumber: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  issuer: z.string(),
  policyId: z.string(),
  policyVersion: z.string(),
  verdict: ComplianceVerdictStatusSchema,
  complianceScore: z.number().min(0).max(100),
  jurisdiction: JurisdictionSchema,
  latencySlaCeilingMs: z.number().int(),
  measuredLatencyMs: z.number().int(),
  budgetCapPaise: z.number().int(),
  committedCostPaise: z.number().int(),
  rulesEvaluated: z.array(z.string()),
  rulesPassed: z.array(z.string()),
  issuedAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(["ACTIVE", "REVOKED", "EXPIRED"]),
  sha256Signature: z.string(),
  canonicalPayload: z.string(),
});
export type ComplianceCertificate = z.infer<typeof ComplianceCertificateSchema>;

export const PolicyEvaluationVerdictSchema = z.object({
  candidateId: z.string(),
  candidateName: z.string(),
  verdict: ComplianceVerdictStatusSchema,
  overallScore: z.number().min(0).max(100),
  evaluatedAt: z.string(),
  policyVersion: z.string(),
  diagnostics: z.array(RuleDiagnosticSchema),
  summary: z.string(),
  certificate: ComplianceCertificateSchema.optional(),
});
export type PolicyEvaluationVerdict = z.infer<
  typeof PolicyEvaluationVerdictSchema
>;

export const ComplianceAuditRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  workflowId: z.string(),
  workflowName: z.string(),
  evaluator: z.string(),
  verdict: ComplianceVerdictStatusSchema,
  score: z.number(),
  latencyMs: z.number(),
  costPaise: z.number(),
  jurisdiction: JurisdictionSchema,
  certificateId: z.string().optional(),
  certificate: ComplianceCertificateSchema.optional(),
  violationsCount: z.number(),
  checkpointsCount: z.number(),
});
export type ComplianceAuditRecord = z.infer<typeof ComplianceAuditRecordSchema>;
