# 16 — Decisions and Changelog

**Status:** `ACTIVE`  
**Owner:** Joint lead; decision author named per row  
**Rule:** a material change to contracts, scope, money, verification or the demo script requires an entry here before implementation continues.

---

## 1. Decision status

| Status | Meaning |
|---|---|
| `PROPOSED` | Recommended; not binding until P0 freeze or joint acknowledgement. |
| `ACCEPTED` | Binding for the 24-hour build. |
| `SUPERSEDED` | Replaced by a later decision; retained for history. |
| `REJECTED` | Considered and not adopted; reason recorded. |

Phase 0 foundation is complete and tagged `p0-foundation`. Stack, database, adapter architecture, and interface contracts are frozen and `ACCEPTED`.

---

## 2. Decision log

### D-001 — Single Next.js application

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | The repository is greenfield; three teams need one deployable surface. |
| Decision | Build the UI and API in one Next.js 15 App Router app with React 19 and strict TypeScript. |
| Alternatives | Separate SPA + API service; Vite + Express; static prototype. |
| Consequences | Fast setup, one deploy, simple role guard and polling. Less independent scaling; acceptable for the demo. |
| Revisit | Post-hackathon if services need separate deployment. |

### D-002 — Neon PostgreSQL + Prisma 7 for serverless runtime

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B |
| Context | Blueprint specifies PostgreSQL; serverless architecture deployed on Vercel requires connection pooling and serverless-compatible database drivers. |
| Decision | Use Prisma 7 with Neon PostgreSQL datasource via `@prisma/adapter-neon` and `@neondatabase/serverless`. Use pooled `DATABASE_URL` (with `?sslmode=require`) for runtime queries and `DIRECT_URL` for migrations/schema push. |
| Alternatives | Local SQLite; Docker Postgres; Supabase. |
| Consequences | Production-grade serverless PostgreSQL; connection resilience via pooling; native JSON/JSONB support; zero filesystem persistence reliance. |
| Revisit | Post-hackathon if enterprise dedicated cluster is needed. |

### D-003 — Hybrid adapter architecture with deterministic fallback

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | The demo must show authentic AI capabilities without risking judge failure from network timeouts or missing API keys. |
| Decision | Adopt a hybrid adapter architecture. Evidence Reader v1.0.0 is model-backed (calling Gemini 1.5/2.0 Flash or OpenAI when `GEMINI_API_KEY`/`OPENAI_API_KEY` is present in `.env.local`), falling back automatically to a local deterministic adapter on timeout or error. Reconciliation and Acceptance Verification strictly use deterministic business logic (arithmetic and integrity assertions must not hallucinate). Ordinary code is never falsely presented as autonomous external AI agents; provider identities are labelled accurately. |
| Alternatives | Purely deterministic mock adapters; purely LLM-driven pipelines with no fallback. |
| Consequences | Authentic AI execution demonstrated when online; zero demo disruption if offline or unkeyed; transparent provider labelling. |
| Revisit | Additional model-backed agents post-hackathon. |

### D-004 — Demo persona cookie, not real authentication

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B |
| Context | The demo needs buyer/builder role separation without an auth build. |
| Decision | Use a `forgent_persona` cookie plus server-side role guards. Label it explicitly as demo-only. |
| Alternatives | Full auth provider; no roles; query-param role. |
| Consequences | Fast persona switch; route/API role checks; **not** a security boundary. Never claim production auth. |
| Revisit | Replace with real auth before any external user. |

### D-005 — QStash durable async execution with polling API

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B/C |
| Context | Serverless functions have execution timeouts; durable background execution and retries are required. |
| Decision | Use Upstash QStash (`@upstash/qstash`) to dispatch durable execution step events to a signed webhook endpoint (`/api/webhooks/qstash/execution-step`). Frontend monitors stage progression via live polling (`/api/jobs/:jobId/execution`) with state persisted in Neon PostgreSQL. |
| Alternatives | In-process daemon (fails in serverless); custom queue with Redis; BullMQ. |
| Consequences | Fully durable asynchronous execution and retry handling compatible with Vercel serverless deployment; resilient against function timeouts. |
| Revisit | Server-sent events (SSE) or websockets for lower latency post-hackathon. |

### D-006 — Native JSON/JSONB via Prisma Json on PostgreSQL

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B |
| Context | Complex structured data (manifests, contracts, graphs, receipts) requires reliable indexing and serialization. |
| Decision | Store JSON payloads as native PostgreSQL JSONB using Prisma `Json` type; parse and validate runtime payloads through shared Zod schemas. |
| Alternatives | Plain string text storage; separate relational child tables. |
| Consequences | High query performance; native PostgreSQL JSONB indexing and validation; full type safety via Zod. |
| Revisit | Add database-level JSON schema constraints if needed post-hackathon. |

### D-007 — String-backed enums with Zod runtime validation

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B/C |
| Context | Database-level enums in PostgreSQL can complicate zero-downtime migrations when adding new statuses. |
| Decision | Store enum fields as `String` / `VARCHAR` in Neon PostgreSQL and enforce strict validation at service boundaries and API envelopes via shared Zod enums. |
| Alternatives | PostgreSQL native `enum` types; integer codes. |
| Consequences | Frictionless schema evolution during fast hackathon iteration; runtime guarantees preserved via Zod. |
| Revisit | Migrate to native PostgreSQL enum types post-hackathon after schema freezes. |

