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

You must register the SpecGantry marketplace **before** installing the plugin. Both commands are required, in this order:

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Claude Code will clone the SpecGantry repository, register its skills and agents, and confirm with: `✓ Plugin installed: SpecGantry v1.9.5`

<div class="info">
  <strong>Why two commands?</strong> <code>claude plugin install</code> resolves names from registered marketplaces only — the marketplace must be added first. You only need to add the marketplace once; future installs and updates use the registered entry.
</div>

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

Check the current version anytime:
```bash
claude plugin list
```

---

## Removing SpecGantry

To uninstall the plugin and remove the marketplace entry, run both commands in order:

```bash
claude plugin uninstall spec-gantry
claude plugin marketplace remove https://github.com/specgantry/specgantry.github.io
```

Your project's `specs/` files are not touched — they stay in your repository.

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
SpecGantry v1.9.5  |  New Project
[░░░░░░░░░░]  0 / 0 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  No project found in this directory.
──────────────────────────────────────────────────────────
  [1] Start new project               [P] Project
  [2] Analyse existing codebase       [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```

Select `[1]`. You'll answer two questions — project name and vision. No version number needed; every project starts at `1.0.0`. SpecGantry moves straight into ideation.

### Existing Codebase

Select `[2]` to have SpecGantry scan your files and propose an architecture spec, domain breakdown, and feature backlog. You review and confirm before anything is written. Takes 10–15 minutes.

### Joining a Team

If your Team Lead has already committed `specs/` to the repository, SpecGantry detects it and sets your role automatically:

```
SpecGantry v1.9.5  |  Acme Platform
[████░░░░░░]  3 / 8 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  001  Auth Module       ✅ Spec  ✅ Rev  ✅ Build  ✅ Tests  ✅ Done
  002  Payment Gateway   ✅ Spec  ✅ Rev  🔄 Build  ○ Tests   ○ Done
  003  Notifications     ⏳ Spec  ○ Rev   ○ Build   ○ Tests   ○ Done
──────────────────────────────────────────────────────────
  [1] Pick up Notifications           [A] Architecture
  [2] Pick up Search                  [P] Project
                                      [$] Cost
                                      [+] New work
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```

Select a feature from the numbered actions and the feature spec phase begins immediately.

---

## Your First Actions by Role

### If You're the Team Lead / Architect

1. **Run `/spec-gantry`** — select Start New Project
2. **Complete Ideation** (10–20 min) — answer questions about your project vision, constraints, and risks
3. **Complete Architecture** (20–30 min) — define tech stack, system boundaries, API contracts, and guardrails
4. **Review the generated backlog** — prioritize, assign, reorder via `[P] Project`
5. **Commit `specs/` to git** — developers can now pull and join

### If You're a Developer

1. **Pull the repository** after the Team Lead commits `specs/`
2. **Run `/spec-gantry`** — it detects the project and sets your role
3. **Pick a feature** from the numbered actions
4. **Write the feature spec** (5–15 min) — guided by the feature-spec agent
5. **Build and test** — implement against your approved spec

### If You're Solo

1. **Run `/spec-gantry`** and start as Team Lead
2. **Complete both Ideation and Architecture** yourself
3. **Switch to Developer role** — work features from the backlog
4. **Deploy** when all features pass tests — the whole system ships as one release

---

## The Directory Structure

After SpecGantry runs, your project contains a `specs/` directory to commit to git:

```
project-root/
├── specs/
│   ├── project-state.yaml          # Project metadata and backlog
│   ├── ideation-artifact.md        # Project vision & validated assumptions
│   ├── architecture-spec.md        # Tech stack, system design, guardrails
│   ├── cost-log.ndjson             # Token usage and cost per agent session
│   ├── deploy.sh                   # Generated deployment script (whole system)
│   ├── deploy.sh.old               # Previous deployment script (backup)
│   ├── deploy-artifact.md          # Deployment validation summary
│   └── features/
│       ├── FEATURE-001/
│       │   ├── feature-spec.md     # Feature specification + Change History
│       │   ├── state.yaml          # Phase progress flags
│       │   └── dev-artifact.yaml   # Build notes and test results
│       └── FEATURE-002/
│           └── ...
```

<div class="info">
  <strong>Commit <code>specs/</code> to git.</strong> This is how your team shares project decisions, tracks feature progress, and maintains a history of architecture choices. Each developer's local role settings stay on their own machine and are not committed.
</div>

---

## The Dashboard Explained

Every `/spec-gantry` invocation re-reads all state and renders the full dashboard. There are two states:

### State 1 — No features yet

Shown during ideation, architecture, or when no project exists. The middle section shows the current phase status.

### State 2 — Feature pipeline active

Shown once architecture is complete and the backlog has features:

```
SpecGantry v1.9.5  |  My App
[████░░░░░░]  2 / 6 features deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  001  User Auth       ✅ Spec  ✅ Rev  ✅ Build  ✅ Tests  ✅ Done
  002  Profile API     ✅ Spec  ✅ Rev  🔄 Build  ○ Tests   ○ Done
  003  Notifications   🔄 Spec  ○ Rev   ○ Build   ○ Tests   ○ Done
  004  Search          ⏳ Spec  ○ Rev   ○ Build   ○ Tests   ○ Done
──────────────────────────────────────────────────────────
  [1] Continue spec for Notifications [A] Architecture
  [2] Pick up Search                  [P] Project
                                      [$] Cost
                                      [+] New work
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```

**Pipeline stage icons:**

| Icon | Meaning |
|------|---------|
| `✅` | Complete |
| `🔄` | Active / in progress |
| `👤` | Waiting for your action |
| `🔴` | Blocked by a dependency |
| `⏳` | Not started, ready to pick up |
| `○` | Not yet reached |

**Action bar columns:**

| Left column | Right column |
|---|---|
| Numbered contextual actions (1–4) — change based on your role and project state | Fixed lettered commands — always available |

---

## Common First-Run Questions

**"Can I skip ideation?"**
No. Ideation answers fundamental questions about the project. Without it, architecture has no context to work from.

**"Can I use SpecGantry with an existing project?"**
Yes. Run `/spec-gantry` — if source files are found without a SpecGantry project, it offers to scan your codebase and generate a full architecture spec and feature backlog.

**"What if I'm working solo?"**
SpecGantry works great for solo developers. Complete both the Team Lead and Developer phases yourself. The ideation questions alone often clarify thinking significantly.

**"How much does it cost to run SpecGantry?"**
It depends on project size and complexity. A complete ideation + architecture session typically runs $0.50–$2.00. Run `[$] Cost` at any point for a live breakdown by phase and feature.

**"When can I deploy?"**
Only after all features have been built and tested. The first deployment ships the complete system as release `1.0.0`.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon">⚙️</div>
    <div>
      <strong>How It Works</strong>
      <span>Understand all phases, phase gates, release versioning, and roles in detail.</span>
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
