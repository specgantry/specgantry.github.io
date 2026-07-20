---
layout: docs
title: How It Works
description: The CWJ loop, all three phases, the north star, diagnostic routing, and release management.
permalink: /docs/how-it-works/
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills & Agents"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

---

## The Challenge-Write-Judge Loop

Every phase runs the same loop. The structure is identical — what changes is who the challenger represents.

<div class="dg-wrap">
<div class="dg-diagram-title">The Challenge-Write-Judge Loop</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-shield-exclamation"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Challenge</div>
      <div class="dg-flow-node-desc">An adversarial agent asks what would block the next phase — specific to this project, not a checklist. Up to 7 questions grouped by theme. Never writes files.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-pencil-square"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Write / Build</div>
      <div class="dg-flow-node-desc">Every challenge resolved. Ideation: user answers all questions in one response. Spec: write agent resolves autonomously. Code: plan agent designs the approach, build agent implements.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-patch-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Judge</div>
      <div class="dg-flow-node-desc">One question only: <em>"Would the next phase be blocked?"</em> Independent — challenges the output, not the challenger. CLEAR exits the loop. BLOCKED continues with specific gaps.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;padding:0.75rem">
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--green-50,#f0fdf4);border-radius:8px;border:1px solid rgba(34,197,94,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">✅</div>
      <strong style="color:var(--green-700,#15803d);font-size:.8rem">CLEAR</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Phase exits</div>
    </div>
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--amber-50,#fffbeb);border-radius:8px;border:1px solid rgba(245,158,11,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">🔄</div>
      <strong style="color:var(--amber-700,#b45309);font-size:.8rem">BLOCKED</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Next cycle</div>
    </div>
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--red-50,#fef2f2);border-radius:8px;border:1px solid rgba(239,68,68,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">⚠</div>
      <strong style="color:var(--red-700,#b91c1c);font-size:.8rem">CAPPED</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Max cycles · user decides</div>
    </div>
  </div>

</div>
</div>

Each phase's challenger has a different adversarial identity:

| Phase | Challenger identity | Resolved by |
|---|---|---|
| Ideation | Senior developer — "what would stop me agreeing to start?" | User answers all questions per round |
| Spec | Developer-proxy — "what would block me building from this?" | Write agent, autonomously |
| Code | User-proxy — "can I actually accomplish what was promised?" | Plan + build agent repair loop |

Max iterations: ideation 5, spec 3, code 3 — configurable in `project-state.yaml`.

---

## The Pipeline

<div class="dg-wrap">
<div class="dg-diagram-title">SpecGantry Pipeline — phases and gates</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— high human interaction</span></div>
      <div class="dg-flow-node-desc">Challenge rounds → user answers all questions → judge readiness → write agent runs once on CLEAR</div>
      <div class="dg-flow-node-meta"><i class="bi bi-file-earmark-text"></i> north-star.md &nbsp;·&nbsp; <i class="bi bi-diagram-3"></i> architecture.md &nbsp;·&nbsp; <i class="bi bi-card-text"></i> intent.md × N</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Ideation complete · all capabilities have intent.md</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Spec <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per capability · autonomous</span></div>
      <div class="dg-flow-node-desc">Developer-proxy challenge → write agent resolves into capability-spec.md → judge checks → user approves once on CLEAR</div>
      <div class="dg-flow-node-meta"><i class="bi bi-file-earmark-richtext"></i> capability-spec.md &nbsp;·&nbsp; <i class="bi bi-person-check"></i> user approves once</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Spec done per capability · user approved</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-hammer"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Code <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per capability · fully automated</span></div>
      <div class="dg-flow-node-desc">Plan build approach → build end-to-end → user-proxy challenge traces the experience through source files → repair if blocked</div>
      <div class="dg-flow-node-meta"><i class="bi bi-code-square"></i> source files &nbsp;·&nbsp; <i class="bi bi-clipboard2-check"></i> build-report.yaml</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;All capabilities built · build reports passing</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Deploy</div>
      <div class="dg-flow-node-desc">North-star alignment check · changelog updated · Dockerfiles + docker-compose + deploy.sh generated · release version bumped</div>
      <div class="dg-flow-node-meta"><i class="bi bi-file-code"></i> deploy.sh &nbsp;·&nbsp; <i class="bi bi-box"></i> Dockerfiles &nbsp;·&nbsp; <i class="bi bi-tag"></i> release versioned</div>
    </div>
  </div>

