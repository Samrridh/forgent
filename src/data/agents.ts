import { Agent, AgentCategory, AGENT_CATEGORIES } from "@/types/agent";

export { AGENT_CATEGORIES };

interface DomainSeed {
  category: AgentCategory;
  titles: string[];
  creators: string[];
  tagPool: string[];
  bioTemplates: string[];
}

const DOMAIN_SEEDS: DomainSeed[] = [
  {
    category: "Finance",
    titles: [
      "3-Way ERP Invoice Reconciler",
      "SOX Audit Trail Validator",
      "GAAP Revenue Recognition Verifier",
      "Expense Receipt OCR & Tax Categorizer",
      "Treasury Balance Sweeper",
      "Stripe Fee Discrepancy Detector",
      "Payroll Variance Auditor",
      "AP Automation Specialist",
      "Bank Feed Ledger Sync Worker",
      "Forex Transaction Hedging Auditor",
      "Corporate Card Policy Checker",
      "Fixed Asset Depreciation Calculator",
      "Vendor Credit Memo Processor",
      "Tax Withholding Bracket Validator",
    ],
    creators: ["@ledger_labs", "@scale_finance", "@fin_ops", "@quant_core", "@apex_audit"],
    tagPool: ["SOX", "3-Way Match", "GAAP", "OCR", "Ledger", "Stripe", "ERP", "Payroll", "Audit"],
    bioTemplates: [
      "Executes deterministic matching across purchase orders, goods receipts, and vendor invoices with zero float drift.",
      "Validates ledger balances against compliance constraints and generates cryptographic change verification receipts.",
      "Audits transaction batches against corporate policy rules and logs discrepancies directly to accounting webhooks.",
    ],
  },
  {
    category: "Legal",
    titles: [
      "GDPR Retention Policy Enforcer",
      "Standard NDA Clause Redline Analyzer",
      "SOC2 Access Evidence Collector",
      "IP Trademark Conflict Checker",
      "SaaS MSA Liability Cap Flagger",
      "HIPAA BAA Contract Auditor",
      "Contractor Scope Term Validator",
      "Data Processing Addendum Verifier",
      "Cookie Consent Schema Scanner",
      "Export Control EAR Compliance Checker",
      "Vendor DPA Sub-processor Auditor",
      "Employment Contract Clause Linter",
    ],
    creators: ["@lex_protocol", "@veritas_legal", "@clause_ai", "@juris_core", "@counsel_ops"],
    tagPool: ["GDPR", "SOC2", "HIPAA", "Redline", "Compliance", "MSA", "Liability", "Contracts"],
    bioTemplates: [
      "Scans contract clauses against corporate risk tolerances and flags indemnification ambiguities automatically.",
      "Gathers cryptographically signed evidence records for SOC2 and ISO-27001 annual compliance reviews.",
      "Enforces data retention policies by discovering expired user records and issuing auditable wipe receipts.",
    ],
  },
  {
    category: "DevOps",
    titles: [
      "Terraform Drift Remediation Worker",
      "Kubernetes Ingress Policy Linter",
      "Docker Multi-Stage Image Shrinker",
      "GitHub Actions Security Scanner",
      "AWS IAM Least-Privilege Pruner",
      "Prometheus Alert Rule Deduplicator",
      "Postgres Connection Pool Optimizer",
      "ArgoCD Helm Diff Validator",
      "OpenTelemetry Span Sampling Tuner",
      "Redis Cluster Node Failover Sentry",
      "Envoy Proxy Route Config Linter",
      "Linux Kernel Sysctl Hardening Agent",
      "Cloudflare DNS Propagation Verifier",
    ],
    creators: ["@cloud_native", "@infra_mesh", "@kube_craft", "@sre_protocol", "@packet_ops"],
    tagPool: ["Terraform", "K8s", "Docker", "AWS", "Prometheus", "Postgres", "CI/CD", "Security"],
    bioTemplates: [
      "Inspects infrastructure state against desired declared manifests and generates pull requests for drifted resources.",
      "Validates cloud IAM privileges against observed API call volume and prunes unused wildcard permissions.",
      "Analyzes deployment pipelines to eliminate redundant cache layers and verify container vulnerability signatures.",
    ],
  },
  {
    category: "Healthcare",
    titles: [
      "FHIR HL7 Resource Validator",
      "DICOM Imaging Metadata Anonymizer",
      "Clinical Trial Exclusion Matcher",
      "ICD-10 Diagnostic Code Verifier",
      "Pharmacy Dosage Range Checker",
      "EHR Patient Record Reconciler",
      "Medical Device Telemetry Linter",
      "HIPAA Audit Log Integrity Verifier",
      "Lab Test Reference Range Flagger",
      "Physician Order Entry Validator",
    ],
    creators: ["@health_stack", "@bio_metric", "@clinical_ai", "@med_protocol", "@rx_auditor"],
    tagPool: ["FHIR", "HL7", "DICOM", "ICD-10", "HIPAA", "EHR", "Clinical", "Patient Safety"],
    bioTemplates: [
      "Validates clinical data exchange records against standard FHIR schemas and strips unapproved PHI attributes.",
      "Performs cross-referencing between patient medication lists and prescription dosage limits to flag adverse events.",
      "Verifies diagnostic code consistency across insurance claim submissions and medical encounter notes.",
    ],
  },
  {
    category: "Data",
    titles: [
      "Parquet Schema Drift Detector",
      "dbt Model Test Failure Analyzer",
      "Snowflake Credit Anomaly Monitor",
      "PII Masking & Tokenization Worker",
      "Redis Cache Invalidation Orchestrator",
      "ClickHouse Ingestion Buffer Optimizer",
      "Kafka Consumer Lag Alerter",
      "Vector Index Quality Evaluator",
      "BigQuery Query Cost Predictor",
      "Data Lake Orphan File Cleaner",
      "Postgres Index Bloat Remediator",
      "DuckDB Analytical Batch Processor",
    ],
    creators: ["@data_forge", "@pipeline_hq", "@vector_lab", "@query_sre", "@lake_ops"],
    tagPool: ["Parquet", "dbt", "Snowflake", "PII", "Kafka", "Vector", "ClickHouse", "SQL"],
    bioTemplates: [
      "Detects schema breaking changes across upstream streaming topics and generates backward-compatible views.",
      "Monitors analytical query warehouses for runaway scan costs and automatically throttles non-production jobs.",
      "Identifies unindexed join queries and suggests minimal covering indexes based on actual execution plans.",
    ],
  },
  {
    category: "Copywriting",
    titles: [
      "Spec-to-Doc Technical Synchronizer",
      "API Changelog & Release Notes Agent",
      "Engineering Whitepaper Abstract Synthesizer",
      "Open Source README Formatter",
      "Microcopy Localization Consistency Linter",
      "Developer Code Snippet Verifier",
      "RFC Proposal Structure Auditor",
      "Postman API Reference Documenter",
      "Architecture Decision Record (ADR) Scribe",
      "CLI Command Man Page Generator",
    ],
    creators: ["@doc_smith", "@clarity_press", "@spec_write", "@dev_scribe", "@syntax_copy"],
    tagPool: ["API Docs", "Technical Writing", "Changelog", "README", "Localization", "ADR", "RFC"],
    bioTemplates: [
      "Keeps public API documentation in lockstep with TypeScript contracts and OpenAPI specification changes.",
      "Generates clear, developer-centric release notes from committed Git diffs without promotional filler.",
      "Validates that all runnable code snippets in markdown documentation compile and execute without errors.",
    ],
  },
  {
    category: "Customer Support",
    titles: [
      "SLA Escalation Priority Router",
      "Zendesk Webhook Discrepancy Analyzer",
      "B2B Technical Support Classifier",
      "Knowledge Base Outdated Article Flagger",
      "Customer Churn Signal Monitor",
      "Incident Post-Mortem Task Tracker",
      "Bug Report Reproduction Synthesizer",
      "Customer CSAT Feedback Clustering Worker",
      "Intercom Conversation Triage Agent",
      "Tier-3 Escalation Package Builder",
    ],
    creators: ["@support_flow", "@tier_one", "@resolution_ai", "@desk_ops", "@pulse_support"],
    tagPool: ["Zendesk", "SLA", "Triage", "Intercom", "CSAT", "Escalations", "Classification"],
    bioTemplates: [
      "Triages inbound enterprise support tickets using technical stack traces and assigns direct SLA urgency tiers.",
      "Aggregates recurring customer complaint clusters and maps them directly to open engineering issue tickets.",
      "Verifies whether resolved customer tickets meet defined response quality standards before closure.",
    ],
  },
  {
    category: "HR",
    titles: [
      "I-9 Verification Document Checker",
      "Job Description Bias & Clarity Linter",
      "Onboarding System Provisioning Trigger",
      "Greenhouse Pipeline Stage Auditor",
      "Performance Review Calibration Summarizer",
      "PTO Accrual Discrepancy Resolver",
      "Employee Equity Grant Vesting Sentry",
      "Remote Work Tax Nexus Monitor",
      "Background Check Status Reconciler",
      "Benefits Enrollment Period Checker",
    ],
    creators: ["@talent_ops", "@people_stack", "@workforce_lab", "@nexus_hr", "@culture_core"],
    tagPool: ["I-9", "Greenhouse", "Onboarding", "Equity", "Compliance", "Payroll", "Benefits"],
    bioTemplates: [
      "Audits employee onboarding verification checklists against federal and regional legal requirements.",
      "Monitors multi-state remote workforce locations to warn HR operations of corporate tax nexus triggers.",
      "Reconciles option grant vesting schedules between equity administration software and payroll deductions.",
    ],
  },
  {
    category: "Cybersecurity",
    titles: [
      "AWS Security Group Public Ingress Sentinel",
      "OpenSSH Key Expiration Auditor",
      "OWASP Top 10 Static Analysis Triage",
      "Dependabot CVE Contextualizer",
      "TLS Certificate Expiration Sentry",
      "CloudTrail Unauthorized API Spotter",
      "Subdomain Takeover Vulnerability Scanner",
      "Zero Trust Boundary Policy Linter",
      "Kubernetes RBAC Privilege Escalation Checker",
      "API Key Secret Leak Revocation Agent",
      "SAML / SSO Identity Provider Discrepancy Finder",
    ],
    creators: ["@sentinel_sec", "@guard_rail", "@zero_day_lab", "@cipher_ops", "@shield_grid"],
    tagPool: ["CVE", "OWASP", "IAM", "CloudTrail", "TLS", "Zero Trust", "Secrets", "SOC2"],
    bioTemplates: [
      "Continuously scans public network interfaces for open management ports and applies defensive rulesets.",
      "Analyzes reported CVE vulnerabilities in project dependencies to determine if affected functions are reachable.",
      "Revokes exposed API tokens across public repositories and initiates credential cycling workflows.",
    ],
  },
  {
    category: "E-Commerce",
    titles: [
      "Multichannel Inventory Sync Worker",
      "RMA Return Authorization Validator",
      "Cart Abandonment Webhook Verifier",
      "Catalog SKU Attribute Normalizer",
      "Supplier Lead Time Discrepancy Forecaster",
      "Warehouse Bin Location Route Optimizer",
      "Shopify Order Fulfillment Status Sentry",
      "Amazon FBA Fee Discrepancy Auditor",
      "Product Price Parity Monitor",
      "Customs Harmonized Code (HS) Matcher",
    ],
    creators: ["@commerce_grid", "@cart_engine", "@sku_ops", "@fulfillment_ai", "@supply_link"],
    tagPool: ["Shopify", "Inventory", "RMA", "FBA", "SKU", "Logistics", "Pricing", "Warehouse"],
    bioTemplates: [
      "Synchronizes real-time inventory counts across Amazon, Shopify, and local ERP warehouses without overselling.",
      "Audits shipping manifests and third-party logistics billing invoices against contracted fee schedules.",
      "Normalizes incoming supplier product specifications into unified catalog taxonomy and image standards.",
    ],
  },
  {
    category: "Research",
    titles: [
      "ArXiv AI Paper Methodology Extractor",
      "Benchmark Score Reproduction Validator",
      "Clinical Literature Citation Graph Builder",
      "Patent Prior Art Semantic Searcher",
      "Quantitative Financial Dataset Cleaner",
      "Competitive Feature Matrix Synthesizer",
      "Systematic Literature Review Synthesizer",
      "Scientific Hypothesis Assumption Checker",
      "Clinical Trial Outcome Data Extractor",
      "Academic Peer Review Consistency Linter",
    ],
    creators: ["@scholar_ops", "@deep_research", "@patent_mesh", "@meta_study", "@arxiv_lab"],
    tagPool: ["ArXiv", "Benchmarking", "Patents", "Data Extraction", "Citations", "Literature Review"],
    bioTemplates: [
      "Extracts structured empirical metrics and baseline evaluation configurations from technical research papers.",
      "Discovers prior art patent filings matching semantic claims and classifies defensive novelty boundaries.",
      "Cleans and aligns messy historical financial time series with anomaly detection and timestamp synchronization.",
    ],
  },
  {
    category: "Growth",
    titles: [
      "B2B Lead Firmographic Enricher",
      "PostHog Product Funnel Drop-off Analyzer",
      "Google Search Console Query Cannibalizer",
      "Inbound Demo Request Scorer",
      "Ad Spend Attribution Discrepancy Checker",
      "Customer Referral Fraud Sentinel",
      "SEO Technical Core Web Vitals Auditor",
      "Outreach Email Deliverability Sentry",
      "UTM Parameter Taxonomy Enforcer",
      "SaaS Free-to-Paid Conversion Predictor",
    ],
    creators: ["@growth_loop", "@funnel_iq", "@attribution_ai", "@demand_core", "@metric_pilot"],
    tagPool: ["PostHog", "Attribution", "Firmographics", "SEO", "Analytics", "Funnel", "B2B"],
    bioTemplates: [
      "Enriches inbound company leads with verified technographic and revenue data for sales team routing.",
      "Audits multi-touch ad spend attribution models against actual bank payment receipts to uncover channel drift.",
      "Identifies conflicting keyword rankings across enterprise blog domains and recommends canonical consolidations.",
    ],
  },
];

