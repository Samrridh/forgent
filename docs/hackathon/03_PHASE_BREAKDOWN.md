# 03 — Phase Breakdown

**Status:** `COMPLETED — ALL PHASES (P0-P8) DELIVERED & VERIFIED`  
**Window:** 24 elapsed hours, H0–H24 (All deliverables landed across PRs #6-#10)  
**Phase count:** 10 (P0–P9)  
**Rule:** a phase ends only when its gate is demonstrated, its prototype is usable and its checkpoint tag exists.

Each phase below records the same 18 fields so a stand-up, checkpoint or handoff can be answered from one place. Task IDs are canonical in [TASK_TRACKER.md](TASK_TRACKER.md); this document explains the phase logic, not the per-task status.

---

## Phase map

| Phase | Window | Minutes | Theme | Checkpoint | Gate in one line |
|---|---|---:|---|---|---|
| P0 | H0–H1 | 60 | Foundation and contract freeze | `p0-foundation` | App boots; contracts compile; health 200 |
| P1 | H1–H4 | 180 | Shell, login, personas, schema, seed | `p1-shell` | Authenticated login works; session cookie and role authorization enforced; both personas see seeded overviews |
| P2 | H4–H7 | 180 | Marketplace, package upload and job creation | `p2-marketplace` | Builder uploads package ZIP; validation and PENDING_APPROVAL status work; execution safety boundary enforced; catalog browses approved versions; WH-204 opens with compiled contract |
| P3 | H7–H10 | 180 | Compiler and auditions | `p3-compiler` | Auditions run dynamically across 10 fixtures; comparison matrix renders scores; A, B or C can qualify |
| P4 | H10–H13 | 180 | Selection, work order, execution, recovery | `p4-recovery` | Dynamic selection persisted; work order approved; v1.0.0 fails; v1.1.0 replaces it; downstream completes |
| P5 | H13–H16 | 180 | Verification, receipt, review, demo reset | `p5-trust` | Ten checks pass; tamper-evident hash exists; commit blocked 42 → 42; demo reset operational |
| P6 | H16–H18 | 120 | Contributions and economics | `p6-economics` | ₹5,500 eligible; v1.0.0 ₹0; fee/reserves reconcile |
| P7 | H18–H21 | 180 | Live integration, negative regression, polish | `p7-polish` | No frontend/API mocks (NEXT_PUBLIC_USE_MOCKS=false); full negative regression suite passes |
| P8 | H21–H23 | 120 | Hardening, rehearsal and release lock | `v1.0-demo` | Three clean rehearsals; runbook signed; offline fallback verified |
| P9 | H23–H24 | 60 | Unallocated contingency and demo freeze | `p9-lock` | Presentation deck aligned, AV setup verified, unallocated contingency reserve |

**Total:** 1,440 minutes. **Tasks:** 108 total, 106 actionable, 5 optional, 2 deferred. Core workload: 3,445 person-minutes (875m integration buffer across the 24 hours).

---

## P0 — Architecture freeze, shared contracts and running foundation

| Field | Detail |
|---|---|
| **1. Objective** | Create the runnable skeleton and freeze every cross-team interface before parallel feature work begins. |
| **2. Window** | H0–H1, 60 minutes. |
| **3. Entry criteria** | Repository audited; blueprint committed or staged; Node 22/npm 10 available; no application code exists. |
| **4. Exit gate** | `npm run dev` serves the app; `/api/health` returns 200 with database up; `tsc --noEmit` and lint pass; WH-204 example payloads parse; `p0-foundation` tag exists. |
| **5. Phase owner** | Joint A/B/C; B drives scaffold, C drives contracts, A drives shell/tokens. |
| **6. Tasks** | 9: `P0-B-001`, `P0-A-001`, `P0-C-001`, `P0-B-002`, `P0-A-002`, `P0-C-002`, `P0-A-003`, `P0-B-003`, `P0-C-003`. |
| **7. Critical path** | `P0-B-001` → `P0-C-001` → `P0-C-002` → `P0-A-003`. |
| **8. Parallel tracks** | A: tokens, shell stubs, navigation model. B: scaffold, Prisma/health. C: contracts, adapter interface/registry skeleton. |
| **9. Dependencies** | None external. Internal: everything depends on `P0-B-001`; contracts depend on the frozen `07_INTEGRATION_CONTRACTS.md`. |
| **10. Deliverables** | `package.json` and scripts; TypeScript/Tailwind/ESLint config; `.env.example`; `src/lib/contracts/*`; `src/server/agents/adapter.ts` + registry skeleton; `/api/health`; dark tokens; route map; checkpoint note. |
| **11. Usable prototype** | A booting app with a token/shell placeholder, a working health endpoint and a contract package that rejects invalid payloads. |
| **12. Demo evidence** | Terminal: install/dev/typecheck/lint; browser: health JSON and token palette; test: valid/invalid WH-204 payload. |
| **13. QA focus** | Clean-clone install, strict TypeScript, no secret in `.env.example`, contract negative cases, no dead navigation entries. |
| **14. Contract/data touchpoints** | All domain enums and IDs; API envelopes; Neon PostgreSQL conventions (native JSONB, enum strings, paise); Prisma 7 serverless datasource; QStash webhook signatures. |
| **15. Risks** | Scaffold delay eats P1; contract churn after freeze; Neon connection pool parameters; QStash webhook signature verification. |
| **16. Scope cut** | None. P0 is not compressible; cut visual polish, never the contract freeze or health check. |
| **17. Checkpoint tag** | `p0-foundation`. |
| **18. Handoff** | Frozen contracts + working schema base to all teams; A can build screens against mocks; B can build schema v1; C can build manifests. |

---

## P1 — Premium dashboard shell and demo personas

| Field | Detail |
|---|---|
| **1. Objective** | Make the product feel like a premium B2B console and establish the seeded identities, schema and overview data every later screen depends on. |
| **2. Window** | H1–H4, 180 minutes. |
| **3. Entry criteria** | P0 gate passed; contracts frozen; app boots; `p0-foundation` tag exists. |
| **4. Exit gate** | Authenticated login works for seeded buyer and builder; session cookie forgent_session and role authorization enforced; both personas see seeded overviews; demo badge visible; Neon schema v1 applied; seed is idempotent. |
| **5. Phase owner** | A (shell/overviews), B (schema/seed/APIs), C (manifests/adapters). |
| **6. Tasks** | 10: `P1-A-001`, `P1-B-001`, `P1-C-001`, `P1-A-002`, `P1-B-002`, `P1-C-002`, `P1-C-003`, `P1-B-003`, `P1-A-003`, `P1-A-004`. |
| **7. Critical path** | `P1-B-001` → `P1-B-002` → `P1-C-001` → `P1-C-002` / `P1-C-003`. |
| **8. Parallel tracks** | A: primitives → shell → overviews + typed mocks. B: schema → seed → dashboard APIs. C: taxonomy/manifests → four deterministic adapters. |
| **9. Dependencies** | P0 contracts; `P1-B-001` before seed/APIs; `P1-C-001` before adapters; A mocks depend on contracts only. |
| **10. Deliverables** | UI primitives; app shell with session badge and demo banner; `/login` screen with 1-click demo persona quick-select; Prisma schema v1 with `UserAccount`; deterministic seed; manifest registry; four adapters; `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, dashboard endpoints; typed client and mock fixtures. |
| **11. Usable prototype** | A polished shell with authenticated login (`/login`), session-cookie auth, role-guarded routes, and two overview dashboards showing Northstar's seeded job and Jordan's four versions. |
| **12. Demo evidence** | Persona toggle; WH-204 seeded `CONTRACT_READY`; 42 on-hand; zero spend/earnings; adapter outputs 12/12/10 and 10/2. |
| **13. QA focus** | Seed twice → identical counts; status colours and focus states; loading/empty/error states; no raw hex in page code; baseline absent from marketplace data. |
| **14. Contract/data touchpoints** | All 24 Prisma models and uniques; seed IDs; `DemoMeta`; manifest fields; stage schema IDs. |
| **15. Risks** | Schema churn blocks seed and APIs; adapters drift from fixture truth; shell polish overruns P2. |
| **16. Scope cut** | Cut optional chart/animation polish; never cut the seeded truth, persona labelling or adapter determinism. |
| **17. Checkpoint tag** | `p1-shell`. |
| **18. Handoff** | Stable seed + manifest registry to P2/P3; live overview APIs to A; adapter contract to the runtime. |

---

## P2 — Marketplace, builder profile, agent registry and job creation

| Field | Detail |
|---|---|
| **1. Objective** | Prove the marketplace side of the loop: an independent builder uploads and validates a versioned agent package (ZIP pipeline), stored with SHA-256 digest and PENDING_APPROVAL status under fail-closed execution safety (only approved platform adapters run in MVP), and a buyer inspects approved versions and creates a contract-backed job. |
| **2. Window** | H4–H7, 180 minutes. |
| **3. Entry criteria** | P1 gate passed; schema/seed stable; manifests validated; shell navigable. |
| **4. Exit gate** | Builder publishes agent package via ZIP upload; validation, storage abstraction and PENDING_APPROVAL status work; execution safety boundary enforced; catalog browses approved versions; WH-204 opens with a frozen ten-check contract; invalid job is rejected. |
| **5. Phase owner** | A (catalog/detail/wizard), B (registry/job APIs/profile), C (matcher/compiler/compatibility/gaps). |
| **6. Tasks** | 13: `P2-B-001`, `P2-A-001`, `P2-C-001`, `P2-B-002`, `P2-C-002`, `P2-A-002`, `P2-C-003`, `P2-A-003`, `P2-B-003`, `P2-C-004`, `P2-A-004`, `P2-A-005`, `P2-B-004`. |
| **7. Critical path** | `P2-B-001` → `P2-C-001` → `P2-B-002` → `P2-C-002` → `P2-C-003`. |
| **8. Parallel tracks** | A: catalog → detail → wizard → jobs shell. B: registry read → job persistence → builder APIs → seed finalisation. C: matcher → contract compiler → compatibility → gap detection. |
| **9. Dependencies** | P1 seed/manifests; contracts; `P2-C-003` feeds matcher; A works against typed mocks. |
| **10. Deliverables** | `/api/agents*`; `/api/jobs*`; `POST /api/builder/packages/upload`; package storage abstraction; archive safety validator; execution safety boundary; catalog; agent detail/version timeline; three-step wizard; jobs list/detail; Publish Agent screen (`/builder/agents/publish`); My Agents listing (`/builder/agents`); complete seeded manifest/pricing/platform-adapter links. |
| **11. Usable prototype** | Jordan uploads an agent package, validates it, and sees it persisted in PENDING_APPROVAL status with SHA-256 digest; Northstar browses four approved marketplace versions, opens an agent timeline, creates a job and sees the compiled contract preview with ten checks and blocked inventory. |
| **12. Demo evidence** | Filtered catalog URL; v1.0.0/v1.1.0 side-by-side; WH-204 contract 10/2; one new job persisted atomically. |
| **13. QA focus** | Role guards (buyer cannot register); duplicate version 409; paused versions excluded; contract preview matches compiler output; no invented manifest field. |
| **14. Contract/data touchpoints** | `AgentSummary`, `AgentManifest`, `Job`, `AcceptanceContract`; agent+version uniqueness; job+contract transaction; pricing in paise. |
| **15. Risks** | Catalog becomes a static mock; contract compiler ambiguity; builder registration scope creep. |
| **16. Scope cut** | Cut advanced catalog search facets and the capability-gap panel (`P3-A-006`); keep version visibility, registration and contract compilation. |
| **17. Checkpoint tag** | `p2-marketplace`. |
| **18. Handoff** | Persisted candidates-ready job to P3; stable manifest/version data to compiler; contract preview to A. |

---

## P3 — Capability matching, Team Compiler, auditions and selection

| Field | Detail |
|---|---|
| **1. Objective** | Show the intelligence engine honestly: decompose the job, match capabilities, generate three bounded candidates, audition them on the same suite, and select on hard constraints. |
| **2. Window** | H7–H10, 180 minutes. |
| **3. Entry criteria** | P2 gate passed; WH-204 `CONTRACT_READY`; matcher and contract compiler available; manifests and fixtures validated. |
| **4. Exit gate** | Compile persists three candidates in Neon; auditions run across 10 fixtures for Candidates A, B, and C (thirty measured results); comparison matrix renders audition scores and candidate breakdown. Selection is computed dynamically at the entry of P4. |
| **5. Phase owner** | C (compiler/auditions), B (persistence/APIs), A (graph/comparison/compiler UX). |
| **6. Tasks** | 12: `P3-B-001`, `P3-A-001`, `P3-C-001`, `P3-B-002`, `P3-C-002`, `P3-A-002`, `P3-C-003`, `P3-B-003`, `P3-A-003`, `P3-C-005`, `P3-A-004`, `P3-A-006` (optional). |
| **7. Critical path** | `P3-B-001` → `P3-C-001` → `P3-C-002` → `P3-C-003` → `P3-B-003`. |
| **8. Parallel tracks** | A: graph → comparison → compiler panel → live integration → responsive polish. B: candidate persistence → compile endpoint → audition API. C: candidates → runner → assertions → fixture suite. |
| **9. Dependencies** | P2 matcher/compiler; P1 manifests/adapters; `P3-C-003` before runner; `P3-B-003` before A integration. |
| **10. Deliverables** | Persisted candidates/stages/evaluations; `POST/GET /compile`; `POST/GET /auditions`; React Flow graph; A/B/C comparison; compiler panel; ten-fixture `wh204-suite-v1`. |
| **11. Usable prototype** | A buyer runs compile, watches auditions across 10 fixtures, and compares three candidate columns with measured hard checks, cost, latency and recovery. Dynamic ranking and selection are prepared for P4. |
| **12. Demo evidence** | Three candidate graphs; thirty fixture results; audition comparison matrix with measured hard checks and illustrative references. |
| **13. QA focus** | Determinism (same seed → same hash); acyclic graphs; held-out fixtures not leaked; critical failure cannot be outranked; baseline `registryVisible=false`; timeout leaves no infinite run. |
| **14. Contract/data touchpoints** | `WorkflowGraph`, `WorkflowCandidate`, `EvaluationRun`, `EvaluationFixtureResult`, `EvaluationAssertion`; unique `(jobId, strategy)`; suite version; Neon PostgreSQL persistence. |
| **15. Risks** | Audition payload too large; comparison invents a score; graph complexity overruns. (A capacity rebalanced: 190m core fits comfortably in 240m window). |
| **16. Scope cut** | Drop `P3-A-006` and defer `P3-A-005` polish if needed. Never cut the ten-fixture suite or persisted candidate evaluations. |
| **17. Checkpoint tag** | `p3-compiler`. |
| **18. Handoff** | Persisted candidates + thirty audition fixture results to P4 for dynamic selection ranking and work order; live graph payload to A. |

---

## P4 — Dynamic selection, work order, execution runtime, failure and recovery

| Field | Detail |
|---|---|
| **1. Objective** | Dynamically rank audition results to select the qualifying candidate, establish safe execution limits and the 42→42 inventory invariant, approve the work order, and prove controlled failure, bounded recovery, and downstream correctness. |
| **2. Window** | H10–H13, 180 minutes. |
| **3. Entry criteria** | P3 gate passed; audition results persisted across 10 fixtures for Candidates A, B, and C; comparison matrix rendered; execution schema and runtime policy frozen. |
| **4. Exit gate** | Dynamic candidate ranking selects and persists the winning candidate (A, B, or C eligible to win) and selection rationale; fail-closed execution limits and 42-to-42 state invariant locked before execution (`P4-C-004`); buyer approves a ₹10,000 work order; six stages run in order with QStash step events; v1.0.0 fails at reconciliation with `AGENT_SCHEMA_INVALID`; compatibility checks pass for v1.1.0; downstream stages rerun; the run reaches the approval gate with 10/2; a no-fallback scenario stops safely. |
| **5. Phase owner** | B (selection persistence/work order/execution/recovery persistence), C (dynamic ranking/limits & invariant/orchestrator/recovery), A (selection UI/approval/monitor/recovery UI). |
| **6. Tasks** | 13: `P3-C-004`, `P3-B-004`, `P4-B-001`, `P4-A-001`, `P4-C-001`, `P4-B-002`, `P4-A-002`, `P4-C-002`, `P4-B-003`, `P4-C-003`, `P4-A-003`, `P4-A-004`, `P4-C-004`. |
| **7. Critical path** | `P3-C-004` → `P3-B-004` → `P4-B-001` → `P4-C-004` → `P4-B-002` → `P4-C-001` → `P4-C-002` → `P4-C-003`. |
| **8. Parallel tracks** | A: dynamic selection card → work-order approval → monitor → recovery visualisation → safe-failure state. B: candidate selection persistence → work order → execution/event persistence → recovery API. C: candidate ranking (`P3-C-004`) → limits & 42→42 invariant guard (`P4-C-004`) → orchestrator & QStash webhooks (`P4-C-001`) → failure injection (`P4-C-002`) → fallback/rerun (`P4-C-003`). |
| **9. Dependencies** | P3 audition results; dynamic selection ranking before work order; limits and 42→42 invariant locked before runtime execution; execution persistence before recovery API; A mocks first, live integration after `P4-B-003`. |
| **10. Deliverables** | Dynamic candidate ranking; persisted winning workflow; safe execution limits; locked 42-to-42 invariant guard; work order + allocations; approval endpoint; orchestrator with QStash webhook step progression; execution/stage/event persistence; polling payload; failure injection; recovery events; downstream invalidation; monitor; recovery card; safe-failure panel. |
| **11. Usable prototype** | Dynamically select the winning candidate from audition scores (A, B, or C), approve the ₹10,000 work order, watch the live timeline, see v1.0.0 fail, v1.1.0 replace it with a dashed edge, and see downstream stages complete with invariant preserved. |
| **12. Demo evidence** | Dynamic selection audit log (computed from persisted audition runs); allocation table sums to ₹10,000; failure code and raw malformed output; one recovery event; v1.1.0 output 10/2; failed version ₹0 (economics shown in P6). |
| **13. QA focus** | Dynamic selection is computed (not hardcoded; Candidate A, B, or C can win); fail-closed limits enforced before stage 1; monotonic event sequence; failed attempt immutable; reload resumes; no duplicate polling; no successful terminal state on no-fallback. |
| **14. Contract/data touchpoints** | `SelectionResult`, `WorkOrder`, `WorkOrderAllocation`, `ExecutionRun`, `StageRun`, `ExecutionEvent`, `RecoveryEvent`; `AGENT_SCHEMA_INVALID`; `NO_COMPATIBLE_FALLBACK`; `FAILED_SAFE`; QStash webhook receiver. |
| **15. Risks** | Recovery logic is the hardest correctness area; polling races; dev-server restart mid-run; reserve/limit bugs. (Team C utilization 175m / 180m capacity). |
| **16. Scope cut** | Cut escalation polish (`P4-A-004`) only after the safe-stop path is proven by tests. Never cut dynamic selection, limits, failure visibility or recovery. |
| **17. Checkpoint tag** | `p4-recovery`. |
| **18. Handoff** | Terminal execution state + recovery evidence to P5 verifier; stable stage/event payloads to A. |

---

## P5 — Independent verification, evidence receipt and human review

| Field | Detail |
|---|---|
| **1. Objective** | Establish trust: independently recompute the outcome, verify the 42→42 inventory invariant, explain ten checks, hash the evidence, and keep the consequential inventory action blocked. |
| **2. Window** | H13–H16, 180 minutes. |
| **3. Entry criteria** | P4 gate passed; execution at the approval gate; generated outputs and evidence available; receipt/economics shapes frozen. |
| **4. Exit gate** | Verifier passes all ten checks for WH-204; independently verifies that inventory remained 42→42; a false agent success fails; state diff shows 42→42 on-hand invariant, pending 10, variance 2; tamper-evident receipt hash is generated; buyer review acknowledges without committing inventory; direct commit is blocked and audited; demo reset restores clean Neon PostgreSQL state. |
| **5. Phase owner** | C (verifier/state diff/invariant verification/gate/negatives), B (acceptance persistence/receipt/review/Neon reset), A (verification/receipt/review UI/compiler polish). |
| **6. Tasks** | 14: `P3-A-005`, `P4-B-004`, `P5-C-001`, `P5-B-001`, `P5-A-001`, `P5-C-002`, `P5-B-002`, `P5-A-002`, `P5-C-004`, `P5-B-003`, `P5-A-003`, `P5-B-004`, `P5-A-004` (optional), `P5-A-005` (deferred). |
| **7. Critical path** | `P5-C-001` → `P5-C-002` → `P5-B-001` → `P5-B-002` → `P5-B-003`. |
| **8. Parallel tracks** | A: verification screen → receipt → review interaction → optional export UI (`P5-A-004`) + compiler polish (`P3-A-005`). B: acceptance persistence → receipt service → review API → export endpoints → Neon reset endpoint (`P4-B-004`). C: independent verifier → state diff & 42→42 invariant verification → negatives → approval gate. |
| **9. Dependencies** | P4 recovery; `P5-C-001` before acceptance persistence; `P5-C-002` before receipt; receipt before economics. |
| **10. Deliverables** | Independent verifier; ten check results; state diff; acceptance API; tamper-evident canonical receipt with SHA-256; receipt document; JSON/Markdown export; review API/UI; blocked commit guard (42 → 42); Neon PostgreSQL clean reset endpoint. |
| **11. Usable prototype** | A verified-pending-review seal, ten checks with expected/actual/evidence, the 42→42 diff, a copyable receipt hash and an acknowledge flow that leaves the commit blocked. |
| **12. Demo evidence** | Ten passing checks; false-success negative fails; independent verification of 42→42 invariant; tamper-evident receipt hash stable across reads; ledger unchanged (42 → 42); blocked commit attempt audited. |
| **13. QA focus** | Verifier absent from registry; canonicalisation stable; re-verification idempotent; no auto-approve; SHA-256 limitations explained; all money labelled simulated. |
| **14. Contract/data touchpoints** | `AcceptanceResult`, `AcceptanceCheck`, `StateDiff`, `EvidenceReceipt`, `InventoryCommitStatus`; `RECEIPT_BODY_V1`; ten AC codes; separate fields `expectedQuantity`, `invoicedQuantity`, `scannedQuantity`, `discrepancyQuantity`. |
| **15. Risks** | Receipt body drifts from persisted evidence; hash instability from ordering/timestamps; review accidentally mutates ledger. (A capacity rebalanced: 120m core fits comfortably in 180m window). |
| **16. Scope cut** | Defer PDF (already `DROPPED`); treat `P5-A-004` as optional scope. Cut receipt visual flourish, never the ten checks, invariant verification, hash or review gate. |
| **17. Checkpoint tag** | `p5-trust`. |
| **18. Handoff** | Verified acceptance + receipt + review state to P6 economics; canonical receipt body to attribution. |

---

## P6 — Builder contribution, earnings, platform economics and reputation

| Field | Detail |
|---|---|
| **1. Objective** | Close the economic loop: pay only accepted stage contributions, show the platform fee and reserves, keep the replaced version at zero, and update version-specific reputation. |
| **2. Window** | H16–H18, 120 minutes. |
| **3. Entry criteria** | P5 gate passed; acceptance result verified; receipt body available; work-order allocations and recovery events persisted. |
| **4. Exit gate** | Evidence Reader ₹2,000; v1.1.0 ₹2,500; v1.0.0 ₹0; Exception Reporter ₹1,000; builder total ₹5,500; platform fee ₹2,500; reserves ₹1,200/₹800; status `ELIGIBLE_SIMULATED`; buyer total ₹10,000; reputation isolated by version. |
| **5. Phase owner** | C (attribution/economics rules), B (contributions/settlement/aggregation), A (transactions/earnings/reputation UI). |
| **6. Tasks** | 13: `P6-C-001`, `P6-B-001`, `P6-A-001`, `P6-B-002`, `P6-A-002`, `P6-C-002`, `P6-A-003`, `P6-B-003`, `P6-A-004`, `P6-B-004`, `P6-C-003`, `P6-C-004`, `P6-A-005` (optional). |
| **7. Critical path** | `P6-C-001` → `P6-B-001` → `P6-B-002` → `P6-C-002`. |
| **8. Parallel tracks** | A: buyer transactions → builder earnings → reputation → receipt economics. B: contributions → settlement → stats → dashboards. C: attribution → idempotency → reputation rules → reconciliation tests. |
| **9. Dependencies** | P5 acceptance/receipt; `P6-C-001` before contributions; contributions before settlement; stats after recovery. |
| **10. Deliverables** | Attribution policy; contribution records; settlement eligibility; economics API; transactions; earnings; reputation panel/stats; receipt economics card; reconciliation tests. |
| **11. Usable prototype** | Buyer sees ₹10,000 simulated spend with the full breakdown; builder sees ₹5,500 eligible across stages, ₹0 for v1.0.0, ₹2,500 for v1.1.0, and version-scoped reputation. |
| **12. Demo evidence** | Exact paise totals; no duplicate rows on replay; v1.0.0 reason `REPLACED_BEFORE_ACCEPTED_OUTPUT`; no provider reference; simulated labels. |
| **13. QA focus** | Integer arithmetic; allocation sum property; failed version earns zero; replay idempotency; no cross-version stat leakage; no "paid" copy. |
| **14. Contract/data touchpoints** | `ContributionRecord`, `SettlementRecord`, `AgentVersionStats`; unique `(executionId, stageId)`; `ELIGIBLE_SIMULATED`; `provider: null`. |
| **15. Risks** | A is 25m over before optional work; attribution ambiguity; double payout on replay; reputation leakage across versions. |
| **16. Scope cut** | Drop `P6-A-005`; defer reputation chart polish. Never cut v1.0.0 ₹0, the ₹5,500 total or settlement idempotency. |
| **17. Checkpoint tag** | `p6-economics`. |
| **18. Handoff** | Full live economic data to P7 integration and the demo narrative. |

---

## P7 — Premium UX completion and full integration

| Field | Detail |
|---|---|
| **1. Objective** | Remove every mock, harden the API surface, run the full chain on live data and freeze the visual system. |
| **2. Window** | H18–H21, 180 minutes. |
| **3. Entry criteria** | P6 gate passed; all engines and screens exist; reset implemented; demo flags documented. |
| **4. Exit gate** | Every demo route runs with `NEXT_PUBLIC_USE_MOCKS=false` (zero UI/mock layer; all calls hit live Next.js route handlers with Neon PostgreSQL connection pooling and QStash durable step webhooks); buyer and builder journeys complete; no dead link or fake action; seeded profiles and simulated settlement remain clearly labelled; three resets produce identical state; contract tests pass. |
| **5. Phase owner** | A (live integration/polish/responsive), B (API hardening/reset/performance), C (live chain regression/demo mode/latency). |
| **6. Tasks** | 12: `P5-C-003`, `P7-A-001`, `P7-B-001`, `P7-C-001`, `P7-A-002`, `P7-B-002`, `P7-C-002`, `P7-A-003`, `P7-B-003`, `P7-C-003`, `P7-A-004` (optional), `P7-B-004` (deferred). |
| **7. Critical path** | `P7-A-001` → `P7-B-001` → `P7-C-001` (integration chain), with `P7-C-002` feeding rehearsal. |
| **8. Parallel tracks** | A: route-by-route mock removal → visual polish → responsive QA. B: envelope/role/index hardening → reset/backup → polling payloads. C: chain regression → deterministic demo mode → latency. |
| **9. Dependencies** | All P6 UI/API work; reset from P4; helper tasks `P7-B-001`/`P7-C-001` gate A's final integration. |
| **10. Deliverables** | Live-wired UI without mock layer; route parity checklist; API contract report; hardened reset; seeded backup; demo config; responsive fixes. |
| **11. Usable prototype** | The entire journey, from seeded WH-204 to verified receipt and builder earnings, runs on live APIs with no mock fixtures and a one-click reset. |
| **12. Demo evidence** | Network log shows real API route handlers executing; three resets with identical IDs/counts; full flow under 15s; audition under 60s. |
| **13. QA focus** | Mock leakage; persona guard bypass; reset races; layout overflow; status semantics; dead CTA scan; honest simulation labels. |
| **14. Contract/data touchpoints** | Whole API surface; error envelopes; role checks; indexes; demo flags; canonical outputs; Neon PostgreSQL connection pooling. |
| **15. Risks** | Late integration reveals shape mismatches; reset instability; visual polish steals rehearsal time. (A capacity rebalanced: 100m core fits comfortably in 120m window). |
| **16. Scope cut** | Drop `P7-A-004`; limit responsive work to 1024+; never cut live integration, reset or the contract suite. |
| **17. Checkpoint tag** | `p7-polish`. |
| **18. Handoff** | Frozen live build + reset + backup to P8 rehearsal. |

---

## P8 — Regression, hardening, repeated demo and final lock

| Field | Detail |
|---|---|
| **1. Objective** | Prove the demo is repeatable under pressure, lock the build and hand the team a signed runbook. |
| **2. Window** | H21–H23, 120 minutes. |
| **3. Entry criteria** | P7 gate passed; live build; backup; no known P0 blocker; runbook draft exists. |
| **4. Exit gate** | Buyer and builder regressions pass; API/database/reset regression passes in Neon PostgreSQL; nine negative cases behave safely; three consecutive rehearsals reach the verified receipt and eligible simulation; `v1.0-demo` tag exists; runbook signed. |
| **5. Phase owner** | Joint; A leads buyer/judge rehearsal, B leads API/reset/backup, C leads determinism/negative paths/technical chain. |
| **6. Tasks** | 12: `P8-A-001`, `P8-B-001`, `P8-C-001`, `P8-A-002`, `P8-C-002`, `P8-B-002`, `P8-A-003`, `P8-B-003`, `P8-C-003`, `P8-A-004`, `P8-B-004`, `P8-C-004` (optional). |
| **7. Critical path** | `P8-A-001` → `P8-B-001` → `P8-C-001` → `P8-C-002` → `P8-C-003` → `P8-A-004`. |
| **8. Parallel tracks** | A: buyer regression → builder/label audit → build/screenshots → judge rehearsal. B: API/reset regression → backup/restore → final tag → environment/offline. C: negative suite → determinism → three technical rehearsals → optional adversarial fixtures. |
| **9. Dependencies** | P7 frozen build; backup before rehearsals; every rehearsal uses a reset. |
| **10. Deliverables** | Buyer/builder regression reports; API/reset report; negative-path report; determinism report; seeded backup + restore path; final screenshots; signed runbook; `v1.0-demo` tag. |
| **11. Usable prototype** | A stable, repeatable demo that any teammate can run from reset to receipt in under 3:15 without manual repair. |
| **12. Demo evidence** | Three timing sheets; identical canonical hashes/amounts; restored backup; clean production build; signed checklist. |
| **13. QA focus** | No false success; no duplicate payout; no unrehearsed fix; offline run; label accuracy; clean working tree. |
| **14. Contract/data touchpoints** | Final frozen contracts; canonical receipt hash; exact economics; reset/backup integrity. |
| **15. Risks** | Rehearsal exposes a late defect; Neon connection pooling timeout under burst; backup/restore drift; judge timing overrun; someone edits a frozen contract. |
| **16. Scope cut** | Drop `P8-C-004`. Rehearsals and the tag are non-negotiable; if a defect is severe, cut a P1/P2 UI feature and record it. |
| **17. Checkpoint tag** | `v1.0-demo`. |
| **18. Handoff** | Signed runbook, seeded backup, tagged build and decision log to the demo team. |

---

## P9 — Unallocated contingency, final live rehearsal & demo freeze

| Field | Detail |
|---|---|
| **1. Objective** | Provide a dedicated unallocated contingency buffer, verify presentation AV and laptop hardware, and perform final release freeze. |
| **2. Window** | H23–H24, 60 minutes. |
| **3. Entry criteria** | P8 gate passed; `v1.0-demo` tag committed; signed runbook in hand; zero open blockers. |
| **4. Exit gate** | Presentation deck aligned; projector/screen mirroring tested; zero open blockers; final emergency buffer preserved. |
| **5. Phase owner** | Joint A/B/C; full team demo rehearsal. |
| **6. Tasks** | 0 scheduled development tasks (180 person-minutes emergency contingency reserve). |
| **7. Critical path** | Standby buffer; live AV rehearsal. |
| **8. Parallel tracks** | A: slide deck & UI walk-through. B: clean reset and backup verification. C: model connectivity & fallback verification. |
| **9. Dependencies** | Complete P0–P8 implementation. |
| **10. Deliverables** | Verified presentation hardware, clean live environment, zero-defect demo readiness. |
| **11. Usable prototype** | Locked production release on `main` ready for judging. |
| **12. Demo evidence** | Final successful live run on presentation machine. |
| **13. QA focus** | Hardware stability, projector resolution, network failure isolation. |
| **14. Contract/data touchpoints** | Seeded demo truth intact. |
| **15. Risks** | Venue WiFi loss (mitigated by deterministic fallback and cached local test fixtures). |
| **16. Scope cut** | N/A (no scheduled tasks). |
| **17. Checkpoint tag** | `p9-lock`. |
| **18. Handoff** | Ready for judge demonstration. |

---

## Cross-phase rules

1. **Gate, then next.** Parallel work may start against frozen contracts, but a phase cannot be declared complete without its gate.
2. **Prototype, not progress.** "80% of the compiler" is not a P3 prototype. Three candidates must render and audition.
3. **Cut optional, never core.** The cut order is: optional polish → P1/P2 visual extras → secondary screens → nothing in the economic or trust loop.
4. **One truth chain.** Every phase must preserve the canonical WH-204 values: 12 expected, 12 invoiced, 10 received, 2 discrepancy, 42 on-hand, ₹10,000, ₹5,500, ₹2,500.
5. **Evidence at the gate.** A gate result is a command output, screenshot, test report or receipt hash — not an opinion.
6. **No hidden work.** If a task is cut, its ID is marked `DROPPED`, its navigation entry is removed and the decision log records why.

---

## Related documents

- [02 — Implementation Master Plan](02_IMPLEMENTATION_MASTER_PLAN.md)
- [04 — Workstream Ownership](04_WORKSTREAM_OWNERSHIP.md)
- [TASK_TRACKER.md](TASK_TRACKER.md)
- [14 — Testing and Acceptance Plan](14_TESTING_AND_ACCEPTANCE_PLAN.md)
- [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md)
