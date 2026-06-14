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

Claude Code will clone the SpecGantry repository, register its skills and agents, and confirm with: `✓ Plugin installed: SpecGantry v2.2.6`

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

<div class="dg-wrap">
<div class="dg-diagram-title">What /spec-gantry detects</div>

<div style="display:flex;flex-direction:column;align-items:center;gap:0">

  <div class="dg-entry-start">/spec-gantry</div>
  <div style="height:16px;width:2px;background:var(--slate-300);margin:0 auto"></div>
  <div class="dg-flow-gate-row" style="justify-content:center">
    <div class="dg-flow-gate-badge"><i class="bi bi-search" style="font-size:.6rem"></i> scans current directory</div>
  </div>
  <div style="height:16px;width:2px;background:var(--slate-300);margin:0 auto"></div>

  <div style="display:flex;align-items:flex-start;gap:16px;width:100%">

    <div class="dg-fork-branch">
      <div class="dg-fork-label" style="text-align:center"><i class="bi bi-folder"></i> Empty folder</div>
      <div class="dg-flow-node dg-ideation" style="width:100%">
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">New Project</div>
          <div class="dg-flow-node-desc">Name + vision → straight into ideation</div>
        </div>
      </div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Beat 1 — Mature the idea<br><span style="font-size:.68rem;color:var(--slate-400)">15–30 min</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Beat 2 — Shape the system<br><span style="font-size:.68rem;color:var(--slate-400)">tech stack · boundaries · backlog</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Approve backlog → commit specs/</strong></div>
    </div>

    <div class="dg-fork-branch">
      <div class="dg-fork-label" style="text-align:center"><i class="bi bi-file-code"></i> Source files, no specs/</div>
      <div class="dg-flow-node dg-spec" style="width:100%">
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Existing Codebase</div>
          <div class="dg-flow-node-desc">Reverse-engineer: scan → propose arch spec + backlog</div>
        </div>
      </div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Analyse source files<br><span style="font-size:.68rem;color:var(--slate-400)">10–15 min</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Review proposed architecture<br><span style="font-size:.68rem;color:var(--slate-400)">confirm or redirect</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Approve backlog → commit specs/</strong></div>
    </div>

    <div class="dg-fork-branch">
      <div class="dg-fork-label" style="text-align:center"><i class="bi bi-people"></i> specs/ found</div>
      <div class="dg-flow-node dg-deploy" style="width:100%">
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Joining a Team</div>
          <div class="dg-flow-node-desc">Ask role → show dashboard</div>
        </div>
      </div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Select role<br><span style="font-size:.68rem;color:var(--slate-400)">Team Lead or Developer</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Pipeline dashboard shown<br><span style="font-size:.68rem;color:var(--slate-400)">pick up a component or continue</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Type component ID to claim it</strong></div>
    </div>

  </div>
</div>
</div>

