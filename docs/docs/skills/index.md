---
layout: docs
title: Skills Guide
description: The two skills that power SpecGantry — what they do and when to use them.
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
|-------|---------|---------|
| **spec-gantry** | `/spec-gantry` | Your single entry point — dashboard, pipeline, new projects, changes, everything |
| **track-cost** | `/track-cost` | Cost breakdown by phase, story, release, and model |

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines exactly where you are in the pipeline, and tells you what to do next. Whether you're starting a brand new project, picking up a story, or handling a production bug — `/spec-gantry` detects the situation and guides you from there.

You never need to remember separate commands for different workflows. One command, every time.

---

### The Dashboard

Two states depending on where you are in the pipeline.

**State 1 — No stories yet** (ideation in progress, or no project):

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v5  |  My App  |  release 1.0.0
──────────────────────────────────────────────────────────
  Ideation in progress — Beat 1: 3/4 topics answered.
──────────────────────────────────────────────────────────
  [1] Continue ideation               [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

**State 2 — Story pipeline active:**

The pipeline table and story picker are unified. Every story is visible, its status is shown across all pipeline stages, and you can act on any story directly from the same screen — no navigation required.

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v5  |  Acme Platform  |  release 1.0.0
Spec [███░░] 3/4  ·  Build [██░░░] 2/4  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────
  ID      Story                          Spec   Build
  ──────────────────────────────────────────────────────
  [001]  User registers and logs in       ✅    ✅
  [002]  User manages their profile       ✅    🔄
  [003]  User submits application         🔄    ○
  [004]  Admin reviews submissions        ⏳    ○
  ──────────────────────────────────────────────────────
  Release 1.0.0                                ○ not deployed
──────────────────────────────────────────────────────────
  Type a story ID to manage it        [$] Cost
  [1] Continue spec – STORY-003       [?] Help
  [N] New work                        [X] Exit
──────────────────────────────────────────────────────────
Enter story ID or action:  `>`
```
</div>

Type a story number directly (e.g. `004`) to pick it up. Blocked stories show their dependency inline. The left column shows the most useful contextual actions for your current state.

For stories that are already built (✅ spec · ✅ built), typing the story ID opens an inline prompt rather than routing to the normal pipeline:

```
STORY-001: Bookmark CRUD API  ·  ✅ spec · ✅ built
──────────────────────────────────────────────────────────
What would you like to change?  >
```

Describe the change — a bug, an enhancement, or a new feature — and SpecGantry routes to the investigation agent pre-scoped to that story, then proceeds normally.

**Pipeline stage icons:**

| Icon | Meaning |
|------|---------|
| `✅` | Complete |
| `🔄` | Active / in progress |
| `🔴` | Blocked by a dependency |
| `⏳` | Not started, ready to pick up |
| `○` | Not yet reached |
| `~` | Built but no spec written (reverse-engineered story) |

Stories marked `~` are not pushed through the automatic spec pipeline — type their ID directly to write a spec for them at any time. They are immediately available for `[N] New work` (bug fixes and enhancements).

---

### What /spec-gantry Handles

**Starting a new project** — When no project exists, `/spec-gantry` walks you through setup (name and vision — no version number needed, every project starts at `1.0.0`) and moves into ideation. For simple projects (no auth, no AI, single actor, ≤3 capabilities), quick-start mode activates automatically — asking only three questions and setting smart defaults for the rest. Full ideation is always available via `[F]`.

**Analysing an existing codebase** — If source files are found without a SpecGantry project, `/spec-gantry` offers to scan your code and generate an architecture, story backlog, and guardrails. You review and confirm before anything is written.

**Full story lifecycle** — From picking up a story through spec, build, and deployment — every phase transition is handled through `/spec-gantry`. Phase gates are enforced automatically.
**Bug fixes and new work** — Use `[N] New work` (visible once ideation is complete) to describe a bug, improvement, new story, or architectural change at any point in the pipeline — mid-flight or post-deployment. SpecGantry analyses the backlog and story specs to determine what's affected — you just describe the work.

---

### Action Bar Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[1]`–`[n]` contextual | You | The pipeline action for your current state (e.g. spec next story, build next story, deploy) |
| `[N]` New work | You | Describe a bug, improvement, new story, or change. Always visible once ideation is complete. |
| `[$]` Cost | You | Opens the cost dashboard — breakdown by phase, story, release, and model |
| `[?]` Help | You | Quick reference and secondary commands: `[A]` Architecture · docs link |
| `[X]` Exit | You | Return to normal Claude Code |

---

### Classifying New Work

When you use `[N] New work` or when all stories are deployed, SpecGantry asks what you want to work on next. It then:

1. **Classifies** the type of work
2. **Maps it to stories** — reads all story specs to determine which existing stories are affected, or what new story to create. You don't need to specify this.
3. **Confirms** the mapping with you before touching any state
4. **Routes** — resets phase flags and re-enters the pipeline

| Classification | When it applies |
|---|---|
| `bug_fix` | Something broken — investigation agent locates the exact files and root cause, confirms with you, then build agent fixes it directly. Spec not touched. |
| `enhancement` | Existing story does more or works differently — investigation agent locates the change point, orchestrator writes to `gap.md`, build agent implements. Spec merges at deploy. |
| `new_story` | A net-new capability — ideation agent runs in amendment mode to assign a story ID and update the backlog |
| `project_change` | Cross-cutting: infrastructure, data model, multi-story scope — ideation agent runs in amendment mode first |

SpecGantry always confirms its classification and story mapping before proceeding.

**Investigation agent:** for bug fixes and enhancements, SpecGantry first invokes a read-only investigative agent that searches the codebase — using `@story`, `@entry`, `@contract`, and `@gap` anchor tags written by the build agent — to locate the exact files, entry points, and root cause. It presents findings and confirms with you before any changes are made. The investigation replaces spec-reading as the source of truth for what to change.

---

### Quality Review

Every story passes through a quality review loop during the build phase — automatically, without any extra commands.

**After the build**, the code is evaluated across several dimensions: whether every acceptance criterion is satisfied, whether contract shapes are correct, whether required inputs are validated, whether the storage choice suits the use case, whether the UI follows the project's visual system, whether scope is clean, and whether patterns are consistent with prior stories. Any dimension that doesn't pass produces a targeted fix and the build is updated. This loop runs until all dimensions pass or the maximum iterations are reached.

The result is recorded in the story's `build-report.yaml`. The transition note tells you how it went:

```
✓ Build complete · STORY-001: User registration  ·  quality: pass (2 iters)
✓ Build complete · STORY-002: Profile page       ·  quality: capped (3 iters, 2 dims remain)
```

`quality: pass` — all dimensions cleared. `quality: capped` — max iterations reached; the report documents what remains for you to decide on. `quality: partial` — same dimensions failed on two consecutive iterations, usually indicating a spec ambiguity worth clarifying.

**Config** (in `project-state.yaml`):
```yaml
quality_loop:
  max_iterations: 3   # rebuild cycles before capping (default: 3)
```

---

### Session Resume

All progress is saved after every question and every section. Every `/spec-gantry` invocation picks up exactly where you left off — no manual state management, no lost progress.

---

## /track-cost {#track-cost}

**See exactly what your AI development is costing — in real time, broken down every way that matters.**

```
/track-cost
```

SpecGantry captures token usage automatically after every agent run. No manual steps, no estimates — real API counts. `/track-cost` renders that data as a navigable cost dashboard with four views.

Cost data lives in `specs/cost-log.ndjson`, committed to git alongside your specs. Full visibility into AI spend over the full project lifetime.

---

### The Cost Dashboard

**Default view — Cost Summary by Phase:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
SpecGantry v5  |  Acme Platform
Spec [███░░] 3/4  ·  Build [██░░░] 2/4  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────

Cost Summary  |  release 1.0.0

Phase               Tokens       Cost
──────────────────────────────────────
ideation            12,605      $1.26
story_spec          14,209      $1.43
development         31,445      $3.14
deployment           3,890      $0.39
──────────────────────────────────────
Total               62,149      $6.22

──────────────────────────────────────────────────────────
  [1] By story      [2] By release    [3] By model
                                      [X] Return
──────────────────────────────────────────────────────────
Enter option:  `>`
```
</div>

The menu bar persists across all views — switch between breakdowns without going back to the summary first.

---

**[1] By Story** — total spend per story across all phases:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
Cost by Story  |  release 1.0.0

Story            Tokens       Cost
───────────────────────────────────
STORY-001        14,320      $1.34
STORY-002        18,441      $1.74
STORY-003         9,112      $0.86
STORY-004         9,112      $0.86
───────────────────────────────────
Total            51,985      $4.80
```
</div>

Project-level phases (ideation, deployment) are excluded here — they belong to the project, not individual stories.

---

**[2] By Release** — cumulative spend per deployed release:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
Cost by Release

Release      Tokens       Cost
──────────────────────────────
1.0.0        80,601      $7.79
1.1.0        42,340      $4.12
──────────────────────────────
Total       122,941     $11.91
```
</div>

Shows full project history across all releases — useful for understanding how development costs evolve over time.

---

**[3] By Model** — spend per model, most expensive first:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
Cost by Model  |  release 1.0.0

Model           Tokens       Cost
──────────────────────────────────
sonnet-4-6      62,301      $6.23
haiku-4-5       18,300      $0.92
──────────────────────────────────
Total           80,601      $7.79
```
</div>

Useful for understanding whether your spend profile aligns with what you'd expect — Sonnet handles reasoning-heavy phases (ideation, development, deployment); Haiku handles bounded read-and-score phases (story spec, investigation, evaluate, plan).

**Typical cost profile per phase:**

| Phase | Model | Relative cost |
|-------|-------|--------------|
| Ideation | Sonnet 4.6 | Low–medium — conversational, but architecture reasoning |
| Investigation | Haiku 4.5 | Very low — read-only codebase search |
| Story spec | Haiku 4.5 | Low — per story, bounded spec format |
| Quality review | Haiku 4.5 | Very low per iteration — evaluation and repair planning; 1–3 iterations typical |
| Development | Sonnet 4.6 | Highest — code generation |
| Deployment | Sonnet 4.6 | Low — script generation, one-shot |

Development still dominates total spend. The quality review adds a modest overhead per story — typically 1–2 iterations — that front-loads review cost that would otherwise surface as post-delivery rework.

---

### How Cost Tracking Works

- The `SubagentStop` hook fires automatically when each SpecGantry agent completes
- Token counts are read directly from the agent's transcript — exact API values, not estimates
- Cost is computed using live pricing rates fetched from Anthropic's pricing page on startup (fallback rates used if the fetch fails)
- One entry is appended to `specs/cost-log.ndjson` per agent run — never overwritten

### If No Data Appears

Cost tracking starts automatically once your first agent session completes. If the report is empty after running a full phase, check the [FAQ troubleshooting section](/docs/faq#costs-not-being-recorded).

---

## Common Workflows

### Starting a New Project

```
/spec-gantry → [1] Start new project
            → Enter name and vision
            → Quick-start (3 questions) or full ideation (15–30 min)
            → architecture.md + backlog written
            → Commit specs/ to git
            → Type story ID to pick up first story
            → story-spec → build
```

### Onboarding an Existing Codebase

```
/spec-gantry → detects source files, no project found
            → [2] Analyse existing codebase
            → Review proposed architecture and backlog
            → Confirm → commit specs/ to git
```

### Handling a Production Bug

```
/spec-gantry → type story ID (or [N] New work)
            → Describe the bug
            → Investigation agent checks if app is running (health gate)
            → Investigation agent reads codebase → confirms findings with you
            → Build agent uses findings as targeted brief — no spec rewrite
            → confirm deploy prompt
            → gap.md reviewed and merged (if any)
            → [1] Deploy release (patch version bump)
```

### Deploying a Release

```
(once all stories are built):
/spec-gantry → confirm deploy prompt shown
            → gap specs reviewed and confirmed (if any exist)
            → [1] Deploy release 1.0.0
            → Confirm
            → SpecGantry generates specs/deploy.sh (executable)
            → deploy-artifact.md written (deployment summary)
            → Run: specs/deploy.sh --dry-run   (local test)
            → Run: specs/deploy.sh             (production deploy)
```

### Reviewing Project Costs

```
/track-cost          → summary by phase
  → type 1           → breakdown by story
  → type 2           → breakdown by release
  → type 3           → breakdown by model
  → type X           → return to main dashboard
```

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, security model, design principles, and how to extend SpecGantry.</span>
    </div>
  </a>
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Answers to common questions about installation, the pipeline, costs, and troubleshooting.</span>
    </div>
  </a>
</div>
