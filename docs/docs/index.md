---
layout: docs
title: SpecGantry Documentation
description: Complete documentation for SpecGantry — AI-assisted SDLC pipeline for Claude Code.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

**AI-assisted SDLC pipeline for Claude Code.** Enforces structured development from ideation through deployment — specs before code, architecture as guardrails, role-based ownership, and real token cost visibility.

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## What Is SpecGantry?

SpecGantry is a Claude Code plugin that wraps your AI coding workflow in a structured SDLC pipeline. It enforces the process your team already knows it should follow — but usually skips under pressure.

The core idea is simple: **no code without a spec, no spec without an architecture**. Every phase transition is gated by the filesystem. Claude Code cannot proceed without the previous artifact existing on disk.

```
PROJECT LEVEL (Team Lead/Architect)
  1. Ideation        → Clarify goals, validate the problem
  2. Architecture    → Define tech stack, system design, guardrails

  ── Commit → Team joins ──

FEATURE LEVEL (Developers)
  3. Feature Spec    → Write precise, implementation-ready spec
  4. Build           → Implement against the spec, write tests
  5. Deploy          → Verify and release to production

Each phase has gates. You cannot proceed without completing the previous one.
```

---

## Documentation Sections

<div class="doc-nav-cards">
  <a href="/docs/getting-started" class="doc-nav-card">
    <div class="doc-nav-icon">🚀</div>
    <div>
      <div class="doc-nav-title">Getting Started</div>
      <div class="doc-nav-desc">Install the plugin and run your first session in under 5 minutes.</div>
    </div>
  </a>
  <a href="/docs/how-it-works" class="doc-nav-card">
    <div class="doc-nav-icon">⚙️</div>
    <div>
      <div class="doc-nav-title">How It Works</div>
      <div class="doc-nav-desc">Detailed breakdown of all five phases, roles, gates, and cost tracking.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon">🛠️</div>
    <div>
      <div class="doc-nav-title">Skills Guide</div>
      <div class="doc-nav-desc">All 6 skills and 8 agents — what they do, when to use them, how they interact.</div>
    </div>
  </a>
  <a href="/docs/architecture" class="doc-nav-card">
    <div class="doc-nav-icon">🏗️</div>
    <div>
      <div class="doc-nav-title">Architecture</div>
      <div class="doc-nav-desc">Design philosophy, state machine, data model, and extension points.</div>
    </div>
  </a>
  <a href="/docs/faq" class="doc-nav-card">
    <div class="doc-nav-icon">❓</div>
    <div>
      <div class="doc-nav-title">FAQ</div>
      <div class="doc-nav-desc">Common questions on installation, roles, pipeline phases, costs, and troubleshooting.</div>
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

The dashboard guides you from there.

### Keep SpecGantry Updated

Update to the latest version anytime:

```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:

```
/plugin marketplace update spec-gantry
```

See [FAQ → Installation](/docs/faq#how-do-i-update-specgantry) for more update options.

---

## Key Concepts

### Phase Gates

Every phase transition in SpecGantry requires a gate check. Gates read two sources of truth:
1. The phase flag in `state.yaml` (set by the agent on completion)
2. The artifact file on disk (e.g. `ideation-artifact.md`, `feature-spec.md`)

Both must agree. An agent that sets a flag without producing the artifact fails the gate. An artifact without a flag fails the gate. This prevents partial or stale state from advancing the pipeline.

### Architecture as Guardrails

When the Team Lead defines the architecture, every decision becomes an enforceable guardrail. During the Feature Spec phase, the feature-spec agent reads `architecture-spec.md` and checks every API contract, data model reference, and layer boundary. Violations are hard blockers — they prevent the spec from completing until resolved.

### YAML-Based State

All project state lives in plain-text YAML files under `specs/`. This means:
- **Human-readable** — you can inspect and understand state without tooling
- **Git-friendly** — diffs are meaningful, history is preserved
- **Session-safe** — state written after every question means no work is lost on context reset

---

## Who Should Use SpecGantry?

| Role | Use Case |
|------|----------|
| **Team Lead / Architect** | Enforce consistent process across the team without policing code review |
| **Developer** | Always have a clear, approved spec before building |
| **Solo Developer** | Discipline your own AI workflow, avoid "build fast in the wrong direction" |
| **Engineering Manager** | Real token cost visibility and audit trail for AI-assisted development |

---

## Under the Hood

| Component | Count | What they do |
|-----------|-------|-------------|
| **Skills** | 6 | Entry points: dashboard, setup, reverse-engineer, bugfix, track-cost, update-pricing |
| **Agents** | 8 | Specialists: ideation, architecture, reverse-engineer, spec, dev, test, deployment, orchestrator |
| **State files** | Per project | YAML artifacts, Markdown outputs |
| **Dependencies** | 0 | Runs entirely within Claude Code |

---

**Ready to begin?** → [Installation & First Steps →](/docs/getting-started)
