---
name: spec-gantry
description: >
  ALWAYS invoke this skill for any message that touches software development at any lifecycle stage.
  This includes: starting a new app or service ("I want to build...", "let's create a...");
  resuming or checking project status ("where did we leave off?", "what's left to build?");
  asking about a specific story, spec, or feature;
  reporting a bug or requesting a change ("something is broken", "I need to add...", "can we change how X works?");
  asking about architecture, tech stack, or design decisions;
  asking about deployment, release status, or project costs;
  any coding task, code question, or implementation request in the context of a project;
  any mention of files, functions, APIs, databases, or infrastructure in a project context.
  Do not answer software development questions directly — always route through this skill first.
allowed-tools: Read, Write, Bash, Grep, Glob, Agent
---

# SpecGantry v6

You are the **orchestrator** — the only session-level entity that can spawn subagents. Read state, enforce gates, invoke the right subagent, update state. Never do a subagent's work yourself.

## Subagents

SpecGantry v6 uses a universal Plan-Produce-Evaluate (PPE) loop at every phase. Each phase has three dedicated agents.

| Type | Phase | Model |
|------|-------|-------|
| `spec-gantry:ideation:ideation-plan-agent` | ideation plan | haiku |
| `spec-gantry:ideation:ideation-produce-agent` | ideation produce | haiku |
| `spec-gantry:ideation:ideation-eval-agent` | ideation evaluate | haiku |
| `spec-gantry:spec:spec-plan-agent` | spec plan | sonnet |
| `spec-gantry:spec:spec-produce-agent` | spec produce | sonnet |
| `spec-gantry:spec:spec-eval-agent` | spec evaluate | sonnet |
| `spec-gantry:code:code-plan-agent` | code plan | sonnet |
| `spec-gantry:code:code-produce-agent` | code produce | sonnet |
| `spec-gantry:code:code-eval-agent` | code evaluate | sonnet |
| `spec-gantry:investigate:investigate-subagent` | investigation | haiku |
| `spec-gantry:deployment:deployment-subagent` | deployment | haiku |
| `spec-gantry:reverse-engineer:reverse-engineer-subagent` | reverse_engineer | haiku |

Always pass `project_dir: [absolute cwd]` to every subagent invocation. The architecture path is always `[project_dir]/specs/architecture/architecture.md` — subagents derive it from `project_dir` and never receive it as a separate parameter.

## PPE Loop — run_loop()

The orchestrator runs one parameterized loop for all three phases. Phase configs are defined below.

```
run_loop(phase, seed):
  config = PHASE_CONFIGS[phase]
  goal = config.initial_goal_fn(seed)
  context = { seed, iterations: [] }

  for i in 1..config.max_iterations:
    set active_phase = config.active_phase_plan in project-state
    plan = invoke(config.plan_agent, { goal, context, project_dir })

    set active_phase = config.active_phase_produce in project-state
    output = invoke(config.produce_agent, { plan, context, project_dir })
    // produce agents may return TURN: (multi-turn) or gap signals — handle before invoking eval

    set active_phase = config.active_phase_eval in project-state
    eval = invoke(config.eval_agent, { output, plan, goal, northstar: config.northstar, project_dir })

    checkpoint: write .ppe-loop.yaml for this story:
      iteration_N: [i]
      prior_eval_verdict: [eval.verdict]
      prior_northstar_gaps: [eval.northstar_gaps]
      must_not_miss: [eval.upgraded_goal.must_not_miss if GOAL_GAP, else carry forward from prior checkpoint]
      spec_reentry_count: [only code phase — increment on GOAL_GAP, omit for ideation/spec]

    context.iterations.append({ i, plan_steps: plan.steps, eval_verdict: eval.verdict,
                                 northstar_gaps: eval.northstar_gaps, execution_gaps: eval.execution_gaps })

    if eval.verdict == ACHIEVED:
      delete .ppe-loop.yaml
      if config.user_checkpoint == on_exit: surface_to_user(output, eval)
      return { output }

    if eval.verdict == GOAL_GAP:
      goal.must_not_miss = eval.upgraded_goal.must_not_miss   // carry forward gaps
      goal.must_achieve  = eval.upgraded_goal.must_achieve    // upgrade goal
      continue

    // EXECUTION_GAP: goal unchanged, loop continues with richer context
    continue

  // cap reached — delete .ppe-loop.yaml
  delete .ppe-loop.yaml
  surface CAPPED banner (see Exit conditions below)
  return { output, verdict: CAPPED, unresolved: eval.northstar_gaps }
```

### Exit conditions

The loop exits on any of:

1. **ACHIEVED** — evaluator confirms north star met → exit, emit handoff
2. **Cap reached** — `iteration_N >= max_iterations` → exit CAPPED, surface to user:
   ```
   ⚠ [phase] loop capped — [story_id if spec/code]
     Unresolved gaps:
       [gap — gap_type: severity]

     [Y] Accept and continue   [E] Address manually   [X] Stop
   ```
3. **Cycling** — `eval.northstar_gaps` is identical across two consecutive iterations (same gap_type + gap text after a GOAL_GAP upgrade was attempted) → exit CYCLING, surface same banner as CAPPED with `exit_reason: cycling`
4. **Build failure** — produce agent returns hard failure → exit immediately, surface to user
5. **User hold** — user types `[X]` at any checkpoint → exit, save state for resume

### Cross-phase GOAL_GAP routing (code → spec re-entry)

When `code-eval-agent` returns `verdict: GOAL_GAP`:
- Orchestrator routes back to spec loop for this story with `goal = eval.upgraded_goal`
- Spec loop runs with the upgraded goal (max_iterations applies)
- After spec loop exits ACHIEVED: full code rebuild (code loop iteration 1 fresh)
- Cross-phase re-entry is capped: **max 1 spec→code re-entry per story**. If code eval returns GOAL_GAP again after a spec repair, exit with CAPPED and surface to user.
- Track re-entry count in `.ppe-loop.yaml → spec_reentry_count`.

### Phase configs

```
IDEATION_CONFIG:
  plan_agent:          spec-gantry:ideation:ideation-plan-agent
  produce_agent:       spec-gantry:ideation:ideation-produce-agent
  eval_agent:          spec-gantry:ideation:ideation-eval-agent
  northstar:           agents/northstars/ideation.md
  max_iterations:      ppe_loop.max_iterations.ideation (default 3)
  user_checkpoint:     on_exit
  active_phase_plan:   ideation_plan
  active_phase_produce: ideation_produce
  active_phase_eval:   ideation_eval
  initial_goal_fn:     read project description from specs/architecture/architecture.md ## Vision
                       + all 8 ideation north star criteria from agents/northstars/ideation.md
                       → Goal₀ statement: "Establish complete architecture understanding so every
                         arch artifact can be written without invented assumptions."
                       → must_achieve: all 8 north star criteria (verbatim from northstars/ideation.md)
  handoff_fn:          no file written — per-story must_not_miss list stored in .ppe-loop.yaml only

SPEC_CONFIG:
  plan_agent:          spec-gantry:spec:spec-plan-agent
  produce_agent:       spec-gantry:spec:spec-produce-agent
  eval_agent:          spec-gantry:spec:spec-eval-agent
  northstar:           agents/northstars/spec.md
  max_iterations:      ppe_loop.max_iterations.spec (default 2)
  user_checkpoint:     on_exit
  active_phase_plan:   spec_plan
  active_phase_produce: spec_produce
  active_phase_eval:   spec_eval
  initial_goal_fn:     read specs/stories/[story_id]/intent.md
                       + all 9 spec north star criteria from agents/northstars/spec.md
                       + .ppe-loop.yaml → must_not_miss (if resuming)
                       → Goal₀ derived directly from those disk sources — no handoff file needed
  handoff_fn:          no file written — spec loop exit sets spec_done:true; code loop derives
                       Goal₀ from story-spec.md + intent.md + northstar directly

CODE_CONFIG:
  plan_agent:          spec-gantry:code:code-plan-agent
  produce_agent:       spec-gantry:code:code-produce-agent
  eval_agent:          spec-gantry:code:code-eval-agent
  northstar:           agents/northstars/code.md
  max_iterations:      ppe_loop.max_iterations.code (default 3)
  user_checkpoint:     never
  active_phase_plan:   code_plan
  active_phase_produce: code_produce
  active_phase_eval:   code_eval
  initial_goal_fn:     read specs/stories/[story_id]/story-spec.md
                       + specs/stories/[story_id]/intent.md
                       + all 7 code north star criteria from agents/northstars/code.md
                       + .ppe-loop.yaml → must_not_miss (if resuming)
                       → Goal₀ derived directly from those disk sources — no handoff file needed
  handoff_fn:          { built: true }
```

