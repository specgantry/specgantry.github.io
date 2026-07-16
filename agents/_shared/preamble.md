# Shared subagent preamble

This file is a **read-once reference** for every SpecGantry subagent. Each subagent's system prompt instructs it to `Read: agents/_shared/preamble.md` once at the start of its first turn, then keep the rules below in mind for the rest of the session. Do not read this file more than once per session.

The rules here are **normative**. If a subagent's own prompt contradicts something in this file, the subagent's own prompt wins (it is more specific).

---

## 1. Path handling

- Every subagent receives `project_dir` (absolute path) in its invocation prompt.
- Every file read/write path in your prompt is relative to `project_dir`. Prefix every path with it before touching the filesystem.
- The architecture entry point is always `[project_dir]/specs/architecture/architecture.md`. Derive this path from `project_dir` — it is never passed as a separate parameter.
- Scratch or intermediate files go under `project_dir/specs/scratchpad/`. Never scatter them elsewhere.

## 2. Cache-first context ordering

When you read multiple files in one turn, read them in this order so Claude's prompt cache treats the stable prefix as a hit:

1. This preamble (`agents/_shared/preamble.md`) — first, once per session.
2. `specs/architecture/architecture.md` — includes the `## Artifact Index` block, stable across the session.
3. Other `specs/architecture/*.md` files named by the current story's `reads:` block — read only the named sections (see §4).
4. Per-story files (`specs/stories/[STORY-ID]/intent.md`, `story-spec.md`, `gap.md`, `build-report.yaml`) — these change per invocation, read last.
5. `specs/project-state.yaml` — small, changes every turn, read whenever needed (order less important).

Reading stable-first, volatile-last maximizes cache reuse across invocations in the same session.

## 3. Artifact Index parsing

`specs/architecture/architecture.md` ends with an `## Artifact Index` section containing a fenced YAML block. Parse it once and use the resulting map for the rest of your turn:

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

- The `file:` value under each artifact type resolves the path.
- The list under each type (`entities`, `roles`, `shapes`, `patterns`, `sections`) tells you which named sections exist in that file. Use it to check whether a referenced section exists before reading the file.

## 4. Anchor-based surgical reads

Arch artifact files use `## [type]:[name]` headings as anchors:

- `data-model.md` — `## entity:application`, `## entity:submission`
- `actors.md` — `## actor:applicant`, `## actor:admin`
- `contracts.md` — `## contract:submission-response`, `## contract:error-envelope`
- `patterns.md` — `## pattern:rest-crud`
- `ux.md` — `## ux:navigation-model`, `## ux:screen-template`
- `deployment.md` — `## deployment:target`, `## deployment:secrets`

When your story spec's `reads:` block names sections, read **only** the named sections up to the next `##` heading. Do not read the whole file.

**Contract sections (v5.2)** carry both prose and a fenced ` ```yaml ``` ` block (OpenAPI 3.1 or JSON Schema). When reading a `## contract:[name]` section:
- The prose describes intent and usage — read it for judgment calls.
- The fenced yaml block is the source of truth for field names, types, and required properties. Never invent field names not in the yaml; never omit `required:` fields; validate response shapes against it before returning them from code.
- If the section is missing a yaml block (only prose): signal an arch gap — the contract is not yet fully specified.

## 5. Anchor comment schema (source files)

Every source file the development or reverse-engineer subagent touches gets one-line anchor comments in the language's native comment syntax:

- **`@story`** — top of file: `// @story STORY-002 | submissions`
- **`@intent`** — immediately after `@story`, one line, present-tense functional purpose: `// @intent allows an applicant to submit their completed draft for admin review`
- **`@entry`** — above each route handler / server action: `// @entry POST /api/submissions | create draft submission`
- **`@contract`** — above each cross-layer function: `// @contract input: {...} → output: {...} | errors: [codes]`
- **`@gap`** — inline at any point where the implementation diverges from the story-spec: `// @gap 2026-06-15 status enum extended to 'archived' — spec only defines draft|submitted`

Keep each tag on one line. The investigate subagent greps these to navigate the codebase without loading whole files.

## 6. Bounded raise-a-concern (story-spec and development only)

Story-spec and development subagents may raise **at most one concern per invocation** if they see a problem the user should decide on before proceeding. Concerns are one of:

- **Untestable criterion** (story-spec) — "Criterion 3 is subjective; propose making it observable."
- **Missing owner** (story-spec) — "Entity X has no owner in actors.md; propose adding an actor."
- **Contract overlap** (story-spec) — "This looks like `contract:submission-response`; propose reusing."
- **Spec / code drift** (development) — "Spec says X but existing code in [file] does Y; propose reconciliation."
- **Missing dependency in `reads:`** (development) — "This criterion needs entity Z, not in reads:; propose adding."
- **Reuse opportunity** (development) — "This looks like a duplicate of code already in [file]; propose reusing."

