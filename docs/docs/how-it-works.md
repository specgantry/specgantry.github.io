---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry v5 — batched-by-topic ideation, bounded push-back, cache-first context ordering, and the architecture layer that every phase references.
permalink: /docs/how-it-works/
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills & Agents"
next_page_url: "/docs/skills"
---

# How It Works

SpecGantry enforces a structured development process through a series of phases with hard gates between them. v5 introduced the shared architecture layer — written once during ideation, never duplicated per story. **v5** builds on that foundation with these developer-experience and rigor changes:

- **Batched-by-topic ideation** — each topic asks its full set of related sub-questions in one form. New-project ideation lands in ~9 turns (was ~20); amendment mode targets ≤ 3 turns.
- **Bounded raise-a-concern** — story-spec and development subagents may flag one high-impact concern per invocation (untestable criterion, missing owner, spec/code drift, reuse opportunity) with a proposed alternative. You decide: apply, keep, or edit spec first. Every resolved concern is recorded in `specs/concerns-log.ndjson`.
- **Cache-first context ordering** — every subagent reads a shared preamble first, then `architecture.md`, then per-story files. Stable-first ordering maximizes prompt-cache reuse across the session.
- **Auto-continue mode (v5.1)** — the `[>] Run to next pause` action queues the pipeline to auto-approve specs (that raise no concern) and roll straight into build. Auto-continue clears back to manual on any concern, gap, deploy point, or error, so you're only interrupted when something needs your eyes.
- **Cross-story impact revalidation (v5.2)** — every enhancement auto-invokes story-spec in a read-only recheck mode for each dependent story. If any dependent's `reads:` refs no longer resolve or its contracts/entities are at drift risk, you get a batched summary before build starts.
- **Machine-readable contracts (v5.2)** — every `## contract:[name]` section now carries an OpenAPI 3.1 or JSON Schema fenced block alongside the prose. Enables mock servers, client generation, and contract testing later without rewriting specs.

Story-spec and reverse-engineer moved to Haiku in v5.1 — cost tracking is updated automatically.

---

## The Architecture Layer {#architecture-layer}

The central v5 change is a dedicated `specs/architecture/` directory containing six structured files. These are the shared source of truth for every downstream agent.

| File | Anchor format | Contains |
|------|--------------|----------|
| `data-model.md` | `## entity:[name]` | Entities, fields, types, FK references, state machines, ownership |
| `actors.md` | `## actor:[name]` | Roles, what each role can/cannot do, entity ownership |
| `contracts.md` | `## contract:[name]` | Shared API response shapes, error envelopes |
| `patterns.md` | `## pattern:[name]` | Dominant backend interaction patterns (REST, ORM, state machine location) |
| `ux.md` | `## ux:[name]` | Navigation model, visual system, component conventions, screen template |

All five files are seeded by the ideation agent after the story list and UX model are confirmed. They are never written from scratch again — only appended to or amended.

### The Artifact Index

The last section of `architecture.md` is the Artifact Index — a fenced YAML block that maps artifact types to file paths and named sections. Agents parse it to know exactly where to find each artifact without scanning the directory.

```
## Artifact Index

data-model:
  file: specs/architecture/data-model.md
  entities: [application, user, review]

actors:
  file: specs/architecture/actors.md
  roles: [applicant, admin]

contracts:
  file: specs/architecture/contracts.md
  shapes: [submission-response, error-envelope]

patterns:
  file: specs/architecture/patterns.md
  patterns: [request-response, state-machine]

ux:
  file: specs/architecture/ux.md
  sections: [navigation-model, visual-system, component-conventions, screen-template]
```

Agents read the Artifact Index once to know where to find everything. They never scan the `architecture/` directory.

---

## Phase 1 — Ideation + Architecture {#ideation}

The ideation subagent runs a two-beat conversational session. It acts as a partner and advisor — it proposes, you confirm. It never decides silently.

**Beat 1 — Mature the idea (4 topics):**
1. Vision — what this system is, who it's for, what makes it worth building
2. Problem & Users — who specifically has this problem, what they do today instead
3. Constraints — hard stops: stack, compliance, timeline, budget
4. Risks & Out of Scope — top risks with mitigations, explicit v1 deferrals

