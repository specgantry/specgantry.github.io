---
name: bugfix
description: Emergency fast-track for SpecGantry. Bypasses ideation, architecture, and the backlog — goes straight to development with the phase gate still enforced at deployment.
allowed-tools: Read, Write, Agent
---

# Bugfix Fast-Track

Collect bug description:
```
Describe the bug (what's broken, expected vs. actual behaviour):  >
```

Confirm:
```
⚡ Fast-track to development — spec and architecture phases bypassed.
   Tests are required. Deployment gate enforced.
   Proceed? [Y/N]
```

On Y: write BUGFIX-NNN state.yaml (`hot_path:true`, `feature_spec_complete:true`, `spec_reviewed:true`) · set `current_feature: BUGFIX-NNN` in `.claude/local-state.yaml` · invoke `spec-gantry:development:dev-subagent` with `project_dir: [absolute cwd]` · after it returns invoke `spec-gantry:development:test-subagent` with `project_dir: [absolute cwd]` · run `/spec-gantry` to continue.

On N: `Cancelled.`
