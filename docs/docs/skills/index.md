---
layout: docs
title: Skills Guide
description: All 6 skills and 7 agents — what they do, when to use them, and how they interact.
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Architecture"
next_page_url: "/docs/architecture"
---

# SpecGantry Skills Guide

All 6 skills and their associated agents — what they do, when to invoke them, and how they connect to the pipeline.

---

## Skills Overview

| Skill | Command | Role | Purpose |
|-------|---------|------|---------|
| **spec-gantry** | `/spec-gantry` | Both | Main dashboard and entry point |
| **start-project** | `/start-project` | Team Lead | New project initialization |
| **reverse-engineer** | `/reverse-engineer` | Team Lead | Analyze existing code |
| **bugfix** | `/bugfix` | Developer | Log and manage bugs |
| **track-cost** | `/track-cost` | Both | View costs at any stage of development |
| **update-pricing** | `/update-pricing` | Team Lead | Token price configuration |

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

**The main dashboard and your only entry point for daily work.**

```
/spec-gantry
```

### What It Does

Every invocation:
1. Reads `.claude/local-state.yaml` — your role and current feature
2. Reads `specs/project-state.yaml` — project metadata, backlog, phase gates
3. Reads all `specs/features/*/state.yaml` — feature progress
4. Renders the full dashboard
5. Presents contextual next actions
6. Accepts menu commands

### The Dashboard

```
** My App **  |  A project vision summary from ideation
────────────────────────────────────────────────────────────────────
📊 Progress      [2/6 features complete]
👤 Role          Developer
────────────────────────────────────────────────────────────────────

⚠ 1 feature spec awaiting developer review — FEATURE-004

📋 Feature Pipeline Board

  User Auth       ✅ Spec → ✅ Review → ✅ Build → ✅ Tests → ✅ Done   ~$0.43
  Search API      ✅ Spec → ✅ Review → 🔄 Build → ○ Tests  → ○ Done   ~$0.28
  Notifications   🔄 Spec → ○ Review  → ○ Build  → ○ Tests  → ○ Done
  Export PDF      ⏳ Spec → ○ Review  → ○ Build  → ○ Tests  → ○ Done
  
⚡ Actions

  [1] Continue writing the spec for Notifications
  [2] Pick up Export PDF and start the feature spec
  [3] See what this project has cost so far

  [A]rchitecture  [B]acklog  [C]ost  [P]roject  e[X]it
```

### Menu Commands

| Command | Who | What it does |
|---------|-----|-------------|
| `[A]rchitecture` | Both (read-only for Dev) | View the full architecture spec and open questions |
| `[B]acklog` | Team Lead only | Full backlog management — prioritize, assign, defer, reassign |
| `[C]ost` | Both | Track project costs by phase and feature using token logs |
| `[P]roject` | Team Lead only | Add features, graduate bugfixes, edit project name/vision |
| `e[X]it` | Both | Exit SpecGantry, return to normal Claude Code |

### Automatic Invocation

`/spec-gantry` calls other skills automatically based on state:
- Detects no project → runs `/start-project`
- Detects source files but no spec → offers `/reverse-engineer`
- Detects an existing project → sets role and shows dashboard

### Session Resume

Because all state is on disk, every `/spec-gantry` invocation is idempotent. Run it at the start of every session — it picks up exactly where you left off.

---

## 2. start-project {#start-project}

**Initialize a new project from scratch.**

```
/start-project
```

*Usually called automatically by `/spec-gantry` when no project exists.*

### What It Does

Guides you through:
- Project name and one-paragraph vision
- Target platform, language, and framework
- Team structure (Team Lead + developers, or solo)
- Key non-functional requirements (performance, security, compliance)

Creates:
- `specs/project-state.yaml` — with project metadata and empty phase gates
- `specs/ideation-artifact.md` — skeleton ready for the ideation agent

### Example Interaction

```
📋 Project Setup

What's the name of this project?
> Acme Platform

Describe what it does in 3–5 sentences. What problem does it solve? Who are the users?
> A B2B SaaS platform that helps small teams manage their AI-assisted development
  workflow. Team leads define architecture, developers build to spec.

Target platform and primary language?
> Node.js / TypeScript, deployed to AWS

Team structure?
> 1 tech lead + 3 developers

✅ Project created. Next: run /spec-gantry to begin ideation.
```

### When to Use It Directly

- Manually, on a fresh project (though `/spec-gantry` calls it automatically)
- After deleting `specs/` to start a project over
- To initialize a second project in an advanced setup

---

## 3. reverse-engineer {#reverse-engineer}

**Analyze existing code and generate a project spec.**

```
/reverse-engineer
```

