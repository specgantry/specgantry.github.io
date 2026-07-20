---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry v7 — the CWJ loop, all three phases, the per-project north star, diagnostic routing, and release management.
permalink: /docs/how-it-works/
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills & Agents"
next_page_url: "/docs/skills"
---

# How SpecGantry v7 Works

A complete walkthrough of the pipeline and what happens at each phase.

---

## The CWJ Loop

Every phase in SpecGantry runs a Challenge-Write-Judge loop. What varies across phases is not the structure — it's who the challenger represents, what the write step produces, and what question the judge asks.

<div class="dg-wrap">
<div class="dg-diagram-title">The Challenge-Write-Judge Loop</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-shield-exclamation"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Challenge</div>
      <div class="dg-flow-node-desc">An adversarial agent asks what would block the next phase. Questions are specific to this project — not a generic checklist. Grouped by theme. The challenger never writes files.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-pencil-square"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Write / Build</div>
      <div class="dg-flow-node-desc">Every challenge is resolved. Ideation: user answers the full round in one response. Spec: write agent resolves autonomously into a developer contract. Code: plan agent designs the repair; build agent executes.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-patch-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Judge</div>
      <div class="dg-flow-node-desc">One question only: <em>"Would the next phase be blocked?"</em> Not "did this pass a rubric?" The judge is independent — it challenges the output, not the challenger. CLEAR exits. BLOCKED continues with specific gaps.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;padding:0.75rem">
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--green-50,#f0fdf4);border-radius:8px;border:1px solid rgba(34,197,94,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">✅</div>
      <strong style="color:var(--green-700,#15803d);font-size:.8rem">CLEAR</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Loop exits · next phase begins</div>
    </div>
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--amber-50,#fffbeb);border-radius:8px;border:1px solid rgba(245,158,11,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">🔄</div>
      <strong style="color:var(--amber-700,#b45309);font-size:.8rem">BLOCKED</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Gaps fed back · next cycle</div>
    </div>
    <div style="text-align:center;padding:0.6rem 0.5rem;background:var(--red-50,#fef2f2);border-radius:8px;border:1px solid rgba(239,68,68,.25)">
      <div style="font-size:1.1rem;margin-bottom:4px">⚠</div>
      <strong style="color:var(--red-700,#b91c1c);font-size:.8rem">CAPPED</strong>
      <div style="font-size:.72rem;color:var(--slate-500);margin-top:3px">Max cycles hit · user decides</div>
    </div>
  </div>

</div>
</div>

### Three different challengers — one loop

What makes the CWJ loop powerful is that each phase's challenger has a different adversarial identity:

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">01</div>
    <div class="dg-node-name">Ideation Challenger</div>
    <div class="dg-node-role">Senior developer pre-build</div>
    <div class="dg-node-output">"What would stop me agreeing to start? Are the capabilities clear? The data ownership? The tech choices? The UX model?" — fires up to 7 questions per round, user answers all at once</div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">02</div>
    <div class="dg-node-name">Spec Challenger</div>
    <div class="dg-node-role">Developer-proxy</div>
    <div class="dg-node-output">"I just got assigned this — what would block me building it? Loading state? Empty state? Error messages? Where does the output appear?" — fires up to 6 questions, resolved autonomously</div>
  </div>

  <div class="dg-node dg-build">
    <div class="dg-node-num">03</div>
    <div class="dg-node-name">Code Challenger</div>
    <div class="dg-node-role">User-proxy</div>
    <div class="dg-node-output">"Can I — as a user — actually accomplish what was promised? Does anything freeze while I wait? Can I get back from a dead end? Does failure tell me what to do next?" — reads source files, not the spec</div>
  </div>

</div>
</div>

### Exit conditions

| Exit | Trigger | What happens |
|---|---|---|
| **CLEAR** | Judge confirms next phase would not be blocked | Loop exits, next phase begins |
| **CAPPED** | Maximum cycles reached | Unresolved gaps surfaced to user: `[Y] Accept · [E] Fix · [X] Stop` |
| **CYCLING** | Identical blocking gaps across two consecutive cycles | Same as CAPPED |
| **Build failure** | Build agent hard failure | Exit immediately, surface to user |

Max iterations: ideation 5, spec 3, code 3 — configurable in `project-state.yaml`.

---

## The North Star

Each project has one `specs/north-star.md`. It is not a template — it is written from the actual idea during ideation and is specific to this system.

The document is flowing prose. No headings. No sections. Just paragraphs that describe what good looks like: what the user is owed, what design philosophy governs every decision, what the system must handle invisibly, what the user should never have to think about.

The north star grows. When the spec phase surfaces a new requirement, the write agent appends a paragraph. It never gets rewritten from scratch — it accumulates understanding over time.

