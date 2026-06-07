---
name: reverse-engineer
description: Reverse-engineers an existing codebase into a full SpecGantry project structure — architecture spec, ideation artifact, and feature backlog derived from the actual code.
allowed-tools: Read, Write, Bash, Agent
---

# Reverse Engineer

Confirm the working directory:
```
Analysing codebase at: [cwd]
Project name (leave blank to infer from repo):  >
Release label (default: v1.0):  >
Proceed? [Y/N]
```

On N: `Cancelled.`

On Y: invoke `spec-gantry:reverse-engineer:reverse-engineer-subagent` with `project_name: [name or blank]`, `release_label: [label]`, `project_dir: [absolute cwd]`. After it returns, run `/spec-gantry` to continue.
