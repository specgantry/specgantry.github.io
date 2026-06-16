# SpecGantry v4 — Design Specification

## What Changes and Why

v3 treated each story spec as a self-contained knowledge dump — rich enough for a build agent to work from, but expensive to produce, large to load, and redundant across stories that share entities, actors, and patterns. v4 makes a structural shift: architectural knowledge lives in shared artifacts, story specs become reference sheets, and agents navigate by map rather than by context loading.

The result: every agent makes 3–5 narrow targeted reads instead of loading hundreds of lines. Haiku at low effort can drive the full pipeline. Enterprise-grade output is preserved because the spec elements that prevent agent errors — criteria, contracts, permissions, state rules, data — are retained in precise form. Narrative that serves humans but not agents is separated into its own file, loaded only when useful.

---

## New File Structure

```
specs/
  project-state.yaml           ← pipeline state (expanded — see below)
  architecture/
    architecture.md            ← single entry point: narrative sections + ## Artifact Index
    data-model.md              ← all entities, fields, types, relationships, state machines
    actors.md                  ← all roles, permissions, ownership rules
    contracts.md               ← shared API shapes, error envelopes, response patterns
    patterns.md                ← dominant backend interaction patterns
    ux.md                      ← navigation model, visual system, component conventions
  stories/
    STORY-001/
      intent.md                ← 2 paragraphs: functional purpose, objective, outcome
      story-spec.md            ← tactical: criteria, interfaces, permissions, state, data, reads:
      build-report.yaml        ← unchanged
      gap.md                   ← unchanged (enhancement delta, deploy-time merge)
    STORY-002/
      intent.md
      story-spec.md
      ...
  scratchpad/                  ← unchanged
```

**No separate index file.** The index is the last section of `specs/architecture/architecture.md`. One entry point for the full architectural picture — narrative + map in one file.

---

## `specs/architecture/architecture.md` — Merged Entry Point

`specs/architecture/architecture.md` is both the narrative document and the artifact registry. Agents read one file, get full orientation AND the navigation map.

**Structure:**

```markdown
# Architecture

## Vision
[2–3 sentences: what the system is, who it's for, what makes it worth building]

## Problem & Users
[user population, primary use case, current state]

## Constraints
[hard constraints — stack, infra, compliance, timeline]

## Risks & Out of Scope
[top 2–3 risks with mitigations · explicit out-of-scope list]

## Tech Stack
[one clear choice per layer — no alternatives]

## Guardrails
[mandatory structure rules + project-specific rules]

## Configuration
| Variable | Description | Example value |
|----------|-------------|---------------|
[one row per env var]

## UX Model
[navigation model summary — which pattern, actor entry points, shared shell y/n]
[visual system summary — framework, icon set, theme tokens]

---

## Artifact Index

data-model:
  file: specs/architecture/data-model.md
  entities: [entity-name, ...]

actors:
  file: specs/architecture/actors.md
  roles: [role-name, ...]

contracts:
  file: specs/architecture/contracts.md
  shapes: [shape-name, ...]

patterns:
  file: specs/architecture/patterns.md
  patterns: [pattern-name, ...]

ux:
  file: specs/architecture/ux.md
  sections: [navigation-model, visual-system, component-conventions, screen-template]
```

**Rules:**
- `## Artifact Index` is always the last section. Never insert sections after it.
- The index YAML block is machine-readable — agents parse it to resolve arch file paths.
- Ideation writes and owns both the narrative sections and the index.
- Story-spec may append new rows to the index when ideation adds a new arch section (via P0 gap flow).
- `## UX Model` is a narrative summary only — the detail lives in `specs/architecture/ux.md`.

---

## Architecture Detail Files

### `specs/architecture/data-model.md`

Section-per-entity. Heading anchor: `## entity:[name]`

```markdown
## entity:application
fields:
  id:           uuid, system-generated
  user_id:      uuid, required, FK → entity:user
  status:       enum(draft|submitted|under-review|approved|rejected), system-managed
  submitted_at: timestamp, nullable, set on submit transition
  created_at:   timestamp, system-generated
state-machine:
  draft → submitted:        trigger: applicant submit · guard: all required fields present
  submitted → under-review: trigger: admin opens review
  under-review → approved:  trigger: admin approves
  under-review → rejected:  trigger: admin rejects
owned-by: actor:applicant
```