It ends with a `---` rule and a flat list of the challenge questions that shaped it — the AI's thought process made visible to any reader, and available for future agents to use as context.

The north star is read whole — not section by section. Every challenger and judge at every phase reads the full document before forming any question or verdict.

---

## The Pipeline at a Glance

<div class="dg-wrap">
<div class="dg-diagram-title">SpecGantry v7 Pipeline</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation CWJ Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— high human interaction</span></div>
      <div class="dg-flow-node-desc">Adversarial challenge rounds → user answers all questions per round → judge readiness → write agent runs once on CLEAR</div>
      <div class="dg-flow-node-meta"><i class="bi bi-file-earmark-text"></i> north-star.md &nbsp;·&nbsp; <i class="bi bi-diagram-3"></i> architecture.md &nbsp;·&nbsp; <i class="bi bi-card-text"></i> intent.md × N</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Ideation complete · architecture written · all capabilities have intent.md</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Spec CWJ Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per capability · autonomous</span></div>
      <div class="dg-flow-node-desc">Developer-proxy challenge → write agent resolves into capability-spec.md → judge checks readiness → user approves once on CLEAR</div>
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
      <div class="dg-flow-node-title">Code CWJ Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per capability · fully automated</span></div>
      <div class="dg-flow-node-desc">Plan build approach → build end-to-end → user-proxy challenge traces the experience through source files → repair and repeat if blocked</div>
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
      <div class="dg-flow-node-title">Deploy Release</div>
      <div class="dg-flow-node-desc">North-star alignment check surfaces any capped capabilities · changelog updated · Dockerfiles, docker-compose, deploy.sh generated · release version bumped</div>
      <div class="dg-flow-node-meta"><i class="bi bi-file-code"></i> deploy.sh &nbsp;·&nbsp; <i class="bi bi-box"></i> Dockerfiles &nbsp;·&nbsp; <i class="bi bi-tag"></i> release versioned</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral">
    <div class="dg-flow-node-icon"><i class="bi bi-arrow-repeat"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">[N] New Work — post-release</div>
      <div class="dg-flow-node-desc">Investigate → classify as CODE_BUG / SPEC_GAP / REQUIREMENT_DRIFT / NEW_CAPABILITY → route to the right repair phase automatically</div>
    </div>
  </div>

</div>
</div>

Capabilities run in dependency order. The pipeline **interleaves spec and code per capability** — a capability is fully specced and built before the next is started (unless `auto_continue` is on).

---

## The Phases {#phases}

### Phase 1 — Ideation {#ideation}

**Output:** `specs/north-star.md` · `specs/architecture/architecture.md` · `specs/capabilities/[CAP-ID]/intent.md` per capability · `specs/project-state.yaml`

The ideation loop is the only phase with high human interaction. The challenge agent reads the vision and fires a round of blocking questions — specific to *this* project, not a fixed script. Up to 7 per round, grouped by theme. All questions surface at once. The user answers all of them in a single response.

The judge then evaluates whether a developer could start writing capability specs without inventing answers. Six criteria:
- The capability list is unambiguous
- The data model is inferable
- Technology choices leave no open decisions
- UX intent is clear
- No answer is "we'll figure it out"
- A spec agent would not need to invent any answer

If CLEAR, the write agent runs once — consolidating all answers into the north star, architecture, and intent files. If BLOCKED, another round.

The write agent runs **only on exit** — not per cycle. All ideation conversations converge into artifacts once understanding is sufficient.

Transition note after ideation:
```
✓ Ideation complete  ·  Recipe management · Tag and organise · Ingredient search
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```

---

### Phase 2 — Capability Spec {#spec}

**Output:** `specs/capabilities/[CAP-ID]/capability-spec.md` (≤80 lines, machine-challenged)

The spec loop is **fully autonomous** — the user does not interact during cycles. The challenge agent simulates a developer who has just been handed the intent file and asks "wait, but what about...?". The write agent resolves every challenge into a developer contract. The judge checks whether that contract would still leave a developer blocked.

**What the spec challenge agent looks for:**

| Dimension | What it surfaces |
|---|---|
| Loading states | "The intent says the system processes a file — synchronous or async? What does the user see during a 30-second wait?" |
| Empty states | "What does the screen look like when there's no data yet?" |
| Error states | "What message does the user see? Where does it appear? What can they do next?" |
| Output format | "Is it a list, a form, a detail view? Where does it appear?" |
| Navigation | "Where does the user come from? Where do they go after success? After failure?" |
| North star alignment | "Does the intent deliver on what the north star promises for this project?" |

**User checkpoint (once per capability):**

The user sees the spec only when the judge returns CLEAR:

