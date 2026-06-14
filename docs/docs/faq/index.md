---
layout: docs
title: FAQ
description: Frequently asked questions about SpecGantry — installation, pipeline, costs, and troubleshooting.
prev_page: "Reference"
prev_page_url: "/docs/architecture"
---

# Frequently Asked Questions

---

## Installation

### Plugin won't install — "Not found in marketplace"

You need to register the SpecGantry marketplace first, then install:

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

The `claude plugin install <github-url>` form does not work — `install` resolves names against registered marketplaces only.

### Where does the plugin install?

Claude Code manages plugins automatically:
- **macOS:** `~/.claude/plugins/`
- **Windows:** `%APPDATA%\Claude\plugins\`
- **Linux:** `~/.claude/plugins/`

### Can I use SpecGantry offline?

Yes. SpecGantry runs entirely within Claude Code and your local project directory. The only network activity is the model invocations themselves — Claude Code's normal operation. Pricing rates are fetched automatically from Anthropic's pricing page when the MCP server starts.

### Do I need git?

Not required. SpecGantry saves state as plain text files in `specs/` — git is not involved in any state operation. That said, git is **strongly recommended** for:
- Version history of your architecture and specs
- Recovery from accidental file deletion

### How do I update SpecGantry? {#how-do-i-update-specgantry}

**Option 1 — From the marketplace (recommended):**

```bash
claude plugin marketplace update spec-gantry
```

Or from within Claude Code:
```
/plugin marketplace update spec-gantry
```

**Option 2 — Direct plugin update:**

```bash
claude plugin update spec-gantry@spec-gantry
```

Check your current version anytime:
```bash
claude plugin list
```

### What's the difference between `plugin marketplace update` and `plugin update`?

Both update to the latest version. `marketplace update` is recommended — it verifies the plugin structure as part of the update. Use whichever is more convenient.

### How do I uninstall SpecGantry? {#how-do-i-uninstall-specgantry}

To remove the plugin and the marketplace entry completely:

```bash
claude plugin uninstall spec-gantry@spec-gantry
claude plugin marketplace remove spec-gantry
```

Run them in that order — uninstall the plugin first, then remove the marketplace registration. Your project's `specs/` files are not affected.

To reinstall afterwards, use the standard install sequence:

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

---

## Getting Started

### I'm starting a new project. What do I do?

Run `/spec-gantry` in an empty folder. SpecGantry detects no project and prompts you to start one or reverse-engineer existing code. Select Start New Project and answer two questions — project name and vision. Every project starts at version `1.0.0` automatically. Takes 5–10 minutes.

### I have an existing codebase. Should I reverse-engineer it?

Yes, if you want SpecGantry's structure — architecture documentation, a story backlog, and guardrails. Run `/spec-gantry` and select the reverse-engineer option. The agent proposes an architecture and backlog; you review and decide before anything is written.

---

## The Pipeline

### Can I skip ideation?

No. Ideation produces `architecture.md` and the story backlog — neither exists without it. There is no separate architecture phase; ideation does both in one conversation.

### Is there a separate architecture phase?

No. Ideation is a two-beat session: Beat 1 matures the idea, Beat 2 shapes the system. The output of Beat 2 is the architecture — tech stack, system boundaries, guardrails, and a story backlog. There is no separate step to complete before stories can be picked up.

### Can I skip the story spec?

No. The story spec gate is the core of what SpecGantry enforces. No spec means no build — SpecGantry verifies the spec is complete and has zero guardrail violations before development can begin.

### When can I deploy?

Once all stories are built. You are then presented with a single confirmation point: any gap specs are shown and confirmed first, then you choose `[1] Deploy release` or `[X] Hold`. The outcome is recorded in `project-state.yaml`.

### Can I deploy individual stories?

No. SpecGantry deploys the entire system as a single release. This is intentional — cloud infrastructure (containers, serverless, etc.) must be packaged and deployed as a coherent unit. The deployment script covers all stories in dependency order.

### What are gap specs and when are they written?

Gap specs are delta documents written during development when the spec turns out to be incomplete, contradicted by the actual code shape, or has side-effects. Rather than editing the main spec, a `gap-YYYY-MM-DD.md` file is written recording what changed, files affected, and a recommended spec update.

Gap specs are reviewed and merged at the confirm-deploy step, before deployment.

### What happens during gap merge?

When all stories are built, SpecGantry checks for unmerged gap specs and presents any it finds. After confirmation, gaps are merged in chronological order: story spec edits are applied in place, architecture changes are appended as amendment blocks (never overwriting prior content). Each gap file is deleted after it is merged. A summary of what changed is shown before the deploy prompt.

### How long does each phase take?

| Phase | Typical Time |
|-------|-------------|
| Ideation (idea maturation + system shaping) | 15–30 minutes |
| Story Spec | 5–15 min per story |
| Build (implementation) | Depends on complexity |
| Gap merge (if gaps exist) | 2–5 minutes |
| Deploy release | 5–10 minutes (whole system) |

### Why does architecture feel lighter than expected?

By design. The initial system shaping (Beat 2 of ideation) only covers what must exist before any story work begins: tech stack, system boundaries, guardrails, and a dependency-ordered backlog. You only elaborate what you actually build.

### How should stories be sized?

Stories are building blocks, not micro-tasks. A story should represent a meaningful vertical slice of the system — something completable in 1–3 sessions and demonstrable independently. Related capabilities belong in one story.

When in doubt, err toward fewer, larger stories. You can always add scope via `[N] New work` after deployment.

### What happens after all stories are deployed?

SpecGantry enters post-deployment mode and asks what you want to work on next. Use `[N] New work` or describe a change when prompted. SpecGantry classifies the work, reads the backlog and story specs to identify what's affected, confirms with you, and re-enters the pipeline. See [How It Works → Handling Changes After Deployment](/docs/how-it-works#post-deployment) for details.

### How do stories stay versioned over time?

Stories keep the same `STORY-NNN` identity forever. When a bug fix or enhancement changes a story, the spec is updated inline — changed lines are annotated with the release version (e.g. `` `__1.1.0__` ``), old text is struck through, and a row is appended to the spec's Change History table. This keeps the full audit trail inside the spec itself.

### How does release versioning work?

Every project starts at `1.0.0`. The version only changes when a release is deployed. The bump is computed automatically from the highest-severity change type across all stories in the release — `project_change` bumps major, `enhancement` or `new_story` bumps minor, `bug_fix` bumps patch. The initial release always deploys as `1.0.0`.

### Who decides which stories are affected by a bug fix?

SpecGantry does. When you describe new work via `[N] New work`, SpecGantry reads the backlog and all story specs to determine which stories own the described behaviour. It presents the mapping for your confirmation before touching any state.

### What's a "guardrail violation"?

A guardrail is a rule from the architecture that applies to all stories. Examples:
- "All API endpoints must use JWT authentication"
- "No direct database access from the UI layer"
- "All external API calls must have a timeout of 5 seconds or less"

During the Story Spec phase, SpecGantry checks every guardrail against the spec. If a spec contradicts one, the violation is written to the spec file and the gate fails until it's resolved.

Options to resolve a violation:
1. Revise the spec to comply with the guardrail
2. Update the guardrail in `architecture.md` (which affects all future stories)

---

## Specs and Approval

### What makes a good story spec?

A spec clear enough that you (or anyone) could pick it up and build the same thing. SpecGantry guides you through six sections:

1. **What the user can do** — user-facing capability and scope
2. **Screens and states** — UI flows and state transitions
3. **Data and backend** — data owned, APIs, persistence
4. **AI integration** — any AI-assisted behaviour in this story
5. **Enterprise checks** — auth, compliance, audit requirements
6. **Acceptance criteria** — conditions that must be true for the story to be done

### Can I edit a spec after starting to build?

Yes. Return to `/spec-gantry`, select the story, and choose to edit the spec. Editing resets `spec_done` — you must re-confirm the spec before building can resume.

### Can I edit a spec mid-build if something comes up?

The safe path for mid-build adjustments is a gap spec, not a direct edit. If your build reveals the spec needs changing, write a gap spec instead — the main spec stays stable. Gap specs are merged before deployment.

---

## State and Progress

### What happens if I close Claude Code mid-session?

All progress is saved after every question. Closing Claude Code at any point loses nothing. The next `/spec-gantry` picks up at the next unanswered question.

### Can I have multiple stories in progress?

You can switch between stories from the dashboard. You might have one story in development while starting the spec on another.

### How do I restart a phase?

Use `/spec-gantry` and select the story to revisit a completed phase. Phase state can be reset through the project menu when appropriate.

### Can I move a story back to pending?

Type the story ID from the dashboard to manage it. From the story's current phase you can reset it — this clears the spec or build state and returns the story to its previous step.

---

## Costs and Tokens

### How does cost tracking work?

SpecGantry tracks token usage automatically at the end of every agent run — no manual steps needed. Token counts are the real values from the API, not estimates. All cost data is stored in `specs/cost-log.ndjson` alongside your other project files and committed to git.

Run `/track-cost` for a navigable cost dashboard with four views: summary by phase, by story, by release, and by model. Switch between views by typing `1`, `2`, or `3` — the menu persists across views so you don't need to navigate back.

### Why are my costs higher than expected?

Run `/track-cost` and look at the Cache Write and Cache Read columns — these often account for the majority of cost when agents are working through large codebases or long conversations.

Common reasons totals are higher than expected:
- **Large codebase** — reverse-engineering or building against a large existing project means more context per turn
- **Long conversations** — agents working through complex stories accumulate context over many turns
- **Cache writes** — the first session turn incurs a slightly higher rate to build the context cache; subsequent turns are cheaper
- **Iterative spec revisions** — multiple rounds of spec editing each consume tokens

### How do I refresh the pricing rates?

Restart Claude Code. The MCP server fetches the latest rates from Anthropic's pricing page automatically on startup. If `/track-cost` shows `pricing_source: fallback` on any entry, a restart will resolve it.

### Can I export a cost report?

Yes — `specs/cost-log.ndjson` is newline-delimited JSON committed to git. It contains one entry per agent session with full token counts and cost by type. Any tool that reads JSON can aggregate or visualize it.

---

## Troubleshooting

### Costs not being recorded after agent runs {#costs-not-being-recorded}

If `/track-cost` shows no data after completing a phase:

1. **Update the plugin** — cost tracking improvements ship regularly:
   ```bash
   claude plugin marketplace update spec-gantry
   ```
2. **Check that Node.js is installed** — cost tracking requires Node.js to be available:
   ```bash
   node --version
   ```
3. **Reinstall if needed:**
   ```bash
   claude plugin uninstall spec-gantry@spec-gantry
   claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
   claude plugin install spec-gantry
   ```

### `/spec-gantry` shows wrong state

Re-run it. The dashboard re-reads all state from disk on every invocation — most inconsistencies self-correct. If the problem persists, check whether the `specs/` files are as expected and try again.

### Story is stuck — can't advance

Read the gate failure message in the dashboard. It will list exactly which conditions are unmet and what action to take to resolve each one. Address each item and run `/spec-gantry` again.

### Spec won't pass guardrail check

The spec contains a violation. Read the violation message — it names the specific guardrail and what needs to change. Either revise the spec to comply or update the architecture guardrail in `architecture.md`.

### How do I control the MCP server log level? {#mcp-log-level}

SpecGantry writes two separate log files to `.claude/logs/` in your project directory:

| Log file | What it contains |
|----------|-----------------|
| `spec-gantry-costs.log` | Cost entries, token counts, pricing fetch results |
| `spec-gantry-hooks.log` | Agent lifecycle events: start, stop, agent gating |

Both log at `error` level by default. Set the `SPEC_GANTRY_LOG_LEVEL` environment variable to change verbosity:

| Value | What you see |
|-------|-------------|
| `error` | Failures only **(default)** |
| `info` | Key lifecycle events |
| `debug` | Full detail: resolved paths, token counts, every tool call |

Add it to your shell profile so it persists across sessions:

```bash
# ~/.zshrc or ~/.bashrc
export SPEC_GANTRY_LOG_LEVEL=debug
```

Then restart your terminal and reopen Claude Code.

### Plugin stopped working after a Claude Code update

Reinstall:

```bash
claude plugin uninstall spec-gantry@spec-gantry
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

---

## Advanced

### Can I version my specs?

Yes — `specs/` is plain text committed to git. Use standard git tools to track spec evolution, compare versions, and understand how decisions changed over time.

### Can I extend SpecGantry with custom agents or guardrails?

Yes. See [Reference → Extension Points](/docs/architecture#extension-points) for details on adding custom guardrails, agents, and skills.

### Can I use SpecGantry with a different AI assistant?

SpecGantry is designed specifically for Claude Code. It uses Claude Code's skill and agent system and won't work with other AI tools.

---

## Getting Help

- **Bug reports:** [GitHub Issues](https://github.com/specgantry/specgantry.github.io/issues)
- **Feature requests:** [GitHub Discussions](https://github.com/specgantry/specgantry.github.io/discussions)
- **Contributing:** See [CONTRIBUTING.md](https://github.com/specgantry/specgantry.github.io/blob/main/CONTRIBUTING.md)
