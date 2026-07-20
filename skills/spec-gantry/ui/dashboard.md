# Dashboard Rendering Templates

Reference for the SpecGantry v7 orchestrator. Use these templates verbatim when rendering output.

---

## Q&A surface format

Used whenever surfacing a challenge question during ideation turns (no dashboard, no header):

```
──────────────────────────────────────────────────────────
  [Phase · Round label]   (e.g. "Ideation · Round 2 of 5")
──────────────────────────────────────────────────────────

[question text, rendered as-is from the challenge agent]
```

Omit the label line for spec approval and investigation confirmation turns — use only the separator.

---

## Transition note format

```
✓ [phase] complete  ·  [capability or project level]
──────────────────────────────────────────────────────────
```

Examples:
```
✓ Ideation complete  ·  Menu management · Bulk import · Analytics dashboard
✓ Spec validated  ·  CAP-002: Bulk import  (2 cycles — empty state added)
✓ All specs validated  ·  ready to build
✓ Build complete  ·  CAP-002  ·  quality: pass (1 cycle)
✓ Build complete  ·  CAP-003  ·  quality: capped (3 cycles, 1 gap remains)
✓ Deployed  ·  release 1.0.0
```

---

## HEADER

Always rendered first, same in all states:

```
SpecGantry v7  |  [project.name or "New Project"]  |  release [project.release]
──────────────────────────────────────────────────────────
```

**Update check:** before rendering the header, read `.claude/spec-gantry-update-check.txt`. If it exists and contains `UPDATE_AVAILABLE`, append one line after the separator:

```
🎉 SpecGantry [remote] is out!  You're on [local] — run: claude plugin update spec-gantry
──────────────────────────────────────────────────────────
```

**In STATE 2 (pipeline active)**, append a progress line below the separator:

```
Ideation ✅  ·  Spec [███░] 3/4  ·  Build [██░░] 2/4  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
```

Progress bars: 4 chars — `█` filled, `░` remaining.
- **Ideation** — `✅` when `ideation_complete:true`, otherwise `🔄 [sub-phase]`
- **Spec** counts capabilities where `spec_done:true`
- **Build** counts capabilities where `built:true`
- **Deploy** — `[████] ✅` when all `deployed:true`; `[░░░░] –` otherwise

---

## Sub-phase labels

Derive from `project.active_phase`:

| active_phase | Spec column label | Build column label |
|---|---|---|
| `spec_challenge` | `🔄 challenge` | — |
| `spec_write` | `🔄 write` | — |
| `spec_judge` | `🔄 judge` | — |
| `code_plan` | — | `🔄 plan` |
| `code_build` | — | `🔄 build` |
| `code_challenge` | — | `🔄 challenge` |
| `code_challenge` cycle 2+ | — | `🔄 challenge·N` |

Cycle number from `.cwj-loop.yaml → iteration` for the active capability. Show `·N` only when N ≥ 2.

---

## STATE 1 — No capabilities in pipeline

Used when: no project exists, or ideation still in progress.

```
SpecGantry v7  |  [project.name or "New Project"]
──────────────────────────────────────────────────────────
  [phase indicator]
```

Phase indicator examples:
```
  No project found in this directory.
```
```
  Ideation in progress  ·  🔄 challenge — round 2
```
```
  Ideation in progress  ·  🔄 judge — checking completeness
```

---

## STATE 2 — Pipeline dashboard

Used when: `ideation_complete:true` and `project-state.yaml → capabilities` has ≥1 entry.

Capability table:

```
  ID       Capability                         Spec         Build
  ──────────────────────────────────────────────────────────────────────
  [001]   Menu item management                 ✅           ✅
  [002]   Bulk import                          ✅           🔄 challenge·2
  [003]   Analytics dashboard                  🔄 judge     ⏳
  [004]   Export to CSV                        ⏳           ○           depends on 003
  ──────────────────────────────────────────────────────────────────────
  Release 1.0.0                                             ○ not deployed
```

