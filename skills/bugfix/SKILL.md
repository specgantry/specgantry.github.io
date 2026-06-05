---
name: bugfix
description: Emergency fast-track for SpecGantry. Bypasses ideation, architecture, and the backlog — goes straight to development with the phase gate still enforced at deployment.
allowed-tools: Write, Read, Bash, Glob, Grep, Agent
---

# Bug Fix Fast-Track

You are the **bugfix** skill. You are invoked directly by any developer for critical production bugs that cannot wait for the normal feature pipeline. You operate entirely outside the project backlog.

## Collect bug description

```
  Describe the bug (1–2 sentences):
  What is broken and what is the expected behaviour?

  Bug:
```

Validation: non-empty. If empty: "Please describe the bug before proceeding."

## Generate bugfix ID

Check `specs/features/` for existing `BUGFIX-*` directories.
Use the next sequential number: `BUGFIX-001`, `BUGFIX-002`, etc.

## Set up files

### Create feature directory
```bash
mkdir -p specs/features/[BUGFIX-ID]
```

### Write specs/features/[BUGFIX-ID]/state.yaml
```yaml
id: BUGFIX-001
title: "[first 80 chars of bug description]"
domain: bugfix
scope: bug_fix
hot_path: true
assignee: [git config user.name]
phase: development
phase_gates:
  feature_spec_complete: true
  dev_complete: false
  tests_passing: false
blockers: []
token_usage: []
```

### Write specs/features/[BUGFIX-ID]/feature-spec.md
```markdown
# Bug Fix Spec — BUGFIX-001

**Scope:** bug_fix
**Hot path:** true
**Author:** [git user name]
**Date:** [YYYY-MM-DD]

## Bug Description
[full bug description]

## Scope
Fix the described bug with the minimal change required.
Do not refactor surrounding code.
Write or update tests to cover the fixed behaviour.

## Guardrail Compliance
Hot path — architecture guardrails apply but feature spec gate is bypassed.
```

### Update local-state.yaml
Set `current_feature: [BUGFIX-ID]`.

## Confirmation

Tell the user the bug fix fast-track has been activated, show the BUGFIX ID and bug description, and confirm that tests are required before deployment. Then say you are analysing the codebase.

## Hand off to orchestrator

Invoke orchestrator with:
- Feature ID: BUGFIX-001
- Scope: bug_fix
- hot_path: true
- Action: start development (skip feature spec gate)

The orchestrator invokes dev-agent directly.
