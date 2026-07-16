---
layout: docs
title: FAQ
description: Common questions about SpecGantry v6 — installation, the PPE loop, costs, and troubleshooting.
prev_page: "Reference"
prev_page_url: "/docs/architecture"
---

# Frequently Asked Questions

---

## Installation

**How do I install SpecGantry?**

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Both commands are required in order. The marketplace must be registered before the plugin can be installed. You only need to add the marketplace once.

**How do I update SpecGantry?**

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

Or from within Claude Code:
```
/plugin marketplace update spec-gantry && /plugin update spec-gantry@spec-gantry
```

**Where is the plugin installed?**

In your Claude home directory, typically `~/.claude/plugins/spec-gantry/`. The plugin runs entirely within Claude Code — no global npm install, no system-level changes.

**Does it work offline?**

Yes. All agents run locally within Claude Code. The only network calls are to the Anthropic API (for Claude), the plugin marketplace (for updates — only when you explicitly run the update command), and optionally a version check on session start.

**Does SpecGantry require git?**

No, but it's strongly recommended. All specs are plain-text YAML and Markdown designed to be committed — meaningful diffs, full history, and a single source of truth across sessions.

---

## The PPE Loop

**What is the PPE loop?**

Plan-Produce-Evaluate. Every phase in SpecGantry runs the same loop: a plan agent determines what to produce and how, a produce agent executes the plan, and an eval agent checks both whether produce executed the plan and whether the plan itself covered the north star. This loop runs at ideation, spec, and code.

**What are the three north stars?**

Each phase has a canonical quality bar the evaluator holds every output against — independently of what any plan says:

- **Ideation:** "Can every architecture artifact be written without invented assumptions?" (8 criteria)
- **Spec:** "If built exactly as written, does the user get everything the intent promises?" (9 criteria)
- **Code:** "Does the running software deliver the full experience the intent describes?" (7 criteria)

**What is EXECUTION_GAP vs GOAL_GAP?**

- **EXECUTION_GAP** — the plan was right, but produce didn't fully execute it. The evaluator loops with the same goal.
- **GOAL_GAP** — produce executed the plan, but the plan itself missed a north star criterion. The evaluator upgrades the goal and the plan agent reruns with a richer target.

**Can both occur at the same time?**

Yes. When both occur, the evaluator emits `GOAL_GAP` as the routing verdict (goal upgrade takes precedence) but also populates `execution_gaps` so the next plan agent addresses both in one pass.

**What happens when GOAL_GAP occurs during code?**

The orchestrator routes back to the spec phase with the upgraded goal. The spec PPE loop reruns, the spec is updated, then code is rebuilt from scratch. This is capped at one spec→code re-entry per story.

**How many iterations does each phase run?**

Default maximums: ideation 3, spec 2, code 3. Configurable in `project-state.yaml → ppe_loop.max_iterations`.

**What happens when the loop caps?**

The unresolved gaps are surfaced to you: `[Y] Accept and continue · [E] Address manually · [X] Stop`. Accepting continues the pipeline with the partial output documented.

**What is CYCLING?**

If the same northstar_gaps appear across two consecutive iterations after a GOAL_GAP upgrade was attempted, the loop is stuck. The orchestrator detects this and exits with the same CAPPED banner.

---

## Spec Phase

**What does the spec-eval-agent actually check?**

9 criteria from the spec north star, including:
- Whether every async operation has loading, partial/streaming, completion, and failure states described
- Whether output format and layout are specified (not left to developer interpretation)
- Whether every criterion is testable by two developers independently implementing the same thing
- Whether error states name a user-readable message and a recovery path
- Whether the full user flow has no dead ends

**What does "machine-validated" mean on the approval prompt?**

It means the spec-eval-agent confirmed all 9 spec north star criteria before surfacing the spec to you. You're reviewing a spec that has already been challenged by a product-head-level evaluator — not a first draft. The `Loop:` line in the approval prompt tells you what was caught and fixed.

**Can I edit the spec after approval?**

Yes. Type `[E]` instead of `[Y]` at the approval prompt to enter edit instructions. The spec-produce-agent applies the changes and the spec-eval-agent re-validates before re-surfacing for approval.

**What is the 60-line limit on story specs?**

Story specs are navigation maps, not knowledge dumps. Everything reusable lives in architecture artifacts and is referenced via the `reads:` block. If a spec exceeds 60 lines, it's duplicating something that belongs in an architecture artifact. The limit is enforced before `spec_done:true` can be set.

---

## Code Phase

**Why does the code-plan-agent run on iteration 1?**

Because the spec doesn't tell the developer *how* to build — only *what* to build. The plan agent on iteration 1 produces a build approach: which layer to build first, which async patterns to apply upfront, which experience requirements from the goal demand implementation choices the spec doesn't prescribe. Without this, the produce agent makes all those judgment calls itself.

**What does the quality block in build-report.yaml contain?**

```yaml
quality:
  overall: pass | partial | capped | build_failed | unknown
  iterations: 2
  exit_reason: "evaluator confirmed ACHIEVED"
  active_rubric: [spec_adherence, contract_fidelity, element_visibility, ...]
  dimensions:
    spec_adherence: PASS
    contract_fidelity: PASS
    # one entry per active dimension
  advisory_notes: []
  northstar_gaps: []  # any blocking gaps that remain if capped
```

