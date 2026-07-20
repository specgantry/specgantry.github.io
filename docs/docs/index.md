---
layout: docs
title: SpecGantry Documentation
description: Complete documentation for SpecGantry v7 — adversarial Challenge-Write-Judge loop for Claude Code. Cognitive quality validation at ideation, spec, and code — before anything ships.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

**Quality challenged at every phase, not just at the end.** An adversarial challenger asks what would block a developer or user before anything is written or built. A per-project north star captures what good looks like for this specific idea. Capabilities are specced and built with a judge that answers one question: would the next phase be blocked?

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## What Is SpecGantry?

SpecGantry is a Claude Code plugin that enforces a structured, self-correcting development process using a **Challenge-Write-Judge (CWJ)** loop at every phase. The v7 insight: quality failures come from the wrong thing being built, not just the wrong way. An adversarial challenger at ideation asks what a senior developer would be blocked on before agreeing to start. A challenger at spec asks what a developer would be blocked on building from this document. A challenger at code asks whether a user can actually accomplish what was promised.

Nothing exits a phase until the judge says the next phase would not be blocked.

<div class="dg-wrap">
<div class="dg-diagram-title">The SpecGantry v7 Pipeline</div>
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">01</div>
    <div class="dg-node-name">Ideation CWJ Loop</div>
    <div class="dg-node-output">Adversarial challenge rounds · user answers · judge readiness · write artifacts on exit<br><em>north-star.md · architecture.md · intent.md × N</em></div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-gate" title="Ideation complete · architecture written · all capabilities have intent.md">
      <span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span>
    </div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">02</div>
    <div class="dg-node-name">Spec CWJ Loop</div>
    <div class="dg-node-output">Developer-proxy challenge · write developer contract · judge · user approves once<br><em>capability-spec.md per capability</em></div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-gate" title="Spec done per capability · user approved">
      <span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span>
    </div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-build">
    <div class="dg-node-num">03</div>
    <div class="dg-node-name">Code CWJ Loop</div>
    <div class="dg-node-output">Plan · build end-to-end · user-proxy challenge traces the experience · repair if blocked<br><em>source files · build-report.yaml</em></div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-gate" title="All capabilities built · build reports passing">
      <span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span>
    </div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num">04</div>
    <div class="dg-node-name">Deploy Release</div>
    <div class="dg-node-output">North-star alignment check · changelog updated · Dockerfiles · deploy.sh · release versioned</div>
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
      <div class="doc-nav-desc">The CWJ loop, all three phases, the north star, diagnostic routing, and release management.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-tools"></i></div>
    <div>
      <div class="doc-nav-title">Skills & Agents</div>
      <div class="doc-nav-desc">/spec-gantry and /track-cost — what they do, all 12 agents, the v7 dashboard, and every workflow covered.</div>
    </div>
  </a>
  <a href="/docs/architecture" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <div class="doc-nav-title">Reference</div>
      <div class="doc-nav-desc">File structure, state flags, agent ownership, CWJ loop objects, and how to extend SpecGantry.</div>
    </div>
  </a>
  <a href="/docs/faq" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <div class="doc-nav-title">FAQ</div>
      <div class="doc-nav-desc">Common questions on installation, the CWJ loop, developer intelligence, and troubleshooting.</div>
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

### The CWJ Loop

Every phase in SpecGantry runs a Challenge-Write-Judge loop. Each phase's challenger has a different adversarial identity:

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num"><i class="bi bi-shield-exclamation"></i></div>
    <div class="dg-node-name">Ideation Challenger</div>
    <div class="dg-node-role">Senior developer pre-build</div>
    <div class="dg-node-output">"What would stop me agreeing to start? Capabilities clear? Data ownership decided? Tech stack chosen?" · Up to 7 questions per round · User answers all at once</div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num"><i class="bi bi-person-gear"></i></div>
    <div class="dg-node-name">Spec Challenger</div>
    <div class="dg-node-role">Developer-proxy</div>
    <div class="dg-node-output">"I just got assigned this — loading state? Empty state? Error messages? Where does output appear?" · Up to 6 questions · Resolved autonomously by write agent</div>
  </div>

  <div class="dg-node dg-build">
    <div class="dg-node-num"><i class="bi bi-person-check"></i></div>
    <div class="dg-node-name">Code Challenger</div>
    <div class="dg-node-role">User-proxy</div>
    <div class="dg-node-output">"Can I — as a user — actually accomplish what was promised? Does it freeze while I wait? Can I recover from an error?" · Reads source files, not the spec</div>
  </div>

</div>
</div>

If the judge says CLEAR → phase exits. If BLOCKED → another cycle. The loop caps at a configurable maximum and surfaces unresolved gaps to the user.

### The North Star

Each project has a single `specs/north-star.md` — flowing prose written during ideation from the actual idea. No headings, no sections. Just paragraphs describing what good looks like for this system specifically: what the user is owed, what design philosophy governs decisions, what the system should handle invisibly.

It ends with a flat list of the challenge questions that shaped it — the AI's thought process made visible.

The north star grows. When the spec phase surfaces a new requirement, the write agent appends a paragraph. It never gets rewritten from scratch — it accumulates understanding.

### Capabilities

Work units are capabilities (`CAP-001`, `CAP-002`, etc.) — cohesive build units defined by what the system does end-to-end. Each lives under `specs/capabilities/[CAP-ID]/` with an `intent.md` (the experience promise) and a `capability-spec.md` (the developer contract).

### Changelog

`specs/changelog.md` is an append-only record of what changed between releases. Spec and code agents read it before referencing any field or interface — preventing the use of dropped or deprecated APIs in new releases.

### Diagnostic Routing

When something is wrong, the investigate agent classifies the problem before routing to repair:
- `CODE_BUG` → re-enter code loop for the affected capability
- `SPEC_GAP` → re-run spec, then rebuild
- `REQUIREMENT_DRIFT` → amend north star and architecture, re-spec and rebuild
- `NEW_CAPABILITY` → re-enter ideation in amendment mode

The right phase gets fixed. Not always code.

### Specs Are the Memory

All knowledge lives in `specs/`. North star, architecture decisions, capability intent, what was built, why — all in plain-text YAML and Markdown, committed to git. Agents read from disk. Nothing is duplicated in transition files or passed through parameters that could be derived from canonical artifacts.

### State That Survives Anything

All progress is written after every answer and every phase transition. State flags in `project-state.yaml` tell the orchestrator exactly where to resume. A crash mid-session loses at most one in-progress answer — everything confirmed before that is on disk and the pipeline resumes exactly where it left off.

---

## Who Should Use SpecGantry?

| Use Case | Why |
|---|---|
| New project from scratch | The north star captures the idea before a line of code is written. Capabilities are challenged before they're specced. Code is challenged from the user's perspective before it's shipped. |
| Existing codebase | Reverse engineering synthesizes north-star.md, architecture.md, and capability stubs from existing code. Anchor tags added automatically. |
| Solo developer | Forces the hard cognitive questions before building. Prevents fast progress in the wrong direction. |
| Any project using Claude Code | Developer intelligence: which capabilities were expensive, how many challenge cycles ran, what patterns kept getting challenged, release-over-release comparison. |

---

**Ready to begin?** → [Installation & First Steps →](/docs/getting-started)
