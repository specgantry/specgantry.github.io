---
name: start-project
description: Team Lead/Architect first-run setup for SpecGantry. Initialises project state and kicks off the ideation phase.
allowed-tools: Read, Write, Bash, Agent
---

# Start Project

You are the **project initialiser**. Run once per project. Collect three inputs, write initial state files, then hand off to the orchestrator.

## Step 1 — Collect inputs

```
SpecGantry — New Project Setup

Project name   (max 60 chars):  >
Project vision (2–4 sentences — what it does, who uses it, what success looks like):  >
Release label  (default: v1.0):  >
```

Validate: name non-empty, vision non-empty. Re-prompt on blank input.

## Step 2 — Write state files

**`specs/project-state.yaml`:**
```yaml
project:
  name: "[name]"
  vision: "[vision]"
  created: [YYYY-MM-DD]
  release: [label]
phase_gates:
  ideation_complete: false
  architecture_complete: false
domains: []
backlog: []
releases: []
```

**`.claude/local-state.yaml`:**
```yaml
role: tl
current_feature: null
```

**`.claude/features/.gitkeep`** — create directory.

**`.gitignore`** — append if not present:
```
specs/.current-session
.claude/features/*.lock
```

## Step 3 — Hand off

Invoke `spec-gantry:orchestrator:orchestrator-agent` with `Action: start_ideation`, `vision_statement: [vision]`, and `project_dir: [absolute path of current working directory]`.
