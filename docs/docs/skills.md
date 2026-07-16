---
layout: docs
title: Skills & Agents
description: The two skills that power SpecGantry v6 — what they do, all 12 agents, the v6 dashboard, and every workflow covered.
permalink: /docs/skills/
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# SpecGantry Skills Guide

SpecGantry has two skills. `/spec-gantry` is the one you use every day — it handles everything. `/track-cost` is your real-time cost dashboard.

---

## Skills Overview

| Skill | Command | Purpose |
|---|---|---|
| **spec-gantry** | `/spec-gantry` | Your single entry point — dashboard, pipeline, new projects, changes, everything |
| **track-cost** | `/track-cost` | Cost breakdown by Plan/Produce/Eval, story, phase, and release |

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines exactly where you are, and tells you what to do next.

---

### The Dashboard

**State 1 — No stories yet** (ideation in progress, or no project):

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v6  |  Recipe Manager
──────────────────────────────────────────────────────────
  Ideation in progress  ·  🔄 produce — Topic 6/9

──────────────────────────────────────────────────────────
  [1] Continue ideation               [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

**State 2 — Story pipeline active:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v6  |  HireFlow  |  release 1.0.0
Ideation ✅  ·  Spec [███░] 3/4  ·  Build [██░░] 2/4  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
  ID      Story                            Spec        Build
  ────────────────────────────────────────────────────────────────
  [001]  User authentication                ✅          ✅
  [002]  Company posts a job                ✅          🔄 eval·2
  [003]  Admin reviews applications         🔄 eval     ⏳
  [004]  Candidate browses and applies      ⏳          ○
  ────────────────────────────────────────────────────────────────
  Release 1.0.0                                        ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a story ID to manage it        [$] Cost
  [1] Build next — [002]: Company…    [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────
Enter story ID or action:  >
```
</div>

**What the in-progress labels mean:**

The Spec and Build columns show exactly where in the PPE loop a story is:

| Label | Meaning |
|---|---|
| `🔄 plan` | Plan agent running |
| `🔄 write` | Spec produce agent writing story-spec.md |
| `🔄 eval` | Eval agent checking north star (iteration 1) |
| `🔄 eval·2` | Eval agent on iteration 2 — a repair loop is running |
| `🔄 build` | Code produce agent building |

**Pipeline stage icons:**

| Icon | Meaning |
|---|---|
| `✅` | ACHIEVED — north star confirmed |
| `🔄 [label]` | Active — shows which PPE step and iteration |
| `🔴` | Blocked by a dependency |
| `⏳` | Ready — not blocked, not yet started |
| `○` | Not yet reached |
| `~` | Built but no spec written (reverse-engineered story) |

`✅` in v6 means the evaluator confirmed the north star — not just that a format checklist passed. Spec ✅ means a machine-validated spec. Build ✅ means code that passed both the quality dimension rubric and the code north star.

---

### What /spec-gantry Handles

**Starting a new project** — name and vision, then quick-start (3 questions, smart defaults) or full ideation (9 topics). For simple projects, quick-start activates automatically.

**Analysing an existing codebase** — source files detected without a project → scan and generate architecture, story backlog, and anchor tags.

**Full story lifecycle** — ideation → spec (with north-star validation) → code (with PPE loop) → deploy. Phase gates enforced automatically.

**Bug fixes and new work** — `[N] New work` at any point. Investigation agent reads the codebase, confirms findings, build agent fixes, full code PPE loop runs.

---

### Action Bar Commands

| Command | What it does |
|---|---|
| `[1]`–`[n]` contextual | Pipeline action for your current state |
| `[>]` Run to next pause | Enable auto-continue — pipeline runs until a genuine decision point |
| `[N]` New work | Describe a bug, improvement, new story, or change |
| `[$]` Cost | Opens the cost dashboard |
| `[?]` Help | `[A]` Architecture · docs link |
| `[X]` Exit | Return to normal Claude Code |

---

### The 12 Agents

SpecGantry v6 uses 12 agents — three per PPE phase plus three supporting agents:

**Ideation phase**

| Agent | Role | Model |
|---|---|---|
| `ideation-plan-agent` | Determines what topics remain to satisfy the ideation north star | Sonnet 5 |
| `ideation-produce-agent` | Asks questions, writes all architecture artifacts | Sonnet 5 |
| `ideation-eval-agent` | Evaluates artifacts against the ideation north star | Sonnet 5 |

**Spec phase**

| Agent | Role | Model |
|---|---|---|
| `spec-plan-agent` | Determines what the spec must capture — thinks like a product head | Sonnet 5 |
| `spec-produce-agent` | Writes `story-spec.md` following the plan | Haiku 4.5 |
| `spec-eval-agent` | Evaluates spec against the spec north star, emits approval summary | Sonnet 5 |

**Code phase**

| Agent | Role | Model |
|---|---|---|
| `code-plan-agent` | Plans the build approach (iteration 1) or repair strategy (iteration 2+) | Sonnet 5 |
| `code-produce-agent` | Builds the full story end-to-end | Sonnet 5 |
| `code-eval-agent` | Evaluates code against quality dimensions + code north star; emits GOAL_GAP when spec was insufficient | Sonnet 5 |

**Supporting agents**

| Agent | Role | Model |
|---|---|---|
| `investigate-subagent` | Read-only codebase search for bug fixes and enhancements | Haiku 4.5 |
| `deployment-subagent` | Generates Dockerfiles, docker-compose, deploy.sh | Sonnet 4.6 |
| `reverse-engineer-subagent` | Synthesises architecture and story backlog from existing code | Haiku 4.5 |

Plan and eval agents use Sonnet 5 — genuine reasoning is required to challenge plan goals and evaluate against north stars. Haiku is only used where the task is bounded and deterministic (spec writing, investigation, reverse engineering).

---

### Quality Review

The code PPE loop runs automatically after every build. On iteration 1, the plan agent produces a build approach before the produce agent writes any code — so async patterns, state management, and experience requirements are decided upfront.

The transition note tells you how it went:

```
✓ Build complete · STORY-001  ·  quality: pass (1 iter)
✓ Build complete · STORY-002  ·  quality: pass (2 iters — loading state added to save action)
✓ Build complete · STORY-003  ·  quality: pass (1 iter after spec update)
  ↑ this story had a GOAL_GAP — spec was updated mid-build
```

**Config** (in `project-state.yaml`):
```yaml
ppe_loop:
  max_iterations:
    ideation: 3
    spec: 2
    code: 3
```

---

## /track-cost {#track-cost}

**See exactly what your AI development is costing — broken down by Plan, Produce, and Eval columns.**

```
/track-cost
```

Cost data is captured automatically after every agent run and stored in `specs/cost-log.ndjson`, committed to git.

---

### The Cost Dashboard

**Default view — Cost by Phase and Story:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
SpecGantry v6  |  HireFlow  |  release 1.0.0
Spec [████] 4/4  ·  Build [████] 4/4
──────────────────────────────────────────────────────────

Release 1.0.0                        Plan     Produce      Eval     Total
───────────────────────────────────────────────────────────────────────────
Ideation                            $0.61      $1.84      $0.43     $2.88
Investigation                          —       $0.08         —      $0.08
Deployment                             —       $0.22         —      $0.22
Reverse engineer                       —          —          —         —

[001] User authentication
  Spec                               $0.22      $0.11      $0.26     $0.59
  Code                               $0.34      $2.41      $0.48     $3.23
  ────────────────────────────────────────────────────────────────────────
  Story total                        $0.56      $2.52      $0.74     $3.82

[002] Company posts a job
  Spec                               $0.18      $0.09      $0.20     $0.47
  Code                               $0.28      $1.87      $0.39     $2.54
  ────────────────────────────────────────────────────────────────────────
  Story total                        $0.46      $1.96      $0.59     $3.01

═══════════════════════════════════════════════════════════════════════════
Total                               $3.15     $12.06      $3.37    $18.58

  [T] Show tokens   Run /spec-gantry to return to the dashboard.
```
</div>

Type `[T]` to switch to token counts. Same layout, numbers in tokens (abbreviated to `12k` format). Type `[C]` to switch back to cost.

**What the Plan/Produce/Eval columns tell you**

The column split exposes where AI spend goes within each story:

- **Plan** — the cost of thinking through what to build (ideation topics, spec criteria, build approach, repair strategy). Low cost, high leverage.
- **Produce** — the cost of actually generating artifacts and code. Dominates total spend.
- **Eval** — the cost of evaluating against the north star. For a 4-story project, Plan + Eval together typically represent 30–35% of total cost — the price of quality assurance that would otherwise surface as post-delivery rework.

**Story total rows** let you see the end-to-end cost of each story immediately — no mental arithmetic needed across Spec and Code rows.

---

### How Cost Tracking Works

- The `SubagentStop` hook fires automatically when each agent completes
- Token counts are read directly from the agent's transcript — exact API values, not estimates
- All 12 v6 agents are mapped: plan/produce/eval per phase into separate cost entries
- One entry appended to `specs/cost-log.ndjson` per agent run — never overwritten
- `claude-sonnet-5` rates included in the rates cache

**Typical cost profile for a 3-story project:**

| Phase group | Relative share |
|---|---|
| Ideation (plan + produce + eval) | 10–15% |
| Spec × N stories (plan + produce + eval) | 10–15% |
| Code × N stories (plan + produce + eval) | 60–70% |
| Supporting (investigate + deploy) | 5–10% |

Code produce still dominates. The plan and eval agents across all phases together add roughly 30–35% overhead compared to a produce-only pipeline — but that overhead front-loads quality checks that would otherwise appear as bugs, rework, and extra sessions.

---

## Common Workflows

### Starting a New Project

```
/spec-gantry → [1] Start new project
            → Enter name and vision
            → Quick-start (3 questions) or [F] full ideation
            → Ideation PPE loop runs (catches gaps automatically)
            → architecture.md + story backlog written
            → Commit specs/ to git
            → Spec PPE loop per story (north-star validated specs)
            → Code PPE loop per story (with GOAL_GAP routing if needed)
```

### Handling a Production Bug

```
/spec-gantry → type story ID  (or [N] New work → describe bug)
            → Investigation agent locates files and root cause
            → Confirms findings with you
            → Code PPE loop: plan → build → evaluate
            → [1] Deploy release (patch version bump)
```

### Using Auto-Continue

```
/spec-gantry → [>] Run to next pause
            → Pipeline runs: ideation → spec (all stories) → code (all stories)
            → Pauses only at genuine decision points
            → Resume summary shows what happened, grouped by Spec and Build
```

### Reviewing Project Costs

```
/track-cost             → cost by Plan/Produce/Eval, by story
  → [T]                 → same view in tokens
  → [C]                 → back to cost
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
      <span>Common questions on installation, the PPE loop, costs, and troubleshooting.</span>
    </div>
  </a>
</div>