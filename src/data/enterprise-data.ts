import {
  EnterprisePipeline,
  DepartmentBudget,
  AuditLedgerEntry,
  SyntheticTestVector,
} from "@/lib/contracts/enterprise-types";

export const INITIAL_ENTERPRISE_PIPELINES: EnterprisePipeline[] = [
  {
    id: "pipe-3way-reconciliation",
    name: "Three-Way ERP Invoice & Receiving Matcher",
    description:
      "Deterministic purchase order, warehouse receiving slip, and supplier invoice reconciliation with automated variance detection.",
    category: "Finance",
    createdAt: "2026-10-15T09:00:00Z",
    totalCostPaise: 450000, // ₹4,500.00
    estimatedLatencyMs: 2780,
    certificationStatus: "CERTIFIED",
    deploymentStatus: "DEPLOYED_ORG",
    lastTestedAt: "2026-10-30T16:42:10Z",
    certificationSeal: "PH-SEAL-8F39A1C4-2026",
    connections: [
      {
        id: "conn-1-2",
        fromNodeId: "node-1-ingest",
        fromOutputKey: "parsed_line_items",
        toNodeId: "node-2-process",
        toInputKey: "source_line_items",
      },
      {
        id: "conn-2-3",
        fromNodeId: "node-2-process",
        fromOutputKey: "variance_matrix",
        toNodeId: "node-3-verify",
        toInputKey: "audit_evidence",
      },
    ],
    nodes: [
      {
        id: "node-1-ingest",
        stage: "INGESTION",
        stageName: "Input & Ingestion",
        agentId: "agent-evidence-reader",
        agentName: "Evidence Reader v1.0.0",
        category: "Finance",
        version: "1.0.0",
        description:
          "Extracts line-item identifiers, quantities, and pricing from vendor PDFs and barcode slips.",
        estimatedLatencyMs: 840,
        costPaise: 150000, // ₹1,500.00
        status: "verified",
        inputParameters: [
          {
            key: "document_format",
            label: "Document Schema",
            type: "string",
            required: true,
            value: "PDF_STANDARD_INVOICE_V2",
          },
          {
            key: "ocr_confidence_threshold",
            label: "OCR Confidence Minimum",
            type: "number",
            required: true,
            value: "0.98",
          },
        ],
        outputParameters: [
          {
            key: "parsed_line_items",
            label: "Extracted Line Items",
            type: "json",
            sampleValue: '[{"sku":"WH-204-A","qty":12,"unit_paise":45000}]',
          },
          {
            key: "vendor_tax_id",
            label: "Vendor Tax ID",
            type: "string",
            sampleValue: "US-EIN-88492019",
          },
        ],
      },
      {
        id: "node-2-process",
        stage: "PROCESSING",
        stageName: "Processing & Rules",
        agentId: "agent-reconciliation-specialist",
        agentName: "Reconciliation Specialist v1.1.0",
        category: "Finance",
        version: "1.1.0",
        description:
          "Executes 3-way line-item cross check against PO #4409 and scans for quantity or rate variance.",
        estimatedLatencyMs: 1260,
        costPaise: 200000, // ₹2,000.00
        status: "verified",
        inputParameters: [
          {
            key: "source_line_items",
            label: "Source Line Items",
            type: "json",
            required: true,
            value: "{{node-1-ingest.parsed_line_items}}",
            mappedFrom: {
              nodeId: "node-1-ingest",
              outputKey: "parsed_line_items",
            },
          },
          {
            key: "tolerance_paise",
            label: "Paise Tolerance Limit",
            type: "number",
            required: true,
            value: "0",
          },
        ],
        outputParameters: [
          {
            key: "variance_matrix",
            label: "Variance Matrix",
            type: "json",
            sampleValue: '{"discrepancy_count":0,"variance_paise":0}',
          },
          {
            key: "reconciliation_flag",
            label: "Reconciliation Flag",
            type: "boolean",
            sampleValue: "true",
          },
        ],
      },
      {
        id: "node-3-verify",
        stage: "VERIFICATION",
        stageName: "Synthesis & Verification",
        agentId: "agent-sox-validator",
        agentName: "SOX Audit Trail Validator v1.0.0",
        category: "Finance",
        version: "1.0.0",
        description:
          "Verifies immutable audit trail, computes SHA-256 state seal, and debits escrow settlement.",
        estimatedLatencyMs: 680,
        costPaise: 100000, // ₹1,000.00
        status: "verified",
        inputParameters: [
          {
            key: "audit_evidence",
            label: "Reconciliation Evidence",
            type: "json",
            required: true,
            value: "{{node-2-process.variance_matrix}}",
            mappedFrom: {
              nodeId: "node-2-process",
              outputKey: "variance_matrix",
            },
          },
          {
            key: "require_cryptographic_seal",
            label: "Enforce SHA-256 Seal",
            type: "boolean",
            required: true,
            value: "true",
          },
        ],
        outputParameters: [
          {
            key: "audit_receipt_hash",
            label: "Audit Receipt Hash",
            type: "string",
            sampleValue: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          },
          {
            key: "settlement_status",
            label: "Settlement Status",
            type: "string",
            sampleValue: "COMMITTED_IN_LEDGER",
          },
        ],
      },
    ],
  },
  {
    id: "pipe-soc2-access-governance",
    name: "Automated SOC2 & ISO Access Governance",
    description:
      "Inspects directory role changes, analyzes separation of duties conflicts, and compiles cryptographic compliance evidence.",
    category: "Security",
    createdAt: "2026-10-18T14:15:00Z",
    totalCostPaise: 520000, // ₹5,200.00
    estimatedLatencyMs: 2420,
    certificationStatus: "CERTIFIED",
    deploymentStatus: "DEPLOYED_ORG",
    lastTestedAt: "2026-10-29T11:05:00Z",
    certificationSeal: "PH-SEAL-3C989B21-2026",
    connections: [
      {
        id: "conn-soc-1-2",
        fromNodeId: "node-soc-1",
        fromOutputKey: "audit_event_stream",
        toNodeId: "node-soc-2",
        toInputKey: "raw_events",
      },
      {
        id: "conn-soc-2-3",
        fromNodeId: "node-soc-2",
        fromOutputKey: "compliance_anomalies",
        toNodeId: "node-soc-3",
        toInputKey: "anomalies_report",
      },
    ],
    nodes: [
      {
        id: "node-soc-1",
        stage: "INGESTION",
        stageName: "Input & Ingestion",
        agentId: "agent-directory-sync",
        agentName: "Directory Sync & Log Ingestion v1.2.0",
        category: "Security",
        version: "1.2.0",
        description: "Streams IAM directory state changes, Okta logs, and AWS CloudTrail role assumptions.",
        estimatedLatencyMs: 710,
        costPaise: 160000,
        status: "verified",
        inputParameters: [
          { key: "time_window_minutes", label: "Window Minutes", type: "number", required: true, value: "60" },
          { key: "filter_privileged_roles", label: "Filter Privileged Roles", type: "boolean", required: true, value: "true" },
        ],
        outputParameters: [
          { key: "audit_event_stream", label: "Event Stream", type: "json", sampleValue: '[{"user":"maya","role":"admin"}]' },
        ],
      },
      {
        id: "node-soc-2",
        stage: "PROCESSING",
        stageName: "Processing & Rules",
        agentId: "agent-privilege-analyzer",
        agentName: "Privileged Escalation & Role Conflict Analyzer v1.0.0",
        category: "Security",
        version: "1.0.0",
        description: "Enforces Separation of Duties constraints against SOX and SOC2 Trust Services criteria.",
        estimatedLatencyMs: 1150,
        costPaise: 220000,
        status: "verified",
        inputParameters: [
          {
            key: "raw_events",
            label: "Raw Directory Events",
            type: "json",
            required: true,
            value: "{{node-soc-1.audit_event_stream}}",
            mappedFrom: { nodeId: "node-soc-1", outputKey: "audit_event_stream" },
          },
        ],
        outputParameters: [
          { key: "compliance_anomalies", label: "Compliance Anomalies", type: "json", sampleValue: '{"violations":0}' },
        ],
      },
      {
        id: "node-soc-3",
        stage: "VERIFICATION",
        stageName: "Synthesis & Verification",
        agentId: "agent-evidence-notary",
        agentName: "Cryptographic Evidence Notary & Report Signer v1.0.0",
        category: "Security",
        version: "1.0.0",
        description: "Bundles verified logs into signed ZIP archive and submits proof hashes to audit storage.",
        estimatedLatencyMs: 560,
        costPaise: 140000,
        status: "verified",
        inputParameters: [
          {
            key: "anomalies_report",
            label: "Anomalies Report",
            type: "json",
            required: true,
            value: "{{node-soc-2.compliance_anomalies}}",
            mappedFrom: { nodeId: "node-soc-2", outputKey: "compliance_anomalies" },
          },
        ],
        outputParameters: [
          { key: "evidence_bundle_uri", label: "Bundle URI", type: "string", sampleValue: "s3://forgent-audit/soc2/bundle-9912.zip" },
        ],
      },
    ],
  },
  {
    id: "pipe-contract-risk-redline",
    name: "Vendor Contract Risk & Redline Pipeline",
    description:
      "Parses vendor Master Services Agreements (MSAs), flags uncapped liabilities, and synthesizes standard fallback clauses.",
    category: "Legal",
    createdAt: "2026-10-21T10:30:00Z",
    totalCostPaise: 480000, // ₹4,800.00
    estimatedLatencyMs: 3100,
    certificationStatus: "CERTIFIED",
    deploymentStatus: "DEPLOYED_ORG",
    lastTestedAt: "2026-10-28T14:20:00Z",
    certificationSeal: "PH-SEAL-7D114B02-2026",
    connections: [
      {
        id: "conn-leg-1-2",
        fromNodeId: "node-leg-1",
        fromOutputKey: "contract_sections",
        toNodeId: "node-leg-2",
        toInputKey: "clauses_json",
      },
      {
        id: "conn-leg-2-3",
        fromNodeId: "node-leg-2",
        fromOutputKey: "flagged_risk_clauses",
        toNodeId: "node-leg-3",
        toInputKey: "redline_targets",
      },
    ],
    nodes: [
      {
        id: "node-leg-1",
        stage: "INGESTION",
        stageName: "Input & Ingestion",
        agentId: "agent-contract-parser",
        agentName: "Standard NDA & MSA Parser v1.0.0",
        category: "Legal",
        version: "1.0.0",
        description: "Deconstructs contract PDF documents into structured legal clause arrays with section offsets.",
        estimatedLatencyMs: 920,
        costPaise: 160000,
        status: "verified",
        inputParameters: [
          { key: "contract_type", label: "Contract Type", type: "string", required: true, value: "ENTERPRISE_MSA" },
        ],
        outputParameters: [
          { key: "contract_sections", label: "Contract Sections", type: "json", sampleValue: '[{"section":"12.1 Liability"}]' },
        ],
      },
      {
        id: "node-leg-2",
        stage: "PROCESSING",
        stageName: "Processing & Rules",
        agentId: "agent-liability-analyzer",
        agentName: "Liability Cap & Indemnification Analyzer v1.4.0",
        category: "Legal",
        version: "1.4.0",
        description: "Evaluates liability caps, indemnities, and IP warranties against company legal policy thresholds.",
        estimatedLatencyMs: 1480,
        costPaise: 200000,
        status: "verified",
        inputParameters: [
          {
            key: "clauses_json",
            label: "Clauses JSON",
            type: "json",
            required: true,
            value: "{{node-leg-1.contract_sections}}",
            mappedFrom: { nodeId: "node-leg-1", outputKey: "contract_sections" },
          },
          { key: "max_liability_multiple", label: "Max Multiple of Fees", type: "number", required: true, value: "2" },
        ],
        outputParameters: [
          { key: "flagged_risk_clauses", label: "Flagged Risks", type: "json", sampleValue: '{"uncapped_liability":false}' },
        ],
      },
      {
        id: "node-leg-3",
        stage: "VERIFICATION",
        stageName: "Synthesis & Verification",
        agentId: "agent-redline-gate",
        agentName: "Legal Redline Verification & Approval Gate v1.0.0",
        category: "Legal",
        version: "1.0.0",
        description: "Produces approved counter-proposals and routes clean redlines to external legal counsel.",
        estimatedLatencyMs: 700,
        costPaise: 120000,
        status: "verified",
        inputParameters: [
          {
            key: "redline_targets",
            label: "Redline Targets",
            type: "json",
            required: true,
            value: "{{node-leg-2.flagged_risk_clauses}}",
            mappedFrom: { nodeId: "node-leg-2", outputKey: "flagged_risk_clauses" },
          },
        ],
        outputParameters: [
          { key: "redline_document_sha256", label: "Redline SHA-256", type: "string", sampleValue: "4a2f8b1c90..." },
        ],
      },
    ],
  },
];

