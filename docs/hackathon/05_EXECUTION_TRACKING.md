# 05 — Execution Tracking Guide

**Status:** `ACTIVE`  
**Canonical tracker:** [`TASK_TRACKER.md`](TASK_TRACKER.md)  
**Machine export:** [`TASK_TRACKER.csv`](TASK_TRACKER.csv)  
**Companion:** [`06 — CSV Companion`](06_CSV_COMPANION.md)

---

## 1. What is tracked

The tracker is the single execution state for the 24-hour build. It contains **108 tasks**:

| Measure | Count |
|---|---:|
| Total tasks | 108 |
| DONE at documentation baseline | 0 |
| Actionable remaining | 106 |
| Dropped / deferred (P3) | 2 (`P5-A-005`, `P7-B-004`) |
| Critical path | 46 |
| Optional P2 tasks | 5 (`P3-A-006`, `P5-A-004`, `P6-A-005`, `P7-A-004`, `P8-C-004`) |
| Total estimated minutes | 3,535 |
| Core (non-optional) minutes | 3,425 |
| Integration buffer | 875 minutes (~20.3% buffer) |

Per phase: P0 9, P1 10, P2 13, P3 15, P4 12, P5 13, P6 13, P7 11, P8 12.  
Per workstream: A 40 (1,145m core), B 34 (1,140m core), C 34 (1,140m core).

Nothing is pre-marked done. The documentation package describes a build that has not started. All three workstreams have ~5 hours of capacity buffer.

---

## 2. Task ID format

```text
P<phase>-<workstream>-<sequence>
```

Examples:

| ID | Meaning |
|---|---|
| `P0-B-001` | Phase 0, Backend, task 001 |
| `P3-A-006` | Phase 3, Frontend, task 006 (optional) |
| `P5-C-004` | Phase 5, Compiler/Evaluation, task 004 |

Rules:

1. IDs are never renumbered or reused.
2. A split task keeps the old ID as `DROPPED — superseded by …` and creates a new ID.
3. A moved task keeps its ID and changes phase only with a decision-log entry.
4. Dependencies always reference task IDs, never titles.
5. A dependency on a `DROPPED` task must be re-pointed before the dependent can start.

---

## 3. Status model

| Status | Meaning | Allowed next states |
|---|---|---|
| `NOT_STARTED` | No work begun. | `IN_PROGRESS`, `DROPPED` |
| `IN_PROGRESS` | Active work; partial output exists. | `REVIEW`, `BLOCKED`, `DROPPED` |
| `BLOCKED` | Cannot proceed; blocker text mandatory. | `IN_PROGRESS`, `DROPPED` |
| `REVIEW` | Implementation complete; acceptance verification pending. | `DONE`, `IN_PROGRESS` |
| `DONE` | Acceptance criteria and verification method passed. | Reopen only with a written reason |
| `DROPPED` | Removed/deferred; reason recorded; row preserved. | Not reopened for this hackathon |

### A task is not done because

- Code was written but not run.
- A screenshot looks right but the payload is mocked.
- A unit test passes but the acceptance criterion needs an integration check.
- The owner says "basically done".

### A task is done when

1. The output exists at the declared path.
2. Every acceptance criterion is checked.
3. The verification method has actually been run.
4. Contract/schema changes are logged.
5. The tracker row records the evidence.

---

## 4. Priority and kind

| Priority | Use |
|---|---|
| `P0` | Required for the complete demo; protect on the critical path. |
| `P1` | Important for premium/completeness; cut after P2. |
| `P2` | Optional; only after P0/P1 is green. |
| `P3` | Post-hackathon or deferred. |

| Kind | Use |
|---|---|
| `CRITICAL` | On the end-to-end critical path. |
| `PARALLEL` | Can progress against frozen contracts/mocks. |
| `INTEGRATION` | Connects workstreams; ends in a runnable slice. |
| `OPTIONAL` | Scope-cut candidate. |
| `DEFERRED` | Not built; retained for traceability. |

---

## 5. Update protocol

### Every status change

1. Edit `TASK_TRACKER.md` first — it is canonical.
2. Change only the affected row(s): status, blocker, verification evidence.
3. Update the Summary counts and Phase Board `DONE` count.
4. Update `TASK_TRACKER.csv` by regeneration or a single consistent edit.
5. Never let the Markdown and CSV disagree past the next checkpoint.

### Blocker text

A `BLOCKED` row must answer:

```text
What is missing? | Who owns the unblock? | What exactly unblocks it? | Since when?
```

An empty blocker is invalid and must be treated as `IN_PROGRESS`.

### Checkpoint protocol

At each phase gate:

1. Run the phase smoke test.
2. Demonstrate the usable prototype.
3. Get a second-workstream verification.
4. Record the gate result in the checkpoint log.
5. Tag the checkpoint (`p0-foundation` … `v1.0-demo`).
6. Only then mark the phase's remaining gate tasks `DONE`.

