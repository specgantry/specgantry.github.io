# SpecGantry v7 — Implementation Plan

## Context

SpecGantry v6 uses a Plan-Produce-Evaluate (PPE) loop that checks compliance — "did the produce agent follow the plan?" This surfaces structural completeness but misses cognitive quality: a page with no actionable buttons, five APIs where one parameterised one would do, a file-on-disk where a database query belongs. The user's three objectives require a fundamentally different model:

1. **Enterprise-grade design from day one** — architecture thinks big; the first build delivers full UX and working building blocks without operational infrastructure overhead
2. **Cognitive validation harness** — each phase challenges whether the right thing is being built, not whether a checklist was followed
3. **Developer intelligence** — not a cost ledger but actionable insight: which capabilities are expensive, how many cycles did each phase take, what patterns keep getting challenged

The overhaul replaces PPE with a **Challenge-Write-Judge** model at each phase, with the adversarial challenger as the constant thread. Fixed north star documents shipped with the plugin are replaced by a single per-project `specs/north-star.md` — a flowing prose document written during ideation and extended through spec and code phases, encoding what good looks like for *this* project specifically. Stories become **capabilities** — cohesive build units defined by what the system does, not what a user persona does. A `changelog.md` tracks release-level changes so agents building a new release never use deprecated fields or removed features.

---

## What changes vs what stays

**Stays:** orchestrator (SKILL.md) routing logic, project-state.yaml pipeline state machine, SubagentStart/SubagentStop cost hooks, MCP server, dashboard UI templates, deployment subagent, reverse-engineer subagent, investigate subagent, hook installer, aiClient.js, smartIterator.js.

**Changes:** all 9 PPE agent prompts (replaced by CWJ agents), all 3 north star files (replaced by north-star template), architecture skeleton, project-state skeleton, state-files reference, preamble, SKILL.md orchestrator loop, track-cost skill, dashboard references to "stories" → "capabilities".

**Removed:** `agents/northstars/ideation.md`, `agents/northstars/spec.md`, `agents/northstars/code.md` — replaced by per-project `specs/north-star.md`. Separate arch detail files (data-model.md, actors.md, ux.md, etc.) collapse into `architecture.md`. `specs/stories/` path → `specs/capabilities/`.

---

## New artifact map

| Artifact | Location | Written by | Read by |
|---|---|---|---|
| `north-star.md` | `specs/` | Ideation write (exit), extended by spec write | Ideation challenge+judge, spec challenge+judge, code challenge |
| `architecture.md` | `specs/architecture/` | Ideation write (exit) | Spec write, code plan+build |
| `changelog.md` | `specs/` | Orchestrator (on release bump) | Spec write, code plan |
| `intent.md` | `specs/capabilities/[ID]/` | Ideation write (exit) | Spec challenge+write+judge, code plan+challenge |
| `capability-spec.md` | `specs/capabilities/[ID]/` | Spec write | Code plan+build, spec judge |
| `project-state.yaml` | `specs/` | Orchestrator | All agents |
| `cost-log.ndjson` | `specs/` | SubagentStop hook | track-cost skill |
| `build-report.yaml` | `specs/capabilities/[ID]/` | Code build | Code challenge, orchestrator |

**Scratchpad (gitignored, deleted on phase exit):** `specs/.ideation-turn.md`, `specs/.capability-spec-turn.md`, `specs/.investigate-turn.md`, `specs/scratchpad/`, `specs/capabilities/*/.cwj-loop.yaml`

---

## New agent roster

Each phase has three agents. The orchestrator spawns them in sequence. Naming follows `spec-gantry:[phase]:[role]-agent` pattern to preserve hook matching (`spec-gantry:*:*`).

