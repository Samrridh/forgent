# 13 — Demo Runbook

**Status:** `ACCEPTED — PRODUCTION VERIFIED RUNBOOK`  
**Owner:** Team A (delivery), B (environment/reset), C (technical chain)  
**Demo length:** target **3:00**, hard ceiling **3:15**  
**Source of truth:** seeded WH-204 + live APIs; no pre-recorded run unless explicitly labelled as a fallback

---

## 1. Demo thesis

> Forgent does not just generate a workflow. It compiles a team of independently built agents, auditions competing teams, survives a real failure, verifies the outcome independently, and pays only the work that was accepted.

The three moments the judges must remember:

1. **The compiler chooses with evidence.** A fails on quantities; B has no recovery; C is selected.
2. **The failure is real and recovered.** v1.0.0 fails; v1.1.0 replaces it; downstream reruns.
3. **The economics follow accepted work.** v1.0.0 earns ₹0; v1.1.0 earns ₹2,500; Jordan earns ₹5,500 (simulated).

---

## 2. Preflight (T-15 minutes)

### Environment

- [ ] Node 22 and npm 10 available.
- [ ] `npm install` already complete; no install during the demo.
- [ ] `.env` has valid `DATABASE_URL` (Neon pooled URL with `?sslmode=require`), `DIRECT_URL` (Neon direct migration URL), `QSTASH_URL` / `QSTASH_TOKEN` (or deterministic local test mode), `NEXT_PUBLIC_USE_MOCKS="false"`, `NEXT_PUBLIC_DEMO_MODE="true"`, `DEMO_MODE="true"`, `DEMO_FAILURE_SCENARIO="WH204_DEFAULT_FAILURE"`, `DEMO_STAGE_DELAY_MS="700"`.
- [ ] `npm run db:push` and `npm run db:seed` have run.
- [ ] `npm run dev` is running on `http://localhost:3000`.
- [ ] `/api/health` returns 200 with `database=up`.
- [ ] Browser zoom 100%, 1440×900 or 1280×800; one tab; no unrelated tabs.
- [ ] Demo banner visible: seeded data, simulated payments, simulated inventory.
- [ ] Network disabled only if the offline fallback has been separately tested; otherwise keep local network available but no external calls are needed.
- [ ] Screen recording backup is available and clearly labelled if used.

### Reset

- [ ] Click **Reset demo** in the topbar; confirm.
- [ ] Or run `npm run db:reset` and reseed.
- [ ] Verify `job-wh-204` is `CONTRACT_READY`.
- [ ] Verify four visible agent versions; baseline hidden.
- [ ] Verify inventory 42 committed / 0 pending / 0 variance before the run.
- [ ] Verify buyer spend ₹0 and builder earnings ₹0.
- [ ] Open `/buyer/overview` as Northstar.

### Personal

- [ ] Runbook printed or on a second screen.
- [ ] Timer visible.
- [ ] Water; phone silent.
- [ ] One person drives, one person watches the timer and queue.

### Truth card (memorise)

```text
Expected PO 12 · Invoiced 12 · Scanned Receiving 10 · Discrepancy 2
Inventory 42 → 42 (on-hand invariant) · Pending 10 · Variance 2 · Commit BLOCKED
Buyer ₹10,000
Builder ₹5,500 = 2,000 (Evidence Reader) + 2,500 (Reconciliation v1.1.0) + 1,000 (Reporter)
Platform fee ₹2,500 · Reserves ₹1,200 + ₹800
v1.0.0 ₹0 (replaced) · v1.1.0 ₹2,500 (accepted output)
Status: EXCEPTION_REQUIRES_REVIEW
Acceptance: 10/10 checks pass · Tamper-evident receipt hash · VERIFIED_PENDING_HUMAN_APPROVAL
```

---

## 3. The three-minute script — The Canonical 18-Step Journey

The demo follows the authoritative 18-step end-to-end journey spanning builder onboarding, package submission, buyer job creation, dynamic compilation, safe execution, failure recovery, independent verification, and economic settlement:

