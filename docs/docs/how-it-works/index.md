---
layout: docs
title: How It Works
description: Detailed breakdown of SpecGantry's five-phase pipeline, phase gates, roles, session safety, and cost tracking.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete breakdown of the pipeline, roles, phase gates, and everything that happens under the hood.

---

## The Pipeline at a Glance

SpecGantry enforces a five-phase SDLC pipeline split across two levels:

```
PROJECT LEVEL ──────────────────────────────────────────────────────
  Phase 1: Ideation     (Team Lead / Architect)
  Phase 2: Architecture (Team Lead / Architect)

  ── Architecture committed to git ──

FEATURE LEVEL (runs in parallel for each feature) ──────────────────
  Phase 3: Feature Spec   (Developer)
  Phase 4: Build          (Developer)
  Phase 5: Deploy         (Team Lead or Developer)
```

**The critical invariant:** no phase starts without the previous one complete. Gates read the filesystem — not just flags, but the actual artifact file. The orchestrator verifies both before advancing.

---

## Video Overview

<div class="video-placeholder">
  <div class="video-placeholder-inner">
    <div class="video-icon">▶</div>
    <div class="video-text">
      <strong>SpecGantry Pipeline Walkthrough</strong>
      <span>Coming soon — a complete walkthrough of all five phases from ideation to deployment.</span>
    </div>
  </div>
</div>

---

## The Five Phases {#phases}

### Phase 1 — Ideation

**Who:** Team Lead / Architect  
**Time:** 10–20 minutes  
**Output:** `specs/ideation-artifact.md`

The ideation agent stress-tests the project idea before any design work begins. It generates targeted questions from your project description — not a fixed script. Questions are tailored to the domain, scale, and constraints of what you described.

**Five question categories:**
1. **Problem Validation** — Is the problem real? Is it differentiated?
2. **Users and Scale** — Who are the primary users? Order of magnitude?
3. **Constraints** — Existing stack, compliance, hard limits?
4. **Risks** — Biggest technical bet? Organizational risks?
5. **Definition of Done** — What does shipped v1 look like?

After all five categories, the agent produces a **feasibility assessment** with a recommendation: `proceed`, `clarify`, or `escalate`.

**Gate check:**
- `specs/ideation-artifact.md` exists on disk
- `phase_gates.ideation_complete: true` in `project-state.yaml`
- `ideation_recommendation: proceed`

If the recommendation is `clarify` or `escalate`, the orchestrator surfaces the specific blockers and halts. Architecture cannot begin until resolved.

---

### Phase 2 — Architecture

**Who:** Team Lead / Architect  
**Time:** 20–40 minutes  
**Output:** `specs/architecture-spec.md` + feature backlog in `project-state.yaml`

The architecture agent reads the ideation artifact and generates questions specific to this project's technology choices, boundaries, and risks. No generic prompts — everything is derived from what you described in ideation.

**Five architecture topics:**
1. **Tech Stack** — Languages, frameworks, databases
2. **System Boundaries** — Components, services, layers, and what must not be crossed
3. **API Contracts** — Protocol, key operations, external contracts to honor
4. **Core Data Model** — Entities, ownership, external vs. internal data
5. **Non-Functional Requirements** — Latency, auth model, observability

After the five topics, the agent:
1. **Derives project domains** — Proposes 3–6 bounded contexts based on system boundaries (not a preset taxonomy)
2. **Writes guardrails** — Every decision becomes an enforceable rule that feature specs must honor
3. **Generates feature backlog** — Decomposes the system into sized, domain-tagged, dependency-aware features

**Gate check:**
- `specs/architecture-spec.md` exists with all required sections
- `phase_gates.architecture_complete: true` in `project-state.yaml`
- Backlog contains at least one feature entry

---

### Phase 3 — Feature Spec {#spec-gate}

**Who:** Developer  
**Time:** 5–15 minutes per feature  
**Output:** `specs/features/FEATURE-XXX/feature-spec.md`

This is the most critical gate in the system. No code can be written until this phase passes completely.

The feature-spec agent loads the architecture spec and the feature's entry from the backlog. It then guides the developer through six spec sections — writing each section to disk immediately after it's answered so sessions can resume from any interruption.

**Six sections:**
1. **Scope** — What the feature does and explicitly does NOT do, bounded by domain
2. **API / Interface Contract** — Endpoints, function signatures, event schemas
3. **Data** — What data the feature reads, writes, or owns; how it maps to the data model
4. **Implementation Plan** — Ordered tasks, each completable in one focused session
5. **Test Plan** — Unit tests, integration tests, edge cases
6. **Non-Functional Considerations** — Performance, security, observability, and **every secret/credential must be named as an env var**

After all six sections, the agent writes a **Guardrail Compliance** section that checks every guardrail from `architecture-spec.md` against the spec. Any `VIOLATION:` marker is a hard blocker.

**Gate check (strict):**
- All six sections present and not `_not yet written_`
- `## Guardrail Compliance` section exists
- Zero `VIOLATION:` markers
- Developer self-review complete (`spec_reviewed: true`)
- Cross-feature API contract conflicts: none

**The cross-feature contract check:** Before development can begin, the orchestrator reads ALL feature specs and checks for conflicting API contracts — same endpoint defined in two specs, same function name with different signatures, overlapping data ownership. Any conflict resets `spec_reviewed: false` on all affected specs.

---

### Phase 4 — Build

**Who:** Developer  
**Time:** Depends on feature complexity  
**Output:** Source code + `specs/features/FEATURE-XXX/dev-artifact.yaml`

The dev agent is a code executor. It reads `feature-spec.md` and implements each task in the Implementation Plan in order, within the boundaries established by `architecture-spec.md`.