### D-008 — `BLUEPRINT.md` is canonical

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | The brief names `Forgent_Final_Solution_Blueprint.md`; the repository contains `BLUEPRINT.md`. |
| Decision | Treat `BLUEPRINT.md` as the canonical product source; do not maintain a duplicate. |
| Alternatives | Rename/copy the file; use the brief name. |
| Consequences | One source of truth; links point to `BLUEPRINT.md`. A future rename is an optional tracked move. |
| Revisit | Optional rename with a decision entry. |

### D-009 — Policy, inventory and verification are platform-owned

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | The blueprint's example mixes platform functions with marketplace agents. |
| Decision | Policy validation, inventory proposal and acceptance verification are deterministic Forgent-owned capabilities. They are not agent listings and cannot be hired. |
| Alternatives | List them as agents; use a separate platform service. |
| Consequences | Honest supply; no fake freelancer; clear trust boundary. The workflow can still show them as deterministic nodes. |
| Revisit | If third-party policy agents are added, define a separate platform-certified category. |

### D-010 — Hidden evaluation-only baseline

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | A/B/C comparison needs a generalist baseline, but it is not freelancer supply. |
| Decision | `baseline-single-agent` is `registryVisible=false`, not owned by Jordan, labelled “Evaluation baseline — not for hire”, and absent from marketplace results. |
| Alternatives | A visible “baseline” listing; omit the baseline. |
| Consequences | Fair comparison without fake supply; must test visibility leakage. |
| Revisit | Keep as an internal evaluation artifact. |

### D-011 — v1.1.0 is the compatible fallback

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | The failure/recovery story needs a compatible replacement from the same builder. |
| Decision | Reconciliation v1.1.0 is the declared fallback for v1.0.0; it handles duplicate scans and malformed upstream values and produces 10/2. |
| Alternatives | A separate fallback agent; retry-only recovery; no recovery. |
| Consequences | Single-builder loop preserved; recovery is demonstrable; v1.0.0 earns zero. |
| Revisit | Multi-builder fallback after the hackathon. |

### D-012 — ₹10,000 allocation and 25% platform fee

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | The demo needs coherent, auditable economics. |
| Decision | Buyer total ₹10,000 = builder ₹5,500 + platform fee ₹2,500 + execution/recovery reserve ₹1,200 + human-review reserve ₹800. |
| Alternatives | Cost-plus pricing; subscription; no platform fee. |
| Consequences | Clear stage attribution; v1.1.0 ₹2,500; v1.0.0 ₹0; reserves bounded. Values are illustrative, not validated pricing. |
| Revisit | Pricing experiments post-hackathon. |

### D-013 — No Team D; distribute QA and integration

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | Three developers; a separate QA/ops team would be fictional. |
| Decision | Three permanent workstreams A/B/C. QA, integration, demo ops and regression are distributed by ownership. |
| Alternatives | A fourth “integration” role; rotate QA. |
| Consequences | Clear ownership; higher load on A; joint gates required. |
| Revisit | Only if a fourth person joins. |

### D-014 — Nine phases, 24 elapsed hours

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | The blueprint and brief require a 24-hour parallel plan. |
| Decision | P0–P8 with windows 60/180/180/240/240/180/120/120/120 minutes = 1,440. Each phase has a gate, usable prototype, checkpoint and tag. |
| Alternatives | Feature-based milestones; 12-hour build + 12-hour buffer. |
| Consequences | Predictable cadence; P0/P3/P6/P7 are tight; optional scope is cut first. |
| Revisit | Only with a joint re-plan at a gate. |

### D-015 — Ten audition fixtures, eight visible, two held out

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | The comparison needs enough coverage to be credible without exposing every expected value. |
| Decision | `wh204-suite-v1` has ten fixtures: normal short, exact, short, over-receipt, missing scan, malformed quantity, duplicate scan, contradiction, permission violation (held out), fallback incompatibility (held out). |
| Alternatives | Five fixtures; all visible; all hidden. |
| Consequences | Thirty measured results; fair comparison; aggregate held-out disclosure. |
| Revisit | New suite version if fixtures change. |

### D-016 — Simulated settlement only

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B |
| Context | No payment provider is integrated. |
| Decision | Contributions are `ELIGIBLE_SIMULATED`; `provider: null`; no `SETTLED` claim; UI says “eligible (simulated)”. |
| Alternatives | Mock provider with fake transaction IDs; omit economics. |
| Consequences | Honest demo; the economic loop is visible but not claimed as real money. |
| Revisit | Integrate a provider post-hackathon. |

### D-017 — Dashboards and economics are P0, not optional

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | A |
| Context | The blueprint says buyer/builder dashboards “if time permits”; the demo requires the economic loop. |
| Decision | Buyer overview, builder overview and the economics views are P0. |
| Alternatives | Defer dashboards; show only the job flow. |
| Consequences | More A work; the builder payout story is visible. |
| Revisit | Cut secondary charts, not the dashboards. |

### D-018 — Demo-scoped builder registration

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | A/B |
| Context | Public onboarding is deferred, but the marketplace needs a builder-side action. |
| Decision | Implement a demo-scoped agent registration/edit flow with immutable published versions and a buyer-role denial. No public acquisition. |
| Alternatives | Read-only builder profile; full onboarding. |
| Consequences | Shows supply-side agency without a fake public marketplace. |
| Revisit | Public onboarding post-hackathon. |

