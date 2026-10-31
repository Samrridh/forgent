# 04 — Workstream Ownership

**Status:** `ACCEPTED & IMPLEMENTED — PRODUCTION VERIFIED`  
**Team shape:** Three permanent workstreams, three developers, **no Team D**  
**Rule:** every file, route, API and domain rule has exactly one accountable owner. Collaboration is expected; unowned work is not.

---

## 1. Why three workstreams

Forgent has three product engines that must be built concurrently:

| Engine | Workstream | Mandate |
|---|---|---|
| Marketplace — economic engine | **A — Product & Frontend**, with B supplying marketplace APIs | Make supply, demand, versions and earnings visible and usable |
| Team Compiler — intelligence engine | **C — AI, Compiler & Evaluation** | Match, compile, audition, select honestly |
| Verification & Execution — trust engine | **B — Backend & Platform** + **C** for rules | Persist the run, expose failure, verify independently |

A fourth "QA/integration" team does not exist. QA, integration and demo operations are distributed so that every workstream owns the quality of its own surface and the joint lead owns the gate.

### Distribution of non-feature work

| Activity | Accountable | Contributing |
|---|---|---|
| Contract freeze | C | A, B |
| Schema and seed integrity | B | C |
| Visual QA and route parity | A | B, C |
| API contract tests | B | C |
| Compiler/execution determinism | C | B |
| Buyer journey regression | A | B |
| Builder journey regression | A | C |
| Reset/backup/offline | B | A |
| Negative-path suite | C | B |
| Judge rehearsal and runbook | A | B, C |
| Final tag and sign-off | Joint | — |

---

## 2. Permanent workstream boundaries

### A — Product & Frontend

**Owns the experience and the client contract.**

| Area | Owned paths |
|---|---|
| App routes and layouts | `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/(buyer)/**`, `src/app/(builder)/**` |
| Shared UI | `src/components/ui/**`, `src/components/shell/**`, `src/components/workflow/**`, `src/components/compiler/**`, `src/components/execution/**`, `src/components/verification/**`, `src/components/receipt/**`, `src/components/economics/**` |
| Client data layer | `src/lib/api/client.ts`, `src/lib/api/mocks.ts`, `src/lib/api/fixtures/**`, `src/lib/navigation.ts`, `src/hooks/**` |
| Visual system | tokens in `globals.css`, component gallery, screenshots, print CSS |

**Produces for others:** consumed-route feedback, UX requirements, mock fixtures that expose contract gaps, screenshot evidence, route parity checklist.
**Consumes from others:** frozen types/schemas (C), live APIs and seed data (B), compiler/execution/verification payloads (B/C).

**A does not own:** Prisma schema/migrations, route-handler business logic, matcher/selector/recovery/verifier algorithms, seed data values, economic attribution rules.

### B — Backend & Platform

**Owns persistence, transport and operational reliability.**

| Area | Owned paths |
|---|---|
| Database | `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`, Neon connection pooling and direct migration configuration |
| DB access | `src/server/db.ts`, `src/server/repositories/**` |
| Storage | `src/server/storage/**` (package artifact storage abstraction) |
| API handlers | `src/app/api/**` |
| Services | `src/server/services/**` (orchestration/persistence only; domain rules delegated to C) |
| Auth/role guard | `src/server/auth/**`, session cookie (`forgent_session`), login/logout, route guards |
| Scripts | `scripts/**`, `package.json` scripts, `.env.example` |
| Operations | reset, backup, seed verification, health, performance |

**Produces for others:** schema, seed IDs, typed route payloads, error envelopes, role enforcement, reset/backup, health.
**Consumes from others:** contracts (C), domain functions (C), UI requirements for payload shape (A).

**B does not own:** visual design, compiler heuristics, selection policy, verifier semantics, receipt body definition, economic attribution formulas. B persists and exposes what C defines.

### C — AI, Compiler & Evaluation

**Owns the domain truth and the deterministic intelligence.**

| Area | Owned paths |
|---|---|
| Contracts | `src/lib/contracts/**` |
| Agent layer | `src/server/agents/**` (curated Execution Agent packages: model-backed Evidence Reader with deterministic fallback, deterministic Reconciliation/Exception Reporter, manifests, instance configurations, and Tool Gateway adapter interfaces) |
| Compiler | `src/server/compiler/**` (9-step compiler, taxonomy, matcher, compatibility, contract compiler, candidates, auditions, assertions, selector, gaps) |
| Runtime rules | `src/server/runtime/**` (orchestrator policy, Tool Gateway permission rules, failure injection, recovery, safe limits) |
| Verification | `src/server/verification/**` (verifier, state diff, approval gate) |
| Evidence | `src/server/evidence/**` (canonicalisation, receipt body) |
| Economics rules | `src/server/economics/**` (attribution, contribution policy, settlement policy, reputation) |
| Fixtures | `src/server/fixtures/**` (WH-204 truth, 10-fixture audition suite) |