export const INITIAL_SYNTHETIC_VECTORS: SyntheticTestVector[] = [
  {
    key: "HAPPY_PATH",
    name: "Vector 1: Clean Structured Happy Path",
    badge: "Conformance",
    description: "Evaluates canonical JSON payload with 100% field compliance and zero variance drift.",
    payloadSize: "14.2 KB (12 line items)",
    concurrency: 1,
    expectedOutcome: "All 3 nodes pass with zero validation faults in under 3.5s per stage.",
    status: "passed",
    latencyMs: 1820,
    schemaMatchRate: 100,
    costPaise: 450000,
    logs: [
      "[00:00.120] INGESTION: Received valid payload (14.2 KB, schema v2.1).",
      "[00:00.840] INGESTION: Schema validation passed 100%. Extracted 12 line items.",
      "[00:00.860] MAPPING: Output parameter 'parsed_line_items' successfully mapped to node-2-process.",
      "[00:01.910] PROCESSING: Reconciled 12 line items. Zero float variance recorded.",
      "[00:01.940] MAPPING: Output parameter 'variance_matrix' bound to node-3-verify.",
      "[00:02.480] VERIFICATION: SHA-256 state seal verified. Escrow contract validated.",
    ],
  },
  {
    key: "MALFORMED_EDGE",
    name: "Vector 2: Malformed Schema & Missing Keys Edge Case",
    badge: "Resilience",
    description: "Injects missing required keys, negative numeric quantities, and non-UTF8 strings.",
    payloadSize: "8.6 KB (aberrant payload)",
    concurrency: 1,
    expectedOutcome: "Pre-execution schema boundary catches anomalies; node recovers and raises standard exception.",
    status: "passed",
    latencyMs: 1410,
    schemaMatchRate: 100,
    costPaise: 450000,
    logs: [
      "[00:00.080] INGESTION: Injected malformed payload with missing 'vendor_tax_id'.",
      "[00:00.220] INGESTION: Schema guard detected missing mandatory field.",
      "[00:00.410] INGESTION: Sanitized input according to strict schema fallback rules.",
      "[00:01.050] PROCESSING: Processed sanitized records without crash or unhandled error.",
      "[00:01.410] VERIFICATION: Integrity audit confirmed defensive isolation completed successfully.",
    ],
  },
  {
    key: "HIGH_VOLUME_STRESS",
    name: "Vector 3: High-Volume Concurrency Stress Burst",
    badge: "SLA Stress",
    description: "Fires 500 simultaneous synthetic requests through the DAG to stress latency SLAs.",
    payloadSize: "7.1 MB aggregate",
    concurrency: 500,
    expectedOutcome: "Throughput holds under peak load; p99 latency remains below 3,500ms ceiling.",
    status: "passed",
    latencyMs: 2940,
    schemaMatchRate: 100,
    costPaise: 450000,
    logs: [
      "[00:00.050] STRESS: Dispatched 500 synthetic concurrent executions to pipeline.",
      "[00:01.120] INGESTION: 500/500 requests processed. Average stage latency: 790ms.",
      "[00:02.340] PROCESSING: Parallel execution pool handled burst without memory degradation.",
      "[00:02.940] VERIFICATION: All 500 state seals generated and cross-signed. Zero dropped records.",
    ],
  },
];