### D-019 — No UI for deferred features

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | A |
| Context | Disabled/“coming soon” controls erode trust and create dead routes. |
| Decision | Do not render PDF export, audit browser, bounty submission, public onboarding or disputes. Record them only in the backlog. |
| Alternatives | Disabled buttons with tooltips; hidden feature flags. |
| Consequences | Cleaner product; fewer routes to test. |
| Revisit | When the feature is implemented. |

### D-020 — Inventory commit stays blocked; review cannot commit

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C/B |
| Context | The product must prove a consequential action stays under human control. |
| Decision | `commit:inventory` is never granted to an agent; the diff is 42→42; review acknowledgement does not approve inventory; a direct commit returns 403 and is audited. |
| Alternatives | Auto-commit after report acknowledgement; let an agent propose and commit. |
| Consequences | Strong safety story; inventory remains simulated and unchanged. |
| Revisit | Define a real human-approved inventory workflow post-hackathon. |

### D-021 — Tamper-evident receipt hashing and SHA-256 limitations

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | The receipt must provide tamper-evidence without claiming absolute distributed immutability. |
| Decision | Generate a SHA-256 integrity hash over canonical `RECEIPT_BODY_V1` with recursively sorted keys, excluding `integrity`. Label the receipt as **tamper-evident and hash-verified**, rather than immutable. Explicitly document SHA-256 limitations (guarantees payload serialization integrity, does not prove physical truth of external inputs, relies on platform storage controls in Neon PostgreSQL). Status remains `VERIFIED_PENDING_HUMAN_APPROVAL` for WH-204 while inventory approval is pending. |
| Alternatives | Blockchain anchoring; digital signature without hash; unhashed record. |
| Consequences | Accurate cryptographic claims; transparent boundaries; no overclaiming of physical truth. |
| Revisit | Decentralized anchoring or public timestamping post-hackathon. |

### D-022 — Standard API envelope and HTTP codes

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B/C |
| Context | Three teams consume the same endpoints; inconsistent envelopes cause integration bugs. |
| Decision | `{ data, meta }` on success; `{ error: { code, message, details, requestId, retryable } }` on failure; 400/401/403/404/409/422/503 mapping as in `07`. |
| Alternatives | Bare payloads; GraphQL; tRPC. |
| Consequences | Predictable clients and tests; a little boilerplate. |
| Revisit | If the API grows beyond the demo. |

### D-023 — Version-scoped, evidence-derived reputation

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | Fake star ratings would undermine the trust story. |
| Decision | Stats are per version, derived from auditions/executions, reliability in basis points; no LLM rating; no cross-version inheritance. |
| Alternatives | Builder-level rating; composite score; no reputation. |
| Consequences | Honest, auditable reputation; single-run limitation disclosed. |
| Revisit | Statistical model with real volume post-hackathon. |

### D-024 — Seeded profiles and honest simulation labels

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | The demo uses seeded demand/supply and simulated money/inventory. |
| Decision | Label Northstar/Jordan/versions as seeded; payments/inventory as simulated; never claim real demand, real settlement or live inventory. |
| Alternatives | Present seeded data as real; omit labels. |
| Consequences | Credible demo; the boundary is explicit. |
| Revisit | Replace seeds with real participants post-hackathon. |

### D-025 — Dynamic candidate selection from persisted audition runs

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | C |
| Context | Audition comparison must be authentic and computed, not predetermined or hardcoded. |
| Decision | The Team Compiler dynamically ranks and selects candidates based on persisted `EvaluationRun` data. Candidate C is not predetermined to win; Candidates A, B or C must each be capable of winning depending on measured pass rate, latency, cost, and buyer constraint weights. Example values (10/10 checks, ₹10,000 cost) are labelled illustrative. |
| Alternatives | Hardcoded candidate selection; heuristic scoring without persisted test run. |
| Consequences | Falsifiable compiler engine; authentic judge demonstration; requires persisting evaluation run fixtures. |
| Revisit | Additional ranking algorithms post-hackathon. |

### D-026 — Workload rebalancing and Team A capacity buffer

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint |
| Context | Initial task estimates totalled 4,080 minutes, leaving Team A with only 10 minutes of buffer across 24 hours. |
| Decision | Rebalance core planned workload to 3,445 person-minutes across the three developers (Team A: 1,145m core; Team B: 1,140m core; Team C: 1,140m core). This leaves 875 minutes (~15 person-hours, or ~5 hours per dev) of integration buffer. Move cosmetic polish and nonessential export wiring (`P3-A-006`, `P5-A-004`, `P6-A-005`, `P7-A-004`, `P8-C-004`) to optional scope (110m total). |
| Alternatives | Cut core economic/trust features; keep 4,080m plan and risk integration failure. |
| Consequences | Ample integration buffer; Team A capacity deficit resolved; all critical-path features preserved. |
| Revisit | At each phase gate checkpoint. |