### `specs/architecture/actors.md`

Section-per-role. Heading anchor: `## actor:[name]`

```markdown
## actor:applicant
owns: application (own records only)
can: create-application, read-own-application, edit-draft, submit-draft, delete-draft
cannot: read-others-applications, approve, reject, access-admin

## actor:admin
owns: — (no owned entities)
can: read-all-applications, open-review, approve, reject, archive
cannot: create-application, submit, edit-applicant-fields
```

### `specs/architecture/contracts.md`

Section-per-shape. Heading anchor: `## contract:[name]`

```markdown
## contract:submission-response
{
  id:           uuid
  status:       "submitted"
  submitted_at: ISO8601 timestamp
}
errors:
  400: validation failure → {error: "VALIDATION_FAILED", fields: [{field, message}]}
  401: unauthenticated
  403: not owner or wrong status

## contract:error-envelope
{
  error:   string  (machine-readable code)
  message: string  (human-readable)
  fields:  [{field: string, message: string}]  (validation errors only, omit otherwise)
}
```

### `specs/architecture/patterns.md`

Section-per-pattern. Heading anchor: `## pattern:[name]`

```markdown
## pattern:request-response
Standard REST: route handler → service layer → data layer.
Errors always use contract:error-envelope.
Validation at service layer, not route handler.

## pattern:state-machine
State transitions live in the service layer, never in route handlers or data layer.
Guard conditions checked before transition. Illegal transitions return 422.
```

### `specs/architecture/ux.md` — New

Section-per-concern. Heading anchor: `## ux:[name]`

```markdown
## ux:navigation-model
pattern: persona-split | central-dashboard | hybrid
  # persona-split: each actor type has its own entry point, own nav, own flow
  # central-dashboard: one hub, role-filtered content
  # hybrid: shared shell, persona-specific content zones

entry-points:
  actor:applicant → /app/dashboard
  actor:admin     → /admin/queue
  actor:reviewer  → /review/queue

shared-shell: true
  # header, top nav, footer are common across all actors
  # content zone is persona-specific

## ux:visual-system
css-framework:       bootstrap@5.3
icon-set:            bootstrap-icons
component-framework: react | angular | vue | vanilla
theme:
  primary:    #[hex]
  secondary:  #[hex]
  font-family: [family]
  spacing:    bootstrap-default | custom
  # if React/Angular: name the component library (e.g. react-bootstrap, ng-bootstrap, PrimeNG)
  # theme tokens are the canonical values — never hardcode colors or spacing in components

## ux:component-conventions
forms:
  - bootstrap form controls throughout
  - validation errors inline below each field (server-side, shown on submit)
  - required fields marked with * in label
buttons:
  - primary action: btn-primary
  - secondary/cancel: btn-outline-secondary
  - destructive: btn-danger, always preceded by confirmation modal
tables:
  - bootstrap table, striped, hover
  - empty-state: centered message + primary action button when no rows
  - loading-state: skeleton rows or spinner while fetching
modals:
  - bootstrap modal for: confirmations, detail views, inline forms
  - always include explicit cancel + confirm buttons
toasts:
  - bootstrap toast, top-right corner
  - success: auto-dismiss 4s, green
  - error: persistent until dismissed, red
  - info: auto-dismiss 6s, blue
nav:
  - bootstrap navbar, responsive
  - links filtered by actor role derived from session
  - active link highlighted

## ux:screen-template
Every screen follows this structure:
  1. [shared shell: navbar + optional sidebar if persona-split]
  2. [page header: h1 title left · primary action button right-aligned]
  3. [content zone]
     - if list: table with empty-state
     - if form: grouped fields with inline validation
     - if detail: read-only sections with edit affordance
  4. [footer: optional, shared shell]

Empty states are mandatory on every list screen.
Error states are mandatory on every form and data-fetch screen.
Loading states are mandatory on every screen that fetches async data.
```

**Rules for `ux.md`:**
- Navigation model is set during ideation and rarely changes — treat as stable
- Visual system is set during ideation and never changes per-story
- Component conventions are the build agent's implementation contract — follow exactly, never invent new patterns
- Story specs reference `ux:component-conventions` and `ux:screen-template` via `reads:` — no per-story UI decisions needed for standard screens
- If a story requires a non-standard UI component: it is specified in that story's `## Interfaces` section as a one-line component description, and the component-conventions section is updated via P0 gap flow

