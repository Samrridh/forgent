# 10 — Compiler and Evaluation Specification

**Status:** `ACCEPTED & IMPLEMENTED — PRODUCTION VERIFIED`  
**Owner:** Team C  
**Consumers:** A (compiler UX, graph, comparison), B (persistence and APIs)  
**Canonical code:** `src/server/compiler/**`, `src/server/agents/**`, `src/server/fixtures/**`  
**Rule:** this specification must produce the same answer twice for the same seed and scenario. No LLM is on the critical path.

---

## 1. Purpose

The Team Compiler turns a buyer's outcome into a bounded, auditioned, selected workflow. It must answer four questions with evidence:

1. **Can this job be done?** Capability matching and honest gaps.
2. **What are the competing ways to do it?** Three candidates: baseline, fixed team, compiler-selected team.
3. **Which one actually performs?** Measured auditions on the same ten fixtures and seed.
4. **Why was one selected?** Hard constraints first, then cost/latency/recovery, with persisted reasons.

It is not a prompt chain and it does not generate a workflow from prose alone. The job is structured; the contract is compiled; the candidates are bounded; the results are measured.

### 1.1 The 9-Step Compiler Pipeline
When a business submits an outcome request and budget/deadline constraints, the Team Compiler executes a deterministic 9-step intelligence pipeline:
1. **Decomposes** the requested business outcome into required capabilities (e.g. extraction, reconciliation, policy, reporting, human gate).
2. **Queries** the versioned Agent/Capability Registry to identify candidate packages and implementations.
3. **Identifies** suitable agent packages, deterministic platform functions, and business system connectors.
4. **Generates** candidate workflow graphs. *Multi-agent execution is not mandatory.* The compiler may assemble a single agent, cooperating specialists, deterministic platform code, or human review gates.
5. **Configures** candidate agent instances with job-specific parameters, business context, and Tool Gateway permission scopes.
6. **Checks** schemas, dependencies, permissions, compatibility, budget ceilings, and execution limits.
7. **Auditions** candidates on comparable synthetic fixtures (`wh204-suite-v1`).
8. **Rejects** candidates that fail critical acceptance constraints (e.g. quantity mismatch, schema corruption).
9. **Selects** a qualifying workflow dynamically based on observed accuracy, cost, latency, recovery, and human intervention.

---

## 2. Inputs

### 2.1 Structured job

```ts
interface CompilerJobInput {
  jobId: string;
  outcome: string;
  inputs: JobInputs;                 // PO, invoice, receiving scan
  budgetPaise: number;               // 1,000,000 for WH-204
  deadline: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  approvalRules: {
    inventoryCommitRequiresHumanApproval: true;
  };
}
```

### 2.2 WH-204 canonical truth

| Field | Value |
|---|---|
| Expected (PO) | 12 |
| Invoiced | 12 |
| Physically received | 10 |
| Discrepancy | 2 |
| Direction | `SHORT` |
| Outcome | `EXCEPTION_REQUIRES_REVIEW` |
| Inventory commit | `BLOCKED_PENDING_APPROVAL` |
| Committed on hand | 42 before and after |
| Pending receipt | 10 |
| Proposed on hand if approved | 52 |

### 2.3 Registry

Only `ACTIVE` versions with `registryVisible=true` are eligible for marketplace candidates. The hidden evaluation baseline is resolvable by the compiler for Candidate A but never returned by marketplace queries.

Platform-owned functions (`policy_validation`, `inventory_proposal`, `human_approval`) are deterministic runtime capabilities. They are not AgentVersion listings and cannot be hired.

---

## 3. Capability taxonomy

| Key | Label | Owner | WH-204 required? |
|---|---|---|---|
| `document_evidence_extraction` | Document evidence extraction | Marketplace | Yes |
| `quantity_reconciliation` | Quantity reconciliation | Marketplace | Yes |
| `policy_validation` | Policy validation | Platform | Yes |
| `exception_reporting` | Exception reporting | Marketplace | Yes |
| `inventory_proposal` | Inventory proposal | Platform | Yes |
| `human_approval` | Human approval checkpoint | Platform | Yes |

### 3.1 Permission keys

```text
read:purchase_orders
read:invoices
read:receiving_scans
read:reconciliation_results
read:inventory_ledger
propose:inventory_delta
commit:inventory          ← never granted to any agent
```

`commit:inventory` exists only to prove that no agent has it and that a direct commit attempt is rejected.