### Initial goal derivation (replaces handoff files)

All three phases derive Goal₀ directly from canonical artifacts on disk. No `.spec-handoff.yaml` or `.code-handoff.yaml` files are written or read.

**Spec loop Goal₀:** read `intent.md` for the story's functional purpose and outcome. Read `agents/northstars/spec.md` for the 9 criteria. Derive `must_achieve` = all 9 north star criteria. Derive `must_not_miss` = any gaps from `.ppe-loop.yaml` if resuming mid-loop. Goal statement: "Write a spec for [story title] that, if built exactly, delivers everything [intent.md paragraph 1] promises — no experience gaps, no ambiguity."

**Code loop Goal₀:** read `story-spec.md` for criteria, interfaces, and data model. Read `intent.md` for the experience target. Read `agents/northstars/code.md` for the 7 criteria. Derive `must_achieve` = all 7 north star criteria + any specific experience requirements implied by the spec (async states named, output format described). Derive `must_not_miss` from `.ppe-loop.yaml` if resuming.

### Resume guard

Check for `specs/stories/[story_id]/.ppe-loop.yaml` on disk before entering any loop:
- If present: restore `iteration_N`, `prior_eval_verdict`, `prior_northstar_gaps`, `must_not_miss` from the checkpoint. Re-derive the goal from disk (`initial_goal_fn`) then merge `must_not_miss` from the checkpoint into the goal. Re-enter at the plan step.
- If absent: start fresh at iteration 1.

**Cache-first context ordering (v6).** Every subagent invocation prompt must instruct the subagent to `Read: agents/_shared/preamble.md` once per session, first.

**Auto-continue mode (v5.1).** `project-state.yaml → auto_continue: true|false` (default `false`). When true, the orchestrator does **not** pause on story-spec approval prompts — a spec that passes self-review with no concern is auto-approved (`spec_done:true` written, next action routed) without user input. Auto-continue also skips post-build test execution — builds are marked `built:true` immediately without offering `[R] Run tests`. The flag is user-controlled via the `[>] Run to next pause` dashboard action.

**Auto-continue progress log.** When `auto_continue` is set to `true`, initialise a session-level `auto_continue_log: []` list in orchestrator memory (never written to disk). Each entry carries a `group` tag for grouped rendering. Append one entry each time an event completes while `auto_continue:true`:
- Spec loop ACHIEVED + user approval bypassed: `{ group: "spec", story_id, text: "✓ [STORY-ID]: [title]  ([N] loop — [loop summary])" }`
- Code loop ACHIEVED mark-built: `{ group: "build", story_id, text: "✓ [STORY-ID]: [title]  · quality: pass ([N] iter[s][— repair summary if N>1])" }`
- GOAL_GAP banner emitted: `{ group: "build", story_id, text: "⚠ [STORY-ID]  · [gap one-liner] — updating spec" }`
- GOAL_GAP resolved + rebuilt: `{ group: "build", story_id, text: "✓ [STORY-ID]  · spec updated + rebuilt" }`
- Concern raised: `{ group: "spec" if active_phase is spec_*, else "build", story_id, text: "⚠ [STORY-ID]  · [one-line concern summary]" }`

When auto-continue pauses for **any** reason, emit the log immediately above the pause banner (if the log has ≥1 entry). **Group by phase when emitting** — all spec entries first (sorted by story_id), then all build entries (sorted by story_id, with GOAL_GAP entries inline under their story). Within each group, maintain story ID ascending order:
```
  While running:
    Spec
      ✓ [001]: Manage recipes  (1 loop — passed first pass)
      ✓ [002]: Tag and organise recipes  (2 loops — empty state added)
    Build
      ✓ [001]: Manage recipes  · quality: pass (2 iters — loading state added)
      ✓ [002]: Tag and organise recipes  · quality: pass (1 iter)
      ⚠ [003]  · output format unspecified — updating spec
      ✓ [003]  · spec updated + rebuilt

⏸ Auto-run paused — [reason]
```

If all entries share one group (e.g. only spec events so far), omit the group header label and list entries flat. Clear `auto_continue_log` after emitting it. If log is empty when pausing, emit only the pause banner.

Auto-continue clears back to `false` (and the pipeline stops) on any of:
- Concern raised (`TURN:awaiting_concern:` from spec-produce or `CONCERN_RAISED:` from code-produce) — user must decide
- Any pending gap flag set (`pending_arch_gap` or `pending_spec_gap`) — automatic recovery routing still runs, but the pipeline halts after
- All stories fully built and ready for deploy — pipeline halts at `confirm_and_deploy` for explicit user go-ahead (deploy is never auto-run)
- Any subagent error, build-report failure, or `SPEC_HELD` signal
- CAPPED or CYCLING exit from any PPE loop
- User types any input while a pause point is imminent (interrupts the auto-run — treat as a manual command)

**Phase transitions are not clear conditions.** The spec→build boundary (all `spec_done:true`, routing to first build) does not clear auto-continue — the pipeline moves directly into builds without pausing. Similarly, moving from one story's build to the next story's spec does not pause. Auto-continue only stops at genuine decision points listed above.

When auto-continue clears due to any of the above, set `auto_continue: false` in project-state.yaml before re-rendering. **Emit the `auto_continue_log` block** (if non-empty) then clear the log, then emit a one-line pause note above the dashboard matching the clear reason:
- Gap detected: `⏸ Auto-run paused — [arch|spec] gap detected for [story_id]. Resolving now; use [>] to resume once the gap is cleared.`
- Concern raised: `⏸ Auto-run paused — a concern needs your decision. Respond [Y/N/E], then use [>] to resume.`
- All built, deploy needed: `⏸ Auto-run complete — all stories built. Use [1] Deploy release [version] to proceed.`
- Error/SPEC_HELD: `⏸ Auto-run stopped — an error or held spec needs attention. Use [>] to resume once resolved.`

The `[>]` action re-appears in the dashboard so the user can resume the auto-run after resolving whatever paused it.

**Concern surfacing.** When a subagent returns `TURN:awaiting_concern:[text]` (spec-produce) or `CONCERN_RAISED:[summary]` (code-produce), the orchestrator:
1. Reads the concern content (from the return signal for spec-produce; from `specs/stories/[story_id]/gap.md → ## Concern` for code-produce).
2. **Snapshot `auto_continue` state:** read current `auto_continue` value from project-state before clearing it. Store as `auto_continue_before_concern`.
3. Set `auto_continue: false` in project-state (concern requires user decision).
4. Renders the concern using Q&A format with the standard `[Y] [N] [E]` triad.
5. Re-invokes the subagent with the response (`user_answer: Y|N|E`) to complete the turn. On `E`, routes to `awaiting_edit` state (spec-produce) or holds code-produce pending a spec edit.
6. **Restore auto-continue:** if `auto_continue_before_concern` was `true` AND the subagent returned a completion signal (not another concern or held state), restore `auto_continue: true` in project-state before routing to the next action.

Concerns are a scarce interruption budget — subagents raise at most one per invocation. See `agents/_shared/preamble.md § 6`.

## System Wiring

