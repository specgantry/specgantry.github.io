# Dashboard Rendering Templates

Reference for the SpecGantry v6 orchestrator. Use these templates verbatim when rendering output.

---

## Q&A surface format

Used whenever surfacing a question during ideation, story-spec, or investigation turns (no dashboard, no header):

```
──────────────────────────────────────────────────────────
  [Phase · Step label]   (e.g. "Ideation · Topic 6/10" — omit for spec/investigation turns)
──────────────────────────────────────────────────────────

[question text, rendered as-is from the subagent]
```

The separator and label give orientation without the full dashboard weight. Omit the label line for spec and investigation turns — use only the separator.

---

## Transition note format

```
✓ [phase] complete  ·  [story or project level]
──────────────────────────────────────────────────────────
```

Examples:
```
✓ Ideation complete  ·  Manage recipes · Tag and organise · Search by ingredient
✓ Spec validated  ·  STORY-002: Student submits application  (2 loops — empty state added)
✓ All specs validated  ·  ready to build
✓ Build complete  ·  STORY-002  ·  quality: pass (1 iter)
✓ Build complete  ·  STORY-003  ·  quality: capped (3 iters, 1 gap remains)
✓ Deployed  ·  release 1.0.0
```

---

## HEADER

Always rendered first, same in all states:

```
SpecGantry v6  |  [project.name or "New Project"]  |  release [project.release]
──────────────────────────────────────────────────────────
```

**Update check:** before rendering the header, read `.claude/spec-gantry-update-check.txt`. If it exists and contains `UPDATE_AVAILABLE`, parse `local=` and `remote=` values and append one line immediately after the separator:

```
🎉 SpecGantry [remote] is out!  You're on [local] — run: claude plugin update spec-gantry
──────────────────────────────────────────────────────────
```

**In STATE 2 (pipeline active)**, append a progress line below the separator:

```
Ideation ✅  ·  Spec [███░] 3/4  ·  Build [██░░] 2/4  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
```

Progress bars: 4 chars — `█` (U+2588) filled, `░` (U+2591) remaining.
- **Ideation** — `✅` when `ideation_complete:true`, otherwise `🔄 [sub-phase]` (see sub-phase labels below)
- **Spec** counts stories where `spec_done:true`
- **Build** counts stories where `built:true`
- **Deploy** — `[████] ✅` when all `deployed:true`; `[░░░░] –` otherwise

---

## Sub-phase labels

Used in the story table's in-progress column and in the STATE 1 phase indicator. Derive from `project.active_phase`:

| active_phase | Spec column label | Build column label |
|---|---|---|
| `ideation_plan` | — | — |
| `ideation_produce` | — | — |
| `ideation_eval` | — | — |
| `spec_plan` | `🔄 plan` | — |
| `spec_produce` | `🔄 write` | — |
| `spec_eval` | `🔄 eval` | — |
| `spec_eval` iteration 2 | `🔄 eval·2` | — |
| `code_plan` | — | `🔄 plan` |
| `code_produce` | — | `🔄 build` |
| `code_eval` | — | `🔄 eval` |
| `code_eval` iteration 2+ | — | `🔄 eval·N` |

Iteration number is read from `.ppe-loop.yaml → iteration_N` for the active story. Show `·N` only when N ≥ 2 — iteration 1 shows no number.

---

## STATE 1 — No stories in pipeline

Used when: no project exists, or ideation still in progress.

```
SpecGantry v6  |  [project.name or "New Project"]
──────────────────────────────────────────────────────────
  [phase indicator]
```

Phase indicator examples:
```
  No project found in this directory.
```
```
  Ideation in progress  ·  🔄 produce — Topic 6/10
```
```
  Ideation in progress  ·  🔄 eval — checking architecture completeness
```

---

## STATE 2 — Pipeline dashboard

Used when: `ideation_complete:true` and `project-state.yaml → stories` has ≥1 entry.

Story table:

```
  ID       Story                              Spec         Build
  ──────────────────────────────────────────────────────────────────────
  [001]   Student completes profile             ✅           ✅
  [002]   Student submits application           ✅           🔄 eval·2
  [003]   Admin reviews applications            🔄 eval      ⏳
  [004]   Admin manages settings                ⏳           ○           depends on 003
  ──────────────────────────────────────────────────────────────────────
  Release 1.0.0                                             ○ not deployed
```

Rules:
- Always render the column header row
- Always render ALL stories — never omit any
- Story IDs shown as `[NNN]` — directly typeable
- Blocked stories show `depends on NNN[,NNN]` inline at end of row