| Step | Action | Route | Persona |
|---|---|---|---|
| **1** | Open Forgent login | `/login` | Public |
| **2** | Sign in as Jordan Lee (Builder) | `/api/auth/login` | Jordan Lee |
| **3** | View My Agents and version history | `/builder/agents` | Jordan Lee |
| **4** | Open Publish Agent & upload package ZIP | `/builder/agents/publish` | Jordan Lee |
| **5** | Validate, store, and inspect SHA-256 digest & `PENDING_APPROVAL` status | `/builder/agents/publish` | Jordan Lee |
| **6** | Sign out via topbar | `/api/auth/logout` | Jordan Lee |
| **7** | Sign in as Northstar Warehouse (Buyer) | `/api/auth/login` | Northstar Buyer |
| **8** | Open receiving exception job WH-204 | `/buyer/jobs/wh-204` | Northstar Buyer |
| **9** | Review compiled acceptance contract (10/2/42) | `/buyer/jobs/wh-204` | Northstar Buyer |
| **10** | Compile & audition candidate workflows across 10 fixtures | `/buyer/jobs/wh-204/compiler` | Northstar Buyer |
| **11** | Dynamically select qualifying workflow (A, B, or C) | `/buyer/jobs/wh-204/compiler` | Northstar Buyer |
| **12** | Approve work order (fail-closed limits & 42->42 lock) | `/buyer/jobs/wh-204/work-order` | Northstar Buyer |
| **13** | Execute workflow | `/buyer/jobs/wh-204/execution` | Northstar Buyer |
| **14** | Demonstrate v1.0.0 failure & v1.1.0 recovery | `/buyer/jobs/wh-204/execution` | Northstar Buyer |
| **15** | Run independent 10-check verification (10/10 PASS) | `/buyer/jobs/wh-204/verification` | Northstar Buyer |
| **16** | Verify 42->42 inventory invariant & commit blocked | `/buyer/jobs/wh-204/verification` | Northstar Buyer |
| **17** | Inspect evidence receipt and SHA-256 canonical hash | `/buyer/jobs/wh-204/receipt` | Northstar Buyer |
| **18** | Review commercial loop: buyer spend ₹10,000, builder ₹5,500 | `/buyer/jobs/wh-204/economics` | Northstar Buyer |

---

### 0:00–0:30 — Builder onboarding & package submission pipeline (Steps 1–6)

**Screen:** `/login` -> `/builder/agents/publish` -> `/builder/agents`

**Action:**
1. Click "Sign in as Jordan Lee (Builder)" 1-click quick-select.
2. Open `/builder/agents/publish` and upload the example `reconciliation-agent.zip`.
3. Highlight real-time extraction: parsed `manifest.json`, input/output schemas, SHA-256 digest, persistent storage abstraction, and the `PENDING_APPROVAL` status badge.
4. **Emphasize execution safety:** "Forgent stores and validates the package. For hackathon security, arbitrary untrusted code is never dynamically executed; live workflows execute only approved platform adapters."
5. Click "Sign Out".

---

### 0:30–0:50 — The physical problem & buyer sign-in (Steps 7–8)

**Screen:** Buyer overview, WH-204 card.

**Say:**

> “Northstar received a shipment. The purchase order says 12. The invoice says 12. The physical scan found 10. Two boxes are missing, and nobody is allowed to quietly change inventory to make the numbers match.”

**Point at:** 12 / 12 / 10 and the seeded demo label.

**Do not:** explain the entire architecture yet.

---

### 0:20–0:40 — A paid job, not a prompt

**Action:** Open `/buyer/jobs/job-wh-204` → Contract tab.

**Say:**

> “Northstar posted this as a paid outcome: ₹10,000, with a compiled acceptance contract. Ten objective checks, a hard approval gate for inventory, and one retry and one replacement — not unlimited automation.”

**Point at:** expected outcome 10 / 2 / `EXCEPTION_REQUIRES_REVIEW`, inventory `BLOCKED_PENDING_APPROVAL`.

---

### 0:40–1:00 — The independent builder economy

**Action:** Open `/buyer/marketplace` → agent detail for Reconciliation Specialist.

**Say:**

> “The supply side is independent. Jordan Lee runs Demo Agent Studio. He publishes versioned agents with schemas, permissions, prices and limitations. v1.0.0 is the primary. v1.1.0 is a compatible fallback. Jordan earns only when a stage is accepted.”

