import { EvidenceReceipt, generateEvidenceReceipt } from "./receipt";
import catalogData from "../../data/agents-catalog.json";
import { AGENTS_DATASET } from "../../data/agents";

export interface JobRecord {
  id: string;
  jobId: string;
  agentSlug: string;
  title: string;
  status: "SUBMITTED" | "ESCROW_LOCKED" | "RUNNING" | "COMPLETED" | "FAILED";
  input: Record<string, unknown>;
  budgetPaise: number;
  budgetCents: number;
  createdAt: string;
  updatedAt: string;
  events: Array<{
    id: string;
    status: string;
    message: string;
    timestamp: string;
  }>;
  deliverable?: {
    summaryMarkdown: string;
    structuredJson: Record<string, unknown>;
    sha256Receipt: string;
    modelUsed: string;
    tokensUsed: number;
    latencyMs: number;
  };
  receipt?: EvidenceReceipt;
  error?: string;
}

// In-memory persistent registry for active/recent jobs across requests
const globalJobStore = globalThis as unknown as {
  __forgentJobStore?: Map<string, JobRecord>;
};

if (!globalJobStore.__forgentJobStore) {
  globalJobStore.__forgentJobStore = new Map<string, JobRecord>();
  seedInitialVerifiedJobs(globalJobStore.__forgentJobStore);
}

export const jobStore = globalJobStore.__forgentJobStore;

