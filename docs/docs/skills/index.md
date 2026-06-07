---
layout: docs
title: Skills Guide
description: All 6 skills — what they do, when to use them, and how they connect to the pipeline.
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# SpecGantry Skills Guide

All 6 skills — what they do, when to invoke them, and how they connect to the pipeline.

---

## Skills Overview

| Skill | Command | Role | Purpose |
|-------|---------|------|---------|
| **spec-gantry** | `/spec-gantry` | Both | Main dashboard and entry point |
| **start-project** | `/start-project` | Team Lead | New project initialization |
| **reverse-engineer** | `/reverse-engineer` | Team Lead | Analyze existing code |
| **bugfix** | `/bugfix` | Developer | Fast-track a production bug fix |
| **track-cost** | `/track-cost` | Both | View token usage and cost breakdown |
| **update-pricing** | `/update-pricing` | Both | Refresh pricing rates |

---

## Video: Skills in Action

<div class="video-placeholder">
  <div class="video-placeholder-inner">
    <div class="video-icon">▶</div>
    <div class="video-text">
      <strong>SpecGantry Skills Walkthrough</strong>
      <span>Coming soon — a demonstration of each skill in a real project workflow.</span>
    </div>
  </div>
</div>

---

## 1. spec-gantry {#spec-gantry}

**The main dashboard and your entry point for all daily work.**

```
/spec-gantry
```

Run this at the start of every session. SpecGantry reads your project state, determines where you are in the pipeline, and shows you exactly what to do next.

### The Dashboard

```
SpecGantry v1.5.2  |  My App
Progress  [████░░░░░░]  2 / 6 features complete  ·  Total spend: $1.82
──────────────────────────────────────────────────────────────────────
Role: Developer

⚠  1 spec awaiting review  ·  FEATURE-004

Feature Pipeline

  001  User Auth       ✅ Spec  ✅ Review  ✅ Build  ✅ Tests  ✅ Done   $0.43
  002  Search API      ✅ Spec  ✅ Review  🔄 Build  ○ Tests   ○ Done   $0.28
  003  Notifications   🔄 Spec  ○ Review   ○ Build   ○ Tests   ○ Done
  004  Export PDF      ⏳ Spec  ○ Review   ○ Build   ○ Tests   ○ Done

  Currently working on: FEATURE-003  ·  Notifications
  Phase: Feature Spec  ·  section 2 of 6 in progress

⚡ Next

  [1] Continue spec for Notifications  ↳ section 2 of 6 in progress
  [2] Pick up Export PDF and start the feature spec  ↳ reporting · small

── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

### Quick-bar Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[A]rch` | Both | View the architecture spec and any open design questions |
| `[B]acklog` | Team Lead only | Manage the backlog — prioritize, assign, defer, reassign |
| `[P]roject` | Team Lead only | Add features, graduate bugfixes, edit project details |
| `[?]Help` | Both | Quick reference — commands, icons, docs link |
| `[X]Exit` | Both | Exit SpecGantry, return to normal Claude Code |

### Session Resume

Because all state is on disk, every `/spec-gantry` invocation picks up exactly where you left off. Run it at the start of every session — no manual state management needed.

### When All Features Are Deployed

When every active feature reaches completion, SpecGantry prompts you to describe what's next. Whatever you describe — a bug, an improvement, a new capability, or a broader change — SpecGantry classifies it and confirms before creating anything:

| Classification | When it applies |
|---|---|
| `bug_fix` | Something that worked is now broken — goes straight to development |
| `enhancement` | An existing feature needs to do more or work differently |
| `new_feature` | A net-new capability with no backlog entry |
| `project_change` | Cross-cutting: infrastructure, auth, data model, multi-feature scope |

On confirmation, the appropriate flow runs automatically.

---

## 2. start-project {#start-project}

**Initialize a new project from scratch.**

```
/start-project
```

*Usually called automatically by `/spec-gantry` when no project exists.*

### What It Does

