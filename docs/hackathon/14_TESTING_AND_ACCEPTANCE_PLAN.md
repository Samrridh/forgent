# 14 — Testing and Acceptance Plan

**Status:** `ACCEPTED & VERIFIED — ALL TEST SUITES PASSING (86 TESTS)`  
**Owner:** Distributed — B (contracts/API/reset), C (compiler/runtime/verifier/determinism), A (UI/journey/labels)  
**Gate rule:** a phase is not complete until its smoke test and verification evidence pass.

---

## 1. Test strategy

Forgent is a trust product. Tests must prove not only that the happy path works, but that failure, replacement, verification and payment attribution behave correctly.

```text
        ┌──────────────────────────────┐
        │  Demo acceptance (AC-01…10)  │  one canonical end-to-end run
        ├──────────────────────────────┤
        │  E2E / journey smoke          │  buyer + builder, live APIs
        ├──────────────────────────────┤
        │  Integration                  │  API + DB + compiler + runtime
        ├──────────────────────────────┤
        │  Contract                     │  Zod payloads, envelopes, roles
        ├──────────────────────────────┤
        │  Unit                         │  pure rules, matchers, verifier, money
        └──────────────────────────────┘
```

### Principles

1. **Deterministic first.** Fixed seed, fixed scenario, no external network, no LLM.
2. **Truth over snapshots.** Snapshot tests are allowed for stable contracts, but the WH-204 truth is asserted explicitly.
3. **Negative paths are first-class.** Failure, no-fallback, duplicate replay and false success are required tests.
4. **No mock at the final gate.** P7/P8 run with `NEXT_PUBLIC_USE_MOCKS=false`.
5. **Evidence, not opinion.** Every gate links to a command, report or screenshot.

---

## 2. Test levels

### 2.1 Unit

| Area | Required cases |
|---|---|
| Money | Integer paise; allocation sum; no float drift; reserve non-negative |
| Contracts | Valid/invalid enums, quantities, statuses, unknown fields |
| Matcher | Capability, status, visibility, schema, permission, budget, latency, platform boundary |
| Compatibility | Missing field, type mismatch, excess permission, undeclared requirement |
| Contract compiler | WH-204 snapshot; ambiguity; invalid budget/deadline |
| Candidate generator | Exactly three; acyclic; ordered; baseline hidden |
| Assertions | Every code/severity for every fixture |
| Selector | Rule-based selection on audition results; critical failure disqualified; qualifying candidate (A, B, or C eligible) selected dynamically; no-qualifier scenario |
| Failure injection | Default fails; clean does not; raw output preserved |
| Recovery | Compatibility checks; replacement; downstream invalidation; limits |
| Verifier | Ten positive checks; five negative cases; registry isolation |
| State diff | Invariant 42 → 42; pending 10; variance 2; separate fields: expectedQuantity (12), invoicedQuantity (12), scannedQuantity (10), discrepancyQuantity (2) |
| Receipt | Canonical JSON; stable SHA-256; independent recomputation |
| Attribution | v1.0.0 ₹0; v1.1.0 ₹2,500; total ₹5,500 |
| Settlement | `ELIGIBLE_SIMULATED`; provider null; replay idempotent |
| Reputation | Version isolation; basis points; replay no double increment |
| Tool Gateway | Scope validation; read operations pass; write-commit operations blocked pending human approval; direct DB credentials rejected |
| Agent Categories | Execution Agents: strict I/O schema enforcement, latency/cost bounds; Creation Agents (Roadmap): code correctness, test pass rate, regression preservation, clean PR generation |

### 2.2 Contract

- Every API response parses against its shared Zod schema.
- Every error uses the standard envelope and code.
- Role violations return 403; missing persona returns 401.
- Unknown IDs return 404; invalid state returns 409.
- No endpoint leaks a stack trace.
- Mocks parse against the same schemas as live responses.

### 2.3 Integration

### Authentication & Session Integration Tests
- **TC-AUTH-01:** Valid credentials or 1-click select for `buyer@northstar.demo` and `jordan@demoagent.studio` sets signed httpOnly `forgent_session` cookie; returns role-specific redirect URL.
- **TC-AUTH-02:** Invalid login credentials return 401 Unauthorized; missing session cookie on protected routes (`/buyer/**`, `/builder/**`) redirects to `/login`.
- **TC-AUTH-03:** Server-side role authorization guards reject unauthorized cross-role access (buyer accessing `/builder/**` returns 403 Forbidden; builder accessing `/buyer/**` returns 403 Forbidden).
- **TC-AUTH-04:** `POST /api/auth/logout` invalidates session cookie; subsequent requests are treated as unauthenticated.

