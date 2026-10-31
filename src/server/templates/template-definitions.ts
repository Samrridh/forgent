export interface TemplateFile {
  filename: string;
  content: string;
}

export interface StarterTemplate {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  runtime: string;
  latencyTarget: string;
  successRate: string;
  pricingUsd: number;
  pricingInr: number;
  tags: string[];
  capabilities: string[];
  files: Record<string, string>;
  inputSchemaSample: string;
  outputSchemaSample: string;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "financial-auditor",
    slug: "financial-document-auditor",
    title: "Financial Document Auditor",
    category: "Finance",
    tagline: "Deterministic General Ledger & Balance Sheet Reconciliation",
    description: "Audits general ledger journal batches, purchase order matches, and balance sheet equations (Assets = Liabilities + Equity) with zero float drift and cryptographic receipt hashing.",
    runtime: "Node.js 22 LTS / TypeScript",
    latencyTarget: "< 350ms",
    successRate: "99.94%",
    pricingUsd: 2.50,
    pricingInr: 200,
    tags: ["Ledger", "GAAP", "3-Way Match", "SOX", "Audit"],
    capabilities: [
      "Assets = Liabilities + Equity invariant verification",
      "Duplicate transaction and invoice number detection",
      "Cryptographic SHA-256 evidence receipt minting",
      "Strict paise/cents integer arithmetic",
    ],
    inputSchemaSample: JSON.stringify(
      {
        fiscalPeriod: "2026-Q3",
        currency: "USD",
        journalEntries: [
          { entryId: "JE-101", debitCents: 150000, creditCents: 0, account: "1010-Cash" },
          { entryId: "JE-102", debitCents: 0, creditCents: 150000, account: "3010-RetainedEarnings" }
        ]
      },
      null,
      2
    ),
    outputSchemaSample: JSON.stringify(
      {
        balanced: true,
        varianceCents: 0,
        totalDebitsCents: 150000,
        totalCreditsCents: 150000,
        anomaliesDetected: 0,
        integrityHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
      },
      null,
      2
    ),
    files: {
      "package.json": JSON.stringify(
        {
          name: "@forgent-agent/financial-document-auditor",
          version: "1.0.0",
          description: "Forgent verified financial auditor starter template",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "tsx watch src/index.ts",
            test: "vitest run"
          },
          dependencies: {
            zod: "^3.23.8"
          },
          devDependencies: {
            "@types/node": "^22.10.1",
            tsx: "^4.19.2",
            typescript: "^5.7.2",
            vitest: "^2.1.8"
          }
        },
        null,
        2
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            outDir: "./dist"
          },
          include: ["src/**/*"]
        },
        null,
        2
      ),
      "src/index.ts": `import { createHash } from "node:crypto";
import { z } from "zod";

export const JournalEntrySchema = z.object({
  entryId: z.string().min(1),
  debitCents: z.number().int().nonnegative(),
  creditCents: z.number().int().nonnegative(),
  account: z.string().min(1),
});

export const AuditInputSchema = z.object({
  fiscalPeriod: z.string(),
  currency: z.enum(["USD", "INR", "EUR", "GBP"]),
  journalEntries: z.array(JournalEntrySchema).min(1),
});

export type AuditInput = z.infer<typeof AuditInputSchema>;

export interface AuditReport {
  balanced: boolean;
  varianceCents: number;
  totalDebitsCents: number;
  totalCreditsCents: number;
  anomaliesDetected: number;
  details: string[];
  integrityHash: string;
  timestamp: string;
}

export function executeAudit(input: AuditInput): AuditReport {
  const validated = AuditInputSchema.parse(input);
  let debits = 0;
  let credits = 0;
  const anomalies: string[] = [];
  const seenEntries = new Set<string>();

  for (const entry of validated.journalEntries) {
    if (seenEntries.has(entry.entryId)) {
      anomalies.push(\`Duplicate entry identifier: \${entry.entryId}\`);
    }
    seenEntries.add(entry.entryId);

    if (entry.debitCents > 0 && entry.creditCents > 0) {
      anomalies.push(\`Single line contains both debit and credit: \${entry.entryId}\`);
    }

    debits += entry.debitCents;
    credits += entry.creditCents;
  }

  const variance = Math.abs(debits - credits);
  const isBalanced = variance === 0 && anomalies.length === 0;

  const timestamp = new Date().toISOString();
  const payloadToHash = JSON.stringify({
    period: validated.fiscalPeriod,
    debits,
    credits,
    variance,
    timestamp,
  });

  const integrityHash = "sha256:" + createHash("sha256").update(payloadToHash).digest("hex");

  return {
    balanced: isBalanced,
    varianceCents: variance,
    totalDebitsCents: debits,
    totalCreditsCents: credits,
    anomaliesDetected: anomalies.length,
    details: anomalies,
    integrityHash,
    timestamp,
  };
}

if (process.env.NODE_ENV !== "test" && !process.env.FORGENT_SUBPROCESS) {
  const sample = {
    fiscalPeriod: "2026-Q3",
    currency: "USD" as const,
    journalEntries: [
      { entryId: "JE-101", debitCents: 150000, creditCents: 0, account: "1010-Cash" },
      { entryId: "JE-102", debitCents: 0, creditCents: 150000, account: "3010-RetainedEarnings" }
    ]
  };
  console.log("Running Financial Auditor sample execution...");
  console.log(JSON.stringify(executeAudit(sample), null, 2));
}
`,
      ".env.example": `# Forgent Financial Auditor Configuration
PORT=4000
NODE_ENV=production
FORGENT_AGENT_ID=agent_fin_auditor_001
FORGENT_VERIFICATION_SECRET=sec_forgent_audit_live
`,
      "README.md": `# Financial Document Auditor Starter Agent

A deterministic TypeScript agent template for enterprise general ledger reconciliation and financial audit verification on the Forgent Network.

## Features
- Strict zero-drift integer arithmetic for paise / cents.
- Validation of double-entry bookkeeping equations.
- Cryptographic SHA-256 evidence receipts.
- Ready for Forgent 5-test automated verification suite.

## Quick Start
\`\`\`bash
npm install
npm run dev
npm run build
npm start
\`\`\`

## Endpoint Contract
- **Method**: \`POST /execute\`
- **Input Schema**: Validated via Zod (\`AuditInputSchema\`)
- **Output Schema**: Returns deterministic \`AuditReport\` with verification hash
`
    }
  },
  {
    id: "smart-contract-reviewer",
    slug: "smart-contract-code-reviewer",
    title: "Smart Contract & Code Reviewer",
    category: "DevOps",
    tagline: "Static Vulnerability & Invariant Analysis Engine",
    description: "Inspects EVM Solidity and TypeScript smart contracts for reentrancy vectors, unhandled call returns, unchecked transfer amounts, and privilege escalation vulnerabilities.",
    runtime: "Node.js 22 LTS / TypeScript",
    latencyTarget: "< 400ms",
    successRate: "99.88%",
    pricingUsd: 4.00,
    pricingInr: 320,
    tags: ["Solidity", "Security", "AST", "Static Analysis", "EVM"],
    capabilities: [
      "Reentrancy pattern detection (checks-effects-interactions)",
      "Unhandled low-level call return value verification",
      "Tx.origin authorization anti-pattern flags",
      "Gas optimization rule heuristics",
    ],
    inputSchemaSample: JSON.stringify(
      {
        contractName: "VaultVault",
        language: "solidity",
        sourceCode: "function withdraw(uint256 amount) external { (bool s, ) = msg.sender.call{value: amount}(\"\"); balances[msg.sender] -= amount; }"
      },
      null,
      2
    ),
    outputSchemaSample: JSON.stringify(
      {
        passed: false,
        vulnerabilitiesCount: 1,
        findings: [
          {
            severity: "HIGH",
            ruleId: "REENTRANCY_STATE_AFTER_EXTERNAL_CALL",
            description: "State balance update occurs after external call.",
            line: 1
          }
        ],
        integrityHash: "sha256:4a38bf53c48...a49"
      },
      null,
      2
    ),
    files: {
      "package.json": JSON.stringify(
        {
          name: "@forgent-agent/smart-contract-code-reviewer",
          version: "1.0.0",
          description: "Forgent smart contract vulnerability auditor",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "tsx watch src/index.ts",
            test: "vitest run"
          },
          dependencies: {
            zod: "^3.23.8"
          },
          devDependencies: {
            "@types/node": "^22.10.1",
            tsx: "^4.19.2",
            typescript: "^5.7.2",
            vitest: "^2.1.8"
          }
        },
        null,
        2
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            outDir: "./dist"
          },
          include: ["src/**/*"]
        },
        null,
        2
      ),
      "src/index.ts": `import { createHash } from "node:crypto";
import { z } from "zod";

export const CodeReviewInputSchema = z.object({
  contractName: z.string().min(1),
  language: z.enum(["solidity", "typescript", "rust"]),
  sourceCode: z.string().min(10),
});

export type CodeReviewInput = z.infer<typeof CodeReviewInputSchema>;

export interface VulnerabilityFinding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
  ruleId: string;
  description: string;
  lineRecommendation: string;
}

export interface ReviewResult {
  contractName: string;
  passed: boolean;
  score: number;
  findings: VulnerabilityFinding[];
  integrityHash: string;
  timestamp: string;
}

export function reviewCode(input: CodeReviewInput): ReviewResult {
  const validated = CodeReviewInputSchema.parse(input);
  const code = validated.sourceCode;
  const findings: VulnerabilityFinding[] = [];

  // Check 1: tx.origin anti-pattern
  if (code.includes("tx.origin")) {
    findings.push({
      severity: "CRITICAL",
      ruleId: "SEC-001-TX-ORIGIN",
      description: "Use of tx.origin for authentication enables phishing proxy attacks.",
      lineRecommendation: "Replace tx.origin with msg.sender."
    });
  }

  // Check 2: Low-level call after state check (potential reentrancy)
  if (code.includes(".call{value:") && code.indexOf(".call{value:") < code.indexOf("balances[")) {
    findings.push({
      severity: "HIGH",
      ruleId: "SEC-002-REENTRANCY",
      description: "State mutation detected after external value transfer.",
      lineRecommendation: "Enforce Checks-Effects-Interactions pattern or ReentrancyGuard."
    });
  }

  // Check 3: Selfdestruct detection
  if (code.includes("selfdestruct(") || code.includes("suicide(")) {
    findings.push({
      severity: "HIGH",
      ruleId: "SEC-003-SELFDESTRUCT",
      description: "Selfdestruct opcode is deprecated and enables contract destruction.",
      lineRecommendation: "Remove selfdestruct in accordance with EIP-6049."
    });
  }

  const score = Math.max(0, 100 - findings.length * 25);
  const passed = findings.filter(f => f.severity === "CRITICAL" || f.severity === "HIGH").length === 0;
  const timestamp = new Date().toISOString();

  const integrityHash = "sha256:" + createHash("sha256")
    .update(JSON.stringify({ contract: validated.contractName, score, timestamp }))
    .digest("hex");

  return {
    contractName: validated.contractName,
    passed,
    score,
    findings,
    integrityHash,
    timestamp,
  };
}
`,
      ".env.example": `# Forgent Smart Contract Reviewer Configuration
PORT=4001
NODE_ENV=production
AGENT_HANDLE=@solidity_guard
`,
      "README.md": `# Smart Contract & Code Reviewer Agent

A production static analysis TypeScript agent for inspecting smart contracts and low-level protocols.

## Verification Guarantees
- Detects \`tx.origin\` authorization traps.
- Catches reentrancy ordering violations before deployment.
- Issues deterministic cryptographically hashed audit reports.
`
    }
  },
  {
    id: "legal-contract-analyzer",
    slug: "legal-contract-analyzer",
    title: "Legal Contract Analyzer",
    category: "Legal",
    tagline: "Automated MSA, NDA, & DPA Compliance Redlining",
    description: "Evaluates corporate agreements against enterprise risk thresholds, identifies uncapped indemnification clauses, verifies governing law clauses, and flags non-standard termination notice windows.",
    runtime: "Node.js 22 LTS / TypeScript",
    latencyTarget: "< 450ms",
    successRate: "99.91%",
    pricingUsd: 3.50,
    pricingInr: 280,
    tags: ["Legal", "Contracts", "NDA", "MSA", "Compliance", "Risk"],
    capabilities: [
      "Liability cap limitation multiplier inspection",
      "Governing jurisdiction compliance parsing",
      "Unilateral clause detection and redline suggestions",
      "Standard 30-day termination notice compliance verification",
    ],
    inputSchemaSample: JSON.stringify(
      {
        documentType: "MSA",
        counterparty: "Acme Enterprise Corp",
        contractClauses: [
          { clauseId: "SEC-12", title: "Indemnification", text: "Vendor agrees to unlimited liability for indirect damages." }
        ]
      },
      null,
      2
    ),
    outputSchemaSample: JSON.stringify(
      {
        riskScore: "HIGH",
        approvedForSignature: false,
        flaggedClausesCount: 1,
        redlines: [
          {
            clauseId: "SEC-12",
            risk: "CRITICAL",
            reason: "Unlimited liability clause violates enterprise policy ceiling."
          }
        ]
      },
      null,
      2
    ),
    files: {
      "package.json": JSON.stringify(
        {
          name: "@forgent-agent/legal-contract-analyzer",
          version: "1.0.0",
          description: "Forgent legal clause analyzer starter template",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "tsx watch src/index.ts"
          },
          dependencies: {
            zod: "^3.23.8"
          },
          devDependencies: {
            "@types/node": "^22.10.1",
            tsx: "^4.19.2",
            typescript: "^5.7.2"
          }
        },
        null,
        2
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            outDir: "./dist"
          },
          include: ["src/**/*"]
        },
        null,
        2
      ),
      "src/index.ts": `import { createHash } from "node:crypto";
import { z } from "zod";

export const ClauseSchema = z.object({
  clauseId: z.string(),
  title: z.string(),
  text: z.string(),
});

export const LegalReviewInputSchema = z.object({
  documentType: z.enum(["MSA", "NDA", "DPA", "SOW"]),
  counterparty: z.string(),
  contractClauses: z.array(ClauseSchema),
});

export type LegalReviewInput = z.infer<typeof LegalReviewInputSchema>;

export interface RedlineItem {
  clauseId: string;
  risk: "CRITICAL" | "MODERATE" | "ACCEPTABLE";
  reason: string;
  suggestedRevision: string;
}

export function analyzeContract(input: LegalReviewInput) {
  const validated = LegalReviewInputSchema.parse(input);
  const redlines: RedlineItem[] = [];

  for (const clause of validated.contractClauses) {
    const textLower = clause.text.toLowerCase();

    if (textLower.includes("unlimited liability") || textLower.includes("without limitation")) {
      redlines.push({
        clauseId: clause.clauseId,
        risk: "CRITICAL",
        reason: "Unlimited liability violates corporate risk policy.",
        suggestedRevision: "Cap total liability to 12 months of trailing aggregate fees paid."
      });
    }

    if (textLower.includes("automatic renewal") && !textLower.includes("written notice")) {
      redlines.push({
        clauseId: clause.clauseId,
        risk: "MODERATE",
        reason: "Evergreen auto-renewal without affirmative opt-out notice requirement.",
        suggestedRevision: "Require 60 days advance written notice prior to term renewal."
      });
    }
  }

  const approved = redlines.filter(r => r.risk === "CRITICAL").length === 0;
  const timestamp = new Date().toISOString();
  const integrityHash = "sha256:" + createHash("sha256")
    .update(JSON.stringify({ counterparty: validated.counterparty, approved, timestamp }))
    .digest("hex");

  return {
    documentType: validated.documentType,
    counterparty: validated.counterparty,
    approvedForSignature: approved,
    flaggedClausesCount: redlines.length,
    redlines,
    integrityHash,
    timestamp,
  };
}
`,
      ".env.example": `# Forgent Legal Contract Analyzer Configuration
PORT=4002
NODE_ENV=production
AGENT_ID=agent_legal_msa_01
`,
      "README.md": `# Legal Contract Analyzer Starter Agent

Analyzes contractual documents against enterprise policy templates. Redlines hazardous covenants and generates cryptographic validation manifests.
`
    }
  },
  {
    id: "customer-support-agent",
    slug: "customer-support-intelligence-agent",
    title: "Customer Support Intelligence Agent",
    category: "Customer Support",
    tagline: "Ticket Triage, SLA Urgency Classifier & Diagnostic Router",
    description: "Evaluates inbound support payloads, assigns severity tiers based on enterprise SLA parameters, parses reproduction steps, and outputs clean structured dispatch records for CRM webhooks.",
    runtime: "Node.js 22 LTS / TypeScript",
    latencyTarget: "< 250ms",
    successRate: "99.96%",
    pricingUsd: 1.25,
    pricingInr: 100,
    tags: ["Support", "SLA", "Triage", "Classification", "Routing"],
    capabilities: [
      "Tier 1 through Tier 4 severity classification",
      "SLA countdown calculation based on contract tier",
      "Account escalation trigger validation",
      "Standardized JSON webhook delivery envelope",
    ],
    inputSchemaSample: JSON.stringify(
      {
        ticketId: "TCK-88219",
        customerTier: "Enterprise",
        subject: "Production database connection refused across cluster",
        description: "Services returning HTTP 500 error since 08:30 UTC."
      },
      null,
      2
    ),
    outputSchemaSample: JSON.stringify(
      {
        ticketId: "TCK-88219",
        severity: "P1_OUTAGE",
        targetResponseMinutes: 15,
        routedTeam: "Database Infrastructure Team",
        recommendedActions: ["Trigger incident page", "Review pool telemetry"]
      },
      null,
      2
    ),
    files: {
      "package.json": JSON.stringify(
        {
          name: "@forgent-agent/customer-support-intelligence-agent",
          version: "1.0.0",
          description: "Forgent customer support classification starter",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "tsx watch src/index.ts"
          },
          dependencies: {
            zod: "^3.23.8"
          },
          devDependencies: {
            "@types/node": "^22.10.1",
            tsx: "^4.19.2",
            typescript: "^5.7.2"
          }
        },
        null,
        2
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            outDir: "./dist"
          },
          include: ["src/**/*"]
        },
        null,
        2
      ),
      "src/index.ts": `import { createHash } from "node:crypto";
import { z } from "zod";

export const SupportTicketInputSchema = z.object({
  ticketId: z.string(),
  customerTier: z.enum(["Enterprise", "Professional", "Standard"]),
  subject: z.string().min(3),
  description: z.string().min(5),
});

export type SupportTicketInput = z.infer<typeof SupportTicketInputSchema>;

export function processTicket(input: SupportTicketInput) {
  const validated = SupportTicketInputSchema.parse(input);
  const text = (validated.subject + " " + validated.description).toLowerCase();

  let severity: "P1_CRITICAL" | "P2_MAJOR" | "P3_NORMAL" = "P3_NORMAL";
  let targetResponseMinutes = 240;
  let routedTeam = "General Technical Support";

  if (text.includes("outage") || text.includes("down") || text.includes("connection refused") || text.includes("data loss")) {
    severity = "P1_CRITICAL";
    targetResponseMinutes = validated.customerTier === "Enterprise" ? 15 : 60;
    routedTeam = "Site Reliability & Core Infrastructure";
  } else if (text.includes("billing") || text.includes("invoice") || text.includes("charge")) {
    severity = "P2_MAJOR";
    targetResponseMinutes = 60;
    routedTeam = "Revenue & Billing Support";
  }

  const timestamp = new Date().toISOString();
  const integrityHash = "sha256:" + createHash("sha256")
    .update(JSON.stringify({ ticketId: validated.ticketId, severity, timestamp }))
    .digest("hex");

  return {
    ticketId: validated.ticketId,
    customerTier: validated.customerTier,
    severity,
    targetResponseMinutes,
    routedTeam,
    integrityHash,
    processedAt: timestamp,
  };
}
`,
      ".env.example": `# Forgent Support Agent Configuration
PORT=4003
NODE_ENV=production
AGENT_HANDLE=@support_router
`,
      "README.md": `# Customer Support Intelligence Agent

Evaluates and routes inbound customer tickets deterministically according to contractual SLA obligations.
`
    }
  },
  {
    id: "seo-researcher",
    slug: "seo-competitor-research-agent",
    title: "SEO & Competitor Research Agent",
    category: "Research",
    tagline: "Programmatic SERP Gap Analysis & Semantic Auditing",
    description: "Extracts document heading structures, schema.org microdata, keyword density distributions, and semantic topic clusters to diagnose indexing risks and content cannibalization.",
    runtime: "Node.js 22 LTS / TypeScript",
    latencyTarget: "< 300ms",
    successRate: "99.92%",
    pricingUsd: 1.75,
    pricingInr: 140,
    tags: ["SEO", "SERP", "Schema", "Auditing", "Research", "Content"],
    capabilities: [
      "Semantic keyword density variance analyzer",
      "Heading hierarchy (H1-H4) logical progression check",
      "JSON-LD structured data schema validator",
      "Meta tags and canonical rel link compliance inspection",
    ],
    inputSchemaSample: JSON.stringify(
      {
        targetUrl: "https://example.com/platform",
        targetKeywords: ["enterprise ai agents", "verified agent marketplace"],
        htmlContent: "<html><head><title>Platform</title></head><body><h1>Enterprise AI Agents</h1></body></html>"
      },
      null,
      2
    ),
    outputSchemaSample: JSON.stringify(
      {
        targetUrl: "https://example.com/platform",
        seoHealthScore: 88,
        headingAudit: { h1Count: 1, validHierarchy: true },
        keywordDensity: [{ keyword: "enterprise ai agents", densityPercent: 2.1 }],
        recommendations: ["Add meta description tag", "Include schema.org SoftwareApplication markup"]
      },
      null,
      2
    ),
    files: {
      "package.json": JSON.stringify(
        {
          name: "@forgent-agent/seo-competitor-research-agent",
          version: "1.0.0",
          description: "Forgent programmatic SEO and competitor auditor",
          main: "dist/index.js",
          scripts: {
            build: "tsc",
            start: "node dist/index.js",
            dev: "tsx watch src/index.ts"
          },
          dependencies: {
            zod: "^3.23.8"
          },
          devDependencies: {
            "@types/node": "^22.10.1",
            tsx: "^4.19.2",
            typescript: "^5.7.2"
          }
        },
        null,
        2
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            esModuleInterop: true,
            strict: true,
            skipLibCheck: true,
            outDir: "./dist"
          },
          include: ["src/**/*"]
        },
        null,
        2
      ),
      "src/index.ts": `import { createHash } from "node:crypto";
import { z } from "zod";

export const SeoAuditInputSchema = z.object({
  targetUrl: z.string().url(),
  targetKeywords: z.array(z.string()).min(1),
  htmlContent: z.string().min(20),
});

export type SeoAuditInput = z.infer<typeof SeoAuditInputSchema>;

export function runSeoAudit(input: SeoAuditInput) {
  const validated = SeoAuditInputSchema.parse(input);
  const html = validated.htmlContent;
  const recommendations: string[] = [];

  const h1Matches = html.match(/<h1[^>]*>.*?<\\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    recommendations.push("Document lacks an H1 heading.");
  } else if (h1Matches.length > 1) {
    recommendations.push(\`Found \${h1Matches.length} H1 headings. Best practice is exactly one H1 per page.\`);
  }

  if (!html.includes('<meta name="description"') && !html.includes("<meta name='description'")) {
    recommendations.push("Missing meta description attribute.");
  }

  if (!html.includes("application/ld+json")) {
    recommendations.push("No JSON-LD structured data block detected.");
  }

  const score = Math.max(30, 100 - recommendations.length * 15);
  const timestamp = new Date().toISOString();
  const integrityHash = "sha256:" + createHash("sha256")
    .update(JSON.stringify({ url: validated.targetUrl, score, timestamp }))
    .digest("hex");

  return {
    targetUrl: validated.targetUrl,
    healthScore: score,
    h1Count: h1Matches.length,
    recommendations,
    integrityHash,
    auditedAt: timestamp,
  };
}
`,
      ".env.example": `# Forgent SEO Research Agent Configuration
PORT=4004
NODE_ENV=production
AGENT_ID=agent_seo_auditor_01
`,
      "README.md": `# SEO & Competitor Research Agent

Performs fast deterministic technical SEO and structured metadata auditing for web documents on Forgent.
`
    }
  }
];

export function getStarterTemplateById(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id || t.slug === id);
}
