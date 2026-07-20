---
name: track-cost
description: >
  Invoke this skill when the user wants to see AI development costs or insights for a SpecGantry project.
  Triggers: asking about cost, spend, token usage, iterations, which capability was most expensive,
  how many challenge cycles ran, where the AI spent the most effort.
  Do NOT invoke for general cost questions unrelated to a SpecGantry project.
allowed-tools: Read
---

# Cost & Insights

Render the SpecGantry header:
```
SpecGantry v7  |  [project.name]  |  release [project.release]
──────────────────────────────────────────────────────────
Spec [███░] [n]/[total]  ·  Build [██░░] [n]/[total]
──────────────────────────────────────────────────────────
```

Read `specs/project-state.yaml` for: project name, release, capability titles, spec/build counts, `cwj_iterations` and `exit_reason` per capability.

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` and return.

Parse each line as JSON. Default view is **cost ($)**. User may type `[T]` to toggle to **tokens**.

**Total tokens** for any entry = `input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens`.

---

## Section 1 — Cost table

Same structure as before, with capabilities replacing stories.

**Project-level phases** (no capability context):
- `Ideation` — sums `ideation_challenge`, `ideation_judge`, `ideation_write` into Challenge/Write/Judge columns
- `Investigation` — sums `investigation` into Write column (no challenge or judge agent)
- `Deployment` — sums `deployment` into Write column
- `Reverse engineer` — sums `reverse_engineer` into Write column

Column headers: **Challenge · Write · Judge · Total** (replaces Plan/Produce/Eval).

**Per-capability rows** (one row per capability in project-state, sorted by ID):
- Capability header row: `[ID] Capability title`
- Sub-row `  Spec` — sums `spec_challenge`, `spec_write`, `spec_judge`
- Sub-row `  Code` — sums `code_plan`, `code_build`, `code_challenge`
- Thin rule + `  Capability total`

```
Release 1.0.0                          Challenge    Write    Judge    Total
───────────────────────────────────────────────────────────────────────────
Ideation                                  $0.22    $0.81    $0.14    $1.17
Investigation                                —     $0.04       —     $0.04
Deployment                                   —     $0.21       —     $0.21

[001] Menu item management
  Spec                                    $0.09    $0.11    $0.07    $0.27
  Code                                    $0.18    $1.94    $0.12    $2.24
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.27    $2.05    $0.19    $2.51

[002] Bulk import
  Spec                                    $0.11    $0.14    $0.09    $0.34
  Code                                    $0.31    $3.47    $0.28    $4.06  ◀ outlier
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.42    $3.61    $0.37    $4.40

═══════════════════════════════════════════════════════════════════════════
Total                                     $1.02    $6.72    $0.70    $8.44

  [T] Show tokens   [I] Insights   Run /spec-gantry to return.
```

Mark capabilities with `code cwj_iterations > 1` with `◀ outlier` at the end of their Code row.

---

## Section 2 — Insights (shown when user types `[I]`, or always if cost data exists)

```
── Insights ────────────────────────────────────────────────────────────────

Iteration summary
  CAP-001  Spec: 1 cycle · Code: 1 cycle
  CAP-002  Spec: 2 cycles · Code: 3 cycles  ◀ most cycles

Challenge density (avg questions per cycle)
  Ideation   4.2 questions/round
  CAP-001    Spec: 3 · Code: 2
  CAP-002    Spec: 5 · Code: 6  ◀ most challenged

Outliers
  CAP-002: Bulk import — code phase ran 3 cycles ($4.06 total)
    Cycle 2 challenge: "User sees no progress during a 50k-row import — static screen for 30+ seconds"
    Cycle 3 challenge: "Import error shows raw exception, not which rows failed"
    Exit: achieved after cycle 3

Cost efficiency
  Avg cost per spec cycle:  $0.18
  Avg cost per code cycle:  $1.05
  Most expensive capability: CAP-002 ($4.40 — 52% of total build cost)
  Cheapest capability: CAP-001 ($2.51)

  [C] Show cost table   Run /spec-gantry to return.
```

**Insights data sources:**
- Iteration counts: `project-state.yaml → capabilities.[ID].cwj_iterations`
- Challenge density: count challenges from `.cwj-loop.yaml` entries in `cost-log.ndjson` (phase `spec_challenge` / `code_challenge`) — total entries ÷ cycles
- Outlier challenge text: read from `cost-log.ndjson` entries tagged with challenge phase — extract the challenge description if stored, or note "challenge details not recorded"
- Cost efficiency: computed from `cost-log.ndjson` sums ÷ iteration counts

---

## Release comparison (when changelog.md exists)

If `specs/changelog.md` exists and `cost-log.ndjson` has entries for multiple releases, show a release comparison after the main table:

```
Release comparison
  Release 1.0.0   $8.44   4 capabilities   8 total cycles
  Release 1.1.0   $3.21   1 capability added   2 cycles
```

Group by `release` field in `cost-log.ndjson` entries. Entries with `release: null` grouped under `unknown`, sorted last.

---

## Rendering rules

- Multiple entries for the same release + capability + phase-group are **summed** before display.
- Show `—` when no entries exist for that cell.
- Capability rows appear for every capability in project-state, even if all cells are `—`.
- Spec and Code sub-rows always appear under every capability.
- Column widths: label column 34 chars, each of Challenge/Write/Judge/Total 9 chars right-aligned.
- `◀ outlier` marker appended to any Code row where `cwj_iterations.code > 1`.

---

## Pricing warning

If any entry has `pricing_source: fallback` or `pricing_source: stale`, append after the final total:
```
  ⚠ Pricing note: some entries used outdated or fallback rates — figures may be approximate.
    Update rates-cache.json in the SpecGantry plugin repo to refresh pricing.
```