Guides you through three quick prompts — project name, a brief vision (what it solves, who it's for, what success looks like), and a release label — then hands off to the ideation phase automatically.

### Example Interaction

```
  Project name:
  > Acme Platform

  Project vision (3–5 sentences):
  > A B2B SaaS platform that helps small teams manage their AI-assisted
    development workflow. Team leads define architecture; developers build to spec.

  What are you calling the first release? (default: v1.0)
  > v1.0

  ✓ Project initialised: Acme Platform

  Starting ideation phase...
```

### When to Use It Directly

- Starting a brand new project
- After deleting specs to start a project over
- Initializing a second project in an advanced setup

---

## 3. reverse-engineer {#reverse-engineer}

**Bring SpecGantry discipline to an existing codebase.**

```
/reverse-engineer
```

*Usually called automatically by `/spec-gantry` when source files are found but no spec exists.*

### What It Does

Analyzes your existing code — structure, languages, frameworks, dependencies, database schemas, API endpoints — and proposes a SpecGantry project structure: an architecture spec, domain taxonomy, and feature backlog.

The agent proposes. You review and decide before anything is written.

### Example Output

```
Found existing codebase. Analyzing...

📁 Structure: Monorepo (apps/, packages/, services/)
🛠  Tech: TypeScript, Express, PostgreSQL, Redis
🗄  DB: 12 tables detected
🔗 APIs: 31 REST endpoints across 4 services
📦 Key packages: passport, stripe, socket.io, bull

Proposed architecture:
  Domain        Description
  ──────────────────────────────────────────────────
  auth          Authentication, sessions, OAuth
  billing       Stripe integration, plans, invoices
  messaging     Real-time channels, notifications
  core          User management, settings, admin

Proposed feature backlog: 14 features

Review the proposed architecture before confirming? [Y/n]
```

### When to Use It

- Joining a project that has no SpecGantry structure
- Documenting undocumented code before a handoff
- Adding SpecGantry discipline to a project already in production
- Onboarding new team members with a structured architecture reference

---

## 4. bugfix {#bugfix}

**Emergency fast-track for production bugs — straight to development.**

```
/bugfix
```

### What It Does

`/bugfix` is for production issues that can't wait for the normal spec cycle. It skips the ideation and feature spec phases and goes directly to development — while still requiring tests to pass before deployment.

Describe the bug in one or two sentences. SpecGantry creates a tracked bug fix entry and begins development immediately.

```
  Describe the bug (1–2 sentences):
  What is broken and what is the expected behaviour?

  Bug: > The auth middleware returns 200 instead of 401 for expired tokens

  ✓ Bug fix fast-track activated: BUGFIX-001
  ✓ Architecture guardrails apply
  ✓ Tests required before deployment

  Analysing codebase...
```

Architecture guardrails still apply throughout the fix — bugs don't get a bypass on code quality.

### Graduating Bugs to Features

Sometimes a bug reveals that something was never properly designed. The Team Lead can promote a bug fix to a full feature with its own spec phase, domain assignment, and backlog position.

---

## 5. track-cost {#track-cost}

**See exactly what your AI development sessions cost, by phase and feature.**

```
/track-cost
```

For a phase-level breakdown, run `/track-cost` directly.

### What It Does

SpecGantry tracks the real cost of every agent session automatically. This skill reads that data and presents a complete breakdown — by phase, by feature, with each cost component in its own column.

Token counts are exact API values, not estimates. All four token categories are shown separately — input, output, cache write, and cache read — because each tells a different story. Cache costs in particular can be significant for agents working through large codebases or long conversations, and they're easy to miss if collapsed into a single total.

### Example Output

```
SpecGantry v1.5.2  |  My App
Progress  [████░░░░░░]  2 / 6 features complete  ·  Total spend: $1.91
──────────────────────────────────────────────────────────────────────

Cost Breakdown

  Project phases
  ──────────────────────────────────────────────────────────────────────
  ideation     ideation-agent      haiku-4-5    $0.0000  $0.0000  $0.0001
  architecture architecture-agent  sonnet-4-6   $0.0002  $0.0003  $0.0010
                                                          Subtotal  $0.0011

  FEATURE-001 · User Auth
  ──────────────────────────────────────────────────────────────────────
  feature_spec  feature-spec-agent  sonnet-4-6  $0.0600  $0.2820  $0.4557
  development   dev-agent           sonnet-4-6  $0.1062  $0.4618  $0.7084
  test          test-agent          sonnet-4-6  $0.1122  $0.4910  $0.7489
                                                          Subtotal  $1.9130

  ──────────────────────────────────────────────────────────────────────
  Total  4,160,786 tokens  ·  $1.91
         input $0.00  ·  output $0.38  ·  cache write $0.40  ·  cache read $1.13
  ──────────────────────────────────────────────────────────────────────
  Rates as of 2026-06-06  ·  /update-pricing to refresh

── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

### If No Data Appears

Cost tracking starts automatically once your first agent session completes. If the report is empty after running a full phase, check the troubleshooting section in the [FAQ](/docs/faq#costs-not-being-recorded).

---

## 6. update-pricing {#update-pricing}

**Make sure your cost calculations use current rates.**

```
/update-pricing
```

### What It Does

SpecGantry maintains a local cache of Anthropic's current pricing rates. This skill fetches the latest rates and updates that cache. Run it when pricing has changed or when you want to confirm the rates in use.

### Example Output

```
SpecGantry v1.5.2  |  My App
Progress  [████░░░░░░]  2 / 6 features complete  ·  Total spend: $1.91
──────────────────────────────────────────────────────────────────────

Pricing

  ✓ Rates updated as of 2026-06-06T17:39:51Z

  Model                     Input / 1M    Output / 1M
  ──────────────────────────────────────────────────
  haiku-4-5                 $1.00         $5.00
  sonnet-4-6                $3.00         $15.00
  opus-4-8                  $5.00         $25.00
  opus-4-7                  $5.00         $25.00

  Source: https://platform.claude.com/docs/en/about-claude/pricing

  Future cost calculations will use these rates.
  Entries already recorded are not retroactively updated.

── [A]rch  [?]Help  [X]Exit ──────────────────────────────────────────
```

If the pricing page is temporarily unavailable, SpecGantry continues using the most recently cached rates and shows you when they were last updated. Re-run `/update-pricing` when connectivity is restored.

---

## Common Skill Workflows

### New Team Project

```
Team Lead:
  /spec-gantry → [1] Start new project
              → Answer ideation questions
              → Define architecture
              → Commit specs/ to git

Developers:
  pull origin main
  /spec-gantry → detects project → role: developer
              → [1] Pick up FEATURE-XXX
              → Write feature spec
              → Build and test
```

### Existing Codebase

```
Team Lead:
  /spec-gantry → detects source files
              → [1] Reverse-engineer this codebase
              → Review proposed architecture
              → Refine and confirm
              → Commit specs/ to git
```

### Bug Found in Production

```
Developer:
  /bugfix → describe the issue → development begins immediately

Team Lead (if needed):
  /spec-gantry → [P]roject → Graduate bugfix
              → Bug fix promoted to full feature with spec cycle
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
