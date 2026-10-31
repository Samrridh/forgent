# Forgent — hackathon MVP

Forgent is being rebuilt as a single API for specialized agents. The current local demo includes a knowledge-base support agent, API keys, article editing, and a human handoff inbox. Builder endpoint registration, support benchmarks, and local catalog publishing are available. A Discord bot and simulated 95/5 usage accounting are available. Real payments and payouts are not implemented. The historical description below documents the previous prototype, not current product capabilities.

## Run the local demo

1. Install dependencies with `npm ci`, then generate the existing Prisma client with `npm run db:generate`.
2. For model-generated support answers, add `OPENROUTER_API_KEY=...` to `.env.local` and restart the development server. The support demo uses `openrouter/free`. Questions without matching articles can still be routed to the local human inbox without a provider key.
3. Start `npm run dev` and open `http://localhost:3000/console`. Create an API key and copy it immediately; only its hash is stored.
4. Open the Knowledge base tab to edit the seeded articles, then try the support agent at `/agents/knowledge-support` under Playground. Review unanswered questions in Console → Handoffs.

The application also exposes `GET /api/v1/agents` and `POST /api/v1/runs`; the latter accepts a bearer key and JSON such as `{"agent":"knowledge-support","input":{"question":"How do I invite my team?"}}`. An optional `Idempotency-Key` header avoids recording the same successful request twice. Responses distinguish an answer with source IDs from a handoff with a ticket ID. The API uses simulated billing and does not charge users.

## Sponsor demos

Open `/sponsor-demo` to run the Meko support handoff and view the IOMETE sales concept. The Meko example uses a fixed fictional refund question and an empty demo knowledge base. The first support agent creates a handoff; Forgent stores it as a Meko datapack artifact, reads it back, and sends the retrieved context to a second model-powered support agent for a draft. It does not resolve a real ticket or check a real refund policy.

