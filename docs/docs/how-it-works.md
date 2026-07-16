---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry v6 — the universal PPE loop, all three phases, north stars, GOAL_GAP routing, gap flows, and release management.
permalink: /docs/how-it-works/
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills & Agents"
next_page_url: "/docs/skills"
---

# How SpecGantry v6 Works

A complete walkthrough of the pipeline and what happens at each phase.

---

## The Universal PPE Loop

Every phase in SpecGantry runs the same parameterized loop. What varies across phases is not the structure — it's the goal, the agents, and the north star.

<div class="dg-wrap">
<div class="dg-diagram-title">The Universal Plan-Produce-Evaluate Loop</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-neutral">
    <div class="dg-flow-node-icon"><i class="bi bi-bullseye"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Goal</div>
      <div class="dg-flow-node-desc">Derived from canonical artifacts on disk — intent.md, story-spec.md, architecture artifacts, north star document. Not passed as a parameter.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-list-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Plan</div>
      <div class="dg-flow-node-desc">Given the goal and prior iteration context, determines exactly what to produce and how. Reads the north star to challenge whether the goal itself is sufficient.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-pencil-square"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Produce</div>
      <div class="dg-flow-node-desc">Executes the plan. For ideation: asks questions, writes artifacts. For spec: writes story-spec.md. For code: builds the full story.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-shield-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Evaluate</div>
      <div class="dg-flow-node-desc">Two simultaneous checks: (1) did produce execute the plan? (2) did the plan cover the north star? Either failure loops back with a richer goal.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral" style="display:flex;flex-direction:row;gap:1rem;padding:0.5rem">
    <div style="flex:1;text-align:center;padding:0.5rem;background:var(--green-50,#f0fdf4);border-radius:6px">
      <strong style="color:var(--green-700,#15803d)">ACHIEVED</strong><br/>
      <span style="font-size:.8rem">North star met → exit phase,<br/>hand off to next</span>
    </div>
    <div style="flex:1;text-align:center;padding:0.5rem;background:var(--amber-50,#fffbeb);border-radius:6px">
      <strong style="color:var(--amber-700,#b45309)">EXECUTION_GAP</strong><br/>
      <span style="font-size:.8rem">Plan was right, produce missed<br/>→ replan, same goal</span>
    </div>
    <div style="flex:1;text-align:center;padding:0.5rem;background:var(--red-50,#fef2f2);border-radius:6px">
      <strong style="color:var(--red-700,#b91c1c)">GOAL_GAP</strong><br/>
      <span style="font-size:.8rem">Plan missed north star<br/>→ upgrade goal, replan</span>
    </div>
  </div>

</div>
</div>

### Exit conditions — how the loop stops

Each phase has a hard cap and an escalation path:

| Exit | Trigger | What happens |
|---|---|---|
| **ACHIEVED** | Evaluator confirms north star met | Phase exits, next phase begins |
| **CAPPED** | `iteration_N >= max_iterations` | Unresolved gaps surfaced to user: `[Y] Accept · [E] Fix · [X] Stop` |
| **CYCLING** | Identical gaps across two consecutive iterations after a goal upgrade | Same as CAPPED |
| **Build failure** | Produce agent hard failure | Exit immediately, surface to user |

Max iterations: ideation 3, spec 2, code 3 — configurable in `project-state.yaml → ppe_loop`.

---

## The Three North Stars

Each phase has a canonical quality bar that the evaluator holds every output against — independently of what any plan says. No plan can redefine them.

<div class="dg-wrap">
<div class="dg-node-graph">

  <div class="dg-node dg-ideation">
    <div class="dg-node-num">NS1</div>
    <div class="dg-node-name">Ideation North Star</div>
    <div class="dg-node-output">"Can every architecture artifact be written without invented assumptions?" — 8 criteria covering actors, data entities, UX conventions, tech stack, deployment, story completeness</div>
  </div>

  <div class="dg-node dg-spec">
    <div class="dg-node-num">NS2</div>
    <div class="dg-node-name">Spec North Star</div>
    <div class="dg-node-output">"If built exactly as written, does the user get everything the intent promises?" — 9 criteria covering async states, output format, error handling, flow completeness, unambiguous criteria</div>
  </div>

  <div class="dg-node dg-build">
    <div class="dg-node-num">NS3</div>
    <div class="dg-node-name">Code North Star</div>
    <div class="dg-node-output">"Does the running software deliver the full experience the intent describes?" — 7 criteria covering feedback throughout async ops, output format fitness, error surfaces, flow completeness</div>
  </div>