---

## Story Files

### `intent.md`

Two paragraphs. Seeded by ideation, finalized by story-spec.

**Paragraph 1 — Functional purpose:** What the user is trying to accomplish. Who they are, what they need, why this story exists.

**Paragraph 2 — Objective and outcome:** What a successful completion looks like. What changes in the system. What the user can do after that they could not do before.

**Rules:**
- Max 2 paragraphs. No bullets, no headers, no technical detail.
- Read by: development agent (judgment-call grounding), humans (project comprehension).
- Written by: ideation (seed), story-spec (final). Never touched after story-spec completes.
- Never contains implementation guidance, file references, or technical choices.

**Example:**
```markdown
An applicant has completed filling out their application and is ready to submit it for review.
They need confidence that their submission is complete and correct before it leaves their hands,
and they need a clear signal that the system received it. This story exists because the transition
from draft to submitted is the primary gate in the application lifecycle — everything downstream
depends on it happening correctly.

A successful outcome means the applicant's application moves irreversibly from draft to submitted
state, the applicant receives confirmation, and the admin queue gains a new item ready for review.
After this story, the applicant can no longer edit their submission, and the admin can see it in
the review pipeline.
```

### `story-spec.md`

Five tactical sections plus a `reads:` block. Machine-readable. Dense. Every line load-bearing.

```yaml
---
story_id: STORY-002
title: "User submits application"
depends_on: [STORY-001]
reads:
  actors:    [applicant, admin]
  data:      [application, user]
  contracts: [submission-response, error-envelope]
  ux:        [component-conventions, screen-template]
---

## Criteria
1. Submit blocked if any required field is empty — inline field errors appear
2. Successful submit transitions application draft → submitted — immutable after
3. Applicant receives success toast and is redirected to /app/dashboard
4. Admin queue shows newly submitted application immediately
5. Submitting an already-submitted application returns 422

## Interfaces
POST /api/applications/:id/submit
  auth:     actor:applicant, own record only
  guard:    status must be draft
  response: contract:submission-response
  errors:   400 (validation), 401, 403, 422 (wrong status)

GET /api/applications/:id
  auth:     actor:applicant (own) | actor:admin (any)
  response: {application} full entity
  errors:   401, 403, 404

## Permissions
- actor:applicant — submit own draft only
- actor:admin — read result, no submit action

## State
- draft → submitted: trigger: POST /api/applications/:id/submit · guard: all required fields present
- full machine: data:application.state-machine

## Data
- owns: data:application (creates status transition)
- reads: data:user (id, email only — confirmation notification)
- new fields: none
```

**Rules:**
- `reads:` is the agent's fetch list — agents load exactly these sections, nothing more
- `ux:` entries in `reads:` are included for any story with screens; omit for API-only stories
- Interfaces: always reference `contract:*`, never inline reusable shapes
- Permissions: always reference `actor:*`, never re-describe permissions
- State: always reference `data:*` state machine, never duplicate it
- Data: net-new fields only; if none, say so explicitly
- Max 60 lines. If exceeded, something belongs in an arch artifact — move it.

---

## `project-state.yaml` — Expanded

New fields for the resumption mechanism. All new fields are `null` when not active.

```yaml
project:
  name: "[name]"
  created: [YYYY-MM-DD]
  release: "1.0.0"
  next_release_type: null
  active_story: null
  active_phase: null          # NEW: ideation | story-spec | development | investigation
ideation_complete: false
arch_seeded: false            # NEW: true after ideation writes architecture/ artifacts + index in architecture.md
stories:
  STORY-001:
    title: "[title]"
    depends_on: []
    intent_done: false        # NEW: true after story-spec finalizes intent.md
    spec_done: false
    built: false
    deployed: false
pending_arch_gap: null        # NEW: set by story-spec when an arch section is missing
  # when active:
  # triggered_by: story-spec | development
  # story_id: STORY-NNN
  # reason: "entity:review not in data-model.md"
  # resume_phase: story-spec | development
pending_spec_gap: null        # NEW: set by development when a reads: reference is wrong
  # when active:
  # triggered_by: development
  # story_id: STORY-NNN
  # reason: "contract:submission-response missing confirmation_email field"
  # resume_phase: development
```

### Resumption routing (P0/P1 — checked BEFORE rows 1–7)