function generate500Agents(): Agent[] {
  const agents: Agent[] = [];
  
  // Distribute targets across 12 domains: 8 with 42, 4 with 41 = 500
  const categoryCounts: Record<AgentCategory, number> = {
    Finance: 42,
    Legal: 42,
    DevOps: 42,
    Healthcare: 42,
    Data: 42,
    Copywriting: 42,
    "Customer Support": 42,
    HR: 42,
    Cybersecurity: 41,
    "E-Commerce": 41,
    Research: 41,
    Growth: 41,
  };

  let globalIndex = 1;

  for (const domain of DOMAIN_SEEDS) {
    const targetCount = categoryCounts[domain.category];
    const titlesLen = domain.titles.length;
    const creatorsLen = domain.creators.length;
    const biosLen = domain.bioTemplates.length;

    for (let i = 0; i < targetCount; i++) {
      const titleBase = domain.titles[i % titlesLen];
      const versionCycle = Math.floor(i / titlesLen) + 1;
      const title = versionCycle > 1 ? `${titleBase} (Tier ${versionCycle})` : titleBase;

      const creator = domain.creators[(i + versionCycle) % creatorsLen];
      const bio = domain.bioTemplates[i % biosLen];

      // Deterministic prices between $0.50 and $15.00
      const priceSteps = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.5, 8.0, 10.0, 12.5, 15.0];
      const priceUsd = priceSteps[(i * 3 + globalIndex) % priceSteps.length];
      const priceInr = Math.round(priceUsd * 80);

      // Ratings between 4.10 and 4.99
      const rating = Number((4.2 + ((i * 17) % 80) / 100).toFixed(2));
      const ratingCount = 45 + ((i * 37) % 450);

      // Tasks completed between 800 and 95,000
      const tasksCompleted = 800 + ((i * 1493 + globalIndex * 211) % 94200);

      // Latency between 280ms and 2400ms
      const latencyMs = 280 + ((i * 73) % 2120);

      // Benchmark score between 92.5 and 99.8
      const benchmarkScore = Number((92.5 + ((i * 13) % 73) / 10).toFixed(1));

      // 78% of agents verified
      const verified = (i % 5) !== 4;

      const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(globalIndex).padStart(3, "0")}`;

      // Pick 2-4 tags
      const tagPool = domain.tagPool;
      const tag1 = tagPool[i % tagPool.length];
      const tag2 = tagPool[(i + 2) % tagPool.length];
      const tag3 = tagPool[(i + 4) % tagPool.length];
      const tags = Array.from(new Set([tag1, tag2, tag3]));

      const runtimeTypes: Array<"deterministic" | "llm-assisted" | "hybrid"> = [
        "deterministic",
        "llm-assisted",
        "hybrid",
      ];
      const runtimeType = runtimeTypes[i % 3];

      agents.push({
        id: `agent-${String(globalIndex).padStart(3, "0")}`,
        slug,
        title,
        creatorHandle: creator,
        category: domain.category,
        bio,
        verified,
        benchmarkScore,
        pricePerTaskUsd: priceUsd,
        pricePerTaskInr: priceInr,
        rating,
        ratingCount,
        tasksCompleted,
        latencyMs,
        tags,
        capabilities: [domain.category.toLowerCase(), "automated-verification", ...tags],
        runtimeType,
        version: `v${versionCycle}.${(i % 9) + 1}.0`,
      });

      globalIndex++;
    }
  }

  return agents;
}

export const AGENTS_DATASET: Agent[] = generate500Agents();

export function getAgentBySlug(slug: string): Agent | undefined {
  return AGENTS_DATASET.find((a) => a.slug === slug || a.id === slug);
}

export function getAgentsByCategory(category: AgentCategory): Agent[] {
  return AGENTS_DATASET.filter((a) => a.category === category);
}

export function searchAgents(
  query: string,
  agents: Agent[] = AGENTS_DATASET
): Agent[] {
  if (!query || !query.trim()) return agents;
  const q = query.toLowerCase().trim();

  return agents.filter((agent) => {
    return (
      agent.title.toLowerCase().includes(q) ||
      agent.bio.toLowerCase().includes(q) ||
      agent.creatorHandle.toLowerCase().includes(q) ||
      agent.category.toLowerCase().includes(q) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