| Agent | Phase | Model | Job |
|---|---|---|---|
| `spec-gantry:ideation:ideation-challenge-agent` | ideation | haiku | Adversarial challenger — reads vision+answers so far, fires blocking questions |
| `spec-gantry:ideation:ideation-judge-agent` | ideation | haiku | Unblock checker — "would a developer be blocked starting specs?" |
| `spec-gantry:ideation:ideation-write-agent` | ideation | sonnet | Consolidation — writes north-star.md + architecture.md + intent.md per capability on exit |
| `spec-gantry:spec:spec-challenge-agent` | spec | haiku | Developer-proxy challenger — reads north-star+intent, asks what a developer would be blocked on |
| `spec-gantry:spec:spec-write-agent` | spec | sonnet | Writes capability-spec.md resolving the challenge list; extends north-star.md if new requirements surface |
| `spec-gantry:spec:spec-judge-agent` | spec | haiku | Unblock checker — "would a developer reading this spec still be blocked?" |
| `spec-gantry:code:code-plan-agent` | code | sonnet | Build approach — reads architecture+capability-spec+changelog, plans implementation order |
| `spec-gantry:code:code-build-agent` | code | sonnet | Builds the capability end-to-end |
| `spec-gantry:code:code-challenge-agent` | code | haiku | User-proxy challenger — reads north-star+intent+source files, asks "can a user accomplish what was promised?" |

Supporting agents — reconsidered from scratch:

**Investigate → diagnostic agent.** The question when something is wrong is not "which file?" but "what kind of problem?" Three classifications: (a) code doesn't match spec — fix is in the code; (b) spec was incomplete — fix is in the spec, then rebuild; (c) requirement was misunderstood in ideation — fix is in the north star, then re-spec and rebuild. The investigate agent surfaces this classification with evidence first, locates files second. Classification drives the repair route — the orchestrator routes to code-challenge, spec-challenge, or ideation-challenge accordingly.

**Deploy → north-star alignment check + mechanical deploy.** Before generating any deployment artifact, the deploy agent reads north-star.md and checks: does what we're shipping deliver what the north star promised? If any capability was CAPPED or had unresolved challenges recorded in project-state, it surfaces a non-blocking warning. The mechanical deployment steps (Dockerfiles, deploy.sh, etc.) run after the alignment check.

---

## New loop model

### Loop object (replaces Goal/Plan/Evaluation triple)

```yaml
# CWJ loop state — written to specs/capabilities/[ID]/.cwj-loop.yaml
phase: ideation | spec | code
iteration: N
challenges:           # list of blocking questions from challenge agent
  - id: 1
    question: "..."
    resolved: false | "[resolution]"
unresolved_count: N
exit_reason: null | achieved | capped | cycling
```

### Ideation loop: Challenge → User → Judge → repeat

```
max_iterations: 5 (configurable in project-state)

loop:
  challenge = invoke(ideation-challenge-agent, { vision, answers_so_far, iteration })
  // challenge agent returns list of blocking questions
  for each question: surface to user (TURN:), collect answer
  judge = invoke(ideation-judge-agent, { vision, all_answers, challenges_resolved })
  if judge.verdict == CLEAR:
    invoke(ideation-write-agent, { vision, all_answers })
    // writes north-star.md, architecture.md, intent.md per capability
    exit ACHIEVED
  if iteration >= max_iterations: exit CAPPED
  continue with updated answers
```

Human interaction: HIGH — every challenge question surfaces to user.

### Spec loop: Challenge → Write → Judge → repeat

```
max_iterations: 3 (configurable in project-state)

loop:
  challenge = invoke(spec-challenge-agent, { north-star, intent, iteration, prior_challenges })
  // challenge agent returns developer-blocking questions — resolved autonomously
  write = invoke(spec-write-agent, { architecture, intent, challenge_list, changelog })
  // writes capability-spec.md; may extend north-star.md
  judge = invoke(spec-judge-agent, { north-star, intent, capability-spec })
  if judge.verdict == CLEAR:
    surface capability-spec to user for approval (one checkpoint — not per cycle)
    exit ACHIEVED
  if iteration >= max_iterations: exit CAPPED
  continue
```

Human interaction: MINIMAL — user sees finished spec once per capability, approves or redirects.

### Code loop: Plan → Build → Challenge → repeat

```
max_iterations: 3 (configurable in project-state)

loop:
  plan = invoke(code-plan-agent, { architecture, capability-spec, changelog, prior_challenge (iteration 2+) })
  build = invoke(code-build-agent, { architecture, capability-spec, plan })
  // writes source files, build-report.yaml
  challenge = invoke(code-challenge-agent, { north-star, intent, source_files })
  // user-proxy: "can a user accomplish what was promised?"
  if challenge.verdict == CLEAR:
    exit ACHIEVED
  if iteration >= max_iterations: exit CAPPED
  continue with challenge output as plan input
```

Human interaction: NONE — fully automated. Surface only on CAPPED or spec-gap found.