| Priority | Condition | Action |
|----------|-----------|--------|
| P0 | `pending_arch_gap` non-null | invoke ideation (arch gap mode) with gap reason · after: clear flag · re-route to `resume_phase` for `story_id` |
| P1 | `pending_spec_gap` non-null | invoke story-spec (spec gap mode) with gap reason · after: clear flag · re-route to development for `story_id` |
| 1–7 | existing rows | unchanged |

State flags are the standup — every pause is inspectable, every resume is deterministic. The orchestrator never needs to infer where it was.

---

## Agent Changes

### Ideation Subagent — Extended

**New responsibilities:**
1. Seed `arch/` detail files after story list approved
2. Write `## Artifact Index` into `specs/architecture/architecture.md`
3. Add **Topic 9 — UX Model** to Beat 2
4. Seed `intent.md` per story
5. Handle arch gap invocations

**New Beat 2 Topic — Topic 9: UX Model**

After Topic 8 (Story List), before writing final artifacts:

React to the actor structure and story list. Propose:
- Navigation model: persona-split (divergent actor workflows), central-dashboard (shared hub, role-filtered), or hybrid (shared shell, persona content zones). Recommend based on actor count and workflow divergence.
- Visual system: confirm CSS framework (default: Bootstrap 5), icon set (default: Bootstrap Icons), component framework (derive from tech stack — React, Angular, Vue, or vanilla). If React/Angular: confirm component library (react-bootstrap, ng-bootstrap, PrimeNG, etc.).
- Theme: confirm primary/secondary colors, font family. If none specified, use Bootstrap defaults and note it.

Write `## UX Model` narrative summary to `specs/architecture/architecture.md`.

**New Step 3 — Seed arch artifacts** (after current Step 2):

1. Create `specs/architecture/` directory
2. Write `specs/architecture/data-model.md` — derive entities from story list and architecture.md:
   - One `## entity:` section per domain entity inferred from stories
   - Fields: infer from story context — mark uncertain with `# inferred`
   - State machines: only for entities with clear lifecycle
   - ~90% complete — story-spec fills gaps via P0 flow
3. Write `specs/architecture/actors.md` — derive from auth model + story access patterns:
   - One `## actor:` section per role
4. Write `specs/architecture/contracts.md` — derive from stack and story interfaces:
   - Always include `## contract:error-envelope`
   - One section per inferred response shape — mark uncertain with `# inferred`
5. Write `specs/architecture/patterns.md` — derive from tech stack choice:
   - REST vs server actions, ORM vs raw SQL, etc.
6. Write `specs/architecture/ux.md` — from Topic 9 decisions:
   - All four sections: navigation-model, visual-system, component-conventions, screen-template
7. Append `## Artifact Index` to `specs/architecture/architecture.md` — register all sections from steps 2–6
8. Set `arch_seeded: true` in `project-state.yaml`

**New Step 3b — Seed intent.md per story:**

For each story in the confirmed list, write `specs/stories/[STORY-ID]/intent.md`:
- Paragraph 1: functional purpose (who, what, why)
- Paragraph 2: objective and outcome (what success looks like, what changes)
- Derive from story title, vision, and actor model already established

**Arch gap mode** (invoked via P0):
1. Read the gap reason from `pending_arch_gap`
2. Read the relevant arch file
3. Add or update the missing section
4. Update `## Artifact Index` in `specs/architecture/architecture.md` if a new section was added
5. Do NOT touch any story files or `project-state.yaml`
6. Return: `arch gap resolved — [what was added/changed]`

**Amendment mode:** unchanged from v3, extended to also update arch files when architectural decisions change. Arch file updates follow same rules — append dated amendment block, never replace prior content.

**Flush rule:** write to disk after every step. Never hold more than one exchange before flushing.

---

### Story-Spec Subagent — Rebuilt

**New responsibilities:** finalize `intent.md`, validate arch references forward, write slim `story-spec.md` with `reads:` block, signal arch gaps via P0 flag.

**Hard gate — updated:**
```
Read: specs/project-state.yaml           →  must exist · stories.[story_id] must exist
Read: specs/architecture/architecture.md  →  must exist · ## Tech Stack non-empty · ## Artifact Index present
Read: specs/stories/[story_id]/intent.md  →  must exist (seeded by ideation)
```