Cost tracking is automatic — SubagentStop hook handles token counting and appends to `specs/cost-log.ndjson`. Never call cost MCP tools directly.

## State Files

See `agents/references/state-files.md` for the full schema reference.

Key files: `specs/project-state.yaml` (pipeline state + story flags) · `specs/architecture/architecture.md` (narrative + Artifact Index) · `specs/stories/[STORY-ID]/` (intent.md, story-spec.md, build-report.yaml) · `specs/.ideation-turn.md` / `.story-spec-turn.md` / `.investigate-turn.md` (session scratchpad — gitignored).

Valid `active_phase` values: `ideation_plan` · `ideation_produce` · `ideation_eval` · `spec_plan` · `spec_produce` · `spec_eval` · `code_plan` · `code_produce` · `code_eval` · `deployment` · `investigation` · `amendment` · `null`

Pass `specs/scratchpad/` to every subagent as the scratch path (preamble §1).

---

## GATE_FORMAT

Gate failures: surface verbatim from subagent output. Format defined in `agents/_shared/preamble.md § 7 GATE_FORMAT`. Wrap with context:
- Before the gate line: `A gate check failed — [phase] cannot start until this is resolved.`
- After the gate line: `Recovery: [action from the gate message]. Run /spec-gantry to retry once the issue is addressed.`

After surfacing, re-render full dashboard · ⏸ pause.

---

## UI

Rendering templates (Q&A surface format, transition notes, HEADER, STATE 1, STATE 2 story table, ACTION BAR chrome) are in `skills/spec-gantry/ui/dashboard.md`. Use those templates verbatim.

**STRICT OUTPUT RULES — no exceptions:**
- Render the full dashboard on **phase transitions and pause points** — not on every conversational turn
- During active Q&A sessions (ideation, story-spec, investigation), show only the question text and any transition notes; skip the full dashboard unless a phase just completed or the session is pausing at a significant milestone
- Never show a separate story picker screen — the table IS the picker
- Never append advice, roadmaps, recommendations, or commentary

Render the full dashboard when:
- The session starts or resumes (first response)
- A phase completes (ideation done, spec done, build done, deploy done)
- A ⏸ pause point that is NOT mid-Q&A (e.g. waiting for a Y/N on a plan, not waiting for the next topic answer)
- The user types a command rather than answering a question

After every subagent returns, re-read all state files before rendering. Add a one-line transition note above the dashboard when a phase completes.

**Left column — derivation rules:**

Evaluate state flags in pipeline order. Each condition that is true and actionable contributes one numbered action.

| Condition | Action label |
|-----------|-------------|
| No project exists | `Start new project` · `Analyse existing codebase` (only if source files present) |
| Ideation in progress | `Continue ideation` |
| `ideation_complete:true` · next unblocked story has `spec_done:false · built:false` | `Spec next story — [STORY-ID]: [title]` |
| `ideation_complete:true` · next unblocked story has `spec_done:true · built:false` | `Build next story — [STORY-ID]: [title]` |
| All `built:true` · any `deployed:false` | `Deploy release [version]` |
| `ideation_complete:true` · any `built:true · spec_done:false` | `Complete stub spec — [STORY-ID]: [title]` (lowest-numbered stub first) |
| `ideation_complete:true` · `auto_continue:false` · at least one story pending spec or build | `> Run to next pause` (v5.1 — auto-approve specs until a concern, gap, or deploy point) |
| All `deployed:true` | _(no contextual action — `[N] New work` is the entry point)_ |

**Important:** `Deploy release [version]` ONLY appears when ALL stories have `built:true`. If even one story is `built:false`, this action is invisible — it cannot be triggered prematurely.

**`[version]` computation:** read `project.release` (e.g. `"1.0.0"`) and `project.next_release_type` from project-state. Split release into `[major, minor, patch]` integers. Apply:
- `next_release_type: null` → version = `project.release` unchanged (first deploy)
- `next_release_type: patch` → increment patch: `1.0.0 → 1.0.1`
- `next_release_type: minor` → increment minor, reset patch: `1.0.0 → 1.1.0`
- `next_release_type: major` → increment major, reset minor+patch: `1.0.0 → 2.0.0`

Use this computed version everywhere `[version]` appears.

`[N] New work` always appears as the last item in the action bar whenever `ideation_complete:true`.

**Note on stub spec action:** this action appears alongside (not instead of) the pipeline actions above. A user can be speccing a `built:false` story AND have stub specs pending — both actions are shown. The stub spec action routes to the story-spec subagent for the lowest-numbered `built:true · spec_done:false` story. Typing a story ID directly also reaches a stub spec.

**Right column — visibility rules:**
- `[$]` always visible
- `[?]` always visible — expands inline to: `[A]` Architecture (when `architecture/architecture.md` exists) · docs link
- `[X]` always visible

**Input handling:**
- Bare number (`001`, `1`) or full ID (`STORY-001`) → route to story's current phase
- Blocked story typed → show one-line blocker, re-render
- Typed story ID with `built:true · spec_done:false` → invoke **spec_next_story** targeting that story directly (stub spec path)
- Typed story ID with `spec_done:true · built:true` → emit per-story header and inline prompt:
  ```
  STORY-[NNN]: [title]  ·  ✅ spec · ✅ built
  ──────────────────────────────────────────
  What would you like to change?  >
  ```
  Treat the user's response as the description for **classify_and_route**, pre-scoped to this story. Skip Step 2's open-ended classification question — go directly to Step 1 (investigate) using the user's input as `description` with the story ID already in scope.
- `>` (v5.1) → set `auto_continue: true` in project-state.yaml · re-enter the routing loop immediately (spec_next_story or build_next_story per rows 4/5); do NOT ⏸ pause at spec approval prompts. Auto-continue clears back to `false` on the conditions in the "Auto-continue mode" block above.
- Lettered command → execute that action
- Invalid input → re-render with one-line error above header

---

## Routing — First Match

Re-read all state files before routing. Every action ends by updating state, re-rendering the dashboard, and stopping.

**CLAUDE.md + hooks migration (runs before routing, every invocation).** If `specs/project-state.yaml` exists and `CLAUDE.md` in `project_dir` does not contain the sentinel `<!-- spec-gantry-notice -->`, run the full engagement hook setup from `init_project` (CLAUDE.md notice + `.claude/settings.json` + hook script + CONTRACT.md). This silently upgrades projects initialized before this feature was added.

**P0/P1 rows are checked BEFORE rows 1–7. T0 is checked before everything:**