---

## Files to create / rewrite / delete

### Create (new files)

1. `agents/ideation/ideation-challenge-agent.md` — adversarial challenger for ideation; reads vision + prior answers; outputs blocking question list; never writes files; model: haiku
2. `agents/ideation/ideation-judge-agent.md` — unblock checker; reads vision + all answers + resolved challenges; outputs CLEAR or BLOCKED with reason; model: haiku
3. `agents/ideation/ideation-write-agent.md` — consolidation agent; reads all ideation answers; writes north-star.md (flowing prose, no sections, appendix of challenge questions), architecture.md (pure technical), intent.md per capability; model: sonnet
4. `agents/spec/spec-challenge-agent.md` — developer-proxy challenger; reads north-star + intent; outputs list of developer-blocking questions with reasoning; model: haiku
5. `agents/spec/spec-write-agent.md` — writes capability-spec.md from challenge list + architecture + intent; extends north-star.md if new requirements surface; model: sonnet
6. `agents/spec/spec-judge-agent.md` — reads north-star + intent + capability-spec; outputs CLEAR or BLOCKED; model: haiku
7. `agents/code/code-plan-agent.md` — reads architecture + capability-spec + changelog; plans build approach and implementation order; model: sonnet
8. `agents/code/code-build-agent.md` — builds capability end-to-end from plan; writes source + build-report.yaml; model: sonnet
9. `agents/code/code-challenge-agent.md` — user-proxy challenger; reads north-star + intent + source files; traces user flow; outputs CLEAR or list of blocking UX/logic gaps; model: haiku
10. `agents/templates/north-star-seed.md` — seed template: one placeholder paragraph + horizontal rule + empty appendix section
11. `agents/templates/changelog-skeleton.md` — skeleton for specs/changelog.md with release block format

### Rewrite (existing files, substantial change)

12. `agents/_shared/preamble.md` — remove PPE loop objects (Goal/Plan/Evaluation schemas), replace with CWJ loop object schema; update path references (stories → capabilities); add §12: north-star reading discipline (read as whole prose, not section-by-section); add §13: changelog reading rule (code plan + spec write agents must check changelog before referencing any field or interface)
13. `agents/templates/architecture-skeleton.md` — strip cognitive/UX content (moves to north-star); keep only: Vision (one line), Tech Stack, Data Model, Actors, API Interfaces, Deployment, Guardrails, Configuration. No separate arch detail files — all in one document with `## section:name` anchors
14. `agents/templates/project-state-skeleton.yaml` — rename `stories` → `capabilities`; replace `ppe_loop` with `cwj_loop` (max_iterations per phase); add `cwj_loop.max_iterations.ideation: 5`, `.spec: 3`, `.code: 3`; add iteration counters per capability per phase for developer intelligence
15. `agents/references/state-files.md` — update all file paths (stories → capabilities), update loop state file (.ppe-loop.yaml → .cwj-loop.yaml), update agent roster, remove separate arch detail file entries (fold into architecture.md entry)
16. `skills/spec-gantry/SKILL.md` — replace PPE run_loop with CWJ loop implementations for all three phases; update routing (stories → capabilities); update PHASE_CONFIGS table; update all subagent invocation calls to new agent names; update post-ideation verification checklist (no separate arch files to check); update state file paths
17. `skills/spec-gantry/ui/dashboard.md` — rename "Story" column → "Capability", update path references, update sub-phase labels for CWJ phases (challenge/write/judge vs plan/produce/eval)
18. `skills/track-cost/SKILL.md` — overhaul from cost ledger to developer intelligence report: add iteration counts per phase per capability, challenge cycle summary (how many challenges fired per loop), cost-per-iteration, outlier detection (capabilities with >1 code cycle), release-split view

### Rewrite (supporting agents — reconsidered from scratch)

19. `agents/investigate/investigate-subagent.md` → **diagnostic agent**. Classifies the problem first (code/spec/requirement), locates files as supporting evidence, routes the orchestrator to the right repair entry point. Three verdicts: `CODE_BUG` (route to code-challenge), `SPEC_GAP` (route to spec-challenge), `REQUIREMENT_DRIFT` (route to ideation-challenge). Multi-turn confirmation preserved. Model: haiku.
20. `agents/deployment/deployment-subagent.md` → **north-star alignment check + mechanical deploy**. Step 0 added: reads north-star.md + project-state.yaml capability flags; surfaces non-blocking warning for any capability that exited CAPPED or has unresolved challenges. Mechanical deploy steps (Dockerfiles, deploy.sh, etc.) unchanged after Step 0. Model: sonnet (upgraded from haiku — alignment check requires reasoning).