**Produces for others:** frozen types/Zod schemas, manifests, package/instance adapter interfaces, 9-step compiler APIs-in-process, Tool Gateway policy rules, runtime/recovery functions, verifier, receipt body, attribution rules, fixtures.
**Consumes from others:** persistence interfaces, Tool Gateway transport wiring, and route handlers (B), UI needs and usability feedback (A).

**C does not own:** page layout, CSS, Prisma schema, route envelope conventions, seed row creation, dashboard aggregation.

> [!NOTE]
> **Domain Clarifications for All Workstreams:**
> 1. *Capabilities $\ne$ Agents:* Capabilities represent what needs to be done. Team C designs capabilities that can be satisfied by Execution Agents, deterministic platform code, connectors, or human approvals.
> 2. *Execution vs. Creation Agents:* The hackathon MVP exclusively implements Execution Agents. Creation Agents (which analyze repos, generate code, and open PRs) are documented as future platform scope and are not implemented in the 24-hour MVP.
> 3. *Tool Gateway Mediation:* Agents never receive raw database credentials. Team B builds transport, and Team C defines operation-level validation and read vs. write permission scopes.
> 4. *No Arbitrary Code Uploads:* All MVP agents are curated platform-hosted packages. Arbitrary public executable uploads are deferred.

---

## 3. Module and route ownership matrix

### 3.1 Shared & Buyer routes

| Route | Owner | API dependencies | Key task |
|---|---|---|---|
| `/login` | A | `POST /api/auth/login`, `GET /api/auth/me` | `P1-A-003` |
| `/buyer/overview` | A | `GET /api/dashboard/buyer`, `GET /api/auth/me` | `P1-A-003` |
| `/buyer/jobs` | A | `GET /api/jobs` | `P2-A-004` |
| `/buyer/jobs/new` | A | `POST /api/jobs`, compiler preview | `P2-A-003` |
| `/buyer/jobs/[jobId]` | A | `GET /api/jobs/:id` | `P2-A-004` |
| `/buyer/jobs/[jobId]/compiler` | A | compile/audition/selection APIs | `P3-A-003` |
| `/buyer/jobs/[jobId]/work-order` | A | work-order APIs | `P4-A-001` |
| `/buyer/jobs/[jobId]/execution` | A | execution/recovery APIs | `P4-A-002` |
| `/buyer/jobs/[jobId]/verification` | A | verification API | `P5-A-001` |
| `/buyer/jobs/[jobId]/receipt` | A | receipt/export APIs | `P5-A-002` |
| `/buyer/jobs/[jobId]/economics` | A | economics API | `P6-A-004` |
| `/buyer/marketplace` | A | `GET /api/agents` | `P2-A-001` |
| `/buyer/marketplace/agents/[agentId]` | A | agent detail/evaluations | `P2-A-002` |
| `/buyer/transactions` | A | `GET /api/transactions` | `P6-A-001` |

### 3.2 Builder routes

| Route | Owner | API dependencies | Key task |
|---|---|---|---|
| `/builder/overview` | A | `GET /api/dashboard/freelancer` | `P1-A-003` |
| `/builder/profile` | A | `GET /api/builder/profile` | `P2-A-005` |
| `/builder/agents` | A | agent registry/builder APIs | `P2-A-005` |
| `/builder/agents/new` | A | `POST /api/builder/agents` | `P2-A-005` |
| `/builder/agents/[agentId]` | A | agent detail/evaluations/reputation | `P2-A-002`, `P6-A-003` |
| `/builder/agents/[agentId]/edit` | A | `PATCH /api/builder/agents/...` | `P2-A-005` |
| `/builder/contributions` | A | `GET /api/ledger/contributions` | `P6-A-002` |
| `/builder/earnings` | A | `GET /api/ledger/settlements` | `P6-A-002` |

### 3.3 API routes