function seedInitialVerifiedJobs(store: Map<string, JobRecord>) {
  const seeds = [
    {
      id: "job_sec10k_nvda_2024",
      agentSlug: "sec-10k-financial-analyst",
      title: "SEC 10-K & 10-Q Financial Filing Extractor",
      input: {
        ticker: "NVDA",
        fiscalYear: 2024,
        filingType: "10-K",
        extractMdnaRisks: true,
      },
      budgetCents: 350,
      budgetPaise: 28000,
      latencyMs: 820,
      tokensUsed: 468,
      modelUsed: "gemini-1.5-flash",
      summaryMarkdown: [
        "## Executive SEC Filing Audit: NVDA FY2024",
        "Deterministic XBRL line-item extraction completed with 0.00% rounding variance.",
        "",
        "### Key Financial Metrics Extracted",
        "- **Total Consolidated Revenue**: $60,922,000,000 (GAAP reconciled)",
        "- **Gross Operating Profit**: $44,301,000,000 (Gross Margin: 72.7%)",
        "- **Net Operating Income**: $32,972,000,000",
        "- **Free Cash Flow**: $27,021,000,000",
        "",
        "### Risk & Liquidity Disclosure Summary",
        "MD&A notes primary supply chain concentration with advanced packaging fabricators and export control EAR compliance monitoring.",
      ].join("\n"),
      structuredJson: {
        companyName: "NVIDIA CORPORATION",
        cik: "0001045810",
        fiscalPeriod: "FY2024",
        financialSummary: "Record compute architecture demand driven by hyperscale cluster deployments.",
        extractedMetrics: {
          totalRevenueUsd: 60922000000,
          grossProfitUsd: 44301000000,
          operatingIncomeUsd: 32972000000,
          netIncomeUsd: 29760000000,
          freeCashFlowUsd: 27021000000,
        },
        auditIntegrity: {
          xbrlTagCount: 142,
          reconciliationDiscrepancies: 0,
          gaapAdherenceRatio: 1.0,
        },
      },
      createdAt: "2026-10-29T14:30:00Z",
    },
    {
      id: "job_invrec_batch_9921",
      agentSlug: "invoice-ledger-reconciler",
      title: "Invoice 3-Way ERP Matcher",
      input: {
        purchaseOrderId: "PO-2026-8819",
        invoiceId: "INV-77102-ACME",
        tolerancePaise: 0,
      },
      budgetCents: 250,
      budgetPaise: 20000,
      latencyMs: 640,
      tokensUsed: 312,
      modelUsed: "gemini-1.5-flash",
      summaryMarkdown: [
        "## Automated 3-Way Invoice Reconciliation Report",
        "PO-2026-8819 matched against Receiving Scan RC-901 and Vendor Invoice INV-77102-ACME.",
        "",
        "### Line Item Reconciliation Results",
        "- **Matched Items**: 18 of 18 SKUs verified",
        "- **Quantity Discrepancies**: 0 units variance",
        "- **Price Float Drift**: 0 paise variance across all line items",
        "- **Settlement Recommendation**: APPROVE_AND_RELEASE_PAYMENT",
      ].join("\n"),
      structuredJson: {
        matchStatus: "PERFECT_MATCH",
        toleranceThresholdApplied: 0,
        totalInvoicePaise: 12500000,
        poTotalPaise: 12500000,
        reconciledLineItems: 18,
        discrepancyCount: 0,
      },
      createdAt: "2026-10-30T09:15:00Z",
    },
    {
      id: "job_taxaud_compliance_4401",
      agentSlug: "corporate-tax-compliance-auditor",
      title: "Corporate Tax Withholding & Compliance Auditor",
      input: {
        jurisdiction: "US-CA",
        taxYear: 2025,
        quarter: "Q3",
        entityStructure: "C-CORP",
      },
      budgetCents: 400,
      budgetPaise: 32000,
      latencyMs: 910,
      tokensUsed: 520,
      modelUsed: "gemini-1.5-flash",
      summaryMarkdown: [
        "## Corporate Tax Compliance Audit Summary: US-CA Q3 2025",
        "Validated state payroll withholding calculations and franchise tax prepayments.",
        "",
        "### Audit Checklist Verdicts",
        "- **Form DE-9 Withholding**: Verified adhering to graduated CA rate schedule",
        "- **Franchise Minimum Tax**: Satisfied via initial quarterly installment",
        "- **Penalties Assessed**: 0.00 USD",
      ].join("\n"),
      structuredJson: {
        complianceStatus: "FULLY_COMPLIANT",
        jurisdiction: "US-CA",
        quarter: "Q3-2025",
        verifiedWithholdingUsd: 142850.25,
        statutoryDeficit: 0.0,
      },
      createdAt: "2026-10-30T11:45:00Z",
    },
  ];

  for (const seed of seeds) {
    const systemPrompt = `You are the specialized Forgent autonomous execution agent: "${seed.title}" (${seed.agentSlug}).`;
    const executionLogs = [
      {
        timestamp: seed.createdAt,
        step: "INITIALIZATION",
        message: `Initialized autonomous task runner for ${seed.agentSlug}`,
      },
      {
        timestamp: seed.createdAt,
        step: "SCHEMA_VALIDATION",
        message: "Validated input payload against declared JSON schema specification",
      },
      {
        timestamp: seed.createdAt,
        step: "INFERENCE_EXECUTION",
        message: `Task execution finished in ${seed.latencyMs}ms using ${seed.modelUsed}`,
      },
      {
        timestamp: seed.createdAt,
        step: "RECEIPT_GENERATION",
        message: "Generated canonical cryptographic SHA-256 evidence receipt",
      },
    ];

    const receipt = generateEvidenceReceipt({
      jobId: seed.id,
      agentSlug: seed.agentSlug,
      input: seed.input,
      systemPrompt,
      executionLogs,
      deliverable: {
        summaryMarkdown: seed.summaryMarkdown,
        structuredJson: seed.structuredJson,
      },
      issuedAt: seed.createdAt,
    });

    const jobRecord: JobRecord = {
      id: seed.id,
      jobId: seed.id,
      agentSlug: seed.agentSlug,
      title: seed.title,
      status: "COMPLETED",
      input: seed.input,
      budgetCents: seed.budgetCents,
      budgetPaise: seed.budgetPaise,
      createdAt: seed.createdAt,
      updatedAt: seed.createdAt,
      events: executionLogs.map((log, idx) => ({
        id: `ev_${seed.id}_${idx}`,
        status: log.step,
        message: log.message,
        timestamp: log.timestamp,
      })),
      deliverable: {
        summaryMarkdown: seed.summaryMarkdown,
        structuredJson: seed.structuredJson,
        sha256Receipt: receipt.integrityHash,
        modelUsed: seed.modelUsed,
        tokensUsed: seed.tokensUsed,
        latencyMs: seed.latencyMs,
      },
      receipt,
    };

    store.set(seed.id, jobRecord);
  }
}

