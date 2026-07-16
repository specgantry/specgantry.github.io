---
layout: docs
title: Reference
description: SpecGantry v6 reference — file structure, state flags, agent ownership, Artifact Index format, PPE loop objects, and design principles.
permalink: /docs/architecture/
prev_page: "Skills & Agents"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# SpecGantry v6 Reference

File structure, state flags, design principles, and extension points.

---

## Design Principles

**1. Specs and artifacts are the memory.**  
All knowledge lives in `specs/`. Agents read from canonical artifacts on disk. Nothing is duplicated in transition files, passed as parameters, or held in temporary state that could be derived from the canonical sources. The `reads:` block in every story spec is the agent's fetch list — nothing else is loaded.

**2. Quality at the earliest possible moment.**  
A thin spec produces bad code regardless of how many code repair iterations you run. The PPE loop catches gaps at ideation (before architecture is decided), at spec (before code is written), and at code (before shipping). Each phase's north star is independent of what any plan says — the evaluator challenges both the output and the goal.

**3. Session safety over throughput.**  
All progress is written to disk after every answer and every phase transition. A crash mid-loop restores from `.ppe-loop.yaml` — iteration count, prior verdict, and accumulated gaps — and re-enters at the plan step with the goal re-derived from canonical artifacts. No work is lost.

---

## File Structure

```
project-root/
  specs/
    project-state.yaml            pipeline state, story flags, PPE loop config
    concerns-log.ndjson           — removed in v6
    cost-log.ndjson               token usage per agent run (committed to git)
    architecture/
      architecture.md             Vision, Problem & Users, Constraints, Risks,
                                  Tech Stack, Guardrails, Configuration, UX Model,
                                  + ## Artifact Index (YAML block, last section)
      data-model.md               ## entity:[name] sections
      actors.md                   ## actor:[name] sections
      contracts.md                ## contract:[name] sections (prose + yaml block)
      patterns.md                 ## pattern:[name] sections
      ux.md                       ## ux:[name] sections
      deployment.md               ## deployment:[name] sections
    stories/
      STORY-NNN/
        intent.md                 2 paragraphs: functional purpose + outcome
        story-spec.md             ≤60 lines: criteria, interfaces, permissions,
                                  state, data — all as references to arch artifacts
        build-report.yaml         overall_status, quality block, test_plan, runtime
        gap.md                    divergences (optional, deleted at deploy)
    scratchpad/                   gitignored — agent intermediate work only
  .claude/
    settings.json                 SessionStart + PostCompact hooks
    hooks/spec-gantry-contract.sh contract injection script
    CONTRACT.md                   binding directive (gitignored)
    CLAUDE.md                     spec-gantry-notice prepended at project init
```

---

## State Flags — project-state.yaml

```yaml
project:
  name: "My App"
  created: 2026-07-16
  release: "1.0.0"
  next_release_type: null          # patch | minor | major — set by classify_and_route
  active_story: null               # STORY-NNN while a loop is running
  active_phase: null               # see valid values below

ideation_complete: false
arch_seeded: false
pending_arch_gap: null             # set by spec/code produce agents on missing arch section
pending_spec_gap: null             # set by code produce agent on missing spec reference

auto_continue: false               # set to true by [>] — cleared on decision points

ppe_loop:
  max_iterations:
    ideation: 3
    spec: 2
    code: 3

stories:
  STORY-001:
    title: "Manage recipes"
    depends_on: []
    intent_done: false
    spec_done: false
    built: false
    deployed: false
```

**Valid `active_phase` values:**

`ideation_plan` · `ideation_produce` · `ideation_eval` · `spec_plan` · `spec_produce` · `spec_eval` · `code_plan` · `code_produce` · `code_eval` · `deployment` · `investigation` · `amendment` · `null`

---

## Write Ownership

| Field / file | Writer |
|---|---|
| `built:true` | Orchestrator only (after code PPE loop exits ACHIEVED) |
| `spec_done:true` | Orchestrator only (after spec-eval-agent returns ACHIEVED and user approves) |
| `deployed:true` | Deployment subagent |
| `project.release` | Orchestrator only (after deployment subagent returns) |
| `auto_continue` | Orchestrator only |
| `intent_done:true` | ideation-produce-agent, spec-produce-agent, reverse-engineer-subagent |
| `pending_spec_gap` | code-produce-agent · Orchestrator (cross-story drift) |
| `pending_arch_gap` | spec-produce-agent or code-produce-agent |
| `.ppe-loop.yaml` | Orchestrator only (written at each eval step, deleted on loop exit) |

---

## Session Scratchpad Files (gitignored)

| File | Purpose | Lifetime |
|---|---|---|
| `specs/.ideation-turn.md` | Pending ideation question + topic | Deleted when question is answered |
| `specs/.story-spec-turn.md` | Pending spec interaction state | Deleted on SPEC_COMPLETE or SPEC_HELD |
| `specs/.investigate-turn.md` | Pending investigation confirmation | Deleted on INVESTIGATION_CONFIRMED/CANCELLED |
| `specs/.ideation-scratchpad.yaml` | Proposed story list between approval and seed_artifacts | Deleted after seed_artifacts completes |
| `specs/stories/[ID]/.ppe-loop.yaml` | Loop checkpoint: `iteration_N`, `prior_eval_verdict`, `prior_northstar_gaps`, `must_not_miss`, `spec_reentry_count` | Deleted when loop exits ACHIEVED or CAPPED |