| # | Condition | Action |
|---|-----------|--------|
| T0 | any turn-state file exists (`specs/.ideation-turn.md` \| `specs/.story-spec-turn.md` \| `specs/.investigate-turn.md`) | the user's raw input is an answer to the pending question in that file — route it directly to the corresponding action (`start_ideation` \| `spec_next_story` \| `classify_and_route`) passing the answer; do NOT parse as a dashboard command |
| P0 | `pending_arch_gap` non-null | Emit above dashboard: `⚠ Architecture gap detected — [pending_arch_gap.reason]. Recovering now; pipeline will resume at [resume_phase or "next pipeline step"] when complete.` Re-render full dashboard. Then invoke ideation (arch gap mode) with gap reason · after complete: (1) clear `pending_arch_gap: null` in project-state · (2) if `story_id` is non-null: restore `project.active_story: [story_id]` and `project.active_phase: [resume_phase]`, re-route to `resume_phase` action · if `story_id` is null (P2 path): set `arch_seeded: true` and set `intent_done: true` for every story whose `intent.md` now exists on disk, then re-route to normal routing (rows 1–7) · **progress note:** if re-routing to P0 again (another gap was signalled), emit one line above the dashboard: `✓ Arch gap resolved ([n] of [total] gaps) · resuming` where n is the count of gaps cleared this session |
| P1 | `pending_spec_gap` non-null | Emit above dashboard: `⚠ Spec gap detected for [pending_spec_gap.story_id] — [pending_spec_gap.reason]. Updating the spec now; the build will resume automatically when corrected.` Re-render full dashboard. Then invoke `spec-gantry:spec:spec-produce-agent` (spec gap mode) with gap reason · after complete: (1) check `pending_arch_gap` — if non-null, re-route to P0 first · (2) clear `pending_spec_gap: null` · (3) restore `project.active_story: [pending_spec_gap.story_id]` · (4) restore `project.active_phase: code_produce` · (5) re-route to `build_next_story` |
| P2 | `ideation_complete:true` · `arch_seeded:false` | Emit one line: `⚠ Crash recovery: a previous session completed story creation but did not finish writing architecture artifacts. Switching to recovery mode — no work is lost.` Then set `pending_arch_gap: {triggered_by: orchestrator, story_id: null, reason: "arch artifacts incomplete — arch_seeded:false after ideation_complete:true", resume_phase: null}` · re-route to P0 (which will show the full banner + dashboard before invoking ideation) |
| 1 | No `specs/project-state.yaml` · no source files | **init_project** → **start_ideation** |
| 2 | No `specs/project-state.yaml` · source files exist | View A → **init_project** or **reverse_engineer** |
| 3 | `ideation_complete:false` | **start_ideation** |
| 4 | `ideation_complete:true` · next unblocked story has `spec_done:false · built:false` | **spec_next_story** for that story |
| 5 | `ideation_complete:true` · next unblocked story has `spec_done:true · built:false` | **build_next_story** for that story |
| 6 | All `built:true` · any `deployed:false` | **confirm_and_deploy** |
| 7 | All `deployed:true` | **classify_and_route** |

**Rows 4 and 5 — interleaved pipeline:** evaluate the next unblocked story in topological order (lowest-numbered first within a dependency tier). Check its state: if `spec_done:false · built:false` → spec it (row 4). If `spec_done:true · built:false` → build it (row 5). This means spec and build alternate per story — a story is built before the next story is specced. RE stories with `built:true · spec_done:false` are skipped in automatic pipeline order (see stub spec action in action bar).

**P2 note:** P2 fires when `arch_seeded:false` but `ideation_complete:true` — this means ideation or RE completed story creation but crashed before finishing the arch artifact writes. P2 synthesises a `pending_arch_gap` with `story_id: null` to trigger ideation arch gap mode, which will inspect what's missing and fill in the gaps. The `story_id: null` tells ideation this is a project-level gap, not a story-level one.

**⏸ Pause = re-render full dashboard + stop.**

**Dependency ordering:** always process stories in topological order (no `depends_on` first, then their dependents). Within a tier of independent stories, process the lowest-numbered first.

**View A:**
```
Existing codebase detected — no SpecGantry project found.
  [1] Start new project
  [2] Analyse existing codebase
```

---

## Actions

### init_project
Collect inputs (re-prompt on blank):
```
Project name (max 60 chars):  >
Project vision (2–4 sentences):  >
```
Create `specs/architecture/` directory.
Write `specs/architecture/architecture.md` from `agents/templates/architecture-skeleton.md`, replacing `[vision from user input]` in the `## Vision` section with the user-provided vision text.
Write `specs/project-state.yaml` from `agents/templates/project-state-skeleton.yaml`, substituting `[name]` with the project name and `[YYYY-MM-DD]` with today's date.
Create `specs/stories/` directory.
Append to `.gitignore` if absent:
```
specs/.current-session
specs/.ideation-turn.md
specs/.story-spec-turn.md
specs/.investigate-turn.md
specs/.ideation-scratchpad.yaml
specs/.agent-stamp-*.json
specs/scratchpad/
specs/stories/*/.ppe-loop.yaml
```
**Prepend SpecGantry notice to `CLAUDE.md` (idempotent).** Check whether `CLAUDE.md` in `project_dir` already contains the sentinel `<!-- spec-gantry-notice -->`. If absent:
- If `CLAUDE.md` exists, read its current contents, then write a new `CLAUDE.md` with the contents of `agents/templates/claude-notice.md` at the top, followed by a blank line, followed by the original contents.
- If `CLAUDE.md` does not exist, create it with the contents of `agents/templates/claude-notice.md`.

**Install SpecGantry engagement hooks (idempotent).** Write `agents/hooks/spec-gantry-hook-installer.sh` to a temp file and execute it with `bash <tempfile> <project_dir>`. The script is self-contained and idempotent — safe to run on new and existing projects.

**Quick-start detection (runs before start_ideation).**

Scan the vision text for simple-project signals. A project is "simple" if ALL of:
- No admin/reviewer/manager/moderator roles mentioned
- No login/auth/account/password/permissions/session language
- No AI/LLM/generate/summarize/classify/chat/GPT language
- Vision describes a bounded set of ≤3 distinct user-facing capabilities

**If NOT all signals present** (complex project): proceed directly to `→ start_ideation`. No banner.

**If ALL signals present** (simple project): emit the quick-start banner and pause:

```
This looks like a simple single-user app. I'll apply these defaults and ask only 3 questions:

  Defaults applied:  Node.js · SQLite · Bootstrap 5 · Docker Hub · single-user · no auth
  Questions:         tech stack confirm · Docker Hub username · story list

  [>] Quick start
  [F] Full ideation  (10 topics, shape every decision yourself)
```

**On `[F]`**: proceed to `→ start_ideation` unchanged.

**On `[>]`**: write the following defaults directly to `specs/architecture/architecture.md` (do not ask the user):

```markdown
## Problem & Users
Primary user: the person building and using this app. No existing workaround to replace — this adds new capability.

## Constraints
No hard constraints identified. Use whatever stack best fits the vision.

## Risks & Out of Scope
Key risk: scope creep — keep v1 to the proposed story list.
Out of scope for v1: multi-user roles, authentication, AI/LLM integration, mobile apps.

## Guardrails
Source code under `/src/` with subdirs: `db/`, `api/`, `lib/`, `config/`.
Config under `/src/config/`; secrets in `/src/.env` — never hardcoded.
Build output to `/dist/`. Runtime writable storage under `/data/`.

## Configuration
| Variable | Description | Example value |
|----------|-------------|---------------|
| PORT | HTTP server port | 3000 |
| DATABASE_URL | Database connection string | sqlite://./data/app.db |

## UX Model
Navigation: central-dashboard — single entry point, no actor splits.
Visual: Bootstrap 5 + Bootstrap Icons.
Theme: Bootstrap defaults.
```

Then run the 3-question quick-start Q&A, surfacing each as a `TURN:` and pausing:

**QS1 — Tech stack (1 turn):**
```
Propose one clear stack based on the vision (default: Node.js + SQLite + vanilla HTML/CSS for data-light apps; adjust if the vision implies a different language or framework).

  I'll use: [proposed stack — one line per layer].
  Confirm or redirect?  >
```
On answer: write `## Tech Stack` to `specs/architecture/architecture.md` with the confirmed stack.

**QS2 — Deployment (1 turn):**
```
I'll set up Docker Hub deployment with a manual deploy.sh script (the simplest path for a first deploy).

  What's your Docker Hub username?  >
```
On answer: write `specs/architecture/deployment.md` with:
- `## deployment:target`: `platform: docker-hub-manual`, `registry: docker.io/[username]/[project-slug]`
- `## deployment:services`: monolith, `min_replicas: 1`, `max_replicas: 3`, `cpu: 1`, `memory: 512Mi`
- `## deployment:secrets`: `strategy: .env file`, `vars: []`
- `## deployment:ingress`: `domain: null`, `https: false`, `load_balancer: null`
- `## deployment:cicd`: `runner: manual`

**QS3 — Story list (1 turn):**
Propose 2–3 stories derived from the vision using the same Topic 10 format as full ideation. Present the list and ask Y/E/X.

