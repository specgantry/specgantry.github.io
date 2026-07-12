---
layout: docs
title: Skills & Agents
description: Complete reference for SpecGantry's 2 skills and 8 agents — what they do, when they run, which model they use, and what they produce. v5 adds bounded raise-a-concern for story-spec and development, and cache-first context ordering via a shared preamble. v5.3 adds the Governor quality review agent.
permalink: /docs/skills/
prev_page: "How It Works"
prev_page_url: "/docs/how-it-works"
next_page: "Reference"
next_page_url: "/docs/architecture"
---

# Skills & Agents

SpecGantry provides 2 skills (entry-point commands) and 8 agents (subagents the orchestrator spawns). You only ever type the skills — the orchestrator decides which agents to invoke and when.

---

## Skills

### /spec-gantry {#spec-gantry}

Your single entry point for everything. Run this at the start of every Claude Code session.

```
/spec-gantry
```

SpecGantry reads `specs/project-state.yaml`, determines where you are in the pipeline, and routes you to the right action. It renders the dashboard every response and enforces phase gates automatically.

**What it handles:**
- New projects (triggers ideation)
- Existing codebases (triggers reverse engineering)
- Daily pipeline progress (spec → build → deploy)
- Post-release work (bug fixes, enhancements, new stories, architectural changes)
- Crash recovery (P0/P1/P2 gap routing)

**The dashboard:**

```
SpecGantry v5  |  MyProject  |  release 1.0.0
──────────────────────────────────────────────────────────────────
Spec [███░░] 3/5  ·  Build [██░░░] 2/5  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────────────
  ID      Story                              Spec   Build
  ────────────────────────────────────────────────────────────────
  [001]   User authentication                  ✅     ✅
  [002]   User profile management              ✅     ✅
  [003]   User submits application             ✅     🔄
  [004]   Admin reviews submissions            ✅     ○      depends on 003
  [005]   Admin manages settings               ⏳     ○
  ────────────────────────────────────────────────────────────────
  Release 1.0.0                                       ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a story ID to manage it            [$] Cost
  [1] Build next story — STORY-003        [?] Help
  [N] New work                            [X] Exit
──────────────────────────────────────────────────────────────────
Enter story ID or action:  >
```

**Icon legend:**
- `✅` Complete
- `🔄` In progress (active_story matches this ID)
- `🔴` Blocked by dependency
- `⏳` Ready to work
- `○` Not yet reached
- `~` Stub spec (reverse-engineered — full spec not yet written)

**Action bar — left column:** auto-derived from current pipeline state. Shows the single most actionable next step. Always ends with `[N] New work`.

**Action bar — right column:** always visible: `[$]` Cost, `[?]` Help (expands to `[A]` Architecture + docs link), `[X]` Exit.

**Input handling:**
- Type a story number (`001`, `1`, or `STORY-001`) to jump directly to that story
- Type a story with stub spec (`built:true · spec_done:false`) to complete its spec
- Type lettered commands (`N`, `$`, `?`, `A`, `X`) to execute those actions

**The routing table** (evaluated in order, P-rows first):

| Priority | Condition | Action |
|----------|-----------|--------|
| P0 | `pending_arch_gap` non-null | Fill missing arch section → resume |
| P1 | `pending_spec_gap` non-null | Fix spec reference → resume build |
| P2 | `ideation_complete:true` + `arch_seeded:false` | Recover crashed arch write |
| 1 | No project, no source files | Start new project |
| 2 | No project, source files exist | Offer RE or new project |
| 3 | `ideation_complete:false` | Continue ideation |
| 4 | Any `spec_done:false + built:false` | Spec next story |
| 5 | All `spec_done:true`, any `built:false` | Build next story |
| 6 | All `built:true`, any `deployed:false` | Deploy release |
| 7 | All `deployed:true` | New work (classify + route) |

---

### /track-cost {#track-cost}

Token usage and cost breakdown by phase, story, model, and release.

```
/track-cost
```

Reads `specs/cost-log.ndjson` and renders the Cost Matrix as the default view, with three drill-down options:

**Cost Matrix (default — input `1`):**

Two tables — cost in USD first, then token counts. Stories as rows, phases as columns.

