---
layout: docs
title: SpecGantry Documentation
description: Complete documentation for SpecGantry — AI-assisted SDLC pipeline for Claude Code.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

**AI-assisted SDLC pipeline for Claude Code.** Bring structure to your AI development workflow — from first idea through deployment — with specs before code, architectural guardrails, role-based ownership, and real cost visibility.

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## What Is SpecGantry?

SpecGantry is a Claude Code plugin that guides your team through a structured development process. Instead of jumping straight into code, it ensures every feature is grounded in a validated idea, a thoughtful architecture, and a precise spec — before a single line is written.

The result: less rework, fewer surprises, and a codebase that reflects deliberate decisions rather than accumulated shortcuts.

```
PROJECT LEVEL (Team Lead/Architect)
  1. Ideation        → Validate the problem, surface assumptions
  2. Architecture    → Define the system and set development guardrails

  ── Commit → Team joins ──

FEATURE LEVEL (Developers)
  3. Feature Spec    → Write a precise, implementation-ready spec
  4. Build           → Implement against the spec, run tests
  5. Deploy          → Verify and release

Each phase builds on the last. You move forward when the work is done — not before.
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
      <div class="doc-nav-desc">A complete walkthrough of all five phases, roles, and how SpecGantry keeps your team aligned.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon">🛠️</div>
    <div>
      <div class="doc-nav-title">Skills Guide</div>
      <div class="doc-nav-desc">/spec-gantry and /track-cost — the two commands you need and everything they do.</div>
    </div>
  </a>
  <a href="/docs/architecture" class="doc-nav-card">
    <div class="doc-nav-icon">🏗️</div>
    <div>
      <div class="doc-nav-title">Reference</div>
      <div class="doc-nav-desc">Design principles, file structure, security model, and how to extend SpecGantry.</div>
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

Run both commands in order — the marketplace must be registered before installing:

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

See [Getting Started → Install, Update & Remove](/docs/getting-started#step-1--install-the-plugin) for all options including uninstall.

---

## Key Concepts

### Phase Gates

Every phase transition requires the previous phase to be fully complete — both the decisions you made and the documents they produced. SpecGantry verifies completeness automatically before moving forward. Partial work doesn't advance the pipeline.

This isn't bureaucracy — it's the thing that prevents half-finished specs from becoming hard-to-change code.

### Architecture as Guardrails

When the Team Lead defines the architecture, every decision becomes a rule the whole team builds to. During the Feature Spec phase, SpecGantry checks every spec against those rules before development can begin. If a spec contradicts the architecture — wrong auth pattern, wrong data ownership, wrong layer access — it fails with a specific explanation before any code is written.

### State That Survives Interruption

All progress is saved after every question and every section. If your session is interrupted for any reason — context reset, network drop, end of day — the next `/spec-gantry` picks up exactly where you left off. Nothing is lost.

### Specs in Git

All project state — ideation, architecture, feature specs, and cost data — lives in plain-text files under `specs/` in your project. Commit them to git and your whole team shares a single source of truth, complete history, and meaningful diffs.

---

## Who Should Use SpecGantry?

| Role | Use Case |
|------|----------|
| **Team Lead / Architect** | Establish a consistent process the whole team follows without needing to police every PR |
| **Developer** | Always start from a clear, approved spec — no ambiguity, no scope creep mid-build |
| **Solo Developer** | Bring discipline to your own AI workflow; avoid building fast in the wrong direction |
| **Engineering Manager** | Get cost visibility and an audit trail for every AI-assisted feature |

---

**Ready to begin?** → [Installation & First Steps →](/docs/getting-started)
