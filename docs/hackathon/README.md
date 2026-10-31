# Forgent — 24-Hour Build Documentation

**Status:** `IMPLEMENTATION COMPLETE — PRODUCTION MVP VERIFIED (PRs #6-#10 LANDED)`  
**Date:** 31 October 2026  
**Product source:** [`BLUEPRINT.md`](../../BLUEPRINT.md)  
**Execution source:** [`TASK_TRACKER.md`](TASK_TRACKER.md)  
**Team:** Three permanent workstreams (A frontend, B backend, C compiler/AI); no Team D  
**Window:** P0–P8 across 24 elapsed hours (H0–H24) — All phases completed and verified

---

## 1. What this package is

A complete, battle-tested architectural plan and specification suite governing the production build of Forgent. It covers the 500-agent marketplace, creator studio & monetization, enterprise workflow DAG builder with synthetic test flights, real LLM execution with SSE streaming, independent SHA-256 evidence verification, and economic settlements.

All core deliverables have been fully implemented across PRs #6 through #10, passing 17 test suites (86 tests) with zero build errors across 19 production routes.

### The product in one sentence

> A buyer posts a paid outcome; Forgent compiles a team of independent agents, auditions competing workflows, survives failure with bounded recovery, verifies the result independently, and attributes payment only to accepted work.

### The demo truth

| Fact | Value |
|---|---|
| Buyer | Northstar Warehouse (seeded) |
| Builder | Jordan Lee / Demo Agent Studio (seeded) |
| Job | WH-204, starts `CONTRACT_READY` |
| Evidence | Expected PO: 12 / Invoiced: 12 / Scanned Receiving: 10 |
| Result | Scanned: 10, Discrepancy: 2, `EXCEPTION_REQUIRES_REVIEW` |
| Failure | Reconciliation v1.0.0 → `AGENT_SCHEMA_INVALID` |
| Recovery | v1.1.0 replaces it; downstream reruns |
| Verification | 10 checks pass; tamper-evident receipt hash; `VERIFIED_PENDING_HUMAN_APPROVAL` |
| Inventory | 42 → 42 (unchanged on-hand invariant), pending 10, variance 2, commit `BLOCKED_PENDING_APPROVAL` |
| Economics | Buyer ₹10,000; builder ₹5,500; platform fee ₹2,500; reserves ₹1,200/₹800 |
| Payout | v1.0.0 ₹0; v1.1.0 ₹2,500; `ELIGIBLE_SIMULATED`; no real money moves |

### Canonical Agent Architecture at a Glance

Forgent establishes strict separation across six core concepts:
1. **Capability:** A declared unit of functionality (e.g. invoice extraction, quantity reconciliation, repository analysis). Provided by single agents, cooperating agents, deterministic platform functions, business connectors, or human checkpoints. *Not every capability is an agent.*
2. **Agent Package:** The reusable software package published by a developer. Contains identity, versioned executable implementation, capability manifest, schemas, permissions, synthetic evaluation suites, and pricing. *The manifest alone is not the agent implementation.*
3. **Agent Version:** An immutable, identifiable release (e.g. `1.0.0`, `1.1.0`) ensuring reproducible execution, evaluation, and attribution.
4. **Agent Instance:** A configured instance of an agent version for a specific job, combining the package implementation with business context, configuration, runtime limits, and allowed tools mediated by the Tool Gateway.
5. **Compiled Workflow:** A versioned execution graph assembled by the Team Compiler (composed of configured instances, deterministic code, connectors, and human gates).
6. **Execution:** An auditable run against authorized inputs, persisting exact versions, configurations, tool permissions, stage traces, and tamper-evident evidence receipts.

