---
layout: docs
title: Reference
description: SpecGantry v7 reference — file structure, project state, design principles, and extension points.
permalink: /docs/architecture/
prev_page: "Skills & Agents"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# SpecGantry v7 Reference

File structure, project state, design principles, and extension points.

---

## Design Principles

**1. Challenge before you write.**  
Nothing is written or built until an adversarial challenger has asked what would block the next phase. This is not a compliance check — it is a genuine adversarial stance. The challenger's job is to find gaps, not to confirm correctness.

**2. The right thing gets fixed.**  
When something is wrong, the investigate agent classifies the root cause before routing. A spec gap sent to the code loop produces another iteration of the wrong repair. Diagnostic classification ensures the right phase is re-entered.

**3. Quality at the earliest possible moment.**  
A thin spec produces bad code regardless of how many code repair cycles you run. The CWJ loop catches gaps at ideation (before specs are written), at spec (before code is written), and at code (before shipping). Each phase's challenger is independent of what any write agent produced — it challenges afresh.

**4. Session safety over throughput.**  
All progress is written to disk after every answer and every phase transition. A crash mid-session loses at most one in-progress answer. Everything confirmed before that is on disk and the pipeline resumes exactly where it left off.

---

## File Structure

```
project-root/
  specs/
    project-state.yaml            pipeline state and capability flags
    north-star.md                 per-project flowing prose cognitive contract
    changelog.md                  append-only release history (created after 1.0.0)
    cost-log.ndjson               token usage per agent run (committed to git)
    architecture/
      architecture.md             all technical decisions — ## section:name anchors
                                  (vision, tech-stack, data-model, actors,
                                   api-interfaces, deployment, guardrails, configuration)
    capabilities/
      CAP-001/
        intent.md                 2 paragraphs: experience promise + done/failure/edges
        capability-spec.md        developer contract: criteria, interfaces, state, layout, data
        build-report.yaml         overall_status, quality block, runtime info, test_plan
  .claude/
    settings.json                 SessionStart hook
    hooks/spec-gantry-contract.sh contract injection script
    CONTRACT.md                   binding directive (gitignored)
    CLAUDE.md                     spec-gantry-notice prepended at project init
```

---

## Project State — project-state.yaml

SpecGantry tracks pipeline progress in `specs/project-state.yaml`. You can read this file at any time to understand where your project is.

Key fields:

```yaml
project:
  name: "My App"
  created: 2026-07-19
  release: "1.0.0"
  next_release_type: null          # patch | minor | major

ideation_complete: false           # true after ideation exits
auto_continue: false               # true when [>] is active

capabilities:
  CAP-001:
    title: "Recipe management"
    spec_done: false               # true after user approves spec
    built: false                   # true after code phase exits
    deployed: false                # true after deploy
    depends_on: []
```

**CWJ loop configuration** — adjustable per project:

```yaml
cwj_loop:
  max_iterations:
    ideation: 5
    spec: 3
    code: 3
```

Raise or lower these to control how many challenge cycles run before the pipeline surfaces unresolved gaps to you.

---

## The Architecture File

`specs/architecture/architecture.md` contains all technical decisions in a single file. Each section uses a `## section:name` anchor so agents and developers can navigate directly to what they need:

```markdown
# Architecture

## section:vision
One sentence. What the system is.

## section:tech-stack
Every layer decided: language, runtime, framework, database, libraries.

## section:data-model
Every entity: name, key fields, owner, lifecycle.

## section:actors
Every user type and system actor: name, capabilities, data ownership.

## section:api-interfaces
Every endpoint: method + path, auth, request shape, response shape, error codes.

## section:deployment
Platform, container registry, scaling, secrets strategy, CI/CD.

## section:guardrails
Source layout, config location, secrets handling, build output, runtime storage.

## section:configuration
Every environment variable: name, description, example value.
```

The architecture file is written once at ideation exit and extended via amendment when requirements drift. Spec write and build agents read only the sections relevant to the capability they're working on — not the full file.

---

## Code Anchor Schema

Every source file touched by the build or reverse-engineer agent gets one-line anchor comments. These let the investigate agent navigate the codebase without loading full files:

| Anchor | Where | Example |
|---|---|---|
| `@capability` | Top of file | `// @capability CAP-002 \| job posting` |
| `@intent` | After `@capability` | `// @intent allows a company to create and publish a job listing` |
| `@entry` | Above each route handler | `// @entry POST /api/jobs \| create job listing` |
| `@contract` | Above cross-layer functions | `// @contract input: {...} → output: {...} \| errors: [422,500]` |

These anchors are machine-readable comments — no runtime dependencies, safe to commit.

---

## Extension Points

**Custom guardrails** — edit `## section:guardrails` in `specs/architecture/architecture.md`. Every build agent reads guardrails before writing code. Changes take effect on the next build.

**CWJ loop configuration** — edit `cwj_loop.max_iterations` in `project-state.yaml` to adjust how many challenge cycles each phase runs before capping and surfacing gaps to you.

**Custom deployment platforms** — the deployment agent supports GCP Cloud Run, AWS ECS/Fargate, Azure Container Apps, and Docker Compose. The deployment configuration in `## section:deployment` drives the generated `deploy.sh`.

---

## Security Model

**Secrets** — never hardcoded. Every secret is an environment variable named in `## section:configuration`. The build agent uses these names exactly. `.env.example` is generated automatically at deploy time with safe placeholder values.

**Source annotations** — `@capability`, `@intent`, `@entry`, `@contract` anchors written by the build and reverse-engineer agents contain no runtime secrets. They are safe to commit.

**CONTRACT.md** — the engagement directive injected at session start is gitignored by default. It contains no secrets — only instructions for Claude.
