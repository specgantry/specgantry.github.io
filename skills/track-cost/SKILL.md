---
name: track-cost
description: >
  Invoke this skill when the user wants to see AI development costs for a SpecGantry project.
  Triggers include: asking about cost, spend, or token usage ("how much have we spent?", "what's this costing?",
  "show me the cost breakdown", "how many tokens have we used?");
  asking for a breakdown by phase, component, release, or model.
  Do NOT invoke for general cost questions unrelated to a SpecGantry project.
allowed-tools: Read
---

# Track Cost

Render the SpecGantry header (same as main dashboard):
```
SpecGantry v3  |  [project.name or "New Project"]
Spec [███░░] [n]/[total]  ·  Build [██░░░] [n]/[total]
──────────────────────────────────────────────────────────
```

Read `specs/project-state.yaml` to compute: Spec = count of `spec_done:true` stories, Build = count of `built:true` stories, total = total stories.

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` then show the menu bar and prompt.

Parse each line as a JSON object. The active view is determined by the user's last input — default is Summary.

---

## Menu bar

Always rendered at the bottom of every view, after the table:

```
──────────────────────────────────────────────────────────
  `[1]` By story   `[2]` By release    `[3]` By model
                                       `[X]` Return
──────────────────────────────────────────────────────────
Enter option:  `>`
```

`[X]` returns to the main SpecGantry dashboard. Any other input re-renders the current view with a one-line error above it.

---

## View: Summary (default)

Aggregate tokens and cost by phase across all entries.

```
Cost Summary  |  release [current release]

Phase              Tokens       Cost
────────────────────────────────────
ideation            4,404      $0.47
story_spec         14,209      $1.43
development        37,557      $3.45
deployment          2,340      $0.23
────────────────────────────────────
Total              58,510      $5.58
```

Show phases in pipeline order. Omit phases with zero entries.

---

## View: By Story — input `1`

One row per story ID. Aggregate all entries for that story across all phases and models.
Entries with `story: null` are project-level phases (ideation, deployment) — include them in this view as "OTHER". Show their costs in the Summary view instead.

```
Cost by Story  |  release [current release]

Story            Tokens       Cost
───────────────────────────────────
STORY-001        26,209      $2.47
STORY-002        18,441      $1.84
STORY-003         9,112      $0.46
OTHER             3,890      $0.39
───────────────────────────────────
Total            57,652      $5.16
```

Sort by story ID ascending with "OTHER" appearing last.

---

## View: By Release — input `2`

One row per release. Aggregate all entries for that release across all phases and stories.

```
Cost by Release

Release      Tokens       Cost
──────────────────────────────
1.0.0        80,601      $7.79
1.1.0        42,340      $4.12
──────────────────────────────
Total       122,941     $11.91
```

Sort by release ascending. No current-release filter — shows full project history.

---

## View: By Model — input `3`

One row per model. Aggregate all entries for that model across all phases and stories.
Strip the `claude-` prefix from model names.

```
Cost by Model  |  release [current release]

Model           Tokens       Cost
──────────────────────────────────
sonnet-4-6      62,301      $6.23
haiku-4-5       18,300      $0.92
──────────────────────────────────
Total           80,601      $7.79
```

Sort by cost descending (most expensive first).

---

## Fallback pricing warning

If any entry has `pricing_source: fallback`, append after the table in any view:
```
⚠ Some entries used fallback rates — figures may be approximate.
  Restart Claude Code to refresh pricing from Anthropic.
```
