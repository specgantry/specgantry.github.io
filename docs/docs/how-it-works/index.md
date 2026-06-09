---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry's pipeline — from raw idea to deployed system.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete walkthrough of the pipeline, roles, and what happens at each phase.

---

## The Pipeline at a Glance

```
IDEATION ────────────────────────────────────────────────────
  Mature the idea + shape the system
  Output: architecture-spec.md · component backlog · integration-scenarios.md (seeded)

COMPONENT LOOP (parallel, dependency-ordered) ───────────────
  Spec   — component spec + domain elaboration (first of each domain)
  Build  — TDD implementation
  Test   — unit + component tests  →  technically solid

INTEGRATION TEST ────────────────────────────────────────────
  Execute critical cross-component scenarios  →  functionally solid

DEPLOY ──────────────────────────────────────────────────────
  Deployment script + release
```

Components run in parallel and in dependency order — data-layer components first, consumers after. The integration test phase runs once, after all components pass their unit tests. Deployment is gated on integration tests passing, not on individual component tests.

---

## Video Overview

<div class="video-placeholder">
  <div class="video-placeholder-inner">
    <div class="video-icon">▶</div>
    <div class="video-text">
      <strong>SpecGantry Pipeline Walkthrough</strong>
      <span>Coming soon — a complete walkthrough of all phases from ideation to deployment.</span>
    </div>
  </div>
</div>

---

## The Phases {#phases}

### Phase 1 — Ideation {#ideation}

**Who:** Team Lead / Architect
**Time:** 15–30 minutes
**Output:** `specs/architecture-spec.md` · component backlog in `specs/project-state.yaml` · `specs/integration-scenarios.md` (seeded)

Ideation is a single conversation that does two things in sequence: matures the raw idea, then shapes the system. There is no separate architecture phase — the output of the conversation is the architecture.

**Beat 1 — Mature the idea**

SpecGantry acts as a thinking partner, not an interviewer. It reads your vision and reacts to it using one of three stances:

- **"Yes, and…"** — affirms the direction and extends it with something you may not have considered
- **"Fine, but…"** — accepts the premise but surfaces a tradeoff, constraint, or risk it creates
- **"What about…"** — probes a gap or edge case the vision didn't address

Four topics, one question each: vision, problem & users, constraints, risks & out of scope. After each answer, SpecGantry writes a synthesis — not a transcript of your words, but what it now understands to be true. You confirm a Beat 1 summary before moving on.

**Beat 2 — Shape the system**

Directly from the matured idea, SpecGantry proposes the system shape — tech stack, component boundaries, guardrails, and a dependency-ordered component backlog. Each topic is a proposal for you to confirm or redirect, not an open-ended question. Four more topics: tech stack, system boundaries, guardrails, component backlog.

Everything is written to `specs/architecture-spec.md` after every answer. A crash mid-session loses at most one exchange.

`specs/integration-scenarios.md` is seeded during Beat 2 with the obvious end-to-end flows visible from the system boundaries. It grows as component specs are written.

**Component granularity — Goldilocks rule:**
Components are building blocks, not micro-tasks. A component is a vertical slice — something a developer can complete in 1–3 sessions and demonstrate independently. Related capabilities within a domain belong in one component. A component can have internally separated code (models, services, controllers) but ships as a unit with one spec. When in doubt, merge — a component can always be extended later via `[+] New work`.

---

### Phase 2 — Component Spec {#spec-gate}

**Who:** Developer
**Time:** 5–15 minutes per component (+5 min domain elaboration on first component of each domain)
**Output:** `specs/features/FEATURE-NNN/feature-spec.md`

No code is written until a complete spec exists.

**Domain elaboration (first component of a domain):** if this is the first component picked up in its domain, three quick architecture questions elaborate that domain before the spec begins — data model, interface contract, domain-specific constraints. The answers are appended to `architecture-spec.md` as a `## Domain: [name]` section and used as context for the spec. Subsequent components in the same domain skip this step.

**Cross-reference, don't duplicate:** the component spec references `architecture-spec.md` for anything already defined there — tech stack, guardrails, domain data model, interface contracts. The spec only adds what is specific to this component. This keeps both documents slim.

The spec covers five sections:

1. **Scope** — what this component does and explicitly does not do, within its domain
2. **Interface Contract** — what it exposes or consumes beyond what's in the domain section
3. **Data** — what data it owns or accesses beyond what's in the domain data model
4. **Implementation Plan** — ordered tasks, each completable in one session
5. **Test Plan** — unit tests, integration hooks, edge cases; notes which integration scenarios this component participates in

Each section is written to disk immediately — sessions resume from the next incomplete section.

After all sections, guardrails from `architecture-spec.md` are checked. Any violation blocks the spec until resolved. The developer self-reviews and confirms before build begins.

After self-review, the spec agent updates `specs/integration-scenarios.md` — appending any new cross-component scenarios this component's interface reveals.

---

### Phase 3 — Build {#build}

**Who:** Developer
**Time:** Depends on component complexity
**Output:** Source code committed

The build phase turns the confirmed spec into working code. The dev agent works through the implementation plan in order, within the architecture guardrails. Tests are written alongside code — TDD, not deferred.

Key behaviors:
- Stays within this component's domain boundary
- Respects every guardrail in `architecture-spec.md`
- Secrets and credentials come from environment variables declared in the spec — no literal values in source

---

### Phase 4 — Unit Test {#unit-test}

**Who:** Developer (automated)
**Time:** Minutes
**Output:** `dev-artifact.yaml` with test results

The test agent runs the component's test suite. Hard failures block the pipeline. Flaky tests are flagged without blocking. A component is **technically solid** once it passes.