| Route group | Handler owner | Domain owner | Consumers |
|---|---|---|---|
| `/api/health`, `/api/me`, `/api/demo/*` | B | B | A, ops |
| `/api/dashboard/*` | B | B (aggregation) | A |
| `/api/agents*` | B | C (manifest semantics) | A |
| `/api/builder/*` | B | B/C (validation) | A |
| `/api/jobs*` create/read | B | C (contract compile) | A |
| `/api/jobs/:id/compile` | B | C | A |
| `/api/jobs/:id/auditions` | B | C | A |
| `/api/jobs/:id/selection` | B | C | A |
| `/api/jobs/:id/work-order`, `/api/work-orders/:id/approve` | B | C (rules) | A |
| `/api/jobs/:id/executions`, `/execution`, `/recovery` | B | C | A |
| `/api/jobs/:id/verification`, `/review` | B | C | A |
| `/api/jobs/:id/receipt`, `/export` | B | C (body/hash) | A |
| `/api/jobs/:id/economics`, `/api/transactions`, `/api/ledger/*`, `/api/reputation/*` | B | C (rules) | A |

**Rule:** B may not change a domain result to make a screen easier. If a payload is hard to render, A and C agree a contract change and log it.

### 3.4 Shared files

| File | Owner | Change protocol |
|---|---|---|
| `src/lib/contracts/constants.ts` | C | Decision-log entry; notify A/B |
| `src/lib/contracts/domain.ts` | C | Decision-log entry; notify A/B |
| `src/lib/contracts/schemas.ts` | C | Decision-log entry; notify A/B |
| `src/lib/contracts/api.ts` | C | Decision-log entry; notify A/B |
| `src/lib/navigation.ts` | A | Keep route inventory in sync; notify B |
| `prisma/schema.prisma` | B | Migration note; notify C/A if payload changes |
| `prisma/seed.ts` | B | Values frozen by 08; notify A/C |
| `src/server/db.ts` | B | No parallel edits |
| `package.json` scripts/deps | B | Any dependency needs a P0/P7 decision |
| `.env.example` | B | Update when a flag is introduced |
| `README.md` root | A (docs), B (run commands) | Joint review |
| `docs/hackathon/**` | Joint; numbered doc owner listed in each file | Decision-log entry for material change |

---

## 4. Consumed and produced interfaces

### 4.1 A consumes

| Interface | From | Freeze point |
|---|---|---|
| `src/lib/contracts/**` types and schemas | C | P0-C-003 |
| `src/lib/api/mocks.ts` fixtures (A-authored, contract-validated) | A | P1-A-004 |
| `GET /api/me`, dashboard endpoints | B | P1-B-003 |
| Agent catalog/detail payloads | B | P2-B-001 |
| Job/contract payloads | B | P2-B-002 |
| Compile/audition/selection payloads | B | P3-B-004 |
| Work order/execution/recovery payloads | B | P4-B-003 |
| Verification/receipt/review payloads | B | P5-B-003 |
| Economics/contribution/settlement payloads | B | P6-B-002 |

### 4.2 B consumes

| Interface | From | Freeze point |
|---|---|---|
| Domain types, enums, API envelopes | C | P0-C-003 |
| Manifest validation and registry semantics | C | P1-C-001 |
| Contract compiler output | C | P2-C-002 |
| Matcher/candidate/audition/selector results | C | P3-C-004 |
| Runtime/recovery/limits functions | C | P4-C-004 |
| Verifier/state diff/gate functions | C | P5-C-004 |
| Receipt body/canonical hash | C | P5-B-002 |
| Attribution/settlement/reputation rules | C | P6-C-004 |

### 4.3 C consumes

| Interface | From | Freeze point |
|---|---|---|
| Persistence ports (repositories) | B | P1-B-001 |
| Seed IDs and fixture data | B | P1-B-002 |
| Route wiring and idempotency middleware | B | P3-B-002 |
| Persona/role context (for execution actor) | B | P4-B-001 |
| UI feedback on payload usability | A | Continuous; contract change requires log |

### 4.4 Interface change rule

1. Raise the change in the contract document.
2. C writes the new type/schema and a decision-log entry.
3. B updates persistence/route payloads in the same slice.
4. A updates mocks and consumers in the same slice.
5. The phase smoke test must pass before the change is considered merged.

No "temporary" payload fields. If a field exists only for one screen, it belongs in a view model, not the domain contract.

---

## 5. Prohibited actions by workstream

### A must not

- Edit `prisma/**`, `src/server/**`, `src/lib/contracts/**` or `package.json` dependencies.
- Hard-code WH-204 quantities, money or statuses in components instead of reading payloads.
- Add a route or navigation item not in `09_UI_UX_SPECIFICATION.md` without a scope decision.
- Render a disabled control for a deferred feature.
- Invent a benchmark, rating or agent field.
- Claim a payment occurred.

### B must not

