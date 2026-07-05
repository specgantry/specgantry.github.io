---
layout: docs
title: SpecGantry Documentation
description: Complete documentation for SpecGantry v5 — reference-driven SDLC for Claude Code. Shared architecture artifacts, slim story specs, targeted model reads, enforced phase gates.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

**Reference-driven SDLC for Claude Code.** Architecture artifacts written once. Story specs that reference them. Agents that read only what they need. Enforced phase gates from first idea through deployment.

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## What Is SpecGantry?

SpecGantry is a Claude Code plugin that enforces a structured development process. The core v5 insight: architectural knowledge should live once in shared artifacts, not duplicated in every story spec. Every story references the shared layer. Every agent reads only the sections it needs.

The result: architecture that stays consistent across stories, story specs that stay slim and precise, and agents that make fewer wrong decisions because their context is targeted rather than broad.

<div class="dg-wrap">
<div class="dg-diagram-title">The SpecGantry v5 Pipeline</div>
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">01</div>
    <div class="dg-node-name">Ideation + Architecture</div>
    <div class="dg-node-output">architecture/ · 6 artifacts · intent.md</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: ideation_complete + arch_seeded"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">02</div>
    <div class="dg-node-name">Story Spec</div>
    <div class="dg-node-output">story-spec.md (≤60 lines) + reads: block</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: spec_done + intent_done per story"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-build">
    <div class="dg-node-num">03</div>
    <div class="dg-node-name">Build</div>
    <div class="dg-node-output">@story @intent @entry @contract · build-report.yaml</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: all stories built:true"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num">04</div>
    <div class="dg-node-name">Deploy Release</div>
    <div class="dg-node-output">deploy.sh · gap specs merged</div>
  </div>

</div>
</div>

---

## Documentation Sections

<div class="doc-nav-cards">
  <a href="/docs/getting-started" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div>
      <div class="doc-nav-title">Getting Started</div>
      <div class="doc-nav-desc">Install the plugin and run your first session in under 5 minutes.</div>
    </div>
  </a>
  <a href="/docs/how-it-works" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-gear"></i></div>
    <div>
      <div class="doc-nav-title">How It Works</div>
      <div class="doc-nav-desc">Complete walkthrough — the architecture layer, all pipeline phases, gap flows, reverse engineering, and release management.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-tools"></i></div>
    <div>
      <div class="doc-nav-title">Skills & Agents</div>
      <div class="doc-nav-desc">/spec-gantry and /track-cost — what they do, all 7 agents, the dashboard, and every workflow covered.</div>
    </div>
  </a>
  <a href="/docs/architecture" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <div class="doc-nav-title">Reference</div>
      <div class="doc-nav-desc">File structure, state flags, agent ownership, the Artifact Index format, and how to extend SpecGantry.</div>
    </div>
  </a>
  <a href="/docs/faq" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <div class="doc-nav-title">FAQ</div>
      <div class="doc-nav-desc">Common questions on installation, pipeline, costs, and troubleshooting.</div>
    </div>
  </a>
</div>

---

## Quick Install

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Then in any Claude Code project:

```
/spec-gantry
```

The dashboard reads your project state and routes you to the right next action automatically.

### Keep SpecGantry Updated

```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:

```
/plugin marketplace update spec-gantry
```

---

## Key Concepts

### The Architecture Layer

SpecGantry introduced a dedicated `specs/architecture/` directory containing six structured files:

| File | Contains |
|------|----------|
| `data-model.md` | All entities, fields, types, relationships, state machines |
| `actors.md` | All roles, permissions, what each role can and cannot do |
| `contracts.md` | Shared API response shapes, error envelopes |
| `patterns.md` | Dominant backend interaction patterns |
| `ux.md` | Navigation model, visual system, component conventions, screen template |
| `deployment.md` | Cloud platform, registry, service architecture, secrets, CI/CD config |

These are written once during ideation and referenced by every story spec via a `reads:` block. An agent building a story loads only the specific sections that story uses — not the full architecture.

### The reads: Block

Every story spec declares exactly what it needs:

```yaml
reads:
  actors:    [applicant, admin]
  data:      [application, user]
  contracts: [submission-response, error-envelope]
  ux:        [component-conventions, screen-template]
```

The development agent resolves each entry through the Artifact Index and loads only those sections — approximately 130 lines of targeted context rather than the entire architecture.

### Slim Story Specs (≤60 lines)

Story specs are navigation maps, not knowledge dumps. They contain five sections: criteria, interfaces, permissions, state, and data — all as references to shared artifacts. The 60-line limit is enforced before `spec_done:true` can be set.

### Self-Healing Gap Flows

When story-spec finds a missing arch section (P0 gap) or development finds a wrong contract (P1 gap), SpecGantry automatically fills the gap via the ideation agent and resumes — no user intervention required.

### The intent.md

Every story has a 2-paragraph `intent.md` that states the functional purpose and outcome in plain English. It grounds the development agent's judgment calls and propagates as a one-line `@intent` anchor in every source file — so investigation never needs to load full specs to understand what a file does.

### State That Survives Anything

All progress is written after every answer and every phase transition. State flags in `project-state.yaml` tell the orchestrator exactly where to resume. A crash between any two writes triggers P2 routing on next run, which detects incomplete state and recovers automatically.

### Engagement Hooks

On every session start, SpecGantry's `hooks.js` checks whether `specs/project-state.yaml` exists in the current directory. If it does, it automatically installs `.claude/settings.json` hooks, a contract shell script, and `CONTRACT.md` — a binding directive injected into every Claude Code session. The `PostCompact` hook re-injects the contract after every `/compact`, so Claude never loses track of the pipeline mid-session. This runs entirely in Node.js — not by Claude, so it cannot be skipped.

### Specs in Git

Everything under `specs/` is plain-text YAML and Markdown. Commit it for complete history, meaningful diffs, and a single source of truth across sessions.

---

## Who Should Use SpecGantry?

| Use Case | Why |
|----------|-----|
| New project from scratch | Ideation shapes your system as a partner conversation. Architecture seeded once. Stories built against a shared contract. |
| Existing codebase | Reverse engineering synthesizes the full architecture layer from your code. Stub specs and anchor tags generated automatically. |
| Solo developer | Forces you to answer the hard questions before building. Prevents fast progress in the wrong direction. |
| Any project using Claude Code | Token cost visibility by phase, story, and release. Know exactly what each feature cost. |

---

**Ready to begin?** → [Installation & First Steps →](/docs/getting-started)
