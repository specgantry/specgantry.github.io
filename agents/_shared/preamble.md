# Shared subagent preamble

This file is a **read-once reference** for every SpecGantry subagent. Read it once at the start of your first turn, then keep the rules in mind for the rest of the session.

The rules here are **normative**. If a subagent's own prompt contradicts something here, the subagent's own prompt wins.

---

## 1. Path handling

- Every subagent receives `project_dir` (absolute path) in its invocation prompt.
- Every file path in your prompt is relative to `project_dir`. Prefix every path with it before touching the filesystem.
- The architecture entry point is always `[project_dir]/specs/architecture/architecture.md`.
- The north star is always `[project_dir]/specs/north-star.md`.
- Scratch or intermediate files go under `project_dir/specs/scratchpad/`. Never scatter them elsewhere.

## 2. Cache-first context ordering

When you read multiple files in one turn, read them in this order so Claude's prompt cache treats the stable prefix as a hit:

1. This preamble (`agents/_shared/preamble.md`) — first, once per session.
2. `specs/north-star.md` — read fully as prose. Stable across the session once written.
3. `specs/architecture/architecture.md` — read named sections using anchor reads (§4). Stable across the session.
4. `specs/changelog.md` — if it exists, read it fully. Read before referencing any field, endpoint, or entity.
5. Per-capability files (`specs/capabilities/[CAP-ID]/intent.md`, `capability-spec.md`, `build-report.yaml`) — read last, per invocation.
6. `specs/project-state.yaml` — small, changes every turn, read whenever needed.

Reading stable-first, volatile-last maximises cache reuse across invocations in the same session.

## 3. North star reading discipline

`specs/north-star.md` is flowing prose — no headings, no sections, no anchors. Read it as a whole document. Do not try to extract sections or parse structure. The meaning comes from the full text, not from any individual sentence.

The document ends with a `---` separator followed by a flat list of challenge questions. Read both parts. The questions explain what was examined to produce the prose above — they provide context for why the north star says what it says.

Challenge agents: hold the work you are challenging against the full north star, not against individual sentences extracted from it.

## 4. Anchor-based surgical reads (architecture.md)

`specs/architecture/architecture.md` uses `## section:name` headings as anchors. Read only the named section up to the next `##` heading. Do not read the whole file when you only need one section.

Anchors:
- `## section:vision`
- `## section:tech-stack`
- `## section:data-model`
- `## section:actors`
- `## section:api-interfaces`
- `## section:deployment`
- `## section:guardrails`
- `## section:configuration`

## 5. Changelog reading rule

If `specs/changelog.md` exists and the current release is not the first:
- Read it fully before referencing any field, endpoint, or entity in the codebase.
- Do not use any field, endpoint, or capability listed under `Dropped:`.
- Use replacement names listed under `Deprecated:` — the deprecated name must not appear in new specs or code.
- Agents that must read the changelog: `spec-write-agent`, `code-plan-agent`.

## 6. Anchor comment schema (source files)

Every source file the build or reverse-engineer agent touches gets one-line anchor comments:

- **`@capability`** — top of file: `// @capability CAP-002 | submissions`
- **`@intent`** — immediately after `@capability`: `// @intent allows an applicant to submit their completed draft for review`
- **`@entry`** — above each route handler / server action: `// @entry POST /api/submissions | create submission`
- **`@contract`** — above each cross-layer function: `// @contract input: {...} → output: {...} | errors: [codes]`
- **`@gap`** — inline at any point where implementation diverges from spec: `// @gap 2026-07-19 confirmation dialog not implemented — spec criterion 5`

Keep each tag on one line. The investigate and challenge agents grep these to navigate the codebase without loading whole files.

## 7. Bounded raise-a-concern (spec write and code build only)

Spec write and code build agents may raise **at most one concern per invocation** if they see a problem the user should decide on before proceeding. A concern must include a proposed alternative. If you don't have an alternative, don't raise the concern — proceed.

- **Spec write** returns: `TURN:awaiting_concern:[concern text with proposed alternative]`
- **Code build** writes a `## Concern` section into `specs/capabilities/[CAP-ID]/gap.md` and returns `CONCERN_RAISED:[one-line summary]`

The orchestrator surfaces concerns with `[Y] Apply suggestion  [N] Keep as-is  [E] Edit first`.

## 8. GATE_FORMAT

Gate failures use exactly this format:

```
✗ [gate name] gate FAILED · [failing condition] · [action, typically "Run /spec-gantry"]
```

## 9. Return signal discipline

- Every subagent's **last line of output** is either a `TURN:` prompt for the user or a completion signal.
- Never emit two signals in one output.
- Never wait for user input inside a single invocation. The orchestrator is the loop.

## 10. Model note

Your `model:` frontmatter is authoritative. The orchestrator picks the right model per phase. If you are running on Haiku, keep your work bounded — no speculative multi-file rewrites, no wide-context reasoning. If the task exceeds your budget, raise a concern and let the user decide.

---

## 11. CWJ loop object

SpecGantry v7 uses a Challenge-Write-Judge (CWJ) loop at every phase. The loop state is written to `specs/capabilities/[CAP-ID]/.cwj-loop.yaml` (gitignored, deleted on exit).

```yaml
phase: ideation | spec | code
iteration: N
challenges:
  - id: 1
    question: "..."
    resolved: false | "[resolution]"
unresolved_count: N
exit_reason: null | achieved | capped | cycling
```

The orchestrator owns the loop state. Agents receive loop context as input parameters — they do not read `.cwj-loop.yaml` directly.

## 12. Challenge agent discipline

Challenge agents return raw JSON only — a `challenges` array and metadata. No prose before or after.

- Every challenge must be specific to this project. Generic questions that apply to any project are not useful.
- Every challenge must be answerable — not a question for a developer to resolve internally.
- Every challenge must be genuinely blocking — if a developer could reasonably proceed without the answer, it is not a blocking challenge.
- Maximum 7 challenges per ideation round; maximum 6 per spec round.
- Empty `challenges: []` signals: no blocking questions remain — the judge can exit CLEAR.

## 13. Judge agent discipline

Judge agents return raw JSON only — a verdict (`CLEAR` or `BLOCKED`) with evidence.

- `CLEAR` means: the next phase can proceed without invented answers. Not "the artifact is complete."
- `BLOCKED` means: specific gaps would force the next phase to invent answers. Name each gap precisely.
- Never return `CLEAR` when uncertain — return `BLOCKED` and name the uncertainty.
