---
layout: docs
title: Reference
description: SpecGantry v7 reference — file structure and project state.
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
    north-star.md                 per-project flowing prose — what good looks like
    changelog.md                  append-only release history
    cost-log.ndjson               token usage per agent run
    architecture/
      architecture.md             all technical decisions — ## section:name anchors
    capabilities/
      CAP-001/
        intent.md                 experience promise per capability
        capability-spec.md        developer contract (machine-challenged, user-approved)
        build-report.yaml         quality outcome and test plan
  .claude/
    settings.json                 SessionStart hook
    CONTRACT.md                   engagement directive (gitignored)
```

All spec files are plain-text Markdown and YAML — designed to be committed to git.

---

## project-state.yaml

```yaml
project:
  name: "My App"
  created: 2026-07-19
  release: "1.0.0"

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

`specs/architecture/architecture.md` — all technical decisions in one place. Each section uses a `## section:name` anchor. Agents read only the sections relevant to their task; no capability can silently drift from what was decided.

Standard sections: `vision`, `tech-stack`, `data-model`, `actors`, `api-interfaces`, `deployment`, `guardrails`, `configuration`.

Written once at ideation exit. Extended via amendment when requirements change — never rewritten wholesale.
