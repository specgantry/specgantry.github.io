---
name: track-cost
description: Reads specs/cost-log.json and displays a full cost breakdown by phase, feature, and total. Uses real token counts captured by the MCP server after each agent invocation.
allowed-tools: Read
---

# Track Cost

You are the **track-cost** skill. Your job is to read the cost log and display a comprehensive, easy-to-read cost breakdown for this project.

---

## Step 1: Read the cost log

Read `specs/cost-log.json`.

If the file does not exist or is empty (`[]`):

```
📊 Cost Report
─────────────────────────────────────────────────────────────

  No cost data recorded yet.

  Cost tracking begins automatically once agents complete their work.
  Run /spec-gantry to continue.
```

Return to `/spec-gantry`.

---

## Step 2: Parse and group entries

Parse the JSON array. Each entry has:
- `phase` — e.g. `ideation`, `architecture`, `feature_spec`, `development`, `test`, `deployment`
- `agent` — agent name
- `model` — exact model ID
- `feature` — feature ID (`FEATURE-001`) or `null` for project-level phases
- `date`
- `input_tokens`, `output_tokens`, `cache_creation_tokens`, `cache_read_tokens`
- `input_cost_usd`, `output_cost_usd`, `cache_write_cost_usd`, `cache_read_cost_usd`, `total_cost_usd`
- `pricing_source` — `"live"` or `"fallback"`

Group entries:
- **Project-level**: entries where `feature` is `null`
- **Per feature**: entries where `feature` starts with `FEATURE-`
- **Bug fixes**: entries where `feature` starts with `BUGFIX-`

---

## Step 3: Render the report

### Header

```
📊 Cost Report — [project name from specs/project-state.yaml, or "this project"]
─────────────────────────────────────────────────────────────────────────────────
```

### Project-level costs (if any)

```
🏢 Project

  Phase              Agent                    Model            Input      Output     Cache W    Cache R    Total
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [phase]            [agent]                  [model]          $[i]       $[o]       $[cw]      $[cr]      $[t]
  ...
                                                                                     Subtotal:             $[sum]
```

### Per-feature costs (if any)

For each feature in the backlog order (read from `specs/project-state.yaml → backlog`):

```
🎯 [FEATURE-001]: [title from backlog]

  Phase              Agent                    Model            Input      Output     Cache W    Cache R    Total
  ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  [phase]            [agent]                  [model]          $[i]       $[o]       $[cw]      $[cr]      $[t]
  ...
                                                                                     Subtotal:             $[sum]
```

### Bug fix costs (if any)

```
🐛 Bug Fixes

  [BUGFIX-001]:
    [phase]          [agent]                  [model]          $[i]       $[o]       $[cw]      $[cr]      $[t]
                                                                                     Subtotal:             $[sum]
```

### Grand total

```
─────────────────────────────────────────────────────────────────────────────────
💰 Total tokens:  [sum of all tokens] tokens
               (input: [n] · output: [n] · cache write: [n] · cache read: [n])
💰 Total cost:    $[grand total]
               (input: $[n] · output: $[n] · cache write: $[n] · cache read: $[n])
─────────────────────────────────────────────────────────────────────────────────
```

### Footer

Always show when rates were last fetched. Read `mcp/rates-cache.json` from the plugin directory if accessible, or skip this line if not:

```
Rates last updated: [fetched_at from rates-cache.json, or "unknown"]
```

If any entry has `pricing_source: "fallback"`:
```
⚠ Some entries used fallback pricing rates (live fetch was unavailable).
  Run /update-pricing to refresh rates.
```

---

## Step 4: Return to menu

```
Run /spec-gantry to return to the dashboard.
```