Rules:
- Always render the column header row
- Always render ALL capabilities — never omit any
- Capability IDs shown as `[NNN]` — directly typeable
- Blocked capabilities show `depends on NNN[,NNN]` inline at end of row

**Spec column icon:**
- `✅` — `spec_done:true`
- `🔄 [label]` — active capability in spec phase
- `🔴` — blocked (a `depends_on` capability has `spec_done:false`)
- `⏳` — ready (all dependencies met, `spec_done:false`, not active)
- `○` — not reached
- `~` — stub (RE capability: `built:true · spec_done:false`)

**Build column icon:**
- `✅` — `built:true`
- `🔄 [label]` — active capability in code phase
- `🔴` — blocked
- `⏳` — ready (`spec_done:true · built:false`, not blocked, not active)
- `○` — not reached (`spec_done:false`)

**Release row** — always last, separated by a thin rule:
- `○ not deployed` — any capability has `deployed:false`
- `🔄 deploying` — `active_phase: deployment`
- `✅ deployed [YYYY-MM-DD]` — all capabilities `deployed:true`

---

## Gap / loop banners

Rendered above the dashboard. Used for CAPPED, CYCLING, arch gaps, spec gaps.

```
⚠ Spec loop capped  ·  CAP-003 (3 cycles)
  Unresolved: output format not specified for AI result

  [Y] Accept and continue   [E] Address manually   [X] Stop
```

```
⚠ Architecture gap  ·  section:data-model missing entity for imported items
  Recovering now — pipeline resumes at spec for CAP-002 when resolved.
```

---

## ACTION BAR chrome

Always the last element rendered.

State 1 (no pipeline):
```
──────────────────────────────────────────────────────────────────────
  [1] Start new project               [$] Cost & insights
  [2] Analyse existing codebase       [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────────────────
```

State 2 (pipeline active):
```
──────────────────────────────────────────────────────────────────────
  Type a capability ID to manage it   [$] Cost & insights
  [1] [contextual action]             [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────────
Enter capability ID or action:  >
```

`[>]` only appears when `auto_continue:false` and at least one capability is pending spec or build.

**Contextual action derivation (left column, pipeline order):**

| Condition | Action label |
|---|---|
| No project exists | `[1] Start new project` · `[2] Analyse existing codebase` |
| Ideation in progress | `[1] Continue ideation` |
| Next unblocked capability has `spec_done:false · built:false` | `[1] Spec next — [ID]: [title]` |
| Next unblocked capability has `spec_done:true · built:false` | `[1] Build next — [ID]: [title]` |
| All `built:true` · any `deployed:false` | `[1] Deploy release [version]` |
| Any `built:true · spec_done:false` | `[2] Complete stub spec — [ID]: [title]` |
| All `deployed:true` | _(no contextual action — `[N] New work` is the entry point)_ |

**`[?]` expands inline:**
```
  [A] Architecture
  [S] North star
  [D] Docs — specgantry.github.io
  [X] Back
```

**Input handling:**
- Bare number (`001`, `1`) or full ID (`CAP-001`) → route to capability's current phase
- Blocked capability typed → show one-line blocker, re-render
- Capability with `built:true · spec_done:false` → stub spec path
- Capability with `spec_done:true · built:true` → inline prompt:
  ```
  CAP-[NNN]: [title]  ·  ✅ spec · ✅ built
  ──────────────────────────────────────────
  What would you like to change?  >
  ```
- `>` → set `auto_continue: true` · re-enter routing loop immediately
- `$` → invoke `/track-cost`
- Lettered command → execute
- Invalid input → one-line error above header, re-render

---

## When to render the full dashboard

- Session starts or resumes (first response)
- A CWJ loop phase exits (ideation ACHIEVED, spec CLEAR + user approved, build CLEAR)
- A ⏸ pause point that is NOT mid-Q&A
- User types a command rather than answering a question
- After any gap recovery

**Do NOT render the full dashboard** during active ideation Q&A turns — use Q&A surface format only.

After every subagent returns, re-read all state files before rendering.