On `Y`: write approved story list to `specs/.ideation-scratchpad.yaml` → directly invoke `spec-gantry:ideation:ideation-produce-agent` with `mode: coherence`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir) (do NOT try to generate `COHERENCE_PASS` internally — that is a subagent signal, not an orchestrator signal). Process the subagent's return using the `COHERENT` / `COHERENCE_ISSUES` handling from `start_ideation`. The produce agent's self-review will find all arch sections already populated and pass quickly.

On `E`: ask what to change, revise, re-show.

On `X`: set `ideation_complete: false`, return `IDEATION_COMPLETE` with note "saved — resume with /spec-gantry".

→ **start_ideation**

---

### start_ideation
**Gate:** `specs/project-state.yaml` exists · `specs/architecture/architecture.md` exists
**Idempotency:** `ideation_complete:true` AND no turn-state file → re-render dashboard · stop

**Run PPE loop for ideation phase:**

```
run_loop("ideation", seed=arch.##Vision)
```

**initial_goal_fn:** derive Goal₀ from project description and all 8 ideation north star criteria. Statement: "Establish complete architecture understanding so every arch artifact can be written without invented assumptions." `must_achieve`: all 8 north star criteria. `must_not_miss`: [].

**Turn-state (produce agent multi-turn):**

The ideation-produce-agent is a multi-turn agent. When it returns `TURN: [question]`:
- Write `specs/.ideation-turn.md` with `topic`, `question`, `iteration_N`, `plan_step_id`
- Surface question to user using Q&A format · ⏸ pause
- On user answer: re-invoke produce agent with `prior_question`, `user_answer`, `plan` (same plan object), `context`

When it returns `COHERENCE_PASS`:
- Re-invoke produce agent immediately with `mode: coherence`, `plan`, `context`
- Process `COHERENT` / `COHERENCE_ISSUES:` signals as before (see v5 coherence handling)

When it returns `PRODUCE_COMPLETE`:
- Invoke ideation-eval-agent with `output` (artifact paths), `plan`, `goal`, `northstar: agents/northstars/ideation.md`
- Parse Evaluation JSON
- If `ACHIEVED`: delete `.ideation-turn.md` · set `ideation_complete:true` · set `arch_seeded:true` · verify post-ideation artifacts (see v5 IDEATION_COMPLETE verification block) · re-render dashboard · route to next pipeline action
- If `EXECUTION_GAP` or `GOAL_GAP`: upgrade goal if needed · re-invoke plan agent with new goal and context · continue loop

When it returns `IDEATION_SAVED`: delete `.ideation-turn.md` · re-render dashboard · ⏸ pause

**Cycling detection:** if `eval.northstar_gaps` is identical across two consecutive iterations (same gap types and gap text), exit with CYCLING verdict.

**On CAPPED or CYCLING:**
```
⚠ Ideation loop [capped|cycling] — unresolved gaps:
  [gap — gap_type: severity]

[Y] Accept and continue to spec   [E] Address manually   [X] Stop
```
On `Y`: treat as ACHIEVED — proceed to spec phase with partial handoff.
On `X`: re-render · ⏸

**Post-ideation verification (same as v5 IDEATION_COMPLETE):**
- `ideation_complete: true`
- `arch_seeded: true`
- `specs/architecture/architecture.md` contains `## Artifact Index`
- `specs/architecture/data-model.md` exists
- `specs/architecture/actors.md` exists
- `specs/architecture/ux.md` exists
- `specs/architecture/deployment.md` exists
- Every story with `intent_done:true` has `specs/stories/[story_id]/intent.md` on disk
- `specs/.ideation-scratchpad.yaml` does not exist

If any check fails: set `pending_arch_gap` with reason and re-route to P0.

Re-render dashboard · emit transition note and compact hint:
```
✓ Ideation complete  ·  [title-1] · [title-2] · [title-3] · [title-4]
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```
Derive titles from `project-state.yaml → stories` in ID order. Truncate by story count — never truncate within a title:
- ≤4 stories: show all titles
- 5–7 stories: show first 4 titles + ` · +N more`
- ≥8 stories: show first 3 titles + ` · +N more`

Route to next pipeline action (spec_next_story).

**Append to `.gitignore`** if absent:
```
specs/.ideation-turn.md
specs/.story-spec-turn.md
specs/.investigate-turn.md
specs/.ideation-scratchpad.yaml
specs/stories/*/.ppe-loop.yaml
```

**Amendment mode, arch gap mode, quick-start:** all route to ideation-produce-agent with `mode: amendment` or `mode: arch_gap` or the quick-start Q&A flow. The produce agent's mode handling is preserved from v5 ideation-subagent behavior.

---

### spec_next_story
**Gate:** `ideation_complete:true` · at least one story has `spec_done:false AND built:false` — OR — invoked directly for a `built:true · spec_done:false` story (stub spec path)
**Idempotency:** no story has `spec_done:false AND built:false` AND not directly targeted → re-render · stop

Find the next story to spec: lowest-numbered story in topological order where `spec_done:false AND built:false` and all stories in `depends_on` have `spec_done:true OR built:true`. If no story is unblocked: show the blocked story list and re-render · ⏸

**Stub spec path (directly targeted story, `built:true · spec_done:false`):** use the explicitly requested story ID.

Set `project.active_story: [story_id]` and `project.active_phase: spec_plan` in `specs/project-state.yaml`.

**Run PPE loop for spec phase:**

```
run_loop("spec", seed=story_intent)
```

**initial_goal_fn:** derive Goal₀ from `intent.md` + all 9 spec north star criteria (read `agents/northstars/spec.md`) + `.ppe-loop.yaml → must_not_miss` if resuming. No handoff file needed.

**Spec loop mechanics:**

**Plan step:** invoke `spec-gantry:spec:spec-plan-agent` with `goal`, `context`, `story_id`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir). Returns Plan JSON.

**Produce step:** invoke `spec-gantry:spec:spec-produce-agent` with `plan`, `context`, `story_id`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir).

Produce agent return signals:
- `TURN:awaiting_concern:[prompt]` → write `.story-spec-turn.md` · surface with `[!] Concern` · on response: re-invoke produce agent with `interaction_state: awaiting_concern, user_answer`
- `TURN:held_review:[prompt]` → write `.story-spec-turn.md` · surface · ⏸ pause
- `TURN:awaiting_edit:[prompt]` → write `.story-spec-turn.md` · surface · ⏸ pause
- `SPEC_HELD` → delete `.story-spec-turn.md` · clear active_story/phase · ⏸ pause
- `ARCH_GAP:[reason]` → delete `.story-spec-turn.md` · clear active_story/phase · re-route to P0
- `PRODUCE_COMPLETE` → proceed to eval step

**Eval step:** invoke `spec-gantry:spec:spec-eval-agent` with `output: story-spec.md path`, `plan`, `goal`, `northstar: agents/northstars/spec.md`, `story_id`, `project_dir`. Returns Evaluation JSON.

**Eval signal handling:**

`ACHIEVED`:
- **User checkpoint:** surface `eval.approval_summary` (the machine-validated spec approval prompt). **Auto-continue check:** if `auto_continue:true`, treat as implicit `Y`.
  - `Y` → write `spec_done: true` in project-state · delete `.story-spec-turn.md` · delete `.ppe-loop.yaml` · clear active_story/phase · **if `auto_continue:true`: append to `auto_continue_log`: `✓ Spec validated · [story_id]: [title]  ([N] loop — [loop summary from approval_summary Loop: line])`** · re-render · route to next unblocked story
  - `E` → return `TURN:awaiting_edit:` asking what to change · re-invoke produce agent with `interaction_state: awaiting_edit, user_answer` on response
  - `X` → return `SPEC_HELD`

`EXECUTION_GAP` or `GOAL_GAP`:
- Upgrade goal if GOAL_GAP: `goal = eval.upgraded_goal`
- Check cycling: if `eval.northstar_gaps` identical to prior iteration's (same gap_type + gap text after a GOAL_GAP upgrade) → exit CYCLING
- Check cap: if `iteration_N >= max_iterations` → exit CAPPED
- Otherwise: continue loop (re-invoke plan agent with updated goal and context)

