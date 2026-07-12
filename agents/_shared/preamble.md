# Shared subagent preamble

This file is a **read-once reference** for every SpecGantry subagent. Each subagent's system prompt instructs it to `Read: agents/_shared/preamble.md` once at the start of its first turn, then keep the rules below in mind for the rest of the session. Do not read this file more than once per session.

The rules here are **normative**. If a subagent's own prompt contradicts something in this file, the subagent's own prompt wins (it is more specific).

---

## 1. Path handling

- Every subagent receives `project_dir` (absolute path) in its invocation prompt.
- Every file read/write path in your prompt is relative to `project_dir`. Prefix every path with it before touching the filesystem.
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

When your story spec's `reads:` block names sections, read **only** the named sections up to the next `##` heading. Do not read the whole file. Cost tracking flags full-file reads as inefficient.

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
- Concerns are logged (append) to `specs/concerns-log.ndjson` by the orchestrator after the user responds. Do not write to that file yourself.

## 6A. Bounded raise-a-question (governor only)

The governor may raise **at most one question per invocation** when it genuinely cannot produce a PASS or FLAG verdict without user input. This is distinct from a concern — it is not a problem to fix, it is a judgment the governor cannot make from spec and code alone.

**When to raise a question:**
- A criterion is too vague to have a ground truth (e.g. "handle errors gracefully") and the dev agent's implementation could be correct or incorrect depending on what the user actually meant
- A persistence choice requires knowing intended data lifecycle that is not captured anywhere in the spec or arch artifacts
- A scope hygiene question where the extra code may be intentional infrastructure for an upcoming story

**When NOT to raise a question:**
- The approach patch already flagged the ambiguity — the dev agent had the chance to resolve it; if it didn't, that is a FLAG, not a question
- The ambiguity is advisory (low-impact) — surface it in `advisory_notes`, not as a question
- The governor can make a reasonable judgment call — make it, explain the rationale, and proceed

**How to raise a question:**

Return `TURN:awaiting_governor_question:[one-line summary]` as the last line. Before returning, write a `## Governor Question` block into `specs/stories/[story_id]/governor-question.md`:

```markdown
## Governor Question
Raised: [YYYY-MM-DD]
Story: [story_id]
Dimension: [spec_adherence | persistence_appropriateness | scope_hygiene | ...]
Cannot judge: [one sentence — exactly what the governor cannot determine]

[Y] [what answering Y means for the verdict — e.g. "criterion 5 is satisfied as implemented"]
[N] [what answering N means for the verdict — e.g. "criterion 5 is not satisfied — add observable error feedback"]
[E] Edit the spec to clarify this criterion before the governor re-reviews
```

The orchestrator surfaces the question using Q&A format with `[!] Governor question: <summary>` and the `[Y]/[N]/[E]` triad. On user response, the orchestrator logs to `specs/concerns-log.ndjson` (phase: governor), deletes `governor-question.md`, and re-invokes the governor with `question_resolution: Y|N|E` appended to the prompt.

**On re-invocation:** if `question_resolution` is present, skip directly to judgment using the answer. Do NOT raise another question on this invocation — produce a verdict.

**Rules:**
- One question per invocation maximum.
- The question must name the dimension it blocks and both judgment paths.
- If the answer still leaves the verdict ambiguous, make a judgment call, note it in the rationale, and proceed — no chaining questions.

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
