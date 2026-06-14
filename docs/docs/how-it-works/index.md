---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry's pipeline — from raw idea to deployed system.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete walkthrough of the pipeline and what happens at each phase.

---

## The Pipeline at a Glance

<div class="dg-wrap">
<div class="dg-diagram-title">Pipeline at a Glance</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation</div>
      <div class="dg-flow-node-desc">Mature the idea · shape the system · propose story backlog</div>
      <div class="dg-flow-node-meta">architecture.md · project-state.yaml</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> ideation_complete</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-text"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Story Spec</div>
      <div class="dg-flow-node-desc">Spec each story before any code is written</div>
      <div class="dg-flow-node-meta">story-spec.md per story</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> spec_done per story</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-hammer"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Build</div>
      <div class="dg-flow-node-desc">Implementation · gap specs written if needed</div>
      <div class="dg-flow-node-meta">build-report.yaml · gap-YYYY-MM-DD.md (if any)</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> all stories built</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Deploy Release</div>
      <div class="dg-flow-node-desc">Deployment script · whole system · release version bumped</div>
      <div class="dg-flow-node-meta">deploy.sh · deploy-artifact.md</div>
    </div>
  </div>

</div>
</div>

Stories run in dependency order. Once all stories are built, you are prompted at a single confirmation point: gap specs (if any) are shown for review and merge, then you confirm to deploy.

---

## Video Overview

<div class="video-placeholder">
  <div class="video-placeholder-inner">
    <div class="video-icon">▶</div>
    <div class="video-text">
      <strong>SpecGantry Pipeline Walkthrough</strong>
      <span>Coming soon — a complete walkthrough of all phases from ideation to deployment.</span>
    </div>
  </div>
</div>

---

## The Phases {#phases}

### Phase 1 — Ideation {#ideation}

**Time:** 15–30 minutes
**Output:** `specs/architecture.md` · story backlog in `specs/project-state.yaml`

Ideation is a single conversation that does two things in sequence: matures the raw idea, then shapes the system. There is no separate architecture phase — the output of the conversation is the architecture.

**Beat 1 — Mature the idea**

SpecGantry acts as a thinking partner, not an interviewer. It reads your vision and reacts to it using one of three stances:

- **"Yes, and…"** — affirms the direction and extends it with something you may not have considered
- **"Fine, but…"** — accepts the premise but surfaces a tradeoff, constraint, or risk it creates
- **"What about…"** — probes a gap or edge case the vision didn't address

Four topics, one question each: vision, problem & users, constraints, risks & out of scope. After each answer, SpecGantry writes a synthesis — not a transcript of your words, but what it now understands to be true. You confirm a Beat 1 summary before moving on.

**Beat 2 — Shape the system**

Directly from the matured idea, SpecGantry proposes the system shape — tech stack, story boundaries, guardrails, and a dependency-ordered story backlog. Each topic is a proposal for you to confirm or redirect, not an open-ended question.

Everything is written to `specs/architecture.md` after every answer. A crash mid-session loses at most one exchange.

**Story granularity — Goldilocks rule:**
Stories are building blocks, not micro-tasks. A story is a vertical slice — something completable in 1–3 sessions and demonstrable independently. Related capabilities belong in one story. When in doubt, merge — a story can always be extended later via `[N] New work`.

---

### Phase 2 — Story Spec {#spec-gate}

**Time:** 5–15 minutes per story
**Output:** `specs/stories/STORY-NNN/story-spec.md`

No code is written until a complete spec exists.

The spec covers six sections:

1. **What the user can do** — user-facing capability and scope
2. **Screens and states** — UI flows and state transitions
3. **Data and backend** — data owned, APIs, persistence
4. **AI integration** — any AI-assisted behaviour in this story
5. **Enterprise checks** — auth, compliance, audit requirements
6. **Acceptance criteria** — conditions that must be true for the story to be done

Each section is written to disk immediately — sessions resume from the next incomplete section.

After all sections, guardrails from `architecture.md` are checked. Any violation blocks the spec until resolved. You self-review and confirm before build begins.

---

### Phase 3 — Build {#build}

**Time:** Depends on story complexity
**Output:** Source code committed · `specs/stories/STORY-NNN/build-report.yaml`

The build phase turns the confirmed spec into working code. The dev agent works through each acceptance criterion, implementing each one and verifying it works before moving to the next.

