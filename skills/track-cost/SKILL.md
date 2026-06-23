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

Render the SpecGantry header (same as main dashboard):
```
SpecGantry v4  |  [project.name or "New Project"]
Spec [███░░] [n]/[total]  ·  Build [██░░░] [n]/[total]
──────────────────────────────────────────────────────────
```

Read `specs/project-state.yaml` to compute: Spec = count of `spec_done:true` stories, Build = count of `built:true` stories, total = total stories.

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` then show the action bar and return.

Parse each line as a JSON object.

**Total tokens** for any entry = `input_tokens + output_tokens + cache_creation_tokens + cache_read_tokens` (all four fields — cache tokens cost real money and must not be omitted from totals).

---

## Cost view

Group entries by `release`, then within each release group by `phase`. Render one section per release, phases as rows within each section, subtotal per release, grand total at the bottom.

```
Cost by Release & Phase

Release 1.0.0                Tokens        Cost
────────────────────────────────────────────────
  ideation                   42,340       $0.52
  investigation               8,420       $0.12
  story_spec                 90,160       $3.76
  development                69,760       $2.07
  deployment                  1,560       $0.18
  reverse_engineer               —           —
────────────────────────────────────────────────
  Subtotal                  212,240       $6.65

Release 1.1.0                Tokens        Cost
────────────────────────────────────────────────
  ideation                       —           —
  investigation               3,210       $0.05
  story_spec                 18,440       $0.55
  development                21,270       $0.64
  deployment                     —           —
  reverse_engineer               —           —
────────────────────────────────────────────────
  Subtotal                   42,920       $1.24

════════════════════════════════════════════════
  Total                     255,160       $7.89
```

Rules:
- Releases sorted ascending; entries with `release: null` or `release: "unknown"` grouped under `unknown`, sorted last
- All six phases shown in every release section in pipeline order (ideation, investigation, story_spec, development, deployment, reverse_engineer) — show `—` in both columns if no entries for that phase in that release
- Multiple entries for the same release+phase are summed before display
- Subtotal row per release section, grand Total row at bottom with `════` separator
- No menu bar, no navigation — render and stop

---

## Pricing warning

If any entry has `pricing_source: fallback` or `pricing_source: stale`, append after the table:
```
  Pricing note: some entries used outdated or fallback rates — figures may be approximate.
  Update rates-cache.json in the SpecGantry plugin repo to refresh pricing.
```

After rendering, output:
```
  Run /spec-gantry to return to the dashboard.
```
