---
name: update-pricing
description: Refreshes SpecGantry's local pricing cache by fetching current Anthropic model rates. Call this when rates change or when cost entries show pricing_source: fallback.
---

# Update Pricing

Render **UI_HEADER** (defined in spec-gantry/SKILL.md).

Call `mcp__plugin_spec-gantry_spec-gantry-costs__refresh_pricing`.

**If successful:**
```
Pricing updated — [n] models cached  ·  fetched [timestamp]

Model                  Input/MTok   Output/MTok   Cache Write   Cache Read
──────────────────────────────────────────────────────────────────────────
claude-opus-4-8          $5.00        $25.00         $6.25        $0.50
claude-sonnet-4-6        $3.00        $15.00         $3.75        $0.30
claude-haiku-4-5         $1.00         $5.00         $1.25        $0.10
```
Show all models returned.

**If failed:**
```
Pricing fetch failed: [error]
Fallback rates are in use — cost estimates may be approximate.
Retry /update-pricing when network is available.
```

Render **QUICKBAR** (defined in spec-gantry/SKILL.md).
