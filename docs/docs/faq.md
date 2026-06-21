---
layout: docs
title: FAQ
description: Frequently asked questions about SpecGantry v4 — installation, pipeline phases, v3 to v4 differences, costs, and troubleshooting.
permalink: /docs/faq/
prev_page: "Reference"
prev_page_url: "/docs/architecture"
---

# FAQ

---

## Installation

### How do I install SpecGantry?

Run both commands in order:

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Then in any Claude Code project: `/spec-gantry`

### How do I update SpecGantry?

```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:

```
/plugin marketplace update spec-gantry
```

### How do I uninstall?

```bash
claude plugin uninstall spec-gantry
```

This removes the plugin but does not delete your `specs/` directory. Your project state and specs are preserved.

### Does SpecGantry require any external services or accounts?

No. SpecGantry runs entirely inside Claude Code. It uses the Claude API (via your existing Claude Code session) for all agent work. No external APIs, no separate accounts, no additional credentials.

---

## The Pipeline

### Do I have to complete all nine ideation topics in one session?

No. SpecGantry flushes to disk after every answer. If your session ends mid-ideation, the next `/spec-gantry` resumes exactly where you left off — at the first topic still `_not yet written_`.

### Can I skip the spec phase for a story?

No. The `spec_done:true` flag is a hard gate — the development agent refuses to run without it. This is intentional: the spec is the context the build agent needs to implement correctly.

### Can I edit a story spec manually after it's written?

Yes. The spec files are plain Markdown under `specs/stories/[STORY-ID]/story-spec.md`. You can edit them directly. SpecGantry reads the file at build time — whatever is on disk is the contract.

### What happens if a build fails?

SpecGantry halts with: `Build failed — run /spec-gantry to resume`. Check the `build-report.yaml` for `overall_status:fail` and any `warnings`. Fix the issue, then re-run `/spec-gantry` — it resumes from the failed story.

### What is a gap spec and why does it exist?

A gap spec (`gap.md`) is written by the development agent when implementation diverges from the spec — an incomplete contract, a side-effect on another story, or an additional field needed. Rather than editing the spec mid-build (which could invalidate the gate), the gap is logged. Before deployment, SpecGantry prompts you to merge gap specs back into the relevant story specs.

### Can I deploy partial builds (not all stories built)?

No. The deployment gate requires all stories `built:true`. If you need to release a subset of stories, remove the unbuilt stories from `project-state.yaml` before deploying (and add them back after as new work).

---

## v3 to v4

### What is the biggest difference between v3 and v4?

The architecture layer. v3 embedded all architectural knowledge (entities, actors, contracts, UX) into every story spec — making specs verbose and causing drift across stories. v4 moves that knowledge to five shared files under `specs/architecture/`. Story specs become slim navigation maps (≤60 lines) that reference the shared layer via a `reads:` block.

### Do my v3 specs still work with v4?

v4 is not backward compatible with v3 specs. The story-spec format changed (from 6 verbose sections to 5 slim sections + `reads:` block), and the architecture is now in `specs/architecture/` instead of `specs/architecture.md`. For existing v3 projects, run the reverse-engineering flow: `/spec-gantry` will detect source files and synthesize the v4 structure from your code.

### Why is ideation now Sonnet instead of Haiku?

In v3, ideation was conversational only — short questions and answers. In v4, the ideation agent also synthesizes five architecture artifact files from the conversation context. That synthesis task — deriving entity state machines, actor permission tables, contract shapes, and UX conventions — requires Sonnet-class reasoning. The conversational part runs fast; the artifact synthesis justifies the model tier.

### What is the `reads:` block in a story spec?

A machine-readable list of exactly which architecture sections the development agent needs to load for this story:

```yaml
reads:
  actors:    [applicant, admin]
  data:      [application, user]
  contracts: [submission-response, error-envelope]
  ux:        [component-conventions, screen-template]
