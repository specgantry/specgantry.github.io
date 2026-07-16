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

Claude Code will clone the SpecGantry repository, register its skills and agents, and confirm with: `✓ Plugin installed: SpecGantry v5.3.7`

<div class="info">
  <strong>Why two commands?</strong> <code>claude plugin install</code> resolves names from registered marketplaces only — the marketplace must be added first. You only need to add the marketplace once; future installs and updates use the registered entry.
</div>

<div class="success">
  <strong>That's the entire installation.</strong> No npm install, no config files, no API keys. SpecGantry runs entirely within Claude Code.
</div>

---

## Updating SpecGantry

If you already have SpecGantry installed, keep it up to date with the latest features and fixes.

Run both commands together:

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

Or from within Claude Code:
```
/plugin marketplace update spec-gantry && /plugin update spec-gantry@spec-gantry
```

**SpecGantry notifies you automatically.** When a new version is available, a banner appears at the top of the dashboard the next time you open a session — showing the version number and the update command. No manual checking needed.

Check the current version anytime:
```bash
claude plugin list
```

---

## Removing SpecGantry

To uninstall the plugin and remove the marketplace entry, run both commands in order:

```bash
claude plugin uninstall spec-gantry@spec-gantry
claude plugin marketplace remove spec-gantry
```

Run them in that order — uninstall the plugin first, then remove the marketplace registration. Your project's `specs/` files are not touched — they stay in your repository.

---

## Step 2 — Start Claude Code

Open Claude Code in your project directory. If you're starting a new project, open an empty folder. If you have an existing codebase, open your project root.

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
      <div class="dg-entry-step">Quick-start (3 questions) or full ideation<br><span style="font-size:.68rem;color:var(--slate-400)">auto-detected from vision</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Beat 1 — Mature the idea<br><span style="font-size:.68rem;color:var(--slate-400)">full ideation only · 15–30 min</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Beat 2 — Shape the system<br><span style="font-size:.68rem;color:var(--slate-400)">tech stack · boundaries · backlog</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Commit specs/ to git</strong></div>
    </div>

    <div class="dg-fork-branch">
      <div class="dg-fork-label" style="text-align:center"><i class="bi bi-file-code"></i> Source files, no specs/</div>
      <div class="dg-flow-node dg-spec" style="width:100%">
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Existing Codebase</div>
          <div class="dg-flow-node-desc">Offer: init fresh or reverse-engineer</div>
        </div>
      </div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Analyse source files<br><span style="font-size:.68rem;color:var(--slate-400)">10–15 min</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Review proposed architecture<br><span style="font-size:.68rem;color:var(--slate-400)">confirm or redirect</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Commit specs/ to git</strong></div>
    </div>

    <div class="dg-fork-branch">
      <div class="dg-fork-label" style="text-align:center"><i class="bi bi-files"></i> specs/ found</div>
      <div class="dg-flow-node dg-deploy" style="width:100%">
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Resuming</div>
          <div class="dg-flow-node-desc">Read state → show dashboard</div>
        </div>
      </div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step">Pipeline dashboard shown<br><span style="font-size:.68rem;color:var(--slate-400)">pick up a story or continue</span></div>
      <div class="dg-entry-arrow"></div>
      <div class="dg-entry-step"><strong>Type story ID to continue</strong></div>
    </div>

  </div>
</div>
</div>