**How to raise a concern:**

- **Story-spec** returns a distinct signal: `TURN:awaiting_concern:[concern text with proposed alternative]`. The orchestrator surfaces this with `[Y] Apply suggestion   [N] Keep as-is   [E] Edit spec first`.
- **Development** writes a `## Concern` section into the story's `gap.md` and returns `CONCERN_RAISED:[one-line summary]`. The orchestrator surfaces the section with `[Y] Proceed with suggestion   [N] Ignore, build as-spec   [E] Edit spec first`.

**Rules:**
- Never raise more than one concern per invocation. Pick the highest-impact one. Bank the rest for the user to notice.
- A concern must include a **proposed alternative**, not just a complaint. If you don't have an alternative, don't raise the concern — proceed as spec'd.
- If in doubt whether something is worth raising: proceed silently. Concerns are a scarce interruption budget.


## 7. GATE_FORMAT

Gate failures use exactly this format so the orchestrator surfaces them verbatim:

```
✗ [gate name] gate FAILED · [failing condition] · [action, typically "Run /spec-gantry"]
```

## 8. Return signal discipline

- Every subagent's **last line of output** is either a `TURN:` prompt for the user or a completion signal (e.g. `SPEC_COMPLETE`, `IDEATION_COMPLETE`, `CONCERN_RAISED:...`).
- Never emit two signals in one output. The orchestrator parses the last line.
- Never wait for user input inside a single invocation. The orchestrator is the loop — one invocation, one unit of work, one signal.

## 9. Model note

Your `model:` frontmatter is authoritative — do not attempt to switch models mid-invocation. The orchestrator picks the right model per phase; if you are running on Haiku, keep your work bounded (no speculative multi-file rewrites, no wide-context reasoning). If you feel the task exceeds your budget, raise a concern and let the user decide.

---

## 10. PPE loop objects

SpecGantry v6 uses a universal Plan-Produce-Evaluate (PPE) loop at every phase. Plan agents, produce agents, and eval agents communicate through three shared objects. The orchestrator passes these objects as parameters and owns all loop state. Agents must return Plan and Evaluation objects as raw JSON only — no prose before or after.

### Goal object
```yaml
goal:
  phase: ideation | spec | code
  iteration: N
  statement: "what good looks like — specific, not generic"
  must_achieve:       # non-negotiables for this iteration
    - "criterion 1"
  must_not_miss:      # known gaps from prior iterations or prior phase handoff
    - "gap 1"
  source: initial | upgraded
  upgraded_from: "[prior statement — present only when source=upgraded]"
```

### Plan object (returned by plan agents as raw JSON)
```json
{
  "approach": "strategy to achieve the goal",
  "steps": [
    {
      "id": 1,
      "action": "what to do",
      "addresses": "which must_achieve or must_not_miss item",
      "produces": "what artifact or output"
    }
  ],
  "known_risks": ["risk the evaluator should watch for"],
  "scope_boundary": "what this plan explicitly does NOT attempt"
}
```

### Evaluation object (returned by eval agents as raw JSON)
```json
{
  "verdict": "ACHIEVED | EXECUTION_GAP | GOAL_GAP",
  "plan_compliance": [
    { "step_id": 1, "met": true, "evidence": "specific citation" }
  ],
  "northstar_gaps": [
    {
      "gap": "what the plan's goal missed",
      "gap_type": "experience_gap | scope_gap | depth_gap | ambiguity_gap",
      "severity": "blocking | advisory",
      "proposed_goal_addition": "how the goal must be upgraded"
    }
  ],
  "upgraded_goal": {
    "statement": "updated statement",
    "must_achieve": ["updated list"],
    "must_not_miss": ["updated list"]
  }
}
```

`upgraded_goal` is present only when `verdict: GOAL_GAP`.
`northstar_gaps` may be empty `[]` when verdict is ACHIEVED (advisory gaps only) or EXECUTION_GAP.

---

## 11. North star discipline

Every eval agent receives a `northstar_path` parameter pointing to its phase's north star document (`agents/northstars/ideation.md`, `agents/northstars/spec.md`, or `agents/northstars/code.md`). Read it once at the start of your invocation.

The north star's criteria are **constants** — no plan, no user instruction, and no produce-agent output can redefine them. They represent SpecGantry's standing judgment of what good software at each phase looks like.

Verdict rules:
- If the produce output satisfies the plan AND satisfies the north star → `ACHIEVED`
- If the produce output does not satisfy the plan (the plan's steps were right but execution missed) → `EXECUTION_GAP`
- If the produce output satisfies the plan BUT the plan's goals did not cover a north star criterion → `GOAL_GAP` (the plan was the problem, not the execution)

When `GOAL_GAP`: emit `upgraded_goal` with the missing north star criterion added to `must_achieve`. The orchestrator will upgrade the goal and replan — do not attempt to fix the output yourself.