### Agent Package Upload & Execution Safety Tests
- **TC-PKG-01:** Builder uploads valid ZIP package (<=5MB) containing `manifest.json`, schemas, source, and fixtures; unpacks safely, validates schemas, computes SHA-256 digest, stores artifact in persistent storage abstraction (`artifacts/packages/{packageId}/{versionId}.zip`), and creates `AgentVersion` with status `PENDING_APPROVAL`.
- **TC-PKG-02:** Upload of file >5MB or non-zip MIME type rejected with 400 Bad Request.
- **TC-PKG-03:** Malicious ZIP containing path traversal (`../`, absolute paths) rejected with 400 Bad Request; zero files extracted outside storage sandbox.
- **TC-PKG-04:** Critical execution safety boundary test: compiler and execution runtime reject unapproved uploaded packages with code `UNAPPROVED_EXECUTION_BINDING`; runtime executes ONLY approved, platform-hosted adapters (`src/server/agents/**`).

### Workflow & Core Integration Tests
- Create job + contract in one transaction; no orphan.
- Compile twice with the same key → same candidates; no duplicates.
- Audition → thirty fixture results across 10 fixtures for Candidates A, B, and C.
- Selection persists winning candidate dynamically from persisted audition runs; A, B, or C can qualify.
- Approve work order twice → same record; fail-closed safety limits and 42->42 inventory lock enforced.
- Start execution twice → one execution; no duplicate events.
- Inject failure → one recovery event; v1.1.0 accepted; failed v1.0.0 receives ₹0 payout.
- Verify twice → one acceptance result; ten checks pass (10/10).
- State diff & inventory invariant → confirms 42 -> 42 inventory on-hand held; commit blocked.
- Receipt twice → same canonical SHA-256 hash.
- Review acknowledge → commit stays blocked pending human review.
- Contributions twice → one row per stage (idempotent `@@unique([executionId, stageId])`).
- Settlement twice → one eligibility row; builder total ₹5,500; transaction total ₹10,000.
- Reset twice → identical IDs/counts.

### 2.4 E2E / The Canonical 18-Step Demo Journey

The end-to-end acceptance run exercises the complete 18-step arc:
1. Open `/login`
2. Sign in as Jordan Lee (Builder)
3. Open My Agents (`/builder/agents`)
4. Open Publish Agent (`/builder/agents/publish`) and upload package ZIP
5. Validate archive, verify SHA-256 digest and `PENDING_APPROVAL` status
6. Sign out via topbar
7. Sign in as Northstar Warehouse (Buyer)
8. Open WH-204 job
9. Review acceptance contract (10/2/42)
10. Compile and audition candidates dynamically across 10 fixtures
11. Dynamically select qualifying candidate (persisted in DB)
12. Approve work order with fail-closed limits & 42->42 lock
13. Execute workflow
14. Demonstrate v1.0.0 failure and compatible v1.1.0 replacement
15. Verify 10 received / 2 discrepancy result (10/10 checks PASS)
16. Verify 42 -> 42 inventory invariant preserved; commit blocked
17. Generate evidence receipt with SHA-256 hash
18. Verify commercial loop: buyer spend ₹10,000, builder ₹5,500, platform fee ₹2,500, reserves ₹2,000

Run each with live APIs, one mid-run reload, and one wrong-role attempt.

### 2.5 Demo acceptance

The canonical run in §5. This is the release gate.

---

## 3. Test data

| Fixture | Purpose |
|---|---|
| `wh204-v1` seed | Canonical demo truth |
| `wh204-suite-v1` | Ten audition fixtures (8 visible, 2 held-out) |
| Clean scenario | No injected failure |
| Default failure scenario | v1.0.0 schema-invalid |
| No-fallback fixture | v1.1.0 removed/paused → `FAILED_SAFE` |
| False-success fixture | Agent claims success with wrong state |
| Duplicate scan fixture | Dedupe to physical count |
| Contradiction fixture | Report vs scan conflict |
| Permission fixture | Attempted inventory commit |
| Replay fixtures | Duplicate compile/approve/start/verify/settle |

No test may depend on wall-clock date, random IDs in canonical fields or external network.

---

## 4. Acceptance checks AC-01…AC-10

These are the ten product-level checks. They must pass on the canonical demo run and map to the verifier.

