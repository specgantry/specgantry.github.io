---
layout: docs
title: Skills & Agents
description: The two skills that power SpecGantry — the dashboard, all 12 agents, and every workflow covered.
permalink: /docs/skills/
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# Skills & Agents

SpecGantry has two skills. `/spec-gantry` is the one you use every day. `/track-cost` is your developer intelligence dashboard.

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.** Run this at the start of every session.

```
/spec-gantry
```

SpecGantry reads your project state, shows the pipeline dashboard, and routes you to the right action automatically.

---

### The Dashboard

**During ideation:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v7  |  Recipe Manager
──────────────────────────────────────────────────────────
  Ideation in progress  ·  🔄 challenge — round 2

──────────────────────────────────────────────────────────
  [1] Continue ideation               [$] Cost & insights
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

**During spec and build:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v7  |  HireFlow  |  release 1.0.0
Ideation ✅  ·  Spec [███░] 3/4  ·  Build [██░░] 2/4  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
  ID       Capability                         Spec         Build
  ──────────────────────────────────────────────────────────────────────
  [001]   User authentication                 ✅           ✅
  [002]   Job posting                         ✅           🔄 challenge·2
  [003]   Application review                  🔄 judge     ⏳
  [004]   Candidate browse and apply          ⏳           ○
  ──────────────────────────────────────────────────────────────────────
  Release 1.0.0                                            ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a capability ID to manage it   [$] Cost & insights
  [1] Build next — [002]: Job…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────
Enter capability ID or action:  >
```
</div>

**Status icons:**

| Icon | Meaning |
|---|---|
| `✅` | CLEAR — judge confirmed next phase not blocked |
| `🔄 [label]` | Active — shows which CWJ step and iteration |
| `🔴` | Blocked by a dependency |
| `⏳` | Ready — not yet started |
| `○` | Not yet reached |

---

### Action Bar

| Command | What it does |
|---|---|
| `[>]` Run to next pause | Auto-continue — runs until a genuine decision point |
| `[N]` New work | Describe a bug, improvement, or new capability |
| `[$]` Cost & insights | Opens `/track-cost` |
| `[A]` Architecture | Display `architecture.md` |
| `[S]` North star | Display `north-star.md` |
| `[X]` Exit | Return to normal Claude Code |

---

### The 12 Agents

Three agents per CWJ phase, plus three supporting agents.

**Ideation**

| Agent | Model | Role |
|---|---|---|
| `ideation-challenge` | Haiku | Fires up to 7 blocking questions per round. Specific to this project — not a checklist. |
| `ideation-judge` | Haiku | "Could a developer start writing specs without inventing answers?" CLEAR or BLOCKED. |
| `ideation-write` | Sonnet | Runs once on CLEAR. Writes north-star.md, architecture.md, and intent.md per capability. |

**Spec**

| Agent | Model | Role |
|---|---|---|
| `spec-challenge` | Haiku | Developer-proxy. Asks what a developer would be blocked on building from the intent file. |
| `spec-write` | Sonnet | Writes capability-spec.md resolving every challenge. Extends north-star.md if new requirements surface. |
| `spec-judge` | Haiku | "Could a developer build this without inventing any answer?" Emits the approval summary. |

**Code**

| Agent | Model | Role |
|---|---|---|
| `code-plan` | Sonnet | Iteration 1: plans build approach. Iteration 2+: classifies failures and plans targeted repair. |
| `code-build` | Sonnet | Builds end-to-end. Writes anchor comments and `build-report.yaml`. |
| `code-challenge` | Haiku | User-proxy. Reads source files (not the spec). Classifies each gap as code or spec. |

**Supporting**

| Agent | Model | Role |
|---|---|---|
| `investigate` | Haiku | Classifies problems as CODE_BUG / SPEC_GAP / REQUIREMENT_DRIFT / NEW_CAPABILITY before routing. |
| `deployment` | Sonnet | North-star alignment check, then Dockerfiles, docker-compose, .env.example, deploy.sh. |
| `reverse-engineer` | Haiku | Synthesises north-star, architecture, capability stubs, and anchor tags from existing code. |

---

## /track-cost {#track-cost}

```
/track-cost
```

Cost data is logged automatically after every agent run to `specs/cost-log.ndjson`.

---

### Cost Dashboard

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
SpecGantry v7  |  HireFlow  |  release 1.0.0
Spec [████] 4/4  ·  Build [████] 4/4
──────────────────────────────────────────────────────────

Release 1.0.0                          Challenge    Write    Judge    Total
───────────────────────────────────────────────────────────────────────────
Ideation                                  $0.22    $0.81    $0.14    $1.17
Investigation                                —     $0.04       —     $0.04
Deployment                                   —     $0.21       —     $0.21

[001] User authentication
  Spec                                    $0.09    $0.11    $0.07    $0.27
  Code                                    $0.18    $1.94    $0.12    $2.24
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.27    $2.05    $0.19    $2.51

[002] Job posting
  Spec                                    $0.11    $0.14    $0.09    $0.34
  Code                                    $0.31    $3.47    $0.28    $4.06  ◀ outlier
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.42    $3.61    $0.37    $4.40

═══════════════════════════════════════════════════════════════════════════
Total                                     $1.02    $6.72    $0.70    $8.44

  [T] Show tokens   [I] Insights   Run /spec-gantry to return.
```
</div>

`◀ outlier` marks any capability where the code phase ran more than one cycle.

---

### Insights View

Type `[I]` for iteration counts, challenge density, and outlier breakdown:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost insights</span></div>

```
── Insights ────────────────────────────────────────────────────────────────

Iteration summary
  CAP-001  Spec: 1 cycle · Code: 1 cycle
  CAP-002  Spec: 2 cycles · Code: 3 cycles  ◀ most cycles

Challenge density (avg questions per cycle)
  Ideation   4.2 questions/round
  CAP-001    Spec: 3 · Code: 2
  CAP-002    Spec: 5 · Code: 6  ◀ most challenged

Outliers
  CAP-002: Job posting — code phase ran 3 cycles ($4.06 total)
    Cycle 2 challenge: "User sees no progress during file upload"
    Cycle 3 challenge: "Error shows raw exception, not which field failed"
    Exit: achieved after cycle 3

Cost efficiency
  Avg cost per spec cycle:  $0.18
  Avg cost per code cycle:  $1.05
  Most expensive capability: CAP-002 ($4.40 — 52% of total build cost)

  [C] Show cost table   Run /spec-gantry to return.
```
</div>

**What the columns mean:**
- **Challenge** — cost of adversarial questioning. Low; high challenge cost relative to write signals genuine complexity.
- **Write** — cost of producing artifacts and code. Dominates total spend.
- **Judge** — cost of the unblock check. Consistent; high judge cost relative to challenge signals repeated rejection.

---

## Common Workflows

**New project:**
```
/spec-gantry → enter name and vision → ideation loop → commit specs/ → [>] run to completion
```

**Production bug:**
```
/spec-gantry → [N] New work → describe bug → investigate classifies → routes to right phase → deploy patch
```

**Auto-continue:**
```
/spec-gantry → [>] → pipeline runs: spec all → build all → pauses at decision points only
```

**Review costs:**
```
/track-cost → [I] insights → [C] back to cost table
```

---

<div class="next-steps-grid">
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, state flags, and extension points.</span>
    </div>
  </a>
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Common questions on installation, costs, and troubleshooting.</span>
    </div>
  </a>
</div>