</div>
</div>

The north stars are the reason SpecGantry catches what code review loops miss. A spec that says "display the result" will pass a compliance check — but fail the spec north star criterion "every async operation communicates state throughout." The evaluator catches the gap before any code is written.

---

## The Pipeline at a Glance

<div class="dg-wrap">
<div class="dg-diagram-title">Pipeline at a Glance</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation PPE Loop</div>
      <div class="dg-flow-node-desc">plan what to ask → ask questions → evaluate architecture completeness against north star → iterate until ACHIEVED</div>
      <div class="dg-flow-node-meta">architecture.md · 5 artifact files · intent.md per story · project-state.yaml</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> ideation_complete · NS1 all 8 criteria met</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-text"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Spec PPE Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per story</span></div>
      <div class="dg-flow-node-desc">plan what the spec must capture → write story-spec.md → evaluate spec sufficiency against north star → iterate until ACHIEVED → user approves a machine-validated spec</div>
      <div class="dg-flow-node-meta">story-spec.md · intent.md (finalised)</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> spec_done per story · NS2 all 9 criteria met</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-hammer"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Code PPE Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— per story</span></div>
      <div class="dg-flow-node-desc">plan build approach → build full story → evaluate code + experience against north star → repair if needed → GOAL_GAP triggers spec update before rebuild</div>
      <div class="dg-flow-node-meta">build-report.yaml (quality block) · gap.md (if any)</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> all stories built · NS3 all 7 criteria met</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Deploy Release</div>
      <div class="dg-flow-node-desc">Gap specs merged · deployment script generated · whole system deployed · release version bumped</div>
      <div class="dg-flow-node-meta">deploy.sh · deploy-artifact.md</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral">
    <div class="dg-flow-node-icon"><i class="bi bi-arrow-repeat"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">[N] New work — post-release modifications</div>
      <div class="dg-flow-node-desc">Bug fix or enhancement: investigate → build → full code PPE loop → re-deploy</div>
    </div>
  </div>

</div>
</div>

Stories run in dependency order and the pipeline **interleaves spec and code per story** — a story is fully built before the next is specced.

---

## The Phases {#phases}

### Phase 1 — Ideation {#ideation}

**Output:** `specs/architecture/` (6 artifacts) · story backlog in `specs/project-state.yaml`

**Quick-start mode**

After entering a project name and vision, SpecGantry checks whether the project is simple — no authentication, no AI integration, single actor, three or fewer capabilities. If so:

```
This looks like a simple single-user app. I'll apply these defaults and ask only 3 questions:

  Defaults applied:  Node.js · SQLite · Bootstrap 5 · Docker Hub · single-user · no auth
  Questions:         tech stack confirm · Docker Hub username · story list

  [>] Quick start
  [F] Full ideation  (10 topics, shape every decision yourself)
```

Quick-start sets sensible defaults for all architecture sections and asks three focused questions. The story list proposal includes a one-line scope under each title so you know exactly what each story covers:

```
Proposed stories — 3 total

  ID        Title                                         Depends on
  ──────────────────────────────────────────────────────────────────
  STORY-001  Manage recipes                               —
             add, view, edit, and delete recipes
  STORY-002  Tag and organise recipes                     STORY-001
             create tags and attach them to recipes
  STORY-003  Search recipes by ingredient                 STORY-001
             find recipes that contain a given ingredient
```

If stories share data without a blocking dependency, the proposal also shows `reads ... from:` annotations — surfacing implicit data relationships before spec writing begins.

**Full ideation — Beat 1 and Beat 2**