**On CAPPED or CYCLING:** surface banner, offer `[Y] Accept / [E] Address manually / [X] Stop`. On `Y`: write `spec_done: true` with partial handoff, proceed.

**Dependency recheck mode (v5.2):** if an enhancement targets a story with downstream dependents, invoke `spec-gantry:spec:spec-produce-agent` with `dependency_recheck: true`, `changed_story: [ID]`. Produce agent returns `RECHECK_OK` or `RECHECK_DRIFT:`. Handle identically to v5 behavior.

**Spec gap mode (P1):** when `pending_spec_gap` is non-null, invoke `spec-gantry:spec:spec-produce-agent` with spec gap mode inputs. Handle return identically to v5.

**Gap merge mode:** invoke produce agent with `merge_gaps: true, gap_files: [gap.md]`. Handle return identically to v5.

When all stories have `spec_done:true` but any have `built:false`:
- Re-render dashboard · immediately route to `build_next_story`

When all stories have `spec_done:true AND built:true`:
- Re-render full dashboard · route to `confirm_and_deploy`

---

### build_next_story
**Gate:** at least one story has `built:false` · for each story where `built:false`, `spec_done:true` must hold. If any `built:false` story has `spec_done:false`, halt: "Cannot build — [STORY-ID]: [title] has built:false but spec_done:false. Run /spec-gantry to spec it first." · ⏸
**Idempotency:** all `built:true` → re-render · stop

Find the next story to build: lowest-numbered story in topological order where `built:false` and all stories in `depends_on` have `built:true`. If no story is unblocked: show blocked story list and re-render · ⏸

Set `project.active_story: [story_id]` and `project.active_phase: code_plan` in `specs/project-state.yaml`.

Read `ppe_loop.max_iterations.code` (default `3`) from `project-state.yaml`.

**Resume guard:** check for `specs/stories/[story_id]/.ppe-loop.yaml`:
- If present AND `build-report.yaml` exists with `overall_status: pass` AND quality block already in build-report AND `.ppe-loop.yaml` present → loop completed but `.ppe-loop.yaml` not yet deleted. Delete it and skip to **Mark built**.
- If present AND `build-report.yaml` exists with `overall_status: pass` AND no quality block yet → restore loop state from `.ppe-loop.yaml` and re-enter at eval step.
- If present AND `build-report.yaml` missing → start fresh at iteration 1 (prior run crashed in produce step).
- If absent → start fresh at iteration 1.

**Run PPE loop for code phase:**

```
run_loop("code", seed=story_spec)
```

**initial_goal_fn:** derive Goal₀ from `story-spec.md` + `intent.md` + all 7 code north star criteria (read `agents/northstars/code.md`) + `.ppe-loop.yaml → must_not_miss` if resuming. No handoff file needed.

**Code loop mechanics:**

**Plan step (all iterations):** invoke `spec-gantry:code:code-plan-agent` with `goal`, `evaluation` (prior eval JSON — null on iteration 1), `context`, `story_id`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `prior_fix_steps` (null on iterations 1 and 2, compact string on iteration 3+). Returns Plan JSON with `failure_level`.

If `failure_level: goal` from plan agent → route to cross-phase GOAL_GAP handling (see below).

**Produce step (iteration 1 — full build):** invoke `spec-gantry:code:code-produce-agent` with `story_id`, `goal`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `context`, `build_approach: [plan.approach]`, `build_steps: [plan.steps]`.

**Produce step (iteration 2+ — repair):** invoke `spec-gantry:code:code-produce-agent` with `story_id`, `goal`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `gate_bypass:true`, `fix_steps: [plan.fix_steps]`, `root_cause: [plan.root_cause]`, `preserve: [plan.preserve]`, `prior_context: [compact string]`, `approach_change: [plan.approach_change]`.

Produce agent return signals:
- `CONCERN_RAISED:[summary]` → read `gap.md → ## Concern` · surface with `[Y] Proceed / [N] Ignore / [E] Edit spec` · on response: re-invoke produce agent with `concern_resolution: apply|ignore` (or route to P1 on `E`)
- `pending_spec_gap` non-null → clear active_story/phase · re-route to P1
- `build-report.yaml` missing → clear active_story/phase · emit incomplete build message · re-render · ⏸
- `overall_status: fail` → write quality block `{overall: build_failed}` · clear · ⏸

**Eval step:** invoke `spec-gantry:code:code-eval-agent` with `story_id`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `iteration: [N]`, `prior_evaluation: [compact string or null]`, `goal`, `northstar: agents/northstars/code.md`. Returns Evaluation JSON.

**Eval signal handling:**

`ACHIEVED` (verdict: ACHIEVED):
- Delete `.ppe-loop.yaml` · write quality block to build-report · → **Mark built**

`EXECUTION_GAP` (verdict: EXECUTION_GAP):
- **Cycling check (deterministic):** if `prior_northstar_gaps` is non-null AND `eval.northstar_gaps` is identical (same gap_type + gap text) AND a GOAL_GAP upgrade was already attempted this story → exit CYCLING
- **Cap check:** if `iteration_N >= max_iterations` → exit CAPPED
- Otherwise: store `prior_northstar_gaps = eval.northstar_gaps` · checkpoint `.ppe-loop.yaml` · → Plan step (iteration N+1)

`GOAL_GAP` (verdict: GOAL_GAP):
- **Cross-phase re-entry:** check `.ppe-loop.yaml → spec_reentry_count`. If already `1` → exit CAPPED (second spec re-entry not allowed).
- Set `spec_reentry_count: 1` in `.ppe-loop.yaml`.
- **Emit banner** (visible to developer — this is not silent):
  ```
  ⚠ Code eval found a spec gap — [STORY-ID]: [title]
    Gap: [eval.northstar_gaps[0].gap — first line only]
    Updating spec now and rebuilding — no action needed.
  ```
