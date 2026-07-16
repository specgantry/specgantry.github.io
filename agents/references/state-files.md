# State Files Reference

All paths relative to `project_dir`.

| File | Key fields |
|------|------------|
| `specs/project-state.yaml` | `project` (name, created, release, next_release_type, active_story, active_phase) · valid `active_phase` values: `ideation_plan` · `ideation_produce` · `ideation_eval` · `spec_plan` · `spec_produce` · `spec_eval` · `code_plan` · `code_produce` · `code_eval` · `deployment` · `investigation` · `amendment` · `null` · `ideation_complete` · `arch_seeded` · `pending_arch_gap` · `pending_spec_gap` · `ppe_loop` config (max_iterations per phase) · `stories` map (title, depends_on, intent_done, spec_done, built, deployed per STORY-ID) |
| `specs/architecture/architecture.md` | Narrative sections (Vision, Problem & Users, Constraints, Risks, Tech Stack, Guardrails, Configuration, UX Model) + `## Artifact Index` YAML block (last section). Single entry point for all arch context. |
| `specs/architecture/data-model.md` | All entities, fields, types, relationships, state machines. `## entity:[name]` anchors. |
| `specs/architecture/actors.md` | All roles, permissions, ownership rules. `## actor:[name]` anchors. |
| `specs/architecture/contracts.md` | Shared API shapes, error envelopes. `## contract:[name]` anchors. |
| `specs/architecture/patterns.md` | Dominant backend interaction patterns. `## pattern:[name]` anchors. |
| `specs/architecture/ux.md` | Navigation model, visual system, component conventions, screen template. `## ux:[name]` anchors. |
| `specs/architecture/deployment.md` | Deployment target, services, secrets, ingress, CI/CD config. `## deployment:[name]` anchors. Written by ideation (Topic 10). Read by deployment subagent. |
| `specs/stories/[STORY-ID]/intent.md` | 2 paragraphs: functional purpose + objective and outcome. Seeded by ideation, finalized by story-spec. |
| `specs/stories/[STORY-ID]/story-spec.md` | YAML frontmatter: story_id, title, depends_on, reads: block. Five sections: criteria, interfaces, permissions, state, data. Max 60 lines. |
| `specs/stories/[STORY-ID]/build-report.yaml` | `overall_status` · `gap_specs` · `warnings` · `source` (omitted unless reverse-engineered) · `quality` block (written by orchestrator after PPE code loop exits): `overall` (pass\|partial\|capped\|build_failed\|unknown) · `iterations` · `exit_reason` · `active_rubric[]` · `dimensions` map (one entry per active dim: PASS\|FAIL\|SKIP) · `advisory_notes[]` · `northstar_gaps[]` (blocking gaps from code north star, if any) |
| `specs/stories/[STORY-ID]/gap.md` | Optional gap file — created by code-produce-agent when implementation diverges from spec. Sections: `## Concern`, `## Changes`, `## Files affected`, `## Side-effects on other stories`, `## Recommended spec update`. Merged at deploy time by spec-produce-agent. |
| `specs/stories/[STORY-ID]/.ppe-loop.yaml` | Active PPE loop checkpoint. Fields: `phase` (ideation\|spec\|code), `iteration_N`, `prior_eval_verdict`, `prior_northstar_gaps` (for cycling detection), `must_not_miss` (accumulated gaps carried forward — populated from eval's upgraded_goal on GOAL_GAP), `spec_reentry_count` (code phase only). Written by orchestrator at each eval step. Deleted when loop exits ACHIEVED or CAPPED. Gitignored. |
| `specs/.ideation-turn.md` | Active ideation turn — `topic`, `question` (last question returned to user), `mode` (normal \| coherence) |
| `specs/.story-spec-turn.md` | Active story-spec turn — `story_id`, `interaction_state` (held_review \| awaiting_approval \| awaiting_edit), `question` |
| `specs/.investigate-turn.md` | Active investigation turn — `description`, `interaction_state` (awaiting_confirmation \| awaiting_clarification), `findings` (last findings text) |

Any scratch or intermediate files **must** go under `specs/scratchpad/`. Pass this to every subagent. Add `specs/scratchpad/` to `.gitignore` — it is never committed.

Turn-state files (`specs/.ideation-turn.md`, `specs/.story-spec-turn.md`, `specs/.investigate-turn.md`) and `.ppe-loop.yaml` per story are session scratchpad — add all to `.gitignore` alongside `specs/.current-session`.

## Write ownership

| Field / file | Writer |
|---|---|
| `built:true` | Orchestrator only (after PPE code loop exits ACHIEVED and quality block written to build-report) |
| `spec_done:true` | Orchestrator only (after spec-eval-agent returns ACHIEVED and user approves) |
| `deployed:true` | Deployment subagent |
| `project.release` | Orchestrator only (written after deployment subagent returns successfully) |
| `project.next_release_type` | Orchestrator only |
| `intent_done:true` | ideation-produce-agent (story list step), spec-produce-agent (Step 2), RE subagent (Pass 2) |
| `pending_spec_gap` | code-produce-agent (spec/contract gap during build) · Orchestrator (cross-story drift from classify_and_route Step 3.5 — `triggered_by: cross-story-recheck`) |
| `pending_arch_gap` | spec-produce-agent or code-produce-agent only |
| `auto_continue` | Orchestrator only |
| `specs/stories/[STORY-ID]/.ppe-loop.yaml` | Orchestrator only (written at each eval step checkpoint, deleted at loop exit) |
