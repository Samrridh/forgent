# 15 — Risk and Scope Register

**Status:** `ACTIVE`  
**Owner:** Joint lead; each risk has one accountable workstream  
**Review cadence:** Every phase gate and at H20 before integration freeze

---

## 1. Risk scoring

| Likelihood | Meaning | Impact | Meaning |
|---|---|---|---|
| **H** | Likely in the 24h window | **1** | Cosmetic or recoverable in minutes |
| **M** | Plausible without mitigation | **2** | Delays a task or gate |
| **L** | Unlikely but consequential | **3** | Breaks a demo claim or a phase |
| | | **4** | Breaks the economic/trust loop |
| | | **5** | Demo cannot run or makes a false claim |

**Score = likelihood × impact.** H×4/5, M×5 and any false-claim risk are reviewed at every stand-up.

---

## 2. Risk register

### R-01 — Greenfield scaffold consumes P0/P1

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | B |
| Trigger | P0 not green by H1; install/config issues |
| Mitigation | B scaffolds first; A/C work from frozen contracts and mocks; no optional dependencies |
| Response | Cut non-essential config; use the smallest working stack; do not start features before health/typecheck pass |
| Residual | Medium until P1 gate |

### R-02 — Contract churn after freeze

| Field | Detail |
|---|---|
| Likelihood / impact | M / 4 |
| Owner | C |
| Trigger | A or B needs a field/shape not in `07` |
| Mitigation | Freeze at P0; view models for UI-only needs; decision-log entry for any change |
| Response | Stop feature work; change contract + schema + mocks + consumers in one slice; rerun contract tests |
| Residual | Low if the freeze is respected |

### R-03 — Recovery logic is wrong or non-deterministic

| Field | Detail |
|---|---|
| Likelihood / impact | M / 4 |
| Owner | C |
| Trigger | Duplicate events, double contribution, downstream not rerun, fallback accepted without compatibility |
| Mitigation | Pure functions; unique keys; recovery tests; canonical event order; one replacement limit |
| Response | Freeze the chain; reproduce with fixture; fix before P5; never paper over with UI |
| Residual | Medium — this is the hardest correctness area |

### R-04 — False success or false payment

| Field | Detail |
|---|---|
| Likelihood / impact | L / 5 |
| Owner | C (verifier), B (settlement) |
| Trigger | Agent `SUCCESS` accepted without verification; failed version paid; duplicate payout |
| Mitigation | Verifier independent; no self-certification; contribution uniqueness; replay tests |
| Response | S1 blocker; stop demo; fix; re-run negative suite; record the defect |
| Residual | Low but catastrophic |

### R-05 — Inventory is accidentally mutated

| Field | Detail |
|---|---|
| Likelihood / impact | L / 5 |
| Owner | C (gate), B (DB guard) |
| Trigger | A commit path, review auto-approve, test fixture writing the ledger |
| Mitigation | No `commit:inventory` permission; service-boundary guard; immutable seeded ledger; diff tests |
| Response | Restore seed; audit event; fix the guard; re-run review/commit tests |
| Residual | Low |

### R-06 — Demo relies on an external service or LLM outage

| Field | Detail |
|---|---|
| Likelihood / impact | L / 4 |
| Owner | C |
| Trigger | Model API timeout, quota exhaustion, network disconnect during live demo |
| Mitigation | Hybrid adapter architecture: Evidence Reader calls LLM if `GEMINI_API_KEY`/`OPENAI_API_KEY` exists, falling back automatically to local deterministic extraction on timeout/error; Reconciliation and Verifier are deterministic rules; hosted Neon PostgreSQL database |
| Response | Automatic fallback engages with `executionMode: "DETERMINISTIC_FALLBACK"`; demo continues without interruption; offline rehearsal verified |
| Residual | Low by architecture |

### R-07 — UI capacity overrun

| Field | Detail |
|---|---|
| Likelihood / impact | L / 2 (Reduced from H/3) |
| Owner | A |
| Trigger | Complex layout or secondary chart polish consuming integration time |
| Mitigation | Workload rebalanced: core work reduced to 3,425 minutes across team (Team A core: 1,145m, Team B core: 1,140m, Team C core: 1,140m). 875 minutes (~15h) team buffer created. Optional tasks (`P3-A-006`, `P5-A-004`, `P6-A-005`, `P7-A-004`, `P8-C-004`) are explicit cuts |
| Response | Drop optional tasks; reuse core primitives; protect the core demo critical path |
| Residual | Low |

