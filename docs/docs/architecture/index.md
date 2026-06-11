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
| Run integration tests (optional) | ✅ | ❌ |
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

## Pipeline Flow

How state, gates, and subagents connect across the full lifecycle:

<div class="dg-wrap">
<div class="dg-diagram-title">Full pipeline state flow</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-neutral" style="justify-content:center;font-family:var(--font-mono);font-weight:700;color:var(--blue-700);border-color:var(--blue-400);background:rgba(37,99,235,.06)">
    <div>/spec-gantry invoked</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— or init if no project found</span></div>
      <div class="dg-flow-node-desc">Collect name + vision → write project-state.yaml · architecture-spec.md</div>
      <div class="dg-flow-node-meta">Sets: ideation_complete · architecture_complete</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-shield-check"></i> TL</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> ideation_complete + architecture_complete</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-ideation" style="opacity:.85">
    <div class="dg-flow-node-icon"><i class="bi bi-card-checklist"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Backlog Approval</div>
      <div class="dg-flow-node-desc">TL reviews component list · [Y] approve · [E] edit · [X] hold</div>
      <div class="dg-flow-node-meta">Sets: backlog_approved:true</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-shield-check"></i> TL</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> backlog_approved</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-text"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Component Loop <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— one subagent per component, topological order</span></div>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
        <div style="flex:1;min-width:150px;background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.25);border-radius:6px;padding:8px 10px">
          <div style="font-size:.75rem;font-weight:700;color:var(--slate-700);margin-bottom:2px">Component Spec</div>
          <div style="font-size:.68rem;color:var(--slate-500);font-family:var(--font-mono)">Sets: spec_complete</div>
        </div>
        <div style="display:flex;align-items:center;color:var(--slate-300);font-size:.9rem">→</div>
        <div style="flex:1;min-width:150px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.25);border-radius:6px;padding:8px 10px">
          <div style="font-size:.75rem;font-weight:700;color:var(--slate-700);margin-bottom:2px">Development (TDD)</div>
          <div style="font-size:.68rem;color:var(--slate-500);font-family:var(--font-mono)">Sets: dev_complete · tests_passing</div>
        </div>
      </div>
      <div class="dg-flow-node-meta" style="margin-top:6px">gap-*.md written if spec diverges from build</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-code-slash"></i> Devs</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> all components tests_passing</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-decision">
    <div class="dg-flow-node-icon"><i class="bi bi-signpost-split"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">confirm_integration <span style="font-weight:400;font-size:.75rem;color:var(--slate-400)">— TL decision point</span></div>
      <div class="dg-flow-node-desc"><strong>Step 1 (if gaps exist):</strong> Show gap list → [Y] run gap-merge subagent → summary shown<br><strong>Step 2:</strong> [Y] run integration tests · [S] skip → deploy · [X] hold</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-shield-check"></i> TL</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-fork" style="max-width:520px;margin:0 auto">
    <div class="dg-fork-branch">
      <div class="dg-fork-label"><i class="bi bi-check-lg"></i> [Y] Run tests</div>
      <div class="dg-flow-node dg-integration" style="width:100%">
        <div class="dg-flow-node-icon"><i class="bi bi-diagram-3"></i></div>
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Integration Test</div>
          <div class="dg-flow-node-desc">Real system · no mocks · results per scenario</div>
          <div class="dg-flow-node-meta">Sets: integration_tests_passing</div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;padding-top:28px;color:var(--slate-300);font-size:.8rem">│</div>
    <div class="dg-fork-branch">
      <div class="dg-fork-label"><i class="bi bi-skip-forward"></i> [S] Skip</div>
      <div class="dg-flow-node dg-neutral" style="width:100%">
        <div class="dg-flow-node-icon"><i class="bi bi-clipboard-check"></i></div>
        <div class="dg-flow-node-body">
          <div class="dg-flow-node-title">Skip Integration</div>
          <div class="dg-flow-node-desc">TL decision audited in project-state.yaml</div>
          <div class="dg-flow-node-meta">Sets: integration_skipped:true</div>
        </div>
      </div>
    </div>
  </div>

  <div class="dg-fork-join-line"></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> integration_tests_passing OR integration_skipped</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">deploy_release</div>
      <div class="dg-flow-node-desc">Deployment subagent → deploy.sh → chmod +x → deploy-artifact.md</div>
      <div class="dg-flow-node-meta">Sets: deployment_status:complete · project.release bumped</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-shield-check"></i> TL</div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral">
    <div class="dg-flow-node-icon"><i class="bi bi-arrow-repeat"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Post-deployment</div>
      <div class="dg-flow-node-desc">[+] New work → classify_and_route → re-enters component loop</div>
    </div>
    <div style="font-size:.7rem;color:var(--slate-400);white-space:nowrap;margin-left:auto;padding-left:8px"><i class="bi bi-shield-check"></i> TL</div>
  </div>

</div>
</div>

**State flags that gate each transition:**

| Transition | Flag set | Flag read by next gate |
|---|---|---|
| Ideation → Backlog approval | `ideation_complete`, `architecture_complete` | `approve_backlog` |
| Backlog approval → Spec | `backlog_approved` | `spec_all_components` |
| Spec → Build | `spec_complete` (per component) · `spec_phase_complete` | `build_all_components` |
| Build → confirm_integration | `dev_complete`, `tests_passing` (per component) | `confirm_integration` |
| Gaps merged | gap-*.md files deleted from disk (no flag — orchestrator re-scans) | `merge_gap_specs` verify |
| Integration tests run | `integration_tests_passing` | `deploy_release` gate |
| Integration skipped | `integration_skipped` | `deploy_release` gate |
| Deploy | `deployment_status:complete` (per component) | routing row 9 |

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
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Answers to common questions about installation, roles, pipeline phases, costs, and troubleshooting.</span>
    </div>
  </a>
  <a href="/docs/getting-started" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div>
      <strong>Getting Started</strong>
      <span>Install and run your first session in under 5 minutes.</span>
    </div>
  </a>
</div>
