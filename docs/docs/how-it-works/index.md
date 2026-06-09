---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry's pipeline, roles, phase gates, release versioning, and cost visibility.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete walkthrough of the pipeline, roles, and what happens at each phase.

---

## The Pipeline at a Glance

SpecGantry enforces a structured development process split across two levels:

```
PROJECT LEVEL ──────────────────────────────────────────────────────
  Phase 1: Ideation     (Team Lead / Architect)
  Phase 2: Architecture (Team Lead / Architect)

  ── Architecture committed to git ──

FEATURE LEVEL (runs in parallel across features) ────────────────────
  Phase 3: Feature Spec   (Developer)
  Phase 4: Build          (Developer)
  Phase 5: Test           (Developer)

  ── All features built and tested ──

RELEASE LEVEL ───────────────────────────────────────────────────────
  Phase 6: Deploy         (Team Lead) — whole system, one release
```

Project-level phases are sequential — ideation must complete before architecture, architecture before any feature work. At the feature level, multiple features run their Spec → Build → Test lifecycle in parallel and independently. Deployment collects them all once every feature passes tests.

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

### Phase 1 — Ideation

**Who:** Team Lead / Architect
**Time:** 10–20 minutes
**Output:** `specs/ideation-artifact.md`

Before any design work begins, SpecGantry helps you validate the problem. The ideation agent asks targeted questions about your project — tailored to your domain and context, not a generic checklist.

The conversation covers the real problem you're solving, your users and scale, existing constraints, the biggest technical risks, and what a successful first release looks like.

After the session, SpecGantry produces a feasibility assessment: **proceed**, **clarify**, or **escalate**. If anything other than proceed, SpecGantry surfaces the specific blockers and holds the pipeline until they're resolved.

---

### Phase 2 — Architecture

**Who:** Team Lead / Architect
**Time:** 20–40 minutes
**Output:** `specs/architecture-spec.md` + feature backlog

With a validated idea, the architecture agent helps you design the system. Questions are derived from your ideation session — your specific tech stack, your boundaries, your risks.

The session produces:
- A system architecture covering tech stack, component boundaries, API contracts, data model, and non-functional requirements
- **Guardrails** — enforceable rules that every feature spec must honor
- A **feature backlog** — the system decomposed into sized, prioritized, dependency-aware features with assignment groups

The architecture agent owns the backlog. It assigns every feature its ID (`FEATURE-NNN`), title, domain, size, dependencies, and assignment group. Developers never manually create or number features.

Once the architecture is committed to git, developers can pull and start picking up features.

---

### Phase 3 — Feature Spec {#spec-gate}

**Who:** Developer
**Time:** 5–15 minutes per feature
**Output:** `specs/features/FEATURE-NNN/feature-spec.md`

No code is written until a complete spec exists.

The feature-spec agent guides the developer through a six-section specification:

1. **Scope** — what it does and explicitly what it doesn't
2. **API / Interface Contract** — endpoints, function signatures, events
3. **Data** — ownership, reads, writes, mapping to the core data model
4. **Implementation Plan** — ordered tasks, each achievable in one session
5. **Test Plan** — unit, integration, edge cases
6. **Non-Functional Considerations** — performance, security, all required environment variable names

Each section is written to disk immediately — sessions resume from the next incomplete section if interrupted.

After all six sections, SpecGantry checks the spec against every architecture guardrail. Any violation blocks the gate until resolved. The developer then self-reviews the completed spec before development begins — this is the final confirmation before build starts.

The spec also contains a **Change History** table. On the initial build this records `1.0.0 — Initial implementation`. Every future change cycle appends a new row with the release version, date, summary, and change type.

---

### Phase 4 — Build

**Who:** Developer
**Time:** Depends on feature complexity
**Output:** Source code

The build phase turns the approved spec into working code. The dev agent works through the implementation plan in order, staying within the architecture guardrails.

Key behaviors:
- Architecture guardrails apply throughout — conflicts are surfaced and stopped, not silently worked around
- Secrets and credentials must come from environment variables declared in the spec — no literal values in source files
- Tests are written alongside code

---

### Phase 5 — Test

**Who:** Developer (automated)
**Time:** Minutes
**Output:** Test results in `dev-artifact.yaml`