### 3.2 Marketplace manifests

| Version | Capabilities | Price (paise) | Latency | Fallback | Visible |
|---|---|---:|---:|---|---|
| `av-evidence-reader-100` | extraction | 200,000 | 900 ms | — | Yes |
| `av-reconciliation-100` | reconciliation | 250,000 | 1,200 ms | `av-reconciliation-110` | Yes |
| `av-reconciliation-110` | reconciliation | 250,000 | 1,100 ms | — | Yes |
| `av-exception-reporter-100` | reporting | 100,000 | 700 ms | — | Yes |
| `baseline-single-agent` | all worker capabilities | 300,000 | 2,500 ms | — | **No** |

The baseline is labelled `Evaluation baseline — not for hire`, builder `platform-baseline`, and is excluded from catalog, search, matching for hire, and receipts as a paid participant.

---

## 4. Matching

### 4.1 Hard filters (in order)

A version is eligible only if **all** pass:

1. **Capability:** declares the required capability.
2. **Status:** `ACTIVE`; not paused or retired.
3. **Visibility:** `registryVisible=true` for hire; baseline only for Candidate A.
4. **Input schema:** the stage input schema is satisfied, including required fields.
5. **Output schema:** the stage output schema can satisfy the next stage's required fields.
6. **Permissions:** the version's permissions are a subset of the stage scope; no `commit:inventory`.
7. **Budget:** estimated stage cost does not exceed the remaining job budget.
8. **Latency:** estimated latency fits the stage deadline.
9. **Platform boundary:** platform-owned capabilities resolve only to platform functions, never to a marketplace agent.
10. **Execution safety approval:** The version must have `executionEligible=true` and a registered, approved platform adapter (`src/server/agents/**`). Unapproved package uploads with status `PENDING_APPROVAL` are strictly filtered out with rejection code `UNAPPROVED_EXECUTION_BINDING`.

### 4.2 Rejection reasons

Every exclusion returns a machine-readable reason:

```ts
interface MatchRejection {
  agentVersionId: string;
  code:
    | "MISSING_CAPABILITY"
    | "INACTIVE_VERSION"
    | "NOT_VISIBLE"
    | "INPUT_SCHEMA_MISMATCH"
    | "OUTPUT_SCHEMA_MISMATCH"
    | "PERMISSION_EXCEEDED"
    | "BUDGET_EXCEEDED"
    | "LATENCY_EXCEEDED"
    | "PLATFORM_BOUNDARY";
  message: string;
  path?: string;
}
```

No silent fallback. If nothing matches, the compiler returns a typed capability gap.

### 4.3 Compatibility checks

Compatibility is checked at every edge, not only at matching:

| Check | Failure code |
|---|---|
| Required field exists in producer output | `MISSING_FIELD` |
| JSON type matches (`string`, `number`, `boolean`, `array`, `object`) | `TYPE_MISMATCH` |
| No missing required field at the consumer | `MISSING_REQUIRED_FIELD` |
| Permissions subset of stage scope | `PERMISSION_EXCEEDED` |
| No extra required field invented by the consumer | `UNDECLARED_REQUIREMENT` |

Each failure includes a JSON path, for example `$.evidence.physicallyReceivedQuantity`.

### 4.4 Capability gaps

When a required capability has no eligible version, return exactly one of four honest outcomes:

1. **Alternative composition** — a different valid set of existing capabilities can achieve the outcome. Evaluate it; do not claim it exists without a graph.
2. **Developer opportunity** — no current supply; state what capability is missing and what interface it would need.
3. **Human specialist** — the outcome requires a human checkpoint or specialist.
4. **Infeasible** — the job cannot be responsibly automated with current supply.

Never claim the platform can create the missing capability automatically. Never show a fake bounty submission flow.

---

## 5. Acceptance-contract compiler

### 5.1 Output

```ts
interface CompiledAcceptanceContract {
  contractId: string;
  jobId: string;
  version: number;                    // 1 for WH-204
  objective: string;
  expectedOutcome: {
    receivedQuantity: 10;
    discrepancyQuantity: 2;
    status: "EXCEPTION_REQUIRES_REVIEW";
    inventoryCommit: "BLOCKED_PENDING_APPROVAL";
  };
  requiredCapabilities: CapabilityKey[]; // six for WH-204
  checks: AcceptanceCheckDefinition[];  // exactly ten
  approvalRules: { inventoryCommitRequiresHumanApproval: true };
  limits: {
    maxRetriesPerStage: 1;
    maxReplacementAttempts: 1;
    maxExecutionBudgetPaise: number;
  };
  evidenceRequired: string[];
  ambiguityWarnings: string[];
  frozenAt: string;
}
```