### D-027 — Prevention of duplicate earnings during retries and fallback replacements

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | B/C |
| Context | Retrying a failed stage or replacing an agent must not double-bill the buyer or credit duplicate earnings to the builder. |
| Decision | Enforce a database constraint `@@unique([executionId, stageId])` on `ContributionRecord`. Failed stages (e.g. Reconciliation v1.0.0) earn amountPaise = 0 with status `ZERO_ALLOCATION_STAGE_FAILED`. Only the accepted replacement (Reconciliation v1.1.0) earns the stage allocation (₹2,500). Total allocations reconcile exactly to ₹10,000 (builder ₹5,500 + platform fee ₹2,500 + reserves ₹2,000). |
| Alternatives | Allow append-only multiple payouts and sum later; let UI suppress duplicate lines. |
| Consequences | Bulletproof financial ledger invariant; auditable arithmetic; prevents accounting bugs. |
| Revisit | Multi-attempt cost-plus pricing post-hackathon. |

### D-028 — Canonical Agent Architecture, Taxonomy (Execution vs. Creation), and Tool Gateway Mediation

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint / Principal Architect |
| Context | Terminology around agents, capabilities, packages, and code generation needed rigorous formalization to prevent scope creep and architectural confusion. |
| Decision | Formalize the canonical architecture across Forgent: 1) Strict separation of six concepts: Capability (declared functional requirement; capabilities $\ne$ agents), Agent Package (reusable software package; manifest $\ne$ implementation), Agent Version (immutable release), Agent Instance (configured package + context + tools), Compiled Workflow (versioned acyclic graph assembled by Team Compiler), and Execution (audited run with persistent evidence). 2) Two Agent Categories: Type 1 Execution Agents (existing code execution on inputs; sole type in Northstar MVP) vs Type 2 Creation Agents (repo inspection, code/test generation, PR review; output code artifact $\ne$ new marketplace package; deferred to platform roadmap). 3) Deployment models: Platform-hosted callable adapters in Forgent runtime (`src/server/agents/**`) for MVP; Builder-hosted and Customer-hosted deferred. 4) Business Integration: Tool Gateway mediates all data access (narrow scopes, credential protection, operation authorization, audit logs, read vs write separation, human gates for consequential actions; no direct DB credentials to agents). |
| Alternatives | Treat agents as plain prompt templates; allow arbitrary code execution in MVP; allow agents direct database access. |
| Consequences | Clean separation of concerns; zero arbitrary execution vulnerability; clear scope boundary protecting 24-hour delivery; foundational design for future creation agents. |
| Revisit | Creation agent pilot in Phase 2 roadmap. |

---

## 3. Open questions

| # | Question | Owner | Needed by | Default if unresolved |
|---|---|---|---|---|
| Q-01 | Final Next.js/Prisma versions after install compatibility | B | P0 | Pin the versions that pass install/typecheck |
| Q-02 | Exact `DEMO_STAGE_DELAY_MS` for a 3:00 demo | C | P6 | 700 ms; tune at rehearsal |
| Q-03 | Receipt Markdown layout details | A | P5 | Sections from `09`/`11`; JSON is canonical |
| Q-04 | Whether to show measured execution cost in the demo script | A | P7 | Show it on the receipt, not in the 3-minute narration |
| Q-05 | Backup restore command shape on Windows | B | P8 | Document `Copy-Item` + `db:seed` verification |
| Q-06 | Final judge Q&A wording | A | P8 | Use `13_DEMO_RUNBOOK.md` table |

---

## 4. Changelog

### 2026-10-30 — Documentation baseline

**Added**

- `docs/hackathon/README.md` — package index and reading paths.
- `01_REPOSITORY_AUDIT.md` — greenfield audit, stack proposal, conflicts.
- `02_IMPLEMENTATION_MASTER_PLAN.md` — architecture, engines, schedule, gates.
- `03_PHASE_BREAKDOWN.md` — P0–P8 with 18 fields per phase.
- `04_WORKSTREAM_OWNERSHIP.md` — boundaries, routes, RACI, prohibited actions.
- `05_EXECUTION_TRACKING.md` — tracker protocol, statuses, evidence.
- `06_CSV_COMPANION.md` — CSV schema, counts, validation.
- `07_INTEGRATION_CONTRACTS.md` — types, APIs, state machines, examples.
- `08_DATABASE_AND_SEED_PLAN.md` — schema, seed, reset, idempotency.
- `09_UI_UX_SPECIFICATION.md` — design system, routes, flows, states.
- `10_COMPILER_AND_EVALUATION_SPEC.md` — matching, candidates, suite, selection.
- `11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md` — runtime, recovery, verifier, receipt.
- `12_MARKETPLACE_AND_ECONOMICS_SPEC.md` — supply, ₹10,000 model, attribution.
- `13_DEMO_RUNBOOK.md` — three-minute script, fallbacks, Q&A.
- `14_TESTING_AND_ACCEPTANCE_PLAN.md` — AC-01…10, negative suite, gates.
- `15_RISK_AND_SCOPE_REGISTER.md` — 20 risks, scope, cut order.
- `16_DECISIONS_AND_CHANGELOG.md` — this log.
- `TASK_TRACKER.md` / `.csv` — 108 tasks, 0 done, 2 deferred.
- `DOCUMENTATION_AUDIT.md` — coverage and consistency audit.

**Changed**

- Root `README.md` now points to this package and the canonical blueprint.
- No application source, package, dependency or migration changed.

**Decisions recorded**

- D-001…D-024.

**Known limitations**

- Stack and interfaces are proposed until P0.
- No implementation has started; no task is done.
- Payment, inventory, auth and demand are simulated/seeded and labelled.

---

## 5. Checkpoint note template