The test agent runs the full test suite. If any tests fail, it runs once more — this distinguishes hard failures from flaky tests. Hard failures block the pipeline. Flaky tests are flagged without blocking.

The developer is done once tests pass — the feature is removed from the active list and the TL is notified it is ready.

---

### Phase 6 — Deploy Release {#deploy}

**Who:** Team Lead
**Time:** 5–10 minutes
**Output:** `specs/deploy.sh` + `specs/deploy-artifact.md`

**The deployment gate requires all features to have passing tests before a release.** This is enforced — a single feature that hasn't passed tests blocks the entire deployment.

The deployment agent:
1. Verifies every feature has `overall_status: pass` in its dev artifact
2. Computes the next release version automatically from the change types in the backlog
3. Resolves deployment order via dependency graph
4. Backs up the previous `deploy.sh` to `deploy.sh.old`
5. Generates a single `deploy.sh` covering all features, organised by architectural component
6. Validates the script with `bash -n`
7. Writes `deploy-artifact.md` summarising the release
8. Marks all features deployed and updates `project.release`

Every release deploys the **entire system** — not individual features. This is intentional: cloud infrastructure (containers, serverless, etc.) must be packaged and deployed as a coherent unit.

---

## Release Versioning {#versioning}

SpecGantry uses standard X.Y.Z semver. The version is a project-level concept — not per-feature.

- Every project starts at `1.0.0`
- The version only changes when a release is deployed
- The bump is computed automatically from the highest-severity change type across all features in the release:

| Change type | Bump | Example |
|---|---|---|
| `project_change` | major | `1.0.0` → `2.0.0` |
| `enhancement` or `new_feature` | minor | `1.0.0` → `1.1.0` |
| `bug_fix` only | patch | `1.0.0` → `1.0.1` |

The initial release always deploys as `1.0.0` — no bump is applied.

---

## Roles {#roles}

### Team Lead / Architect

**Responsibilities:**
- Lead Ideation and Architecture sessions
- Manage the backlog via `[P] Project`
- Trigger deployments — the only role that can run `deploy_release`
- Classify and route new work after deployment
- View cost breakdown

### Developer

**Responsibilities:**
- Pick features from the backlog
- Write feature specs
- Build and test against the spec
- Signal readiness — tests passing clears the feature for TL to deploy

---

## Handling Changes After Deployment {#post-deployment}

When all features are deployed, SpecGantry enters post-deployment mode and asks what you want to work on next. The TL describes the work; SpecGantry does the analysis.

### How classify_and_route works

1. **Classify** the type: `bug_fix`, `enhancement`, `new_feature`, or `project_change`
2. **Map to features** — SpecGantry reads the backlog and all feature specs to determine which existing features are affected, or what new feature needs creating. The TL does not need to specify this — SpecGantry derives it from the specs
3. **Confirm** — presents the mapping for TL approval
4. **Route** — resets all phase flags on affected features and re-enters the pipeline

| Type | What happens |
|---|---|
| `bug_fix` | Target feature identified from specs. All phase flags reset — full spec → build → test cycle. |
| `enhancement` | Same as bug_fix — spec updated with change annotations, rebuilt, retested. |
| `new_feature` | Architecture agent runs in amendment mode to assign FEATURE-NNN, update backlog. Then normal pipeline. |
| `project_change` | Architecture agent runs first. Impacted feature specs marked for re-spec. |

For `bug_fix` and `enhancement`, the feature spec is updated inline — changed lines are annotated with `` `__[release]__` `` and old text is struck through. A new row is appended to the spec's Change History table.

---

## Session Safety & Resumption

SpecGantry saves progress after every question and every section. If a session is interrupted at any point, the next `/spec-gantry` picks up at the next unanswered item. This applies to all phases — ideation, architecture, and feature spec.

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically — no manual steps required. Token usage is stored in `specs/cost-log.ndjson` alongside your other project files and committed to git.

Run `[$] Cost` from the action bar — or `/track-cost` directly — for a navigable cost dashboard with four views:

- **Summary** (default) — spend by phase for the current release
- **By Feature** — total spend per feature across all phases
- **By Release** — cumulative spend per deployed release, full project history
- **By Model** — spend by model tier, most expensive first

Pricing rates are fetched automatically from Anthropic's pricing page on startup. Token counts are exact API values — not estimates.

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