Multiple components run through this cycle in parallel. A component that passes is ready — the developer moves on. The integration test phase collects them all once every component passes.

---

### Phase 5 — Integration Test {#integration-test}

**Who:** Team Lead (triggers once, automated)
**Time:** Minutes to tens of minutes depending on scenario count
**Output:** `specs/integration-scenarios.md` updated with results

Once every component passes its unit tests, the TL triggers integration testing. The integration test agent reads `architecture-spec.md` and `integration-scenarios.md`, enriches any scenarios that need more concrete assertions, and executes each scenario against the real running system — no mocks.

`specs/integration-scenarios.md` is a **living document**. It was seeded during ideation with the obvious cross-component flows. It grew as each component spec was written, with scenarios contributed by each component's interface. By the time integration testing runs, it reflects the full system's understanding of critical paths.

Results are written back to `integration-scenarios.md` per scenario, and a run summary is appended to the `## Run History` section. This becomes the audit trail of functional health across releases.

The system is **functionally solid** once all scenarios pass.

---

### Phase 6 — Deploy Release {#deploy}

**Who:** Team Lead
**Time:** 5–10 minutes
**Output:** `specs/deploy.sh` + `specs/deploy-artifact.md`

**The deployment gate requires integration tests to pass.** Individual component unit tests are necessary but not sufficient — the system must be functionally solid end-to-end before a release.

The deployment agent:
1. Verifies `integration_tests_passing:true`
2. Computes the next release version from change types in the backlog
3. Resolves deployment order via the dependency graph
4. Backs up the previous `deploy.sh` to `deploy.sh.old`
5. Generates a single `deploy.sh` covering all components
6. Validates the script with `bash -n`
7. Writes `deploy-artifact.md` summarising the release
8. Marks all components deployed and updates `project.release`

Every release deploys the **entire system** — not individual components.

---

## Release Versioning {#versioning}

SpecGantry uses standard X.Y.Z semver. The version is a project-level concept — not per-component.

- Every project starts at `1.0.0`
- The version only changes when a release is deployed
- The bump is computed automatically from the highest-severity change type across all components in the release:

| Change type | Bump | Example |
|---|---|---|
| `project_change` | major | `1.0.0` → `2.0.0` |
| `enhancement` or `new_feature` | minor | `1.0.0` → `1.1.0` |
| `bug_fix` only | patch | `1.0.0` → `1.0.1` |

The initial release always deploys as `1.0.0`.

---

## Roles {#roles}

### Team Lead / Architect

- Runs ideation — the only person who shapes the system
- Manages the backlog via `[P] Project`
- Triggers integration tests once all components pass
- Triggers deployments
- Classifies and routes new work after deployment

### Developer

- Picks components from the backlog
- Writes component specs (triggers domain elaboration on first component of each domain)
- Builds and tests against the spec
- A passing component test signals readiness — integration testing and deployment are TL territory

---

## The Architecture Artifact {#architecture-artifact}

`specs/architecture-spec.md` is the single source of truth for the system. It contains:

- **Vision** — what the system is, who it's for, why it's worth building
- **Problem & Users** — user population, use case, success criteria
- **Constraints** — hard stops that architecture must respect
- **Risks & Out of Scope** — top risks with mitigations, explicit v1 deferral list
- **Tech Stack** — confirmed choices per layer
- **System Boundaries** — top-level components and communication patterns
- **Guardrails** — enforceable rules every component must respect
- **Feature Backlog** — human-readable summary (machine-readable form in `project-state.yaml`)
- **Domain sections** — `## Domain: [name]` sections added just-in-time as each domain's first component is picked up

Component specs **reference** this document rather than duplicating it. This keeps both the architecture and component specs slim.

---

## The Integration Scenarios Document {#integration-scenarios}

`specs/integration-scenarios.md` is a living document that grows through the pipeline:

1. **Seeded during ideation** — obvious end-to-end flows visible from the system boundaries
2. **Extended during component specs** — each component spec contributes scenarios involving its interface
3. **Enriched before integration testing** — the integration test agent adds concrete assertions where needed
4. **Executed during integration testing** — real system, no mocks; results written per scenario
5. **Updated on every run** — `## Run History` section appended, never overwritten

By the time a release deploys, the document is a complete picture of what critical paths the system handles and their test history.

---

## Handling Changes After Deployment {#post-deployment}

Use `[+] New work` at any point to describe new work — bug fix, enhancement, new component, or architectural change. SpecGantry classifies the work, reads the backlog and component specs to determine what's affected, confirms with you, and re-enters the pipeline.

| Type | What happens |
|---|---|
| `bug_fix` | Affected component identified from specs. All phase flags reset — full spec → build → test cycle. Integration tests re-run before next deploy. |
| `enhancement` | Same as bug_fix — spec updated with change annotations. |
| `new_feature` | Ideation agent runs in amendment mode to assign ID, update backlog and architecture spec. Then normal pipeline. |
| `project_change` | Ideation agent runs in amendment mode first. Impacted component specs reset for re-spec. Integration tests reset. |

---

## Session Safety & Resumption

SpecGantry saves progress after every question, every answer, and every section. If a session is interrupted at any point, the next `/spec-gantry` picks up at the next unanswered item. This applies to all phases — ideation, component spec, build, and test.

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically. Token usage is stored in `specs/cost-log.ndjson` and committed to git. Run `[$] Cost` or `/track-cost` for a breakdown by phase, component, release, and model.

<div class="info">
  <strong>Cost data in git:</strong> <code>specs/cost-log.ndjson</code> is committed alongside your specs, giving your whole team shared visibility into AI development costs over the full project lifetime.
</div>

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
      <strong>Reference</strong>
      <span>File structure, security model, design principles, and extension points.</span>
    </div>
  </a>
</div>