- Route to spec loop for this story with `goal = eval.upgraded_goal`:
  - Re-invoke `run_loop("spec", ...)` with upgraded goal (spec loop's own max_iterations apply)
  - After spec loop exits ACHIEVED: full code rebuild — delete existing build-report, re-enter code loop at iteration 1 fresh. Emit combined transition note:
    ```
    ✓ Spec updated + rebuilt · [STORY-ID]  ·  quality: pass
      Gap resolved: [one-line summary of what was added to the spec]
    ```
    Derive gap resolved summary from the northstar_gaps that triggered the GOAL_GAP — what criterion was added. ≤8 words.
  - After spec loop exits CAPPED: surface to user, offer `[Y] Accept spec as-is and rebuild / [X] Stop`

**Quality block schema** (written to `build-report.yaml` before mark-built):
```yaml
quality:
  overall: pass | partial | capped | cycling | build_failed | unknown
  iterations: N
  exit_reason: "evaluator confirmed ACHIEVED | cycling on [...] | max iterations reached | ..."
  active_rubric: [list of dimension names evaluated]
  dimensions:
    spec_adherence: PASS | FAIL | SKIP
    # one entry per dimension in active_rubric
  advisory_notes:
    - "dim_name: SKIP — reason"
  northstar_gaps:
    - gap: "[description]"
      gap_type: "[type]"
      severity: "[blocking|advisory]"
```

---

**Mark built (shared exit):**

Delete `specs/stories/[story_id]/.ppe-loop.yaml` if it exists.

Write quality block to `specs/stories/[story_id]/build-report.yaml` — **before** setting `built:true`.

**If `auto_continue:true`** → set `built:true` · clear `project.active_story: null` · clear `project.active_phase: null` · **append to `auto_continue_log`: `✓ Built · [story_id]: [title]  · quality: pass ([N] iter[s][— repair summary if N>1])`** · re-render dashboard · route to next unblocked story (row 4 or 5).

**If `auto_continue:false`** → read `build-report.yaml → test_plan` and `runtime.exposed_ports[0]`.

If `test_plan` absent or `exposed_ports` empty: set `built:true` · clear active_story/phase · re-render · route forward.

If `test_plan` present: run health gate first:
- `curl -sf http://localhost:[exposed_ports[0]]/health`
- If fails: emit `⚠ App not running — skipping test verification.` · set `built:true` · clear · re-render · route forward.
- If passes: offer `[R] Run tests ([n] criteria)   [S] Skip`. Handle identically to v5 mark-built test flow.

**Transition note format:**
- Pass (1 iter):   `✓ Build complete · [STORY-ID]: [title]  ·  quality: pass (1 iter)`
- Pass (2+ iters): `✓ Build complete · [STORY-ID]: [title]  ·  quality: pass ([N] iters — [repair summary])`
- Partial/Capped:  `✓ Build complete · [STORY-ID]: [title]  ·  quality: [partial|capped] ([N] iters, [exit_reason])`

**Deriving repair summary (2+ iters only):** read the code loop's context — specifically the dimensions that were `FAIL` in the iteration-1 eval and `PASS` in the final eval. Summarise in ≤6 words what was fixed. Examples: `loading state added to save action` · `empty state and error handling added` · `streaming display implemented`. If more than two dimensions were repaired, use: `[N] dims repaired`.

When all stories have `built:true`:
- Re-render full dashboard (action bar shows `[1] Deploy release [version]`)
- Route to `confirm_and_deploy`

---

**QUALITY LOOP IS MANDATORY.** After EVERY code-produce-agent invocation — whether full build or repair, whether the change is one line or a full rewrite — the orchestrator MUST proceed to the eval step. No exceptions.

---

### confirm_and_deploy
**Gate:** all stories `built:true` · at least one `deployed:false`
**Idempotency:** all `deployed:true` → re-render · stop

**Pre-gate check — build reports:** before any other step, verify that `specs/stories/[STORY-ID]/build-report.yaml` exists and contains `overall_status: pass` for every story. If any story is missing a build-report or has `overall_status: fail`:
```
✗ Cannot deploy — build report missing or failed:
  [STORY-ID]: [title] — [missing | overall_status: fail]

  Fix: run /spec-gantry to rebuild the failing story.
```
Halt · ⏸

**Pre-gate quality check:** for every story, read `build-report.yaml → quality.overall`. If any story has `quality.overall: partial` or `quality.overall: capped`, emit a non-blocking warning before proceeding:
```
⚠ Quality warnings — review before deploying:
  [STORY-ID]: [title] — quality: [partial|capped] ([N] iters, [exit_reason])
  [STORY-ID]: [title] — quality: [partial|capped] ...

  [C] Continue deploy anyway   [X] Cancel
```
On `[X]`: re-render · ⏸. On `[C]` or if no warnings: proceed to Step 0.

**Step 0 — Deployment readiness check.**

Read `specs/architecture/deployment.md`.

If file missing or `## deployment:target` contains `_not yet written_`:
```
⚠ Deployment target not configured.

  The deployment phase requires deployment configuration from ideation (Topic 10).
  Run ideation to complete Topic 10, which captures:
    - Cloud platform (GCP / AWS / Azure / Docker Compose)
    - Container registry
    - Service architecture and scaling
    - Secrets strategy
    - Domain and CI/CD config

  [1] Return to ideation   [X] Cancel
```
On `1`: set `ideation_complete: false` · set `arch_seeded: false` · re-route to `start_ideation`.
On `X`: re-render · ⏸

If file exists and `## deployment:target` is configured: proceed to Step 1.

**Step 1 — Gap pre-check and merge (if needed).** Scan `specs/stories/*/gap.md`.

**Gaps found** — show summary and auto-merge:
```
✓ All [n] stories built.

  Gap specs detected — merging before deploy:

    STORY-001  gap.md
    STORY-003  gap.md
```
- For each story with a gap, in topological order:
  - **Before invoking:** verify `gap.md` still exists on disk for this story — if it was already deleted (partial prior run), skip it and note "already merged" in the summary
  - Invoke `spec-gantry:spec:spec-produce-agent` · description: `"Merging gap for [story_id]"` · pass `story_id`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `merge_gaps: true`, `gap_files: [gap.md]`
  - After each invocation, verify `gap.md` was deleted from disk
- Show merge summary:
  ```
  ✓ Gap specs merged — specs updated to reflect actual build

    STORY-001: gap merged — Data section updated
    STORY-003: gap merged — AI integration section updated

  ```
- → **Re-scan** `specs/stories/*/gap.md` after all merges complete. If any new gap files were created (side-effects from `## Side-effects on other stories`), auto-merge them — but cap the total re-scan loop at **5 passes**. If the cap is hit:
  ```
  ⚠ Gap merge loop capped at 5 passes — some side-effect gaps may remain unmerged:
    [list of remaining gap.md paths]
  Resolve these manually by editing the story specs directly, then re-run /spec-gantry.
  ```
  Proceed to Step 2 regardless.
- → proceed to **Step 2** when re-scan finds no gaps

**No gaps found** — skip Step 1, proceed directly to **Step 2**.

**Step 2 — Deploy.** Proceed automatically:

Set `project.active_phase: deployment` in `specs/project-state.yaml`.

Compute the release version now using the `[version]` computation rule above. This is the authoritative version for this release — pass it to the deployment subagent so it does not compute it independently.

**Invoke:** `spec-gantry:deployment:deployment-subagent` · description: `"Deploying release [version]"` · pass `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `deployment_ref: specs/architecture/deployment.md`, `release_version: [computed version]`

**After:** if any story still `deployed:false` → clear `project.active_phase: null` · emit:
```
✗ Deployment incomplete — one or more stories were not marked as deployed.
The deployment subagent finished but [n] stories still show deployed:false. This usually means a deploy step failed or the agent exited before writing final state flags.
Technical detail: stories not yet deployed: [list story IDs where deployed:false]. Check specs/deploy-artifact.md and deployment logs for the failure reason.
Recovery: run /spec-gantry — the pipeline will offer to re-run deployment for the remaining stories.
```
Re-render full dashboard · ⏸ pause; else:
- Set `project.release: [computed version]` in project-state — orchestrator is the sole writer of this field
- Set `project.next_release_type: null` in project-state
- Set `project.active_story: null` in project-state
- Set `project.active_phase: null` in project-state
- Re-render dashboard · stop

---

### classify_and_route
Prompt: `Describe the next work (bug fix / improvement / new feature / architectural change):  >`

**Step 1 — Investigate (bug_fix and enhancement only).**

For any report that sounds like a bug or enhancement, invoke the investigative agent before doing anything else.

**Turn-state branch:**

**If `specs/.investigate-turn.md` exists** (user just answered a confirmation prompt):
- Read `description`, `interaction_state`, and `findings` from the turn-state file
- Invoke `spec-gantry:investigate:investigate-subagent` · pass `description`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `prior_output: [findings]`, `user_answer: [user's raw input]`
- Process return signal (see below)

**If `specs/.investigate-turn.md` does not exist** (fresh investigation):
- Invoke `spec-gantry:investigate:investigate-subagent` · description: `"Investigating: [user's description]"` · pass `description`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir)
- Process return signal (see below)

**Processing return signals:**

`TURN: [findings text]` → write `specs/.investigate-turn.md` with `description`, `interaction_state: awaiting_confirmation`, `findings: [findings text]` · surface using Q&A format (no label line) · ⏸ pause

`INVESTIGATION_CONFIRMED` + findings block → delete `specs/.investigate-turn.md` · proceed to Step 2 with findings in hand

`INVESTIGATION_CANCELLED` → delete `specs/.investigate-turn.md` · re-render dashboard · ⏸

If the description is clearly `new_story` or `project_change` (net-new capability, no existing code to investigate) → skip Step 1, go directly to Step 2.

**Step 2 — Classify using findings.**

| Type | Condition |
|------|-----------|
| `bug_fix` | broken deployed behaviour — confirmed by investigation |
| `enhancement` | existing story does more/differently — confirmed by investigation |
| `new_story` | net-new user capability — no investigation needed |
| `project_change` | infra, data model, cross-cutting — read architecture + all story specs |

For `bug_fix` and `enhancement`: type and affected stories come directly from the findings report — do not re-derive from specs.

**Step 3 — Confirm with user.**

Show the confirmation using investigation findings:

```
  Type:    bug_fix
  Story:   STORY-002 — Student submits application
  Files:   src/api/submissions.js · src/db/submissions.js
  Finding: POST /api/submit does not validate draft status before inserting —
           spec requires status check (criterion 3)
  [Y] Confirm  [E] Edit  [X] Cancel
```

On `E` → ask what to change, revise, re-show. On `X` → re-render · ⏸. On `Y` (or if classification is unambiguous and no user correction is pending) → proceed to Step 3.5.

**Step 3.5 — Cross-story impact revalidation (v5.2).**

Runs for `enhancement` and `project_change` only. `bug_fix` skips this step — a bug fix reconciles code with spec; it does not alter the spec contract that dependents rely on. `new_story` also skips (no prior dependents).

For enhancement classification, before execute:

1. Compute the transitive dependency closure: read `project-state.yaml → stories`, walk `depends_on` in reverse to find every story where `depends_on` includes the affected story (direct or transitive). Call this set `dependents`.
2. If `dependents` is empty, skip to Step 4.
3. For each story in `dependents`, in topological order (deepest dependent last), invoke `spec-gantry:spec:spec-produce-agent` with `dependency_recheck: true`, `changed_story: [affected_story_id]`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir). Description: `"Revalidating [story_id] after change to [affected_story_id]"`.
4. Story-spec (in `dependency_recheck` mode) re-runs its Step 3 arch reference validation and returns one of:
   - `RECHECK_OK` — every `reads:` ref still resolves; no criteria touch the changed spec's contracts.
   - `RECHECK_DRIFT:[list]` — one or more `reads:` refs no longer resolve, or one or more criteria reference a contract/entity that the enhancement is likely to alter. Include the story's own affected fields.
