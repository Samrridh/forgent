# 06 — CSV Companion

**Status:** `ACTIVE`  
**File:** [`TASK_TRACKER.csv`](TASK_TRACKER.csv)  
**Canonical human tracker:** [`TASK_TRACKER.md`](TASK_TRACKER.md)  
**Rows:** 108 data rows + 1 header  
**Encoding:** UTF-8, comma-separated, every field quoted

---

## 1. Purpose

The CSV is the machine-readable companion to the Markdown tracker. It exists for:

- Sorting and filtering without parsing Markdown tables.
- Import into a spreadsheet, issue tracker or planning tool.
- Fast dependency and count validation at checkpoints.
- A stable diff target when statuses change.

It is **not** the canonical source. If the CSV and Markdown disagree, the Markdown wins until the CSV is regenerated. Never maintain two different truths.

---

## 2. Schema

| # | Column | Type | Allowed values / format | Notes |
|---:|---|---|---|---|
| 1 | `ID` | string | `P<0-8>-<A|B|C>-<NNN>` | Stable, unique. Never renumber. |
| 2 | `Phase` | string | `P0`…`P8` | Nine phases. |
| 3 | `Workstream` | string | `A`, `B`, `C` | No `D`. |
| 4 | `Priority` | string | `P0`, `P1`, `P2`, `P3` | Task importance, not phase. |
| 5 | `Kind` | string | `CRITICAL`, `PARALLEL`, `INTEGRATION`, `OPTIONAL`, `DEFERRED` | Execution nature. |
| 6 | `CriticalPath` | string | `YES`, `NO` | `YES` = one of the 46 protected tasks. |
| 7 | `Title` | string | Short imperative phrase | Mirrors the Markdown title. |
| 8 | `Description` | string | Full implementation text | May contain commas; quoted. |
| 9 | `Dependencies` | string | Task IDs separated by `;` or empty | Empty means no task dependency. |
| 10 | `Outputs` | string | Files/routes/artifacts separated by `;` | Must be concrete. |
| 11 | `AcceptanceCriteria` | string | Semicolon-separated checks | Must be verifiable. |
| 12 | `EstimatedMinutes` | integer | `0`–`75` | `0` for deferred rows. |
| 13 | `Parallelizable` | string | `YES`, `NO` | Can proceed against frozen interfaces. |
| 14 | `Status` | string | `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`, `DROPPED` | Baseline: 0 `DONE`, 2 `DROPPED`. |
| 15 | `Blocker` | string | `None` or structured blocker | Never empty for `BLOCKED`. |
| 16 | `Verification` | string | Command/scenario/evidence | How the task is proven. |

### Why every field is quoted

Descriptions contain commas, currency symbols, arrows and semicolons. Quoting every field avoids dialect surprises across Excel, LibreOffice and PowerShell `Import-Csv`.

---

## 3. Baseline counts

| Query | Expected |
|---|---:|
| Data rows | 108 |
| `Status = NOT_STARTED` | 106 |
| `Status = DROPPED` | 2 |
| `Status = DONE` | 0 |
| `CriticalPath = YES` | 46 |
| `Workstream = A` | 40 |
| `Workstream = B` | 34 |
| `Workstream = C` | 34 |
| `Priority = P0` | 78 |
| `Priority = P1` | 23 |
| `Priority = P2` | 5 |
| `Priority = P3` | 2 |
| Sum `EstimatedMinutes` | 3535 |
| Core minutes (non-optional) | 3445 |
| Integration buffer | 875 |

Per phase: P0 9, P1 10, P2 13, P3 15, P4 12, P5 13, P6 13, P7 11, P8 12.

> The two `DROPPED` rows (`P5-A-005`, `P7-B-004`) are included in the 108 and carry `EstimatedMinutes = 0`. Five optional rows (`P3-A-006`, `P5-A-004`, `P6-A-005`, `P7-A-004`, `P8-C-004`) carry 110 minutes total and remain scope-cut candidates.

---

## 4. ID and dependency conventions