### New Project (Empty Folder)

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v5.3.7  |  New Project
[░░░░░░░░░░]  0/0 stories deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  No project found in this directory.
──────────────────────────────────────────────────────────
  [1] Start new project               [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

Select `[1]`. You'll answer two questions — project name and vision. SpecGantry then checks whether the project looks simple (no auth, no AI integration, single actor type, three or fewer capabilities). If so, it switches to **quick-start mode**: it sets sensible defaults for stack decisions and deployment, asks only three focused questions, and gets you to a story backlog in a few minutes. For more complex projects it runs the full two-beat ideation conversation.

### Existing Codebase

Select `[2]` to have SpecGantry scan your files and propose an architecture, story backlog, and guardrails. You review and confirm before anything is written. Takes 10–15 minutes.

---

## Your First Actions

1. **Run `/spec-gantry`** — select Start New Project
2. **Answer two questions** — project name and vision. SpecGantry auto-detects whether to use quick-start mode (3 focused questions) or full ideation (15–30 min).
3. **Commit `specs/` to git**
4. **Type a story ID** from the dashboard to begin the story spec phase
5. **Write the story spec** (5–15 min) — guided by the story-spec agent
6. **Build** — implement against your approved spec

---

## The Directory Structure

After SpecGantry runs, your project contains a `specs/` directory to commit to git:

```
project-root/
├── .claude/
│   ├── settings.json               # SessionStart + PostCompact engagement hooks (written by SpecGantry)
│   ├── CONTRACT.md                 # Engagement contract — injected into every session (gitignored)
│   └── hooks/
│       └── spec-gantry-contract.sh # Hook script that injects CONTRACT.md as context
├── specs/
│   ├── project-state.yaml          # Project metadata and story backlog
│   ├── architecture.md             # Vision, tech stack, system design, guardrails
│   ├── cost-log.ndjson             # Token usage and cost per agent run
│   ├── deploy.sh                   # Generated deployment script (whole system)
│   ├── deploy.sh.old               # Previous deployment script (backup)
│   ├── deploy-artifact.md          # Deployment validation summary
│   └── stories/
│       ├── STORY-001/
│       │   ├── story-spec.md       # Story specification
│       │   ├── build-report.yaml   # Build notes, test plan, and results
│       │   └── gap.md              # Gap file (if written during build or post-release; deleted after deploy merge)
│       └── STORY-002/
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

> **Engagement hooks are installed automatically.** SpecGantry's `SessionStart` hook detects any project with `specs/project-state.yaml` and installs `.claude/settings.json`, the contract shell script, and `CONTRACT.md` on the first session open — before Claude sees any message. The `PostCompact` hook re-injects the contract after every `/compact`. No manual setup needed.

<div class="info">
  <strong>Commit <code>specs/</code> to git.</strong> This is how you maintain a history of architecture choices, story progress, and costs.
</div>

<div class="info">
  <strong>Mount <code>data/</code> as a persistent volume.</strong> This directory is the runtime storage root for your application — databases, uploads, caches. In Docker or cloud deployments, map it to a persistent volume so data survives restarts and redeployments.
</div>

---

## The Dashboard Explained

Every `/spec-gantry` invocation re-reads all state and renders the full dashboard. There are two states:

### State 1 — No stories yet

Shown during ideation, or when no project exists. The middle section shows the current phase status:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v5.3.7  |  My App
[░░░░░░░░░░]  0/0 stories deployed  |  release 1.0.0
──────────────────────────────────────────────────────────
  Ideation in progress — Beat 1: 2/4 topics answered.
──────────────────────────────────────────────────────────
  [1] Continue ideation               [$] Cost
                                      [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────
```
</div>

### State 2 — Story pipeline active

Shown once ideation is complete. The pipeline table and story picker are unified — every story is visible and directly actionable from the same screen:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v5.3.7  |  Acme Platform  |  release 1.0.0
Spec [███░░] 3/4  ·  Build [██░░░] 2/4  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────
  ID      Story                          Spec   Build
  ──────────────────────────────────────────────────
  [001]  User registers and logs in       ✅    ✅
  [002]  User manages their profile       ✅    🔄
  [003]  User submits application         🔄    ○
  [004]  Admin reviews submissions        ⏳    ○
  ──────────────────────────────────────────────────
  Release 1.0.0                                ○ not deployed
──────────────────────────────────────────────────────────
  Type a story ID to pick it up       [$] Cost
  [1] Continue spec – STORY-003       [?] Help
  [N] New work                        [X] Exit
──────────────────────────────────────────────────────────
Enter story ID or action:  `>`
```
</div>

**Pipeline stage icons:**

| Icon | Meaning |
|------|---------|
| `✅` | Complete |
| `🔄` | Active / in progress |
| `🔴` | Blocked by a dependency |
| `⏳` | Not started, ready to pick up |
| `○` | Not yet reached |
| `~` | Built but no spec written (reverse-engineered story) |

Type a story number directly (e.g. `004`) to pick it up. Blocked stories show their dependency inline — no separate screen needed. For stories that are already built, typing the ID opens an inline prompt: "What would you like to change?" — letting you start a bug fix or enhancement directly without navigating to `[N] New work`.

---

## Common First-Run Questions

**"Can I skip ideation?"**
No. Ideation produces `architecture.md` and the story backlog — the pipeline cannot start without them. There is no separate architecture phase; ideation does both in one conversation.

**"Can I use SpecGantry with an existing project?"**
Yes. Run `/spec-gantry` — if source files are found without a SpecGantry project, it offers to scan your codebase and generate a full architecture and story backlog.

**"What if I'm working solo?"**
SpecGantry is designed for solo developers. Complete ideation, then work through stories one by one — spec then build each one.

**"How much does it cost to run SpecGantry?"**
It depends on project size and complexity. Run `[$] Cost` at any point — or `/track-cost` — for a full live breakdown by phase, story, release, and model.

**"When can I deploy?"**
Once all stories are built. You are then prompted at a single confirmation point: any gap specs are reviewed and merged first, then you choose `[1] Deploy release` or `[X] Hold`.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How It Works</strong>
      <span>Understand all phases, gap specs, release versioning, and routing in detail.</span>
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