### R-08 — Late integration reveals shape mismatches

| Field | Detail |
|---|---|
| Likelihood / impact | M / 4 |
| Owner | A + B |
| Trigger | P7 mock removal produces missing fields, wrong envelopes, role failures |
| Mitigation | Contract tests from P0; mock parity; P3-A-004 integration; B hardens envelopes at P7 |
| Response | Stop polish; fix payloads; rerun route checklist; delay visual freeze, not live integration |
| Residual | Medium |

### R-09 — Seed/reset not idempotent

| Field | Detail |
|---|---|
| Likelihood / impact | M / 4 |
| Owner | B |
| Trigger | Duplicate rows, stale earnings, WH-204 stuck, FK errors |
| Mitigation | Upserts with stable IDs; FK-safe delete order; reset three times; backup |
| Response | Restore backup; fix delete order; verify exact counts before rehearsal |
| Residual | Medium |

### R-10 — Serverless connection pool exhaustion or cold start latency

| Field | Detail |
|---|---|
| Likelihood / impact | L / 3 |
| Owner | B |
| Trigger | Polling + QStash step webhooks open concurrent database connections exceeding pool limit |
| Mitigation | Single demo execution; Neon connection pooling via `@prisma/adapter-neon` and `@neondatabase/serverless`; short transactions; tuned polling interval (700ms) |
| Response | Adjust Neon connection pool size; throttle frontend polling; rely on QStash webhook retry semantics |
| Residual | Low |

### R-11 — UI looks generic or unfinished

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | A |
| Trigger | Default admin styling, inconsistent badges, overflow, dead states |
| Mitigation | Design tokens; primitives; visual checklist; screenshot review at three widths |
| Response | Cut optional features; polish the demo path first; fix semantic badges and spacing |
| Residual | Medium |

### R-12 — Dead routes, fake actions or overclaims

| Field | Detail |
|---|---|
| Likelihood / impact | M / 4 |
| Owner | A + joint |
| Trigger | Disabled PDF button, fake bounty, “paid” copy, unlabelled seeded data, fake provider |
| Mitigation | Page list is closed; label audit; claims discipline; no deferred route |
| Response | Remove the affordance; correct the copy; log the scope decision |
| Residual | Medium — copy drifts under pressure |

### R-13 — Judge timing overrun

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | A |
| Trigger | Rehearsal exceeds 3:15; failure moment rushed |
| Mitigation | Timed script; cut list; three rehearsals; one driver |
| Response | Shorten marketplace/verification detail; never cut the failure/replacement or ₹0 moment |
| Residual | Medium |

### R-14 — Windows path/line-ending issues

| Field | Detail |
|---|---|
| Likelihood / impact | M / 2 |
| Owner | B |
| Trigger | Scripts assume `/`; CRLF breaks generated files |
| Mitigation | Node `path` APIs; LF via git attributes; PowerShell commands documented |
| Response | Fix script; rerun reset/seed; do not hand-edit database state |
| Residual | Low |

### R-15 — Session authentication bypass or role spoofing

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | B |
| Trigger | Direct route access without valid session or as unauthorized role; API call bypassing route guards |
| Mitigation | Server-managed signed httpOnly session cookie (`forgent_session`); Next.js middleware guards (`requireAuth`, `requireRole('BUYER')`, `requireRole('BUILDER')`); seeded accounts (`buyer@northstar.demo`, `jordan@demoagent.studio`); explicit 401/403 negative tests |
| Response | Reject unauthorized requests with 401/403; redirect to `/login`; log security event |
| Residual | Low for demo scope, accepted limitation |

### R-16 — Receipt hash instability

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | C |
| Trigger | Key order, timestamps, arrays or IDs vary between reads |
| Mitigation | Canonical JSON; sorted keys; exclude volatile fields; independent recomputation test |
| Response | Fix canonicalisation; compare hashes; do not weaken the hash scope |
| Residual | Medium |

### R-17 — Held-out fixture leakage

| Field | Detail |
|---|---|
| Likelihood / impact | L / 3 |
| Owner | C |
| Trigger | Public comparison payload includes hidden expected values |
| Mitigation | Separate public/aggregate serializer; leak test; suite version freeze |
| Response | Remove the field; rerun leak test; log if the suite changed |
| Residual | Low |