- **ID:** `P<phase>-<workstream>-<three digits>`.
- **Dependency separator:** `;` inside the quoted field (for example `P0-B-001;P0-C-001`).
- **No circular dependencies.** Validate before a gate.
- **No dependency on a `DROPPED` task** unless the dependent is also dropped or explicitly re-pointed.
- **No self-dependency.**
- **No dependency on a later phase** without a written exception in the decision log.
- Cross-workstream dependencies are expected; cross-phase dependencies are usually a smell.

---

## 5. Validation

### 5.1 PowerShell quick checks

```powershell
$rows = Import-Csv docs/hackathon/TASK_TRACKER.csv

$rows.Count                                      # 108
($rows | Where-Object Status -eq 'DONE').Count    # 0
($rows | Where-Object Status -eq 'DROPPED').Count # 2
($rows | Where-Object CriticalPath -eq 'YES').Count # 46

$rows | Group-Object Phase | Select-Object Name, Count
$rows | Group-Object Workstream | Select-Object Name, Count
$rows | Group-Object Priority | Select-Object Name, Count
($rows | Measure-Object -Property EstimatedMinutes -Sum).Sum # 3555 (Core: 3445)
```

### 5.2 Structural checks

1. Every `ID` is unique.
2. Every `Phase` is `P0`–`P8`.
3. Every `Workstream` is `A`, `B` or `C`.
4. Every `Status` is in the allowed set.
5. Every `BLOCKED` row has a non-empty, non-`None` blocker.
6. Every dependency resolves to an existing ID.
7. No self-dependency; no cycle.
8. Every `DROPPED` row has `EstimatedMinutes = 0` and a reason in the Markdown register.
9. Phase/workstream counts match the Markdown Summary.
10. Total minutes match 3555 (3445 core).

### 5.3 Filter examples

```powershell
# Current critical path, not done
$rows | Where-Object { $_.CriticalPath -eq 'YES' -and $_.Status -ne 'DONE' } |
  Select-Object ID, Phase, Workstream, Title, Status

# A's P3 workload
$rows | Where-Object { $_.Workstream -eq 'A' -and $_.Phase -eq 'P3' } |
  Select-Object ID, Title, EstimatedMinutes, Kind, Status

# Blockers
$rows | Where-Object Status -eq 'BLOCKED' |
  Select-Object ID, Blocker, Workstream

# Optional scope
$rows | Where-Object Kind -eq 'OPTIONAL' |
  Select-Object ID, Phase, Title, EstimatedMinutes
```

---

## 6. Regeneration

The CSV was generated from the same task data used to write the Markdown. When tasks change:

1. Edit the source data.
2. Regenerate both the Markdown task section and the CSV.
3. Diff the counts and the affected rows.
4. Update the Summary and Phase Board in the Markdown.
5. Commit both files together.

Do not hand-edit only one file. If a hand edit is unavoidable, make the identical change in the other file in the same session and run the validation checks.

### Recommended generation shape

```text
task data (single source)
  ├── render Markdown tables + summary
  └── write CSV with 16 columns, all fields quoted
```

The generator should fail on:

- Duplicate ID.
- Unknown phase/workstream/status.
- Unresolved dependency.
- Negative minutes.
- Missing acceptance or verification text.
- Count mismatch with declared totals.

---

## 7. Status update checklist

When changing a row:

- [ ] Markdown row updated first.
- [ ] CSV row updated/regenerated.
- [ ] Blocker text present if `BLOCKED`.
- [ ] Verification evidence recorded if `DONE`.
- [ ] Summary counts updated.
- [ ] Phase Board updated if a gate task changed.
- [ ] No `DONE` without acceptance evidence.
- [ ] No `DROPPED` without a reason.
- [ ] Both files committed together.

---

## 8. CSV limitations

- It has no rich formatting, links or Mermaid diagrams; use the Markdown for those.
- It cannot enforce dependencies at runtime; validation is a checkpoint activity.
- Spreadsheet applications may reinterpret IDs or currency; import with all columns as text.
- It does not replace the phase gate or the decision log.
- It does not prove implementation; it only records planned and reported state.

---

## Related documents

- [TASK_TRACKER.md](TASK_TRACKER.md)
- [05 — Execution Tracking Guide](05_EXECUTION_TRACKING.md)
- [03 — Phase Breakdown](03_PHASE_BREAKDOWN.md)
- [16 — Decisions and Changelog](16_DECISIONS_AND_CHANGELOG.md)
