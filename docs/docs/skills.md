---
layout: docs
title: Skills & Agents
description: The two skills that power SpecGantry v7 — what they do, all 12 agents, the v7 dashboard, and every workflow covered.
permalink: /docs/skills/
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# SpecGantry Skills Guide

SpecGantry has two skills. `/spec-gantry` is the one you use every day — it handles everything. `/track-cost` is your developer intelligence dashboard.

---

## Skills Overview

| Skill | Command | Purpose |
|---|---|---|
| **spec-gantry** | `/spec-gantry` | Your single entry point — dashboard, pipeline, new projects, changes, everything |
| **track-cost** | `/track-cost` | Cost and iteration insights by Challenge/Write/Judge, by capability, by phase, and by release |

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines exactly where you are, and tells you what to do next.

---

### The Dashboard

**State 1 — No capabilities in pipeline** (ideation in progress, or no project):

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

**State 2 — Capability pipeline active:**

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
──────────────────────────────────────────────────────────────────────
  Type a capability ID to manage it   [$] Cost & insights
  [1] Build next — [002]: Job…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────────
Enter capability ID or action:  >
```
</div>

**What the in-progress labels mean:**

The Spec and Build columns show exactly where in the CWJ loop a capability is:

| Label | Meaning |
|---|---|
| `🔄 challenge` | Challenge agent running |
| `🔄 write` | Write agent writing capability-spec.md |
| `🔄 judge` | Judge agent checking readiness |
| `🔄 plan` | Code plan agent planning build approach |
| `🔄 build` | Build agent implementing |
| `🔄 challenge·2` | Code challenge agent on iteration 2 — a repair loop is running |

**Pipeline stage icons:**

| Icon | Meaning |
|---|---|
| `✅` | CLEAR — judge confirmed next phase not blocked |
| `🔄 [label]` | Active — shows which CWJ step and iteration |
| `🔴` | Blocked by a dependency |
| `⏳` | Ready — not blocked, not yet started |
| `○` | Not yet reached |
| `~` | Built but no spec written (reverse-engineered capability) |

`✅` in v7 means the judge confirmed the next phase would not be blocked — not just that a format checklist passed. Spec ✅ means a machine-challenged spec that the user approved. Build ✅ means code where the user-proxy challenge agent confirmed a user can accomplish what was promised.

---

### What /spec-gantry Handles

**Starting a new project** — name and vision, then the ideation CWJ loop begins. An adversarial challenger fires blocking questions; you answer all of them per round; the judge evaluates readiness.

**Analysing an existing codebase** — source files detected without a project → scan and generate north-star.md, architecture, capability list, intent files, and anchor tags.

**Full capability lifecycle** — ideation → spec (with adversarial challenge) → code (with user-proxy challenge) → deploy. Phase gates enforced automatically.

**Bug fixes and new work** — `[N] New work` at any point. The investigate agent classifies the problem and routes to the right repair phase.

---

### Action Bar Commands

| Command | What it does |
|---|---|
| `[1]`–`[n]` contextual | Pipeline action for your current state |
| `[>]` Run to next pause | Enable auto-continue — pipeline runs until a genuine decision point |
| `[N]` New work | Describe a bug, improvement, new capability, or change |
| `[$]` Cost & insights | Opens the developer intelligence dashboard |
| `[A]` Architecture | Display architecture.md in full |
| `[S]` North star | Display north-star.md in full |
| `[?]` Help | Docs link and quick-bar expansion |
| `[X]` Exit | Return to normal Claude Code |

---

### The 12 Agents

SpecGantry v7 uses 12 agents — three per CWJ phase plus three supporting agents:

**Ideation phase**

| Agent | Role | Model |
|---|---|---|
| `ideation-challenge-agent` | Adversarial challenger — reads vision + prior answers, fires blocking questions specific to this project | Haiku |
| `ideation-judge-agent` | Unblock checker — "could a developer start writing specs without inventing answers?" | Haiku |
| `ideation-write-agent` | Consolidation — runs once on CLEAR; writes north-star.md, architecture.md, intent.md per capability | Sonnet |

**Spec phase**

| Agent | Role | Model |
|---|---|---|
| `spec-challenge-agent` | Developer-proxy challenger — reads north star + intent, asks what a developer would be blocked on building | Haiku |
| `spec-write-agent` | Writes capability-spec.md resolving the challenge list; extends north-star.md if new requirements surface | Sonnet |
| `spec-judge-agent` | Unblock checker — "could a developer build this without inventing any answer?" | Haiku |

**Code phase**

| Agent | Role | Model |
|---|---|---|
| `code-plan-agent` | Plans build approach (iteration 1) or repair strategy (iteration 2+); classifies failures as code/spec/design | Sonnet |
| `code-build-agent` | Builds the full capability end-to-end; writes build-report.yaml with source_root and language | Sonnet |
| `code-challenge-agent` | User-proxy challenger — reads north star + intent + source files; traces user flow; classifies each gap as code or spec | Haiku |

**Supporting agents**

| Agent | Role | Model |
|---|---|---|
| `investigate-subagent` | Classifies problems as CODE_BUG / SPEC_GAP / REQUIREMENT_DRIFT / NEW_CAPABILITY before routing | Haiku |
| `deployment-subagent` | North-star alignment check, then Dockerfiles, docker-compose, deploy.sh | Sonnet |
| `reverse-engineer-subagent` | Synthesises north-star.md, architecture, capability list, and stubs from existing code | Haiku |

Haiku for challenge, judge, investigation, and reverse-engineering — bounded, deterministic tasks where reasoning overhead doesn't earn its cost. Sonnet for write, build, plan, and deployment — tasks that require synthesising complex context into artifacts or code.

---

### Quality Review

The code CWJ loop runs automatically after every build. On iteration 1, the plan agent produces a build approach before any code is written — async patterns, state management, and experience requirements are decided upfront.

The transition note tells you how it went:

```
✓ Build complete · CAP-001  ·  quality: pass (1 cycle)
✓ Build complete · CAP-002  ·  quality: pass (2 cycles — loading state added to save action)
✓ Build complete · CAP-003  ·  quality: capped (3 cycles, empty state gap remains)
```

**Config** (in `project-state.yaml`):
```yaml
cwj_loop:
  max_iterations:
    ideation: 5
    spec: 3
    code: 3
