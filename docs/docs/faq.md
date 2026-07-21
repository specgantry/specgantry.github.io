---
layout: docs
title: FAQ
description: Common questions about SpecGantry — installation, the CWJ loop, costs, and how it fits into an AI-assisted workflow.
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
claude plugin install spec-gantry@spec-gantry
```

Both commands are required. You only need to add the marketplace once.

**How do I update?**

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

**Does it require any external services?**

No. SpecGantry runs entirely inside Claude Code. No npm install, no API keys beyond your existing Anthropic API access, no configuration files. The only network calls are to the Anthropic API and the plugin marketplace on explicit update.

**Does it work on existing codebases?**

Yes. Run `/spec-gantry` in any project directory. If there are source files but no `specs/` folder, a reverse-engineer agent synthesises a north star, architecture, and capability list from the existing code — then you continue from there.

---

## How It Works

**Why challenge before writing? Why not just build and iterate?**

Iteration is expensive when you're iterating on the wrong thing. A missing loading state, an undefined error message, a UX dead end — these aren't bugs you find in the code. They're decisions that were never made. An adversarial challenger surfaces them before anything is written, when they cost nothing to fix.

**What's the difference between this and writing a spec myself and pasting it in?**

A spec you write yourself is unchallenged. SpecGantry's spec phase runs a developer-proxy challenger against the spec before a single line of code is written — asking what a developer would be blocked on building from it. You see the result after a judge has confirmed no blocking gaps remain. You're reviewing a challenged spec, not a first draft.

**Does SpecGantry slow things down?**

The ideation phase has interaction — you answer challenge questions before specs are written. After that, the pipeline is autonomous. You approve each spec once. The code phase is fully automated. Type `[>]` and SpecGantry specs and builds every remaining capability without pausing, stopping only at genuine decision points.

**What happens when something goes wrong mid-build?**

A bug report or new requirement goes through an investigate agent first. It classifies the root cause — code bug, spec gap, requirement drift, or new work — and routes to the right phase. A spec gap sent to the code repair loop will never converge; the spec has to be fixed first. Classification prevents that.

---

## Costs

**How does cost tracking work?**

Token counts are read from each agent's transcript after it completes — exact API values, not estimates. One entry is appended to `specs/cost-log.ndjson` per agent run. Run `/track-cost` to see cost by capability, by phase, and by CWJ step, with outlier flags on capabilities that ran repair cycles.

**Why are costs not recording?**

Cost tracking requires Node.js. Run `node --version` to check. If Node.js is installed but costs still aren't recording:

```bash
SPEC_GANTRY_LOG_LEVEL=debug /spec-gantry
```

Check `~/.claude/logs/spec-gantry-hooks.log` for errors.

---

## General

**Can I use the output with other tools?**

Yes. The build agent writes standard source code with no SpecGantry runtime dependencies. Run, test, and deploy the output with any tool.

**Does SpecGantry work if I start a new Claude Code session mid-project?**

Yes. All progress is written to disk after every answer and phase transition. Run `/spec-gantry` in any new session and it resumes from exactly where you left off.
