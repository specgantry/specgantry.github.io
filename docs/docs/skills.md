---
layout: docs
title: Skills & Agents
description: Two commands that run your entire SDLC — the pipeline dashboard and developer cost intelligence.
permalink: /docs/skills/
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# Skills & Agents

Two commands. `/spec-gantry` runs everything. `/track-cost` shows you what it cost and why.

---

## /spec-gantry {#spec-gantry}

Run this at the start of every session. SpecGantry reads your project state, shows the pipeline dashboard, and routes you to the right action.

```
/spec-gantry
```

What happens depends on what's in the directory:

| Situation | What SpecGantry does |
|---|---|
| Empty directory | Start new project — enter name and vision |
| Source files, no `specs/` | Reverse-engineer: synthesises a north star, architecture, and capability list from your code |
| `specs/` exists | Resume — dashboard shows pipeline state and routes to the next action |

---

### The Dashboard

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v7  |  HireFlow  |  release 1.0.0
Ideation [done]  ·  Spec [███░] 3/4  ·  Build [██░░] 2/4  ·  Deploy [░░░░] –
  ID       Capability                         Spec         Build
  ──────────────────────────────────────────────────────────────────────
  [001]   User authentication                 done         done
  [002]   Job posting                         done         ~ challenge·2
  [003]   Application review                  ~ judge      ready
  [004]   Candidate browse and apply          ready        -

  Release 1.0.0                                            not deployed

  Type a capability ID to manage it   [$] Cost & insights
  [1] Build next — [002]: Job…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work

Enter capability ID or action:  >
```
</div>

**Status icons:**

| Icon | Meaning |
|---|---|
| `done` | CLEAR — judge confirmed next phase not blocked |
| `~ [label]` | Active — shows which CWJ step and iteration |
| `blocked` | Blocked by a dependency |
| `ready` | Ready — not yet started |
| `-` | Not yet reached |

**Key actions:**

| Command | What it does |
|---|---|
| `[>]` Run to next pause | Auto-continue — runs the full pipeline until a genuine decision point |
| `[N]` New work | Describe a bug, improvement, or new capability — routes to the right phase |
| `[$]` Cost & insights | Opens `/track-cost` |
| Capability ID | Jump directly to a specific capability |

---

## /track-cost {#track-cost}

Cost is logged automatically after every agent run. `/track-cost` shows you what each capability cost, how many cycles it took, and which ones ran repair loops.

```
/track-cost
```

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
SpecGantry v7  |  HireFlow  |  release 1.0.0
──────────────────────────────────────────────────────────

Release 1.0.0                          Challenge    Write    Judge    Total
───────────────────────────────────────────────────────────────────────────
Ideation                                  $0.22    $0.81    $0.14    $1.17

[001] User authentication
  Spec                                    $0.09    $0.11    $0.07    $0.27
  Code                                    $0.18    $1.94    $0.12    $2.24

[002] Job posting
  Spec                                    $0.11    $0.14    $0.09    $0.34
  Code                                    $0.31    $3.47    $0.28    $4.06  ◀ outlier

═══════════════════════════════════════════════════════════════════════════
Total                                     $1.02    $6.72    $0.70    $8.44

  [I] Insights   [T] Show tokens   Run /spec-gantry to return.
```
</div>

`◀ outlier` marks any capability where the code phase ran more than one cycle. Type `[I]` for a breakdown of iteration counts, challenge density, and what each repair cycle was fixing.

---

## Common Workflows

**New project:**
```
/spec-gantry → enter name and vision → ideation loop → [>] run to completion
```

**Auto-run the full pipeline:**
```
/spec-gantry → [>] → specs all capabilities, builds all capabilities, pauses at decision points only
```

**Production bug or new work:**
```
/spec-gantry → [N] → describe the problem → investigate classifies → routes to the right phase
```

**Check costs:**
```
/track-cost → [I] insights
```

---

<div class="next-steps-grid">
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Common questions on installation, costs, and troubleshooting.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure and project state.</span>
    </div>
  </a>
</div>
