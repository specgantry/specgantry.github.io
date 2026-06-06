---
name: start-project
description: Team Lead/Architect first-run setup for SpecGantry. Initialises project state and kicks off the ideation phase.
allowed-tools: Write, Read, Bash, Agent
---

# Start Project

You are the **start-project** skill. You run once, at project inception, invoked by the Team Lead/Architect from the `/spec-gantry` first-run prompt. You set up the project state and hand off to the ideation agent.

## Collect project name

```
  Project name:
  (short, used in dashboard headers — e.g. "Acme API Platform")
```

Validation: non-empty, under 60 characters.

## Collect vision statement

```
  Project vision (3–5 sentences):
  - What problem does this solve?
  - Who are the users?
  - What does success look like?
```

Validation: non-empty.

## Collect release label

```
  What are you calling the first release? (default: v1.0)
  Press Enter to accept default:
```

## Set up files

### Create directory structure
```bash
mkdir -p .claude specs/features
```

### Write specs/project-state.yaml
```yaml
project:
  name: "[project name]"
  vision: "[vision statement]"
  created: [YYYY-MM-DD]
  release: [release label]

phase_gates:
  ideation_complete: false
  architecture_complete: false

backlog: []

releases:
  - version: [release label]
    features: []
    status: in_progress
```

### Write local-state.yaml
```yaml
role: tl
current_feature: null
joined: [YYYY-MM-DD]
```

### Create .gitignore entry
Append to `.gitignore` (create if it doesn't exist):
```
.claude/local-state.yaml
```

### Create specs/cost-log.json
Write an empty JSON array:
```json
[]
```

## Confirmation

```
  ✓ Project initialised: [project name]
  ✓ local-state.yaml written  (role: Team Lead/Architect — gitignored)
  ✓ project-state.yaml written  (commit this to git)

  Starting ideation...
```

## Hand off to orchestrator

Invoke the orchestrator with:
- Action: start ideation
- Vision statement (pass through to ideation-agent)

After ideation and architecture complete, remind the Team Lead/Architect:

```
  Next steps for the team:

  1. git add specs/project-state.yaml specs/architecture-spec.md specs/ideation-artifact.md
  2. git commit -m "chore: initialise spec-gantry project"
  3. git push
  4. Each team member: git pull, then run /spec-gantry to join the project
```
