---
layout: docs
title: Getting Started
description: Install SpecGantry and run your first session in under 5 minutes. Works with new and existing projects.
permalink: /docs/getting-started/
prev_page: "Overview"
prev_page_url: "/docs"
next_page: "How It Works"
next_page_url: "/docs/how-it-works"
---

# Getting Started with SpecGantry v7

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

Claude Code will clone the SpecGantry repository, register its skills and agents, and confirm with: `✓ Plugin installed: SpecGantry v7.0.2`

<div class="info">
  <strong>Why two commands?</strong> <code>claude plugin install</code> resolves names from registered marketplaces only — the marketplace must be added first. You only need to add the marketplace once.
</div>

<div class="success">
  <strong>That's the entire installation.</strong> No npm install, no config files, no API keys. SpecGantry runs entirely within Claude Code.
</div>

---

## Updating SpecGantry

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

---

## Step 2 — Start Your First Session

Open Claude Code in any directory and run:

```
/spec-gantry
```

SpecGantry detects three situations:

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-neutral">
    <div class="dg-node-num">A</div>
    <div class="dg-node-name">Empty directory</div>
    <div class="dg-node-output">→ Start new project — enter name and vision, then ideation begins</div>
  </div>

  <div class="dg-node dg-neutral">
    <div class="dg-node-num">B</div>
    <div class="dg-node-name">Source files, no specs/</div>
    <div class="dg-node-output">→ Analyse existing codebase — reverse-engineer a north star, architecture, and capability list from your code</div>
  </div>

  <div class="dg-node dg-neutral">
    <div class="dg-node-num">C</div>
    <div class="dg-node-name">specs/ exists</div>
    <div class="dg-node-output">→ Resume — dashboard shows pipeline state, routes you to the next action</div>
  </div>

</div>
</div>

---

## Step 3 — New Project: Enter Name and Vision

SpecGantry asks two things:

```
Project name (max 60 chars):  > Recipe Manager
Project vision (2–4 sentences):  > A personal recipe manager where I can save,
tag, and search recipes by ingredient. Simple CRUD, single user, no login needed.
```

SpecGantry then enters the **ideation CWJ loop** — an adversarial challenger reads your vision and fires a round of blocking questions.

---

## Step 4 — Ideation

The ideation loop surfaces all questions for a round together as a grouped block. You answer them all in one response — the challenger has grouped related questions by theme so the conversation flows naturally.

```
──────────────────────────────────────────────────────────
  Ideation · Round 1 of 5
──────────────────────────────────────────────────────────

Data ownership
  Recipes are described as personal — is there any concept of sharing or exporting
  to another user, or is this strictly single-user with no outbound data flow?

Tech fit
  You mentioned "no login needed" alongside SQLite. Single-user with no auth
  is a valid choice, but does that mean anyone with access to the machine can
  use it, or should there be at minimum a local password?

Scale
  What does "search by ingredient" mean at the edges — partial match, exact
  match, or something like "find recipes where I have all the ingredients"?
```

Answer all questions in one response. The judge then evaluates whether a developer could start writing specs without inventing answers. If yes: SpecGantry writes the artifacts and exits ideation. If not: another round.

When ideation exits:

```
✓ Ideation complete  ·  Recipe management · Tag and organise · Ingredient search
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```

**Commit your specs now:**

```bash
git add specs/
git commit -m "feat: SpecGantry project init"
```

---

## Step 5 — Spec and Build

The pipeline processes each capability in order.

**Spec CWJ loop:** the challenge agent reads your north star and capability intent, then asks what a developer would be blocked on building this. The write agent resolves every challenge into `capability-spec.md`. The judge checks whether a developer reading the spec would still be blocked. The loop iterates autonomously — you only see the result when the judge says CLEAR.

You approve a machine-challenged spec:

```
✓ Spec validated — CAP-001: Recipe management
  All async states described, empty state covered, error messages specified.
  North star alignment confirmed.

  [Y] Approve spec   [E] Edit   [X] Hold
```

**Code CWJ loop:** the plan agent plans the build approach, the build agent implements end-to-end, and the challenge agent traces the user's experience through the actual code. If a user couldn't accomplish what was promised, the loop repairs. Fully automated — you only see the transition note.

---

## The Dashboard

After ideation and during the build phase:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v7  |  Recipe Manager  |  release 1.0.0
Ideation ✅  ·  Spec [██░] 2/3  ·  Build [█░░] 1/3  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
  ID       Capability                         Spec         Build
  ──────────────────────────────────────────────────────────────────
  [001]   Recipe management                   ✅           ✅
  [002]   Tag and organise                    ✅           🔄 challenge·2
  [003]   Ingredient search                   🔄 judge     ⏳
  ──────────────────────────────────────────────────────────────────
  Release 1.0.0                                            ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a capability ID to manage it   [$] Cost & insights
  [1] Build next — [002]: Tag…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────
Enter capability ID or action:  >
```
</div>

Type `[>]` to run the full pipeline automatically — spec and build all remaining capabilities, pausing only at genuine decision points like spec gaps or loop caps.

---

## Step 6 — Deploy

Once all capabilities are built, SpecGantry prompts to deploy. The deployment agent runs a north-star alignment check first — surfacing any capability that exited CAPPED — then generates deployment artifacts and deploys.

---

## Daily Workflow

| Situation | What to type |
|---|---|
| Resuming any work | `/spec-gantry` — always |
| Auto-run the pipeline | `/spec-gantry` then `[>]` |
| Check costs and insights | `/track-cost` |
| Report a bug | `/spec-gantry` → `[N] New work` → describe the bug |
| Work on a specific capability | `/spec-gantry` → type the capability ID |

---

## Disk Layout

```
project-root/
  specs/
    project-state.yaml          pipeline state + capability flags
    north-star.md               flowing prose cognitive contract
    changelog.md                append-only release history (created on first update)
    architecture/
      architecture.md           all technical decisions in one file (## section:name anchors)
    capabilities/
      CAP-001/
        intent.md               2-paragraph experience promise
        capability-spec.md      developer contract (machine-challenged)
        build-report.yaml       quality outcome, runtime info, test plan
    cost-log.ndjson             token usage per agent run (committed)
  .claude/
    settings.json               engagement hooks
    hooks/spec-gantry-contract.sh  contract injection at session start
    CONTRACT.md                 binding directive (gitignored)
```

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How It Works</strong>
      <span>Deep dive into the CWJ loop, the north star, and diagnostic routing.</span>
    </div>
  </a>
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>All 12 agents, the dashboard in detail, and workflow walkthroughs.</span>
    </div>
  </a>
</div>
