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

On Y: invoke `spec-gantry:orchestrator:orchestrator-agent` with `Action: classify_and_route`, `description: [description]`, `pre_classified: bug_fix`.

On N: `Cancelled.`