**Point at:** version timeline, ₹2,500 price, fallback link, seeded/demo label.

**If asked:** “Is this real supply?” → “Seeded demo supply. The marketplace mechanics and attribution are real; the identities and demand are seeded.”

---

### 1:00–1:30 — Dynamic compile and audition of three teams

**Action:** Compiler tab → **Compile** → **Run auditions**.

**Say:**

> “Forgent compiles three bounded candidates: a single-agent baseline, a fixed specialist team, and a compiler-selected team with a bound fallback. All three audition dynamically on the same ten fixtures and the same seed. Selection is computed in real time from persisted audition runs — Candidate C is not preordained; any candidate can qualify if it passes hard constraints.”

**Point at:**
- Candidates A, B, and C auditioning side-by-side.
- A: fails the physical quantity check (12 vs 10).
- B: passes quantities but has no recovery path.
- C: passes hard constraints and has a compatible fallback (illustrative 10/10 checks, ₹10,000 cost).
- Two held-out cases are aggregated, not exposed.

**Action:** Select C based on measured evaluation results.

**Say:**

> “Hard constraints first. A high score cannot override a critical failure.”

---

### 1:30–1:55 — Approve the ₹10,000 work order

**Action:** Work-order tab → show allocation table → approve.

**Say:**

> “The buyer approves ₹10,000 before execution. Jordan’s stages total ₹5,500. Forgent’s fee is ₹2,500. ₹1,200 is reserved for execution and recovery, ₹800 for human review. Settlement is simulated eligibility, not a real payment.”

**Do not:** rush past the arithmetic; judges remember coherent money.

---

### 1:55–2:25 — The failure and replacement moment

**Action:** Execution tab → **Start execution**.

**Narrate while it runs:**

> “Six stages. Evidence extraction, reconciliation, policy, exception report, inventory proposal, human approval.”

**At the red failure:**

> “Reconciliation v1.0.0 just returned an invalid schema. The runtime caught it. The raw malformed output is preserved. v1.0.0 is not paid.”

**At the dashed replacement:**

> “Forgent checks compatibility: same capability, compatible input and output schemas, permissions subset, within reserve. v1.1.0 replaces it. Downstream stages are invalidated and rerun against the new output.”

**At completion:**

> “10 received, 2 discrepancy, exception requires review. Inventory is still 42 committed — the proposal is blocked pending human approval.”

**Pause.** Let the failure and replacement land. This is the signature moment.

---

### 2:25–2:50 — Independent verification and tamper-evident receipt

**Action:** Verification tab → scroll ten checks → Receipt tab.

**Say:**

> “The verifier is not an agent. It is Forgent's independent deterministic module. It does not trust the agent's success message; it recomputes the quantities from evidence. Ten checks pass. The state diff is 42 → 42 on-hand invariant, pending 10, variance 2. The inventory commit is still blocked. The receipt is tamper-evident and hash-verified with SHA-256.”

**Point at:** the copyable SHA-256 receipt hash, v1.0.0 and v1.1.0 both present, status `VERIFIED_PENDING_HUMAN_APPROVAL`, and explain hash scope.

---

### 2:50–3:10 — The economic loop

**Action:** Open `/builder/earnings` (persona switch).

**Say:**

> “Jordan sees the loop close. Evidence Reader ₹2,000. Reconciliation v1.0.0: ₹0, because it was replaced before an accepted output. v1.1.0: ₹2,500, because it produced the accepted output. Exception Reporter ₹1,000. Total eligible: ₹5,500 — simulated. Forgent keeps a ₹2,500 fee. No money moves in this demo, but the attribution is real.”

**Point at:** v1.0.0 ₹0 reason, v1.1.0 ₹2,500, total ₹5,500, eligible-simulated label.

---

### 3:10–3:15 — Close

**Say:**

> “A marketplace where agents compete, a compiler that selects with evidence, a runtime that survives failure, and verification that pays only accepted work. That is Forgent.”

**Stop talking.** Invite questions.

---

## 4. Timing discipline

