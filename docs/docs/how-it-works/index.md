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

The test agent detects the project's test runner (npm, pytest, go test, rspec, make test) and runs the full suite. If any tests fail on the first run, it runs them a second time immediately:
- Tests that fail on run 1 but pass on run 2 → marked as **flaky** (recorded, but not a hard block)
- Tests that fail on **both** runs → **hard failures** (deployment gate closed)

This retry pass distinguishes genuine failures from non-deterministic tests that pollute CI. Flaky tests are always recorded in `dev-artifact.yaml → flaky_tests` even when they don't block.

**Gate check:**
- `dev-artifact.yaml` exists
- `overall_status: pass` (set by test agent)
- `phase_gates.tests_passing: true` in feature state

---

### Phase 5 — Deploy

**Who:** Team Lead (or Developer with permission)  
**Time:** 5–10 minutes  
**Output:** `specs/features/FEATURE-XXX/deploy.sh` + `specs/features/FEATURE-XXX/deploy-artifact.md`

The deployment agent runs two hard checks before generating anything:

1. **Tests passing** — reads `dev-artifact.yaml → overall_status`. Must be `pass`. If not, stops immediately.
2. **Dependencies deployed** — reads the feature's `depends_on` list and verifies each has `deployment_status: complete`. If any are not yet deployed, stops and names the blockers.

If there are spec warnings recorded during development (from `dev-artifact.yaml → warnings`), they are surfaced as notices — they don't block deployment but must be visible before the script runs.

Once both hard checks pass, the agent generates `deploy.sh` — a concrete shell script derived from the feature's Implementation Plan and the list of files modified during development. Each step is either a runnable command or a `# MANUAL:` comment for steps that require human action. After writing the script, the agent validates it with `bash -n` (syntax check). A script that fails the syntax check sets `deployment_status: blocked` — it must be corrected before proceeding.

On completion, the feature is marked `deployment_status: complete` in `project-state.yaml` and the feature count in the dashboard increments.

---

## Roles {#roles}

### Team Lead / Architect

The Team Lead owns the project-level phases and has write access to `project-state.yaml`.

**What they do:**
- Drive Ideation and Architecture sessions
- Monitor feature spec progress and flag concerns (resetting `spec_reviewed` if needed)
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
- Modify the backlog
- Deploy (only Team Lead)
- Access `[B]acklog` and `[P]roject` menu options

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

## Versioned Features (Enhancements)

When the Team Lead classifies a post-completion request as an **enhancement** to an existing feature, SpecGantry creates a versioned successor rather than modifying the original:

- The original feature's artifacts are renamed to `state-v1.yaml`, `feature-spec-v1.md`, etc.
- A new `FEATURE-NNN-v2/` directory is created with a fresh spec cycle
- The `v2` entry is added to the backlog with `supersedes: FEATURE-NNN`

On the dashboard, the superseded original is shown collapsed and labelled `[archived v1]`, and the active version carries a `(v2)` badge. The progress count only includes active (non-superseded) features:

```
  FEATURE-003-v2: Payment Gateway (v2)   ✅ Spec  ✅ Review  🔄 Build  ○ Tests  ○ Done
  └─ FEATURE-003 [archived v1]           (deployed 2026-05-12)
```

This preserves full history — the original spec and dev artifact remain on disk — while giving the new version a clean spec cycle with current guardrails.

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
    │   ├── dev-artifact.yaml       # Files modified, tasks, test results
    │   ├── deploy.sh               # Generated deployment script (after deploy phase)
    │   └── deploy-artifact.md      # Deployment validation summary
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

## Post-Completion: Classify and Route

After all features are deployed, SpecGantry doesn't stop — it routes new work based on what you describe. The orchestrator classifies free-text descriptions into one of four types before creating any files:

**`bug_fix`** — Something that worked before is broken. Routes directly to development with the spec gate bypassed. A `BUGFIX-NNN` entry is created, architecture guardrails still apply, and tests are required before deployment.

**`enhancement`** — An existing feature needs to do more or behave differently. The original feature's artifacts are archived as `v1`, and a fresh `FEATURE-NNN-v2` directory is created with a new spec cycle. The new version goes through the full feature pipeline.

**`new_feature`** — A capability with no prior backlog entry. If it requires a new domain or cross-cutting concern, the orchestrator first runs the architecture agent in **amendment mode** — appending changes to `architecture-spec.md` without overwriting prior decisions. Otherwise it goes straight to feature spec.

**`project_change`** — Infrastructure, auth, data model, or multi-feature scope changes. Always goes through ideation and architecture amendment first. After architecture, any existing feature specs touching affected domains have `spec_reviewed` reset — their developers must re-review before building can continue.

The orchestrator defaults to the more conservative classification when ambiguous (`bug_fix > enhancement > new_feature > project_change`) and always confirms its decision before proceeding.

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