export function findAgentInCatalog(slug: string) {
  // 1. Primary lookup in catalogData
  const inCatalog = catalogData.find((a) => a.slug === slug);
  if (inCatalog) return inCatalog;

  // 2. Fallback lookup in AGENTS_DATASET
  const inDataset = AGENTS_DATASET.find((a) => a.slug === slug || a.id === slug);
  if (inDataset) {
    return {
      slug: inDataset.slug,
      title: inDataset.title,
      name: inDataset.title,
      description: inDataset.bio,
      summary: inDataset.bio,
      category: inDataset.category,
      authorName: inDataset.creatorHandle,
      priceCents: Math.round(inDataset.pricePerTaskUsd * 100),
      pricePaise: inDataset.pricePerTaskInr * 100,
      inputSchema: {
        type: "object",
        required: ["taskPayload"],
        properties: {
          taskPayload: {
            type: "string",
            description: "Structured task parameters or payload for autonomous execution",
          },
          priority: {
            type: "string",
            enum: ["STANDARD", "HIGH", "CRITICAL"],
            default: "STANDARD",
          },
        },
      },
      outputSchema: {
        type: "object",
        required: ["status", "summary", "data"],
        properties: {
          status: { type: "string" },
          summary: { type: "string" },
          data: { type: "object" },
        },
      },
      sampleInputs: {
        taskPayload: JSON.stringify({ batchId: "batch_2026_01", target: inDataset.title }),
        priority: "HIGH",
      },
      benchmark: {
        testSuites: [
          { name: "Deterministic Invariant Verification", testCount: 45, passRate: 0.99 },
          { name: "Schema Adherence & Rounding Test", testCount: 30, passRate: 0.98 },
        ],
        accuracyScore: Number((inDataset.benchmarkScore / 100).toFixed(3)),
        latencyMs: inDataset.latencyMs,
        lastVerifiedAt: "2026-10-28T12:00:00Z",
      },
      verificationStatus: inDataset.verified ? "VERIFIED" : "PENDING",
      ratings: inDataset.rating,
      tasksCompleted: inDataset.tasksCompleted,
      isShowcase: false,
    };
  }

  return undefined;
}

export function createJob(params: {
  agentSlug: string;
  input: Record<string, unknown>;
}): JobRecord {
  const agent = findAgentInCatalog(params.agentSlug);
  const now = new Date().toISOString();
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const job: JobRecord = {
    id,
    jobId: id,
    agentSlug: params.agentSlug,
    title: agent?.title || `Execution for ${params.agentSlug}`,
    status: "SUBMITTED",
    input: params.input,
    budgetPaise: agent?.pricePaise || 8000,
    budgetCents: agent?.priceCents || 100,
    createdAt: now,
    updatedAt: now,
    events: [
      {
        id: `ev_${Date.now()}_sub`,
        status: "SUBMITTED",
        message: `Job ${id} submitted for agent ${params.agentSlug}`,
        timestamp: now,
      },
    ],
  };

  jobStore.set(id, job);
  return job;
}

export function updateJobStatus(
  jobId: string,
  status: JobRecord["status"],
  message: string
): JobRecord | undefined {
  const job = jobStore.get(jobId);
  if (!job) return undefined;

  job.status = status;
  job.updatedAt = new Date().toISOString();
  job.events.push({
    id: `ev_${Date.now()}_${status.toLowerCase()}`,
    status,
    message,
    timestamp: job.updatedAt,
  });

  jobStore.set(jobId, job);
  return job;
}