| Segment | Target | Cumulative |
|---|---:|---:|
| Problem | 0:20 | 0:20 |
| Paid job | 0:20 | 0:40 |
| Builder economy | 0:20 | 1:00 |
| Compile/audition | 0:30 | 1:30 |
| Work order | 0:25 | 1:55 |
| Failure/recovery | 0:30 | 2:25 |
| Verification/receipt | 0:25 | 2:50 |
| Economics/close | 0:25 | 3:15 |

If running long:

1. Shorten the marketplace tour to one sentence.
2. Skip the policy/inventory stage detail.
3. Show the receipt hash but do not scroll the whole document.
4. Never skip the failure/replacement or the v1.0.0 ₹0 moment.

If running short:

- Open the safe-failure scenario in a second run and explain bounded recovery.
- Show the held-out disclosure.
- Show the receipt JSON export.

---

## 5. Judge questions and answers

| Question | Answer |
|---|---|
| “Is this just an LLM wrapper?” | “No. The critical path is deterministic: structured contract compilation, hard matching, ten fixtures, a runtime and a verifier. No LLM is required for the demo.” |
| “Are these real agents?” | “They are seeded demo agents with real versioned manifests and deterministic adapters. The marketplace and attribution mechanics are real; supply and demand are seeded.” |
| “Did money actually move?” | “No. Settlement is `ELIGIBLE_SIMULATED`. There is no payment provider. We deliberately do not claim a payout.” |
| “Did inventory change?” | “No. The ledger stays 42 committed, 10 pending, 2 variance. The commit is blocked pending human approval. Inventory is simulated.” |
| “Why pay v1.1.0 and not v1.0.0?” | “Payment follows accepted stage output. v1.0.0 failed schema validation and was replaced before acceptance. Paying both would double-pay the stage and reward failure.” |
| “How do you know the result is correct?” | “The independent verifier recomputes from the PO, invoice and physical scan. It ignores agent self-reported success and checks ten acceptance conditions.” |
| “What if no fallback exists?” | “The run stops `FAILED_SAFE` with preserved evidence, no receipt, no contribution and no payout. We can show that negative path.” |
| “Can an agent commit inventory?” | “No. No agent has `commit:inventory`. A direct attempt is blocked and audited. A human must approve.” |
| “Why three candidates?” | “To make the selection falsifiable: a baseline, a fixed team and a compiled team, all on the same suite and seed. A and B are rejected for recorded reasons.” |
| “Is the baseline a Jordan Lee listing?” | “No. It is an evaluation-only baseline, hidden from the marketplace (`registryVisible=false`), so the comparison is fair.” |
| “Can developers upload arbitrary executable code right now?” | “No. The hackathon MVP uses curated, platform-hosted Execution Agent adapters (`src/server/agents/**`). Arbitrary third-party uploads require sandboxed microVM/container runtimes, resource quotas, and egress firewalls, which are scheduled for our near-term roadmap.” |
| “Does Forgent modify our business codebase?” | “No. The Northstar receiving scenario is an operational data-processing workflow mediated by our Tool Gateway. Creation Agents that analyze repos, write code, run tests, and open Pull Requests belong to our long-term software engineering roadmap, not this receiving demo.” |
| “What is not real?” | “Auth, payments, inventory integration, public onboarding, historical demand and production scale. Everything simulated is labelled.” |
| “What would you validate next?” | “Buyer willingness to pay, builder acquisition, verification cost per job, dispute rates and real recovery behaviour on messy evidence.” |

---

## 6. Fallbacks

### 6.1 If the dev server dies

1. Restart `npm run dev`.
2. Reload.
3. Resume from persisted state; do not restart the whole story.
4. If the run is corrupted, reset and replay the three-minute script from 1:00.

### 6.2 If the database is corrupted

1. Stop the server.
2. Run `npm run db:reset` (or invoke `POST /api/demo/reset`) to execute FK-safe truncate and deterministic seed restoration in Neon PostgreSQL.
3. Restart `npm run dev`.
4. Verify health and WH-204 `CONTRACT_READY`.
5. Resume.

### 6.3 If execution hangs

