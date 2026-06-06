---
name: update-pricing
description: Refreshes SpecGantry's local pricing cache by fetching current Anthropic model rates from anthropic.com/pricing. Call this when rates change or when cost entries show pricing_source: fallback.
allowed-tools: mcp__spec-gantry-costs__refresh_pricing
---

# Update Pricing

You are the **update-pricing** skill. Your job is to refresh the local pricing cache used by the cost tracking system.

---

## Step 1: Call the MCP tool

Call `refresh_pricing` with no arguments.

---

## Step 2: Display the result

### On success (`ok: true`)

```
✓ Pricing updated

  Rates as of [fetched_at]:

  Model                          Input / 1M tokens    Output / 1M tokens
  ──────────────────────────────────────────────────────────────────────
  [model]                        $[input_per_1m]      $[output_per_1m]
  [model]                        $[input_per_1m]      $[output_per_1m]
  ...

  Source: [source_url]

  All future cost calculations will use these rates.
  Cost entries already recorded are not retroactively updated.
```

### On failure (`ok: false`)

```
✗ Pricing update failed: [error message]

  The existing cached rates are still in use:

  Last updated: [fetched_at from existing cache, or "unknown — using bundled defaults"]

  Model                          Input / 1M tokens    Output / 1M tokens
  ──────────────────────────────────────────────────────────────────────
  [model]                        $[input_per_1m]      $[output_per_1m]
  ...

  To retry, run /update-pricing again when you have network access.
  To verify current rates manually: https://www.anthropic.com/pricing
```

---

## Invariants

- Never modify any spec files — this skill only interacts with the MCP server
- Always show the full rates table so the user can verify them
- Never claim rates are current if the fetch failed
