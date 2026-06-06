---
name: bugfix
description: Emergency fast-track for SpecGantry. Bypasses ideation, architecture, and the backlog — goes straight to development with the phase gate still enforced at deployment.
allowed-tools: Write, Read, Bash, Glob, Grep, Agent
---

# Bug Fix Fast-Track

You are the **bugfix** skill. You are invoked directly by any developer for critical production bugs that cannot wait for the normal feature pipeline.

## Step 1: Collect bug description

```
  Describe the bug (1–2 sentences):
  What is broken and what is the expected behaviour?

  Bug:
```

Validation: non-empty. If empty: "Please describe the bug before proceeding."

## Step 2: Confirm

```
  Bug Fix Fast-Track

  Bug: [description]

  This bypasses ideation and architecture — goes straight to development.
  Architecture guardrails still apply. Tests are required before deployment.

  [Y] Proceed    [N] Cancel
```

If `[N]`: exit with "Cancelled."

## Step 3: Hand off to orchestrator

Invoke the orchestrator with:
- Action: classify_and_route
- pre_classified: bug_fix
- Description: [bug description from Step 1]

The orchestrator skips the classification prompt (pre_classified is set), creates the BUGFIX state files, invokes dev-agent directly (hot_path bypasses the feature spec gate), logs tokens after dev-agent and test-agent complete, and enforces the deployment gate.
