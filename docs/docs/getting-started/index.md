---
layout: docs
title: Getting Started
description: Install SpecGantry and run your first session in under 5 minutes.
prev_page: "Documentation Overview"
prev_page_url: "/docs"
next_page: "How It Works"
next_page_url: "/docs/how-it-works"
---

# Getting Started with SpecGantry

Everything you need to install SpecGantry and complete your first session.

**Estimated time: 5–10 minutes**

---

## Prerequisites

- **Claude Code** installed and authenticated ([Get Claude Code](https://claude.ai/code))
- A terminal or the Claude Code desktop app
- (Optional but recommended) A git repository for your project

---

## Step 1 — Install the Plugin

Run these in your terminal:

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Claude Code will:
- Clone the SpecGantry repository
- Verify the plugin structure
- Register 5 skills and 7 agents
- Confirm with: `✓ Plugin installed: SpecGantry v1.2.2`

<div class="success">
  <strong>That's the entire installation.</strong> No npm install, no config files, no API keys. SpecGantry runs entirely within Claude Code.
</div>

---

## Updating SpecGantry

If you already have SpecGantry installed, keep it up to date with the latest features and fixes.

**Option 1 — From the marketplace (recommended):**

In your terminal:
```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:
```
/plugin marketplace update spec-gantry
```

**Option 2 — Direct plugin update:**

In your terminal:
```bash
claude plugin update spec-gantry@spec-gantry
```

Or from within Claude Code:
```
/plugin update spec-gantry@spec-gantry
```

Check the current version anytime:
```bash
claude plugin list
```

---

## Step 2 — Open Your Project

```
File → Open Folder
```

Choose based on your situation:

| Situation | What to open |
|-----------|-------------|
| New project | Empty folder |
| Existing codebase | Your project root |
| Joining a team | The cloned team repository |

---

## Step 3 — Launch the Dashboard

In Claude Code, run:

```
/spec-gantry
```

That's it. SpecGantry reads the current directory, determines what state you're in, and tells you exactly what to do next.

---

## What Happens Next

SpecGantry detects your situation automatically and guides you from there.

### New Project (Empty Folder)

```
════════════════════════════════════════════════════════════════════════
  SpecGantry v1.2.2 · AI-powered SDLC pipeline for Claude Code
════════════════════════════════════════════════════════════════════════

📊 Progress  [0/0 features]
👤 Role      Team Lead / Architect

No project spec found.

⚡ Actions
  [1] Start a new project
  [2] Reverse-engineer this existing codebase instead

  e[X]it
```

Select `[1]`. You'll answer 5–8 questions about your project. Takes 10–15 minutes. SpecGantry creates:
- `specs/project-state.yaml` — project metadata
- `specs/ideation-artifact.md` — your project brief

### Existing Codebase

```
Found source code in this directory.
SpecGantry can reverse-engineer it to generate an architecture spec.

  [Y] Yes, analyze this codebase
  [N] No, start a fresh project
```

Select `[Y]` to have SpecGantry scan your files and propose an architecture. Takes 10–15 minutes.

### Joining a Team

If your Team Lead has already committed `specs/` to the repository, SpecGantry detects it automatically:

```
════════════════════════════════════════════════════════════════════════
  ** Acme Platform **
════════════════════════════════════════════════════════════════════════

📊 Progress  [3/8 features complete]
👤 Role      Developer

📋 Feature Pipeline Board

  Auth Module         ✅ Spec → ✅ Review → ✅ Build → ✅ Tests → ✅ Done
  Payment Gateway     ✅ Spec → ✅ Review → 🔄 Build → ○ Tests  → ○ Done
  Notifications       ⏳ Spec → ○ Review  → ○ Build  → ○ Tests  → ○ Done

⚡ Actions
  [1] Pick up Notifications and start the feature spec

  [A]rchitecture  e[X]it
```

You're set as Developer automatically. Pick a feature and start writing the spec.

---

## Your First Actions by Role

### If You're the Team Lead / Architect

1. **Run `/spec-gantry`** — select Start New Project
2. **Complete Ideation** (10–20 min) — answer questions about your project vision, constraints, and risks
3. **Complete Architecture** (20–30 min) — define tech stack, system boundaries, API contracts, and guardrails
4. **Review the generated backlog** — prioritize, assign, reorder
5. **Commit `specs/` to git** — developers can now pull and join

### If You're a Developer

1. **Pull the repository** after the Team Lead commits `specs/`
2. **Run `/spec-gantry`** — it detects the project and sets your role
3. **Pick a feature** from the backlog
4. **Write the feature spec** (5–15 min) — guided by the feature-spec agent
5. **Build** — implement against your approved spec

### If You're Solo

1. **Run `/spec-gantry`** and start as Team Lead
2. **Complete both Ideation and Architecture** yourself
3. **Switch to Developer role** — work features from the backlog
4. Both hats, one person, full discipline

---

## The Directory Structure

After SpecGantry runs, your project contains:

```
project-root/
├── specs/
│   ├── project-state.yaml          # Project metadata, backlog, token usage
│   ├── ideation-artifact.md        # Project vision & validated assumptions
│   ├── architecture-spec.md        # Tech stack, system design, guardrails
│   └── features/
│       ├── FEATURE-001/
│       │   ├── state.yaml          # Phase gates, metrics, token usage
│       │   ├── feature-spec.md     # Feature specification (6 sections)
│       │   └── dev-artifact.yaml   # Implementation notes, test results
│       └── FEATURE-002/
│           └── ...
└── .claude/
    └── local-state.yaml            # Your role & current feature (local only)
```

<div class="warning">
  <strong>Don't edit these files manually</strong> unless you're recovering from a conflict. SpecGantry manages all state. Manual edits outside the pipeline may cause gate failures or data loss.
</div>

---

## The Dashboard Explained

Every `/spec-gantry` invocation re-reads all state and renders the full dashboard:

```
** My App **  |  A platform for managing AI-assisted development
────────────────────────────────────────────────────────────────
📊 Progress      [2/6 features complete]
👤 Role          Developer
────────────────────────────────────────────────────────────────

📋 Feature Pipeline Board

  User Auth       ✅ Spec → ✅ Review → ✅ Build → ✅ Tests → ✅ Done   ~$0.43
  Profile API     ✅ Spec → ✅ Review → 🔄 Build → ○ Tests  → ○ Done   ~$0.21
  Notifications   🔄 Spec → ○ Review  → ○ Build  → ○ Tests  → ○ Done
  Search          ⏳ Spec → ○ Review  → ○ Build  → ○ Tests  → ○ Done

⚡ Actions

  [1] Continue writing the spec for Notifications
  [2] Pick up Search and start the feature spec

  [A]rchitecture  e[X]it
```

**Pipeline stage icons:**

| Icon | Meaning |
|------|---------|
| `✅` | Complete |
| `🔄` | Active / in progress |
| `👤` | Waiting for human action |
| `🔴` | Blocked |
| `⏳` | Not started, ready to pick up |
| `○` | Not yet reached |

---

## Common First-Run Questions

**"Can I skip ideation?"**  
No. Ideation answers fundamental questions about the project. Without it, architecture has no context to work from.

**"Can I use SpecGantry with an existing project?"**  
Yes. Use `/reverse-engineer` to generate an architecture spec from your existing code. See [Skills Guide →](/docs/skills#reverse-engineer)

**"What if I'm working solo?"**  
SpecGantry works great for solo developers. Complete both the Team Lead and Developer phases yourself. Many solo developers find that the ideation questions alone clarify their thinking significantly.

**"How much does it cost to run SpecGantry?"**  
It depends on model choice and project size. Full ideation + architecture runs about $0.50–$2.00 with Sonnet. Track costs in the dashboard. See [Cost Tracking →](/docs/how-it-works#cost-tracking)

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon">⚙️</div>
    <div>
      <strong>How It Works</strong>
      <span>Understand all five phases, phase gates, roles, and cost tracking in detail.</span>
    </div>
  </a>
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon">🛠️</div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill and agent, what it does, and when to invoke it.</span>
    </div>
  </a>
</div>