Key behaviors:
- Implements the full vertical slice — UI, backend, data layer, AI integration — exactly as specced
- Respects every guardrail in `architecture.md`
- Secrets and credentials come from environment variables — no literal values in source

A story is **complete** once all acceptance criteria are met.

---

### Gap Specs {#gap-specs}

If during development the spec is discovered to be incomplete, incorrect, or causes side-effects, a gap spec is written rather than editing the main spec directly:

**File:** `specs/stories/STORY-NNN/gap-YYYY-MM-DD.md`

The gap spec records: what changed, which files were affected, and a recommended spec update. The main specs remain stable.

Multiple gap specs can accumulate during a build cycle. They are resolved before deployment.

---

### Gap Merge (confirmed) {#gap-merge}

**Time:** 2–5 minutes
**Output:** Updated `story-spec.md` and/or `architecture.md` · gap files deleted

When all stories are built, SpecGantry checks for unmerged gap specs and presents them before deployment. If confirmed:
1. Each gap file is applied in chronological order
2. Each gap file is deleted after successful merge
3. A summary is shown before the deploy prompt

If no gaps exist, SpecGantry skips straight to the deploy prompt.

---

### Phase 4 — Deploy Release {#deploy}

**Time:** 5–10 minutes
**Output:** `specs/deploy.sh` + `specs/deploy-artifact.md`

Once all stories are built (and any gap specs are merged), you are prompted to confirm deployment.

The deployment agent:
1. Computes the next release version from change types in the backlog
2. Resolves deployment order via the dependency graph
3. Backs up the previous `deploy.sh` to `deploy.sh.old`
4. Generates a single `deploy.sh` covering all stories
5. Validates the script with `bash -n` and sets executable permissions
6. Writes `deploy-artifact.md` summarising the release
7. Marks all stories deployed and updates `project.release`

Every release deploys the **entire system** — not individual stories.

---

## Release Versioning {#versioning}

SpecGantry uses standard X.Y.Z semver. The version is a project-level concept — not per-story.

- Every project starts at `1.0.0`
- The version only changes when a release is deployed
- The bump is computed automatically from the highest-severity change type across all stories in the release:

| Change type | Bump | Example |
|---|---|---|
| `project_change` | major | `1.0.0` → `2.0.0` |
| `enhancement` or `new_story` | minor | `1.0.0` → `1.1.0` |
| `bug_fix` only | patch | `1.0.0` → `1.0.1` |

The initial release always deploys as `1.0.0`.

---

## The Architecture Artifact {#architecture-artifact}

`specs/architecture.md` is the single source of truth for the system. It contains:

- **Vision** — what the system is, who it's for, why it's worth building
- **Problem & Users** — user population, use case, success criteria
- **Constraints** — hard stops that architecture must respect
- **Risks & Out of Scope** — top risks with mitigations, explicit v1 deferral list
- **Tech Stack** — confirmed choices per layer
- **Guardrails** — enforceable rules every story must respect
- **Amendment blocks** — appended by gap merge; never overwrite prior content

Story specs **reference** this document rather than duplicating it. This keeps both the architecture and story specs slim.

---

## Handling Changes After Deployment {#post-deployment}

Use `[N] New work` at any point to describe new work — bug fix, enhancement, new story, or architectural change. SpecGantry classifies the work, reads the backlog and story specs to determine what's affected, confirms with you, and re-enters the pipeline.

| Type | What happens |
|---|---|
| `bug_fix` | Affected story identified from specs. All phase flags reset — full spec → build cycle. Deploy re-runs before next deploy. |
| `enhancement` | Same as bug_fix — spec updated with change annotations. |
| `new_story` | Ideation agent runs in amendment mode to assign ID, update backlog and architecture. Then normal pipeline. |
| `project_change` | Ideation agent runs in amendment mode first. Impacted story specs reset for re-spec. |

---

## Session Safety & Resumption

SpecGantry saves progress after every question, every answer, and every section. If a session is interrupted at any point, the next `/spec-gantry` picks up at the next unanswered item. This applies to all phases — ideation, story spec, and build.

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically. Token usage is stored in `specs/cost-log.ndjson` and committed to git. Run `[$] Cost` or `/track-cost` for a breakdown by phase, story, release, and model.

<div class="info">
  <strong>Cost data in git:</strong> <code>specs/cost-log.ndjson</code> is committed alongside your specs, giving you shared visibility into AI development costs over the full project lifetime.
</div>

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill command in detail — when to use each one and what it produces.</span>
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