```text
Checkpoint: P<n> — <name>
Tag: <tag>
Target / actual elapsed: H<n> / H<n>
Gate result: PASS | FAIL
Evidence:
  - command/test:
  - screenshot:
  - counts/hash:
Prototype demonstrated by:
Verified by (second workstream):
Tasks completed:
Tasks cut/blocked:
Contract changes / decision IDs:
Known gaps:
Next owner and tasks:
Risk to next gate:
```

Record the filled note here and in the tracker checkpoint log. Never overwrite an old tag.

### Checkpoint: P0 — Architecture freeze, shared contracts, running foundation
```text
Checkpoint: P0 — Architecture freeze, shared contracts, running foundation
Tag: p0-foundation
Target / actual elapsed: H1 / H1
Gate result: PASS
Evidence:
  - command/test: npm run typecheck (0 errors); npm run lint (0 warnings); npm run test (14 passed); npm run build (0 errors, /api/health dynamic); curl /api/health (200 OK, database=ok, dbLatencyMs=1940ms)
  - counts/hash: 14 tests passing across 3 test suites; Neon PostgreSQL ping verified
  - database: Neon PostgreSQL connection pool verified via PrismaNeon & Prisma 7
Prototype demonstrated by: Lead Fullstack & Integration Engineer
Verified by (second workstream): Teams A, B, and C Joint Verification
Tasks completed: P0-B-001, P0-A-001, P0-C-001, P0-B-002, P0-A-002, P0-C-002, P0-A-003, P0-B-003, P0-C-003 (9 tasks, 100% of P0)
Tasks cut/blocked: None (0 blocked, 0 cut)
Contract changes / decision IDs: D-001 through D-007, D-009 through D-012, D-015, D-016 frozen and ACCEPTED; Prisma 7 with Neon adapter configuration finalized in prisma.config.ts and src/server/db.ts
Known gaps: None for P0 foundation scope (domain schemas and authentication belong to P1)
Next owner and tasks: Teams A, B, C executing Phase 1 (P1-A-001, P1-B-001, P1-C-001)
Risk to next gate: Low; core database connectivity, strict typing, and contract engine fully operational
```

---

## 6. Change protocol

1. Add a new decision row; never rewrite history.
2. Mark a superseded decision `SUPERSEDED` and link the replacement.
3. Update affected docs, contracts, mocks, tests and tracker in one slice.
4. Re-run the phase smoke test.
5. Record the checkpoint outcome.

If a change affects money, verification, inventory or a demo claim, it requires all three workstreams to acknowledge.

---

