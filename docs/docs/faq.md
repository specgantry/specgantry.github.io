---
layout: docs
title: FAQ
description: Common questions about SpecGantry — installation, the CWJ loop, costs, and troubleshooting.
permalink: /docs/faq/
prev_page: "Reference"
prev_page_url: "/docs/architecture"
---

# FAQ

---

## Installation

**How do I install SpecGantry?**

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Both commands are required in order. You only need to add the marketplace once.

**How do I update?**

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

**Does it require git?**

No, but it's strongly recommended. All specs are plain-text YAML and Markdown designed to be committed.

**Does it work offline?**

Yes. All agents run locally within Claude Code. The only network calls are to the Anthropic API and the plugin marketplace (only on explicit update).

---

## The CWJ Loop

**What is the CWJ loop?**

Challenge-Write-Judge. Every phase runs: a challenge agent asks what would block the next phase → a write/build agent resolves the challenges → a judge agent asks "would the next phase still be blocked?" CLEAR exits. BLOCKED continues.

**What happens when the loop caps?**

Unresolved gaps are surfaced to you: `[Y] Accept and continue · [E] Fix manually · [X] Stop`. Accepting continues the pipeline with known gaps noted in the build report.

**What is CYCLING?**

If the judge finds identical blocking gaps across two consecutive cycles, the orchestrator exits with the same options as CAPPED.

**How many iterations does each phase run?**

Default: ideation 5, spec 3, code 3. Configurable in `project-state.yaml` under `cwj_loop.max_iterations`.

---

## Spec Phase

**What does "machine-challenged" mean?**

The spec judge confirmed a developer could build this without inventing any answer before surfacing the spec for your approval. You're reviewing a challenged spec — not a first draft.

**Can I edit the spec after the judge approves?**

Yes. Type `[E]` at the approval prompt. Your edit is prepended as a new challenge and the write agent resolves it before re-surfacing.

**Why is there an 80-line limit on specs?**

Specs are developer contracts, not documentation. The architecture file provides shared context. If a spec substantially exceeds 80 lines, it's flagged — not blocked.

---

## Code Phase

**Why doesn't the code challenge run on iteration 1?**

Nothing has been built yet. The loop skips directly to plan + build on iteration 1, then the challenge fires after the first build.

**What is a spec-classified gap?**

When the code challenge agent finds that the north star requires something the spec never captured, it routes to the spec phase first — fixing the spec, then rebuilding. Running code repairs on a spec-level gap never converges.

**What does `quality: capped` in build-report.yaml mean?**

Maximum iterations reached with unresolved gaps. The capability is marked built; the deployment agent surfaces a non-blocking warning.

---

## State and Progress

**How does session resume work?**

All progress is saved after every answer and every phase transition. On resume, SpecGantry reads `project-state.yaml` and continues from exactly where it left off.

**How does auto-continue work?**

Type `[>]`. The pipeline runs without pausing at spec approvals — a judge-validated spec is auto-approved. Stops at: spec gaps, arch gaps, loop caps, all capabilities built, subagent errors.

---

## Costs

**How does cost tracking work?**

The `SubagentStop` hook fires when each agent completes. Token counts are read from the agent transcript — exact API values. One entry appended to `specs/cost-log.ndjson` per agent run.

**Why are costs not recording?**

Cost tracking requires Node.js. Check: `node --version`. If Node.js is installed but costs still aren't recording:

```bash
SPEC_GANTRY_LOG_LEVEL=debug /spec-gantry
```

Check `~/.claude/logs/spec-gantry-hooks.log` for errors.

---

## Advanced

**What is v7 vs v6?**

v7 replaces the Plan-Produce-Evaluate loop with Challenge-Write-Judge. The key shift: PPE asked "did produce follow the plan?" — a compliance check. CWJ asks "would the next phase be blocked?" — a cognitive check. The north star moves from a fixed template to one per-project document written from the actual idea.

**How do I migrate a v6 project?**

Run `/spec-gantry` in your v6 project directory. The reverse-engineer agent detects the existing `specs/stories/` structure and synthesises a v7 project structure from the existing files.

**Can I use SpecGantry with other tools?**

Yes. SpecGantry manages the pipeline and specs. The build agent writes standard source code with no SpecGantry runtime dependencies — run, test, and deploy the output with any tool.