### R-18 — Backup/restore drift

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | B |
| Trigger | Backup taken after a dirty run; restore has different IDs/counts |
| Mitigation | Take backup from a verified `CONTRACT_READY` reset; test restore; no secrets |
| Response | Rebuild from seed; verify counts; do not rehearse on an unverified backup |
| Residual | Low |

### R-19 — Scope creep into deferred features

| Field | Detail |
|---|---|
| Likelihood / impact | M / 3 |
| Owner | Joint |
| Trigger | Someone starts PDF export, audit browser, bounty flow, public onboarding |
| Mitigation | Scope register; page list; cut order; decision log |
| Response | Stop; mark `DROPPED`; remove UI; record why |
| Residual | Medium under demo pressure |

### R-20 — Team member unavailable

| Field | Detail |
|---|---|
| Likelihood / impact | L / 4 |
| Owner | Joint |
| Trigger | Illness, machine failure, merge conflict |
| Mitigation | Shared contracts; small commits; documented runbook; backup machine |
| Response | Reassign by ownership matrix; cut optional scope; protect the trust/economics chain |
| Residual | Low |

### R-21 — Malicious package archive upload or untrusted code execution

| Field | Detail |
|---|---|
| Likelihood / impact | L / 5 |
| Owner | B / C |
| Trigger | Uploading malicious ZIP archives containing path traversal (`../`), ZIP bombs, or attempting to execute unvetted uploaded code in the runtime |
| Mitigation | Strict archive safety validator enforces 5MB limit, .zip MIME type, and rejects path traversal (`../`) before extraction; SHA-256 digest computed; package stored in persistent storage abstraction with `PENDING_APPROVAL` status (`executionEligible: false`). **Execution Safety Boundary:** runtime orchestrator strictly invokes only approved platform adapters (`src/server/agents/**`); compiler rejects unapproved packages with `UNAPPROVED_EXECUTION_BINDING`; zero dynamic `eval()` or untrusted dynamic `import()` |
| Response | Fail closed with 400 Bad Request on malformed/malicious ZIP; compile rejection on unapproved packages |
| Residual | Low by architecture |

---

## 3. Risk heat summary

| Score | Risks |
|---|---|
| **Critical (≥16)** | None at baseline; R-04/R-05 are low-likelihood but impact 5 |
| **High (10–15)** | R-07 (A capacity), R-02/R-03/R-08/R-09/R-12 (medium × 4) |
| **Medium (5–9)** | Most delivery/UI risks |
| **Low (≤4)** | R-14 path/line endings |

**Watch list at every gate:** R-02, R-03, R-04, R-05, R-07, R-09, R-12.

---

## 4. Scope register

### 4.1 In scope (must ship)

- Seeded Northstar + Jordan Lee + four visible versions.
- Marketplace catalog and version detail.
- Three-step job creation and compiled contract.
- Three candidates, ten-fixture audition, hard selection.
- Work order and ₹10,000 allocation.
- Six-stage execution, injected failure, v1.1.0 replacement.
- Independent verifier, ten checks, state diff.
- Receipt with SHA-256, review gate, blocked inventory.
- Contribution attribution, ₹5,500 eligible, platform fee/reserves.
- Version-scoped reputation.
- Deterministic seed/reset, health.
- Premium shell, demo labels, no dead routes.
- Runbook and three rehearsals.

### 4.2 Out of scope (not built in 24-hour hackathon MVP)

- **Creation Agents:** Autonomous agents that inspect authorized repositories, generate/modify code in workspaces, run tests, and open Pull Requests (documented as long-term roadmap; not in Northstar MVP).
- **Arbitrary Third-Party Code Uploads:** Public package uploads running arbitrary runtime code. (MVP uses curated platform-hosted Execution Agent adapters).
- **Builder-Hosted & Customer-Hosted Runtimes:** External developer webhooks and on-premises / VPC customer execution (deferred to future roadmap).
- **Production Business Connectors & Credential Vault:** Live enterprise ERP/WMS/CRM integrations; the Tool Gateway in MVP uses simulated local fixtures.
- **Financial & Identity Rails:** Real auth/KYC, live payment gateway, escrow, bank payouts, tax/invoicing.
- **Enterprise Ledger:** Real production inventory/ERP mutation (42 → 42 simulated ledger invariant; commit blocked).
- **Other Deferred Features:** PDF export, cross-job audit browser, disputes center, crypto settlement, bounty submission flow.

