import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CandidateWorkflow,
  CandidateWorkflowSchema,
  EnterprisePolicyConfigSchema,
} from "@/lib/contracts/compliance-types";
import {
  evaluateWorkflowCompliance,
  generateComplianceCertificate,
  recordComplianceAudit,
  getActivePolicy,
} from "@/server/compliance/policy-engine";

const ValidateRequestSchema = z.object({
  candidate: CandidateWorkflowSchema.optional(),
  // Flexible direct payload or EnterprisePipeline compatibility
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  estimatedLatencyMs: z.number().int().nonnegative().optional(),
  costPaise: z.number().int().nonnegative().optional(),
  jurisdiction: z.enum(["US", "EU", "INDIA", "GLOBAL"]).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  actions: z
    .array(
      z.object({
        name: z.string(),
        operation: z.string(),
        isStateMutation: z.boolean().optional(),
        costPaise: z.number().int().nonnegative().optional(),
        containsPii: z.boolean().optional(),
        externalWebhook: z.boolean().optional(),
      })
    )
    .optional(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        agentName: z.string(),
        estimatedLatencyMs: z.number().int().nonnegative(),
        costPaise: z.number().int().nonnegative(),
        provider: z.string().optional(),
        model: z.string().optional(),
        jurisdiction: z.enum(["US", "EU", "INDIA", "GLOBAL"]).optional(),
        operations: z.array(z.string()).optional(),
      })
    )
    .optional(),
  policyOverride: EnterprisePolicyConfigSchema.partial().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = ValidateRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid candidate workflow evaluation payload",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Normalize candidate
    const candidateInput: CandidateWorkflow = data.candidate || {
      id: data.id || `candidate_${Date.now().toString(36)}`,
      name: data.name || "Ad-Hoc Candidate Workflow",
      category: data.category || "Operations",
      estimatedLatencyMs: data.estimatedLatencyMs ?? 2500,
      costPaise: data.costPaise ?? 200000,
      jurisdiction: data.jurisdiction || "US",
      provider: data.provider || "OPENAI",
      model: data.model || "gpt-4o",
      actions: (data.actions || []).map((a) => ({
        name: a.name,
        operation: a.operation,
        isStateMutation: Boolean(a.isStateMutation),
        costPaise: a.costPaise ?? 0,
        containsPii: Boolean(a.containsPii),
        externalWebhook: Boolean(a.externalWebhook),
      })),
      nodes: (data.nodes || []).map((n) => ({
        id: n.id,
        agentName: n.agentName,
        estimatedLatencyMs: n.estimatedLatencyMs,
        costPaise: n.costPaise,
        provider: n.provider,
        model: n.model,
        jurisdiction: n.jurisdiction,
        operations: n.operations || [],
      })),
    };

    const activePolicy = getActivePolicy();
    const policyToUse = data.policyOverride
      ? { ...activePolicy, ...data.policyOverride }
      : activePolicy;

    const verdict = evaluateWorkflowCompliance(candidateInput, policyToUse);

    // If passed or checkpoint required, generate cryptographic certificate
    const certificate =
      verdict.verdict !== "VIOLATION"
        ? generateComplianceCertificate(candidateInput, verdict, policyToUse)
        : undefined;

    if (certificate) {
      verdict.certificate = certificate;
    }

    // Record into compliance audit ledger
    recordComplianceAudit({
      id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      workflowId: candidateInput.id,
      workflowName: candidateInput.name,
      evaluator: "Forgent Policy Engine v2.1",
      verdict: verdict.verdict,
      score: verdict.overallScore,
      latencyMs: candidateInput.estimatedLatencyMs,
      costPaise: candidateInput.costPaise,
      jurisdiction: candidateInput.jurisdiction,
      certificateId: certificate?.id,
      certificate,
      violationsCount: verdict.diagnostics.filter((d) => d.status === "VIOLATION").length,
      checkpointsCount: verdict.diagnostics.filter(
        (d) => d.status === "CHECKPOINT_REQUIRED"
      ).length,
    });

    return NextResponse.json({
      success: true,
      verdict,
      certificate,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal error evaluating workflow compliance",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
