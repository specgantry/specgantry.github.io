---
name: track-cost
description: Reads specs/cost-log.ndjson and displays a full cost breakdown by phase, feature, and total. Uses real token counts captured automatically after each agent session.
allowed-tools: Read
---

# Track Cost

Render **UI_HEADER** (defined in spec-gantry/SKILL.md).

Read `specs/cost-log.ndjson`. If absent or empty: show "No cost data recorded yet." then render **QUICKBAR**.

Parse each line as a JSON object (one entry per line).

Otherwise render two tables:

**By Phase**
```
Phase           Sessions   Tokens       Cost
──────────────────────────────────────────────
ideation             1      4,404      $0.47
architecture         1      8,201      $0.82
feature_spec         3     14,209      $1.43
development          2     31,445      $3.14
test                 2      6,112      $0.31
deployment           1      3,890      $0.39
orchestration        8     12,340      $1.23
──────────────────────────────────────────────
Total               18     80,601      $7.79
```

**By Feature**
```
Feature          Phase          Model         Tokens       Cost
────────────────────────────────────────────────────────────────
FEATURE-001      feature_spec   sonnet-4-6    4,896      $0.49
FEATURE-001      development    sonnet-4-6   18,201      $1.82
FEATURE-001      test           haiku-4-5     3,112      $0.16
────────────────────────────────────────────────────────────────
FEATURE-001 total                            26,209      $2.47
```

Group entries by feature, sorted by feature ID. Shorten model names (strip `claude-` prefix). Sum tokens and costs per group and overall.

Render **QUICKBAR** (defined in spec-gantry/SKILL.md).
