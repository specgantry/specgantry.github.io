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
| **spec-gantry** | `/spec-gantry` | Your single entry point — dashboard, pipeline, new projects, bug fixes, everything |
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

```
SpecGantry v1.8.8  |  Acme Platform
Progress  [████░░░░░░]  2 / 6 features complete  ·  Total spend: $1.82
──────────────────────────────────────────────────────────────────────
Role: Developer

Feature Pipeline

  001  User Auth       ✅ Spec  ✅ Review  ✅ Build  ✅ Tests  ✅ Done   $0.43
  002  Search API      ✅ Spec  ✅ Review  🔄 Build  ○ Tests   ○ Done   $0.28
  003  Notifications   🔄 Spec  ○ Review   ○ Build   ○ Tests   ○ Done
  004  Export PDF      ⏳ Spec  ○ Review   ○ Build   ○ Tests   ○ Done

⚡ Next

  [1] Continue spec for Notifications  ↳ section 2 of 6 in progress
  [2] Pick up Export PDF               ↳ reporting · small

── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

The dashboard is the same entry point for every role. What you see reflects who you are and where the project is.

---

### What /spec-gantry Handles

**Starting a new project** — When no project exists, `/spec-gantry` walks you through setup (name, vision, release label) and moves straight into ideation. No separate setup command needed.

**Analysing an existing codebase** — If source files are found without a SpecGantry project, `/spec-gantry` offers to scan your code and generate an architecture spec, domain breakdown, and feature backlog. You review and confirm before anything is written.

**Joining a team** — Pull the repository after your Team Lead commits `specs/`, run `/spec-gantry`, and your role is detected automatically. The pipeline shows exactly what's been done and what's available to pick up.

**Full feature lifecycle** — From picking a feature through spec, build, test, and deployment — every phase transition is handled through `/spec-gantry`. Phase gates are enforced automatically at each step.

**Bug fixes and new work** — Once at least one feature is deployed, the `[+] New work` quick-bar action lets the Team Lead describe a bug, improvement, or new requirement. SpecGantry classifies it and confirms before routing to the right workflow.

---

### Quick-bar Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[A]rch` | Both | View the full architecture spec |
| `[B]acklog` | Team Lead | Manage backlog — prioritize, assign, defer, reassign |
| `[P]roject` | Team Lead | Add features, graduate bug fixes, edit project details |
| `[+] New work` | Team Lead | Describe a bug, improvement, new feature, or change |
| `[?]Help` | Both | Quick reference and docs link |
| `[X]Exit` | Both | Return to normal Claude Code |

`[+] New work` appears when `architecture_complete` is true and at least one feature has been deployed.

---

### Classifying New Work

When you use `[+] New work` or when all features are deployed, SpecGantry asks what you want to work on next and classifies your description into one of four types — confirming with you before doing anything:

| Classification | When it applies |
|---|---|
| `bug_fix` | Something that was working is now broken — goes straight to development, spec phases bypassed |
| `enhancement` | An existing feature needs to do more or work differently — creates a new versioned spec cycle |
| `new_feature` | A net-new capability with no backlog entry — goes through the full feature pipeline |
| `project_change` | Cross-cutting: infrastructure, auth, data model, multi-feature scope — goes through architecture first |

SpecGantry always confirms its classification and the reason before proceeding.

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
SpecGantry v1.8.8  |  Acme Platform
[████░░░░░░]  2 / 6 deployed  ·  $7.79
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

── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

### If No Data Appears

Cost tracking starts automatically once your first agent session completes. If the report is empty after running a full phase, check the [FAQ troubleshooting section](/docs/faq#costs-not-being-recorded).

---

## Common Workflows

### Starting a New Project

```
Team Lead:
  /spec-gantry → [1] Start new project
              → Enter name, vision, release label
              → Answer ideation questions  (~15 min)
              → Define architecture        (~30 min)
              → Commit specs/ to git

Developers:
  git pull
  /spec-gantry → detects project → role: developer
              → pick a feature from ⚡ Next
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
              → SpecGantry classifies as bug_fix, confirms
              → Development begins immediately (spec phases bypassed)
              → Tests required before deployment
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
