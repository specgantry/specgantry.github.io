---
layout: docs
title: Reference
description: SpecGantry v5 reference — file structure, state flags, agent ownership, Artifact Index format, and design principles.
permalink: /docs/architecture/
prev_page: "Skills & Agents"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# Reference

Complete reference for SpecGantry v5 internals — file structure, state flags, agent ownership, and design principles.

---

## File Structure {#file-structure}

All SpecGantry artifacts live under `specs/` in your project root:

```
specs/
  project-state.yaml            — orchestrator state, story flags, gap signals
  cost-log.ndjson               — token usage per invocation (append-only)
  deploy.sh                     — generated deployment script
  deploy-artifact.md            — deployment metadata
  architecture/
    architecture.md             — narrative + Artifact Index (entry point)
    data-model.md               — entities, fields, state machines
    actors.md                   — roles, permissions
    contracts.md                — API response shapes, error envelopes
    patterns.md                 — backend interaction patterns
    ux.md                       — navigation, visual system, component conventions
  stories/
    STORY-001/
      intent.md                 — 2-paragraph functional purpose
      story-spec.md             — criteria, interfaces, permissions, state, data
      build-report.yaml         — runtime profile, overall_status
      gap.md                    — mid-build discovery log (deleted on deploy)
    STORY-002/
      ...
  scratchpad/                   — temporary files (not committed)
```

Add `specs/.current-session` to `.gitignore`. Commit everything else.

---

## State Flags {#state-flags}

`specs/project-state.yaml` tracks every pipeline decision:

```yaml
project:
  name: "MyProject"
  created: 2026-06-16
  release: "1.0.0"
  next_release_type: null     # null | patch | minor | major
  active_story: null          # STORY-ID while subagent is running, null otherwise
  active_phase: null          # ideation | story-spec | development | evaluation | repair_plan | deployment | investigation | amendment | null

ideation_complete: false      # true after all Beat 2 topics confirmed
arch_seeded: false            # true after all 6 architecture artifacts + intent.md written (Pass 2)
pending_arch_gap: null        # set by story-spec or orchestrator when arch section missing
pending_spec_gap: null        # set by development when a reads: reference doesn't resolve

stories:
  STORY-001:
    title: "User authentication"
    depends_on: []
    intent_done: false        # true after story-spec finalizes intent.md
    spec_done: false          # true after story-spec writes story-spec.md
    built: false              # true after development completes
    deployed: false           # true after deployment agent runs
```

### Gap flag schema

`pending_arch_gap` when active:
```yaml
pending_arch_gap:
  triggered_by: story-spec   # or development | orchestrator
  story_id: STORY-002        # or null for project-level P2 gaps
  reason: "entity:review not in data-model.md"
  resume_phase: story-spec   # or development
```

`pending_spec_gap` when active:
```yaml
pending_spec_gap:
  triggered_by: development
  story_id: STORY-002
  reason: "contract:submission-response missing confirmation_email field"
  resume_phase: development
```

---

## The Artifact Index Format {#artifact-index}

The `## Artifact Index` is always the last section of `specs/architecture/architecture.md`. It is a fenced YAML block — agents parse it to resolve architecture artifact paths without scanning the directory.

```markdown
## Artifact Index

` ` `yaml
data-model:
  file: specs/architecture/data-model.md
  entities: [application, user, review]

actors:
  file: specs/architecture/actors.md
  roles: [applicant, admin, reviewer]

contracts:
  file: specs/architecture/contracts.md
  shapes: [submission-response, review-response, error-envelope]

patterns:
  file: specs/architecture/patterns.md
  patterns: [request-response, state-machine]

ux:
  file: specs/architecture/ux.md
  sections: [navigation-model, visual-system, component-conventions, screen-template]
` ` `
```

**Rules:**
- No inline comments inside the YAML block
- No extra keys beyond the defined schema
- Lists use the actual section names (without the `entity:`, `actor:`, `contract:`, `pattern:` prefix)
- `## Artifact Index` must be the last `##` section — no sections after it

---

## Architecture Artifact Formats {#artifact-formats}

### data-model.md

One section per entity:

```markdown
## entity:application
fields:
  id:           uuid, system-generated
  user_id:      uuid, required, FK → entity:user
  status:       enum(draft|submitted|under-review|approved|rejected), system-managed
  submitted_at: timestamp, nullable
  created_at:   timestamp, system-generated
state-machine:
  draft → submitted:        trigger: applicant submit · guard: all required fields present
  submitted → under-review: trigger: admin opens review
  under-review → approved:  trigger: admin approves
  under-review → rejected:  trigger: admin rejects
owned-by: actor:applicant
```

### actors.md

One section per role:

```markdown
## actor:applicant
owns: application (own records only)
can: create-application, read-own-application, edit-draft, submit-draft, delete-draft
cannot: read-others-applications, approve, reject, access-admin
```