Create a Meko account, API key, and datapack with write access. Add `MEKO_API_KEY`, `MEKO_DATAPACK_ID`, and `OPENROUTER_API_KEY` to `.env.local`, then restart the server. See the [Meko datapack API](https://docs.mekodata.ai/reference/datapack-api/) for setup. The Meko artifact is visible to datapack members; use fictional data only. A missing key or service failure is shown in the demo, and no local result is presented as a successful Meko call.

The IOMETE view is a static concept with fictional sales data and no IOMETE integration. Solana is deferred.

## Publish a support agent

Use the same demo session to browse agents, open the business workspace, and use `/publish`; the main navigation no longer requires a persona switch. This is demo access, not a real unified account or authentication system. The publish workspace includes the previous Creator Studio under **Prototype tools**. Its sample agents, wizard, analytics, and payouts are separate simulations; they do not share the local catalog. Package review inspects source without executing it.

Open `/publish` and use **Use the sample agent** to load a deterministic reference endpoint, or enter a public HTTPS endpoint you control. Save, run the 12-case support benchmark, then publish a passing version. The local sample requires no model key. Editing an agent invalidates its benchmark and returns it to draft. A published agent can be selected in the catalog or called by its ID through `/api/v1/runs`.

The endpoint receives `POST` JSON in this shape: `{"question":"...","articles":[{"id":"article-id","title":"...","content":"..."}]}`. It must return either `{"action":"answer","answer":"...","sources":["article-id"]}` or `{"action":"handoff","answer":"...","reason":"..."}`. Source IDs must refer to the supplied articles. The benchmark sends only synthetic articles and checks six answer cases, four unsupported cases, and two instruction-override cases. Passing requires five answer cases and all six handoff cases; this narrow benchmark does not guarantee general agent quality.

External agents receive the workspace articles when called. Public endpoints are limited to HTTPS and redirects are rejected. Endpoint credentials and billing collection are not implemented; use a demo endpoint that requires no secret. Listed pricing is illustrative and no money is charged or paid.

## Connect the Discord bot

1. Create a bot in the Discord Developer Portal and invite it to a test server with the bot and applications.commands scopes, and permission to view channels, send messages, and read message history. Create a support channel and a separate staff channel hidden from @everyone. Staff need Manage Messages to use /reply.
2. Add the bot token as `DISCORD_BOT_TOKEN` in the ignored `.env.local` file. The built-in Knowledge Support agent also needs `OPENROUTER_API_KEY` for grounded answers. Add your articles in Console → Knowledge base.
3. Start `npm run dev`; in another terminal run `npm run discord:setup`. Choose the server, support channel, and private staff channel. The guided command creates a Forgent demo key, chooses the built-in support agent, and starts the bot. If the bot is not invited, the command prints an invite link. Keep both terminals running.
4. Mention the bot in the support channel. If the knowledge base cannot answer, it creates a handoff and posts its ticket ID to the staff channel. A staff member can use `/reply ticket:<full-ticket-id> message:<response>` to respond and resolve the handoff.

Each guided start creates a local demo API key; revoke unused keys in Console → API keys. The bot only processes mentions in the selected support channel. If sending or resolving a reply fails, check the ticket and original Discord message before retrying. This is a single local test workspace, not a hosted multi-customer integration. The older `npm run discord:bot` command remains available for manually configured environments.

## Demo usage accounting

Each successful answer or handoff snapshots the agent’s listed price and a 95% builder / 5% Forgent split. Values use integer nano-dollars, preserving even a $0.000001 run’s commission. Idempotent retries do not create another usage record. Console → Usage and the builder workspace show simulated amounts only: no credit is deducted and no payment or payout occurs. Runs created before accounting was added display $0 rather than reconstructing historical prices.

Demo records are stored in the ignored `.forgent-demo/` directory and persist across restarts. This is a single-process local demo, not a multi-user authentication system. The console's key and knowledge management endpoints are not intended for public deployment. Retrieval uses simple keyword matching and cited article IDs do not guarantee an answer is factually correct.

---

# Previous prototype documentation

# Forgent

**The Performance-Driven Marketplace & Execution Platform for Verified AI Agents**

*hackCBS 9.0 · October 2026*

Forgent is a decentralized marketplace and execution engine where independent AI agent developers monetize specialized capabilities and businesses purchase verified, production-grade business outcomes.

Instead of paying for speculative subscriptions or opaque prompt wrappers, buyers post structured jobs with explicit acceptance criteria. Forgent compiles compatible agent workflows, auditions them against verifiable tests, executes them with real-time telemetry, and validates the final deliverables using cryptographic evidence receipts before settling payments.

---

## 1. Executive Summary

Most software enterprises struggle to deploy autonomous AI agents due to three systemic bottlenecks:

1. **Lack of Outcome Guarantees:** Agents fail silently, hallucinate schemas, or loop indefinitely. Businesses cannot risk mission-critical workflows without deterministic acceptance checks.
2. **Monolithic SaaS vs. Specialized Skills:** Independent developers build world-class niche capabilities (e.g., invoice reconciliation, cloud cost anomaly detection, legal clause redlining) but lack the distribution or infrastructure to run a standalone SaaS business.
3. **Absence of Verifiable Trust:** Traditional platforms rely on agent self-reporting ("Task Completed"). Forgent enforces independent verification, generating tamper-evident SHA-256 evidence receipts before funds are released.

Forgent bridges this divide through three architectural pillars:
- **The Marketplace:** A catalog of 500 specialized agents categorized across 12 industry domains, featuring Watermelon UI Hero-16 animated physics and quick anchors, transparent per-task pricing, verified ratings, latency benchmarks, an adversarial defense leaderboard, and an interactive developer playground (`/playground`).
- **The Creator Studio:** A developer portal with an 85/15 revenue split, live webhook endpoint verification, 5-stage AI prompt-injection qualification suite, developer CLI (`bin/forgent`), dynamic starter templates with one-click export, and revenue analytics.
- **The Enterprise Hub:** A visual Directed Acyclic Graph (DAG) workflow builder, autonomous natural-language team compiler, 3-stage synthetic stress flight engine, zero-trust tool gateway with real-time PII/secret redaction, enterprise compliance and SLA policy engine (`/enterprise/policies`), and departmental spend ledgers.
- **The Flagship Market Wedge:** Autonomous Receiving & Inventory Reconciliation solution (`/solutions/receiving`) with multi-agent 3-way matching, ERP before/after state diffs, human-in-the-loop checkpoints, and sealed cryptographic receipts.
- **The Trust & Settlement Layer:** Cryptographic SHA-256 evidence receipts, autonomous AI dispute arbitration oracle, and dual-rail escrow settlement (Stripe USD & Razorpay INR UPI QR).

---

## 2. Core Personas & Workspaces

Forgent provides tailored, role-specific command centers accessible through the global workspace switcher:

### A. Individual & Small Business Buyer (`/`, `/agents`, `/jobs`)

- **500-Agent Catalog:** Broad discovery across 12 domains: Financial Services, Healthcare, DevOps & Cloud, Legal & Compliance, E-Commerce, Security & Audit, Data Science, Content & Copy, HR & Recruiting, Logistics, Education, and Customer Operations.
- **Faceted Discovery:** Instant filtering by domain, input/output schemas, latency SLAs, ratings, and task pricing.
- **Dual-Currency Accounting:** Instant real-time toggle between US Dollars ($ USD) and Indian Rupees (₹ INR) across the entire platform.
- **Task Wallet:** Integrated balance management with one-click instant top-up simulation and automatic refund guarantees for failed executions.
- **Dynamic Job Wizard (`/jobs/new`):** Schema-driven parameter forms with pre-configured sample inputs for rapid job dispatch.
- **Live SSE Execution Console (`/jobs/[id]`):** Real-time Server-Sent Events (SSE) telemetry displaying live step progression, execution logs, and output streams.
- **Execution Watchdog:** Automated 60-second watchdog timer that flags timeouts, prevents stranded jobs, and executes immediate escrow refunds upon failure.
- **Cryptographic Verification (`/verify`):** Multi-tab deliverable viewer (Markdown, structured JSON, SHA-256 Evidence Receipt) with instant receipt hash verification.

### B. Creator & Builder Studio (`/creator`, `/builder/overview`)

- **Agent Management Dashboard:** Real-time metrics tracking agent invocations, revenue yield, average execution latency, and customer ratings.
- **4-Step Publish Wizard (`/builder/agents/publish`):** Guided submission flow covering metadata definition, schema specification, pricing configuration, and test suites.
- **Automated 5-Stage Verification Suite:** Every published agent version must pass automated qualification before deployment:
  1. *Schema Validation:* Input/output payload compliance against strict Zod contracts.
  2. *Latency & SLA Benchmark:* Verification that execution completes under 3,500ms.
  3. *Hallucination & Consistency:* Multi-run output convergence check across synthetic test vectors.
  4. *Security & Prompt Injection:* Robustness against jailbreak attempts and system prompt overrides.
  5. *Economic Attributability:* Compatibility with the platform fee and payout settlement ledger.
- **85/15 Monetization Model:** Transparent earnings model where creators retain 85% of each task fee, with a 15% platform infrastructure fee.
- **Simulated Payout Ledger:** Multi-channel withdrawal testing supporting UPI, Direct Bank Transfer (NEFT/RTGS), and Stripe Connect simulations.
- **Agent Templates Hub (`/templates`):** Five production-ready TypeScript agent starters with dynamic one-click ZIP generation and download via `/api/templates/[id]/export`:
  1. *Financial Invoice Reconciliation Specialist*
  2. *Customer Support Resolution Agent*
  3. *Code Security & Static Analysis Auditor*
  4. *Multi-Source Research Synthesizer*
  5. *Legal Contract Compliance Reviewer*

### C. Enterprise Workflow Hub (`/enterprise`, `/buyer/overview`)

- **Multi-Agent DAG Pipeline Builder:** Visual graph editor enabling teams to chain multiple specialized agents into composite workflows with conditional branching and fallback nodes.
- **3-Stage Synthetic Test Flight Engine:** Pre-production validation suite running stress flights across three critical dimensions:
  1. *Schema Integrity:* 100% contract adherence across all inter-agent handoffs.
  2. *Latency SLA Stress:* Throughput testing ensuring composite pipeline execution stays under 3.5 seconds.
  3. *Cost & Token Optimization:* Token budget monitoring preventing runaway API costs.
- **Animated Flight Telemetry:** Live animated telemetry gauges visualizing synthetic flight results before pipeline deployment.
- **Departmental Spend Ledger:** Granular cost allocation by team (Engineering, Operations, Compliance) with instant CSV and JSON export capabilities.

---

## 3. Architecture & Technical Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Forgent Unified Shell                           │
├────────────────────────────────────────────────────────────────────────┤
│  Individual Marketplace  │  Creator Studio  │  Enterprise Workflow Hub │
└────────────────────┬──────────────────┬──────────────────┬─────────────┘
                     │                  │                  │
┌────────────────────▼──────────────────▼──────────────────▼─────────────┐
│                    Next.js 15 App Router & React 19                    │
├────────────────────────────────────────────────────────────────────────┤
│  Tailwind CSS Design Tokens  │  Lucide SVG Icons  │  Server-Sent Events│
│  Porcelain (#F5F9FD)         │  Royal Cobalt      │  Dual-Currency     │
└────────────────────┬──────────────────┬──────────────────┬─────────────┘
                     │                  │                  │
┌────────────────────▼──────────────────▼──────────────────▼─────────────┐
│                       Server Execution Engine                          │
├────────────────────────────────────────────────────────────────────────┤
│  Multi-Provider LLM Gateway  │  Team Compiler & DAG  │  Watchdog Timer │
│  (Google Gemini & OpenAI)    │  Audition Engine      │  Auto-Refunds   │
└────────────────────┬──────────────────┬──────────────────┬─────────────┘
                     │                  │                  │
┌────────────────────▼──────────────────▼──────────────────▼─────────────┐
│                      Data, Trust & Security                            │
├────────────────────────────────────────────────────────────────────────┤
│  Prisma ORM & PostgreSQL     │  SHA-256 Receipts     │  500 Catalog    │
│  Neon Connection Pooling     │  Independent Verifier │  Agent Registry │
└────────────────────────────────────────────────────────────────────────┘
```

### Technical Stack Details

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript (Strict mode) |
| **Styling & UI** | Tailwind CSS, Lucide React (monochrome SVG icons, zero emojis) |
| **Design Tokens** | Porcelain White (`#F5F9FD`), Deep Royal Cobalt (`#0B4FBA`), Vibrant Azure (`#5EA2FF`) |
| **Typography** | `Italiana` serif headings, `Jeju Gothic` sans-serif UI typography |
| **Database & ORM** | Neon Serverless PostgreSQL, Prisma ORM 7 (pooled connection strings) |
| **AI Runtime** | Multi-provider LLM gateway supporting Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`) and OpenAI (`gpt-4o-mini`, `gpt-4o`) with deterministic fallbacks |
| **Streaming** | Server-Sent Events (SSE) via Next.js Edge-compatible streaming responses |
| **Verification** | Cryptographic SHA-256 evidence hashing and independent acceptance verifier |
| **Testing** | Vitest 5, `@testing-library/react`, JSDOM |

---

## 4. Engineering Quality & Verification

Forgent is built to production-grade engineering standards:

- **28 Test Suites, 244 Tests Passing:** Comprehensive unit and integration test coverage across routing, authentication, catalog filtering, execution engine, compiler v2, DAG canvas, webhook verification, qualification probes, escrow settlements, dispute oracle, tool gateway sanitizer, leaderboard analytics, sandbox telemetry waterfalls, enterprise compliance policies, and autonomous receiving reconciliation.
- **Clean Production Build:** All 32 Next.js App Router routes compile cleanly with zero errors or warnings.
- **Strict Modularity:** Every source file is kept strictly under 1,000 lines of code (target 200–600 lines) with clean separation of concerns.
- **Zero-Emoji Policy:** In accordance with repository standards, no emojis are used in the user interface or code. All visual cues rely on monochrome Lucide SVG icons.
- **Humanizer Copy Standards:** All documentation, UI copy, and system messages avoid artificial intelligence clichés, marketing fluff, or unsubstantiated claims.

---

## 5. Getting Started & Local Setup

### Prerequisites

- Node.js `v20.0.0` or higher
- npm `v10.0.0` or higher
- PostgreSQL database (local or Neon serverless connection string)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mayur11code/Forgent-demo.git
   cd Forgent-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the required variables:
   ```env
   # Database connection
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgent_dev?schema=public"
   
   # AI Model API Keys (optional; platform includes deterministic fallback engine)
   GEMINI_API_KEY=""
   OPENAI_API_KEY=""
   ```

4. **Initialize database & generate Prisma client:**
   ```bash
   npx prisma generate
   npm run db:seed
   ```

5. **Run test suite:**
   ```bash
   npm test
   ```
   *All 28 test suites (244 tests) will execute and pass.*

6. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

7. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 6. Route Map

| Route | Classification | Description |
|---|---|---|
| `/` | Public / Marketplace | 500-agent faceted catalog, search, and dual-currency display |
| `/agents` | Public / Marketplace | Detailed agent catalog with domain filtering |
| `/agents/[slug]` | Public / Marketplace | Dedicated agent portfolio with capability specifications |
| `/playground` | Developer / Testing | Interactive agent testbench with schema forms and latency waterfalls |
| `/solutions/receiving` | Enterprise / Northstar | Autonomous Receiving & Inventory Reconciliation command center |
| `/leaderboard` | Public / Analytics | 500-agent benchmark leaderboard with SLA & defense rankings |
| `/disputes` | Operations / Trust | Autonomous dispute management center & arbitration console |
| `/login` | Identity / Auth | Multi-tenant organization authentication with magic link simulation |
| `/jobs/new` | Task Buyer | Dynamic schema-driven Job Wizard with sample inputs |
| `/jobs/[id]` | Task Buyer | Real-time SSE execution console with 60s watchdog |
| `/verify` | Public / Trust | Independent SHA-256 evidence receipt verification portal |
| `/creator` | Creator Studio | Creator command center with revenue analytics and performance telemetry |
| `/builder/overview` | Creator Studio | Builder workspace with version and revenue tracking |
| `/builder/agents/publish` | Creator Studio | 4-step Publish Wizard with live 5-test evaluation |
| `/templates` | Creator Studio | Agent Templates Hub with dynamic ZIP export |
| `/enterprise` | Enterprise Hub | Enterprise command center with DAG builder and spend ledgers |
| `/enterprise/policies` | Enterprise / Governance | Enterprise compliance guardrails, SLA ceilings, and sovereignty policy |
| `/settings/compliance` | Enterprise / Governance | Sovereign data residency and SLA ceiling configuration |
| `/dev/sandbox` | Developer / Testing | Developer sandbox redirect and agent testing workspace |
| `/dev/tokens` | Developer / Identity | Developer API token management and scope assignment |
| `/buyer/overview` | Enterprise Hub | Buyer workspace with workflow and job summaries |
| `/api/agents` | REST API | Paginated catalog queries with domain filters |
| `/api/jobs` | REST API | Job creation, dispatch, and execution initiation |
| `/api/jobs/[id]/stream` | SSE API | Real-time Server-Sent Events execution stream |
| `/api/compiler/decompose` | REST API | Team Compiler v2 natural-language goal decomposition |
| `/api/pipeline/stream` | SSE API | Interactive DAG pipeline execution stream |
| `/api/sandbox/execute` | REST / SSE API | Sandbox execution profiling with latency waterfall |
| `/api/sandbox/export-test` | REST API | Standardized qualification test fixture export |
| `/api/solutions/receiving/execute` | REST / SSE API | Multi-agent receiving reconciliation execution and state diff |
| `/api/solutions/receiving/sample-data` | REST API | Curated receiving reconciliation industry test scenarios |
| `/api/enterprise/policies` | REST API | Active compliance guardrails and policy configuration |
| `/api/compliance/validate` | REST API | Workflow evaluation against enterprise policies with signed certificates |
| `/api/enterprise/policies/audit` | REST API | Compliance audit history and signed attestation certificates |
| `/api/builder/verify-endpoint` | REST API | Live freelancer webhook ping & handshake validation |
| `/api/builder/qualify` | REST API | 5-stage automated qualification suite with injection probes |
| `/api/payments/checkout` | REST API | Dual-rail checkout (Stripe USD & Razorpay INR UPI QR) |
| `/api/disputes` | REST API | Dispute filing, status tracking, and escrow holds |
| `/api/disputes/[id]/arbitrate` | REST API | Autonomous AI Dispute Oracle arbitration engine |
| `/api/gateway/intercept` | REST API | Zero-trust tool gateway with PII & secret sanitizer |
| `/api/gateway/audit-logs` | REST API | Tool gateway security audit ledger |
| `/api/leaderboard` | REST API | Benchmark rankings, latency metrics, and SLA statistics |
| `/api/creator/analytics` | REST API | Creator revenue breakdowns, platform fees, and payouts |
| `/api/templates/[id]/export` | REST API | Dynamic ZIP export of TypeScript agent templates |
| `/api/verify` | REST API | Cryptographic SHA-256 evidence receipt validation |
| `/api/health` | Infrastructure | Platform health and database connectivity probe |

---

## 7. Documentation Index

For in-depth architectural specifications and implementation records:

- [`BLUEPRINT.md`](BLUEPRINT.md) — Canonical product blueprint and mathematical specification.
- [`AGENTS.md`](AGENTS.md) — Repository development guidelines, modularity rules, and commit standards.
- [`docs/hackathon/README.md`](docs/hackathon/README.md) — 24-hour build execution package and verification records.
- [`docs/hackathon/02_IMPLEMENTATION_MASTER_PLAN.md`](docs/hackathon/02_IMPLEMENTATION_MASTER_PLAN.md) — Master implementation plan across Phases P0–P8.
- [`docs/hackathon/03_PHASE_BREAKDOWN.md`](docs/hackathon/03_PHASE_BREAKDOWN.md) — 10-phase execution schedule and checkpoint gates.
- [`docs/hackathon/08_DATABASE_AND_SEED_PLAN.md`](docs/hackathon/08_DATABASE_AND_SEED_PLAN.md) — Database entity schema and seeding contracts.
- [`docs/hackathon/11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md`](docs/hackathon/11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md) — Runtime recovery and SHA-256 verification spec.
- [`docs/hackathon/16_DECISIONS_AND_CHANGELOG.md`](docs/hackathon/16_DECISIONS_AND_CHANGELOG.md) — Architectural decision log (D-001 through D-033).

---

## 8. License

This project was built for hackCBS 9.0 (October 2026). All rights reserved.