*Usually called automatically by `/spec-gantry` when source files are found but no spec exists.*

### What It Does

Scans:
- Directory structure and file layout
- File types, languages, and frameworks
- Package dependencies
- Database schemas (if detectable)
- API endpoints (REST, GraphQL, etc.)

Proposes:
- Architecture spec (`specs/architecture-spec.md`)
- Domain taxonomy
- Feature backlog

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

- Joining an existing project that has no SpecGantry structure
- Documenting undocumented code before a handoff
- Adding SpecGantry discipline to a project already in production
- Onboarding new team members by generating a structured spec

---

## 4. bugfix {#bugfix}

**Log and manage bugs without disrupting feature development.**

```
/bugfix
```

### What It Does

Bugs discovered during development often don't fit neatly into the current feature's scope. `/bugfix` lets you log them, decide their urgency, and keep moving.

**Three paths:**

```
Found a bug during development?

[1] Log it as a bugfix    — document it, fix later
[2] Fix it now            — pause feature work, fix bug, resume
[3] Escalate to Team Lead — needs immediate architectural attention
```

Logged bugs get a `BUGFIX-NNN` identifier and are attached to the project state. They can be:
- Fixed immediately (pause feature work, return when done)
- Deferred (logged, visible on Team Lead dashboard)
- Graduated to a full feature by the Team Lead (`[P]roject → Graduate bugfix`)

### Example

```
📋 Logging Bugfix

Describe the bug:
> The auth middleware returns 200 instead of 401 for expired tokens

How to reproduce it?
> Call any protected endpoint with a JWT that expired more than 24h ago

Severity? [critical / high / medium / low]
> high

✅ Logged as BUGFIX-003
   Visible to Team Lead on next dashboard load.
   Options: [1] Fix now  [2] Defer for later
```

### Graduating Bugs to Features

Sometimes a bug reveals that something was never properly spec'd. The Team Lead can use `[P]roject → Graduate bugfix` to promote a BUGFIX entry to a full FEATURE with its own spec phase, domain assignment, and backlog position.

---

## 5. track-cost {#track-cost}

**Check project costs at any stage—automatic logging throughout all phases.**

```
/track-cost
```

Or select `[C]ost` from the `/spec-gantry` menu.

### What It Does

SpecGantry logs token usage for every agent invocation automatically across **all phases**: ideation, architecture, spec-writing, development, testing, and deployment. This skill aggregates those logs and calculates costs in real-time using your configured pricing rates.

**Call it anytime to see:**
- Current pricing effective date
- Project-level costs (ideation, architecture, deployment)
- Per-feature costs (by feature and by phase within each feature)
- Total project cost so far (accumulating as work progresses)

### Example Output

```
📊 Cost Tracking Report
─────────────────────────────────────────────────────────────────
Pricing effective: 2026-06-01

🏢 Project-Level Costs

Phase        Agent               Model                Input    Output   Total
──────────────────────────────────────────────────────────────────────────────
ideation     ideation-agent      claude-sonnet-4-6    $0.12    $0.14    $0.26
architecture architecture-agent  claude-sonnet-4-6    $0.44    $0.22    $0.66
                                                                Subtotal: $0.92

🎯 Per-Feature Costs

FEATURE-001: User Auth
  Phase        Agent               Model                Input    Output   Total
  ──────────────────────────────────────────────────────────────────────────────
  spec         feature-spec-agent  claude-sonnet-4-6    $0.08    $0.16    $0.24
  dev          dev-agent           claude-sonnet-4-6    $0.18    $0.15    $0.33
  tests        test-agent          claude-haiku-4-5     $0.02    $0.01    $0.03
                                                                  Subtotal: $0.60

──────────────────────────────────────────────────────────────────
💰 Total Project Cost (all phases, all features): $1.52
──────────────────────────────────────────────────────────────────
```

### How to Use It

**Option 1: Direct command**
```
/track-cost
```

**Option 2: From the dashboard menu**
1. Run `/spec-gantry`
2. Select `[C]ost` from the menu
3. View the full cost breakdown

The report shows:
- Exact token counts and calculated costs
- Which agents and models consumed the most tokens
- Per-feature cost tracking (useful for client billing)
- Historical cost context (pricing effective date)

### When to Use It

- **During ideation** — see how much the clarification phase cost
- **After architecture** — understand architecture design costs before committing to it
- **Mid-feature development** — check if a feature is spending more than expected, adjust scope if needed
- **Sprint reviews** — show stakeholders the AI investment per feature
- **Monthly budget checks** — never let costs surprise you; check anytime
- **Client billing** — per-project, per-phase cost breakdown for accurate invoicing
- **Model optimization** — see where Haiku vs Sonnet would have a cost impact