**Step 1 — Load context:**
1. `specs/architecture/architecture.md` — full file (narrative + index in one read)
2. All architecture files listed in `## Artifact Index` — full read of each (they are small)
3. `specs/stories/[story_id]/intent.md` — seeded draft
4. `specs/project-state.yaml → stories` — all story titles for cross-story context

**Step 2 — Finalize intent.md:**
1. Read seeded `intent.md`
2. Deepen if draft is thin — paragraph 1 (functional purpose) and paragraph 2 (objective/outcome) must be precise enough to ground development judgment calls
3. Write back to `specs/stories/[story_id]/intent.md`
4. Set `intent_done: true` in `project-state.yaml → stories.[story_id]`

**Step 3 — Validate arch references:**
Identify every entity, actor, contract, pattern, and ux section this story will reference. For each:
- Check `## Artifact Index` in `specs/architecture/architecture.md` — does the section exist?
- If missing: write `pending_arch_gap` to `project-state.yaml` and stop:
  ```yaml
  pending_arch_gap:
    triggered_by: story-spec
    story_id: [story_id]
    reason: "[what is missing — e.g. entity:review not in data-model.md]"
    resume_phase: story-spec
  ```
  Orchestrator invokes ideation (arch gap mode), ideation fills the gap, orchestrator resumes story-spec.

**Step 4 — Write story-spec.md:**

Five sections + `reads:` block. Format as defined above.

Rules:
- `reads:` lists exactly what this story uses — no over-declaration
- Include `ux: [component-conventions, screen-template]` for any story with frontend screens; omit for API-only stories
- Interfaces: reference `contract:*` always — never inline reusable shapes
- Permissions: reference `actor:*` always
- State: reference `data:*` state machine always — never duplicate it
- Data: net-new fields only
- Max 60 lines. If exceeded, something is duplicating an arch artifact — move it.

**Step 5 — Self-review:**
```
Self-review checklist:
  [ ] reads: — every referenced section exists in ## Artifact Index
  [ ] reads: ux — included for stories with screens, omitted for API-only
  [ ] Criteria — minimum 4, observable + testable, at least one error-state criterion
  [ ] Interfaces — every endpoint: auth, guard (if stateful), contract ref, error codes
  [ ] Permissions — all actor: references resolve in specs/architecture/actors.md
  [ ] State — references data: state machine, does not duplicate it
  [ ] Data — net-new fields only; owned vs read clear; "new fields: none" if none
  [ ] No inline shapes that belong in contracts.md
  [ ] No permission re-descriptions that duplicate actors.md
  [ ] Total lines ≤ 60
  [ ] Consistent with specs/architecture/architecture.md guardrails
```

**Step 6 — Confirm and set flag:** unchanged from v3.

**Spec gap mode** (invoked via P1):
1. Read the gap reason from `pending_spec_gap`
2. Read the current `story-spec.md`
3. Update the relevant section (typically `reads:` block or `## Interfaces`)
4. If the gap requires an arch update: write `pending_arch_gap` — do not update arch directly
5. Return: `spec gap resolved — [what was updated]`

**Gap merge mode:** unchanged from v3. Also updates `intent.md` if gap changes the story's fundamental purpose or outcome.

---

### Development Subagent — Enhanced

**New responsibilities:** read `intent.md` as functional grounding, read arch sections via `reads:` block, write `@intent` anchor, signal spec gaps via P1 flag.

**Hard gate — updated:**
```
Read: specs/project-state.yaml                    →  stories.[story_id].spec_done:true
Read: specs/stories/[story_id]/intent.md          →  must exist
Read: specs/stories/[story_id]/story-spec.md      →  must exist
Read: specs/architecture/architecture.md  →  must exist
```

**Read sequence:**
1. `specs/stories/[story_id]/intent.md` — functional grounding
2. `specs/stories/[story_id]/story-spec.md` — tactical contract, extract `reads:` block
3. `specs/architecture/architecture.md` — extract `## Artifact Index` (file paths) + `## Guardrails` + `## Configuration`
4. For each entry in `reads:`:
   - Resolve file path from `## Artifact Index`
   - Read the specific section only (`## actor:X`, `## entity:Y`, `## contract:Z`, `## ux:W`)
   - Stop at the next `##` heading — do not read the whole file

Total context: ~110–130 lines. No full architecture file loads except `architecture.md` (small, read once).

