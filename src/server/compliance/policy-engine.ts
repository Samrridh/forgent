import crypto from "crypto";
import {
  EnterprisePolicyConfig,
  CandidateWorkflow,
  PolicyEvaluationVerdict,
  RuleDiagnostic,
  ComplianceCertificate,
  ComplianceCertificatePayload,
  ComplianceAuditRecord,
  Jurisdiction,
  ComplianceVerdictStatus,
} from "@/lib/contracts/compliance-types";
import {
  DEFAULT_ENTERPRISE_POLICY,
  SAMPLE_CANDIDATE_WORKFLOWS,
} from "./compliance-seed";

/**
 * Deterministically serializes values to canonical JSON.
 * Recursively sorts keys for SHA-256 cryptographic reproducibility.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJsonStringify).join(",") + "]";
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`
  );
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes a SHA-256 digest of any canonical payload string.
 */
export function computeSha256Digest(payload: string): string {
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * In-memory mutable enterprise policy store.
 */
let activePolicy: EnterprisePolicyConfig = { ...DEFAULT_ENTERPRISE_POLICY };

/**
 * In-memory compliance audit ledger store.
 */
const auditLedgerStore: ComplianceAuditRecord[] = [];

/**
 * Initializes baseline audit ledger entries if empty.
 */
function ensureAuditLedgerInitialized(): void {
  if (auditLedgerStore.length > 0) return;

  // Pre-seed with evaluation for the default compliant workflow
  const baseWorkflow = SAMPLE_CANDIDATE_WORKFLOWS[0];
  const verdict = evaluateWorkflowCompliance(baseWorkflow, activePolicy);
  const cert = generateComplianceCertificate(baseWorkflow, verdict, activePolicy);

  auditLedgerStore.push({
    id: "audit_ledger_init_01",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    workflowId: baseWorkflow.id,
    workflowName: baseWorkflow.name,
    evaluator: "Forgent Policy Engine v2.1",
    verdict: verdict.verdict,
    score: verdict.overallScore,
    latencyMs: baseWorkflow.estimatedLatencyMs,
    costPaise: baseWorkflow.costPaise,
    jurisdiction: baseWorkflow.jurisdiction,
    certificateId: cert.id,
    certificate: cert,
    violationsCount: verdict.diagnostics.filter((d) => d.status === "VIOLATION").length,
    checkpointsCount: verdict.diagnostics.filter((d) => d.status === "CHECKPOINT_REQUIRED").length,
  });

  const highRiskWorkflow = SAMPLE_CANDIDATE_WORKFLOWS[1];
  const highRiskVerdict = evaluateWorkflowCompliance(highRiskWorkflow, activePolicy);
  auditLedgerStore.push({
    id: "audit_ledger_init_02",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    workflowId: highRiskWorkflow.id,
    workflowName: highRiskWorkflow.name,
    evaluator: "Forgent Policy Engine v2.1",
    verdict: highRiskVerdict.verdict,
    score: highRiskVerdict.overallScore,
    latencyMs: highRiskWorkflow.estimatedLatencyMs,
    costPaise: highRiskWorkflow.costPaise,
    jurisdiction: highRiskWorkflow.jurisdiction,
    violationsCount: highRiskVerdict.diagnostics.filter((d) => d.status === "VIOLATION").length,
    checkpointsCount: highRiskVerdict.diagnostics.filter((d) => d.status === "CHECKPOINT_REQUIRED").length,
  });
}

/**
 * Retrieves active enterprise governance policy configuration.
 */
export function getActivePolicy(): EnterprisePolicyConfig {
  return { ...activePolicy };
}

/**
 * Updates active enterprise policy configuration with partial updates.
 */
export function updateActivePolicy(
  updates: Partial<EnterprisePolicyConfig>
): EnterprisePolicyConfig {
  activePolicy = {
    ...activePolicy,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return { ...activePolicy };
}

/**
 * Resets active enterprise policy to baseline defaults.
 */
export function resetPolicyToDefaults(): EnterprisePolicyConfig {
  activePolicy = {
    ...DEFAULT_ENTERPRISE_POLICY,
    updatedAt: new Date().toISOString(),
  };
  return { ...activePolicy };
}

/**
 * Evaluates candidate workflow or job specification against active policy guardrails.
 */
export function evaluateWorkflowCompliance(
  candidate: CandidateWorkflow,
  policy: EnterprisePolicyConfig = activePolicy
): PolicyEvaluationVerdict {
  const diagnostics: RuleDiagnostic[] = [];

  // 1. Latency SLA Ceiling Rule
  const measuredLatency = Math.max(
    candidate.estimatedLatencyMs,
    ...candidate.nodes.map((n) => n.estimatedLatencyMs),
    0
  );

  if (measuredLatency > policy.latencySlaCeilingMs) {
    diagnostics.push({
      ruleId: "RULE-LATENCY-SLA-01",
      ruleName: "Maximum Allowable Latency SLA Ceiling",
      category: "LATENCY_SLA",
      status: "VIOLATION",
      message: `Workflow latency of ${measuredLatency.toLocaleString()}ms exceeds the maximum allowable SLA ceiling of ${policy.latencySlaCeilingMs.toLocaleString()}ms.`,
      remediationHint:
        "Optimize stage parallelism, downgrade LLM context window size, or submit an SLA ceiling variance request.",
      observedValue: `${measuredLatency}ms`,
      thresholdValue: `${policy.latencySlaCeilingMs}ms`,
    });
  } else {
    diagnostics.push({
      ruleId: "RULE-LATENCY-SLA-01",
      ruleName: "Maximum Allowable Latency SLA Ceiling",
      category: "LATENCY_SLA",
      status: "PASSED",
      message: `Workflow latency of ${measuredLatency.toLocaleString()}ms satisfies enterprise SLA ceiling (${policy.latencySlaCeilingMs.toLocaleString()}ms).`,
      observedValue: `${measuredLatency}ms`,
      thresholdValue: `${policy.latencySlaCeilingMs}ms`,
    });
  }

  // 2. Task Budget Limit & Managerial Approval Threshold Rule
  const measuredCostPaise = Math.max(
    candidate.costPaise,
    candidate.nodes.reduce((acc, n) => acc + n.costPaise, 0)
  );
  const costFormatted = `₹${(measuredCostPaise / 100).toLocaleString()} ($${(
    measuredCostPaise / 8000
  ).toFixed(2)})`;
  const maxCapFormatted = `₹${(
    policy.budgetCap.maxBudgetPaise / 100
  ).toLocaleString()} ($${(policy.budgetCap.maxBudgetPaise / 8000).toFixed(2)})`;
  const approvalFormatted = `₹${(
    policy.budgetCap.requireApprovalAbovePaise / 100
  ).toLocaleString()} ($${(
    policy.budgetCap.requireApprovalAbovePaise / 8000
  ).toFixed(2)})`;

  if (measuredCostPaise > policy.budgetCap.maxBudgetPaise) {
    diagnostics.push({
      ruleId: "RULE-BUDGET-CAP-02",
      ruleName: "Enterprise Task Budget Hard Ceiling",
      category: "BUDGET_CAP",
      status: "VIOLATION",
      message: `Total execution commitment ${costFormatted} breaches the hard budget ceiling of ${maxCapFormatted}.`,
      remediationHint:
        "De-scope pipeline steps, substitute high-cost reasoning models, or allocate supplemental departmental budget.",
      observedValue: measuredCostPaise,
      thresholdValue: policy.budgetCap.maxBudgetPaise,
    });
  } else if (measuredCostPaise > policy.budgetCap.requireApprovalAbovePaise) {
    diagnostics.push({
      ruleId: "RULE-BUDGET-CAP-02",
      ruleName: "Enterprise Task Budget Hard Ceiling",
      category: "BUDGET_CAP",
      status: "CHECKPOINT_REQUIRED",
      message: `Execution budget ${costFormatted} exceeds the automatic dispatch threshold of ${approvalFormatted} and mandates managerial approval.`,
      remediationHint:
        "Route execution proposal to an authorized department manager for cryptographic sign-off.",
      observedValue: measuredCostPaise,
      thresholdValue: policy.budgetCap.requireApprovalAbovePaise,
    });
  } else {
    diagnostics.push({
      ruleId: "RULE-BUDGET-CAP-02",
      ruleName: "Enterprise Task Budget Hard Ceiling",
      category: "BUDGET_CAP",
      status: "PASSED",
      message: `Execution commitment ${costFormatted} is within the autonomous authorization threshold.`,
      observedValue: measuredCostPaise,
      thresholdValue: policy.budgetCap.requireApprovalAbovePaise,
    });
  }

  // 3. Data Residency Sovereignty Rule
  const observedJurisdictions = new Set<Jurisdiction>();
  if (candidate.jurisdiction) observedJurisdictions.add(candidate.jurisdiction);
  for (const n of candidate.nodes) {
    if (n.jurisdiction) observedJurisdictions.add(n.jurisdiction);
  }

  if (policy.dataResidency.enforceSovereignty) {
    const nonCompliantJurisdictions = Array.from(observedJurisdictions).filter(
      (j) => !policy.dataResidency.allowedJurisdictions.includes(j)
    );

    if (nonCompliantJurisdictions.length > 0) {
      diagnostics.push({
        ruleId: "RULE-DATA-RESIDENCY-03",
        ruleName: "Data Sovereignty & Jurisdictional Containment",
        category: "DATA_RESIDENCY",
        status: "VIOLATION",
        message: `Workflow targets unapproved data residency zones (${nonCompliantJurisdictions.join(
          ", "
        )}). Organization mandates execution strictly within: ${policy.dataResidency.allowedJurisdictions.join(
          ", "
        )}.`,
        remediationHint:
          "Re-route agent runner network egress to sovereign cloud zones in permitted jurisdictions.",
        observedValue: nonCompliantJurisdictions.join(", "),
        thresholdValue: policy.dataResidency.allowedJurisdictions.join(", "),
      });
    } else {
      diagnostics.push({
        ruleId: "RULE-DATA-RESIDENCY-03",
        ruleName: "Data Sovereignty & Jurisdictional Containment",
        category: "DATA_RESIDENCY",
        status: "PASSED",
        message: `Execution location (${Array.from(observedJurisdictions).join(
          ", "
        )}) satisfies all enterprise sovereign data residency mandates.`,
        observedValue: Array.from(observedJurisdictions).join(", "),
        thresholdValue: policy.dataResidency.allowedJurisdictions.join(", "),
      });
    }
  } else {
    diagnostics.push({
      ruleId: "RULE-DATA-RESIDENCY-03",
      ruleName: "Data Sovereignty & Jurisdictional Containment",
      category: "DATA_RESIDENCY",
      status: "PASSED",
      message: "Data sovereignty enforcement is configured in non-blocking permissive mode.",
    });
  }

  // 4. Provider Whitelist / Blacklist Rule
  const observedProviders = new Set<string>();
  const observedModels = new Set<string>();

  if (candidate.provider) observedProviders.add(candidate.provider.toUpperCase());
  if (candidate.model) observedModels.add(candidate.model.toLowerCase());

  for (const n of candidate.nodes) {
    if (n.provider) observedProviders.add(n.provider.toUpperCase());
    if (n.model) observedModels.add(n.model.toLowerCase());
  }

  if (policy.providers.mode === "BLACKLIST") {
    const forbiddenProvidersDetected = Array.from(observedProviders).filter((p) =>
      policy.providers.forbiddenProviders.map((fp) => fp.toUpperCase()).includes(p)
    );
    const forbiddenModelsDetected = Array.from(observedModels).filter((m) =>
      policy.providers.forbiddenModels.map((fm) => fm.toLowerCase()).includes(m)
    );

    if (forbiddenProvidersDetected.length > 0 || forbiddenModelsDetected.length > 0) {
      const issues = [
        ...forbiddenProvidersDetected.map((p) => `provider '${p}'`),
        ...forbiddenModelsDetected.map((m) => `model '${m}'`),
      ];
      diagnostics.push({
        ruleId: "RULE-PROVIDER-GOVERNANCE-04",
        ruleName: "LLM Provider & Model Tier Whitelist/Blacklist",
        category: "PROVIDER_POLICY",
        status: "VIOLATION",
        message: `Forbidden AI assets detected: ${issues.join(
          ", "
        )}. This provider or model is blocked under enterprise risk policies.`,
        remediationHint:
          "Replace prohibited models with sanctioned alternatives (OpenAI, Anthropic Claude, Google Gemini).",
        observedValue: issues.join(", "),
        thresholdValue: "No blacklisted vendors",
      });
    } else {
      diagnostics.push({
        ruleId: "RULE-PROVIDER-GOVERNANCE-04",
        ruleName: "LLM Provider & Model Tier Whitelist/Blacklist",
        category: "PROVIDER_POLICY",
        status: "PASSED",
        message: `All model providers (${Array.from(observedProviders).join(
          ", "
        )}) comply with enterprise security baseline.`,
        observedValue: Array.from(observedProviders).join(", "),
      });
    }
  } else {
    // WHITELIST mode
    const unapprovedProviders = Array.from(observedProviders).filter(
      (p) =>
        !policy.providers.allowedProviders
          .map((ap) => ap.toUpperCase())
          .includes(p)
    );

    if (unapprovedProviders.length > 0) {
      diagnostics.push({
        ruleId: "RULE-PROVIDER-GOVERNANCE-04",
        ruleName: "LLM Provider & Model Tier Whitelist/Blacklist",
        category: "PROVIDER_POLICY",
        status: "VIOLATION",
        message: `Unauthorized model providers detected: ${unapprovedProviders.join(
          ", "
        )}. Whitelist mandates: ${policy.providers.allowedProviders.join(", ")}.`,
        remediationHint:
          "Select a verified provider present on the enterprise whitelist.",
        observedValue: unapprovedProviders.join(", "),
        thresholdValue: policy.providers.allowedProviders.join(", "),
      });
    } else {
      diagnostics.push({
        ruleId: "RULE-PROVIDER-GOVERNANCE-04",
        ruleName: "LLM Provider & Model Tier Whitelist/Blacklist",
        category: "PROVIDER_POLICY",
        status: "PASSED",
        message: `All model providers (${Array.from(observedProviders).join(
          ", "
        )}) are certified enterprise whitelist vendors.`,
      });
    }
  }

  // 5. Mandatory Human-in-the-Loop (HITL) Checkpoint Triggers Rule
  const hitlTriggers: string[] = [];

  // Check state mutations
  const hasStateMutation =
    candidate.actions.some((a) => a.isStateMutation) ||
    candidate.nodes.some((n) =>
      n.operations.some((op) =>
        policy.humanInTheLoop.restrictedOperations.includes(op) ||
        op.includes("mutate") ||
        op.includes("drop") ||
        op.includes("commit")
      )
    ) ||
    candidate.actions.some((a) =>
      policy.humanInTheLoop.restrictedOperations.includes(a.operation)
    );

  if (policy.humanInTheLoop.requireCheckpointOnStateMutation && hasStateMutation) {
    hitlTriggers.push("Consequential State Mutation");
  }

  // Check payment threshold
  const maxActionCostPaise = Math.max(
    ...candidate.actions.map((a) => a.costPaise),
    0
  );
  if (
    maxActionCostPaise >
      policy.humanInTheLoop.requireCheckpointOnPaymentAbovePaise ||
    (candidate.actions.some((a) => a.operation.includes("payout") || a.operation.includes("transfer")) &&
      measuredCostPaise > policy.humanInTheLoop.requireCheckpointOnPaymentAbovePaise)
  ) {
    hitlTriggers.push("Payment Exceeding $500 Threshold");
  }

  // Check PII export
  const hasPiiExport = candidate.actions.some(
    (a) => a.containsPii || a.operation.includes("pii") || a.operation.includes("export")
  );
  if (policy.humanInTheLoop.requireCheckpointOnPiiExport && hasPiiExport) {
    hitlTriggers.push("Sensitive PII Data Export");
  }

  // Check untrusted webhook
  const hasExternalWebhook = candidate.actions.some(
    (a) => a.externalWebhook || a.operation.includes("egress") || a.operation.includes("webhook")
  );
  if (policy.humanInTheLoop.requireCheckpointOnExternalWebhook && hasExternalWebhook) {
    hitlTriggers.push("External Untrusted Webhook Egress");
  }

  if (hitlTriggers.length > 0) {
    diagnostics.push({
      ruleId: "RULE-HUMAN-CHECKPOINT-05",
      ruleName: "Mandatory Human-in-the-Loop (HITL) Checkpoint Triggers",
      category: "HUMAN_CHECKPOINT",
      status: "CHECKPOINT_REQUIRED",
      message: `Autonomous execution held. High-risk operations detected: ${hitlTriggers.join(
        ", "
      )}. Human approval checkpoint mandated before dispatch.`,
      remediationHint:
        "Attach a verified managerial authentication token or confirm human checkpoint in the operations queue.",
      observedValue: hitlTriggers.join(", "),
      thresholdValue: "Zero unverified high-risk operations",
    });
  } else {
    diagnostics.push({
      ruleId: "RULE-HUMAN-CHECKPOINT-05",
      ruleName: "Mandatory Human-in-the-Loop (HITL) Checkpoint Triggers",
      category: "HUMAN_CHECKPOINT",
      status: "PASSED",
      message:
        "Zero high-risk state mutations or unauthorized external egress calls detected. Automated autonomous execution permitted.",
    });
  }

  // Compute Overall Verdict and Score
  const hasViolation = diagnostics.some((d) => d.status === "VIOLATION");
  const hasCheckpoint = diagnostics.some((d) => d.status === "CHECKPOINT_REQUIRED");

  let overallVerdict: ComplianceVerdictStatus = "PASSED";
  if (hasViolation) {
    overallVerdict = "VIOLATION";
  } else if (hasCheckpoint) {
    overallVerdict = "CHECKPOINT_REQUIRED";
  }

  // Scoring: 20 points per rule (PASSED: 20, CHECKPOINT_REQUIRED: 10, VIOLATION: 0)
  const scorePerRule: number[] = diagnostics.map((d) => {
    if (d.status === "PASSED") return 20;
    if (d.status === "CHECKPOINT_REQUIRED") return 10;
    return 0;
  });
  const overallScore = scorePerRule.reduce<number>((sum, score) => sum + score, 0);

  const summary =
    overallVerdict === "PASSED"
      ? `Workflow "${candidate.name}" complied with all 5 active enterprise compliance guardrails (Score: ${overallScore}/100).`
      : overallVerdict === "CHECKPOINT_REQUIRED"
      ? `Workflow "${candidate.name}" requires managerial human-in-the-loop sign-off before dispatch (Score: ${overallScore}/100).`
      : `Workflow "${candidate.name}" breached enterprise compliance policies and autonomous dispatch is blocked (Score: ${overallScore}/100).`;

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    verdict: overallVerdict,
    overallScore,
    evaluatedAt: new Date().toISOString(),
    policyVersion: policy.version,
    diagnostics,
    summary,
  };
}

/**
 * Generates an immutable, cryptographically signed SHA-256 compliance certificate.
 */
export function generateComplianceCertificate(
  candidate: CandidateWorkflow,
  verdict: PolicyEvaluationVerdict,
  policy: EnterprisePolicyConfig = activePolicy
): ComplianceCertificate {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(); // 90 days validity

  const rulesEvaluated = verdict.diagnostics.map((d) => d.ruleName);
  const rulesPassed = verdict.diagnostics
    .filter((d) => d.status === "PASSED")
    .map((d) => d.ruleName);

  const payload: ComplianceCertificatePayload = {
    workflowId: candidate.id,
    workflowName: candidate.name,
    organizationId: policy.orgId,
    organizationName: "Acme Global Logistics Inc.",
    issuer: "Forgent Enterprise Policy Authority v1.0",
    policyId: policy.id,
    policyVersion: policy.version,
    verdict: verdict.verdict,
    complianceScore: verdict.overallScore,
    jurisdiction: candidate.jurisdiction,
    latencySlaCeilingMs: policy.latencySlaCeilingMs,
    measuredLatencyMs: candidate.estimatedLatencyMs,
    budgetCapPaise: policy.budgetCap.maxBudgetPaise,
    committedCostPaise: candidate.costPaise,
    rulesEvaluated,
    rulesPassed,
    issuedAt,
    expiresAt,
  };

  const canonicalPayload = canonicalJsonStringify(payload);
  const sha256Signature = computeSha256Digest(canonicalPayload);
  const id = `cert_${sha256Signature.slice(0, 16)}`;
  const certificateNumber = `COMP-CERT-${Date.now().toString(36).toUpperCase()}-${sha256Signature.slice(0, 6).toUpperCase()}`;

  return {
    id,
    certificateNumber,
    ...payload,
    status: "ACTIVE",
    sha256Signature,
    canonicalPayload,
  };
}

/**
 * Cryptographically verifies a compliance certificate against its SHA-256 signature.
 */
export function verifyComplianceCertificate(cert: ComplianceCertificate): {
  valid: boolean;
  calculatedSignature: string;
  providedSignature: string;
  error?: string;
} {
  try {
    const calculatedSignature = computeSha256Digest(cert.canonicalPayload);
    const valid = calculatedSignature === cert.sha256Signature;
    return {
      valid,
      calculatedSignature,
      providedSignature: cert.sha256Signature,
      error: valid ? undefined : "Cryptographic signature mismatch. Payload integrity compromised.",
    };
  } catch (err) {
    return {
      valid: false,
      calculatedSignature: "",
      providedSignature: cert.sha256Signature,
      error: err instanceof Error ? err.message : "Unknown verification error",
    };
  }
}

/**
 * Returns compliance audit ledger entries.
 */
export function getComplianceAuditLedger(limit: number = 50): ComplianceAuditRecord[] {
  ensureAuditLedgerInitialized();
  return auditLedgerStore.slice(0, limit);
}

/**
 * Appends a new compliance audit ledger entry.
 */
export function recordComplianceAudit(record: ComplianceAuditRecord): void {
  ensureAuditLedgerInitialized();
  auditLedgerStore.unshift(record);
}