### New Project (Empty Folder)

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.2.6  |  New Project
[░░░░░░░░░░]  0/0 components deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  No project found in this directory.
──────────────────────────────────────────────────────────
  [1] Start new project               [P] Project
                                      [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

Select `[1]`. You'll answer two questions — project name and vision. No version number needed; every project starts at `1.0.0`. SpecGantry moves straight into ideation.

### Existing Codebase

Select `[2]` to have SpecGantry scan your files and propose an architecture spec, domain breakdown, and component backlog. You review and confirm before anything is written. Takes 10–15 minutes.

### Joining a Team

If your Team Lead has already committed `specs/` to the repository, SpecGantry detects it on first run and asks whether you are the Team Lead or a Developer. After you identify yourself, the pipeline dashboard is shown immediately:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry project found: Acme Platform (release 1.0.0)

Are you the Team Lead or a Developer?
  [1] Team Lead / Architect
  [2] Developer
```
</div>

After selecting `[2]` and entering your name, the dashboard appears:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.2.6  |  Acme Platform  |  release 1.0.0
Spec [███░░] 3/5  ·  Dev [█░░░░] 1/5  ·  You [░░░░░] 0/0 assigned
──────────────────────────────────────────────────────────
                              Spec  Dev  Assignee
  [001]  Auth Module           ✅    ✅    alice
  [002]  Payment Gateway       ✅    🔄    bob
  [003]  Notifications         🔄    ○     carol
  [004]  Search                ⏳    ○     unassigned
  [005]  Reporting             🔴    ○     —          depends on 003,004
──────────────────────────────────────────────────────────
  Type a component ID to manage it    [$] Cost
  [1] Claim a component               [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
Enter component ID or action:  `>`
```
</div>

Type a component number (e.g. `004`) to claim it and begin the component spec phase.

---

## Your First Actions by Role

### If You're the Team Lead / Architect

1. **Run `/spec-gantry`** — select Start New Project
2. **Complete Ideation** (15–30 min) — Beat 1 matures the idea; Beat 2 shapes the system (tech stack, boundaries, guardrails, component backlog). Both happen in one conversation.
3. **Approve the component backlog** — review the proposed components and select `[Y] Approve`; spec work cannot begin until you do
4. **Commit `specs/` to git** — developers can now pull and join

### If You're a Developer

1. **Pull the repository** after the Team Lead commits `specs/`
2. **Run `/spec-gantry`** — it detects the project and asks if you are the Team Lead or a Developer; select Developer and enter your name
3. **Type a component ID** to claim it from the pipeline dashboard
4. **Write the component spec** (5–15 min) — guided by the component-spec agent
5. **Build and test** — implement against your approved spec using TDD

### If You're Solo

1. **Run `/spec-gantry`** and start as Team Lead
2. **Complete Ideation** yourself — both idea maturation and system shaping happen in one session
3. **Approve the backlog** — then switch to Developer role
4. **Work components from the dashboard** using TDD
5. **Confirm integration** once all components pass — run tests or skip straight to deploy

---

## The Directory Structure

After SpecGantry runs, your project contains a `specs/` directory to commit to git:

```
project-root/
├── specs/
│   ├── project-state.yaml          # Project metadata and component backlog
│   ├── architecture-spec.md        # Vision, tech stack, system design, guardrails, domain sections
│   ├── integration-scenarios.md    # Living document — cross-component scenarios and run history
│   ├── cost-log.ndjson             # Token usage and cost per agent run
│   ├── deploy.sh                   # Generated deployment script (whole system)
│   ├── deploy.sh.old               # Previous deployment script (backup)
│   ├── deploy-artifact.md          # Deployment validation summary
│   └── components/
│       ├── COMP-001/
│       │   ├── component-spec.md   # Component specification + Change History
│       │   ├── state.yaml          # Phase progress flags
│       │   ├── dev-artifact.yaml   # Build notes and test results
│       │   └── gap-YYYY-MM-DD.md  # Gap spec (if written during build; deleted after merge)
│       └── COMP-002/
│           └── ...
├── src/                            # Your application source code
│   ├── config/                     # App configuration and env templates
│   ├── db/                         # Migrations and seed data
│   ├── api/                        # API or middleware layer
│   └── ...
└── data/                           # Runtime writable storage (mount as persistent volume)
    ├── db/                         # Runtime databases (e.g. SQLite)
    ├── uploads/                    # User-uploaded files
    └── cache/                      # Generated caches
```

<div class="info">
  <strong>Commit <code>specs/</code> to git.</strong> This is how your team shares project decisions, tracks component progress, and maintains a history of architecture choices and costs. Each developer's local role settings stay on their own machine and are not committed.
</div>

<div class="info">
  <strong>Mount <code>data/</code> as a persistent volume.</strong> This directory is the runtime storage root for your application — databases, uploads, caches. In Docker or cloud deployments, map it to a persistent volume so data survives restarts and redeployments.
</div>

---

## The Dashboard Explained

Every `/spec-gantry` invocation re-reads all state and renders the full dashboard. There are two states:

### State 1 — No components yet

Shown during ideation, or when no project exists. The middle section shows the current phase status:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.2.6  |  My App
[░░░░░░░░░░]  0/0 components deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  Ideation in progress — Beat 1: 2/4 topics answered.
──────────────────────────────────────────────────────────
  [1] Continue ideation               [P] Project
                                      [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

### State 2 — Component pipeline active

Shown once the backlog is approved. The pipeline table and component picker are unified — every component is visible and directly actionable from the same screen:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v2.2.6  |  My App
[██░░░░░░░░]  2/8 components deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
                              Spec  Dev  Assignee
  [001]  User Auth             ✅    ✅    alice
  [002]  Profile API           ✅    🔄    bob
  [003]  Notifications         🔄    ○     carol
  [004]  Search                ⏳    ○     unassigned
  [005]  Reporting             🔴    ○     —          depends on 003,004
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

Type a component number directly (e.g. `004`) to pick it up. Blocked components show their dependency inline — no separate screen needed.

---

## Common First-Run Questions

**"Can I skip ideation?"**
No. Ideation produces `architecture-spec.md` and the component backlog — the pipeline cannot start without them. There is no separate architecture phase; ideation does both in one conversation.

**"Can I use SpecGantry with an existing project?"**
Yes. Run `/spec-gantry` — if source files are found without a SpecGantry project, it offers to scan your codebase and generate a full architecture spec and component backlog.

**"What if I'm working solo?"**
SpecGantry works great for solo developers. Complete both the Team Lead and Developer phases yourself. The ideation questions alone often clarify thinking significantly.

**"How much does it cost to run SpecGantry?"**
It depends on project size and complexity. A complete ideation session typically runs $0.50–$2.00. Run `[$] Cost` at any point — or `/track-cost` — for a full live breakdown by phase, component, release, and model.

**"When can I deploy?"**
Once all components pass their unit tests. The TL is then prompted at a single confirmation point: any gap specs are reviewed and merged first, then the TL chooses `[Y] Run integration tests`, `[S] Skip — deploy directly`, or `[X] Hold`. Both paths are recorded as audit flags and either one opens the deploy gate.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How It Works</strong>
      <span>Understand all phases, phase gates, gap specs, release versioning, and roles in detail.</span>
    </div>
  </a>
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill and agent, what it does, and when to invoke it.</span>
    </div>
  </a>
</div>