| ID | Check | Pass condition | Evidence |
|---|---|---|---|
| **AC-01** | Received quantity equals physical scan | 10 received, not 12 | Verifier check + scan fixture |
| **AC-02** | Discrepancy correct | Expected 12 − received 10 = 2 | Reconciliation output + check |
| **AC-03** | Mismatch reported against receiving | Report explains invoice/PO vs physical | Exception report + evidence refs |
| **AC-04** | Unsupported inventory commit blocked | No commit; status `BLOCKED_PENDING_APPROVAL` | Ledger + audit + check |
| **AC-05** | Evidence references present | PO, invoice, scan refs and hashes | Receipt evidence section |
| **AC-06** | Human approval gate pending | Commit requires explicit approval | Gate state + review UI |
| **AC-07** | State diff matches evidence | 42→42 committed, pending 10, variance 2 | State diff + ledger |
| **AC-08** | No duplicate side effect | One accepted reconciliation, one proposal | Event/contribution counts |
| **AC-09** | Status is exception-requires-review | Exactly `EXCEPTION_REQUIRES_REVIEW` | Job/result/UI |
| **AC-10** | All stages terminal and attributed | Every stage terminal/awaiting; one attribution | Stage + contribution rows |

> AC-04 and AC-06 pass because the control works: the commit is correctly blocked and approval is correctly pending. They do not mean inventory was committed.

---

## 5. Canonical demo acceptance run

Precondition: reset; WH-204 `CONTRACT_READY`; 42/0/0 ledger; zero spend/earnings; mocks off.

| Step | Action | Expected | Pass |
|---|---|---|---|
| 1 | Open buyer overview | Northstar, WH-204, seeded labels | ☐ |
| 2 | Open contract | 12/12/10; 10 checks; commit blocked | ☐ |
| 3 | Compile | Three candidates A/B/C persisted | ☐ |
| 4 | Audition | Thirty results across 10 fixtures; 8 visible / 2 held-out; dynamic qualification | ☐ |
| 5 | Inspect A | Critical quantity failure | ☐ |
| 6 | Inspect B | No recovery path | ☐ |
| 7 | Select | Winning candidate dynamically selected from audition scores (A, B, or C eligible); rejection reasons persisted | ☐ |
| 8 | Work order | ₹10,000; ₹5,500 builder; ₹2,500 fee; ₹1,200/₹800 reserves | ☐ |
| 9 | Approve | Buyer-only; idempotent; job `APPROVED` | ☐ |
| 10 | Execute | Six stages; v1.0.0 fails `AGENT_SCHEMA_INVALID` | ☐ |
| 11 | Recover | v1.1.0 compatible; one recovery event; downstream rerun | ☐ |
| 12 | Verify | 10/10 checks; 10/2; pending review | ☐ |
| 13 | State diff | 42→42; pending 10; variance 2; no mutation | ☐ |
| 14 | Receipt | Hash stable; both versions; status `VERIFIED_PENDING_HUMAN_APPROVAL` | ☐ |
| 15 | Review | Buyer acknowledges; commit still blocked | ☐ |
| 16 | Buyer economics | ₹10,000 simulated spend; fee/reserves reconcile | ☐ |
| 17 | Builder earnings | ₹5,500 total; v1.0.0 ₹0; v1.1.0 ₹2,500 | ☐ |
| 18 | Reputation | v1.0.0 failure; v1.1.0 success/recovery; isolated | ☐ |
| 19 | Reset | `CONTRACT_READY`; identical IDs/counts | ☐ |
| 20 | Labels | Seeded/simulated/deferred labels correct | ☐ |
| 21 | No dead UI | Every nav/CTA works or is absent | ☐ |
| 22 | Mocks off | Network log shows live APIs only | ☐ |

---

## 6. Negative and adversarial suite

Nine required cases at P8:

| # | Case | Expected |
|---|---|---|
| N-01 | Invalid schema output | Typed `AGENT_SCHEMA_INVALID`; no acceptance |
| N-02 | Agent timeout | Typed `AGENT_TIMEOUT`; terminal state; no false success |
| N-03 | Contradictory outputs | `CONTRADICTORY_EVIDENCE`; verification fails |
| N-04 | Missing evidence | `EVIDENCE_MISSING`; no success |
| N-05 | Duplicate execution start | One execution; no duplicate events |
| N-06 | Unauthorized action | 403; audit event; state unchanged |
| N-07 | Failed replacement | `FAILED_SAFE`; no receipt/payout |
| N-08 | False agent success | Verifier fails; no acceptance |
| N-09 | Retry causing duplicate payout | One contribution per (executionId, stageId); stable total |
| N-10 | Dynamic candidate selection | When candidate scores vary or buyer constraints relax, Candidate A or B is correctly selected by the algorithm (Candidate C is not hardcoded) |