### Update (minor changes)

21. `mcp/shared.js` — update AGENT_MAP: replace 9 PPE agent entries with 9 CWJ agent entries + updated investigate/deploy entries (same hook matching pattern `spec-gantry:*:*` — no hook infrastructure change needed)
22. `agents/templates/claude-notice.md` — bump version reference v6 → v7
23. `.claude-plugin/plugin.json` — version: "7.0.0", description updated

### Delete

24. `agents/northstars/ideation.md`
25. `agents/northstars/spec.md`
26. `agents/northstars/code.md`
27. `agents/ideation/ideation-plan-agent.md`
28. `agents/ideation/ideation-produce-agent.md`
29. `agents/ideation/ideation-eval-agent.md`
30. `agents/spec/spec-plan-agent.md`
31. `agents/spec/spec-produce-agent.md`
32. `agents/spec/spec-eval-agent.md`
33. `agents/code/code-plan-agent.md` (replaced by new version)
34. `agents/code/code-produce-agent.md` (replaced by code-build-agent)
35. `agents/code/code-eval-agent.md` (replaced by code-challenge-agent)

---

## Key design decisions captured

**North star format:** flowing prose, no headings, no sections. Opens with the project vision paragraph. Subsequent paragraphs added by spec write agent when new requirements surface. Ends with `---` horizontal rule followed by a flat list of challenge questions (no answers) grouped loosely by theme. Challenge agents read the whole document — no anchor-based surgical reads.

**Architecture format:** pure technical, `## section:name` anchors preserved for surgical reads. All content previously in separate files (data-model.md, actors.md, etc.) consolidates into one architecture.md. Spec write and code plan/build agents use anchor reads.

**Changelog format:** append-only, one block per release:
```
## Release 1.1.0 — 2026-07-19
- Dropped: user.profile_image (use avatar_url)
- Deprecated: POST /api/submit (use POST /api/submissions)  
- Added: bulk_import capability
```
Read by: spec-write-agent and code-plan-agent at start of every invocation when `project.release > "1.0.0"`.

**Capability vs story naming:** all paths change from `specs/stories/[STORY-ID]/` to `specs/capabilities/[CAP-ID]/`. Files inside change: `story-spec.md` → `capability-spec.md`. project-state.yaml `stories:` → `capabilities:`. Dashboard "Story" → "Capability". IDs retain same format (CAP-001 etc — short prefix change only).

**Developer intelligence (track-cost overhaul):** the skill reads both `cost-log.ndjson` AND `project-state.yaml` iteration counters. Report sections:
- Cost table (unchanged structure, capability rows instead of story rows)
- Iteration summary: per capability, per phase — how many CWJ cycles ran
- Challenge density: how many questions the challenge agent fired per cycle (signals complexity)
- Outliers: capabilities where code phase ran >1 cycle (flagged with the challenge that triggered repair)
- Release comparison: when changelog.md exists, cost/iteration split across releases

---

## Verification

1. Run `/spec-gantry` in a fresh directory — should reach ideation challenge agent, fire questions, collect answers, exit to ideation-write-agent, produce north-star.md + architecture.md + intent.md files
2. Confirm north-star.md is prose with no section headings and challenge question appendix
3. Confirm architecture.md has only technical content with `## section:name` anchors
4. Run spec phase — confirm challenge agent fires before any spec is written; confirm spec-write-agent reads challenge list; confirm spec-judge-agent returns CLEAR before user sees the spec
5. Run code phase — confirm fully automated; confirm code-challenge-agent reads north-star+intent (not capability-spec); confirm CLEAR exits without user interaction
6. Run `/track-cost` — confirm iteration counts appear alongside cost figures; confirm outlier capabilities are flagged
7. Confirm SubagentStop hook fires correctly for all new agent names (hook matcher is `spec-gantry:*:*` — no change needed, but verify cost-log entries appear with correct phase names)
8. Confirm changelog.md is created on first release bump and read by spec-write and code-plan agents on subsequent releases