**Spec column icon:**
- `✅` — `spec_done:true` (spec-eval-agent returned ACHIEVED, user approved)
- `🔄 [label]` — `project.active_story` matches this ID and `active_phase` is `spec_plan` / `spec_produce` / `spec_eval`
- `🔴` — blocked (a `depends_on` story has `spec_done:false`)
- `⏳` — ready (all dependencies met, `spec_done:false`, not active)
- `○` — not reached (dependencies not yet spec'd)
- `~` — stub (RE story: `built:true · spec_done:false`)

**Build column icon:**
- `✅` — `built:true` (code-eval-agent returned ACHIEVED)
- `🔄 [label]` — `project.active_story` matches this ID and `active_phase` is `code_plan` / `code_produce` / `code_eval`
- `🔴` — blocked (`depends_on` story not yet built)
- `⏳` — ready (`spec_done:true · built:false`, not blocked, not active)
- `○` — not reached (`spec_done:false`)

**Release row** — always the last row, separated by a line:
- `○ not deployed` — any story has `deployed:false`
- `🔄 deploying` — `active_phase: deployment`
- `✅ deployed [YYYY-MM-DD]` — all stories `deployed:true`

---

## Gap / loop banners

Rendered above the dashboard (not inline). Used for CAPPED, CYCLING, arch gaps, spec gaps.

```
⚠ Spec loop capped  ·  STORY-003 (2 iterations)
  Unresolved: output format not specified for AI result  [experience_gap · blocking]

  [Y] Accept and continue   [E] Address manually   [X] Stop
```

```
⚠ Architecture gap  ·  entity:review missing from data-model.md
  Recovering now — pipeline resumes at spec for STORY-003 when resolved.
```

```
⚠ Spec gap  ·  STORY-002 — contract:submission-response missing yaml block
  Updating spec now — build resumes automatically.
```

---

## ACTION BAR chrome

Always the last element rendered.

State 1 (no pipeline):
```
──────────────────────────────────────────────────────────────────────
  [1] Start new project               [$] Cost
  [2] Analyse existing codebase       [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────────────────
```

State 2 (pipeline active):
```
──────────────────────────────────────────────────────────────────────
  Type a story ID to manage it        [$] Cost
  [1] [contextual action]             [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────────
Enter story ID or action:  >
```

`[>]` only appears when `auto_continue:false` and at least one story is pending spec or build.

**Contextual action derivation (left column, pipeline order):**

| Condition | Action label |
|---|---|
| No project exists | `[1] Start new project` · `[2] Analyse existing codebase` (only if source files present) |
| Ideation in progress | `[1] Continue ideation` |
| Next unblocked story has `spec_done:false · built:false` | `[1] Spec next — [ID]: [title]` |
| Next unblocked story has `spec_done:true · built:false` | `[1] Build next — [ID]: [title]` |
| All `built:true` · any `deployed:false` | `[1] Deploy release [version]` |
| Any `built:true · spec_done:false` | `[2] Complete stub spec — [ID]: [title]` |
| All `deployed:true` | _(no contextual action — `[N] New work` is the entry point)_ |

`Deploy release [version]` ONLY appears when ALL stories have `built:true`.

**`[?]` expands inline:**
```
  [A] Architecture
  [D] Docs — specgantry.github.io
  [X] Back
```

**Input handling:**
- Bare number (`001`, `1`) or full ID (`STORY-001`) → route to story's current phase
- Blocked story typed → show one-line blocker, re-render
- Story with `built:true · spec_done:false` → stub spec path
- Story with `spec_done:true · built:true` → inline prompt:
  ```
  STORY-[NNN]: [title]  ·  ✅ spec · ✅ built
  ──────────────────────────────────────────
  What would you like to change?  >
  ```
- `>` → set `auto_continue: true` · re-enter routing loop immediately
- Lettered command → execute
- Invalid input → one-line error above header, re-render

---

## When to render the full dashboard

- Session starts or resumes (first response)
- A PPE loop phase exits (ideation ACHIEVED, spec ACHIEVED + user approved, build ACHIEVED)
- A ⏸ pause point that is NOT mid-Q&A
- User types a command rather than answering a question
- After any gap recovery (P0, P1)

**Do NOT render the full dashboard** during active Q&A turns (ideation topics, spec hold/edit prompts, investigation confirmation) — use the Q&A surface format only.

After every subagent returns, re-read all state files before rendering.