**Beat 2 — Shape the system (5 topics):**
5. Tech Stack — one clear choice per layer, no alternatives
6. Guardrails — mandatory project structure + project-specific enforceable rules
7. Configuration — every env var the project needs, as a table
8. Story List — 3–5 vertical-slice stories, sized 2–4 sessions each
9. UX Model — navigation pattern (persona-split / central-dashboard / hybrid), CSS framework, component library, theme

After Beat 2, the ideation agent seeds all artifacts in two passes:

**Pass 1** (architecture artifacts + Artifact Index):
- Creates `specs/architecture/data-model.md` — entities inferred from story list
- Creates `specs/architecture/actors.md` — roles from auth model
- Creates `specs/architecture/contracts.md` — response shapes from inferred interfaces
- Creates `specs/architecture/patterns.md` — from tech stack choices
- Creates `specs/architecture/ux.md` — from Topic 9 decisions
- Appends `## Artifact Index` to `architecture.md`
- Runs a self-review checklist: entity count, actor can/cannot lists, error-envelope presence, all 4 UX sections present

**Pass 2** (after all intent files written):
- Sets `arch_seeded: true` and `intent_done: true` per story atomically
- If crashed before Pass 2: P2 routing detects `arch_seeded:false` and recovers automatically

**Gate to Phase 2:** `ideation_complete:true` + `arch_seeded:true` + Artifact Index present + all architecture artifacts exist

### The intent.md

For each story, ideation writes a 2-paragraph `intent.md`:

- Paragraph 1 — Functional purpose: who the user is, what they need, why this story exists
- Paragraph 2 — Objective and outcome: what success looks like, what changes, what becomes possible

This file grounds the development agent's judgment calls. It also propagates as a one-line `@intent` anchor in every source file — so investigation never needs to load the full intent to understand what a file does.

---

## Phase 2 — Story Spec {#story-spec}

The story-spec subagent writes a slim, precise spec for one story at a time. It finalizes `intent.md`, validates arch references, and writes `story-spec.md` (max 60 lines).

**Steps:**

1. Load `architecture.md` (narrative + Artifact Index in one read) + all 6 architecture artifacts
2. Finalize `intent.md` if not already done — deepen thin drafts, set `intent_done:true`
3. Validate arch references — for each entity/actor/contract the story needs, check the Artifact Index. If a required section is missing → signal P0 arch gap and stop
4. Write `story-spec.md` — five sections + `reads:` block
5. Self-review checklist — 11 items including the hard 60-line stop
6. Show summary to user for approval: `[Y] Approve spec  [E] Edit  [X] Hold`
7. Set `spec_done:true`

**Gate to Phase 3:** `spec_done:true` + `intent_done:true` + both files exist + `pending_arch_gap` is null

### The story-spec.md format

```yaml
---
story_id: STORY-002
title: "User submits application"
depends_on: [STORY-001]
reads:
  actors:    [applicant, admin]
  data:      [application, user]
  contracts: [submission-response, error-envelope]
  ux:        [component-conventions, screen-template]
---

## Criteria
1. Submit blocked if required fields are empty — inline field errors appear
2. Successful submit transitions application draft → submitted — immutable after
3. Applicant receives success toast and is redirected to /app/dashboard
4. Admin queue shows newly submitted application immediately
5. Submitting an already-submitted application returns 422

## Interfaces
POST /api/applications/:id/submit
  auth:     actor:applicant, own record only
  guard:    status must be draft
  response: contract:submission-response
  errors:   400 (validation), 401, 403, 422 (wrong status)

## Permissions
- actor:applicant — submit own draft only

## State
- draft → submitted: trigger: POST /api/applications/:id/submit
- full machine: data:application.state-machine

## Data
- owns: data:application (creates status transition)
- new fields: none
```

**The reads: block** is the agent's fetch list. Development loads only these sections from the architecture artifacts — approximately 130 lines of targeted context total.

**The 60-line limit** is a hard stop enforced in the self-review. If exceeded, the overrun must be moved to an arch artifact and referenced — not trimmed.

---

## Phase 3 — Build {#build}

The development subagent implements one story end-to-end. It loads context via a precise read sequence, writes code with structured anchor comments, and signals gaps when the spec and reality diverge.

**Read sequence:**

