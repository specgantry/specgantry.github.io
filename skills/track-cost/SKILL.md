---
name: track-cost
description: Reads specs/cost-log.ndjson and displays cost breakdowns by phase, component, release, and model.
allowed-tools: Read
---

# Track Cost

Render the SpecGantry header (same as main dashboard):
```
SpecGantry v[version]  |  [project.name or "New Project"]
[████░░░░░░]  [n]/[total] components deployed
──────────────────────────────────────────────────────────
```

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` then show the menu bar and prompt.

Parse each line as a JSON object. The active view is determined by the user's last input — default is Summary.

---

## Menu bar

Always rendered at the bottom of every view, after the table:

```
──────────────────────────────────────────────────────────
  `[1]` By component  `[2]` By release    `[3]` By model
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
component_spec     14,209      $1.43
development        37,557      $3.45
integration_test    3,890      $0.39
deployment          2,340      $0.23
────────────────────────────────────
Total              62,400      $5.97
```

Show phases in pipeline order. Omit phases with zero entries.

---

## View: By Component — input `1`

One row per component ID. Aggregate all entries for that component across all phases and models.
Entries with `component: null` (ideation, integration test, deployment) are excluded — they belong to the project, not a component.

```
Cost by Component  |  release [current release]

Component        Tokens       Cost
───────────────────────────────────
COMP-001         26,209      $2.47
COMP-002         18,441      $1.84
COMP-003          9,112      $0.46
───────────────────────────────────
Total            53,762      $4.77
```

Sort by component ID ascending.

---

## View: By Release — input `2`

One row per release. Aggregate all entries for that release across all phases and components.

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

One row per model. Aggregate all entries for that model across all phases and components.
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
