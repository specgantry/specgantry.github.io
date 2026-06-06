---
layout: docs
title: Architecture
description: SpecGantry's design philosophy, state machine, data model, and extension points.
prev_page: "Skills Guide"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# SpecGantry Architecture

Design philosophy, state machine, data model, security model, and how to extend SpecGantry.

---

## Design Philosophy

SpecGantry is built on three principles that were non-negotiable from the start.

### 1. Structure Before Code

The system enforces that specs, architecture, and planning happen **before** development begins. This is not advisory — it is a hard gate enforced at the filesystem level. The orchestrator verifies that artifact files exist on disk AND that phase flags are set. Both must agree.

The intent: make it impossible to skip a phase, not just inconvenient.

### 2. Session Safety by Default

Every phase writes state to disk immediately after each question or section is answered. If a session is interrupted for any reason — network drop, context reset, end of day, even a crash — the next invocation picks up at the next unanswered question. Zero data loss is a design requirement, not a nice-to-have.

### 3. Role-Based Access Control

Team Leads and Developers have fundamentally different views and permissions. The orchestrator enforces this: it will not invoke project-level agents for a `role: dev` user, and will not write to `project-state.yaml` from a developer context. Role confusion is a common failure mode in collaborative AI workflows — SpecGantry eliminates it by design.

---

## State Machine

SpecGantry operates as a finite state machine at two levels.

### Project-Level States

```
┌───────────────┐
│  INIT         │  No project detected
└───────┬───────┘
        │ /start-project
        ▼
┌───────────────┐
│  IDEATION     │  Answering project questions
└───────┬───────┘
        │ Ideation complete (recommendation: proceed)
        ▼
┌──────────────────┐
│  ARCHITECTURE    │  Defining system design and guardrails
└───────┬──────────┘
        │ Architecture complete, backlog populated
        ▼
┌──────────────────┐
│  BACKLOG_READY   │  Features exist, developers can claim them
└──────────────────┘
```

### Feature-Level States

```
┌──────────────┐
│  PENDING     │  In backlog, not yet claimed
└──────┬───────┘
       │ Developer picks up feature
       ▼
┌──────────────────┐
│  SPEC_IN_PROG    │  Writing feature spec
└──────┬───────────┘
       │ All 6 sections complete, zero violations
       ▼
┌──────────────────┐
│  SPEC_REVIEWED   │  Developer self-reviewed, ready to build
└──────┬───────────┘
       │ Dependency gate + contract gate both pass
       ▼
┌──────────────────┐
│  BUILD           │  Implementing feature
└──────┬───────────┘
       │ Tests pass (overall_status: pass)
       ▼
┌──────────────────┐
│  READY_TO_DEPLOY │  Awaiting Team Lead deployment
└──────┬───────────┘
       │ Deployment agent verifies and completes
       ▼
┌──────────────────┐
│  COMPLETE        │  Deployed, done
└──────────────────┘
```

---

## Data Model

### `specs/project-state.yaml`

```yaml
project:
  name: "My Application"
  vision: "Solve X for Y users"
  created_at: 2026-01-15
  team_lead: "alice"

phase_gates:
  ideation_complete: true
  architecture_complete: true

ideation_recommendation: proceed  # proceed | clarify | escalate
ideation_blockers: []

architecture_open_questions: []

domains:
  - name: auth
    description: "Authentication, sessions, OAuth, permissions"
  - name: core
    description: "User management, settings, core entities"

backlog:
  - id: "FEATURE-001"
    title: "User authentication"
    domain: "auth"
    assignee: "bob"
    status: complete         # pending | in_progress | complete | deferred | abandoned
    phase: deploy            # ideation | spec | build | deploy
    size: medium             # small | medium | large
    depends_on: []
    deployment_status: complete
```

### `specs/features/FEATURE-XXX/state.yaml`

```yaml
feature:
  id: "FEATURE-001"
  title: "User authentication"
  domain: "auth"
  assignee: "bob"

phase_gates:
  feature_spec_complete: false
  spec_reviewed: false
  dev_complete: false
  tests_passing: false

metrics:
  size: medium

timestamps:
  created: 2026-01-16
  spec_started: 2026-01-16
  spec_approved: null
  deploy_complete: null

blockers: []
```

### `.claude/local-state.yaml`

```yaml
role: dev                 # tl | dev
current_feature: FEATURE-001
last_session: 2026-01-19T14:30:00Z
```

---

## The Orchestrator

The orchestrator is the single choke point for all phase transitions. Skills invoke it; it routes to agents. No agent can be invoked except through the orchestrator.

**Responsibilities:**
1. **Gate enforcement** — reads filesystem and flags, both must agree
2. **Agent routing** — dispatches to the correct agent for phase and role
3. **Token logging** — appends usage entry after every agent invocation
4. **State updates** — writes phase gate transitions after confirmed completion
5. **Role enforcement** — refuses project-level operations for `role: dev`

