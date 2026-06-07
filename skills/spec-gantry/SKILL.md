---
name: spec-gantry
description: Main dashboard and single entry point for SpecGantry. Enforces the SDLC pipeline — from ideation through deployment — with phase gates at every transition.
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, Skill
---

# SpecGantry Dashboard

## Shared UI Components
> These are referenced by name in other skills. Define them once here.

**UI_HEADER** — render on every response, first:
```
SpecGantry v[version]  |  [project.name or "New Project"]
[██████████]  [n]/[total] deployed  ·  $[sum of cost-log.ndjson total_cost_usd, or $0.00]
──────────────────────────────────────────────────────────
```
Progress bar: 10 chars, proportional fill (█ deployed, ░ remaining). Read `specs/cost-log.ndjson` for spend (sum `total_cost_usd` across all lines).

**QUICKBAR** — render on every response, last:
```
── [A]rch  [B]acklog  [P]roject  [?]Help  [X]Exit ──  (role: tl)
── [A]rch  [?]Help  [X]Exit ──────────────────────  (role: dev)
── [?]Help  [X]Exit ────────────────────────────────  (no project)
```

**GATE_FORMAT** — used by agents in HARD GATE blocks:
```
✗ [Agent] gate FAILED
  [condition]  →  ✗
  [resolution: what to do and which command to run]
```

---

## On Every Response

1. Render **UI_HEADER**
2. Render the **Feature Pipeline** (see below)
3. Show **⚡ Next** — one or two actions (see routing table)
4. Render **QUICKBAR**

Re-read all state files before each response. Missing files are not errors — they indicate pipeline stage.

State files: `.claude/local-state.yaml` · `specs/project-state.yaml` · `specs/features/*/state.yaml` · `specs/cost-log.ndjson`

When invoking the orchestrator, always pass `project_dir: [absolute path of current working directory]`.

---

## Feature Pipeline

One row per active feature (exclude superseded/deferred):

```
[ID]  [title, 24 chars]  [Spec][Rev][Build][Test][Deploy]  $[feature cost]  [assignee]
```

Stage icons:

| Icon | Meaning |
|------|---------|
| ✅ | complete |
| 🔄 | in progress |
| 👤 | awaiting human action |
| 🔴 | blocked |
| ⏳ | ready to start |
| ○  | not yet reached |

Stage completion: Spec=`feature_spec_complete` · Rev=`spec_reviewed` · Build=`dev_complete` · Test=`tests_passing` · Deploy=`deployment_status:complete`

Per-feature cost: sum `total_cost_usd` from cost-log.ndjson entries where `feature` matches. Omit if zero.

---

## Routing — Take First Match

Read state, find the first matching case, invoke the action. Do not prompt the user unless the case explicitly calls for it. **Invoke the orchestrator once per `/spec-gantry` call — do not chain multiple orchestrator calls in the same turn. The orchestrator handles its own phase transitions internally.**

| # | Condition | Action |
|---|-----------|--------|
| 1 | No `.claude/local-state.yaml` | Render View A; offer [2] reverse-engineer if source files exist |
| 2 | TL · `ideation_complete: false` | `→ orchestrator: start_ideation` — then stop; re-render dashboard |
| 3 | TL · `ideation_complete: true` · `architecture_complete: false` | `→ orchestrator: start_architecture` — then stop; re-render dashboard |
| 4 | `current_feature` set · spec in progress | `→ orchestrator: resume_feature_spec` |
| 5 | `current_feature` set · spec done · not reviewed | `→ orchestrator: review_feature_spec` |
| 6 | `current_feature` set · reviewed · dev not done | `→ orchestrator: resume_development` |
| 7 | `current_feature` set · dev+tests done · not deployed | Show "ready — notify TL to deploy" |
| 8 | TL · any feature `tests_passing:true` · not deployed | `→ orchestrator: deploy_feature` (prompt which) |
| 9 | No `current_feature` · unclaimed features exist | List claimable features; on pick: assign, write `current_feature`, `→ start_feature_spec` |
| 10 | All features deployed | View H: ask for next work; `→ orchestrator: classify_and_route` |

**View A** (no project):
```
No project found.
  [1] Start a new project       → /start-project
  [2] Analyse existing codebase → /reverse-engineer
```

**View H** (project complete):
```
All [n] features deployed.
Describe what to work on next (bug, improvement, new feature, or change), or X to exit:
>
```

---

## Quick-Bar Actions

**[A]** Read and display `specs/architecture-spec.md` in full. Re-render pipeline below it.

**[B]** *(TL only)* Display backlog table from `project-state.yaml`. Options: reorder / defer / reassign.

**[P]** *(TL only)* Project menu: add feature / defer / reassign / graduate bugfix / edit name or vision.

**[?]**
```
/spec-gantry     Dashboard       /track-cost    Cost breakdown
/update-pricing  Refresh rates   /bugfix        Fast-track bug fix
/reverse-engineer  Generate spec from existing code
```

**[X]** `Run /spec-gantry anytime to return.`
