---
name: track-cost
description: >
  Invoke this skill when the user wants to see AI development costs for a SpecGantry project.
  Triggers include: asking about cost, spend, or token usage ("how much have we spent?", "what's this costing?",
  "show me the cost breakdown", "how many tokens have we used?");
  asking for a breakdown by phase or release.
  Do NOT invoke for general cost questions unrelated to a SpecGantry project.
allowed-tools: Read
---

# Track Cost

Render the SpecGantry header:
```
SpecGantry v6  |  [project.name or "New Project"]  |  release [project.release]
──────────────────────────────────────────────────────────
Spec [███░] [n]/[total]  ·  Build [██░░] [n]/[total]
──────────────────────────────────────────────────────────
```

Read `specs/project-state.yaml` for: project name, release, story titles, spec/build counts.

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` and return.

Parse each line as JSON. Default view is **cost ($)**. If the user typed `T` to toggle: show **tokens** instead. The toggle persists for this invocation only — re-running the skill always starts in cost view.

**Total tokens** for any entry = `input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens`.

---

## Table structure

The table has four columns: **Plan · Produce · Eval · Total**.

Rows are organised in two sections:

**Section 1 — Project-level phases** (always shown, no story context):
- `Ideation` — sums `ideation_plan`, `ideation_produce`, `ideation_eval` entries into Plan/Produce/Eval columns respectively
- `Investigation` — sums `investigation` entries into Produce column (no plan or eval agent)
- `Deployment` — sums `deployment` entries into Produce column
- `Reverse engineer` — sums `reverse_engineer` entries into Produce column

**Section 2 — Per-story rows** (one row per story in `project-state.yaml → stories`, sorted by ID):
- Story header row: `[ID] Story title`
- Sub-row `  Spec` — sums `spec_plan`, `spec_produce`, `spec_eval` entries for this story into Plan/Produce/Eval columns
- Sub-row `  Code` — sums `code_plan`, `code_produce`, `code_eval` entries for this story into Plan/Produce/Eval columns
- Thin rule + `  Story total` — sums Spec + Code across all columns; always shown even if all cells are `—`

Story total separator uses a short thin rule (32 dashes) indented to sub-row level, not the full section separator width.

For entries that have no plan or eval agent (investigation, deployment, reverse_engineer): show `—` in the Plan and Eval columns.

---

## Cost view (default)

```
SpecGantry v6  |  Scholarship Portal  |  release 1.0.0
──────────────────────────────────────────────────────────
Spec [███░] 3/4  ·  Build [██░░] 2/4
──────────────────────────────────────────────────────────

Release 1.0.0                        Plan     Produce      Eval     Total
───────────────────────────────────────────────────────────────────────────
Ideation                            $0.37      $0.72      $0.19     $1.28
Investigation                          —       $0.05         —      $0.05
Deployment                             —       $0.18         —      $0.18
Reverse engineer                       —          —          —         —

[001] Student completes profile
  Spec                               $0.18      $0.09      $0.21     $0.48
  Code                               $0.25      $2.07      $0.37     $2.69
  ────────────────────────────────────────────────────────────────────────
  Story total                        $0.43      $2.16      $0.58     $3.17

[002] Student submits application
  Spec                               $0.20      $0.11      $0.19     $0.50
  Code                               $0.31      $1.84      $0.42     $2.57
  ────────────────────────────────────────────────────────────────────────
  Story total                        $0.51      $1.95      $0.61     $3.07

[003] Admin reviews applications
  Spec                               $0.19      $0.10      $0.22     $0.51
  Code                                  —          —          —         —
  ────────────────────────────────────────────────────────────────────────
  Story total                        $0.19      $0.10      $0.22     $0.51

[004] Admin manages settings
  Spec                                  —          —          —         —
  Code                                  —          —          —         —

═══════════════════════════════════════════════════════════════════════════
Total                               $1.50      $5.06      $1.60     $8.16

  [T] Show tokens   Run /spec-gantry to return to the dashboard.
```

---

## Tokens view (after pressing T)

Same layout, same rows — swap every `$X.XX` value for the token count. Format tokens as `123,456` with comma separators. Abbreviate to `123k` when ≥ 10,000 for readability.

```
Release 1.0.0                        Plan     Produce      Eval      Total
───────────────────────────────────────────────────────────────────────────
Ideation                             12k        24k         6k        42k
Investigation                          —         3k          —         3k
Deployment                             —         2k          —         2k
Reverse engineer                       —          —          —          —

[001] Student completes profile
  Spec                                 6k         9k         7k        22k
  Code                                 8k        70k        12k        90k
  ────────────────────────────────────────────────────────────────────────
  Story total                         14k        79k        19k       112k

[002] Student submits application
  Spec                                 7k        11k         6k        24k
  Code                                10k        61k        14k        85k
  ────────────────────────────────────────────────────────────────────────
  Story total                         17k        72k        20k       109k
...
═══════════════════════════════════════════════════════════════════════════
Total                                43k       180k        45k       268k

  [C] Show cost   Run /spec-gantry to return to the dashboard.
```

---

## Rendering rules

- Group all entries by `release` first. Render one complete table per release (project-level rows + all story rows), with its own `═══` total row. Releases sorted ascending. Entries with `release: null` or `release: "unknown"` grouped under `unknown`, sorted last.
- Multiple entries for the same release + story + phase-group (e.g. two `code_eval` entries for STORY-001 in release 1.0.0 — from two repair iterations) are **summed** before display.
- Show `—` in both the value and column when no entries exist for that cell.
- Story rows appear for every story in `project-state.yaml`, even if all cells are `—` (shows the user what has not been built yet).
- Spec and Code sub-rows always appear under every story — never collapse them.
- `Story total` row always appears after `Code`, separated by a thin rule (────, 72 chars, indented). Sum Spec + Code across all four columns. When Code is all `—`, Story total equals Spec row values.
- Column widths are fixed: label column 32 chars, each of Plan/Produce/Eval/Total 9 chars right-aligned.
- No navigation menu — the `[T]` / `[C]` toggle and the `/spec-gantry` return note are the only interactive elements.

---

## Pricing warning

If any entry has `pricing_source: fallback` or `pricing_source: stale`, append after the final total row:
```
  ⚠ Pricing note: some entries used outdated or fallback rates — figures may be approximate.
    Update rates-cache.json in the SpecGantry plugin repo to refresh pricing.
```
