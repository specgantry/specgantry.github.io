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
| **track-cost** | `/track-cost` | Cost breakdown by phase, component, release, and model |

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines exactly where you are in the pipeline, and tells you what to do next. Whether you're starting a brand new project, joining a team mid-flight, picking up a component, or handling a production bug — `/spec-gantry` detects the situation and guides you from there.

You never need to remember separate commands for different workflows. One command, every time.

---

### The Dashboard

Two states depending on where you are in the pipeline.

**State 1 — No components yet** (ideation in progress, or no project):

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.0.7  |  My App
[░░░░░░░░░░]  0/0 components deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  Ideation in progress — Beat 1: 3/4 topics answered.
──────────────────────────────────────────────────────────
  [1] Continue ideation               [P] Project
                                      [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

**State 2 — Component pipeline active:**

The pipeline table and component picker are unified. Every component is visible, its status is shown across all pipeline stages, and you can act on any component directly from the same screen — no navigation required.

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.0.7  |  Acme Platform
[██░░░░░░░░]  2/8 components deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
                              Spec  Dev  Deploy  Assignee
  [001]  User Auth             ✅    ✅     ✅    alice
  [002]  Search API            ✅    🔄     ○     bob
  [003]  Notifications         🔄    ○      ○     carol
  [004]  Export PDF            ⏳    ○      ○     unassigned
  [005]  Analytics             🔴    ○      ○     —          depends on 003,004
  ────────────────────────────────────────────
  Gap merge                    ○
  Integration tests            ○
  Deploy release               ○
──────────────────────────────────────────────────────────
  Type a component ID to pick it up   [A] Architecture
  [1] Continue spec – COMP-003        [I] Integration scenarios
                                      [P] Project
                                      [$] Cost
                                      [+] New work
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
Enter component ID or action:  `>`
```
</div>

Type a component number directly (e.g. `004`) to pick it up. Blocked components show their dependency inline. The left column shows the most useful contextual actions for your current role and state.

**Pipeline stage icons:**

| Icon | Meaning |
|------|---------|
| `✅` | Complete |
| `🔄` | Active / in progress |
| `👤` | Waiting for your action |
| `🔴` | Blocked by a dependency |
| `⏳` | Not started, ready to pick up |
| `↷` | Skipped by TL decision (integration tests) |
| `○` | Not yet reached |

---

### What /spec-gantry Handles

**Starting a new project** — When no project exists, `/spec-gantry` walks you through setup (name and vision — no version number needed, every project starts at `1.0.0`) and moves straight into ideation.

**Analysing an existing codebase** — If source files are found without a SpecGantry project, `/spec-gantry` offers to scan your code and generate an architecture spec, domain breakdown, and component backlog. You review and confirm before anything is written.

**Joining a team** — Pull the repository after your Team Lead commits `specs/`, run `/spec-gantry`, and your role is detected automatically. The full pipeline dashboard is visible immediately.

**Full component lifecycle** — From claiming a component through spec, development, and deployment — every phase transition is handled through `/spec-gantry`. Phase gates are enforced automatically.

**Bug fixes and new work** — Use `[+] New work` (visible once architecture is complete) to describe a bug, improvement, new component, or architectural change at any point in the pipeline — mid-flight or post-deployment. SpecGantry analyses the backlog and component specs to determine what's affected — you just describe the work.

---

### Action Bar Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[A]` Architecture | Both | View the full architecture spec. Visible whenever `architecture-spec.md` exists — including mid-ideation. |
| `[I]` Integration scenarios | Both | View `integration-scenarios.md` — scenarios, assertions, run history. Visible once seeded during ideation. |
| `[P]` Project | Both | Manage backlog — prioritize, assign, defer. Edit project name and vision. |
| `[$]` Cost | Both | Opens the cost dashboard — breakdown by phase, component, release, and model |
| `[+]` New work | Both | Describe a bug, improvement, new component, or change. Visible once ideation is complete. |
| `[?]` Help | Both | Quick reference and docs link |
| `[X]` Exit | Both | Return to normal Claude Code |

---

### Classifying New Work

When you use `[+] New work` or when all components are deployed, SpecGantry asks what you want to work on next. It then:

1. **Classifies** the type of work
2. **Maps it to components** — reads the backlog and all component specs to determine which existing components are affected, or what new component to create. You don't need to specify this.
3. **Confirms** the mapping with you before touching any state
4. **Routes** — resets phase flags and re-enters the pipeline

| Classification | When it applies |
|---|---|
| `bug_fix` | Something that was working is now broken — full spec → dev cycle on the affected component |
| `enhancement` | An existing component needs to do more or work differently — same cycle, spec updated with change annotations |
| `new_component` | A net-new capability — ideation agent runs in amendment mode to assign a component ID and update the backlog |
| `project_change` | Cross-cutting: infrastructure, data model, multi-component scope — ideation agent runs in amendment mode first |

SpecGantry always confirms its classification and component mapping before proceeding.

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

Cost data lives in `specs/cost-log.ndjson`, committed to git alongside your specs. Your whole team has shared visibility into AI spend over the full project lifetime.

---

### The Cost Dashboard

**Default view — Cost Summary by Phase:**

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
SpecGantry v2.0.7  |  Acme Platform
[██░░░░░░░░]  2/8 components deployed
──────────────────────────────────────────────────────────

Cost Summary  |  release 1.0.0

Phase               Tokens       Cost
──────────────────────────────────────
ideation            12,605      $1.26
component_spec      14,209      $1.43
development         31,445      $3.14
integration_test     6,112      $0.61
deployment           3,890      $0.39
──────────────────────────────────────
Total               68,261      $6.83

──────────────────────────────────────────────────────────
  [1] By component    [2] By release    [3] By model
                                        [X] Return
──────────────────────────────────────────────────────────
Enter option:  `>`
```
</div>

The menu bar persists across all views — switch between breakdowns without going back to the summary first.

---

**[1] By Component** — total spend per component across all phases:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — track-cost</span></div>

```
Cost by Component  |  release 1.0.0

Component        Tokens       Cost
───────────────────────────────────
COMP-001         26,209      $2.47
COMP-002         18,441      $1.84
COMP-003          9,112      $0.46
───────────────────────────────────
Total            53,762      $4.77
```
</div>

Project-level phases (ideation, integration test, deployment) are excluded here — they belong to the project, not individual components.

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

Useful for understanding whether your spend profile aligns with what you'd expect — Haiku is used for ideation; Sonnet is used for component spec, development, integration test, and deployment phases.

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
Team Lead:
  /spec-gantry → [1] Start new project
              → Enter name and vision
              → Beat 1: mature the idea  (~10 min)
              → Beat 2: shape the system (~15 min)
              → architecture-spec.md + backlog written
              → [Y] Approve backlog
              → Commit specs/ to git

Developers:
  git pull
  /spec-gantry → detects project → type component ID to claim it
              → domain elaboration (first of domain) → write spec → develop (TDD)
```

### Onboarding an Existing Codebase

```
Team Lead:
  /spec-gantry → detects source files, no project found
              → [2] Analyse existing codebase
              → Review proposed architecture and backlog
              → Confirm → commit specs/ to git
```

### Handling a Production Bug

```
Team Lead:
  /spec-gantry → [+] New work
              → Describe the bug
              → SpecGantry identifies affected component, confirms
              → Developer picks it up — full spec → dev cycle
              → All components pass → confirm-integration prompt
              → Gap specs reviewed and merged (if any)
              → [Y] Run integration tests  OR  [S] Skip → deploy
```

### Deploying a Release

```
Team Lead (once all components pass unit tests):
  /spec-gantry → confirm-integration prompt shown
              → gap specs reviewed and confirmed (if any exist)
              → [Y] Run integration tests  OR  [S] Skip — deploy directly
              → (if Y) scenarios execute against real system → all pass
              → [1] Deploy release 1.0.0
              → Confirm
              → SpecGantry generates deploy.sh (executable)
              → Reviews deploy-artifact.md
              → Runs specs/deploy.sh
```

### Reviewing Project Costs

```
Anyone:
  /track-cost          → summary by phase
  → type 1             → breakdown by component
  → type 2             → breakdown by release
  → type 3             → breakdown by model
  → type X             → return to main dashboard
```

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon">🏗️</div>
    <div>
      <strong>Reference</strong>
      <span>File structure, security model, design principles, and how to extend SpecGantry.</span>
    </div>
  </a>
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon">❓</div>
    <div>
      <strong>FAQ</strong>
      <span>Answers to common questions about installation, roles, the pipeline, and troubleshooting.</span>
    </div>
  </a>
</div>