**What does `quality: partial` mean?**

The same dimensions were still failing after an `approach_change` repair — usually indicating a spec ambiguity that needs clarification rather than a code fix. The story is still marked built; the report documents what remains.

**What does `quality: capped` mean?**

The maximum iteration count was reached with unresolved dimensions. The story is built; you decide whether to accept, manually fix, or stop.

---

## State and Progress

**How does session resume work?**

All progress is saved after every answer and every phase transition. On resume, the orchestrator reads `project-state.yaml → active_phase` and `active_story`, finds `.ppe-loop.yaml` for the active story (if any), and re-derives the current goal from canonical artifacts on disk. The loop re-enters at the plan step with `iteration_N` and `must_not_miss` restored from the checkpoint. No work is lost.

**How does auto-continue work?**

Type `[>]` to enable. The pipeline runs without pausing at spec approval prompts — a validated spec is auto-approved. Auto-continue stops at genuine decision points: concerns, arch/spec gaps, loop caps, all-stories-built. When it stops, you see a grouped log of everything that happened (spec events then build events, by story ID order).

**Phase transitions (e.g. all specs done → start builds) do not pause auto-continue.** Only genuine decision points stop it.

**Can I hold a story mid-spec?**

Yes. Type `[X]` at the spec approval prompt. The story is marked `spec_done:false` and saved. Type the story ID to resume it — the held spec is shown for review.

---

## Costs and Tokens

**How does cost tracking work?**

The `SubagentStop` hook fires automatically when each of the 12 agents completes. Token counts are read directly from the agent transcript — exact API values. One entry is appended to `specs/cost-log.ndjson` per agent run.

**What are the three columns in /track-cost?**

**Plan** — the cost of plan agents determining what to produce. Low individual cost but runs at every iteration.  
**Produce** — the cost of actually generating artifacts and code. Dominates total spend.  
**Eval** — the cost of evaluation agents checking against north stars. Runs at every iteration including iteration 1.

Plan + Eval together typically represent 30–35% of total project cost — the price of quality assurance that would otherwise surface as post-delivery rework.

**What does `[T]` do in /track-cost?**

Switches the display from dollar costs to token counts. Same layout, same rows. `[C]` switches back.

**What does the `Story total` row show?**

It sums Spec + Code across all Plan/Produce/Eval columns for that story — the end-to-end cost of that story from spec writing to a passing code eval.

**Why are costs not being recorded?**

Cost tracking requires Node.js. Check that `node` is available in your shell:

```bash
node --version
```

If Node.js is installed but costs still aren't recording, enable debug logging:

```bash
SPEC_GANTRY_LOG_LEVEL=debug /spec-gantry
```

Check `~/.claude/logs/spec-gantry-hooks.log` for errors.

---

## Engagement Hooks

**What are engagement hooks?**

When SpecGantry detects a project (`specs/project-state.yaml` exists), it automatically installs `SessionStart` and `PostCompact` hooks into `.claude/settings.json`. On every session start and after every `/compact`, the hooks inject `CONTRACT.md` — a binding directive telling Claude to always route development through `/spec-gantry` — as system context before the first message. This runs in Node.js and cannot be skipped.

**What is CONTRACT.md?**

A short file (gitignored) containing instructions for Claude: route all development through `/spec-gantry`, never make code changes directly. It is re-generated on every project setup and re-injected after every `/compact`.

**Are the hook files safe to commit?**

`settings.json` and the hook script are safe to commit. `CONTRACT.md` is gitignored by default — it's regenerated on setup and adds noise with no benefit if committed.

**When are hooks installed?**

Automatically on the first session start after a project is detected. If you update SpecGantry, hooks are re-checked idempotently — already-installed hooks are not duplicated.

---

## Advanced

**Can I use SpecGantry with other AI tools?**

Yes. SpecGantry manages the pipeline and specs. The code produce agent writes standard source code — no SpecGantry-specific runtime dependencies. You can run, test, and deploy the output with any tool.

**Can I adjust the story list after ideation?**

Yes. Use `[N] New work` → classify as `new_story` or `project_change`. The ideation agent runs in amendment mode — it updates the story list and architecture artifacts without re-running full ideation. Existing story flags are preserved.

**What is v6 vs v5?**

v6 introduces the universal PPE loop — plan, produce, and evaluate at every phase (ideation, spec, and code). v5 had a quality loop only at the code phase. The key improvement: thin specs that would have produced bad code in v5 are now caught at spec time before any code is written. The GOAL_GAP verdict routes spec updates back from code evaluation. All 12 agents use Sonnet 5 for planning and evaluation (upgraded from Haiku 4.5 in v5).

**How do I migrate a v5 project to v6?**

Open Claude Code in your v5 project directory and run `/spec-gantry`. SpecGantry detects the existing `specs/` structure and resumes normally. The v6 PPE loop applies to new stories and new work — existing built stories are not re-evaluated unless you initiate new work on them.
