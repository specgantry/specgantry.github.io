# SpecGantry

AI-powered SDLC pipeline for Claude Code with enforced phase gates, from ideation to deployment.

## What's new in v5

**v5.2.0**
- **Cross-story impact revalidation** — on every enhancement, the orchestrator auto-invokes story-spec in a read-only `dependency_recheck` mode for each dependent story. If any dependent has drift (missing `reads:` ref, contract overlap, entity field drift), you decide: continue and accept the risk (logged), fix dependent specs first, or cancel the enhancement. Bug fixes skip this — they reconcile code with spec, they don't change the contract.
- **Machine-readable contracts** — every `## contract:[name]` section in `contracts.md` now carries a fenced ` ```yaml ``` ` block alongside the prose: OpenAPI 3.1 for HTTP contracts, JSON Schema (draft 2020-12) for events and shared shapes. Story-spec's self-review flags any referenced contract that lacks a machine-readable block as an arch gap. Enables downstream mock servers, client generation, and contract testing without rewriting specs.

**v5.1.0**
- **Auto-continue mode** — `[>] Run to next pause` action queues the pipeline to auto-approve specs (that raise no concern) and roll straight into build. Auto-continue clears on any concern, gap, deploy point, or error.
- **Haiku for eligible phases** — story-spec (all modes) and reverse-engineer now run on Haiku. Ideation, development, and deployment stay on Sonnet where complex reasoning genuinely earns its cost. Cost tracking updated accordingly.
- **Concern history** — `[!] Concerns` quick-bar action renders the `specs/concerns-log.ndjson` log so you can see which push-backs you accepted vs ignored.

**v5.0.0**
- **Batched-by-topic ideation** — each topic asks its full set of related sub-questions in one form; new-project ideation lands in ~9 turns (was ~20). Amendment mode targets ≤ 3 turns.
- **Bounded raise-a-concern** — story-spec and development subagents may flag one high-impact concern per invocation (untestable criterion, missing owner, spec/code drift, reuse opportunity) with a proposed alternative. Every concern is logged to `specs/concerns-log.ndjson`.
- **Cache-first context ordering** — every subagent reads `agents/_shared/preamble.md` first, then `architecture.md`, then per-story files. Stable-first ordering maximizes prompt-cache reuse across a session.
- **Shared preamble** — path handling, Artifact Index parsing, anchor comment schema, and concern-raising protocol centralized in one file. Reduces drift across the six subagents.

## Installation

**Option 1 — Direct install (terminal):**
```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

**Option 2 — From within Claude Code:**
```
/plugin marketplace add specgantry/specgantry.github.io
/plugin install spec-gantry
```

Then open any project in Claude Code and run:
```
/spec-gantry
```

## Update

If you already have SpecGantry installed, update to the latest version:

**Option 1 — Terminal:**
```bash
claude plugin marketplace update spec-gantry
```

**Option 2 — From within Claude Code:**
```
/plugin marketplace update spec-gantry
```

**Option 3 — Direct plugin update (alternative):**
```bash
claude plugin update spec-gantry@spec-gantry
```

Or from within Claude Code:
```
/plugin update spec-gantry@spec-gantry
```

## Documentation

https://specgantry.github.io

## License

Apache 2.0