```

The development agent uses this to load ~130 lines of targeted context rather than the full architecture. This is the mechanism that makes v4 token-efficient.

### What are P0, P1, and P2 gaps?

Automatic self-healing flows:
- **P0:** story-spec found a missing arch section → ideation fills it → story-spec resumes
- **P1:** development found a reads: reference that doesn't exist → story-spec fixes it → development resumes
- **P2:** `ideation_complete:true` but `arch_seeded:false` → a crash during arch writing → ideation fills missing files → pipeline continues

All three are fully automatic. No user intervention needed.

---

## Cost Tracking

### How is cost tracking implemented?

A SubagentStop hook fires automatically every time a SpecGantry agent completes. It reads the actual token counts from the agent transcript (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`), fetches current Anthropic pricing, and appends one entry to `specs/cost-log.ndjson`. No developer action required.

### Is the cost data accurate?

The token counts are exact (from the API response). The pricing is fetched live from Anthropic's pricing page on startup and cached. If the fetch fails, known rates are used as fallback. Each cost entry records whether live or fallback pricing was applied.

### Where is the cost data stored?

`specs/cost-log.ndjson` in your project root. It's plain newline-delimited JSON, git-committable, and human-readable. It survives machine changes, project handoffs, and sessions across days.

### How much does SpecGantry cost to run?

For a typical 4-story project:
- Ideation: $0.50–$1.50 (one Sonnet session with artifact synthesis)
- Per story spec: $0.20–$0.60 (Sonnet, architecture artifacts + intent + spec write)
- Per story build: $0.30–$1.00 (Sonnet, ~130-line targeted context)
- Deployment: $0.20–$0.50 (Sonnet, build-reports + arch tech stack)

A 4-story project typically runs $4–$10 total. v4's targeted reads reduce development-phase cost by 40–60% compared to v3's full-spec loading.

---

## Reverse Engineering

### Can I use SpecGantry with an existing codebase?

Yes. Run `/spec-gantry` in a directory with source files but no `specs/` directory. SpecGantry detects source files and offers to analyze the codebase. The reverse-engineer agent synthesizes the full v4 architecture layer from your code.

### What does "stub spec" mean?

After reverse engineering, each built story gets a `story-spec.md` marked `⚠ Stub spec — created by reverse-engineer`. The stub has the `reads:` block inferred from code but lacks the full five-section spec. You can complete stub specs via the `Complete stub spec` action in the dashboard, or type the story ID directly.

### Can I investigate bugs on a reverse-engineered project without completing stub specs first?

Yes. The investigative agent detects stub specs and adapts — it uses anchor tags and arch artifacts for context instead of `## Criteria`. The `spec_alignment` field in the findings report will note "criteria not yet specced — alignment based on code structure."

### What anchor tags does reverse engineering add to source files?

`@story`, `@intent`, `@entry`, and `@contract` — the same set written by the development agent. The tagging step is optional (you can skip with `[S]`) and non-destructive (comments only, no logic changes).

---

## Troubleshooting

### The dashboard shows the wrong "next action"

Re-read `specs/project-state.yaml` to check flag values. If `pending_arch_gap` or `pending_spec_gap` is non-null, the P0/P1 rows should have fired. If they didn't, there may be a YAML parse error in project-state — check for malformed entries.

### A story shows `spec_done:true` but `intent_done:false`

This shouldn't happen in normal flow, but if it does: run `/spec-gantry` and type the story ID. The story-spec agent will detect `intent_done:false` and re-finalize `intent.md` before proceeding to validate the spec.

### The P2 recovery loop keeps firing

This means `arch_seeded` keeps being reset to `false`. Check that the ideation agent completed its self-review and Pass 2 write. If the architecture artifacts exist but the flag is wrong, manually set `arch_seeded: true` in `project-state.yaml`.

### How do I reset a story to re-spec it?

Set `spec_done: false` and `intent_done: false` for the story in `project-state.yaml`. On next `/spec-gantry`, the story will be queued for spec again.

### How do I report a bug in SpecGantry?

Open an issue on GitHub: [github.com/specgantry/specgantry.github.io/issues](https://github.com/specgantry/specgantry.github.io/issues)

Include: your project-state.yaml (with sensitive values redacted), the agent that failed, and the error message or unexpected behavior.