```
SpecGantry v5  |  MyProject
Spec [█████] 4/4  ·  Build [█████] 4/4  ·  Deploy [█████] deployed
──────────────────────────────────────────────────────────

Cost Matrix  |  release 1.0.0

Story        ideation   story_spec  development  deployment    Total
────────────────────────────────────────────────────────────────────
PROJECT        $0.82        —            —          $0.49      $1.31
STORY-001        —        $0.54        $0.41          —        $0.95
STORY-002        —        $0.61        $0.35          —        $0.96
STORY-003        —        $0.48        $0.28          —        $0.76
STORY-004        —        $0.43        $0.40          —        $0.83
────────────────────────────────────────────────────────────────────
Total          $0.82      $2.06        $1.44        $0.49      $4.81

Story        ideation   story_spec  development  deployment    Total
────────────────────────────────────────────────────────────────────
PROJECT       42,340        —            —         4,890      47,230
STORY-001        —       12,840        9,610          —       22,450
STORY-002        —       14,310        8,140          —       22,450
STORY-003        —       11,260        6,540          —       17,800
STORY-004        —       10,120        9,380          —       19,500
────────────────────────────────────────────────────────────────────
Total         42,340     48,530       33,670        4,890    129,430

Stories:
  STORY-001  User authentication
  STORY-002  User profile management
  STORY-003  User submits application
  STORY-004  Admin reviews submissions

──────────────────────────────────────────────────────────
  [1] Matrix        [2] By release    [3] By model
                                      [X] Return
──────────────────────────────────────────────────────────
Enter option:  >
```

**By Release (input `2`):**

```
Cost by Release

Release       Tokens        Cost
─────────────────────────────────
1.0.0        129,430      $12.94
─────────────────────────────────
Total        129,430      $12.94
```

**By Model (input `3`):**

```
Cost by Model  |  release 1.0.0

Model            Tokens        Cost
────────────────────────────────────
sonnet-4-6      117,889      $11.79
haiku-4-5        11,541       $1.15
────────────────────────────────────
Total           129,430      $12.94
```

**Cost data is exact** — the SubagentStop hook reads actual `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens` from the API response. Cache reads and writes are tracked separately because they have different cost profiles. Model names strip the `claude-` prefix for display.

---

## Agents

The orchestrator (SKILL.md) decides which agent to invoke. You never call agents directly.

### Ideation {#agent-ideation}

**Model:** claude-sonnet-4-6  
**Invoked:** at project start, for new stories (`new_story` path), for architectural changes, and in gap mode (P0/P2)

Runs a two-beat conversational session that matures your idea and shapes the system. Acts as a partner and advisor — proposes one direction, asks for confirmation or redirection. Never decides silently.

**Beat 1 (4 topics):** Vision → Problem & Users → Constraints → Risks & Out of Scope  
**Beat 2 (5 topics):** Tech Stack → Guardrails → Configuration → Story List → UX Model

After Beat 2: seeds all 6 architecture artifacts + Artifact Index + `intent.md` per story. Runs a self-review before setting `arch_seeded:true`.

**Arch gap mode (P0/P2):** when invoked for a missing arch section, reads the Artifact Index, adds the missing entity/actor/contract/pattern/ux section to the appropriate file, and updates the index. Story-level gaps target one section; project-level gaps (P2) check all missing files and write them.

**Amendment mode:** when architecture changes are needed for `new_story` or `project_change`, appends dated amendment blocks — never replaces prior content.

---

### Story Spec {#agent-story-spec}

**Model:** claude-haiku-4-5-20251001 (v5 — was sonnet-4-6)  
**Invoked:** for each story in pipeline order (Phase 2), for stub spec completion (RE projects), in spec gap mode (P1), and at deploy time for gap merges

Produces a slim, precise `story-spec.md` (max 60 lines) and finalizes `intent.md`.

**Steps:**
1. Load `architecture.md` + all 6 architecture artifacts + `intent.md` + project-state
2. Detect RE stub (`⚠ Stub spec` marker) — if stub, skips validation; treats `reads:` as a context hint
3. Finalize `intent.md` (skip if `intent_done:true`)
4. Validate arch references — signal P0 if any required section is missing
5. Write `story-spec.md` — 5 sections + `reads:` block
6. Self-review — 11 items, 60-line hard stop
7. User confirmation: `[Y] Approve  [E] Edit  [X] Hold`
8. Set `spec_done:true`

**Spec gap mode (P1):** updates the relevant spec section (reads: block, interfaces, or data) based on what development flagged as missing.

**Gap merge mode (deploy time):** applies `gap.md` changes to `story-spec.md` in place, updates `intent.md` if fundamental purpose changed, appends change history row, deletes `gap.md`.

---

### Development {#agent-development}

**Model:** claude-sonnet-4-6  
**Invoked:** for each story in build order (Phase 3), for bug fixes, and for enhancements

Implements one story end-to-end: data layer → backend → AI integration → frontend.

**Read sequence:**
1. `intent.md` — functional grounding
2. `story-spec.md` — extract `reads:` block
3. `architecture.md` — Artifact Index + Guardrails + Configuration
4. For each `reads:` entry: load only that specific `##` section from the architecture artifact

Total context: ~130 lines.