**Pending spec gap — P1:**
If a referenced arch element does not match what the code requires — wrong contract shape, missing entity field, undeclared actor permission:
1. Do NOT modify any arch or spec file
2. Write `pending_spec_gap` to `project-state.yaml` and stop:
   ```yaml
   pending_spec_gap:
     triggered_by: development
     story_id: [story_id]
     reason: "[e.g. contract:submission-response missing confirmation_email field needed for notification]"
     resume_phase: development
   ```
3. Orchestrator invokes story-spec (spec gap mode), story-spec updates the spec (and triggers P0 if arch needs updating), development resumes.

**Code anchor schema — updated:**

Existing anchors unchanged (`@story`, `@entry`, `@contract`, `@gap`). One addition:

**`@intent`** — immediately after `@story` at top of every new file:
```
// @story STORY-002 | submissions
// @intent allows an applicant to submit their completed draft for admin review
```

Rules:
- Every new file: `@story` then `@intent`, in that order, at the top
- `@intent` is one line, present-tense, functional language — the "why this file exists"
- Investigation agent greps `@intent` to orient across stories without loading intent.md

All other rules unchanged. Implementation order unchanged: data layer → backend → AI → frontend.

---

### Investigation Subagent — Updated Read Pattern

**Hard gate — updated:**
```
Read: specs/project-state.yaml  →  must exist · ideation_complete:true · arch_seeded:true
Read: specs/architecture/architecture.md  →  must exist · ## Artifact Index present
```

**Step 1 — Load context:**
1. `specs/architecture/architecture.md` — extract `## Artifact Index` + `## Guardrails` (one read, both sections)
2. `specs/architecture/actors.md` — full read (always relevant for permission bugs)
3. `specs/project-state.yaml → stories` — all IDs and titles
4. For the most likely involved story: `story-spec.md` only (not intent.md)

**Step 2 — Investigate — updated anchor search order:**
1. `@story` — map files to stories
2. `@intent` — orient to functional purpose across multiple files without loading intent.md files
3. `@entry` — route handlers and action entry points
4. `@contract` — data shapes at layer boundaries
5. `@gap` — known divergences already noted in code

`@intent` replaces loading multiple `intent.md` files for cross-story bugs. One grep surfaces functional context for every file in the codebase.

All other investigation steps unchanged.

---

### Reverse-Engineer Subagent — Updated Output

**New responsibilities:** synthesize `specs/architecture/` artifacts and `ux.md` from existing code. Seed `intent.md` per story. Write `## Artifact Index` into `specs/architecture/architecture.md`.

**Step 3 — Write spec files (updated):**

After writing `specs/architecture/architecture.md` and `specs/project-state.yaml` (unchanged):

3a. Analyze for UX:
- Identify frontend framework from dependencies
- Identify CSS framework and icon set
- Infer navigation model from route structure and auth middleware
- Infer component patterns from existing UI code

3b. Write architecture artifacts:
- `specs/architecture/data-model.md` — from schema/ORM/migration files
- `specs/architecture/actors.md` — from auth middleware, role checks, guards
- `specs/architecture/contracts.md` — from route handler response shapes and API types
- `specs/architecture/patterns.md` — from dominant structural pattern in code
- `specs/architecture/ux.md` — from frontend analysis in 3a

3c. Append `## Artifact Index` to `specs/architecture/architecture.md` — register all architecture files and sections

3d. For each story, write:
- `specs/stories/[STORY-ID]/intent.md` — 2 paragraphs derived from entry points and feature area
- `specs/stories/[STORY-ID]/story-spec.md` — stub with `reads:` block derived from what code uses

Set `arch_seeded: true` and `intent_done: true` (per story) in `project-state.yaml`.

**Step 4 — Tagging:** unchanged. Prohibition on modifying `project-state.yaml` during tagging retained.

---

### Orchestrator (SKILL.md) — Updated

**Routing table — prepend P0/P1:**

| # | Condition | Action |
|---|-----------|--------|
| P0 | `pending_arch_gap` non-null | invoke ideation (arch gap mode) with gap reason · after complete: clear flag · re-route to `pending_arch_gap.resume_phase` for `story_id` |
| P1 | `pending_spec_gap` non-null | invoke story-spec (spec gap mode) with gap reason · after complete: clear flag · re-route to development for `story_id` |
| 1–7 | existing rows | unchanged |

