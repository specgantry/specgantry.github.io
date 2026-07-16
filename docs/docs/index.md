---
layout: docs
title: SpecGantry Documentation
description: Complete documentation for SpecGantry v6 — universal Plan-Produce-Evaluate loop for Claude Code. Quality validated at ideation, spec, and code — before anything ships.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

**Quality at every phase, not just at the end.** Architecture artifacts written once. Story specs machine-validated before a line of code is written. Code evaluated against a north star — not just a checklist. Three self-correcting loops that together produce software that works the way users actually need it to.

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## What Is SpecGantry?

SpecGantry is a Claude Code plugin that enforces a structured, self-correcting development process. The v6 insight: quality must be validated at every phase — not just when code is written. A thin spec produces bad code no matter how many code review iterations you run. SpecGantry catches gaps at the earliest possible moment.

Every phase runs the same universal loop: **Plan → Produce → Evaluate**. The evaluator holds both the output and the plan against a canonical north star. If the plan's goals were insufficient, the evaluator upgrades them — and the loop reruns with a richer target. This happens at ideation, spec, and code. Nothing exits a phase until the north star is satisfied.

<div class="dg-wrap">
<div class="dg-diagram-title">The SpecGantry v6 Pipeline</div>
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">01</div>
    <div class="dg-node-name">Ideation PPE Loop</div>
    <div class="dg-node-output">plan questions → ask → evaluate completeness → architecture/ artifacts · intent.md per story</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: ideation_complete + arch_seeded · north star: all 8 criteria met"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">02</div>
    <div class="dg-node-name">Spec PPE Loop — per story</div>
    <div class="dg-node-output">plan criteria → write spec → evaluate sufficiency → story-spec.md (machine-validated)</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: spec_done per story · north star: 9 criteria met"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-build">
    <div class="dg-node-num">03</div>
    <div class="dg-node-name">Code PPE Loop — per story</div>
    <div class="dg-node-output">plan build approach → build → evaluate correctness + experience → build-report.yaml</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-gate" title="Gate: all stories built:true · north star: 7 criteria met"><span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span></div><div class="dg-line"></div></div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num">04</div>
    <div class="dg-node-name">Deploy Release</div>
    <div class="dg-node-output">deploy.sh · gap specs merged · release versioned</div>
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
      <div class="doc-nav-desc">The PPE loop, all three phases, north stars, GOAL_GAP routing, gap flows, and release management.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-tools"></i></div>
    <div>
      <div class="doc-nav-title">Skills & Agents</div>
      <div class="doc-nav-desc">/spec-gantry and /track-cost — what they do, all 12 agents, the v6 dashboard, and every workflow covered.</div>
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
      <div class="doc-nav-desc">Common questions on installation, the PPE loop, costs, and troubleshooting.</div>
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
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

---

## Key Concepts

### The PPE Loop

Every phase in SpecGantry runs the same universal loop:

1. **Plan** — given the current goal, what must be produced and how?
2. **Produce** — execute the plan
3. **Evaluate** — did produce achieve the plan? did the plan cover the north star?

If the plan was right but execution was incomplete → **EXECUTION_GAP** → replan, same goal.  
If execution satisfied the plan but the plan missed a north star criterion → **GOAL_GAP** → evaluator upgrades the goal, replan.  
If all criteria are met → **ACHIEVED** → phase exits and hands off to the next phase.

This loop runs at ideation, spec, and code. Nothing exits a phase until the evaluator confirms the north star is satisfied.

### The North Stars

Each phase has a canonical quality bar the evaluator holds every output against — independently of what any plan says:

| Phase | North star question |
|---|---|
| Ideation | Can every architecture artifact be written without invented assumptions? |
| Spec | If built exactly as written, does the user get everything the intent promises? |
| Code | Does the running software deliver the full experience the intent describes? |

### The Architecture Layer

SpecGantry maintains a `specs/architecture/` directory with six structured files written during ideation:

| File | Contains |
|---|---|
| `data-model.md` | All entities, fields, types, relationships, state machines |
| `actors.md` | All roles, permissions, what each role can and cannot do |
| `contracts.md` | Shared API response shapes, error envelopes |
| `patterns.md` | Dominant backend interaction patterns |
| `ux.md` | Navigation model, visual system, component conventions, screen template |
| `deployment.md` | Cloud platform, registry, service architecture, secrets, CI/CD config |

These are written once during ideation and referenced by every story spec via a `reads:` block.

### The reads: Block

Every story spec declares exactly what it needs:

```yaml
reads:
  actors:    [applicant, admin]
  data:      [application, user]
  contracts: [submission-response, error-envelope]
  ux:        [component-conventions, screen-template]
```

The code produce agent resolves each entry and loads only those sections — approximately 130 lines of targeted context rather than the entire architecture.

### Specs Are the Memory

All knowledge lives in `specs/`. Architecture decisions, story intent, what was built, why gaps were made — all in plain-text YAML and Markdown, committed to git. Agents read from disk; nothing is duplicated in transition files or passed through parameters that could be derived from the canonical artifacts.

### State That Survives Anything

All progress is written after every answer and every phase transition. State flags in `project-state.yaml` tell the orchestrator exactly where to resume. A crash mid-loop restores from `.ppe-loop.yaml` — iteration count, prior verdict, and accumulated gaps — and re-enters at the plan step.

### Engagement Hooks

On every session start, SpecGantry checks whether `specs/project-state.yaml` exists. If it does, it installs `.claude/settings.json` hooks, a contract shell script, and `CONTRACT.md` — a binding directive injected into every Claude Code session. The `PostCompact` hook re-injects after every `/compact`. This runs in Node.js — not by Claude — and cannot be skipped.

---

## Who Should Use SpecGantry?

| Use Case | Why |
|---|---|
| New project from scratch | Ideation shapes your system. Specs are validated before code is written. Code is evaluated against what users actually need. |
| Existing codebase | Reverse engineering synthesizes the full architecture layer. Stub specs and anchor tags generated automatically. |
| Solo developer | Forces you to answer the hard questions before building. Prevents fast progress in the wrong direction. |
| Any project using Claude Code | Token cost visibility by plan/produce/eval, by story, by phase, by release. Know exactly what each feature cost and where. |

---

**Ready to begin?** → [Installation & First Steps →](/docs/getting-started)