**Code anchors written** in every new file:
```
@story STORY-002 | submissions
@intent allows an applicant to submit their completed draft for admin review
@entry POST /api/applications/:id/submit | submit draft application
@contract input: {...} → output: contract:submission-response | errors: ...
@gap [date] [divergence from spec]  (only when gap.md entry exists)
```

**P1 gap signal:** if a referenced arch section doesn't exist at read time, writes `pending_spec_gap` to project-state and stops. Does not modify any arch or spec files.

**Produces:** `build-report.yaml` (runtime profile, build command, migration info) + sets `built:true`

---

### Deployment {#agent-deployment}

**Model:** claude-sonnet-4-6  
**Invoked:** Phase 4, after all stories are built

Generates a versioned `deploy.sh` for all stories. Reads `build-report.yaml` for runtime profiles, infers infrastructure target from tech stack and guardrails.

**Produces:**
- `specs/deploy.sh` — build + migrations + deploy + health checks per story, `--dry-run` support
- `specs/deploy-artifact.md` — deployment metadata, environment variable requirements, manual steps
- Updates `deployed:true` per story, clears `next_release_type`

**Infrastructure detection:** Kubernetes, AWS ECS, GCP Cloud Run, Azure Container Apps, docker-compose, AWS Lambda, Heroku, PM2/systemd, static CDN — inferred from tech stack signals. Ambiguous targets emit `# MANUAL:` blocks.

---

### Investigation {#agent-investigate}

**Model:** claude-haiku-4-5-20251001  
**Invoked:** at the start of every `bug_fix` or `enhancement` in the post-release `classify_and_route` flow

Read-only. Never writes code or modifies files. Searches the codebase using anchor tags and returns a structured findings report.

**Anchor search order:**
1. `@story` — map files to stories
2. `@intent` — orient to functional purpose across stories without loading intent.md files
3. `@entry` — route handlers and action entry points
4. `@contract` — data shapes at layer boundaries
5. `@gap` — known divergences already noted in code

**Stub detection:** if the story spec is a RE stub (no `## Criteria`), uses code structure and arch artifacts for spec alignment instead.

**Returns:**
```
INVESTIGATION FINDINGS
status: confirmed
type: bug_fix | enhancement
affected_stories: [...]
root_cause: ...
spec_alignment: ...
confidence: high | medium | low
```

User confirms before findings are passed to the build agent.

---

### Reverse Engineer {#agent-reverse-engineer}

**Model:** claude-haiku-4-5-20251001 (v5 — was sonnet-4-6)  
**Invoked:** when source files exist but no SpecGantry artifacts are found

Analyzes an existing codebase and synthesizes the complete v5 project structure.

**Analysis (silent, no output):** tech stack, project structure, user-facing capabilities (grouped into 3–6 candidate stories), auth model, completion level per story, guardrail candidates, configuration, entry points, dependencies, runtime profile.

**Produces (in order):**
1. Presents inferred story list for user review and confirmation
2. Writes `specs/project-state.yaml` Pass 1 — with `arch_seeded:false`, `intent_done:false` per story
3. Writes `specs/architecture/architecture.md` — narrative + UX Model
4. Analyzes frontend code for UX patterns
5. Writes all 6 architecture artifacts + Artifact Index
6. Writes `intent.md` and stub `story-spec.md` per story
7. Writes `build-report.yaml` stubs for built stories
8. Updates project-state Pass 2 — sets `arch_seeded:true`, `intent_done:true`
9. Asks to tag source files with anchor comments (`[Y] Add tags  [S] Skip  [X] Cancel`)

---

### Ideation — Arch Gap Mode {#agent-gap}

The ideation agent runs in a special mode when invoked via P0 or P2. It does not start a conversational session — it targets a specific missing artifact section and fills it.

**P0 (story-level gap):** reads the Artifact Index, reads the relevant architecture artifact, adds the missing section (entity/actor/contract/pattern/ux), updates the index list.

**P2 (project-level gap, `story_id: null`):** checks all architecture artifacts for existence, writes any missing ones, writes `intent.md` for any story where `intent_done:false` and file is absent.

Returns `arch gap resolved — [what was added/changed]`. The orchestrator clears the gap flag and resumes the interrupted phase.

---

## Summary Table

| Agent | Model | Phase | Produces |
|-------|-------|-------|----------|
| Ideation | Sonnet | Phase 1 | architecture/ · intent.md · story list |
| Ideation (gap mode) | Sonnet | P0/P2 | missing arch sections · intent.md |
| Story Spec | Sonnet | Phase 2 | story-spec.md (≤60 lines) · intent.md final |
| Development | Sonnet | Phase 3 | code + anchors · build-report.yaml |
| Deployment | Sonnet | Phase 4 | deploy.sh · deploy-artifact.md |
| Investigation | Haiku | Post-release | findings report (read-only) |
| Reverse Engineer | Sonnet | Pre-pipeline | full architecture layer · stubs |