This is the real advantage: **costs are never hidden**. You have visibility at every stage of development.

---

## 6. Automatic Cost Tracking Throughout Development {#automatic-cost-tracking}

**Every phase logs costs automatically. You control when you look at them.**

### How It Works

The orchestrator logs token usage after every agent invocation—automatically, no configuration needed:

- **Ideation phase** — tokens logged when ideation-agent runs
- **Architecture phase** — tokens logged when architecture-agent runs
- **Feature spec phase** — tokens logged when feature-spec-agent runs
- **Development phase** — tokens logged when dev-agent and test-agent run
- **Deployment phase** — tokens logged when deployment-agent runs

All logs are stored in:
- `specs/project-state.yaml` — project-level costs (ideation, architecture, deployment)
- `specs/features/FEATURE-XXX/state.yaml` — per-feature costs (spec, dev, tests)

### Why This Matters

You never have to wonder what something cost. Call `/track-cost` anytime:
- **After completing ideation** — "How much did clarification cost?"
- **Mid-feature** — "Is this feature running over budget?"
- **End of sprint** — "What's the cost per feature?"
- **Project conclusion** — "What was the total AI investment?"

The data is always there, always current, always accurate.

---

## 7. update-pricing {#update-pricing}

**Configure token prices for cost calculations.**

```
/update-pricing
```

### What It Does

SpecGantry tracks token usage for every agent invocation. The cost calculation uses prices from `config/pricing-history.yaml`. This skill lets you update those prices when Claude's pricing changes, or when you need to reflect your organization's internal billing rates.

### Example

```
💰 Token Pricing Configuration

Current rates (last updated: 2026-05-01):

  Model                 Input (per 1M)   Output (per 1M)
  ──────────────────────────────────────────────────────
  claude-opus-4-8       $15.00           $75.00
  claude-sonnet-4-6     $3.00            $15.00
  claude-haiku-4-5      $0.80            $4.00

Update rates? [Y/n]
  > Y

Enter Sonnet 4.6 input price per 1M tokens:
  > 3.00

✅ Pricing updated. New rates will apply to all future cost calculations.
```

### Cost Calculation

When you run `[C]ost` from the `/spec-gantry` menu, it reads the pricing rates from this configuration and calculates costs for all tracked token usage. Updating rates here automatically updates all future cost calculations.

### When to Use It

- Monthly, when Claude releases new pricing
- When billing AI costs to a client (accurate per-project cost)
- When optimizing model selection (compare Haiku vs Sonnet costs)
- When reflecting your organization's internal AI billing rates

---

## The 7 Agents (unchanged)

Skills call agents to do the actual work. Agents are invoked by the orchestrator — you never call them directly.

| Agent | Invoked By | Purpose |
|-------|-----------|---------|
| **orchestrator** | Skills | Routes phases, enforces gates, logs token usage |
| **ideation-agent** | orchestrator | Guides project clarification, produces feasibility assessment |
| **architecture-agent** | orchestrator | Designs system, produces guardrails and feature backlog |
| **feature-spec-agent** | orchestrator | Guides 6-section spec, checks guardrail compliance |
| **dev-agent** | orchestrator | Implements feature from spec, writes tests |
| **test-agent** | dev-agent | Runs test suite, sets `overall_status` |
| **deployment-agent** | orchestrator | Final verification, marks feature complete |

The orchestrator is the sole choke point for all phase transitions. It verifies gate conditions before invoking any agent, and logs token usage after every invocation.

---

## Common Skill Workflows

### New Team Project

```
Team Lead:
  /spec-gantry → [1] Start new project     (/start-project)
              → Answer ideation questions   (ideation-agent)
              → Define architecture         (architecture-agent)
              → Commit specs/ to git

Developers:
  pull origin main
  /spec-gantry → detects project-state.yaml → role: developer
              → [1] Pick up FEATURE-XXX
              → Write feature spec          (feature-spec-agent)
              → Build                       (dev-agent + test-agent)
```

### Existing Codebase

```
Team Lead:
  /spec-gantry → detects source files
              → [1] Reverse-engineer        (/reverse-engineer)
              → Review proposed architecture
              → Refine and confirm
              → Commit specs/ to git
```

### Bug Found During Development

```
Developer:
  /bugfix → [1] Log as bugfix              (BUGFIX-003 created)
          → Continue feature development

Team Lead:
  /spec-gantry → [P]roject → Graduate bugfix
              → BUGFIX-003 becomes FEATURE-009
```

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon">🏗️</div>
    <div>
      <strong>Technical Architecture</strong>
      <span>State machine, data model, design decisions, and how to extend SpecGantry.</span>
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
