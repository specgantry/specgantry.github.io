---
name: track-cost
description: >
  Invoke this skill when the user wants to see AI development costs for a SpecGantry project.
  Triggers include: asking about cost, spend, or token usage ("how much have we spent?", "what's this costing?",
  "show me the cost breakdown", "how many tokens have we used?");
  asking for a breakdown by phase, component, release, or model.
  Do NOT invoke for general cost questions unrelated to a SpecGantry project.
allowed-tools: Read
---

# Track Cost

Render the SpecGantry header (same as main dashboard):
```
SpecGantry v3  |  [project.name or "New Project"]
Spec [███░░] [n]/[total]  ·  Build [██░░░] [n]/[total]
──────────────────────────────────────────────────────────
```

Read `specs/project-state.yaml` to compute: Spec = count of `spec_done:true` stories, Build = count of `built:true` stories, total = total stories.

Read `specs/cost-log.ndjson`. If absent or empty: show `No cost data recorded yet.` then show the menu bar and prompt.

Parse each line as a JSON object. The active view is determined by the user's last input — default is Summary.

---

## Menu bar

Always rendered at the bottom of every view, after the table:

```
──────────────────────────────────────────────────────────
  `[1]` Matrix        `[2]` By release    `[3]` By model
                                          `[X]` Return
──────────────────────────────────────────────────────────
Enter option:  `>`
```

`[X]` returns to the main SpecGantry dashboard. Any other input re-renders the current view with a one-line error above it.

⚠️ No additional instruction text should appear below this prompt. The menu is self-documenting.

---

## View: Cost Matrix (default) — input `1`

Stories as rows, phases as columns. Two tables: cost in dollars (first), then tokens (second).

Project-level phases (ideation, deployment) with `story: null` appear in the "PROJECT" row.

**Table 1: Cost by Story × Phase (USD)**

```
Cost Matrix  |  release 1.0.0

Story        ideation    story_spec   development  deployment     Total
─────────────────────────────────────────────────────────────────────
PROJECT      $0.52           —             —         $0.18       $0.70
STORY-001      —          $1.34         $0.64         —          $1.98
STORY-002      —          $0.98         $0.51         —          $1.49
STORY-003      —          $0.76         $0.38         —          $1.14
STORY-004      —          $0.68         $0.54         —          $1.22
─────────────────────────────────────────────────────────────────────
**Total**    **$0.52**     **$3.76**     **$2.07**    **$0.18**   **$6.53**
```

**Table 2: Tokens by Story × Phase**

```
Story        ideation    story_spec   development  deployment     Total
─────────────────────────────────────────────────────────────────────
PROJECT      42,340           —            —         1,560       43,900
STORY-001       —         31,080        20,840         —         51,920
STORY-002       —         23,540        17,120         —         40,660
STORY-003       —         18,720        13,260         —         31,980
STORY-004       —         16,820        18,540         —         35,360
─────────────────────────────────────────────────────────────────────
**Total**   **42,340**   **90,160**   **69,760**   **1,560**    **203,820**
```

- Rows: Stories (sorted by ID ascending, PROJECT first), then bold Total row
- Columns: Phases in pipeline order, then bold Total column
- Cell format: numbers only (or `—` if no entries)
- Show PROJECT row only if it has non-zero cost

After both tables, render a story legend:

```
Stories:
  STORY-001  User registers and logs in
  STORY-002  User manages their profile
  STORY-003  User submits application
  STORY-004  Admin reviews submissions
```

Read story titles from `specs/stories/STORY-NNN/story-spec.md` (title field in YAML frontmatter) for the actual project.

---

## View: By Release — input `2`

One row per release. Aggregate all entries for that release across all phases and stories.

```
Cost by Release

Release      Tokens       Cost
──────────────────────────
1.0.0        80,601      $7.79
1.1.0        42,340      $4.12
──────────────────────────
**Total**   **122,941**  **$11.91**
```

Sort by release ascending. Bold total row at bottom.

---

## View: By Release — input `2`

One row per release. Aggregate all entries for that release across all phases and stories.

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

One row per model. Aggregate all entries for that model across all phases and stories.
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