```
✓ Spec validated — CAP-001: Recipe management
  All async states described, empty state covered, error messages specified with text and location.
  North star alignment confirmed: primary action placement specified.

  [Y] Approve spec   [E] Edit   [X] Hold
```

`[E]` → user's edit is prepended as a new challenge and the write agent resolves it before re-surfacing for approval.

---

### Phase 3 — Code {#build}

**Output:** Source files · `specs/capabilities/[CAP-ID]/build-report.yaml`

**Iteration 1 — Plan then build**

There is no challenge on iteration 1 — nothing has been built yet. The plan agent reads the capability spec, intent, and architecture, then produces a build approach: layer order, async patterns to apply upfront, implementation choices the spec leaves open, what to reuse from existing code. The build agent implements end-to-end from the plan.

**Code challenge — user-proxy**

After the build, the challenge agent traces the user's experience through the actual source code. It reads the north star and intent (not the spec — this is the user's perspective, not the developer's contract) and asks: "As a user, can I actually accomplish what this capability promises?"

It looks for:
- Whether the entry point is reachable
- Whether async operations show loading states
- Whether failure shows a human-readable message, not a raw error
- Whether there are dead ends after success or failure
- Design smells: multiple API calls where one would do, hardcoded values that should be configurable, business logic in the wrong layer

Each gap is classified as a **code gap** (spec implied this, code missed it — targeted repair) or a **spec gap** (north star requires this, spec never captured it — spec must be corrected first, then rebuild).

**Build transition notes:**
```
✓ Build complete · CAP-001  ·  quality: pass (1 cycle)
✓ Build complete · CAP-002  ·  quality: pass (2 cycles — loading state added to save action)
✓ Build complete · CAP-003  ·  quality: capped (3 cycles, 1 gap remains)
```

---

## Diagnostic Routing {#diagnostic-routing}

When something is wrong post-deploy, the investigate agent classifies the problem before any repair begins. The classification determines which phase gets fixed — and fixes the right thing.

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-build">
    <div class="dg-node-num"><i class="bi bi-bug"></i></div>
    <div class="dg-node-name">CODE_BUG</div>
    <div class="dg-node-output">Code doesn't match what the spec required. A targeted code edit is sufficient.<br><em>→ Re-enter code loop for the affected capability</em></div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num"><i class="bi bi-file-earmark-x"></i></div>
    <div class="dg-node-name">SPEC_GAP</div>
    <div class="dg-node-output">Code did what the spec said, but the spec was insufficient for what the north star requires.<br><em>→ Re-run spec phase, then rebuild</em></div>
  </div>

  <div class="dg-node dg-ideation">
    <div class="dg-node-num"><i class="bi bi-arrow-left-right"></i></div>
    <div class="dg-node-name">REQUIREMENT_DRIFT</div>
    <div class="dg-node-output">A requirement was misunderstood during ideation. Fixing the code or spec alone won't resolve it.<br><em>→ Amend north star + architecture, re-spec, rebuild</em></div>
  </div>

  <div class="dg-node dg-deploy">
    <div class="dg-node-num"><i class="bi bi-plus-circle"></i></div>
    <div class="dg-node-name">NEW_CAPABILITY</div>
    <div class="dg-node-output">Genuinely new work — not a fix to something existing. Scope needs to be defined first.<br><em>→ Re-enter ideation in amendment mode</em></div>
  </div>

</div>
</div>

This is why classifying first matters. Sending a spec gap to the code loop produces another iteration of the wrong repair. The right phase gets fixed.

---

## Release Management {#versioning}

| Change type | Bump |
|---|---|
| New work across capabilities | major: `1.0.0` → `2.0.0` |
| New capability or enhancement | minor: `1.0.0` → `1.1.0` |
| Bug fix only | patch: `1.0.0` → `1.0.1` |

**Changelog** (`specs/changelog.md`) is created on the first release after 1.0.0. It's append-only — one block per release. The spec write agent and code plan agent read it before referencing any field or interface, ensuring no capability in the new release uses something that was dropped or deprecated.

```markdown
## Release 1.1.0 — 2026-07-19
- Added: bulk import capability
- Deprecated: POST /api/recipes/add (use POST /api/recipes)
- Dropped: recipe.prep_time_string (use prep_time_minutes: integer)
```

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically. Token usage is stored in `specs/cost-log.ndjson`. Run `[$] Cost & insights` or `/track-cost` for a breakdown by Challenge/Write/Judge columns, by capability, and by release — plus iteration counts, challenge density, and outlier detection.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill command in detail — the v7 dashboard, all 12 agents, and workflow walkthroughs.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, state flags, design principles, and extension points.</span>
    </div>
  </a>
</div>
