---
layout: docs
title: SpecGantry Documentation
description: SpecGantry is a Claude Code plugin that enforces a structured SDLC — ideation through deployment — with an adversarial review loop at every phase.
permalink: /docs/
next_page: "Getting Started"
next_page_url: "/docs/getting-started"
---

# SpecGantry Documentation

SpecGantry is a Claude Code plugin that keeps Claude on-process from idea to deployment. It challenges what you're building before code is written, and challenges the code before it ships.

<div class="info">
  <strong>New here?</strong> Start with the <a href="/docs/getting-started">Getting Started guide</a> — install and run your first session in under 5 minutes.
</div>

---

## How It Works

Every phase runs a **Challenge-Write-Judge (CWJ)** loop. An adversarial challenger asks what would block the next phase. A write agent resolves every gap. A judge asks one question: would the next phase still be blocked? CLEAR exits. BLOCKED iterates.

<div class="dg-wrap">
<div class="dg-diagram-title">The CWJ Loop — applied at every phase</div>
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num"><i class="bi bi-shield-exclamation"></i></div>
    <div class="dg-node-name">Challenge</div>
    <div class="dg-node-role">Adversarial agent</div>
    <div class="dg-node-output">Asks what would block<br>the next phase</div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num"><i class="bi bi-pencil-square"></i></div>
    <div class="dg-node-name">Write / Build</div>
    <div class="dg-node-role">Write or build agent</div>
    <div class="dg-node-output">Resolves every challenge<br>into an artifact or code</div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-build">
    <div class="dg-node-num"><i class="bi bi-patch-check"></i></div>
    <div class="dg-node-name">Judge</div>
    <div class="dg-node-role">Independent checker</div>
    <div class="dg-node-output">"Would the next phase<br>be blocked?" CLEAR or BLOCKED</div>
  </div>

</div>
</div>

The challenger's identity changes per phase:

| Phase | Challenger | Question |
|---|---|---|
| Ideation | Senior developer pre-build | "What would stop me agreeing to start?" |
| Spec | Developer-proxy | "What would block me building this?" |
| Code | User-proxy | "Can a user actually accomplish what was promised?" |

---

## The Pipeline

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">01</div>
    <div class="dg-node-name">Ideation</div>
    <div class="dg-node-output">north-star.md · architecture.md · intent.md per capability</div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-gate" title="Ideation complete · all capabilities have intent files">
      <span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span>
    </div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">02</div>
    <div class="dg-node-name">Spec</div>
    <div class="dg-node-output">capability-spec.md per capability · user approves once</div>
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
    <div class="dg-node-name">Code</div>
    <div class="dg-node-output">source files · build-report.yaml</div>
  </div>

  <div class="dg-connector">
    <div class="dg-line"></div>
    <div class="dg-gate" title="All capabilities built">
      <span class="dg-gate-icon"><i class="bi bi-lock-fill"></i></span>
    </div>
    <div class="dg-line"></div>
  </div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num">04</div>
    <div class="dg-node-name">Deploy</div>
    <div class="dg-node-output">Dockerfiles · deploy.sh · release versioned</div>
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
      <div class="doc-nav-desc">Install and run your first session in under 5 minutes.</div>
    </div>
  </a>
  <a href="/docs/how-it-works" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-gear"></i></div>
    <div>
      <div class="doc-nav-title">How It Works</div>
      <div class="doc-nav-desc">The CWJ loop, all phases, the north star, and diagnostic routing.</div>
    </div>
  </a>
  <a href="/docs/skills" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-tools"></i></div>
    <div>
      <div class="doc-nav-title">Skills & Agents</div>
      <div class="doc-nav-desc">The dashboard, all 12 agents, and every workflow covered.</div>
    </div>
  </a>
  <a href="/docs/architecture" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <div class="doc-nav-title">Reference</div>
      <div class="doc-nav-desc">File structure, state flags, and extension points.</div>
    </div>
  </a>
  <a href="/docs/faq" class="doc-nav-card">
    <div class="doc-nav-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <div class="doc-nav-title">FAQ</div>
      <div class="doc-nav-desc">Installation, the CWJ loop, costs, and troubleshooting.</div>
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

**[Getting Started →](/docs/getting-started)**