Full ideation uses a thinking-partner stance — three stances:
- **"Yes, and…"** — affirms the direction and extends it
- **"Fine, but…"** — accepts the premise but surfaces a tradeoff
- **"What about…"** — probes a gap the vision didn't address

The opening turn shows a topic roadmap so you know what the conversation covers:

```
Topics ahead: vision · users · constraints · risks · tech stack ·
              auth+config · UX model · deployment · stories  (9 topics, ~9 turns)
```

Everything is flushed to disk after every answer. A crash mid-session loses at most one exchange.

**Ideation PPE loop**

After the produce agent completes, the ideation evaluator checks all 8 north star criteria against the written artifacts. If the deployment target is `_not yet written_`, if no actor has explicit capabilities defined, if the story list combines two distinct capabilities into one story — these are caught before spec begins. The loop iterates until the north star is fully met.

Transition note after ideation:
```
✓ Ideation complete  ·  Manage recipes · Tag and organise · Search by ingredient
```

---

### Phase 2 — Story Spec {#spec}

**Output:** `specs/stories/STORY-NNN/story-spec.md` (≤60 lines, machine-validated)

The spec loop runs before any code is written. The spec-plan-agent reads `intent.md`, the architecture, and the spec north star, then derives what the spec must capture — thinking like a product head, not a format checker.

**What the spec north star catches**

The spec evaluator checks 9 criteria against the written spec:

| Criterion | What it catches |
|---|---|
| Visible triggers | "the user submits" without specifying the button label or location |
| Async feedback throughout | No loading state described for an async AI call — spec only says "display result" |
| Output format | "display the AI output" without specifying format or container |
| Error states with recovery | "show an error message" without specifying message content or recovery action |
| Flow completeness | Success state not described — user completes action but spec doesn't say what happens |
| Unambiguous criteria | Any criterion using "graceful", "appropriate", "responsive" without concrete definition |
| Edge cases from intent | intent.md says "handle when no results found" but spec has no criterion for empty state |
| Complete interfaces | Missing auth, guard conditions, or error codes on endpoints |
| Layout decisions | Screen contents described but no layout structure specified |