### 5.2 Compilation rules

1. **Objective** is the buyer's outcome, normalised, not rewritten into a different promise.
2. **Required capabilities** are derived from the structured outcome and evidence.
3. **Checks** are exactly the ten AC codes in [07 — Integration Contracts](07_INTEGRATION_CONTRACTS.md#acceptance-check-codes-exactly-ten). The buyer may not remove a critical check in the demo.
4. **Approval rule** is always on. Inventory commit requires explicit human approval, with no override.
5. **Limits** default to one retry, one replacement, and a bounded execution budget from the ₹10,000 total.
6. **Evidence requirements** name PO, invoice and receiving scan, with hashes.
7. **Ambiguity warnings** are surfaced, never auto-resolved silently. For WH-204: “Physical receiving is authoritative; confirm the 10-unit scan is complete.”
8. **Freeze** at creation. A change creates a new contract version and a decision entry.

### 5.3 Ambiguity handling

| Ambiguity | Behaviour |
|---|---|
| Conflicting quantities | Warn; use the declared authority (`PHYSICAL_RECEIVING`) but show the conflict. |
| Missing evidence | Do not compile a “best guess”; return `EVIDENCE_MISSING` or a warning requiring input. |
| Unclear approval owner | Default to buyer approval; warn. |
| Budget below minimum viable cost | Reject with a typed budget error; do not silently shrink scope. |

---

## 6. Candidate generation

Exactly three candidates are generated for WH-204.

### 6.1 Candidate A — single-agent baseline

| Property | Value |
|---|---|
| ID | `cand-wh204-single` |
| Strategy | `SINGLE_AGENT` |
| Node | One `EVALUATION_BASELINE` node |
| Marketplace visible | `false` |
| Purpose | Fair comparison against a generalist |
| Expected weakness | Uses invoice quantity as received; fails physical-quantity truth |
| Recovery | None |

### 6.2 Candidate B — fixed specialist team

| Property | Value |
|---|---|
| ID | `cand-wh204-fixed` |
| Strategy | `FIXED_TEAM` |
| Nodes | Evidence Reader, Reconciliation v1.0.0, Policy, Exception Reporter, Inventory Proposal, Human Approval |
| Marketplace visible | `true` as a candidate strategy (not a listing) |
| Purpose | Strong specialist composition without compiler-bound fallback |
| Expected weakness | No compatible replacement for reconciliation; fails recovery readiness |
| Recovery | None; `maxReplacementAttempts: 0` |

### 6.3 Candidate C — compiler-selected team

| Property | Value |
|---|---|
| ID | `cand-wh204-compiled` |
| Strategy | `COMPILER_SELECTED` |
| Nodes | Same six stages, with `av-reconciliation-110` bound as fallback for `av-reconciliation-100` |
| Marketplace visible | `true` |
| Purpose | The product's thesis: a compiled team with bounded recovery |
| Expected strength | Passes hard checks and has a compatible fallback |
| Recovery | Max 1 replacement at reconciliation; downstream invalidation supported |

### 6.4 Graph contract

| Stage | Kind | Implementation |
|---|---|---|
| `stage-evidence-read` | `AGENT (HYBRID)` | Evidence Reader v1.0.0 (model-backed with deterministic fallback) |
| `stage-reconcile` | `AGENT (DETERMINISTIC)` | Reconciliation v1.0.0; fallback v1.1.0 |
| `stage-policy-check` | `DETERMINISTIC` | `fn-policy-check-v1` (Platform-owned) |
| `stage-exception-report` | `AGENT (DETERMINISTIC)` | Exception Reporter v1.0.0 |
| `stage-propose-inventory` | `DETERMINISTIC` | `fn-inventory-proposal-v1` (Platform-owned, 42 → 42 invariant) |
| `stage-human-approval` | `HUMAN_APPROVAL` | Buyer checkpoint |

Edges are dependency-ordered and acyclic:

```text
evidence-read → reconcile → policy-check → exception-report
             → propose-inventory → human-approval
```

Verification runs outside this graph after execution reaches the approval gate.

### 6.5 Validation before audition

A candidate is rejected before audition if:

- The graph has a cycle or an unreachable node.
- A dependency is missing or out of order.
- A schema handoff is incompatible.
- A permission exceeds scope.
- A required stage has no implementation.
- Estimated cost exceeds the budget.
- The baseline is marked marketplace-visible.

---

## 7. Audition suite `wh204-suite-v1`

Ten fixtures, fixed seed, same suite for A/B/C. Eight visible, two held-out.

| ID | Fixture | Scenario | Expected truth | Visibility |
|---|---|---|---|---|
| `F-01` | Normal short shipment | PO 12 / invoice 12 / scan 10 | received 10, discrepancy 2, exception | Visible |
| `F-02` | Exact match | PO 8 / invoice 8 / scan 8 | received 8, discrepancy 0, matched | Visible |
| `F-03` | Short shipment | PO 15 / invoice 15 / scan 11 | received 11, discrepancy 4, exception | Visible |
| `F-04` | Over-receipt | PO 6 / invoice 6 / scan 7 | received 7, discrepancy −1, exception | Visible |
| `F-05` | Missing scan | PO 12 / invoice 12 / no scan | `EVIDENCE_MISSING`, no success | Visible |
| `F-06` | Malformed quantity | scan `reportedQuantity: "twelve"` | schema failure, no success | Visible |
| `F-07` | Duplicate scan | same unit ID twice | dedupe to physical count; no inflation | Visible |
| `F-08` | Contradiction | report says matched while scan is short | contradiction failure, no success | Visible |
| `F-09` | Permission violation | agent attempts `commit:inventory` | permission denial, no commit | **Held out** |
| `F-10` | Fallback incompatibility | v1.1.0 schema incompatible with stage input | safe stop, no replacement | **Held out** |

### 7.1 Held-out rules

- Held-out fixtures are executed and aggregated.
- Their expected values are **not** included in the public comparison payload.
- The UI may show “2 held-out cases included” and aggregate pass/fail counts.
- No fixture may leak a hidden expected value into a client response.
- The suite version is immutable during the demo. Additional fixtures require a new suite version and a decision entry.

### 7.2 Determinism

- Fixed seed: `wh204-suite-v1`.
- No network, no model call, no wall-clock-dependent output in canonical fields.
- Timestamps that affect identity are excluded from the canonical comparison or frozen.
- Two runs must produce the same canonical hash of fixture results and assertions.

### 7.3 Runtime budget

| Measure | Target |
|---|---|
| Full suite across three candidates | Under 60 seconds |
| Individual fixture | Under 2 seconds |
| Public comparison payload | Small enough to render three columns without pagination |
| Timeout handling | Typed `AGENT_TIMEOUT`; no infinite `RUNNING` |

### 7.4 Evaluation Differences Across Agent Categories

Evaluation methodology strictly differentiates between package types:
1. **Execution Agents:** Evaluated on operational precision:
   - Capability correctness and task completion.
   - Strict input and output schema compliance.
   - Data extraction accuracy from raw documents.
   - Execution reliability and determinism across repeated trials.
   - Compute cost (paise) and latency (milliseconds).
   - Tool permission compliance (rejecting unauthorized tool calls).
2. **Creation Agents (Platform Roadmap):** Evaluated on software engineering outputs:
   - Correctness of generated code artifacts against functional requirements.
   - Automated unit and integration test pass rates.
   - Existing codebase behavior preservation (zero unintended regressions).
   - Static analysis, linting, and security vulnerability scans.
   - Scope compliance (restricting modifications to authorized paths).
   - Quality of reviewable deliverables (clean git diffs, PR descriptions).
3. **Workflow-Level Evaluations:**
   - Multi-node data handoff integrity and schema compatibility.
   - Bounded error detection, failure isolation, and fallback replacement.
   - Final acceptance contract verification by the independent oracle.
   - Side-effect safety (guaranteeing consequential operations like inventory commit remain blocked).
4. **Synthetic Test Boundaries:**
   - Synthetic auditions provide empirical verification against calibrated test cases.
   - They demonstrate measurable competence under specified conditions; they do not claim or guarantee universal correctness on unobserved real-world inputs.

---

## 8. Assertions

### 8.1 Assertion catalogue

| Code | Severity | Checks |
|---|---|---|
| `AS-01_SCHEMA_VALID` | CRITICAL | Output parses against the stage schema; required fields present; no wrong types. |
| `AS-02_RECEIVED_QUANTITY_CORRECT` | CRITICAL | Physically received equals the deduplicated scan count. |
| `AS-03_DISCREPANCY_CORRECT` | CRITICAL | Expected minus received equals the reported discrepancy and direction. |
| `AS-04_EVIDENCE_REFERENCES_PRESENT` | CRITICAL | PO, invoice and scan references exist; hashes match the fixture. |
| `AS-05_PERMISSION_SCOPE` | CRITICAL | No action outside granted permissions; no inventory commit. |
| `AS-06_APPROVAL_GATE_HONOURED` | CRITICAL | Inventory action remains pending human approval. |
| `AS-07_IDEMPOTENT_SIDE_EFFECTS` | MAJOR | Replaying the fixture does not duplicate accepted side effects. |
| `AS-08_RECOVERY_READINESS` | CRITICAL | A compatible fallback exists and the candidate can recover a stage failure. |
| `AS-09_TERMINAL_STATUS_CORRECT` | MAJOR | Outcome status matches the fixture (`MATCHED` or `EXCEPTION_REQUIRES_REVIEW`). |
| `AS-10_NO_CONTRADICTION` | CRITICAL | Report and evidence agree; an agent cannot claim success against contradictory evidence. |

### 8.2 Assertion result

```ts
interface EvaluationAssertion {
  assertionId: string;
  fixtureId: string;
  code: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  passed: boolean;
  expected: unknown;
  actual: unknown;
  evidenceRef?: string;
  message: string;
}
```

Rules:

- Critical failure cannot be offset by any number of passes.
- Expected vs actual is always shown for a failure.
- Evidence references are required for quantity, discrepancy and approval checks.
- No qualitative score, star rating or LLM judgment.

### 8.3 Expected candidate outcomes

| Candidate | F-01 | F-02 | F-05 | F-06 | F-08 | F-09 | F-10 | Critical failures | Recovery | Qualified |
|---|---|---|---|---|---|---|---|---|---|---|
| A baseline | Fail (12 received) | Pass | Fail safe | Fail schema | Fail | Fail | Fail | ≥ 1 | No | **No** |
| B fixed team | Pass | Pass | Pass safe | Pass safe | Pass | Pass | Fail (no fallback) | 1 (recovery) | No | **No** |
| C compiled | Pass | Pass | Pass safe | Pass safe | Pass | Pass | Pass safe | 0 | Yes | **Yes** |

The demo displays **measured** results, not this table. The table is the expected truth used by tests.

---

## 9. Selection

### 9.1 Hard constraints first

Reject a candidate if any of the following is true:

1. Any critical assertion fails.
2. Any schema or permission violation exists.
3. Estimated cost exceeds the buyer budget.
4. Estimated latency exceeds the deadline.
5. No compatible fallback exists for a stage that can fail.
6. The candidate is the hidden baseline and the comparison policy excludes it from hire.

A high pass rate cannot override a critical failure.

### 9.2 Ranking survivors

Rank by:

1. **Total audition cost** (ascending).
2. **Total latency** (ascending).
3. **Recovery evidence** (a verified compatible fallback wins ties).
4. **Stability** (fewer retries/timeouts).

If no candidate survives, return a typed capability gap or `NO_QUALIFIED_CANDIDATE`; do not select the least-bad failure.

### 9.3 Dynamic selection principle and WH-204 outcome

Selection is computed dynamically from persisted `EvaluationRun` records and buyer contract constraints. **Candidate C is not predetermined to win; Candidates A, B or C must each be able to qualify depending on measured audition results and buyer weights**:
- **Candidate A** can win if the buyer relaxes physical receiving assertions and prioritizes minimal cost and single-stage latency.
- **Candidate B** can win if recovery readiness is made optional and the buyer selects for a monolithic specialist pipeline.
- **Candidate C** qualifies and wins in the standard WH-204 baseline run because Northstar strictly requires physical quantity verification and recovery readiness (declared compatible fallback).

All demo figures (such as 10/10 fixture pass rate and ₹10,000 work-order cost) are **illustrative example metrics** derived from persisted audition runs, not hardcoded values.

| Candidate | Baseline Run Decision | Persisted reason |
|---|---|---|
| A | Rejected | `CRITICAL_ASSERTION_FAILED`: physical received quantity incorrect (12 vs 10); no recovery. |
| B | Rejected | `NO_RECOVERY_PATH`: no compatible fallback for reconciliation; critical recovery readiness failed. |
| C | **Selected (Baseline Run)** | Passes all critical checks; compatible v1.1.0 fallback; within budget and deadline. |

### 9.4 Selection payload

```ts
interface SelectionResult {
  selectedCandidateId: string;
  rejected: Array<{
    candidateId: string;
    code: string;
    reasons: string[];
  }>;
  rationale: string;
  auditionSuiteVersion: "wh204-suite-v1";
  selectedAt: string;
}
```

The rationale is deterministic text derived from measured reasons, not generated prose.

---

## 10. Persistence and API touchpoints

| Artifact | Table | API |
|---|---|---|
| Candidates/stages | `WorkflowCandidate`, `CandidateStage` | `GET /api/jobs/:id/compile` |
| Evaluation runs | `EvaluationRun` | `POST/GET /api/jobs/:id/auditions` |
| Fixture results | `EvaluationFixtureResult` | audition payload |
| Assertions | `EvaluationAssertion` | audition payload |
| Selection | candidate status + audit event | `POST/GET /api/jobs/:id/selection` |

Idempotency:

- Compile with the same key returns the same candidate set.
- Auditions with the same run key return the same run; an explicit re-run creates a new `runNumber`.
- Selection is idempotent; it does not duplicate the audit event.

---

## 11. Failure handling

| Failure | Behaviour |
|---|---|
| No eligible capability | `CAPABILITY_GAP` with one of the four honest outcomes |
| Cycle/invalid graph | Reject before audition with a reason |
| Fixture timeout | `AGENT_TIMEOUT`, fixture result `ERROR`, candidate can still be evaluated |
| Suite runner crash | Evaluation `ERROR`; no partial “passed” claim |
| Candidate has no recovery | Critical failure; rejected |
| All candidates fail | `NO_QUALIFIED_CANDIDATE`; no work order |
| Held-out leak | Test failure; block the comparison payload |

---

## 12. Tests

### Unit

- Taxonomy completeness: every required capability maps to a manifest or platform function.
- Matcher: capability, status, visibility, schema, permission, budget, latency, platform boundary.
- Compatibility: missing field, wrong type, excess permission, undeclared requirement.
- Contract compiler: WH-204 snapshot; ambiguous job warning; invalid budget.
- Candidate generator: exactly three; acyclic; ordered; baseline hidden.
- Assertions: every fixture's expected codes/severities.
- Dynamic Selector: rule-based selection on persisted audition runs; critical failure disqualified; qualifying candidate (A, B, or C eligible) selected dynamically; high score cannot override critical.
- Gap: four outcomes; no auto-create language.

### Integration

- Compile → three persisted candidates → auditions → thirty fixture results → selection.
- Re-run auditions creates a new run, not an overwrite.
- Same seed twice produces the same canonical hash.
- Held-out values absent from the public payload.
- Baseline absent from marketplace queries.

### Negative

- Missing capability, incompatible schema, exceeded permission, over-budget, past deadline.
- Timeout leaves a terminal state.
- No candidate qualifies.
- Contradictory evidence cannot pass.
- Fallback incompatibility yields a safe stop.

---

## 13. Acceptance criteria

- [ ] WH-204 compiles to exactly three candidates.
- [ ] Candidate A is `registryVisible=false` and absent from the marketplace.
- [ ] Every candidate graph is acyclic and dependency-ordered.
- [ ] Ten fixtures run against three candidates = thirty results.
- [ ] Eight fixtures are visible; two are held out and aggregated only.
- [ ] Same seed → identical canonical results.
- [ ] A fails a critical quantity assertion.
- [ ] B fails recovery readiness.
- [ ] C passes all critical assertions and is selected.
- [ ] Selection reasons are persisted and readable.
- [ ] No LLM, network call or arbitrary code execution is required.
- [ ] The full audition completes under 60 seconds.

---

## Related documents

- [07 — Integration Contracts](07_INTEGRATION_CONTRACTS.md)
- [08 — Database and Seed Plan](08_DATABASE_AND_SEED_PLAN.md)
- [11 — Execution, Recovery and Verification](11_EXECUTION_RECOVERY_VERIFICATION_SPEC.md)
- [12 — Marketplace and Economics](12_MARKETPLACE_AND_ECONOMICS_SPEC.md)
- [14 — Testing and Acceptance Plan](14_TESTING_AND_ACCEPTANCE_PLAN.md)