**Gate failure format:**

```
✗ Gate check failed: feature_spec → build

  Required                                    Status
  ──────────────────────────────────────────────────
  feature-spec.md exists                   →  ✓
  All 6 sections present                   →  ✓
  ## Guardrail Compliance section present  →  ✓
  Zero VIOLATION: markers                  →  ✗
  spec_reviewed: true                      →  ✗

  Action: Resolve the VIOLATION in section 2 (API Contract).
  Then self-review the spec.

  Run /spec-gantry to return to the dashboard.
```

---

## State Persistence Model

### Why YAML?

- **Human-readable** — inspectable without tooling; editable as a recovery step
- **Git-friendly** — meaningful diffs, clean history
- **Language-agnostic** — no SDK required to read or write
- **Lossless** — no serialization surprises

### Write-After-Every-Answer

Agents follow a strict pattern:

1. Read the artifact file; find first incomplete section
2. Ask the question for that section
3. Receive the answer
4. Replace the placeholder with the answer
5. **Write the file to disk**
6. Move to the next section

This means the artifact on disk always reflects the most recent complete answer. No buffering, no batch writes at the end of a session.

---

## Security Model

### Role-Based Access

| Action | Team Lead | Developer |
|--------|-----------|-----------|
| Run ideation | ✅ | ❌ |
| Run architecture | ✅ | ❌ |
| Write to project-state.yaml | ✅ | ❌ |
| View architecture spec | ✅ | ✅ (read-only) |
| Write feature spec | ✅ | ✅ |
| Self-review feature spec | ✅ | ✅ |
| Build feature | ✅ | ✅ |
| Deploy | ✅ | ❌ |
| View all costs | ✅ | ✅ |

### Secrets Handling

The dev agent enforces a hard rule: **no secrets or credentials in source code**. 

The feature-spec template requires that section 6 (Non-Functional Considerations) lists every secret, API key, and credential by its environment variable name. The dev agent reads this list and refuses to write any literal credential value to a file.

If a violation is detected:

```
✗ Secrets violation: attempted to hardcode Stripe secret key in src/services/billing.js

  This value must be read from environment variable STRIPE_SECRET_KEY.
  Declared env vars for this feature: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

  Fix: use process.env.STRIPE_SECRET_KEY. Do not proceed until resolved.
```

---

## Performance Characteristics

| Operation | Typical Time |
|-----------|-------------|
| Dashboard render | < 1 second |
| State update (single file write) | < 100ms |
| Phase transition (orchestrator + state update) | < 500ms |
| Agent invocation (model-dependent) | 30 seconds to 5 minutes |

The bottleneck is always the model invocation. State operations are negligible.

---

## Scalability

SpecGantry scales well for:
- Up to ~100 features per project
- Multiple parallel developers (different features, different branches)
- Feature reordering and reassignment
- Multiple team members with separate `local-state.yaml` files

Each feature has its own directory under `specs/features/`, so parallel work is naturally isolated.

---

## Extension Points

SpecGantry is open source and designed to be extended.

### Custom Agents

Add domain-specific agents by creating a new `.md` file under `agents/` with the standard frontmatter:

```yaml
---
name: security-review-agent
description: Performs security review of feature spec before approving build
model: claude-sonnet-4-6
tools: Read, Write
---
```

### Custom Skills

Add workflow steps by creating a `SKILL.md` under `skills/[name]/`. The orchestrator can be extended to invoke your skill at specific phase transitions.

### Custom Validation

Add custom guardrail patterns to `architecture-spec.md → ## Guardrails`. The feature-spec agent enforces all guardrails in that section — adding new ones requires no code changes.

### Custom Phase Pipeline

The phase ordering and gate conditions are in `orchestrator.md`. Advanced users can modify them to add phases (e.g., a security review phase between spec and build) or change role requirements.

---

## Contributing

SpecGantry is open source under Apache 2.0. See [CONTRIBUTING.md](https://github.com/specgantry/specgantry.github.io/blob/main/CONTRIBUTING.md) for details.

Issues and PRs welcome: [github.com/specgantry/specgantry.github.io](https://github.com/specgantry/specgantry.github.io)

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon">❓</div>
    <div>
      <strong>FAQ</strong>
      <span>Answers to common questions about installation, roles, pipeline phases, costs, and troubleshooting.</span>
    </div>
  </a>
  <a href="/docs/getting-started" class="next-step-card">
    <div class="next-step-icon">🚀</div>
    <div>
      <strong>Getting Started</strong>
      <span>Install and run your first session in under 5 minutes.</span>
    </div>
  </a>
</div>
