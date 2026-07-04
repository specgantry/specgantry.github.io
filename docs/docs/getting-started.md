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

# Getting Started

SpecGantry installs as a Claude Code plugin in two commands. Once installed, a single skill — `/spec-gantry` — covers every workflow: new projects, existing codebases, daily development, bug fixes, and new features.

---

## Step 1 — Install the Plugin

Run both commands in order. The marketplace must be registered before installing.

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

**From within Claude Code** (alternative):

```
/plugin marketplace add specgantry/specgantry.github.io
/plugin install spec-gantry
```

You should see:

```
✓ Plugin installed: SpecGantry v5.1.0
✓ 2 skills loaded · 7 agents registered
```

### Update an Existing Install

```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:

```
/plugin marketplace update spec-gantry
```

### Remove SpecGantry

```bash
claude plugin uninstall spec-gantry
```

Removing the plugin does not delete your `specs/` directory. Your project state, architecture, and story specs are untouched.

---

## Step 2 — Open a Project

Open any directory in Claude Code — a new empty folder, or an existing project you want to bring structure to.

```
/spec-gantry
```

SpecGantry reads the directory and routes you automatically:

- **No project files, no source code** → starts a new project (ideation)
- **Source code found, no SpecGantry artifacts** → offers to reverse-engineer the existing codebase
- **Existing SpecGantry project** → shows the pipeline dashboard and your next action

---

## Step 3a — New Project

If no project exists, SpecGantry prompts:

```
Project name (max 60 chars):  >
Project vision (2–4 sentences):  >
```

After you enter these, the ideation subagent starts a two-beat conversational session. Nine topics guide you from raw idea to shaped system:

- **Beat 1** (Topics 1–4): Vision, Problem & Users, Constraints, Risks & Out of Scope
- **Beat 2** (Topics 5–9): Tech Stack, Guardrails, Configuration, Story List, UX Model

After ideation, SpecGantry seeds the full architecture layer — five artifact files, `intent.md` per story — and presents the pipeline dashboard.

This is a good moment to `/compact` — all decisions are on disk, and the context from ideation is large.

---

## Step 3b — Existing Codebase (Reverse Engineering)

If source files are found without SpecGantry artifacts, you see:

```
Existing codebase detected — no SpecGantry project found.
  [1] Start new project
  [2] Analyse existing codebase
```

Choose `[2]`. The reverse-engineer subagent analyzes your code silently, then presents an inferred story list for your review:

```
Inferred stories from codebase:

  ID        Title                          Status    Depends on
  ─────────────────────────────────────────────────────────────
  STORY-001  User authentication            built      —
  STORY-002  User profile management        built      STORY-001
  STORY-003  Admin dashboard                built      STORY-001
  STORY-004  Reporting module               partial    STORY-001

  Status: built = fully implemented  partial = incomplete  missing = not built

[OK] Accept list   [E] Edit
```

Review the list, edit if needed, then accept. SpecGantry writes:

- `specs/architecture/` — full architecture layer synthesized from your code
- `specs/stories/[STORY-ID]/intent.md` — 2-paragraph intent per story
- `specs/stories/[STORY-ID]/story-spec.md` — stub spec with `reads:` block per story
- `specs/stories/[STORY-ID]/build-report.yaml` — runtime profile for built stories
- `@story`, `@intent`, `@entry`, `@contract` anchor comments in source files

---

## Step 4 — The Pipeline Dashboard

After ideation or reverse engineering completes, the dashboard shows your project state:

```
SpecGantry v5  |  MyProject  |  release 1.0.0
──────────────────────────────────────────────────────────────────
Spec [░░░░░] 0/4  ·  Build [░░░░░] 0/4  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────────────
  ID      Story                              Spec   Build
  ────────────────────────────────────────────────────────────────
  [001]   User authentication                  ⏳     ○
  [002]   User profile management              🔴     ○      depends on 001
  [003]   User submits application             🔴     ○      depends on 001
  [004]   Admin reviews submissions            🔴     ○      depends on 003
  ────────────────────────────────────────────────────────────────
  Release 1.0.0                                       ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a story ID to manage it            [$] Cost
  [1] Spec next story — STORY-001         [?] Help
  [N] New work                            [X] Exit
──────────────────────────────────────────────────────────────────
Enter story ID or action:  >
```

Icon legend: `✅` complete · `🔄` in progress · `🔴` blocked · `⏳` ready · `○` not reached · `~` stub spec (RE, not yet written)

The action bar shows your next action automatically. Press `[1]` to begin, or type a story ID to jump to it directly.

---

## Step 5 — Daily Workflow

Every session starts the same way:

```
/spec-gantry
```

SpecGantry reads your current state and shows the dashboard. From there:

| What you want to do | How |
|--------------------|-----|
| Continue the pipeline | Press the numbered action shown |
| Work on a specific story | Type the story ID (e.g. `001`) |
| Complete a stub spec (RE projects) | Type the stub story ID, or use `Complete stub spec` action |
| Report a bug or request an enhancement | Press `[N] New work` |
| Add a new story | Press `[N] New work` → describe it |
| See token costs | Press `[$]` |
| View architecture | Press `[?]` then `[A]` |

---

## What Gets Written to Disk

All SpecGantry artifacts live under `specs/` in your project root:

```
specs/
  project-state.yaml          — pipeline state, story flags, gap signals
  architecture/
    architecture.md           — narrative + Artifact Index (entry point)
    data-model.md             — entities, fields, state machines
    actors.md                 — roles, permissions
    contracts.md              — shared API shapes, error envelopes
    patterns.md               — backend interaction patterns
    ux.md                     — navigation, visual system, component conventions
  stories/
    STORY-001/
      intent.md               — 2-paragraph functional purpose
      story-spec.md           — criteria, interfaces, permissions, state, data
      build-report.yaml       — runtime profile, build command, migration info
      gap.md                  — mid-build discovery log (if any)
  cost-log.ndjson             — token usage by phase, story, model, release
```

Add `specs/.current-session` to your `.gitignore` (SpecGantry does this automatically). Commit everything else.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How It Works</strong>
      <span>Deep dive into every phase, the architecture layer, gap flows, and reverse engineering.</span>
    </div>
  </a>
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills & Agents</strong>
      <span>Every command, every agent, and what they do.</span>
    </div>
  </a>
</div>