When gaps are found, the evaluator either re-runs the spec plan (EXECUTION_GAP — plan was right, produce missed something) or upgrades the goal (GOAL_GAP — plan itself didn't cover the criterion). In both cases the spec is updated before the user ever sees it.

**User approval**

The user sees a machine-validated approval prompt:

```
✓ Story spec validated — STORY-002: AI Text Generator

  North star:  all 9 criteria confirmed
  Loop:        2 iterations — async loading and streaming display criteria added

  [Y] Approve spec   [E] Edit   [X] Hold
```

The user is approving a spec that has already been challenged by a product-head-level evaluator — not a first draft.

---

### Phase 3 — Code {#build}

**Output:** Source code · `specs/stories/STORY-NNN/build-report.yaml`

**Iteration 1 — Plan then build**

The code-plan-agent runs first on every iteration including the first. On iteration 1 it produces a build approach — layer order, async patterns to apply upfront, implementation choices the spec's experience requirements demand. The produce agent builds against this plan, not just against the spec.

**Code PPE loop**

After each build, the code evaluator checks two things simultaneously:

1. **Quality dimension rubric** — spec adherence, contract fidelity, input validation, UI completeness, state consistency, and more. Dimensions activated dynamically based on what the story contains.

2. **Code north star** — 7 criteria evaluated against the experience contract derived from `intent.md` and `story-spec.md`:

| Criterion | What it catches |
|---|---|
| Async feedback throughout | AI call buffered — user sees nothing until complete, no loading indicator |
| Output format fits content | AI text rendered as raw JSON string or in an overflow container |
| Error states readable | `catch(e) { console.error(e) }` with no user-facing message |
| Full flow completable | Form submits but success state doesn't update the UI |
| No locked-in rigidity | Core algorithm hard-coded against a single case when intent implies extensibility |
| State consistent after mutations | Deleted item reappears on next render — list not invalidated |

**GOAL_GAP — spec update mid-build**

If code satisfies all spec dimensions but fails a north star criterion because the spec never required that behaviour, the evaluator returns GOAL_GAP. The orchestrator surfaces a banner and automatically updates the spec before rebuilding:

```
⚠ Code eval found a spec gap — STORY-006: AI cover letter drafting
  Gap: AI response is buffered — spec did not require streaming display
  Updating spec now and rebuilding — no action needed.
```

After the spec update and rebuild:

```
✓ Spec updated + rebuilt · STORY-006  ·  quality: pass
  Gap resolved: streaming display criterion added
```

**Quality outcomes**

| Status | Meaning |
|---|---|
| `pass` | All dimensions and north star criteria cleared |
| `partial` | Same dimensions still failing after approach-change repair — usually a spec ambiguity |
| `capped` | Max iterations (default 3) reached with unresolved dimensions |
| `build_failed` | Produce agent returned a hard failure |

Build transition note:
```
✓ Build complete · STORY-001  ·  quality: pass (2 iters — loading state added to save action)
```

---

## GOAL_GAP Cross-Phase Routing {#goal-gap}

When the code evaluator finds that a spec was insufficient for the north star, it routes back to the spec phase — not to a code repair. This is the key difference from a simple evaluate→repair loop:

```
Code eval → GOAL_GAP
  ↓
Spec PPE loop re-runs with upgraded goal
  → ACHIEVED → full code rebuild (iteration 1 fresh)
  → CAPPED   → surface to user [Y] Accept / [X] Stop

Code PPE loop restarts at iteration 1
```

This is capped at one spec→code re-entry per story. If code eval returns GOAL_GAP a second time after a spec repair, the loop exits CAPPED and surfaces to the user.

---

## Gap Specs {#gap-specs}

If during development the spec is discovered to be incomplete or has side-effects on other stories, the code produce agent writes to `specs/stories/STORY-NNN/gap.md` rather than editing the spec directly. Multiple discoveries accumulate as additional bullets in the same file — no new files are created.

### Gap Merge {#gap-merge}

When all stories are built, SpecGantry checks for unmerged gap files and presents any it finds. After confirmation, each gap is merged into the story spec in place. Each `gap.md` is deleted after successful merge.

---

## Auto-Continue Mode {#auto-continue}

Type `[>]` to enable auto-continue. The pipeline runs without pausing at spec approval prompts, moving from ideation through spec through build without stopping — until a genuine decision point:

- A concern raised by a subagent
- An arch/spec gap requiring resolution
- All stories built (deploy requires explicit confirmation)
- A CAPPED or CYCLING loop exit

When auto-continue pauses, you see a log of everything that happened while it ran, grouped by phase:

```
  While running:
    Spec
      ✓ [001]: User authentication  (2 loops — post-login redirect per role added)
      ✓ [002]: Company posts a job  (1 loop — passed first pass)
      ✓ [003]: Admin reviews applications  (1 loop — passed first pass)
    Build
      ✓ [001]: User authentication  · quality: pass (2 iters — login loading state added)
      ✓ [002]: Company posts a job  · quality: pass (1 iter)
      ⚠ [003]  · AI response buffered — updating spec
      ✓ [003]  · spec updated + rebuilt

⏸ Auto-run complete — all stories built. Use [1] Deploy release 1.0.0 to proceed.
```

---

## Reverse Engineering an Existing Codebase {#reverse-engineering}

If `/spec-gantry` is run in a directory that has source files but no `specs/` folder, it offers to scan the existing codebase and generate an architecture, story backlog, and anchor tags. After confirmation, the pipeline picks up from spec for any unbuilt stories.

---

## Release Versioning {#versioning}

| Change type | Bump |
|---|---|
| `project_change` | major: `1.0.0` → `2.0.0` |
| `enhancement` or `new_story` | minor: `1.0.0` → `1.1.0` |
| `bug_fix` only | patch: `1.0.0` → `1.0.1` |

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically. Token usage is stored in `specs/cost-log.ndjson` and committed to git. Run `[$] Cost` or `/track-cost` for a breakdown by Plan/Produce/Eval columns, by story, and by release.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill command in detail — the v6 dashboard, all 12 agents, and workflow walkthroughs.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, security model, design principles, and extension points.</span>
    </div>
  </a>
</div>