**Post-ideation verification (updated):**
After `start_ideation` or `reverse_engineer` completes, verify:
- `ideation_complete: true`
- `arch_seeded: true`
- `specs/architecture/architecture.md` contains `## Artifact Index`
- `specs/architecture/data-model.md` exists
- `specs/architecture/actors.md` exists
- `specs/architecture/ux.md` exists

If any missing: set `pending_arch_gap` with reason "arch artifacts incomplete after ideation" → re-route to P0.

**Post-story-spec verification (updated):**
After story-spec completes for a story, verify:
- `spec_done: true`
- `intent_done: true`
- `specs/stories/[story_id]/intent.md` exists
- `specs/stories/[story_id]/story-spec.md` exists
- `pending_arch_gap` is null

**Subagent invocation — updated:**
Pass `project_dir` as before. Replace `arch_index_path` with `arch_ref: specs/architecture/architecture.md` — agents extract the index from the `## Artifact Index` section at the bottom of that file.

---

## Agent Read Pattern Summary

| Agent | Reads | Lines (approx) |
|-------|-------|----------------|
| Ideation | architecture/architecture.md + user conversation | ~60 |
| Story-spec | architecture/architecture.md (narrative + index) + architecture/* (all, small) + intent.md | ~150 |
| Development | intent.md + story-spec.md + architecture/architecture.md (index + guardrails) + targeted sections | ~130 |
| Investigation | architecture/architecture.md (index) + architecture/actors.md + story-spec.md (one story) + code anchors | ~90 |
| Reverse-engineer | full codebase | — |
| Deployment | build-report.yaml files + architecture/architecture.md | ~60 |

---

## Agent Ownership Map

| File | Written by | Read by |
|------|------------|---------|
| `architecture/architecture.md` | Orchestrator (init) → Ideation (narrative + index) | All agents |
| `architecture/data-model.md` | Ideation | Story-spec, Development, Investigation |
| `architecture/actors.md` | Ideation | Story-spec, Development, Investigation |
| `architecture/contracts.md` | Ideation | Story-spec, Development, Investigation |
| `architecture/patterns.md` | Ideation | Story-spec, Development |
| `architecture/ux.md` | Ideation | Story-spec, Development |
| `intent.md` | Ideation (seed) → Story-spec (final) | Development |
| `story-spec.md` | Story-spec | Development, Investigation |
| Code + anchors | Development | Investigation |
| `gap.md` | Orchestrator (enhancement) → Development (files section) | Story-spec (merge) |
| `build-report.yaml` | Development, Reverse-engineer | Deployment, Orchestrator |
| `project-state.yaml` | Orchestrator + all agents (own flags only) | All agents |

One writer per file type. No cross-writing. Clean audit trail.

---

## The Agile Handoff Chain

```
Ideation
  └─ produces: architecture/architecture.md (narrative + UX model + index), architecture/* (90%), intent.md (draft), story list
       │
Story-spec
  └─ reads: architecture/architecture.md (one read: narrative + index) + architecture/* + intent.md (draft)
  └─ produces: intent.md (final), story-spec.md
  └─ signals: pending_arch_gap → Ideation fills → Story-spec resumes
       │
Development
  └─ reads: intent.md + story-spec.md + architecture/architecture.md (index + guardrails) + targeted architecture sections
  └─ produces: code + anchors (@story, @intent, @entry, @contract, @gap)
  └─ signals: pending_spec_gap → Story-spec updates → Development resumes
       │
Investigation (on-demand)
  └─ reads: architecture/architecture.md (index) + architecture/actors.md + story-spec.md + @intent/@entry/@contract anchors
  └─ produces: findings → feeds Development or Story-spec
```

Each agent works *for* the next one. State flags are the standup. Every pause is inspectable. Every resume is deterministic.

---

## What Does NOT Change

- Gap mechanism (gap.md + deploy-time merge via story-spec)
- Build-report.yaml structure
- Deployment subagent
- Routing rows 1–7 (P0/P1 prepend only)
- `spec_done`, `built`, `deployed` flag semantics
- Commit schema (`feat([STORY-ID]): description`)
- Gate format
- Dashboard UI and action bar

---

## Open Item — Deferred to Post-v4

**Arch artifact versioning:** arch files are current-state authoritative. Story specs reference the live version. No version pinning in v4. Reconciliation mechanism to be designed post-v4.
