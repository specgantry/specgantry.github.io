---
name: track-cost
description: Aggregates token usage from all project phases and features, calculates and displays total and per-feature costs using current pricing rates.
allowed-tools: Read, Bash, Grep, Glob
---

# Track Cost

You are the **track-cost** skill. Your job is to read token usage from all project and feature state files, apply current pricing rates, and display a comprehensive cost breakdown.

---

## Step 1: Verify pricing data exists

Read `config/pricing-history.yaml`. 

If the file doesn't exist or is unreadable:
```
✗ Pricing history not found at config/pricing-history.yaml

  This file is required to calculate costs. Ensure it exists and run /update-pricing
  to fetch current rates if needed.
```

Stop here.

Extract the **most recent entry** from the `history` array by looking at the last entry (array index -1). This is the current pricing.

Store the effective date and all model rates locally:
```
{
  effective: "YYYY-MM-DD",
  models: {
    "haiku":  { input: X.XX, output: X.XX },
    "sonnet": { input: X.XX, output: X.XX },
    "opus":   { input: X.XX, output: X.XX }
  }
}
```

---

## Step 2: Aggregate token usage

### Project-level usage

Read `specs/project-state.yaml` if it exists.

Extract `token_usage` array (may be empty). For each entry, extract:
- `phase` (e.g. "ideation", "architecture", "deployment")
- `agent` (e.g. "ideation-agent")
- `model` (model family name, e.g. "sonnet", "haiku", "opus")
- `date`
- `input_tokens`
- `output_tokens`

### Feature-level usage

Use bash glob to find all feature state files:
```bash
find specs/features -name state.yaml -type f
```

This includes both `FEATURE-*` and `BUGFIX-*` directories. For each file found, extract the `token_usage` array using the same fields as above. Track whether the path contains `BUGFIX-` so you can separate them in the report.

### Aggregate into a single list

Combine all entries (project + all features) into one list, preserving the original phase, agent, and feature context.

If the combined list is empty:

Check whether `specs/project-state.yaml → project.reverse_engineered` is `true`.

If `reverse_engineered: true`:
```
📊 Cost Tracking Report
─────────────────────────────────────────────────────────────────

Pricing effective: [date from Step 1]

  No token usage recorded yet.

  This project was reverse-engineered from an existing codebase. Token usage
  will be recorded starting with your next development phase — ideation amendment,
  architecture amendment, feature spec, or development work.

  Run /spec-gantry to continue.
```

Otherwise:
```
📊 Cost Tracking Report
─────────────────────────────────────────────────────────────────

Pricing effective: [date from Step 1]

  No token usage logged yet. Cost tracking begins once agents complete their work.

  Revisit this after completing ideation, architecture, or feature development phases.

  Run /spec-gantry to continue.
```

Return to `/spec-gantry` to show the menu again.

---

## Step 3: Calculate costs

For each token usage entry:

1. Look up the model in the pricing rates from Step 1
2. If the model is not found in the pricing data, log a warning and skip that entry (do not crash)
3. Calculate cost:
   ```
   input_cost = (input_tokens / 1_000_000) * input_per_1m
   output_cost = (output_tokens / 1_000_000) * output_per_1m
   total_cost = input_cost + output_cost
   ```
4. Round each cost to 6 decimal places (USD)

---

## Step 4: Render the cost report

Display the report as follows:

### Header

```
📊 Cost Tracking Report
─────────────────────────────────────────────────────────────────
```

### Pricing info

```
Pricing effective: [date from Step 1]
⚠ Token counts are character-based estimates (chars ÷ 4) — actual API spend may differ.
```

### Project-level costs (if any)

```
🏢 Project-Level Costs

Phase        Agent               Model                Input    Output   Total
──────────────────────────────────────────────────────────────────────────────
[phase]      [agent]             [model]              ~$[i]    ~$[o]    ~$[t]
[phase]      [agent]             [model]              ~$[i]    ~$[o]    ~$[t]
...
                                                              Subtotal: ~$[sum]
```

### Per-feature costs (if any)

For each feature in `specs/project-state.yaml → backlog`:
1. Read `specs/features/[id]/state.yaml`
2. Extract `token_usage` (if any)
3. Calculate subtotal for that feature

Display as:

```
🎯 Per-Feature Costs

[FEATURE-001]: [title]
  Phase        Agent               Model                Input    Output   Total
  ──────────────────────────────────────────────────────────────────────────────
  [phase]      [agent]             [model]              ~$[i]    ~$[o]    ~$[t]
  ...
                                                                Subtotal: ~$[sum]

[FEATURE-002]: [title]
  ...
```

### Bug fix costs (if any)

For any `BUGFIX-*` directories found under `specs/features/` that have token usage, display them in a separate section:

```
🐛 Bug Fix Costs

[BUGFIX-001]: [title]
  Phase        Agent               Model                Input    Output   Total
  ──────────────────────────────────────────────────────────────────────────────
  [phase]      [agent]             [model]              ~$[i]    ~$[o]    ~$[t]
  ...
                                                                Subtotal: ~$[sum]
```

Include BUGFIX subtotals in the overall project total.

### Total project cost

At the very end:

```
──────────────────────────────────────────────────────────────────
💰 Estimated Total Project Cost (all phases, all features): ~$[total]
──────────────────────────────────────────────────────────────────
```

---

## Step 5: Return to menu

After displaying the report:

```
Run /spec-gantry to return to the dashboard.
```

---

## Invariants

- **Never crash on missing files.** If a feature state file doesn't exist or is malformed, skip it and continue.
- **Never hardcode pricing rates.** Always read from `config/pricing-history.yaml`.
- **Always use the most recent effective date** from the pricing history, even if it's in the past. This ensures all projects use the same rates for a given point in time.
- **Always preserve feature and phase context** in the cost report so the user can trace costs back to specific work.
- **Token counts are estimates** (character-based, chars ÷ 4). Always display with `~` prefix. Never present them as exact API billing figures.