- Change a domain rule to simplify a query or screen.
- Add a DB column without updating the contract and decision log.
- Return an untyped payload or leak a stack trace.
- Seed fake audition results, contributions or historical jobs.
- Expose reset outside demo mode.
- Mark a settlement as `SETTLED` or add a provider reference.

### C must not

- Change a frozen contract silently.
- Add an LLM/network dependency to the critical path.
- Add the verifier to the agent registry or marketplace.
- Make the baseline marketplace-visible.
- Let an agent commit inventory or self-certify success.
- Invent contribution percentages or pay a replaced version.
- Change the canonical WH-204 truth to make a test pass.

---

## 6. RACI

**R** = responsible, **A** = accountable, **C** = consulted, **I** = informed.

| Work item | A | B | C |
|---|---|---|---|
| Contracts and schemas | C | C | **A/R** |
| UI primitives and shell | **A/R** | I | I |
| Buyer/builder routes | **A/R** | C | C |
| Prisma schema/migrations | I | **A/R** | C |
| Seed/reset/backup | I | **A/R** | C |
| Marketplace APIs | C | **A/R** | C |
| Manifest/model semantics | I | C | **A/R** |
| Deterministic adapters | I | I | **A/R** |
| Matcher/compiler/candidates | I | C | **A/R** |
| Auditions/assertions/selector | I | C | **A/R** |
| Work order/execution persistence | C | **A/R** | C |
| Runtime/recovery/limits | I | C | **A/R** |
| Verifier/state diff/gate | C | C | **A/R** |
| Receipt body/hash | C | **R** | **A** |
| Attribution/settlement/reputation rules | C | **R** | **A** |
| Economics/transactions UI | **A/R** | C | C |
| API envelope/role guard | I | **A/R** | C |
| Contract tests | C | **A/R** | C |
| Negative/determinism tests | I | C | **A/R** |
| Visual/responsive QA | **A/R** | I | I |
| Buyer journey regression | **A/R** | C | C |
| Builder journey regression | **A/R** | C | C |
| API/reset regression | I | **A/R** | C |
| Judge runbook/rehearsal | **A/R** | C | C |
| Final tag/sign-off | **R** | **R** | **R** |

---

## 7. Collaboration and conflict rules

1. **One owner per file.** A second editor asks first and records the reason in the commit/checkpoint note.
2. **Contract questions go to C.** Answers are written into `07_INTEGRATION_CONTRACTS.md`, not only chat.
3. **Schema questions go to B.** C defines needed fields; B defines the persistence representation.
4. **Visual questions go to A.** A owns the design system; B/C do not restyle shared primitives.
5. **Blocked >20 minutes escalates** to the joint lead and is written in the tracker blocker column.
6. **No large unmerged branches.** Prefer small vertical slices that keep the app bootable.
7. **No direct edits to another workstream's owned file during P7/P8** without a joint checkpoint decision.
8. **Frozen after P7:** contracts, seed IDs, economics values and AC codes. P8 may fix defects, not reshape the product.

### Branch and commit posture

For a three-person local hackathon, trunk-based work is acceptable if:

- Each workstream commits a coherent slice at least every 60–90 minutes.
- The app boots on the shared branch at every phase gate.
- Checkpoint tags are created only after the gate passes.
- A broken checkpoint is fixed forward immediately; tags are never moved.

If branches are used, name them `a/<slice>`, `b/<slice>`, `c/<slice>` and merge at the gate. Do not let branches diverge across a phase boundary.

---

## 8. Handoff protocol

At each phase gate, the accountable owner records:

| Item | Required content |
|---|---|
| Gate result | Command/test/screenshot evidence |
| Artifacts | Files, routes, endpoints, fixtures delivered |
| Known gaps | What is mocked, missing or fragile |
| Contract changes | Decision IDs or "none" |
| Next owner | Who picks up which task IDs |
| Risk | The single most likely thing to break next |

Handoffs are recorded in [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md) and the checkpoint log in [TASK_TRACKER.md](TASK_TRACKER.md).

---

## 9. Ownership quick reference

```text
A  → screens, components, client data, navigation, visual QA, judge story
B  → database, seed, APIs, role guards, idempotency, reset, backup, ops
C  → contracts, manifests, adapters, compiler, auditions, runtime rules,
     verifier, receipt body, attribution, determinism, negative paths
```

If a task does not fit one of these, it is either a joint gate task or a sign that the scope is wrong. Do not create a fourth workstream.

---

## Related documents

- [02 — Implementation Master Plan](02_IMPLEMENTATION_MASTER_PLAN.md)
- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [07 — Integration Contracts](07_INTEGRATION_CONTRACTS.md)
- [TASK_TRACKER.md](TASK_TRACKER.md)
- [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md)