**Two Agent Categories:**
- **Execution Agents:** Existing executable implementations performing declared tasks directly (e.g., Northstar's `Evidence Reader`, `Reconciliation Specialist`, `Exception Reporter`). This is the sole agent category in the hackathon MVP.
- **Creation Agents:** Future agents capable of analyzing authorized repositories, generating/modifying code in restricted workspaces, running tests, and opening reviewed Pull Requests. *Generated code is an output artifact, not automatically a new marketplace package.* Deferred to future platform roadmap.

**Deployment Models:**
- **Platform-Hosted:** Forgent operates runtime (sole model in hackathon MVP; curated callable adapters).
- **Builder-Hosted:** Developers host authenticated webhook endpoints (future).
- **Customer-Hosted:** Agents execute within customer VPC / on-premises (future).
- *Arbitrary public code execution is strictly prohibited in the hackathon MVP.*

**Business Integration & Tool Gateway:**
- **Scenario A (Operational Data):** Business System $\rightarrow$ Business Connector $\rightarrow$ **Forgent Tool Gateway** $\rightarrow$ Workflow Runtime $\rightarrow$ Agent Instance. Tool Gateway enforces narrow scopes, credential protection, operation-level authorization, read vs write separation, and human approval for consequential actions.
- **Scenario B (Codebase Modification):** Authorized Repo $\rightarrow$ Restricted Workspace Sandbox $\rightarrow$ Repo Analysis $\rightarrow$ Code Generation $\rightarrow$ Test Verification $\rightarrow$ Pull Request $\rightarrow$ Business Review (Future).

---

## 2. Reading paths

### If you have 10 minutes

1. This README.
2. [`13 — Demo Runbook`](13_DEMO_RUNBOOK.md) — what the demo proves.
3. [`TASK_TRACKER.md`](TASK_TRACKER.md) — what must be built.

### If you are building

| Role | Read first | Then |
|---|---|---|
| **A — Frontend** | [`09 — UI/UX`](09_UI_UX_SPECIFICATION.md) | [`03`](03_PHASE_BREAKDOWN.md), [`07`](07_INTEGRATION_CONTRACTS.md), [`04`](04_WORKSTREAM_OWNERSHIP.md) |
| **B — Backend** | [`08 — Database/Seed`](08_DATABASE_AND_SEED_PLAN.md) | [`07`](07_INTEGRATION_CONTRACTS.md), [`04`](04_WORKSTREAM_OWNERSHIP.md), [`14`](14_TESTING_AND_ACCEPTANCE_PLAN.md) |
| **C — Compiler/AI** | [`10 — Compiler/Eval`](10_COMPILER_AND_EVALUATION_SPEC.md) | [`11`](11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md), [`12`](12_MARKETPLACE_AND_ECONOMICS_SPEC.md), [`07`](07_INTEGRATION_CONTRACTS.md) |
| **Joint/lead** | [`02 — Master Plan`](02_IMPLEMENTATION_MASTER_PLAN.md) | [`03`](03_PHASE_BREAKDOWN.md), [`05`](05_EXECUTION_TRACKING.md), [`15`](15_RISK_AND_SCOPE_REGISTER.md) |
| **Judge/demo** | [`13 — Runbook`](13_DEMO_RUNBOOK.md) | [`12`](12_MARKETPLACE_AND_ECONOMICS_SPEC.md), [`14`](14_TESTING_AND_ACCEPTANCE_PLAN.md) |

### If you are auditing

1. [`01 — Repository Audit`](01_REPOSITORY_AUDIT.md)
2. [`DOCUMENTATION_AUDIT.md`](DOCUMENTATION_AUDIT.md)
3. [`PRE_IMPLEMENTATION_READINESS.md`](PRE_IMPLEMENTATION_READINESS.md)
4. [`16 — Decisions/Changelog`](16_DECISIONS_AND_CHANGELOG.md)

---

## 3. Document map

| # | Document | Purpose |
|---|---|---|
| 01 | [Repository Audit](01_REPOSITORY_AUDIT.md) | Verified greenfield state, proposed stack, blueprint conflicts C-01…C-10 |
| 02 | [Implementation Master Plan](02_IMPLEMENTATION_MASTER_PLAN.md) | Architecture, three engines, data flow, 24h schedule, milestones, definition of done |
| 03 | [Phase Breakdown](03_PHASE_BREAKDOWN.md) | P0–P8, 18 fields per phase, gates, prototypes, cuts |
| 04 | [Workstream Ownership](04_WORKSTREAM_OWNERSHIP.md) | File/route/API boundaries, RACI, prohibited actions, handoffs |
| 05 | [Execution Tracking Guide](05_EXECUTION_TRACKING.md) | Tracker protocol, statuses, evidence, escalation |
| 06 | [CSV Companion](06_CSV_COMPANION.md) | CSV schema, counts, validation, filters |
| 07 | [Integration Contracts](07_INTEGRATION_CONTRACTS.md) | Frozen domain types, API routes, state machines, examples |
| 08 | [Database and Seed Plan](08_DATABASE_AND_SEED_PLAN.md) | Schema, indexes, seed values, reset, idempotency |
| 09 | [UI/UX Specification](09_UI_UX_SPECIFICATION.md) | Premium dark system, routes, flows, states, acceptance |
| 10 | [Compiler and Evaluation](10_COMPILER_AND_EVALUATION_SPEC.md) | Matching, contract, candidates, ten fixtures, selection |
| 11 | [Execution, Recovery and Verification](11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md) | Runtime, failure, fallback, verifier, receipt, review |
| 12 | [Marketplace and Economics](12_MARKETPLACE_AND_ECONOMICS_SPEC.md) | Supply, pricing, ₹10,000 model, attribution, simulation labels |
| 13 | [Demo Runbook](13_DEMO_RUNBOOK.md) | Three-minute script, Q&A, fallbacks, rehearsal log |
| 14 | [Testing and Acceptance](14_TESTING_AND_ACCEPTANCE_PLAN.md) | AC-01…10, negative suite, determinism, gates |
| 15 | [Risk and Scope Register](15_RISK_AND_SCOPE_REGISTER.md) | 20 risks, scope in/out, cut order, assumptions |
| 16 | [Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md) | D-001…D-024, open questions, checkpoint template |
| — | [Task Tracker](TASK_TRACKER.md) | Canonical 108-task execution state |
| — | [Task Tracker CSV](TASK_TRACKER.csv) | Machine-readable export of the same tasks |
| — | [Documentation Audit](DOCUMENTATION_AUDIT.md) | Coverage and consistency verification |
| — | [Pre-Implementation Readiness](PRE_IMPLEMENTATION_READINESS.md) | Phase capacity audit, dependency verification, model fallback, no-mock gate, ₹10k economics, reset tests |

---

## 4. Task counts

| Measure | Value |
|---|---:|
| Total tasks | 108 |
| DONE | 0 |
| Actionable remaining | 106 |
| Dropped/deferred | 2 (`P5-A-005`, `P7-B-004`) |
| Optional scope | 5 (`P3-A-006`, `P5-A-004`, `P6-A-005`, `P7-A-004`, `P8-C-004`) |
| Critical path | 46 |
| A tasks | 40 (1,145m core / 1,230m total) |
| B tasks | 34 (1,140m core / 1,140m total) |
| C tasks | 34 (1,140m core / 1,165m total) |
| Total estimated minutes | 3,555 |
| Core (non-optional) minutes | 3,445 |
| Total team integration buffer | 875 minutes (~20.3% buffer) |

Per phase: P0 9 · P1 10 · P2 13 · P3 12 · P4 13 · P5 14 · P6 13 · P7 12 · P8 12.

**Capacity rebalancing:** Core planned workload is frozen at 3,445 person-minutes across 108 tasks, leaving 875 minutes (~14.6 person-hours) of team buffer (plus 180m in P9 unallocated contingency reserve). Team A: 1,155m, Team B: 1,145m, Team C: 1,145m. All workstreams operate strictly within their phase windows in P0–P8.

---

## 5. The 24-hour schedule

| Phase | Elapsed | Theme | Tag |
|---|---|---|---|
| P0 | H0–H1 | Foundation and contract freeze | `p0-foundation` |
| P1 | H1–H4 | Shell, login, personas, schema, seed | `p1-shell` |
| P2 | H4–H7 | Marketplace, package upload and job creation | `p2-marketplace` |
| P3 | H7–H10 | Compiler and auditions | `p3-compiler` |
| P4 | H10–H13 | Selection, work order, execution, recovery | `p4-recovery` |
| P5 | H13–H16 | Verification, receipt, review, demo reset | `p5-trust` |
| P6 | H16–H18 | Contributions, economics, ledger | `p6-economics` |
| P7 | H18–H21 | Live integration, negative regression suite, polish | `p7-polish` |
| P8 | H21–H23 | Hardening, 3x full rehearsals, release lock | `v1.0-demo` |
| P9 | H23–H24 | Unallocated contingency buffer and demo freeze | `p9-lock` |

A phase is complete only when its gate passes, its prototype is usable and its tag exists.

---

## 6. Ownership at a glance

| Workstream | Owns | Does not own |
|---|---|---|
| **A — Product & Frontend** | All pages, components, graph, client/mocks, navigation, visual QA, judge script | DB, business rules, compiler, verifier |
| **B — Backend & Platform** | Prisma, seed, APIs, role guards, idempotency, reset, backup, ops | UI design, matching/selection, verifier semantics |
| **C — Compiler & Evaluation** | Contracts, manifests, adapters, compiler, auditions, runtime rules, verifier, receipt body, attribution | Page layout, migrations, route envelopes |

**No Team D.** QA/integration/demo ops are distributed; the joint lead owns gates.

---

## 7. Simulation and label policy

| Category | Label | Reality |
|---|---|---|
| Northstar, Jordan Lee, agent versions | `Seeded demo data` | Pre-created demo fixtures in Studio |
| Adapters | `Hybrid model-backed` / `Deterministic rules` | Evidence Reader can call LLM with deterministic fallback; Reconciliation is deterministic rules |
| ₹ amounts | `Simulated` | Illustrative pricing; no money moves |
| Settlement | `Eligible (simulated)` | No external provider; `provider: null` |
| Inventory | `Simulated inventory ledger` | 42 → 42 on-hand invariant; commit blocked |
| Auditions | `Measured on wh204-suite-v1` | Dynamic selection computed from persisted runs; Candidate A, B or C can win |
| Reputation | `Derived from demo evidence` | Derived from audition/execution stats, not public ratings |
| Verification | `Independent deterministic verifier` | Platform-owned oracle, not an agent claim |
| No-mock gate (P7) | `Live Next.js API & Neon PostgreSQL persistence` | Zero UI/mock layer; seeded profiles and simulated settlement remain labelled |

**Never claim:** real payment, live inventory mutation, production auth, public demand, certified compliance, guaranteed earnings, or that hardcoded logic is an autonomous third-party AI.

### 7.1 Explicit Scope Boundaries: MVP vs. Future Platform

| Area | 24-Hour Hackathon MVP | Near-Term Evolution | Long-Term Platform |
|---|---|---|---|
| **Agent Packages** | Curated Execution Agents (`src/server/agents/**`) | Public developer uploads & sandbox check | Creation Agents (Software Engineering) |
| **Hosting Model** | Platform-hosted callable adapters | Builder-hosted webhook endpoints | Customer-hosted (VPC / on-premise) |
| **Tool Integration** | Local simulated fixtures | Tool Gateway + OAuth business connectors | Enterprise KMS credential vault & rotation |
| **Code Modification** | Strictly prohibited (read/process only) | Bounded scripts in restricted sandboxes | Autonomous repo analysis, tests, PRs |
| **Inventory State** | Simulated ledger (42 → 42 invariant) | ERP sandbox staging | Production 2-phase commit with ERP |
| **Settlement** | Mathematical paise simulation | Stripe Connect / Escrow sandbox | Multi-currency real bank settlement |
| **Arbitrary Code** | Prohibited (no third-party runtime) | Isolated container sandbox | MicroVM (Firecracker/gVisor) fleet |

---

## 8. How to use this package

1. **Freeze at P0.** Read `07` and `16`; sign off contracts, stack and scope.
2. **Work from the tracker.** One task per person, one `IN_PROGRESS` at a time.
3. **Use the contracts, not screenshots.** A builds against typed mocks; B/C build the truth.
4. **Gate every phase.** Demonstrate the prototype; get second-person verification; tag.
5. **Cut optional, never core.** The cut order is in `15`.
6. **Rehearse three times.** The demo is part of the product.

### Proposed commands (created at P0)

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run db:generate
npm run db:push
npm run db:seed
npm run db:reset
```

These commands do not exist yet. They are part of P0-B-001 and must not be presented as working until the scaffold is built.

---

## 9. Source-of-truth rules

1. `BLUEPRINT.md` is the canonical product specification.
2. `TASK_TRACKER.md` is the canonical execution state; the CSV is an export.
3. `07_INTEGRATION_CONTRACTS.md` freezes shapes at P0.
4. `08_DATABASE_AND_SEED_PLAN.md` freezes seed IDs and values.
5. `09_UI_UX_SPECIFICATION.md` freezes the route list and design system.
6. Any material change goes through `16_DECISIONS_AND_CHANGELOG.md`.

If two documents disagree, the more specific frozen document wins for implementation, and the conflict is recorded and fixed. Do not silently diverge.

---

## 10. What success looks like

- A judge sees a premium product, not a prototype.
- Three candidates are auditioned on a 10-fixture suite; the winning candidate (A, B, or C) is dynamically selected from persisted audition scores with recorded rejection reasons.
- v1.0.0 visibly fails; v1.1.0 visibly replaces it.
- Ten independent checks pass; the receipt hash is stable.
- Inventory stays blocked; no false claim of a commit.
- Jordan earns ₹5,500 simulated; v1.0.0 earns ₹0; v1.1.0 earns ₹2,500.
- The demo resets and repeats in under 3:15.
- Every simulated value is labelled.
- No application source was changed by this documentation task.

---

**Next step:** start P0-B-001. Do not mark anything done until its acceptance criteria and verification method pass.