```

---

## /track-cost {#track-cost}

**See what your AI development is costing — and where the cycles went.**

```
/track-cost
```

Cost data is captured automatically after every agent run and stored in `specs/cost-log.ndjson`, committed to git.

---

### The Cost Dashboard

**Default view — Cost by Phase and Capability:**

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

### Developer Intelligence

Type `[I]` for insights — iteration counts, challenge density, outlier breakdown, and cost efficiency:

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
    Cycle 2 challenge: "User sees no progress during file upload — static screen"
    Cycle 3 challenge: "Error shows raw exception, not which field failed validation"
    Exit: achieved after cycle 3

Cost efficiency
  Avg cost per spec cycle:  $0.18
  Avg cost per code cycle:  $1.05
  Most expensive capability: CAP-002 ($4.40 — 52% of total build cost)

  [C] Show cost table   Run /spec-gantry to return.
```
</div>

**What the Challenge/Write/Judge columns tell you:**

- **Challenge** — the cost of adversarial questioning. Low individual cost; a high challenge cost relative to write signals the capability was genuinely complex or poorly understood going in.
- **Write** — the cost of producing artifacts and code. Dominates total spend.
- **Judge** — the cost of the unblock check. Consistent across capabilities; a high judge cost relative to challenge signals the judge is rejecting more than the challenger predicted.

---

### How Cost Tracking Works

- The `SubagentStop` hook fires automatically when each agent completes
- Token counts are read directly from the agent's transcript — exact API values, not estimates
- All 12 v7 agents are mapped: challenge/write/judge per phase into separate cost entries
- One entry appended to `specs/cost-log.ndjson` per agent run — never overwritten
- Iteration counts and exit status per capability read from `project-state.yaml` for the insights view

---

## Common Workflows

### Starting a New Project

```
/spec-gantry → [1] Start new project
            → Enter name and vision
            → Ideation CWJ loop (adversarial challenge rounds + judge)
            → north-star.md + architecture.md + intent.md written on CLEAR
            → Commit specs/ to git
            → Spec CWJ loop per capability (autonomous — you approve once)
            → Code CWJ loop per capability (fully automated)
```

### Handling a Production Bug

```
/spec-gantry → [N] New work → describe bug
            → Investigate agent classifies: CODE_BUG / SPEC_GAP / REQUIREMENT_DRIFT
            → Routes to the right repair phase automatically
            → [1] Deploy release (patch version bump)
```

### Using Auto-Continue

```
/spec-gantry → [>] Run to next pause
            → Pipeline runs: spec all capabilities → build all capabilities
            → Pauses only at spec approval, spec gaps, arch gaps, loop caps
            → Re-render dashboard on resume
```

### Reviewing Project Costs

```
/track-cost             → cost by Challenge/Write/Judge, by capability
  → [T]                 → same view in tokens
  → [I]                 → iteration summary, challenge density, outliers
  → [C]                 → back to cost table
  → Run /spec-gantry    → return to dashboard
```

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, state flags, agent ownership, and extension points.</span>
    </div>
  </a>
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Common questions on installation, the CWJ loop, costs, and troubleshooting.</span>
    </div>
  </a>
</div>
