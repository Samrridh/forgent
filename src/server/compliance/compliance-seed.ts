import {
  EnterprisePolicyConfig,
  CandidateWorkflow,
} from "@/lib/contracts/compliance-types";

export const DEFAULT_ENTERPRISE_POLICY: EnterprisePolicyConfig = {
  id: "pol_acme_sovereign_v2",
  orgId: "org_acme_logistics",
  policyName: "Acme Global Sovereign Governance & SLA Guardrails",
  version: "2.1.0",
  updatedAt: "2026-10-31T08:00:00.000Z",
  latencySlaCeilingMs: 3500,
  budgetCap: {
    maxBudgetPaise: 5000000, // ₹50,000 ($625 USD)
    requireApprovalAbovePaise: 4000000, // ₹40,000 ($500 USD)
    currency: "USD",
  },
  dataResidency: {
    primaryJurisdiction: "US",
    enforceSovereignty: true,
    allowedJurisdictions: ["US", "EU"],
  },
  providers: {
    mode: "BLACKLIST",
    allowedProviders: [
      "OPENAI",
      "ANTHROPIC",
      "GOOGLE",
      "AWS_BEDROCK",
      "MICROSOFT_AZURE",
    ],
    forbiddenProviders: ["DEEPSEEK", "UNVERIFIED_COMMUNITY", "TIKTOK_AI"],
    allowedModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "claude-3-5-sonnet",
      "claude-3-haiku",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    forbiddenModels: ["unfiltered-uncensored-v1", "deepseek-r1-distill"],
  },
  humanInTheLoop: {
    requireCheckpointOnStateMutation: true,
    requireCheckpointOnPaymentAbovePaise: 4000000,
    requireCheckpointOnPiiExport: true,
    requireCheckpointOnExternalWebhook: true,
    restrictedOperations: [
      "commit:inventory",
      "db:mutate",
      "db:drop",
      "db:truncate",
      "payout:transfer",
      "export:pii",
      "network:egress_untrusted",
    ],
  },
};

export const SAMPLE_CANDIDATE_WORKFLOWS: CandidateWorkflow[] = [
  {
    id: "wf_invoice_matcher_01",
    name: "Autonomous Invoice 3-Way Matcher",
    category: "Finance & Accounting",
    estimatedLatencyMs: 2150,
    costPaise: 336000, // ₹3,360 ($42 USD)
    jurisdiction: "US",
    provider: "ANTHROPIC",
    model: "claude-3-5-sonnet",
    actions: [
      {
        name: "Extract Invoice PDF",
        operation: "doc:extract",
        isStateMutation: false,
        costPaise: 112000,
        containsPii: false,
        externalWebhook: false,
      },
      {
        name: "Reconcile Purchase Order",
        operation: "reconcile:po",
        isStateMutation: false,
        costPaise: 112000,
        containsPii: false,
        externalWebhook: false,
      },
      {
        name: "Generate Cryptographic Match Evidence",
        operation: "evidence:generate",
        isStateMutation: false,
        costPaise: 112000,
        containsPii: false,
        externalWebhook: false,
      },
    ],
    nodes: [
      {
        id: "node-inv-ingest",
        agentName: "Document Ingestion Agent",
        estimatedLatencyMs: 650,
        costPaise: 112000,
        provider: "ANTHROPIC",
        model: "claude-3-5-sonnet",
        jurisdiction: "US",
        operations: ["doc:extract"],
      },
      {
        id: "node-inv-match",
        agentName: "Deterministic Reconciliation Engine",
        estimatedLatencyMs: 800,
        costPaise: 112000,
        provider: "ANTHROPIC",
        model: "claude-3-5-sonnet",
        jurisdiction: "US",
        operations: ["reconcile:po"],
      },
      {
        id: "node-inv-receipt",
        agentName: "Evidence Audit Signer",
        estimatedLatencyMs: 700,
        costPaise: 112000,
        provider: "ANTHROPIC",
        model: "claude-3-5-sonnet",
        jurisdiction: "US",
        operations: ["evidence:generate"],
      },
    ],
  },
  {
    id: "wf_treasury_payout_02",
    name: "High-Value Treasury Settlement Pipeline",
    category: "Treasury Operations",
    estimatedLatencyMs: 2900,
    costPaise: 4800000, // ₹48,000 ($600 USD) > $500 threshold
    jurisdiction: "US",
    provider: "OPENAI",
    model: "gpt-4o",
    actions: [
      {
        name: "Verify Supplier Ledger Balance",
        operation: "ledger:read",
        isStateMutation: false,
        costPaise: 800000,
        containsPii: false,
        externalWebhook: false,
      },
      {
        name: "Execute Interbank Payout Transfer",
        operation: "payout:transfer",
        isStateMutation: true,
        costPaise: 4000000,
        containsPii: true,
        externalWebhook: false,
      },
    ],
    nodes: [
      {
        id: "node-treasury-verify",
        agentName: "Balance Verifier",
        estimatedLatencyMs: 900,
        costPaise: 800000,
        provider: "OPENAI",
        model: "gpt-4o",
        jurisdiction: "US",
        operations: ["ledger:read"],
      },
      {
        id: "node-treasury-execute",
        agentName: "Bank Gateway Dispatcher",
        estimatedLatencyMs: 2000,
        costPaise: 4000000,
        provider: "OPENAI",
        model: "gpt-4o",
        jurisdiction: "US",
        operations: ["payout:transfer", "db:mutate"],
      },
    ],
  },
  {
    id: "wf_legacy_scraper_03",
    name: "Unsanctioned Web Scraper with Blacklisted Provider",
    category: "Market Intelligence",
    estimatedLatencyMs: 4600, // Breaches 3,500ms SLA
    costPaise: 240000,
    jurisdiction: "US",
    provider: "DEEPSEEK", // Forbidden provider
    model: "deepseek-r1-distill",
    actions: [
      {
        name: "Crawl Competitor Tariffs",
        operation: "web:crawl",
        isStateMutation: false,
        costPaise: 240000,
        containsPii: false,
        externalWebhook: true,
      },
    ],
    nodes: [
      {
        id: "node-crawl-worker",
        agentName: "Web Crawler Worker",
        estimatedLatencyMs: 4600,
        costPaise: 240000,
        provider: "DEEPSEEK",
        model: "deepseek-r1-distill",
        jurisdiction: "US",
        operations: ["web:crawl"],
      },
    ],
  },
  {
    id: "wf_global_logistics_04",
    name: "Cross-Border Maritime Telemetry Ingestion",
    category: "Logistics",
    estimatedLatencyMs: 1800,
    costPaise: 950000,
    jurisdiction: "GLOBAL", // Violates US/EU sovereignty policy
    provider: "GOOGLE",
    model: "gemini-1.5-pro",
    actions: [
      {
        name: "Ingest Container Beacon Signals",
        operation: "telemetry:ingest",
        isStateMutation: false,
        costPaise: 950000,
        containsPii: false,
        externalWebhook: false,
      },
    ],
    nodes: [
      {
        id: "node-telemetry-beacon",
        agentName: "Maritime Telemetry Parser",
        estimatedLatencyMs: 1800,
        costPaise: 950000,
        provider: "GOOGLE",
        model: "gemini-1.5-pro",
        jurisdiction: "GLOBAL",
        operations: ["telemetry:ingest"],
      },
    ],
  },
];
