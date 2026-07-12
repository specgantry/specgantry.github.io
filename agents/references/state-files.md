# State Files Reference

All paths relative to `project_dir`.

| File | Key fields |
|------|------------|
| `specs/project-state.yaml` | `project` (name, created, release, next_release_type, active_story, active_phase) · `ideation_complete` · `arch_seeded` · `pending_arch_gap` · `pending_spec_gap` · `governor` config (max_iterations, blocking_override) · `stories` map (title, depends_on, intent_done, spec_done, built, deployed, governor_status, governor_iterations per STORY-ID) |
| `specs/architecture/architecture.md` | Narrative sections (Vision, Problem & Users, Constraints, Risks, Tech Stack, Guardrails, Configuration, UX Model) + `## Artifact Index` YAML block (last section). Single entry point for all arch context. |
| `specs/architecture/data-model.md` | All entities, fields, types, relationships, state machines. `## entity:[name]` anchors. |
| `specs/architecture/actors.md` | All roles, permissions, ownership rules. `## actor:[name]` anchors. |
| `specs/architecture/contracts.md` | Shared API shapes, error envelopes. `## contract:[name]` anchors. |
| `specs/architecture/patterns.md` | Dominant backend interaction patterns. `## pattern:[name]` anchors. |
| `specs/architecture/ux.md` | Navigation model, visual system, component conventions, screen template. `## ux:[name]` anchors. |
| `specs/architecture/deployment.md` | Deployment target, services, secrets, ingress, CI/CD config. `## deployment:[name]` anchors. Written by ideation (Topic 10). Read by deployment subagent. |
| `specs/stories/[STORY-ID]/intent.md` | 2 paragraphs: functional purpose + objective and outcome. Seeded by ideation, finalized by story-spec. |
| `specs/stories/[STORY-ID]/story-spec.md` | YAML frontmatter: story_id, title, depends_on, reads: block. Five sections: criteria, interfaces, permissions, state, data. Max 60 lines. |
| `specs/stories/[STORY-ID]/build-report.yaml` | `overall_status` · `gap_specs` · `warnings` · `source` (omitted unless reverse-engineered) |
| `specs/stories/[STORY-ID]/governor-report.yaml` | `story_id` · `status` (passed \| partial \| capped) · `iterations_run` · `exit_rule` · `dimensions` map (spec_adherence, contract_fidelity, input_completeness, persistence_appropriateness, ui_quality, scope_hygiene, cross_story_coherence — each PASS \| FLAG \| ADVISORY \| SKIP) · `patch_files` · `advisory_notes`. Written by governor on loop exit. |
| `specs/stories/[STORY-ID]/patches/patch-N.yaml` | **Approach patch** (`type: approach`, iteration 0): `review` block (spec_ambiguities, persistence_questions, ui_questions, risk_flags). **Review patch** (`type: review`, iteration 1+): `verdict` · `dimensions` map with per-dimension verdict, rationale, fix_instructions · `blocking_flags` · `advisory_flags`. Written by governor only. |
| `specs/.ideation-turn.md` | Active ideation turn — `topic`, `question` (last question returned to user), `mode` (normal \| coherence) |
| `specs/.story-spec-turn.md` | Active story-spec turn — `story_id`, `interaction_state` (held_review \| awaiting_approval \| awaiting_edit), `question` |
| `specs/.investigate-turn.md` | Active investigation turn — `description`, `interaction_state` (awaiting_confirmation \| awaiting_clarification), `findings` (last findings text) |
| `specs/concerns-log.ndjson` | Append-only record of every push-back concern (v5). One JSON line per resolved concern: `{ts, phase, story_id, concern, response}`. Written by the orchestrator, not the subagent that raised it. Tracked in git — this is a decision record, not a scratchpad. |

Any scratch or intermediate files **must** go under `specs/scratchpad/`. Pass this to every subagent.

Turn-state files (`specs/.ideation-turn.md`, `specs/.story-spec-turn.md`, `specs/.investigate-turn.md`) are session scratchpad — add all three to `.gitignore` alongside `specs/.current-session`.

## Write ownership

| Field / file | Writer |
|---|---|
| `built:true` | Orchestrator only (after governor exits and overall_status:pass verified) |
| `spec_done:true` | Story-spec subagent (on user Y approval) |
| `deployed:true` | Deployment subagent |
| `intent_done:true` | Story-spec subagent (Step 2), ideation subagent (Step 3b), RE subagent (Pass 2) |
| `pending_spec_gap` | Development subagent only |
| `pending_arch_gap` | Story-spec or development subagent only |
| `auto_continue` | Orchestrator only |
| `governor_status`, `governor_iterations` | Orchestrator only (written after governor returns signal) |
| `governor-report.yaml` | Governor subagent only |
| `patches/patch-N.yaml` | Governor subagent only |