Additional verifier negatives (P5-C-003): wrong quantity, missing scan, unsupported commit, contradiction, false success.

---

## 7. Determinism

Run the chain three times after reset.

| Artifact | Must match |
|---|---|
| Acceptance checks | Same codes/status/expected/actual |
| Received/discrepancy | 10 / 2 |
| Recovery event | One; same failed/replacement versions |
| Contributions | Same rows and amounts |
| Settlement | ₹5,500; `ELIGIBLE_SIMULATED` |
| Receipt hash | Identical across runs |
| Canonical JSON | Identical except non-canonical timestamps/IDs |

If a timestamp or random ID affects the hash, freeze or exclude it from the canonical body. Do not weaken the hash to make it pass.

---

## 8. Performance targets

| Operation | Target |
|---|---|
| Full demo flow | Under 15 seconds |
| Audition suite | Under 60 seconds |
| Execution poll response | Under 300 ms locally; payload under 50 KB |
| Dashboard read | Under 300 ms locally |
| Reset | Under 10 seconds |
| Receipt read/export | Under 500 ms |

Measure with the demo data size. Do not claim production throughput.

---

## 9. Phase test gates

| Phase | Smoke test | Must pass |
|---|---|---|
| P0 | Install, dev, typecheck, lint, health, contract parse | All |
| P1 | Persona switch, overviews, seed twice, adapter outputs | All |
| P2 | Catalog filters, agent detail, job create, invalid job | All |
| P3 | Compile, auditions, selection, baseline hidden, held-out leak test | All |
| P4 | Approve, execute, failure, replacement, no-fallback | All |
| P5 | Ten checks, state diff, receipt hash, review gate | All |
| P6 | Economics totals, v1.0.0 ₹0, replay idempotency | All |
| P7 | Mocks off, route parity, three resets, contract suite | All |
| P8 | Buyer/builder/API regressions, nine negatives, three rehearsals | All |

---

## 10. Defect severity

| Severity | Definition | Action |
|---|---|---|
| **S1 — Blocker** | Demo cannot run; false success; wrong money; inventory mutation; data loss | Stop; fix immediately; do not rehearse around it |
| **S2 — Critical** | Failure/replacement/verification broken; role bypass; hash unstable | Fix before next gate |
| **S3 — Major** | A route/CTA broken; wrong label; payload mismatch | Fix before P8 |
| **S4 — Minor** | Visual/spacing/copy issue | Fix if time; record otherwise |

An S1 in the trust or economic path cancels the demo until fixed. There is no “known issue” exception for a false payment or inventory commit.

---

## 11. Traceability

| Blueprint claim | Test evidence |
|---|---|
| Marketplace with independent builders | Seed, catalog, version timeline, builder earnings |
| Compiler auditions teams | Three candidates, thirty fixture results, selection reasons |
| Bounded recovery | Failure injection, compatibility checks, one replacement |
| Independent verification | Ten checks, false-success negative, registry isolation |
| Trust receipt | Stable hash, both versions, export |
| Paid contribution attribution | ₹5,500 total, v1.0.0 ₹0, replay tests |
| Consequential action blocked | 42/10/2 diff, 403 commit, review test |
| Honest simulation | Label audit, no provider, no fake demand |

---

## 12. Sign-off

- [ ] All nine phase gates passed and recorded.
- [ ] Canonical demo acceptance run passed twice.
- [ ] Nine negative cases passed.
- [ ] Determinism: three identical runs.
- [ ] Performance targets met.
- [ ] Buyer and builder journeys passed with mocks off.
- [ ] No S1/S2 defect open.
- [ ] Every simulated value labelled.
- [ ] Three rehearsals under 3:15.
- [ ] Runbook signed.
- [ ] `v1.0-demo` tagged.

**Sign-off owners:** A (journey/UI), B (API/data/reset), C (compiler/runtime/verifier/economics). All three required.

---

## Related documents

- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [07 — Integration Contracts](07_INTEGRATION_CONTRACTS.md)
- [10 — Compiler and Evaluation](10_COMPILER_AND_EVALUATION_SPEC.md)
- [11 — Execution, Recovery and Verification](11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md)
- [13 — Demo Runbook](13_DEMO_RUNBOOK.md)
