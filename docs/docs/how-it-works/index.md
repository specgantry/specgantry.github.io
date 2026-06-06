---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry's five-phase pipeline, roles, phase gates, and cost visibility.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete walkthrough of the pipeline, roles, and what happens at each phase.

---

## The Pipeline at a Glance

SpecGantry enforces a five-phase development process split across two levels:

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

Each phase must be fully complete before the next begins. SpecGantry verifies this automatically — you can't skip ahead.

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

Before any design work begins, SpecGantry helps you validate the problem. The ideation agent asks targeted questions about your project — tailored to your domain and context, not a generic checklist.

The conversation covers the real problem you're solving, your users and scale, existing constraints, the biggest technical risks, and what a successful first release looks like.

After the session, SpecGantry produces a feasibility assessment with a clear recommendation: proceed, clarify, or escalate. If the recommendation is anything other than **proceed**, SpecGantry surfaces the specific blockers and holds the pipeline until they're resolved. Architecture cannot begin on an unvalidated idea.

---

### Phase 2 — Architecture

**Who:** Team Lead / Architect  
**Time:** 20–40 minutes  
**Output:** `specs/architecture-spec.md` + feature backlog

With a validated idea in hand, the architecture agent helps you design the system. Questions are derived from your ideation session — your specific tech stack, your boundaries, your risks.

The session produces:
- A system architecture covering your tech stack, component boundaries, API contracts, data model, and non-functional requirements
- **Guardrails** — enforceable rules that every feature spec must honor
- A **feature backlog** — the system decomposed into sized, prioritized, dependency-aware features ready to assign

Once the architecture is committed to git, developers can pull it and start picking up features.

---

### Phase 3 — Feature Spec {#spec-gate}

**Who:** Developer  
**Time:** 5–15 minutes per feature  
**Output:** `specs/features/FEATURE-XXX/feature-spec.md`

This is the most important gate in the system. No code is written until a complete, reviewed spec exists.

The feature-spec agent guides the developer through a six-section specification covering scope, API contracts, data ownership, an ordered implementation plan, a test plan, and non-functional requirements including security and credentials. Each section is written to disk as it's completed — if the session is interrupted, it resumes from the next unanswered section.

When all six sections are done, SpecGantry automatically checks the spec against every guardrail in the architecture. Any violation is named specifically and blocks the gate until resolved. After the guardrail check passes, the developer confirms they can build the spec as written — that self-review is the final gate before development begins.

Before any build starts, SpecGantry also checks for API contract conflicts across all feature specs — if two features define the same endpoint differently, both are flagged and held until resolved.

---

### Phase 4 — Build

**Who:** Developer  
**Time:** Depends on feature complexity  
**Output:** Source code + test results

The build phase turns the approved spec into working code. SpecGantry's build agent works through the implementation plan in order, staying within the architecture boundaries established in Phase 2.

Key behaviors:
- Architecture guardrails apply throughout — if a conflict arises during implementation, the agent stops and reports it rather than working around it silently
- Secrets and credentials must come from environment variables — the spec names them, the build agent enforces them
- Tests are written alongside code, not after

When implementation is complete, SpecGantry runs the full test suite. If any tests fail, they run a second time automatically — this pass distinguishes genuine failures from non-deterministic tests. Tests that fail consistently block deployment. Tests that are inconsistent are flagged for your attention without blocking the pipeline.

---

### Phase 5 — Deploy

**Who:** Team Lead (or Developer with permission)  
**Time:** 5–10 minutes  
**Output:** Deployment script + validation summary

Before generating anything, SpecGantry runs two hard checks: all tests must be passing, and all feature dependencies must already be deployed. If either check fails, the agent names exactly what's missing and stops.

Once both checks pass, SpecGantry generates a concrete deployment script tailored to this feature — based on what was built and what the implementation plan specified. Each step is either a runnable command or a clearly marked manual action. The script is validated for correctness before being written to disk.

On completion, the feature is marked complete and the dashboard progress count updates.

---

## Roles {#roles}

### Team Lead / Architect

The Team Lead owns the project-level phases and the overall pipeline.

**Responsibilities:**
- Lead the Ideation and Architecture sessions
- Review feature specs in progress and flag concerns
- Manage the backlog — prioritize, assign, defer, reassign
- Deploy completed features
- View the full cost breakdown across the project

**Dashboard view:** All features and their pipeline status, specs awaiting attention, any open architecture questions, and cost data.

---

### Developer

Developers own feature-level work and operate within the architecture the Team Lead defined.

**Responsibilities:**
- Pick features from the backlog
- Write feature specs
- Build and test against the spec
- Request deployment from the Team Lead

**Dashboard view:** Their assigned features, unassigned features available to pick up, and the architecture spec (read-only for reference while writing specs).

---

## Session Safety & Resumption

SpecGantry saves your progress after every question and every section. This is unconditional — not just "most of the time."

> **If a session is interrupted at any point, the next `/spec-gantry` picks up at the next unanswered question.**

This applies to all phases: if you complete 3 of 5 ideation topics before context resets, the next session starts at topic 4. If you complete 4 of 6 spec sections before a network drop, the next session resumes at section 5.

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent session automatically. When any agent finishes, token usage is captured and stored in `specs/cost-log.json` alongside your other project files.

Token counts are the exact values from the API — not estimates. All four token types are recorded separately (input, output, cache write, cache read) because each is billed at a different rate and each tells a different story about where time and money are being spent.

The dashboard shows a per-feature cost alongside each pipeline row. Run `/track-cost` for a full breakdown by phase and feature, with each cost component in its own column. This makes it immediately visible when cache costs are dominating — which is common for agents working with large codebases or long conversations.

Run `/update-pricing` to ensure the rates used for cost calculations are current.

<div class="info">
  <strong>Cost data in git:</strong> <code>specs/cost-log.json</code> is committed alongside your specs, giving your whole team shared visibility into AI development costs over time.
</div>

---

## Feature Dependencies

The architecture phase can establish dependencies between features. A feature with unmet dependencies cannot be started — even at the spec phase — until every dependency is deployed.

The dashboard shows blocked features with a `🔴` indicator and lists exactly which dependencies are still outstanding, so the team can sequence work effectively.

---

## Versioned Features (Enhancements)

When a completed feature needs meaningful changes, SpecGantry preserves the original rather than overwriting it. The original spec and development artifacts are archived, and a new version of the feature goes through the full spec cycle with current guardrails.

The dashboard shows the active version alongside the collapsed original, labelled as archived. Only active features count toward the progress total. The full history remains on disk and in git.

---

## Post-Completion: What Comes Next

When all features are deployed, SpecGantry doesn't stop — it asks what you want to work on next. Whatever you describe, SpecGantry classifies it and confirms before creating anything:

| Type | When it applies |
|---|---|
| **Bug fix** | Something that was working is now broken — goes straight to development |
| **Enhancement** | An existing feature needs to do more or work differently — creates a new versioned spec cycle |
| **New feature** | A net-new capability — goes through the full feature pipeline, with architecture amendment if needed |
| **Project change** | Infrastructure, data model, or cross-cutting scope — always goes through architecture first, affected specs require re-review |

SpecGantry defaults to the more conservative classification when a description is ambiguous, and always confirms its decision with you before proceeding.

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