Tags are immutable. Never move or reuse a tag.

---

## 6. Cadence

| Interval | Activity | Output |
|---|---|---|
| Every 60–90 min | Stand-up: current, next, blocker, gate risk | Tracker updates |
| Every phase | Gate demo + second-person verification | Checkpoint note + tag |
| H11, H15, H18, H20 | Mid-build integration checks | Live slice, defect list |
| H20–H22 | Mock removal and parity | Route checklist |
| H22–H24 | Three rehearsals | Timing sheet + signed runbook |

### WIP limits

- Maximum **one** `IN_PROGRESS` task per person at a time; a second only if it is genuinely waiting on a test run.
- Maximum **two** `REVIEW` tasks per person; review is not a parking lot.
- A `BLOCKED` task older than 20 minutes is escalated to the joint lead.

---

## 7. Gate evidence requirements

| Gate | Minimum evidence |
|---|---|
| P0 | Install/dev/typecheck/lint output; health JSON; contract parse test; tag |
| P1 | Persona switch; seeded overview screenshots; twice-run seed counts; adapter output |
| P2 | Filtered catalog URL; agent version screenshot; WH-204 contract; invalid job 400 |
| P3 | Three candidate graphs; thirty fixture results; selection reasons; baseline hidden |
| P4 | ₹10,000 work order; failure event; one recovery event; v1.1.0 output; downstream rerun |
| P5 | Ten checks; state diff 42/10/2; stable receipt hash; blocked commit audit |
| P6 | ₹5,500 total; v1.0.0 ₹0; v1.1.0 ₹2,500; ₹2,500 fee; reserves; `ELIGIBLE_SIMULATED` |
| P7 | Network log with mocks off; three resets; contract suite; screenshots |
| P8 | Three rehearsal timings; identical hashes/amounts; backup restore; signed runbook; tag |

Evidence may be a command transcript, test report, screenshot, network capture or receipt hash. "Works on my machine" is not evidence.

---

## 8. Scope control

### Cut order

1. Optional tasks: `P3-A-006`, `P6-A-005`, `P7-A-004`, `P8-C-004`.
2. P1/P2 visual extras and advanced motion.
3. Secondary polish (`P3-A-005`, `P4-A-004`, `P6-A-003` chart work).
4. Nothing in the marketplace → compiler → recovery → verification → economics chain.

### Never cut

- Seeded marketplace and builder identity.
- Three candidates and ten-fixture auditions.
- v1.0.0 failure and v1.1.0 replacement.
- Independent verifier and ten checks.
- Receipt hash and blocked inventory.
- v1.0.0 ₹0 / v1.1.0 ₹2,500 / builder ₹5,500.
- Simulated labelling.
- Three rehearsals.

### Cut record

A cut task becomes `DROPPED` with:

```text
Reason | Decision ID | Navigation/route removed? | What still proves the product claim?
```

No dead route, disabled button or "coming soon" placeholder is left in the UI.

---

## 9. Role of each tracker view

| View | Use |
|---|---|
| Summary | Overall counts; detect a phase with too many `BLOCKED` or `REVIEW` rows. |
| Phase Board | Gate status at a glance; must match the checkpoint log. |
| Critical Path | The 46 tasks that must never slip silently. |
| Tasks by Phase | Working view; IDs, deps, outputs, acceptance, verification. |
| Optional/Deferred Register | Scope-cut decisions and post-hackathon backlog. |
| Checkpoint Log | Tag, target hour, gate result, tagger, notes. |
| Definition of Tracker Complete | Final lock criteria. |

---

## 10. Escalation

| Situation | Action |
|---|---|
| Contract ambiguity | C answers in the contract doc within 15 minutes; log if material. |
| Schema conflict | B freezes the current schema; C/A adapt; decision entry. |
| UI blocks API work | A provides the view model; B keeps the domain payload clean. |
| Integration mismatch | Stop feature work; fix the contract/payload first; re-run parity. |
| Gate at risk | Cut optional scope; do not extend the phase. |
| Demo failure at rehearsal | Fix, reset, re-rehearse; never hide it with a pre-recorded run. |

---

## 11. Definition of tracker complete

- Every P0 task is `DONE` or explicitly `DROPPED`.
- All nine phase gates are passed and recorded.
- No task is `BLOCKED` at H24.
- The receipt and economics values reconcile exactly.
- Three rehearsals are logged.
- `v1.0-demo` exists.
- Application working tree is clean and tagged.
- Markdown and CSV counts agree.

---

## Related documents

- [TASK_TRACKER.md](TASK_TRACKER.md)
- [06 — CSV Companion](06_CSV_COMPANION.md)
- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [14 — Testing and Acceptance Plan](14_TESTING_AND_ACCEPTANCE_PLAN.md)
- [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md)