1. `intent.md` — functional grounding for judgment calls
2. `story-spec.md` — extract `reads:` block
3. `architecture.md` — Artifact Index (to resolve reads: paths) + Guardrails + Configuration
4. For each `reads:` entry: load only that specific `## section` from the relevant architecture artifact — stop at the next `##`

Total context: ~130 lines. Precise, not broad.

**Implementation order:** data layer → backend → AI integration → frontend

**Code anchor comments:**

Every new file gets structural anchor tags so the investigative agent can navigate without reading full files:

```javascript
// @story STORY-002 | submissions
// @intent allows an applicant to submit their completed draft for admin review

// @entry POST /api/applications/:id/submit | submit draft application
// @contract input: {id: uuid} → output: contract:submission-response | errors: 400, 401, 403, 422
```

**Gap specs:** if an arch artifact is wrong, a contract is missing, or a side-effect is discovered — the build agent does NOT modify architecture artifacts or specs directly. It writes to `specs/stories/[STORY-ID]/gap.md` and records what needs to change. If a referenced section doesn't exist at read time, it signals a P1 spec gap and stops — the pipeline fills the gap automatically.

**Gate to Phase 4:** all stories `built:true`

---

## Phase 4 — Deploy Release {#deploy}

The deployment subagent generates a versioned `deploy.sh` covering build, version stamping, migrations, and infrastructure deployment for all stories.

**Before generating:**
- Verifies all `build-report.yaml` files show `overall_status:pass`
- Scans for `gap.md` files — if found, SpecGantry merges them back into story specs before deploying

**Gap spec merge** (pre-deploy):
1. User confirms merge
2. Story-spec agent reads each `gap.md` and applies `## Recommended spec update` to `story-spec.md` in place
3. If the gap changes intent: `intent.md` is also updated
4. `gap.md` is deleted after successful merge

**The generated deploy.sh:**
- Version stamping for the relevant language/package manager
- Per-story: build → migrations → deploy → health check
- `--dry-run` flag for local testing without production calls
- Infrastructure-aware: Kubernetes, AWS ECS, GCP Cloud Run, docker-compose, PM2, static CDN — inferred from tech stack

---

## Self-Healing Gap Flows {#gap-flows}

SpecGantry has three automatic gap routing rows that run before the main pipeline:

### P0 — Architecture Gap

Triggered when: story-spec finds an entity/actor/contract/pattern that doesn't exist in the Artifact Index.

Flow:
1. Story-spec writes `pending_arch_gap` to project-state with the missing section name
2. Orchestrator detects P0 and invokes ideation in arch gap mode
3. Ideation adds the missing section to the relevant architecture artifact and updates the Artifact Index
4. Orchestrator clears the gap flag, restores `active_story`, and resumes story-spec

### P1 — Spec Gap

Triggered when: development finds a referenced section that doesn't resolve (e.g. contract named in `reads:` but absent from `contracts.md`).

Flow:
1. Development writes `pending_spec_gap` to project-state with the missing reference
2. Orchestrator invokes story-spec in spec gap mode
3. Story-spec updates the relevant section (or escalates to P0 if arch needs updating)
4. Orchestrator resumes development

### P2 — Crash Recovery

Triggered when: `ideation_complete:true` but `arch_seeded:false` — means ideation or RE completed story creation but crashed before finishing arch artifact writes.

Flow:
1. Orchestrator synthesises a project-level P0 gap
2. Ideation arch gap mode checks which files are missing and writes them
3. Orchestrator sets `arch_seeded:true` and `intent_done:true` per story where files exist
4. Normal pipeline resumes

All three flows are fully automatic. No user intervention required.

---

## Reverse Engineering Existing Codebases {#reverse-engineer}

The reverse-engineer subagent analyzes an existing codebase and synthesizes the complete SpecGantry project structure.

**What it produces:**

- `specs/architecture/architecture.md` — narrative (Vision, Problem, Constraints, Tech Stack, Guardrails, Configuration, UX Model) + Artifact Index
- `specs/architecture/data-model.md` — entities from schema/ORM/migration files
- `specs/architecture/actors.md` — roles from auth middleware and route guards
- `specs/architecture/contracts.md` — response shapes from route handlers and API types
- `specs/architecture/patterns.md` — dominant structural pattern in code
- `specs/architecture/ux.md` — navigation model and component patterns from frontend code
- `specs/stories/[STORY-ID]/intent.md` — 2 paragraphs per story derived from entry points
- `specs/stories/[STORY-ID]/story-spec.md` — stub with `reads:` block, marked `⚠ Stub spec`
- `specs/stories/[STORY-ID]/build-report.yaml` — runtime profile for built stories
- Anchor comments (`@story`, `@intent`, `@entry`, `@contract`) in source files