1. Check `/api/health`.
2. Reload the execution tab; polling resumes from persisted state.
3. If still stuck, reset and rerun. Do not fake progress.
4. If the failure injection is the problem, switch to `WH204_CLEAN` only if the runbook explicitly allows it; otherwise use the recorded fallback and label it.

### 6.4 If the network is unavailable

- The critical path requires no external network after install.
- Verify before the demo; do not discover this on stage.

### 6.5 If a UI route fails

- Use the direct URL; do not hunt through navigation.
- If a page is broken, show the API payload in the browser only as a last resort and state that the UI route is the defect.
- Never claim a route works if it does not.

### 6.6 Recorded fallback

A screen recording may be used **only** if:

- It is clearly labelled “recorded fallback”.
- The live failure is explained honestly.
- The judge is told which parts are recorded.
- It is a last resort, not a substitute for rehearsal.

---

## 7. Troubleshooting quick reference

| Symptom | Likely cause | Action |
|---|---|---|
| Health 503 | DB file missing/locked | `npm run db:push`; restart; check WAL |
| WH-204 missing | Seed not run / wrong DB | `npm run db:reset`; reseed |
| Four versions not visible | Seed incomplete / paused | Run seed integrity query; check `registryVisible` |
| Compile 409 | Job not `CONTRACT_READY` | Reset; verify status |
| Auditions slow | Stage delay too high | Lower `DEMO_STAGE_DELAY_MS`; rerun |
| No failure shown | Scenario is `WH204_CLEAN` | Set `WH204_DEFAULT_FAILURE`; reset |
| No replacement | v1.1.0 missing/paused | Reseed; verify fallback link |
| Receipt hash changes | Non-canonical timestamp/order | Fix canonicalisation; do not hide |
| Earnings ₹0 | Verification not passed | Check verification tab and contribution rows |
| Reset fails | Demo mode flag off / FK issue | Check `DEMO_MODE`; inspect reset order |
| Wrong persona | Cookie stale | Switch persona; reload |

---

## 8. Claims discipline

### Say

- “Seeded demo supply and Jordan Lee builder identity.”
- “Builder package ZIP upload is validated, checksummed with SHA-256, and stored in pending-approval status.”
- “For runtime execution safety, live workflows strictly execute approved platform-hosted adapters.”
- “Simulated eligibility and commercial earnings.”
- “Simulated inventory ledger with strict 42 -> 42 invariant lock.”
- “Measured dynamically on `wh204-suite-v1`.”
- “Independent deterministic verifier with tamper-evident SHA-256 receipt hash.”
- “In this demo.”

### Do not say

- “Real payments or bank payouts.”
- “Arbitrary uploaded developer code is executed dynamically in the live workflow.”
- “Live warehouse or ERP integration.”
- “Production-ready or enterprise certified.”
- “Thousands of agents or guaranteed earnings.”
- “The AI decided without human gates.”
- “Fully autonomous inventory mutation.”

If a judge asks a question whose honest answer is “we did not build that,” say so. The demo's credibility depends on the boundary being clear.

---

## 9. Post-demo checklist

- [ ] Reset the demo to `CONTRACT_READY` for the next judge.
- [ ] Close the receipt/execution tabs.
- [ ] Return to `/buyer/overview`.
- [ ] Note any defect or judge question in the decision log.
- [ ] If a run failed, record the cause and the fallback used.
- [ ] Keep the backup untouched.

---

## 10. Rehearsal log (fill at P8)

| Run | Date/time | Duration | Failure visible | Replacement visible | 10/10 checks | ₹5,500 shown | Reset after | Defects | Signed |
|---|---|---|---:|---|---|---|---|---|---|
| 1 | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — | — |
| 2 | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — | — |
| 3 | — | — | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | — | — |

Three clean rehearsals are required before `v1.0-demo`.

---

## Related documents

- [09 — UI/UX Specification](09_UI_UX_SPECIFICATION.md)
- [11 — Execution, Recovery and Verification](11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md)
- [12 — Marketplace and Economics](12_MARKETPLACE_AND_ECONOMICS_SPEC.md)
- [14 — Testing and Acceptance Plan](14_TESTING_AND_ACCEPTANCE_PLAN.md)
- [15 — Risk and Scope Register](15_RISK_AND_SCOPE_REGISTER.md)
