---
name: track-cost
description: Reads specs/cost-log.json and displays a full cost breakdown by phase, feature, and total. Uses real token counts captured automatically after each agent session.
allowed-tools: Read
---

# Track Cost

You are the **track-cost** skill. Render the cost breakdown inside the standard SpecGantry UI frame.

---

## Step 1: Read state

Read:
1. `specs/project-state.yaml` — project name, backlog order
2. `specs/cost-log.json` — cost entries
3. `mcp/rates-cache.json` — for rates timestamp (best-effort; skip if unreadable)

Also read `.claude/local-state.yaml` for role (to determine which quick-bar to show).

---

## Step 2: Render the persistent header

```
SpecGantry v1.4.5  |  [Project Name, or "New Project" if none]
Progress  [PROGRESSBAR]  [n] / [total] features complete  ·  Total spend: $[X.XX]
──────────────────────────────────────────────────────────────────────
```

Progress bar: 10 `█`/`░` blocks filled proportionally. Total spend: sum all `total_cost_usd` from cost-log.json.

---

## Step 3: Render the cost breakdown

### If cost-log.json does not exist or is empty

```
Cost Breakdown

  No cost data yet.
  Costs are recorded automatically as each agent session completes.

  Run /spec-gantry to continue.
```

### If cost data exists

Group entries:
- **Project phases:** entries where `feature` is `null`
- **Per feature:** entries grouped by `feature` value, in backlog order from `project-state.yaml`
- **Bug fixes:** entries where `feature` starts with `BUGFIX-`

```
Cost Breakdown

  Project phases
  ──────────────────────────────────────────────────────────────────────
  [phase]       [agent]    [model]     $[output]  $[cache_r]  $[total]
  ...
                                                   Subtotal    $[sum]

  FEATURE-001 · [title]
  ──────────────────────────────────────────────────────────────────────
  [phase]       [agent]    [model]     $[output]  $[cache_r]  $[total]
  ...
                                                   Subtotal    $[sum]

  [repeat for each feature]

  ──────────────────────────────────────────────────────────────────────
  Total  [N] tokens  ·  $[grand total]
         input $[n]  ·  output $[n]  ·  cache write $[n]  ·  cache read $[n]
  ──────────────────────────────────────────────────────────────────────
  Rates as of [fetched_at from rates-cache.json]  ·  /update-pricing to refresh
```

Column formatting:
- Show Output (`output_cost_usd`) and Cache Read (`cache_read_cost_usd`) as the two visible mid-columns — these represent the dominant costs for most runs
- Total (`total_cost_usd`) is always last
- Shorten model names: strip `claude-` prefix → `sonnet-4-6`, `haiku-4-5`, `opus-4-8`
- Shorten agent names: strip `spec-gantry:*:` prefix → bare name e.g. `feature-spec-agent`, `dev-agent`
- Dollar values: 4 decimal places for individual entries, 2 for totals
- If any entry has `pricing_source: "fallback"`, append after the rates line:
  ```
  ⚠  Some entries used fallback rates — run /update-pricing to refresh
  ```

---

## Step 4: Render the quick-bar

For Team Lead / Architect:
```
── [A]rch  [B]acklog  [P]roject  [?]Help  [X]Exit ────────────────────
```

For Developer (or if role unknown):
```
── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

---

## Invariants

- The persistent header always renders first.
- The quick-bar always renders last.
- Never invoke another skill from within track-cost.
- This skill is read-only — it never writes any file.
