---
name: track-cost
description: Reads specs/cost-log.ndjson and displays cost breakdowns by phase, feature, release, and model.
allowed-tools: Read
---

# Track Cost

Render the SpecGantry header (same as main dashboard):
```
SpecGantry v[version]  |  [project.name or "New Project"]
[████░░░░░░]  [n]/[total] features deployed
──────────────────────────────────────────────────────────
```

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` then show the menu bar and prompt.

Parse each line as a JSON object. The active view is determined by the user's last input — default is Summary.

---

## Menu bar

Always rendered at the bottom of every view, after the table:

```
──────────────────────────────────────────────────────────
  `[1]` By feature    `[2]` By release    `[3]` By model
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

Phase           Tokens       Cost
────────────────────────────────
ideation         4,404      $0.47
architecture     8,201      $0.82
feature_spec    14,209      $1.43
development     31,445      $3.14
test             6,112      $0.31
deployment       3,890      $0.39
────────────────────────────────
Total           80,601      $7.79
```

Show phases in pipeline order. Omit phases with zero entries.

---

## View: By Feature — input `1`

One row per feature ID. Aggregate all entries for that feature across all phases and models.
Entries with `feature: null` (ideation, architecture) are excluded — they belong to the project, not a feature.

```
Cost by Feature  |  release [current release]

Feature          Tokens       Cost
───────────────────────────────────
FEATURE-001      26,209      $2.47
FEATURE-002      18,441      $1.84
FEATURE-003       9,112      $0.46
───────────────────────────────────
Total            53,762      $4.77
```

Sort by feature ID ascending.

---

## View: By Release — input `2`

One row per release. Aggregate all entries for that release across all phases and features.

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

One row per model. Aggregate all entries for that model across all phases and features.
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