export const INITIAL_DEPARTMENT_BUDGETS: DepartmentBudget[] = [
  {
    id: "dept-finance",
    department: "Finance & Accounting",
    allocatedPaise: 500000000, // ₹5,000,000.00
    spentPaise: 184500000, // ₹1,845,000.00 (36.9%)
    escrowLockedPaise: 45000000, // ₹450,000.00
    activePipelines: 4,
    authorizedOwner: "Maya Rao (Head of Procurement)",
  },
  {
    id: "dept-legal",
    department: "Legal & Compliance",
    allocatedPaise: 350000000, // ₹3,500,000.00
    spentPaise: 98000000, // ₹980,000.00 (28.0%)
    escrowLockedPaise: 25000000,
    activePipelines: 3,
    authorizedOwner: "Elena Rostova (General Counsel)",
  },
  {
    id: "dept-engineering",
    department: "Engineering & Platform Ops",
    allocatedPaise: 800000000, // ₹8,000,000.00
    spentPaise: 432000000, // ₹4,320,000.00 (54.0%)
    escrowLockedPaise: 110000000,
    activePipelines: 6,
    authorizedOwner: "Dev Sharma (VP Infrastructure)",
  },
  {
    id: "dept-procurement",
    department: "Supply Chain & Vendor Ops",
    allocatedPaise: 400000000, // ₹4,000,000.00
    spentPaise: 120000000, // ₹1,200,000.00 (30.0%)
    escrowLockedPaise: 35000000,
    activePipelines: 2,
    authorizedOwner: "Marcus Vance (Supply Operations)",
  },
  {
    id: "dept-operations",
    department: "People & Enterprise Operations",
    allocatedPaise: 300000000, // ₹3,000,000.00
    spentPaise: 65000000, // ₹650,000.00 (21.7%)
    escrowLockedPaise: 18000000,
    activePipelines: 2,
    authorizedOwner: "Priya Patel (Chief Operations Officer)",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLedgerEntry[] = [
  {
    id: "audit-001",
    timestamp: "2026-10-31T00:15:22Z",
    executor: "Maya Rao",
    department: "Finance & Accounting",
    pipelineId: "pipe-3way-reconciliation",
    pipelineName: "Three-Way ERP Invoice & Receiving Matcher",
    escrowDebitedPaise: 450000,
    status: "COMMITTED",
    verificationHash: "8f39a1c4e92d04f11a8b340058b87126ca1029471182390a",
    durationMs: 2780,
    stageResultsSummary: "All 3 stages completed. Invoiced ₹185,000 matched receiving slip #WH-204.",
  },
  {
    id: "audit-002",
    timestamp: "2026-10-30T22:40:11Z",
    executor: "Dev Sharma",
    department: "Engineering & Platform Ops",
    pipelineId: "pipe-soc2-access-governance",
    pipelineName: "Automated SOC2 & ISO Access Governance",
    escrowDebitedPaise: 520000,
    status: "COMMITTED",
    verificationHash: "3c989b21f928e3410a8276184910248c8b21049281a8b410",
    durationMs: 2420,
    stageResultsSummary: "Inspected 1,420 directory events. 0 SoD violations detected.",
  },
  {
    id: "audit-003",
    timestamp: "2026-10-30T19:12:05Z",
    executor: "Elena Rostova",
    department: "Legal & Compliance",
    pipelineId: "pipe-contract-risk-redline",
    pipelineName: "Vendor Contract Risk & Redline Pipeline",
    escrowDebitedPaise: 480000,
    status: "COMMITTED",
    verificationHash: "7d114b02928c0147812048f0293847291048201492049182",
    durationMs: 3100,
    stageResultsSummary: "MSA analyzed. Flagged uncapped indemnity in section 9.2; counter-clause applied.",
  },
  {
    id: "audit-004",
    timestamp: "2026-10-30T17:05:43Z",
    executor: "Marcus Vance",
    department: "Supply Chain & Vendor Ops",
    pipelineId: "pipe-3way-reconciliation",
    pipelineName: "Three-Way ERP Invoice & Receiving Matcher",
    escrowDebitedPaise: 450000,
    status: "SETTLED",
    verificationHash: "1a9802bc3482710491820394817293840192837401928374",
    durationMs: 2650,
    stageResultsSummary: "Supplier batch #4819 reconciled. Escrow funds released to vendor account.",
  },
  {
    id: "audit-005",
    timestamp: "2026-10-30T14:32:19Z",
    executor: "Priya Patel",
    department: "People & Enterprise Operations",
    pipelineId: "pipe-soc2-access-governance",
    pipelineName: "Automated SOC2 & ISO Access Governance",
    escrowDebitedPaise: 520000,
    status: "COMMITTED",
    verificationHash: "592019482019482019482019482019482019482019482019",
    durationMs: 2390,
    stageResultsSummary: "Quarterly contractor access purge verified. 48 inactive accounts decommissioned.",
  },
  {
    id: "audit-006",
    timestamp: "2026-10-30T11:20:00Z",
    executor: "Maya Rao",
    department: "Finance & Accounting",
    pipelineId: "pipe-3way-reconciliation",
    pipelineName: "Three-Way ERP Invoice & Receiving Matcher",
    escrowDebitedPaise: 450000,
    status: "COMMITTED",
    verificationHash: "6c8102938401928374019283740192837401928374019283",
    durationMs: 2710,
    stageResultsSummary: "PO #9910 cleared against freight manifest. Dual sign-off verified.",
  },
];

export function generateCustomWorkflowFromPrompt(
  prompt: string,
  category: string = "Finance"
): EnterprisePipeline {
  const cleanId = `pipe-custom-${Date.now().toString(36)}`;
  const title = prompt.trim().length > 0 ? prompt.trim() : "Custom Autonomous Workflow";

  return {
    id: cleanId,
    name: title,
    description: `Automated 3-stage DAG workflow configured for "${title}". Verified for enterprise production deployment.`,
    category,
    createdAt: new Date().toISOString(),
    totalCostPaise: 460000,
    estimatedLatencyMs: 2850,
    certificationStatus: "UNCERTIFIED",
    deploymentStatus: "DRAFT",
    connections: [
      {
        id: `conn-${cleanId}-1-2`,
        fromNodeId: `node-${cleanId}-1`,
        fromOutputKey: "extracted_records",
        toNodeId: `node-${cleanId}-2`,
        toInputKey: "source_dataset",
      },
      {
        id: `conn-${cleanId}-2-3`,
        fromNodeId: `node-${cleanId}-2`,
        fromOutputKey: "computed_ruleset",
        toNodeId: `node-${cleanId}-3`,
        toInputKey: "evidence_payload",
      },
    ],
    nodes: [
      {
        id: `node-${cleanId}-1`,
        stage: "INGESTION",
        stageName: "Input & Ingestion",
        agentId: "agent-evidence-reader",
        agentName: "Evidence Ingestion Worker v1.0.0",
        category,
        version: "1.0.0",
        description: `Ingests and structures raw inputs for ${title}.`,
        estimatedLatencyMs: 820,
        costPaise: 150000,
        status: "idle",
        inputParameters: [
          { key: "input_source", label: "Input Source URI", type: "string", required: true, value: "ENTERPRISE_API_STREAM" },
          { key: "batch_size", label: "Batch Size", type: "number", required: true, value: "100" },
        ],
        outputParameters: [
          { key: "extracted_records", label: "Extracted Records", type: "json", sampleValue: '[{"id":1,"status":"ok"}]' },
        ],
      },
      {
        id: `node-${cleanId}-2`,
        stage: "PROCESSING",
        stageName: "Processing & Rules",
        agentId: "agent-rules-engine",
        agentName: "Policy & Constraint Engine v2.0.0",
        category,
        version: "2.0.0",
        description: `Evaluates domain constraints, validates business logic, and calculates variances.`,
        estimatedLatencyMs: 1350,
        costPaise: 210000,
        status: "idle",
        inputParameters: [
          {
            key: "source_dataset",
            label: "Source Dataset",
            type: "json",
            required: true,
            value: `{{node-${cleanId}-1.extracted_records}}`,
            mappedFrom: { nodeId: `node-${cleanId}-1`, outputKey: "extracted_records" },
          },
          { key: "strict_mode", label: "Strict Mode Verification", type: "boolean", required: true, value: "true" },
        ],
        outputParameters: [
          { key: "computed_ruleset", label: "Computed Ruleset", type: "json", sampleValue: '{"passed":true,"deviations":0}' },
        ],
      },
      {
        id: `node-${cleanId}-3`,
        stage: "VERIFICATION",
        stageName: "Synthesis & Verification",
        agentId: "agent-notary-seal",
        agentName: "Cryptographic Settlement Notary v1.0.0",
        category,
        version: "1.0.0",
        description: `Issues verifiable SHA-256 seal and executes transactional ledger balance commitment.`,
        estimatedLatencyMs: 680,
        costPaise: 100000,
        status: "idle",
        inputParameters: [
          {
            key: "evidence_payload",
            label: "Evidence Payload",
            type: "json",
            required: true,
            value: `{{node-${cleanId}-2.computed_ruleset}}`,
            mappedFrom: { nodeId: `node-${cleanId}-2`, outputKey: "computed_ruleset" },
          },
        ],
        outputParameters: [
          { key: "cryptographic_receipt", label: "Cryptographic Receipt", type: "string", sampleValue: "9a21b4..." },
        ],
      },
    ],
  };
}
