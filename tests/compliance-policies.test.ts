import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  EnterprisePolicyConfigSchema,
  CandidateWorkflowSchema,
  EnterprisePolicyConfig,
  CandidateWorkflow,
} from "@/lib/contracts/compliance-types";
import {
  DEFAULT_ENTERPRISE_POLICY,
  SAMPLE_CANDIDATE_WORKFLOWS,
} from "@/server/compliance/compliance-seed";
import {
  getActivePolicy,
  updateActivePolicy,
  resetPolicyToDefaults,
  evaluateWorkflowCompliance,
  generateComplianceCertificate,
  verifyComplianceCertificate,
  canonicalJsonStringify,
  computeSha256Digest,
  getComplianceAuditLedger,
} from "@/server/compliance/policy-engine";
import { GET as getPolicyHandler, POST as postPolicyHandler } from "@/app/api/enterprise/policies/route";
import { POST as validateHandler } from "@/app/api/compliance/validate/route";
import { GET as getAuditHandler } from "@/app/api/enterprise/policies/audit/route";

describe("Enterprise Compliance Guardrails, SLA Engine & Policy Validation", () => {
  beforeEach(() => {
    resetPolicyToDefaults();
  });

  describe("1. Schema Validation & Policy Configuration", () => {
    it("validates that default enterprise policy conforms strictly to EnterprisePolicyConfigSchema", () => {
      const parsed = EnterprisePolicyConfigSchema.safeParse(DEFAULT_ENTERPRISE_POLICY);
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      expect(parsed.data.latencySlaCeilingMs).toBe(3500);
      expect(parsed.data.budgetCap.maxBudgetPaise).toBe(5000000);
      expect(parsed.data.budgetCap.requireApprovalAbovePaise).toBe(4000000);
      expect(parsed.data.dataResidency.allowedJurisdictions).toContain("US");
      expect(parsed.data.dataResidency.allowedJurisdictions).toContain("EU");
      expect(parsed.data.providers.forbiddenProviders).toContain("DEEPSEEK");
      expect(parsed.data.humanInTheLoop.requireCheckpointOnStateMutation).toBe(true);
    });

    it("rejects policy configs with negative budget, out-of-range latency, or invalid jurisdictions", () => {
      const invalidPolicy = {
        ...DEFAULT_ENTERPRISE_POLICY,
        latencySlaCeilingMs: -50, // invalid negative latency
        budgetCap: {
          maxBudgetPaise: -100, // invalid negative budget
          requireApprovalAbovePaise: 100,
          currency: "USD" as const,
        },
        dataResidency: {
          primaryJurisdiction: "MARS", // invalid jurisdiction
          enforceSovereignty: true,
          allowedJurisdictions: ["MARS"],
        },
      };

      const parsed = EnterprisePolicyConfigSchema.safeParse(invalidPolicy);
      expect(parsed.success).toBe(false);
    });

    it("validates that all sample candidate workflows conform to CandidateWorkflowSchema", () => {
      for (const sample of SAMPLE_CANDIDATE_WORKFLOWS) {
        const parsed = CandidateWorkflowSchema.safeParse(sample);
        expect(parsed.success, `Candidate ${sample.id} failed validation`).toBe(true);
        expect(Number.isInteger(sample.costPaise)).toBe(true);
        expect(Number.isInteger(sample.estimatedLatencyMs)).toBe(true);
      }
    });
  });

  describe("2. Policy Evaluator: Granular Verdicts & Guardrails", () => {
    it("evaluates a compliant workflow and issues a PASSED verdict with 100/100 score", () => {
      const compliantWorkflow: CandidateWorkflow = SAMPLE_CANDIDATE_WORKFLOWS[0]; // 2150ms, $42, US, Anthropic
      const verdict = evaluateWorkflowCompliance(compliantWorkflow);

      expect(verdict.verdict).toBe("PASSED");
      expect(verdict.overallScore).toBe(100);
      expect(verdict.diagnostics).toHaveLength(5);

      for (const diagnostic of verdict.diagnostics) {
        expect(diagnostic.status).toBe("PASSED");
      }
    });

    it("triggers VIOLATION when candidate latency breaches the SLA ceiling (3,500ms)", () => {
      const highLatencyWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-slow-01",
        estimatedLatencyMs: 4200, // Breaches 3,500ms
      };

      const verdict = evaluateWorkflowCompliance(highLatencyWorkflow);
      expect(verdict.verdict).toBe("VIOLATION");

      const latencyRule = verdict.diagnostics.find((d) => d.category === "LATENCY_SLA");
      expect(latencyRule).toBeDefined();
      expect(latencyRule?.status).toBe("VIOLATION");
      expect(latencyRule?.message).toContain("4,200ms exceeds the maximum allowable SLA ceiling");
      expect(latencyRule?.remediationHint).toBeDefined();
    });

    it("triggers VIOLATION when workflow cost breaches the hard budget cap (₹50,000 / $625)", () => {
      const overBudgetWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-overbudget-01",
        costPaise: 6500000, // ₹65,000 > ₹50,000 max
      };

      const verdict = evaluateWorkflowCompliance(overBudgetWorkflow);
      expect(verdict.verdict).toBe("VIOLATION");

      const budgetRule = verdict.diagnostics.find((d) => d.category === "BUDGET_CAP");
      expect(budgetRule).toBeDefined();
      expect(budgetRule?.status).toBe("VIOLATION");
      expect(budgetRule?.message).toContain("breaches the hard budget ceiling");
    });

    it("triggers CHECKPOINT_REQUIRED when workflow cost exceeds approval threshold ($500 / ₹40,000)", () => {
      const approvalRequiredWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-approval-cost-01",
        costPaise: 4200000, // ₹42,000 > ₹40,000 threshold, but < ₹50,000 max
      };

      const verdict = evaluateWorkflowCompliance(approvalRequiredWorkflow);
      expect(verdict.verdict).toBe("CHECKPOINT_REQUIRED");

      const budgetRule = verdict.diagnostics.find((d) => d.category === "BUDGET_CAP");
      expect(budgetRule).toBeDefined();
      expect(budgetRule?.status).toBe("CHECKPOINT_REQUIRED");
      expect(budgetRule?.message).toContain("mandates managerial approval");
    });

    it("triggers VIOLATION when workflow targets an unauthorized data residency jurisdiction", () => {
      const nonCompliantResidencyWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-foreign-data-01",
        jurisdiction: "GLOBAL", // Policy permits only US and EU
      };

      const verdict = evaluateWorkflowCompliance(nonCompliantResidencyWorkflow);
      expect(verdict.verdict).toBe("VIOLATION");

      const residencyRule = verdict.diagnostics.find((d) => d.category === "DATA_RESIDENCY");
      expect(residencyRule).toBeDefined();
      expect(residencyRule?.status).toBe("VIOLATION");
      expect(residencyRule?.message).toContain("Workflow targets unapproved data residency zones");
    });

    it("triggers VIOLATION on forbidden LLM provider under Blacklist mode", () => {
      const blacklistViolationWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-forbidden-vendor-01",
        provider: "DEEPSEEK",
        model: "deepseek-r1-distill",
      };

      const verdict = evaluateWorkflowCompliance(blacklistViolationWorkflow);
      expect(verdict.verdict).toBe("VIOLATION");

      const providerRule = verdict.diagnostics.find((d) => d.category === "PROVIDER_POLICY");
      expect(providerRule).toBeDefined();
      expect(providerRule?.status).toBe("VIOLATION");
      expect(providerRule?.message).toContain("Forbidden AI assets detected");
    });

    it("triggers VIOLATION on non-whitelisted provider when policy is configured in Whitelist mode", () => {
      const whitelistPolicy: EnterprisePolicyConfig = {
        ...DEFAULT_ENTERPRISE_POLICY,
        providers: {
          ...DEFAULT_ENTERPRISE_POLICY.providers,
          mode: "WHITELIST",
          allowedProviders: ["OPENAI", "ANTHROPIC"],
        },
      };

      const googleWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-google-01",
        provider: "GOOGLE",
      };

      const verdict = evaluateWorkflowCompliance(googleWorkflow, whitelistPolicy);
      expect(verdict.verdict).toBe("VIOLATION");

      const providerRule = verdict.diagnostics.find((d) => d.category === "PROVIDER_POLICY");
      expect(providerRule?.status).toBe("VIOLATION");
      expect(providerRule?.message).toContain("Unauthorized model providers detected: GOOGLE");
    });

    it("triggers CHECKPOINT_REQUIRED for high-risk operations (state mutation, PII export, payment > $500)", () => {
      const mutationWorkflow: CandidateWorkflow = {
        ...SAMPLE_CANDIDATE_WORKFLOWS[0],
        id: "wf-mutation-01",
        actions: [
          {
            name: "Mutate Inventory Table",
            operation: "commit:inventory",
            isStateMutation: true,
            costPaise: 50000,
            containsPii: false,
            externalWebhook: false,
          },
        ],
      };

      const verdict = evaluateWorkflowCompliance(mutationWorkflow);
      expect(verdict.verdict).toBe("CHECKPOINT_REQUIRED");

      const hitlRule = verdict.diagnostics.find((d) => d.category === "HUMAN_CHECKPOINT");
      expect(hitlRule?.status).toBe("CHECKPOINT_REQUIRED");
      expect(hitlRule?.message).toContain("Consequential State Mutation");
    });
  });

  describe("3. Cryptographic Compliance Certificate Generator & Verifier", () => {
    it("generates an immutable SHA-256 signed certificate for an evaluated workflow", () => {
      const workflow = SAMPLE_CANDIDATE_WORKFLOWS[0];
      const verdict = evaluateWorkflowCompliance(workflow);
      const cert = generateComplianceCertificate(workflow, verdict);

      expect(cert.id).toMatch(/^cert_[a-f0-9]{16}$/);
      expect(cert.certificateNumber).toContain("COMP-CERT-");
      expect(cert.workflowId).toBe(workflow.id);
      expect(cert.workflowName).toBe(workflow.name);
      expect(cert.verdict).toBe("PASSED");
      expect(cert.complianceScore).toBe(100);
      expect(cert.issuer).toBe("Forgent Enterprise Policy Authority v1.0");
      expect(cert.sha256Signature).toMatch(/^[a-f0-9]{64}$/);
      expect(cert.canonicalPayload).toBeDefined();

      // Recalculate hash over canonical payload to verify signature integrity
      const expectedDigest = computeSha256Digest(cert.canonicalPayload);
      expect(cert.sha256Signature).toBe(expectedDigest);
    });

    it("cryptographically verifies a valid certificate", () => {
      const workflow = SAMPLE_CANDIDATE_WORKFLOWS[0];
      const verdict = evaluateWorkflowCompliance(workflow);
      const cert = generateComplianceCertificate(workflow, verdict);

      const verification = verifyComplianceCertificate(cert);
      expect(verification.valid).toBe(true);
      expect(verification.error).toBeUndefined();
      expect(verification.calculatedSignature).toBe(cert.sha256Signature);
    });

    it("rejects tampered certificate payload when canonical payload is modified", () => {
      const workflow = SAMPLE_CANDIDATE_WORKFLOWS[0];
      const verdict = evaluateWorkflowCompliance(workflow);
      const cert = generateComplianceCertificate(workflow, verdict);

      // Tamper with payload (e.g. maliciously alter workflowName)
      const tamperedCert = {
        ...cert,
        canonicalPayload: cert.canonicalPayload.replace(
          workflow.name,
          "Malicious Tampered Workflow"
        ),
      };

      const verification = verifyComplianceCertificate(tamperedCert);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain("Cryptographic signature mismatch");
    });

    it("deterministic canonical serialization handles arbitrary object key ordering", () => {
      const obj1 = { b: 2, a: 1, c: { y: 20, x: 10 } };
      const obj2 = { a: 1, c: { x: 10, y: 20 }, b: 2 };

      const json1 = canonicalJsonStringify(obj1);
      const json2 = canonicalJsonStringify(obj2);

      expect(json1).toBe(json2);
      expect(computeSha256Digest(json1)).toBe(computeSha256Digest(json2));
    });
  });

  describe("4. API Endpoints Integration", () => {
    it("GET /api/enterprise/policies returns current active policy configuration", async () => {
      const response = await getPolicyHandler();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.policy).toBeDefined();
      expect(data.policy.latencySlaCeilingMs).toBe(3500);
      expect(data.policy.dataResidency.primaryJurisdiction).toBe("US");
    });

    it("POST /api/enterprise/policies updates active policy configuration and resets on action", async () => {
      // 1. Update latency ceiling to 2800ms
      const updateReq = new NextRequest("http://localhost:3000/api/enterprise/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latencySlaCeilingMs: 2800,
        }),
      });

      const updateRes = await postPolicyHandler(updateReq);
      expect(updateRes.status).toBe(200);
      const updateData = await updateRes.json();
      expect(updateData.success).toBe(true);
      expect(updateData.policy.latencySlaCeilingMs).toBe(2800);

      // Verify active policy in memory changed
      expect(getActivePolicy().latencySlaCeilingMs).toBe(2800);

      // 2. Reset policy
      const resetReq = new NextRequest("http://localhost:3000/api/enterprise/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const resetRes = await postPolicyHandler(resetReq);
      expect(resetRes.status).toBe(200);
      const resetData = await resetRes.json();
      expect(resetData.success).toBe(true);
      expect(resetData.policy.latencySlaCeilingMs).toBe(3500);
    });

    it("POST /api/compliance/validate evaluates candidate workflow and issues certificate", async () => {
      const candidate = SAMPLE_CANDIDATE_WORKFLOWS[0];
      const validateReq = new NextRequest("http://localhost:3000/api/compliance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate }),
      });

      const validateRes = await validateHandler(validateReq);
      expect(validateRes.status).toBe(200);

      const data = await validateRes.json();
      expect(data.success).toBe(true);
      expect(data.verdict).toBeDefined();
      expect(data.verdict.verdict).toBe("PASSED");
      expect(data.verdict.overallScore).toBe(100);
      expect(data.certificate).toBeDefined();
      expect(data.certificate.sha256Signature).toBeDefined();
    });

    it("GET /api/enterprise/policies/audit returns compliance history and signed certificates", async () => {
      const auditReq = new NextRequest("http://localhost:3000/api/enterprise/policies/audit?limit=10");
      const auditRes = await getAuditHandler(auditReq);
      expect(auditRes.status).toBe(200);

      const data = await auditRes.json();
      expect(data.success).toBe(true);
      expect(data.auditLogs.length).toBeGreaterThanOrEqual(1);
      expect(data.certificates.length).toBeGreaterThanOrEqual(1);
      expect(data.certificates[0].sha256Signature).toBeDefined();
    });
  });
});