**Hard constraints:**
- Domain boundary cannot be crossed
- Every guardrail in the architecture spec must be respected
- Secrets and credentials must come from env vars — never hardcoded
- Tests are written alongside code, not after
- Commits use structured messages: `feat(FEATURE-001): implement POST /auth/register`

If the dev agent encounters a guardrail conflict during implementation, it stops and reports the conflict. It does not work around it silently.

The dev agent writes `dev-artifact.yaml` with files modified, tasks completed, commits made, and warnings encountered. It then hands off to the test agent automatically.

**Gate check:**
- `dev-artifact.yaml` exists
- `overall_status: pass` (set by test agent)
- `phase_gates.tests_passing: true` in feature state

---

### Phase 5 — Deploy

**Who:** Team Lead (or Developer with permission)  
**Time:** 5–10 minutes  
**Output:** `specs/features/FEATURE-XXX/deploy-artifact.md`

The deployment agent runs final verification before production release:
- All unit tests passing
- Integration tests passing  
- Architecture compliance confirmed
- Code review approval recorded

On completion, the feature is marked `deployment_status: complete` in `project-state.yaml` and the feature count in the dashboard increments.

---

## Roles {#roles}

### Team Lead / Architect

The Team Lead owns the project-level phases and has write access to `project-state.yaml`.

**What they do:**
- Drive Ideation and Architecture sessions
- Review and approve (or reject) feature specs
- Manage the backlog — prioritize, assign, defer, reassign
- Deploy completed features
- View full cost breakdown by phase and developer

**What they see on the dashboard:**
- All features and their pipeline status
- Features awaiting spec review
- Open architecture questions (if any)
- Cost breakdown

**What they cannot do in the pipeline:**
- Start coding features (they can switch roles manually, but SpecGantry doesn't guide them)

---

### Developer

Developers own feature-level phases and cannot write to `project-state.yaml` (the orchestrator enforces this).

**What they do:**
- Pick features from the backlog
- Write feature specs
- Implement against the spec
- Write tests
- Request deployment from Team Lead

**What they see on the dashboard:**
- Their assigned features
- Unassigned features they can pick up
- Architecture spec (read-only)

**What they cannot do:**
- Approve specs (only Team Lead)
- Deploy (only Team Lead)
- Modify the backlog

---

## Session Safety & Resumption

Every phase writes state to disk after each question or section. This is the fundamental guarantee:

> **If a session is interrupted at any point — network drop, context reset, end of day — the next `/spec-gantry` picks up at the next unanswered question.**

**How it works:**
1. Agent creates the artifact file with placeholder markers before asking any questions
2. After each answer, the placeholder is replaced and the file is written to disk
3. On resume, the agent reads the file, finds the first remaining placeholder, and continues

For ideation, this means if you answer 3 of 5 categories before context resets, the next session resumes at category 4.

For feature specs, if you complete 4 of 6 sections before a network drop, the next session resumes at section 5.

---

## Cost Tracking {#cost-tracking}

Every agent invocation logs:

```yaml
token_usage:
  - phase: feature_spec
    agent: feature-spec-agent
    model: claude-sonnet-4-6
    date: 2026-06-04
    input_tokens: 12450
    output_tokens: 3820
```

**Project-level usage** is logged in `specs/project-state.yaml`. **Feature-level usage** is logged in `specs/features/[id]/state.yaml`.

The dashboard computes:
- **Per-feature cost** — shown next to each feature row
- **Total project cost** — running balance
- **Cost by developer** — visible to Team Leads

Pricing is configurable with `/update-pricing` — update when Claude pricing changes, or to match your organization's internal rates.

<div class="info">
  <strong>Optimize costs:</strong> Use <code>claude-haiku-4-5</code> for ideation (faster, cheaper) and <code>claude-sonnet-4-6</code> for architecture and feature spec (better quality for critical decisions). The default agents are already configured this way.
</div>

---

## Feature Dependencies

The architecture agent can declare dependencies between features:

```yaml
backlog:
  - id: FEATURE-003
    title: Payment processing
    depends_on: [FEATURE-001, FEATURE-002]
```

The orchestrator enforces this at the dependency gate: before invoking any feature agent, it checks that all dependencies have `deployment_status: complete`. A developer assigned to FEATURE-003 cannot start even the spec phase until FEATURE-001 and FEATURE-002 are deployed.

The dashboard shows blocked features with a `🔴` indicator and lists which dependencies are outstanding.

---

## The File Structure

```
specs/
├── project-state.yaml              # Project metadata, backlog, token usage
├── ideation-artifact.md            # Ideation output (6 sections + recommendation)
├── architecture-spec.md            # Architecture (6 topics + guardrails + backlog)
└── features/
    ├── FEATURE-001/
    │   ├── state.yaml              # Phase gates, timestamps, token usage
    │   ├── feature-spec.md         # 6-section spec + guardrail compliance
    │   └── dev-artifact.yaml       # Files modified, tasks, test results
    └── FEATURE-002/
        └── ...

.claude/
└── local-state.yaml                # Role and current_feature (local, not committed)
```

The `specs/` directory should be committed to git. The `.claude/local-state.yaml` is local to each developer's machine.

---

## Error Recovery

**If `/spec-gantry` shows wrong state:**  
Re-run it — it re-reads all state from disk each time. Most inconsistencies resolve automatically.

**If you need to restart a phase:**  
Edit the relevant `state.yaml` and set the phase gate flag back to `false`. Next run picks up from there.

**If YAML is corrupted:**  
Fix it manually (it's plain text) or delete and re-run the phase. If committed to git, restore from history.

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon">🛠️</div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill command in detail — when to use each one and what it produces.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon">🏗️</div>
    <div>
      <strong>Technical Architecture</strong>
      <span>State machine, data model, design philosophy, and extension points.</span>
    </div>
  </a>
</div>
