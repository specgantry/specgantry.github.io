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

SpecGantry has two skills. `/spec-gantry` is the one you use every day — it handles everything. `/track-cost` is for reviewing AI spend.

---

## Skills Overview

| Skill | Command | Purpose |
|-------|---------|---------|
| **spec-gantry** | `/spec-gantry` | Your single entry point — dashboard, pipeline, new projects, changes, everything |
| **track-cost** | `/track-cost` | Full cost breakdown by phase and feature |

---

## /spec-gantry {#spec-gantry}

**The only command you need to know.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines exactly where you are in the pipeline, and tells you what to do next. Whether you're starting a brand new project, joining a team mid-flight, picking up a feature, or handling a production bug — `/spec-gantry` detects the situation and guides you from there.

You never need to remember separate commands for different workflows. One command, every time.

---

### The Dashboard

Two states depending on where you are in the pipeline.

**State 1 — No features yet** (ideation, architecture in progress, or no project):

```
SpecGantry v1.9.6  |  My App
[░░░░░░░░░░]  0 / 0 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  Architecture in progress — 3/5 topics complete.
──────────────────────────────────────────────────────────
  [1] Continue architecture           [P] Project
                                      [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```

**State 2 — Feature pipeline active:**

```
SpecGantry v1.9.6  |  Acme Platform
[████░░░░░░]  2 / 6 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  001  User Auth       ✅ Spec  ✅ Rev  ✅ Build  ✅ Tests  ✅ Done
  002  Search API      ✅ Spec  ✅ Rev  🔄 Build  ○ Tests   ○ Done
  003  Notifications   🔄 Spec  ○ Rev   ○ Build   ○ Tests   ○ Done
  004  Export PDF      ⏳ Spec  ○ Rev   ○ Build   ○ Tests   ○ Done
──────────────────────────────────────────────────────────
  [1] Continue spec for Notifications [A] Architecture
  [2] Pick up Export PDF              [P] Project
                                      [$] Cost
                                      [+] New work
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```

The left column of the action bar shows 1–4 contextual numbered actions — the most useful things you can do right now. The right column is always-present lettered commands.

---

### What /spec-gantry Handles

**Starting a new project** — When no project exists, `/spec-gantry` walks you through setup (name and vision — no version number needed, every project starts at `1.0.0`) and moves straight into ideation.

**Analysing an existing codebase** — If source files are found without a SpecGantry project, `/spec-gantry` offers to scan your code and generate an architecture spec, domain breakdown, and feature backlog. You review and confirm before anything is written.

**Joining a team** — Pull the repository after your Team Lead commits `specs/`, run `/spec-gantry`, and your role is detected automatically.

**Full feature lifecycle** — From picking a feature through spec, build, test, and deployment — every phase transition is handled through `/spec-gantry`. Phase gates are enforced automatically.

**Bug fixes and new work** — Use `[+] New work` (visible once architecture is complete) to describe a bug, improvement, new feature, or architectural change. SpecGantry analyses the backlog and feature specs to determine which features are affected — you just describe the work.

---

### Action Bar Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[A]` Architecture | Both | View the full architecture spec. Visible once architecture is complete. |
| `[P]` Project | Both | Manage backlog — prioritize, assign, defer, group-assign. Edit project name and vision. |
| `[$]` Cost | Both | Full cost breakdown by phase and feature |
| `[+]` New work | Both | Describe a bug, improvement, new feature, or change. Visible once architecture is complete. |
| `[?]` Help | Both | Quick reference and docs link |
| `[X]` Exit | Both | Return to normal Claude Code |

---

### Classifying New Work

When you use `[+] New work` or when all features are deployed, SpecGantry asks what you want to work on next. It then:

1. **Classifies** the type of work
2. **Maps it to features** — reads the backlog and all feature specs to determine which existing features are affected, or what new feature to create. You don't need to specify this.
3. **Confirms** the mapping with you before touching any state
4. **Routes** — resets phase flags and re-enters the pipeline

| Classification | When it applies |
|---|---|
| `bug_fix` | Something that was working is now broken — full spec → build → test cycle on the affected feature |
| `enhancement` | An existing feature needs to do more or work differently — same cycle, spec updated with change annotations |
| `new_feature` | A net-new capability — architecture agent runs first to assign the feature ID and update the backlog |
| `project_change` | Cross-cutting: infrastructure, data model, multi-feature scope — architecture agent runs first |

SpecGantry always confirms its classification and feature mapping before proceeding.

---

### Session Resume

All progress is saved after every question and every section. Every `/spec-gantry` invocation picks up exactly where you left off — no manual state management, no lost progress.

---

## /track-cost {#track-cost}

**See exactly what your AI development sessions cost, by phase and feature.**

```
/track-cost
```

SpecGantry tracks token usage automatically after every agent session. `/track-cost` renders that data as two tables — a summary by phase across the whole project, and a per-feature breakdown showing which phase ran and what it cost.

---

### Example Output

```
SpecGantry v1.9.6  |  Acme Platform
[████░░░░░░]  2 / 6 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────

By Phase
Phase           Sessions   Tokens       Cost
──────────────────────────────────────────────
ideation             1      4,404      $0.47
architecture         1      8,201      $0.82
feature_spec         3     14,209      $1.43
development          2     31,445      $3.14
test                 2      6,112      $0.31
deployment           1      3,890      $0.39
──────────────────────────────────────────────
Total               10     68,261      $6.56

By Feature
Feature          Phase          Model         Tokens       Cost
────────────────────────────────────────────────────────────────
FEATURE-001      feature_spec   sonnet-4-6    4,896      $0.49
FEATURE-001      development    sonnet-4-6   18,201      $1.82
FEATURE-001      test           haiku-4-5     3,112      $0.16
────────────────────────────────────────────────────────────────
FEATURE-001 total                            26,209      $2.47
```

### If No Data Appears

Cost tracking starts automatically once your first agent session completes. If the report is empty after running a full phase, check the [FAQ troubleshooting section](/docs/faq#costs-not-being-recorded).

---

## Common Workflows

### Starting a New Project

```
Team Lead:
  /spec-gantry → [1] Start new project
              → Enter name and vision
              → Answer ideation questions  (~15 min)
              → Define architecture        (~30 min)
              → Commit specs/ to git

Developers:
  git pull
  /spec-gantry → detects project → pick a feature
              → write spec, build, test
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
              → SpecGantry identifies affected feature, confirms
              → Developer picks it up — full spec → build → test cycle
              → All features tested → TL deploys new release
```

### Deploying a Release

```
Team Lead (once all features pass tests):
  /spec-gantry → [1] Deploy release 1.0.0
              → Confirm
              → SpecGantry generates deploy.sh covering all features
              → Reviews deploy-artifact.md
              → Runs specs/deploy.sh
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
