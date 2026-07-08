# Dashboard Rendering Templates

Reference for the SpecGantry orchestrator. Use these templates verbatim when rendering output.

---

## Q&A surface format

Used whenever surfacing a question during ideation, story-spec, or investigation turns (no dashboard, no header):

```
──────────────────────────────────────────────────────────
  [Beat N · Topic M — Label]   (ideation only; omit for story-spec/investigation)
──────────────────────────────────────────────────────────

[question text, rendered as-is from the subagent]
```

The separator and label give orientation without the full dashboard weight. Omit the label line for story-spec and investigation turns — use only the separator above and below the question block.

## Transition note format

```
✓ [phase] complete  ·  [story or project level]
──────────────────────────────────────────────────────────
```

Examples:
```
✓ Ideation complete  ·  system shaped — 4 stories
✓ Story spec complete  ·  STORY-002 User authentication
✓ All specs complete  ·  ready to build
✓ Build complete  ·  STORY-002 ready
✓ Gap specs merged  ·  3 stories updated
✓ Deployed  ·  release 1.0.0
```

---

## HEADER

Always rendered first, same in all states:

```
SpecGantry v5  |  [project.name or "New Project"]  |  release [project.release]
──────────────────────────────────────────────────────────
```

In STATE 2 (pipeline active), append a progress line below the separator:

```
Spec [███░░] 3/4  ·  Build [██░░░] 2/4  ·  Deploy [░░░░░] not deployed
──────────────────────────────────────────────────────────
```

Progress bars: 5 chars — `█` (U+2588) filled, `░` (U+2591) remaining.
- **Spec** counts stories where `spec_done:true`
- **Build** counts stories where `built:true`
- **Deploy** is project-level and binary: show `[█████] deployed` when all stories `deployed:true`, `[░░░░░] not deployed` otherwise.

---

## STATE 1 — No stories in pipeline

Used when: no project exists, or ideation still in progress.

Middle section shows current phase status:

```
  [phase indicator]
```

Examples:
```
  No project found in this directory.
```
```
  Ideation in progress — Beat N: X/Y topics answered.
```

---

## STATE 2 — Pipeline dashboard

Used when: `ideation_complete:true` and `project-state.yaml → stories` has ≥1 entry.

Middle section — story table:

```
  ID       Story                              Spec   Build
  ────────────────────────────────────────────────────────────────
  [001]   Student completes profile             ✅    🔄
  [002]   Student submits application           ⏳    ○
  [003]   Admin reviews applications            🔴    ○        depends on 002
  [004]   Admin manages settings                ✅    ✅
  ────────────────────────────────────────────────────────────────
  Release 1.0.0                                       ○ not deployed
```

- Always render the column header row
- Always render ALL stories — never omit any
- Story IDs shown as `[NNN]` — directly typeable
- Blocked stories show `depends on NNN[,NNN]` inline at end of row
- Icons (Spec/Build): ✅ complete · 🔄 in progress · 🔴 blocked · ⏳ ready · ○ not reached · `~` stub (built by RE — spec not yet written)

**Story column flags:**
- Spec = `spec_done` — show `~` when `spec_done:false · built:true` (reverse-engineered, stub spec only)
- Build = `built` (show 🔄 while `project.active_story` matches this ID)

**Release row** — always the last row, separated by a line:
- `○ not deployed` — any story has `deployed:false`
- `🔄 deploying` — deployment in progress (`project.active_phase: deployment`)
- `✅ deployed [YYYY-MM-DD]` — all stories `deployed:true` (date from `specs/deploy-artifact.md` if present, otherwise omit date)

---

## ACTION BAR chrome

Always the last element rendered. Two columns — left is contextual actions, right is fixed lettered commands.

State 1 (no pipeline):
```
──────────────────────────────────────────────────────────────────────
  [1] [action one]                    [$] Cost
  [2] [action two]                    [?] Help
                                      [X] Exit
──────────────────────────────────────────────────────────────────────
```

State 2 (pipeline active):
```
──────────────────────────────────────────────────────────────────────
  Type a story ID to manage it        [$] Cost
  [1] [contextual action]             [?] Help
  [2] [contextual action]             [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────────
Enter story ID or action:  >
```

No additional instruction text should appear below this prompt. The action bar is self-documenting.

Typing any story ID opens that story — pending stories enter the spec/build pipeline; complete stories (`✅ spec · ✅ built`) show an inline "What would you like to change?" prompt.