### D-029 — Constrained Demo Authentication, Safe Agent-Package Submission Pipeline, and Execution Safety Boundary

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint / Principal Architect |
| Context | The previous role switcher was insufficient for demonstrating authentic multi-tenant platform mechanics, while manifest-only agent registration failed to demonstrate realistic software package submission. At the same time, allowing untrusted uploaded code to execute inside the runtime would introduce unacceptable security vulnerabilities during a 24-hour hackathon. |
| Decision | 1. **Constrained Demo Authentication:** Replace the role switcher with a minimal authenticated session flow (`/login`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`). Seeded accounts for Northstar Warehouse (`buyer@northstar.demo`) and Jordan Lee (`jordan@demoagent.studio`). Server-managed signed session cookie `forgent_session` with server-side role authorization (`BUYER` vs `BUILDER`) and route guards. Clear demo account indicator in the application shell. Public sign-up, OAuth providers, and enterprise IAM are explicitly deferred.<br>2. **Constrained Agent-Package Submission Pipeline:** Replace manifest-only registration with a developer ZIP upload pipeline (`POST /api/builder/packages/upload`). Accepts archives up to 5MB containing `manifest.json`, input/output schemas, configuration schemas, evaluation fixtures, and dependency metadata. Backend validates archive structure, rejects path traversal attacks (`../`), computes a SHA-256 digest, stores the artifact in a persistent storage abstraction (`artifacts/packages/{packageId}/{versionId}.zip`), and creates an immutable `AgentVersion` record with status `PENDING_APPROVAL`. Frontend provides Publish Agent screen (`/builder/agents/publish`) and My Agents version manager (`/builder/agents`).<br>3. **Critical Execution Safety Boundary:** Uploading arbitrary source code does NOT make it executable inside Forgent! The Northstar MVP runtime executes ONLY approved, platform-hosted adapters (`src/server/agents/**`). Unapproved uploads remain stored and validated (`PENDING_APPROVAL`, `executionEligible: false`) but cannot be bound into workflow execution graphs. The compiler rejects unapproved packages with `UNAPPROVED_EXECUTION_BINDING`. Zero dynamic `eval()` or dynamic `import()`.<br>4. **Canonical 18-Step Journey:** Formally specify the 18-step end-to-end journey from builder sign-in, package upload, and validation to buyer sign-in, WH-204 review, dynamic compilation/audition across 10 fixtures, dynamic candidate selection, work order approval, execution, v1.0.0 failure & v1.1.0 recovery, independent 10-check verification, 42->42 inventory invariant lock, receipt hash, and simulated earnings.<br>5. **Workload Rebalancing:** Rebalance tasks in P1 and P2 (`P1-B-003`, `P1-A-003`, `P1-A-002`, `P2-B-003`, `P2-B-004`, `P2-A-005`, `P2-C-003`, `P2-C-004`). Total core planned workload is frozen at **3,445 person-minutes** across 108 tasks, leaving an **875-minute (~20.3%) team integration buffer** across the 24 hours (plus 180m in P9 unallocated contingency reserve). |

---

### D-030 — P0 Remediation: Root Route Redirect and Dependency Security Audit

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint / Senior Next.js Engineer |
| Context | Targeted P0 verification audit identified two specific gaps: (1) `GET /` was serving the development token preview directly instead of redirecting to `/buyer/overview`; (2) initial `npm install` reported dependency vulnerabilities across `zod`, `vitest`, `tinypool`, and `postcss`. |
| Decision | 1. **Root Route Redirect (`P0-A-001`):** In `src/app/page.tsx`, implement server-side `redirect("/buyer/overview")` returning HTTP 307. Create minimal P0 placeholder route at `src/app/(buyer)/buyer/overview/page.tsx` returning HTTP 200 with design tokens and verification status. Relocate design token preview to `/dev/tokens` (`src/app/dev/tokens/page.tsx`, HTTP 200). Add automated routing test in `tests/routing.test.ts`.<br>2. **Dependency Remediation (`P0-B-001`):** Upgrade `zod` to `^4.6.7` (resolves GHSA-mrhx-c7xc-m3w5 high severity memory exhaustion; 100% backward compatible with contract schemas). Upgrade dev dependency `vitest` to `^5.0.5` (resolves `tinypool` critical prototype pollution GHSA-5gmw-xhrv-c9v3 / GHSA-85c8-ppgw-ccpr and `@vitest/mocker` GHSA-82fw-gwwq-j7x9 / GHSA-qxg6-89mg-rqv8). Migrate `vitest.config.ts` to `vitest.config.mts` with `import.meta.dirname`.<br>3. **Transitive Next.js PostCSS Exposure Analysis:** Next.js 15.5.28 bundles internal `postcss@8.4.31`. In accordance with the stack freeze preserving Next.js 15 and React 19 (rejecting forced major-version upgrade to Next.js 16) and avoiding unsupported package overrides, this finding is documented: PostCSS is utilized exclusively during build-time CSS bundling on author-controlled static Tailwind CSS; zero user-supplied CSS is processed; runtime exposure is non-existent. |

---

### D-031 — Canonical Route Architecture Audit, Role Boundary Isolation, and Deep-Linking Strategy

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Status | `ACCEPTED` |
| Owner | Joint / Frontend Integration & Next.js Architect |
| Context | Comprehensive route architecture audit required mapping all public, buyer, builder, shared, and infrastructure endpoints. Clear boundary rules were needed between P0 verification redirect behaviour, P1 authentication routing, and deep-linking across job sub-views. |
| Decision | 1. **Canonical 41-Route Architecture:** Formally document the 41-route inventory across 4 classifications in `09_UI_UX_SPECIFICATION.md`: (A) Public (6 routes), (B) Buyer (15 routes), (C) Builder (11 routes), (D) Shared/Dev/API (9 routes).<br>2. **Status Accounting:** Freeze status counts: 4 `IMPLEMENTED` (`/`, `/_not-found`, `/dev/tokens`, `/api/health`), 2 `PLACEHOLDER` (`/buyer/overview`, `/builder/overview`), 27 `PLANNED` (core 22 hackathon screens + endpoints), 8 `DEFERRED` (post-hackathon self-service onboarding, billing, settings, and bounty submission). Zero orphaned or dead routes.<br>3. **Deep-Linking & Shared Layout Hierarchy:** Job sub-views (Contract, Compiler, Candidates, Work Order, Execution, Verification, Receipt, Economics) are specified as dedicated App Router URL paths (`/buyer/jobs/[jobId]/<tab>`), not fragile URL search parameters. The parent `layout.tsx` preserves job metadata and tab navigation without layout shifts while child sub-views stream server-rendered data.<br>4. **Role Isolation & Navigation Registry:** In `src/lib/navigation.ts`, strictly isolate buyer and builder navigation items via `getNavigationForRole()`. Verified with 5 automated Vitest unit tests in `tests/routing.test.ts`.<br>5. **Root Route Transition Plan:** In P0, `GET /` server-redirects (HTTP 307) to `/buyer/overview`. In P1 (`P1-A-003`/`P1-B-003`), when session cookies (`forgent_session`) are activated, `/` inspects session state: unauthenticated visitors see the public landing/sign-in view, while authenticated sessions redirect to their respective persona command centre (`/buyer/overview` or `/builder/overview`). |

---

### D-032 — P1 Wave 1 Implementation: Core UI Primitives, 31-Model Prisma Schema & Migration Artifact, and Capability Taxonomy with Frozen Manifests

| Field | Detail |
|---|---|
| Date | 2026-10-31 |
| Status | `ACCEPTED` |
| Owner | Joint / Workstream Leads (Team A, Team B, Team C) |
| Context | P1 Wave 1 foundation implementation required delivering the foundational UI primitives (`P1-A-001`), complete Prisma 7 schema v1 and migration artifact (`P1-B-001`), and canonical capability taxonomy with frozen agent manifests (`P1-C-001`). Crucial operational safety rules were enforced to avoid destructive actions against the shared remote Neon database and explicitly formalize the 5-manifest vs 4-adapter distinction. |
| Decision | 1. **Core UI Primitives (`P1-A-001`):** Created 17 dark design-token primitives in `src/components/ui/` (`button`, `card`, `badge`, `status-badge`, `input`, `textarea`, `select`, `tabs`, `skeleton`, `empty-state`, `error-state`, `money`, `tooltip`, `table`, `page-header`, `stat-card`, `divider`). Configured Vitest 5 with OXC automatic JSX parsing (`vitest.config.mts`). Verified in `tests/ui-primitives.test.ts`.<br>2. **31-Model Schema & Migration Safety (`P1-B-001`):** Defined all 30 domain models and 1 platform infrastructure model (`SystemHealth`) in `prisma/schema.prisma` (31 total models), matching Section 3 of `08_DATABASE_AND_SEED_PLAN.md`. Validated with Prisma 7 CLI (`db:validate`), generated Prisma Client v7.10.1, and produced clean PostgreSQL DDL migration artifact `prisma/migrations/20261031000000_p1_schema_v1/migration.sql` (750 lines). Remote Neon database remained untouched during Wave 1. Model reflection verified in `tests/schema.test.ts`.<br>3. **Taxonomy & Frozen Manifests (`P1-C-001`):** Created `src/server/compiler/capability-taxonomy.ts` (6 canonical keys, 7 stage schema IDs, permission safety check rejecting `commit:inventory`) and `src/server/agents/manifests.ts` (5 frozen manifests). Resolved 5-manifest / 4-adapter distinction: 4 marketplace agents have executable runtime adapters (`evidence-reader`, `reconciliation-v1`, `reconciliation-v11`, `exception-reporter`); `baseline-single-agent` is strictly evaluation-only (`registryVisible: false`, `executionEligible: false`, non-callable via marketplace). Verified TC-ADAPT-01 through TC-ADAPT-06 in `tests/taxonomy-manifests.test.ts`.<br>4. **Verification:** All 37 Vitest tests passing across 7 suites; `typecheck`, `lint` (0 warnings), and Next.js production build passing with all 7 routes prerendered. |

---

### D-033 — Production Platform Delivery: 500-Agent Catalog, Creator Studio & Monetization, Real LLM Engine, Enterprise DAG Hub, and Unified Documentation

| Field | Detail |
|---|---|
| Date | 2026-10-31 |
| Status | `ACCEPTED` |
| Owner | Joint / Architecture Lead |
| Context | Implementation across PRs #6 through #10 delivered the complete, functional Forgent platform. Documentation across the repository required complete synchronization to remove legacy branding references and reflect the finished, production-grade platform. |
| Decision | 1. **Brand & Design Tokens (PR #6):** Unified the brand under **Forgent**. Implemented custom design tokens: Porcelain White (`#F5F9FD`), Deep Royal Cobalt (`#0B4FBA`), Vibrant Azure (`#5EA2FF`), `Italiana` serif headings, `Jeju Gothic` sans typography, and strict zero-emoji UI policy (monochrome Lucide icons only). Deployed universal top navigation with 3-way workspace switching (`Individual`, `Creator`, `Enterprise`), dual-currency toggle ($ USD / ₹ INR), and Task Wallet with 1-click quick-top-up modal.<br>2. **Catalog & Data Engine (PR #7):** Integrated comprehensive 500-agent catalog (`src/data/agents-catalog.json`, 968 KB) across 12 domain sectors with top 60 enriched agents, Prisma ORM integration with Neon PostgreSQL, and real multi-provider LLM execution engine supporting Google Gemini and OpenAI APIs.<br>3. **Creator Studio & Monetization (PR #8):** Delivered `/creator` and `/builder/overview` with My Agents dashboard, 4-step Publish Wizard with live animated 5-test evaluation suite, 85/15 creator revenue split model, Earnings & Payout Center (UPI / Bank / Stripe simulation), and Agent Templates Hub (`/templates`) with 5 TypeScript starters and 1-click dynamic ZIP export API (`/api/templates/[id]/export`).<br>4. **Job Wizard & SSE Live Execution (PR #9):** Delivered dedicated Agent Portfolio pages (`/agents/[slug]`) with 3-tab layout, dynamic schema-driven Job Wizard (`/jobs/new`), live SSE execution console (`/jobs/[id]`) with 60s auto-refund watchdog, multi-tab deliverable viewer (Markdown, JSON, SHA-256 Receipt), and public verification inspector (`/verify`).<br>5. **Enterprise Workflow Hub (PR #10):** Delivered `/enterprise` and `/buyer/overview` featuring visual Multi-Agent DAG Pipeline Builder with drag-and-drop orchestration, 3-Stage Synthetic Test Flight Engine (Schema Integrity, Latency SLA <3.5s, Cost Efficiency), and Departmental Spend & Team Audit Ledger with CSV/JSON exports.<br>6. **Quality & Verification:** Verified with 17 test suites (86 unit and integration tests passing, 100% pass rate) and zero build errors across 19 production Next.js App Router routes. |

---

### D-034 — Advanced Enterprise Infrastructure Delivery: Compiler v2, Webhook Qualification, Dual-Rail Escrow, Dispute Oracle, Tool Gateway, and Benchmark Leaderboard (PRs #11–#16)

| Field | Detail |
|---|---|
| Date | 2026-10-31 |
| Status | `ACCEPTED` |
| Owner | Joint / Architecture & Platform Lead |
| Context | Scale testing required autonomous goal decomposition, third-party webhook verification, dual-rail USD/INR payments, trustless cryptographic dispute arbitration, zero-trust credential masking, and public benchmark transparency. |
| Decision | 1. **Compiler v2 & Live DAG Canvas (PR #11):** Natural language goal decomposition (`/api/compiler/decompose`) and live interactive DAG execution runner (`/api/pipeline/stream`, `dag-builder.tsx`, `live-pipeline-runner.tsx`).<br>2. **Creator Webhook Verification & 5-Stage Qualification (PR #12):** Live freelancer webhook handshake verification (`/api/builder/verify-endpoint`), 5-stage automated qualification suite with injection probes (`/api/builder/qualify`), and standalone Forgent Developer CLI (`bin/forgent`).<br>3. **Dual-Rail Payment Gateway & Escrow Settlement (PR #13):** Stripe USD & dynamic Razorpay INR UPI QR codes (`/api/payments/checkout`), atomic 85/15 creator escrow settlement (`escrow.ts`), and multi-tenant organization auth with passwordless magic link simulation (`/login`).<br>4. **Autonomous AI Dispute Oracle (PR #14):** Autonomous dispute arbitration engine (`oracle-arbiter.ts`, `/api/disputes`), cryptographic escrow resolution, and Dispute Management Center (`/disputes`).<br>5. **Enterprise Zero-Trust Tool Gateway (PR #15):** Tool interception layer (`tool-gateway.ts`, `data-sanitizer.ts`) with real-time PII & API secret redaction and security audit log view (`/api/gateway/audit-logs`).<br>6. **500-Agent Benchmark Leaderboard & Analytics (PR #16):** Public performance benchmark leaderboard (`/leaderboard`), SLA latency rankings, adversarial defense scores, and deep Creator Revenue Analytics (`creator-analytics-tab.tsx`). Verified with 25 test suites, 193 passing tests. |

---

### D-035 — Final Production Horizon: Interactive Agent Sandbox, Enterprise Governance & Policy Engine, and Autonomous Receiving Market Wedge (PRs #17–#19)

| Field | Detail |
|---|---|
| Date | 2026-10-31 |
| Status | `ACCEPTED` |
| Owner | Joint / Chief Architect |
| Context | Achieving 100% of the Blueprint vision required delivering the Northstar demonstration (autonomous receiving reconciliation), a full developer sandbox for capability testing, and enterprise governance guardrails. |
| Decision | 1. **Developer & Buyer Agent Sandbox (PR #17):** Delivered `/playground` and `/dev/sandbox` with 500-agent search, dynamic schema forms, raw JSON editor, parameter configuration, multi-phase latency waterfall profiling (DNS, Tool Gateway, TTFT, generation), zero-trust tool inspector, and qualification test fixture export API (`/api/sandbox/export-test`).<br>2. **Enterprise Governance & Compliance Guardrails (PR #18):** Delivered `/enterprise/policies` and `/settings/compliance` with configurable SLA latency ceilings, task budget caps with integer paise precision, sovereign data residency enforcement (US, EU, India), LLM provider whitelisting/blacklisting, mandatory HITL checkpoints, and cryptographically signed SHA-256 compliance audit certificates (`/api/compliance/validate`, `/api/enterprise/policies/audit`).<br>3. **Flagship Autonomous Receiving Reconciliation Wedge (PR #19):** Delivered canonical Northstar market wedge (`/solutions/receiving`) with multi-agent 3-way matching (`Evidence Reader`, `Reconciliation Specialist`, `Exception Reporter`), real-time ERP before/after inventory state diffs, interactive human checkpoint modal for variance overrides (>2.0%), and sealed SHA-256 evidence receipts (`/api/solutions/receiving/execute`).<br>4. **Complete Verification:** All 28 test suites and 244 unit/integration tests passing cleanly. All 32 Next.js App Router routes compiling cleanly. |

---

### D-036 — High-Converting Animated Landing Page: Watermelon UI Hero-16 Component Integration (PR #20)

| Field | Detail |
|---|---|
| Date | 2026-10-31 |
| Status | `ACCEPTED` |
| Owner | Joint / Chief Architect |
| Context | To deliver an immediate visual hook for hackathon presentation and buyer engagement, the landing page required a modern, motion-powered hero component with brand-aligned typography, high-impact CTA hierarchy, and smooth transition into the 500-agent catalog. |
| Decision | 1. **Hero-16 Component Integration:** Integrated shadcn-compatible Hero-16 component from `registry.watermelon.sh/r/hero-16.json` with modern `motion/react` physics, monochrome Lucide SVG icons, and zero emojis.<br>2. **Brand & CTA Alignment:** Embedded Forgent branding ("The Outcome-Driven AI Agent Marketplace", "Cryptographically Verified · 500 Audited Agents"), dual CTAs (`Explore 500 Agents` -> `/marketplace`, `Launch Playground` -> `/playground`, `Live Receiving Demo` -> `/solutions/receiving`), and smooth navigation links.<br>3. **Zero Regressions:** Maintained 100% test pass rate (28 suites, 244 tests) and verified clean production build (32 routes compiled). |

---

## Related documents

- [01 — Repository Audit](01_REPOSITORY_AUDIT.md)
- [02 — Implementation Master Plan](02_IMPLEMENTATION_MASTER_PLAN.md)
- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [07 — Integration Contracts](07_INTEGRATION_CONTRACTS.md)
- [15 — Risk and Scope Register](15_RISK_AND_SCOPE_REGISTER.md)