</div>
</div>

---

## Phase Details {#phases}

### Ideation {#ideation}

The ideation loop is the only phase with high human interaction. The challenge agent reads your vision and fires a round of up to 7 blocking questions — grouped by theme, specific to this project. You answer all of them in one response. The judge asks whether a developer could start writing specs without inventing any answer. CLEAR → write agent runs once, producing:

- `specs/north-star.md` — flowing prose, no headings. What good looks like for this system specifically. Grows across the lifecycle; never rewritten.
- `specs/architecture/architecture.md` — all technical decisions in one file with `## section:name` anchors. Written once at ideation exit; extended via amendment.
- `specs/capabilities/[CAP-ID]/intent.md` — 2-paragraph experience promise per capability.

Transition note:
```
✓ Ideation complete  ·  Recipe management · Tag and organise · Ingredient search
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```

---

### Spec {#spec}

Fully autonomous — no user interaction during cycles. The challenge agent simulates a developer handed the intent file and asks "what would I be blocked on building this?" Covers: loading and async states, empty states, error messages with text and location, output format, navigation flow, and north-star alignment.

User checkpoint appears once, after the judge returns CLEAR:

```
✓ Spec validated — CAP-001: Recipe management
  All async states described, empty state covered, error messages specified.
  North star alignment confirmed.

  [Y] Approve spec   [E] Edit   [X] Hold
```

`[E]` → your edit is prepended as a new challenge and the write agent resolves it before re-surfacing.

---

### Code {#build}

On iteration 1: plan agent reads the spec and produces a build approach — layer order, async patterns, what to reuse, riskiest part. Build agent implements end-to-end.

After each build, the code challenge agent traces the user's experience through the **actual source files** (not the spec). It asks: as a user, can I accomplish what was promised? Each gap is classified:

- **Code gap** — spec implied this, code missed it → targeted repair
- **Spec gap** — north star requires this, spec never captured it → re-run spec phase first, then rebuild

Build transition notes:
```
✓ Build complete · CAP-001  ·  quality: pass (1 cycle)
✓ Build complete · CAP-002  ·  quality: pass (2 cycles — loading state added)
✓ Build complete · CAP-003  ·  quality: capped (3 cycles, 1 gap remains)
```

---

## Diagnostic Routing {#diagnostic-routing}

When something is wrong post-deploy, the investigate agent classifies the root cause before any repair begins.

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-build">
    <div class="dg-node-num"><i class="bi bi-bug"></i></div>
    <div class="dg-node-name">CODE_BUG</div>
    <div class="dg-node-output">Code doesn't match the spec.<br>→ Re-enter code loop</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-line"></div></div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num"><i class="bi bi-file-earmark-x"></i></div>
    <div class="dg-node-name">SPEC_GAP</div>
    <div class="dg-node-output">Code did what spec said, spec was insufficient.<br>→ Re-run spec, then rebuild</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-line"></div></div>

  <div class="dg-node dg-ideation">
    <div class="dg-node-num"><i class="bi bi-arrow-left-right"></i></div>
    <div class="dg-node-name">REQUIREMENT_DRIFT</div>
    <div class="dg-node-output">Misunderstood at ideation.<br>→ Amend north star, re-spec, rebuild</div>
  </div>

  <div class="dg-connector"><div class="dg-line"></div><div class="dg-line"></div></div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num"><i class="bi bi-plus-circle"></i></div>
    <div class="dg-node-name">NEW_CAPABILITY</div>
    <div class="dg-node-output">Genuinely new work.<br>→ Ideation in amendment mode</div>
  </div>

</div>
</div>

A spec gap sent to the code loop will never converge — the spec must be corrected first. Classification ensures the right phase is fixed.

---

## Release Management {#versioning}

| Change type | Version bump |
|---|---|
| New work across capabilities | major |
| New capability or enhancement | minor |
| Bug fix only | patch |

`specs/changelog.md` is append-only — one block per release. Spec write and code plan agents read it before referencing any field or interface, preventing new capabilities from using dropped or deprecated APIs.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>The dashboard, all 12 agents, and workflow walkthroughs.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, state flags, and extension points.</span>
    </div>
  </a>
</div>
