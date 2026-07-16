---
layout: docs
title: Getting Started
description: Install SpecGantry v6 and run your first session in under 5 minutes.
prev_page: "Documentation Overview"
prev_page_url: "/docs"
next_page: "How It Works"
next_page_url: "/docs/how-it-works"
---

# Getting Started with SpecGantry v6

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

Claude Code will clone the SpecGantry repository, register its skills and agents, and confirm with: `✓ Plugin installed: SpecGantry v6.0.1`

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
    <div class="dg-node-output">→ Analyse existing codebase — reverse-engineer an architecture and story backlog from your code</div>
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

For simple projects (no auth, no AI, single actor, ≤3 capabilities), quick-start activates automatically:

```
This looks like a simple single-user app. I'll apply these defaults and ask only 3 questions:

  Defaults applied:  Node.js · SQLite · Bootstrap 5 · Docker Hub · single-user · no auth
  Questions:         tech stack confirm · Docker Hub username · story list

  [>] Quick start
  [F] Full ideation  (10 topics, shape every decision yourself)
```

Quick-start asks three focused questions and produces a complete architecture. Full ideation is always available via `[F]`.

For complex projects (multi-actor, auth, AI), full ideation starts automatically — no banner.

---

## Step 4 — Ideation

SpecGantry acts as a thinking partner. The opening turn shows a topic roadmap so you know what the conversation covers, then works through each topic — proposing decisions for you to confirm or redirect.

After the produce agent completes, the **ideation evaluator** checks all 8 north star criteria against the written artifacts. If anything is missing (deployment target not decided, story list too broad), the loop iterates automatically.

When ideation exits:

```
✓ Ideation complete  ·  Manage recipes · Tag and organise · Search by ingredient
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```

**Commit your specs now:**

```bash
git add specs/
git commit -m "feat: SpecGantry project init"
```

---

## Step 5 — Spec and Build

The pipeline interleaves spec and build per story. For each story:

**Spec PPE loop:** the spec-plan-agent reads `intent.md` and the architecture, plans what the spec must capture, and the spec-produce-agent writes it. The spec-eval-agent validates it against the spec north star — 9 criteria covering async states, output format, error handling, and flow completeness. The loop iterates until all criteria are met.

You approve a machine-validated spec:

```
✓ Story spec validated — STORY-001: Manage recipes

  North star:  all 9 criteria confirmed
  Loop:        1 iteration — passed first pass

  [Y] Approve spec   [E] Edit   [X] Hold
```

**Code PPE loop:** the code-plan-agent plans the build approach, the produce agent builds, and the code-eval-agent evaluates against both the quality dimension rubric and the code north star. If the spec was insufficient for the north star (GOAL_GAP), the spec is updated automatically before rebuilding.

---

## The Dashboard

After ideation and during the build phase:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v6  |  Recipe Manager  |  release 1.0.0
Ideation ✅  ·  Spec [██░] 2/3  ·  Build [█░░] 1/3  ·  Deploy [░░░] –
──────────────────────────────────────────────────────────
  ID      Story                            Spec        Build
  ────────────────────────────────────────────────────────────────
  [001]  Manage recipes                    ✅          ✅
  [002]  Tag and organise recipes          ✅          🔄 eval
  [003]  Search recipes by ingredient      ⏳          ○
  ────────────────────────────────────────────────────────────────
  Release 1.0.0                                        ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a story ID to manage it        [$] Cost
  [1] Build next — [002]: Tag…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────
```
</div>

Type `[>]` to run the full pipeline automatically — spec and build all remaining stories, pausing only at genuine decision points like GOAL_GAP routing or loop caps.

---

## Step 6 — Deploy

Once all stories are built, SpecGantry prompts to deploy. Gap specs (if any) are reviewed and merged first, then the deployment agent generates `specs/deploy.sh` and deploys.

---

## Daily Workflow

| Situation | What to type |
|---|---|
| Resuming any work | `/spec-gantry` — always |
| Auto-run the pipeline | `/spec-gantry` then `[>]` |
| Check costs | `/track-cost` |
| Report a bug | `/spec-gantry` → `[N] New work` → describe the bug |
| Work on a specific story | `/spec-gantry` → type the story ID |

---

## Disk Layout

```
project-root/
  specs/
    project-state.yaml          pipeline state + story flags
    architecture/
      architecture.md           vision, guardrails, UX model, Artifact Index
      data-model.md             entities, fields, state machines
      actors.md                 roles, permissions
      contracts.md              API response shapes
      patterns.md               backend interaction patterns
      ux.md                     navigation, visual system, screen template
      deployment.md             cloud platform, registry, CI/CD
    stories/
      STORY-001/
        intent.md               2-paragraph purpose + outcome
        story-spec.md           ≤60-line spec (machine-validated)
        build-report.yaml       quality outcome, test plan
        gap.md                  divergences (if any, deleted at deploy)
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
      <span>Deep dive into the PPE loop, north stars, and GOAL_GAP routing.</span>
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