### 4.3 Optional (build only if green)

| ID | Item | Cut rule |
|---|---|---|
| `P3-A-006` | Capability-gap resolution panel | First cut in P3; never at the cost of selection |
| `P6-A-005` | Reputation history chart | First cut in P6; never at the cost of ₹5,500 attribution |
| `P7-A-004` | Advanced stage motion | First cut in P7; never delay live integration |
| `P8-C-004` | Extra adversarial fixtures | First cut in P8; never change the frozen suite without a decision |

### 4.4 Deferred (recorded, not built)

| ID | Item | Reason |
|---|---|---|
| `P5-A-005` | PDF receipt export | Font/layout risk; JSON/Markdown sufficient |
| `P7-B-004` | Cross-job audit browser | Stage drawer already shows the event log; avoid a dead route |

Deferred items have no UI affordance. They exist only in the backlog.

---

## 5. Assumptions

| # | Assumption | If false |
|---|---|---|
| A-01 | Three developers, three workstreams | Re-plan phases; cut optional and secondary screens |
| A-02 | Node 22/npm 10 on the demo machine | Install/pin before P0; document |
| A-03 | One demo user and one run | Serverless pool handles demo workload |
| A-04 | No external network needed after install | Offline acceptable |
| A-05 | Desktop/laptop 1280–1440 primary | Tablet is a documented limitation |
| A-06 | Seeded demand/supply is acceptable if labelled | Demo claim weakens; do not fake volume |
| A-07 | Simulated settlement is acceptable if labelled | Demo cannot claim a live payout |
| A-08 | Deterministic adapters are sufficient for the thesis | A model dependency adds latency/risk and must be optional |

---

## 6. Dependencies and external constraints

| Dependency | Owner | Risk if late |
|---|---|---|
| Frozen contracts | C | All parallel work stalls |
| Schema + seed | B | A cannot render live data; C cannot persist |
| Manifests + adapters | C | Compiler/runtime cannot run |
| Live APIs | B | P7 integration slips |
| Reset + backup | B | Rehearsals and recovery unreliable |
| Working demo machine | Joint | Demo cannot run; use backup |

No external vendor, API key, payment provider or warehouse credential is a dependency. That is deliberate.

---

## 7. Change control

A change is material if it affects any of:

- A frozen contract or API envelope.
- A seeded ID or canonical WH-204 value.
- Money, allocation or settlement semantics.
- The verifier, AC codes or receipt hash scope.
- The demo script or a gate outcome.
- A route/navigation item or a deferred feature appearing in the UI.

Protocol:

1. Write the proposal in [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md).
2. State the impact on A/B/C and the gate.
3. Get joint acknowledgement.
4. Update code, contract, mocks, tests and docs in one slice.
5. Re-run the phase smoke test.
6. Record the outcome.

No silent changes after P7. P8 fixes defects; it does not reshape the product.

---

## 8. Cut order

```text
1. Optional tasks (P3-A-006, P6-A-005, P7-A-004, P8-C-004)
2. Advanced motion, charts, extra polish
3. Secondary screens/detail (P3-A-005, P4-A-004 nuance, P6-A-003 chart)
4. P1/P2 visual extras
5. Nothing in: marketplace → compiler → recovery → verification → attribution
6. Nothing in: seeded truth, labels, reset, rehearsal
```

If the choice is “cut the failure/replacement” or “ship a smaller UI”, cut the UI. The failure moment is the product.

---

## 9. Risk review log

| Gate | Reviewed | New risks | Closed | Owner |
|---|---|---|---|---|
| P0 | ☐ | — | — | Joint |
| P1 | ☐ | — | — | Joint |
| P2 | ☐ | — | — | Joint |
| P3 | ☐ | — | — | Joint |
| P4 | ☐ | — | — | Joint |
| P5 | ☐ | — | — | Joint |
| P6 | ☐ | — | — | Joint |
| P7 | ☐ | — | — | Joint |
| P8 | ☐ | — | — | Joint |

---

## Related documents

- [02 — Implementation Master Plan](02_IMPLEMENTATION_MASTER_PLAN.md)
- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [13 — Demo Runbook](13_DEMO_RUNBOOK.md)
- [14 — Testing and Acceptance Plan](14_TESTING_AND_ACCEPTANCE_PLAN.md)
- [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md)