### contracts.md

One section per response shape:

```markdown
## contract:submission-response
{
  id:           uuid
  status:       "submitted"
  submitted_at: ISO8601 timestamp
}
errors:
  400: validation failure → contract:error-envelope
  401: unauthenticated
  403: not owner or wrong status
  422: status is not draft

## contract:error-envelope
{
  error:   string  (machine-readable code)
  message: string  (human-readable)
  fields:  [{field: string, message: string}]  (validation errors only, omit otherwise)
}
```

### patterns.md

One section per pattern:

```markdown
## pattern:request-response
Standard REST: route handler → service layer → data layer.
Errors always use contract:error-envelope.
Validation at service layer, not route handler.

## pattern:state-machine
State transitions live in the service layer only.
Guard conditions checked before transition. Illegal transitions return 422.
```

### ux.md

Four fixed sections:

```markdown
## ux:navigation-model
pattern: persona-split
entry-points:
  actor:applicant → /app/dashboard
  actor:admin     → /admin/queue
shared-shell: true

## ux:visual-system
css-framework:       bootstrap@5.3
icon-set:            bootstrap-icons
component-framework: react
theme:
  primary:    #2563eb
  secondary:  #64748b
  font-family: Inter, sans-serif

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
toasts:
  - bootstrap toast, top-right corner
  - success: auto-dismiss 4s · error: persistent · info: auto-dismiss 6s

## ux:screen-template
Every screen follows this structure:
  1. shared shell: navbar + optional sidebar
  2. page header: h1 title left · primary action button right-aligned
  3. content zone: list | form | detail
  4. footer: optional, shared shell

Empty states: mandatory on every list screen.
Error states: mandatory on every form and data-fetch screen.
Loading states: mandatory on every async screen.
```

---

## Agent Ownership {#agent-ownership}

One writer per file type. No cross-writing.

| File type | Written by | Read by |
|-----------|------------|---------|
| `architecture/architecture.md` | Orchestrator (init) → Ideation (narrative + index) | All agents |
| `architecture/data-model.md` | Ideation | Story-spec, Development, Investigation |
| `architecture/actors.md` | Ideation | Story-spec, Development, Investigation |
| `architecture/contracts.md` | Ideation | Story-spec, Development |
| `architecture/patterns.md` | Ideation | Story-spec, Development |
| `architecture/ux.md` | Ideation | Story-spec, Development |
| `intent.md` | Ideation (seed) → Story-spec (final) | Development |
| `story-spec.md` | Story-spec | Development, Investigation |
| Code + anchors | Development | Investigation |
| `gap.md` | Orchestrator (enhancement) → Development (files section) | Story-spec (merge) |
| `build-report.yaml` | Development, Reverse-engineer | Deployment, Orchestrator |
| `project-state.yaml` | Orchestrator + all agents (own flags only) | All agents |

---

## Code Anchor Schema {#anchors}

Development writes machine-readable anchor comments in every new file. The investigative agent searches by these tags to navigate the codebase without reading full files.

| Anchor | Placement | Format |
|--------|-----------|--------|
| `@story` | Top of every new/modified file | `// @story STORY-002 \| submissions` |
| `@intent` | Immediately after `@story` | `// @intent allows an applicant to submit their draft` |
| `@entry` | Above every route handler or action | `// @entry POST /api/applications/:id/submit \| submit draft` |
| `@contract` | Above every cross-layer function | `// @contract input: {...} → output: contract:submission-response \| errors: ...` |
| `@gap` | Inline at the divergence point | `// @gap 2026-06-16 status enum extended — spec only defines draft\|submitted` |

Use the language's native comment syntax (`//`, `#`, `--`, etc.).

---

## Design Principles {#principles}

**One writer per file type.** Every file has exactly one agent that writes it. No other agent modifies it. Clean audit trail, no race conditions between agents.

**State flags confirm files exist.** `arch_seeded:true` is only written after all architecture artifacts are on disk. `intent_done:true` only after `intent.md` is on disk. State is never optimistic — a flag being true guarantees the artifact exists.

**Targeted reads over broad context.** Agents load only the sections they need via the `reads:` block. ~130 lines of targeted context per story instead of the full architecture. The gap flow handles the cases where a needed section doesn't exist yet.

**Self-healing over user intervention.** Gap flows (P0/P1/P2) resolve broken references automatically. The user should never need to manually edit state files or tell SpecGantry to "retry" a failed phase.

**Architecture is authoritative.** The `architecture/` files are the source of truth for entities, actors, contracts, patterns, and UX. Story specs reference them — never duplicate them. If a story spec needs something that isn't in the architecture artifacts, a P0 gap adds it.

**Plain text, git-native.** All artifacts are YAML and Markdown. Diffs are meaningful. History is preserved. No proprietary format, no external database.