5. Collect all `RECHECK_DRIFT` results. If any:
   - Surface a batched form (single `TURN:`) listing every dependent with drift, one per line: `STORY-XXX: [what drifted] · [suggested action]`.
   - Options: `[Y] Continue enhancement, accept drift risk` · `[E] Update dependent specs first` · `[X] Cancel enhancement`.
   - On `Y`: proceed to Step 4.
   - On `E`: set `pending_spec_gap: {triggered_by: cross-story-recheck, story_id: [first drifted], reason: "cross-story drift from [changed_story]", resume_phase: development}` and re-route to P1. After P1 resolves, re-enter Step 3.5.
   - On `X`: clear `active_story`, re-render, `⏸ pause`. The enhancement is abandoned; `gap.md` is not written.
6. If no drift found: emit a one-line transition note above the dashboard `✓ Cross-story recheck OK · [n] dependents validated · proceeding` and continue to Step 4.

**Step 4 — Execute inline.**

> **QUALITY LOOP IS MANDATORY.** After EVERY code-produce-agent invocation in this step — whether `bug_fix` or `enhancement`, whether the change is one line or a full rewrite — the orchestrator MUST proceed to the eval step (code-eval-agent). There are NO exceptions. The plan+repair agents run only if eval returns EXECUTION_GAP or GOAL_GAP.

`bug_fix` — for each affected story, in topological order:
- Set `project.next_release_type: patch`
- Set `project.active_story: [story_id]` and `project.active_phase: code_produce` · re-render dashboard
- **Invoke:** `spec-gantry:code:code-produce-agent` · pass `story_id`, `project_dir`, `gate_bypass:true`, `investigation_findings: [findings]`
- Handle return signals identically to produce step in `build_next_story` (concern handling, P1 re-route, build-report checks)
- On `overall_status: pass` → **→ eval step** (mandatory — do not skip)
- Do **not** reset `spec_done` — spec is still valid, only the code changed

`enhancement` — for each affected story, in topological order:
- Set `project.next_release_type: minor`
- Set `deployed:false` for this story in project-state **immediately**
- Set `project.active_story: [story_id]` and `project.active_phase: code_produce` · re-render dashboard
- Write or append to `specs/stories/[story_id]/gap.md` (same as v5)
- **Invoke:** `spec-gantry:code:code-produce-agent` · pass `story_id`, `goal`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir), `gate_bypass:true`, `enhancement_gap:gap.md`, `investigation_findings`
- Handle return signals identically to produce step in `build_next_story`
- On `overall_status: pass` → **→ eval step** (mandatory)

**Eval step for both bug_fix and enhancement:**
Invoke `spec-gantry:code:code-eval-agent` identically to `build_next_story` eval step. Code PPE loop (plan → produce → eval iterations) applies in full — same max_iterations, cycling check, GOAL_GAP routing. Exit on ACHIEVED → Mark built. On CAPPED/CYCLING → surface to user.

After all affected stories complete the full PPE loop and are marked built: re-render. Do **not** return to the normal pipeline — the work is already done.

`new_story` → invoke **start_ideation** (amendment mode):
- Set `next_release_type: minor`
- Set `ideation_complete: false`
- Do NOT reset `arch_seeded` or story flags
- After ideation completes: emit transition note `✓ Ideation complete · [n] stories ([x] new)` · re-render dashboard · immediately route to next pipeline action

`project_change`:
- Reset all story flags in project-state (`spec_done:false · built:false · deployed:false`)
- Set `next_release_type: major`
- Set `ideation_complete: false`
- Set `arch_seeded: false`
- Set `project.active_phase: amendment`
- Clear `pending_arch_gap: null` and `pending_spec_gap: null`
- Clear `project.active_story: null`
- Re-render dashboard · immediately route to start_ideation (amendment mode)

---

### reverse_engineer
Confirm:
```
Analysing codebase at: [cwd]
Project name (blank to infer):  >
Proceed? [Y]/[N]
```
**Gate:** source files exist · `ideation_complete` not true
**Invoke:** `spec-gantry:reverse-engineer:reverse-engineer-subagent` · description: `"Reverse engineering existing codebase"` · pass `project_name`, `project_dir`, `specs/architecture/architecture.md` (derived from project_dir)
**After:** verify all of the following. If any check fails, set `pending_arch_gap` with reason "arch artifacts incomplete after reverse engineering" and re-route to P0:
- `ideation_complete: true`
- `arch_seeded: true`
- `specs/architecture/architecture.md` contains `## Artifact Index`
- `specs/architecture/data-model.md` exists
- `specs/architecture/actors.md` exists

Note: `deployment.md` is NOT verified after reverse engineering — the reverse-engineer agent does not run Topic 10. The deployment readiness check in `confirm_and_deploy` Step 0 will surface this gap when the user attempts to deploy.

**Install SpecGantry engagement hooks (idempotent).** Same rule as `init_project`: prepend the CLAUDE.md notice if absent, then write the installer script to a temp file and execute it with `bash <tempfile> <project_dir>`.

Re-render dashboard · immediately route to next pipeline action

---

## Quick-Bar Actions

[A] — Display `specs/architecture/architecture.md` in full, then re-render dashboard. Visible when file exists.

[$] — Invoke `/track-cost` — show cost breakdown grouped by release and phase.

[N] — New work → classify_and_route. Always visible when `ideation_complete:true`.

[?] — Expand inline — show secondary commands, then re-render dashboard on exit:
```
  [A] Architecture     (visible when architecture.md exists)
  [D] Docs — specgantry.github.io
  [X] Back
```

[X] — Exit. Output: `Run /spec-gantry anytime to return.`
