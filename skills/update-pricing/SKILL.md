---
name: update-pricing
description: Refreshes SpecGantry's local pricing cache by fetching current Anthropic model rates. Call this when rates change or when cost entries show pricing_source: fallback.
allowed-tools: mcp__spec-gantry-costs__refresh_pricing, Read
---

# Update Pricing

You are the **update-pricing** skill. Refresh the local pricing cache and display the result inside the standard SpecGantry UI frame.

---

## Step 1: Read state for header

Read `specs/project-state.yaml` (project name, backlog) and `specs/cost-log.json` (total spend) for the header. Best-effort — show zeroes if absent.

Read `.claude/local-state.yaml` for role (quick-bar selection).

---

## Step 2: Render the persistent header

```
SpecGantry v1.4.5  |  [Project Name, or "New Project" if none]
Progress  [PROGRESSBAR]  [n] / [total] features complete  ·  Total spend: $[X.XX]
──────────────────────────────────────────────────────────────────────
```

---

## Step 3: Call the MCP tool

Call `refresh_pricing` with no arguments.

---

## Step 4: Render the result

### On success (`ok: true`)

```
Pricing

  ✓ Rates updated as of [fetched_at]

  Model                     Input / 1M    Output / 1M
  ──────────────────────────────────────────────────
  [model]                   $[input]      $[output]
  ...

  Source: [source_url]

  Future cost calculations will use these rates.
  Entries already recorded are not retroactively updated.
```

### On failure (`ok: false`)

```
Pricing

  ✗ Update failed: [error message]

  Existing cached rates are still in use:

  Last updated: [fetched_at from existing cache, or "unknown — using bundled defaults"]

  Model                     Input / 1M    Output / 1M
  ──────────────────────────────────────────────────
  [model]                   $[input]      $[output]
  ...

  Re-run /update-pricing when network access is available.
  Verify current rates at: https://platform.claude.com/docs/en/about-claude/pricing
```

---

## Step 5: Render the quick-bar

For Team Lead / Architect:
```
── [A]rch  [B]acklog  [C]ost  [P]roject  [?]Help  [X]Exit ────────────
```

For Developer (or if role unknown):
```
── [A]rch  [C]ost  [?]Help  [X]Exit ──────────────────────────────────
```

---

## Invariants

- The persistent header always renders first.
- The quick-bar always renders last.
- Never modify any spec files — this skill only calls the MCP tool.
- Always show the full rates table so the user can verify them.
- Never claim rates are current if the fetch failed.
