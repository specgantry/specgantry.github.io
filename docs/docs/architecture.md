---
layout: docs
title: Reference
description: SpecGantry v7 reference — file structure, project state, and extension points.
permalink: /docs/architecture/
prev_page: "Skills & Agents"
prev_page_url: "/docs/skills"
next_page: "FAQ"
next_page_url: "/docs/faq"
---

# Reference

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
    capabilities/
      CAP-001/
        intent.md                 2 paragraphs: experience promise + done/failure/edges
        capability-spec.md        developer contract: criteria, interfaces, state, layout
        build-report.yaml         overall_status, quality block, runtime info, test_plan
  .claude/
    settings.json                 SessionStart hook
    hooks/spec-gantry-contract.sh contract injection script
    CONTRACT.md                   binding directive (gitignored)
```

---

## project-state.yaml

```yaml
project:
  name: "My App"
  created: 2026-07-19
  release: "1.0.0"
  next_release_type: null          # patch | minor | major

ideation_complete: false
auto_continue: false

capabilities:
  CAP-001:
    title: "Recipe management"
    spec_done: false
    built: false
    deployed: false
    depends_on: []

cwj_loop:
  max_iterations:
    ideation: 5
    spec: 3
    code: 3
```

---

## The Architecture File

`specs/architecture/architecture.md` — all technical decisions in one file. Each section uses a `## section:name` anchor. Agents read only the sections relevant to their task.

```markdown
## section:vision
## section:tech-stack
## section:data-model
## section:actors
## section:api-interfaces
## section:deployment
## section:guardrails
## section:configuration
```

Written once at ideation exit. Extended via amendment when requirements drift.

---

## Code Anchor Schema

Every source file touched by the build agent gets one-line anchor comments for navigation:

| Anchor | Where | Example |
|---|---|---|
| `@capability` | Top of file | `// @capability CAP-002 \| job posting` |
| `@intent` | After `@capability` | `// @intent allows a company to create and publish a job listing` |
| `@entry` | Above each route handler | `// @entry POST /api/jobs \| create job listing` |
| `@contract` | Above cross-layer functions | `// @contract input: {...} → output: {...} \| errors: [422,500]` |

No runtime dependencies. Safe to commit.

---

## Extension Points

**Custom guardrails** — edit `## section:guardrails` in `architecture.md`. Every build agent reads guardrails before writing code.

**CWJ loop limits** — edit `cwj_loop.max_iterations` in `project-state.yaml`. Controls how many challenge cycles run before capping and surfacing gaps to you.

**Deployment target** — the `## section:deployment` section drives the generated `deploy.sh`. Supports GCP Cloud Run, AWS ECS/Fargate, Azure Container Apps, and Docker Compose.

---

## Design Principles

**Challenge before you write.** Nothing is written or built until an adversarial challenger has asked what would block the next phase. Not a compliance check — a genuine adversarial stance.

**Fix the right thing.** When something is wrong, the investigate agent classifies the root cause before routing. The right phase gets fixed — not always code.

**Session safety over throughput.** All progress is written to disk after every answer and every phase transition. A crash mid-session loses at most one in-progress answer.
