---
layout: docs
title: Reference
description: SpecGantry's design principles, file structure, security model, and extension points.
prev_page: "Skills Guide"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# Reference

Design principles, project file structure, security model, and how to extend SpecGantry.

---

## Design Principles

SpecGantry is built on three principles.

### Structure Before Code

Specs, architecture, and planning happen **before** development begins — enforced, not advisory. SpecGantry verifies that each phase's output exists and is complete before the next phase can start. The intent is to make skipping a phase impossible, not just inconvenient.

### Session Safety by Default

Every phase saves progress after each question or section. If a session is interrupted for any reason — network drop, context reset, end of day — the next invocation resumes at the next unanswered item. Zero progress loss is a design requirement.

### Role-Based Access

Team Leads and Developers have different views and different permissions. SpecGantry enforces this automatically — a developer cannot run project-level phases, and a project-level operation cannot write to files owned by the developer workflow. Role confusion is a common failure mode in collaborative AI workflows; SpecGantry eliminates it structurally.

---

## Project File Structure

After SpecGantry runs, your project contains a `specs/` directory committed to git:

```
specs/
├── project-state.yaml              # Project metadata, component backlog, phase gates, current release version
├── architecture-spec.md            # Single source of truth — vision, constraints, tech stack, guardrails, domain sections
├── integration-scenarios.md        # Living document — cross-component scenarios, assertions, run history
├── cost-log.ndjson                 # Token usage and cost per agent session
├── deploy.sh                       # Generated deployment script (whole system)
├── deploy.sh.old                   # Previous deployment script (backup)
├── deploy-artifact.md              # Deployment validation summary
└── components/
    ├── COMP-001/
    │   ├── state.yaml              # Phase progress flags
    │   ├── component-spec.md       # Five-section component spec (cross-references architecture-spec.md)
    │   ├── dev-artifact.yaml       # Build notes and test results
    │   └── gap-YYYY-MM-DD.md      # Gap spec (written mid-build; deleted after merge)
    └── COMP-002/
        └── ...

.claude/
└── local-state.yaml                # Your role and active components (local, not committed)
```

**Commit `specs/` to git.** This gives your whole team shared visibility into project decisions, component progress, and cost data — with full history and meaningful diffs.

**Don't commit `.claude/local-state.yaml`.** This file is local to each developer's machine and is gitignored by default.

---

## The specs/ Files

### `specs/project-state.yaml`

The project registry. Contains the project name and vision, phase completion status, `backlog_approved` flag, the list of architectural domains, and the full component backlog with each component's status, size, domain, assignee, dependencies, and internal feature list.

### `specs/architecture-spec.md`

The single source of truth for the system. Written during ideation and extended just-in-time as domains are elaborated. Contains vision, constraints, tech stack, system boundaries, guardrails, component backlog summary, and a `## Domain: [name]` section for each domain that has been picked up. Amendment blocks are appended by gap merge — prior content is never overwritten. Component specs reference this document rather than duplicating it.

### `specs/integration-scenarios.md`

A living document. Seeded during ideation with obvious cross-component flows. Extended by each component spec with scenarios involving its interface. Enriched and executed during integration testing. The `## Run History` section grows with every run — it is never overwritten. This document is the audit trail of the system's functional health across releases.

### `specs/components/COMP-NNN/component-spec.md`

A five-section specification for a single component: scope, interface contract (delta from domain section), data (delta from domain data model), features (ordered internal tasks grouped into parallel tiers), and test plan including integration scenario hooks. The spec also contains a Change History table recording every release in which the component changed. A guardrail compliance section must be clean before build begins.

### `specs/components/COMP-NNN/dev-artifact.yaml`

Written by the development agent on completion. Contains: list of features implemented, files modified, commits, any gap specs written, warnings, test results (command, pass/fail counts, coverage, failures, flaky tests), and `overall_status: pass | fail`.

### `specs/components/COMP-NNN/gap-YYYY-MM-DD.md`

Written during development when the spec is discovered to be incomplete, incorrect, or has side-effects on another component. Records what changed, files affected, side-effects on other components, and the recommended spec update. Gap files are deleted automatically after they are merged by the gap-merge step.

### `specs/deploy.sh`

A single deployment script covering the entire system, generated by the deployment agent. Organised by architectural component (database migrations, API service, frontend, etc.) with steps from all components in dependency order. The previous version is backed up to `specs/deploy.sh.old` before each new deployment.

### `specs/deploy-artifact.md`

A deployment validation summary for the most recent release: all components included, deployment order, checks performed, and the release version.

### `specs/cost-log.ndjson`

An append-only record of token usage and cost for every agent session. Each entry includes the phase, component, model, token counts by type, and cost by type. Run `/track-cost` to see this data rendered as a readable breakdown.

---

## Security Model

### Role-Based Access

| Action | Team Lead | Developer |
|--------|-----------|-----------|
| Run ideation | ✅ | ❌ |
| Approve component backlog | ✅ | ❌ |
| Run integration tests | ✅ | ❌ |
| Manage backlog (`[P]` Project) | ✅ | ✅ (view) |
| View architecture spec | ✅ | ✅ (read-only) |
| Write component spec | ✅ | ✅ |
| Build component | ✅ | ✅ |
| Deploy release | ✅ | ❌ |
| View cost data | ✅ | ✅ |

### Secrets Handling

The component spec requires that every secret, API key, and credential used by the component is declared by its environment variable name. The development agent enforces this: no literal credential values in source files. If a violation is detected during build, it is reported immediately and must be resolved before proceeding.

---

## Phase Gates

SpecGantry uses phase gates to ensure each phase is genuinely complete before the next begins. Gates check both the presence of output documents and the content within them. Meeting the criteria is what advances the pipeline — not just saying it's done.

A gate failure tells you exactly what's missing:

```
✗ Development gate FAILED · component spec must be complete · Run /spec-gantry

  Required                                    Status
  ──────────────────────────────────────────────────
  component-spec.md exists                 →  ✓
  All 5 sections present                   →  ✓
  Guardrail compliance section present     →  ✓
  Zero violations                          →  ✗

  Action: Resolve the violation in section 2 (Interface Contract).

  Run /spec-gantry to return to the dashboard.
```

---

## Extension Points

SpecGantry is open source and designed to be extended.

### Custom Guardrails

Add custom rules to the `## Guardrails` section of `architecture-spec.md`. The component-spec agent enforces every guardrail in that section — adding new ones requires no code changes. Examples:

- "All API endpoints must require authentication"
- "No direct database queries from the presentation layer"
- "All external API calls must respect a 5-second timeout"

### Custom Agents

Add domain-specific agents by placing a new agent definition file in the `agents/` directory with standard frontmatter. Custom agents follow the same subagent pattern as built-in phase agents.

### Custom Phase Pipeline

Advanced users can extend the pipeline — for example, inserting a security review phase between spec and build — by adding a new agent and wiring it into the `/spec-gantry` skill routing logic.

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