**State written in two passes** to prevent crash-window inconsistency:
- Pass 1 (after story list confirmed): project-state with `arch_seeded:false`, `intent_done:false`
- Pass 2 (after all files written): sets `arch_seeded:true`, `intent_done:true` per story

**After RE:** built stories route to `classify_and_route` for [N] New work (bug fixes, enhancements). Partial/missing stories enter the normal spec→build pipeline. Stub specs can be completed via the `Complete stub spec` action bar entry.

---

## Post-Release Work {#post-release}

Once all stories are deployed, `[N] New work` routes to `classify_and_route`. You describe the work; SpecGantry classifies it:

| Type | Description | Flow |
|------|-------------|------|
| `bug_fix` | Broken deployed behaviour | Investigate → confirm → build fix → deploy patch |
| `enhancement` | Existing story does more/differently | Investigate → confirm → write gap.md → build → deploy minor |
| `new_story` | Net-new user capability | Ideation amendment → spec → build → deploy minor |
| `project_change` | Cross-cutting infra or data model change | Ideation amendment → full pipeline reset → deploy major |

**Bug fix and enhancement** always start with the investigative agent — it searches the codebase by anchor tags and returns a structured findings report (root cause, affected files, spec alignment) before any code is touched.

---

## Cost Tracking {#cost-tracking}

Every agent invocation is automatically logged to `specs/cost-log.ndjson` via the SubagentStop hook. Each entry records:

- Phase (`ideation`, `story_spec`, `development`, `evaluation`, `repair_plan`, `deployment`, `investigation`, `reverse_engineer`)
- Story ID (where applicable)
- Model (`claude-sonnet-4-6`, `claude-haiku-4-5-20251001`)
- Token counts: input, output, cache write, cache read
- Cost at current pricing (fetched live, falls back to known rates)
- Release version

Run `/track-cost` for the full cost dashboard. See [Skills & Agents → /track-cost](/docs/skills#track-cost) for the Cost Matrix and all drill-down views.

The targeted `reads:` pattern cuts development-phase token usage by 40–60% compared to v3's full-spec loading. Architecture artifacts are written once and referenced — not re-described per story.

---

## Engagement Hooks {#engagement-hooks}

**The problem:** Claude Code sessions have finite context. After a `/compact` or across sessions, Claude can lose track of the fact that this project is managed by SpecGantry and start making code changes directly — bypassing the pipeline and letting specs drift from code.

**The fix:** SpecGantry's `SessionStart` hook in `hooks.js` runs on every Claude Code session open. It checks whether `specs/project-state.yaml` exists and, if it does, automatically installs:

| File | Purpose |
|------|---------|
| `.claude/settings.json` | `SessionStart` + `PostCompact` hooks wired to the contract script |
| `.claude/hooks/spec-gantry-contract.sh` | Reads `CONTRACT.md` and emits it as `additionalContext` |
| `.claude/CONTRACT.md` | Binding directive injected into every session (gitignored) |

The `PostCompact` hook re-injects the contract after every `/compact` — so Claude is immediately re-oriented. This runs entirely in Node.js, not by Claude, so it cannot be skipped. Existing projects without hooks get them installed automatically on the next session open.

---

## State File Reference

`specs/project-state.yaml` is the orchestrator's single source of truth:

```yaml
project:
  name: "MyProject"
  created: 2026-06-16
  release: "1.0.0"
  next_release_type: null    # patch | minor | major — set on new work
  active_story: null         # set while a subagent is running
  active_phase: null         # ideation | story-spec | development | evaluation | repair_plan | deployment | investigation | amendment | null
ideation_complete: false
arch_seeded: false           # true after all architecture artifacts + intent.md written
pending_arch_gap: null       # P0 gap signal
pending_spec_gap: null       # P1 gap signal
stories:
  STORY-001:
    title: "User authentication"
    depends_on: []
    intent_done: false
    spec_done: false
    built: false
    deployed: false
```

See [Reference → State Flags](/docs/architecture#state-flags) for complete field documentation.