No handoff files exist in v6 — Goal₀ for each phase is derived directly from canonical artifacts on disk. `.spec-handoff.yaml` and `.code-handoff.yaml` from v5 are no longer written.

---

## The Artifact Index

The last section of `specs/architecture/architecture.md` is a machine-parseable YAML block that maps artifact types to their files and named sections:

```yaml
## Artifact Index

```yaml
data-model:
  file: specs/architecture/data-model.md
  entities: [application, submission, review, user]
actors:
  file: specs/architecture/actors.md
  roles: [applicant, admin, reviewer]
contracts:
  file: specs/architecture/contracts.md
  shapes: [submission-response, review-response, error-envelope]
patterns:
  file: specs/architecture/patterns.md
  patterns: [rest-crud, optimistic-update]
ux:
  file: specs/architecture/ux.md
  sections: [navigation-model, visual-system, component-conventions, screen-template]
deployment:
  file: specs/architecture/deployment.md
  sections: [target, services, secrets, ingress, cicd]
```
```

Agents read the Artifact Index once to build a lookup map, then use it to resolve `reads:` entries to exact file paths and section anchors — without reading the full architecture file.

---

## Contract Sections

Every `## contract:[name]` section in `contracts.md` must contain both prose and a machine-readable YAML block:

````markdown
## contract:submission-response
The response shape returned by POST /api/submissions and GET /api/submissions/:id.

```yaml
$schema: "https://json-schema.org/draft/2020-12/schema"
type: object
required: [id, status, created_at]
properties:
  id: { type: string, format: uuid }
  status: { type: string, enum: [draft, submitted, approved, rejected] }
  title: { type: string }
  created_at: { type: string, format: date-time }
additionalProperties: false
```
````

The code produce agent validates every `required:` field is present before writing API endpoints. If the yaml block is missing, it signals a spec gap and stops.

---

## Code Anchor Schema

Every source file touched by the code produce or reverse-engineer agent gets one-line anchor comments:

| Anchor | Where | Example |
|---|---|---|
| `@story` | Top of file | `// @story STORY-002 \| submissions` |
| `@intent` | After `@story` | `// @intent allows an applicant to submit their draft` |
| `@entry` | Above each route handler | `// @entry POST /api/submissions \| create draft submission` |
| `@contract` | Above cross-layer functions | `// @contract input: {...} → output: {...} \| errors: [422,500]` |
| `@gap` | At spec divergences | `// @gap 2026-07-16 status enum extended — spec only defines draft\|submitted` |

The investigation agent greps these anchors to locate code without loading full files.

---

## The PPE Loop Objects

Three shared data objects travel between plan, produce, and eval agents in each loop iteration. Plan and eval agents return raw JSON.

**Goal** (orchestrator-owned, derived from disk)
```yaml
goal:
  phase: ideation | spec | code
  iteration: N
  statement: "what good looks like"
  must_achieve: [north star criteria for this iteration]
  must_not_miss: [gaps carried forward from prior iterations]
  source: initial | upgraded
```

**Plan** (returned by plan agents)
```json
{
  "approach": "strategy to achieve the goal",
  "steps": [
    { "id": 1, "action": "...", "addresses": "...", "produces": "..." }
  ],
  "known_risks": ["..."],
  "scope_boundary": "..."
}
```

**Evaluation** (returned by eval agents)
```json
{
  "verdict": "ACHIEVED | EXECUTION_GAP | GOAL_GAP",
  "plan_compliance": [{ "step_id": 1, "met": true, "evidence": "..." }],
  "northstar_gaps": [
    { "gap": "...", "gap_type": "experience_gap", "severity": "blocking", "proposed_goal_addition": "..." }
  ],
  "execution_gaps": [{ "step_id": 2, "met": false, "evidence": "..." }],
  "upgraded_goal": { "statement": "...", "must_achieve": [...], "must_not_miss": [...] }
}
```

`execution_gaps` is only present when verdict is `GOAL_GAP` and produce also failed to execute one or more plan steps — both are fed to the next plan agent in one pass.

---

## Extension Points

**Custom guardrails** — edit `## Guardrails` in `specs/architecture/architecture.md`. Every subagent reads guardrails before writing code. Changes take effect on the next build.

**PPE loop configuration** — edit `ppe_loop.max_iterations` in `project-state.yaml` to adjust how many iterations each phase runs before capping.

**Custom deployment platforms** — the deployment subagent supports GCP Cloud Run, AWS ECS/Fargate, Azure Container Apps, and Docker Compose. The deployment configuration in `specs/architecture/deployment.md` drives the generated `deploy.sh`.

---

## Security Model

**Secrets** — never hardcoded. Every secret is an environment variable named in `specs/architecture/architecture.md → ## Configuration`. The code produce agent uses these names exactly. `.env.example` is generated automatically at deploy time with safe placeholder values.

**Source annotations** — `@story`, `@entry`, `@contract`, `@gap` anchors written by the code produce and reverse-engineer agents are machine-readable but contain no runtime secrets. They are safe to commit.

**CONTRACT.md** — the engagement directive injected at session start is gitignored by default. It contains no secrets — only instructions for Claude.