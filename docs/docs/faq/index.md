---
layout: docs
title: FAQ
description: Frequently asked questions about SpecGantry — installation, roles, pipeline, costs, and troubleshooting.
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
- Sharing `specs/` with your team
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
claude plugin uninstall spec-gantry
claude plugin marketplace remove https://github.com/specgantry/specgantry.github.io
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

### I'm joining a team. What do I do?

Get the project repository from your Team Lead (it should include the `specs/` folder), then open it in Claude Code and run `/spec-gantry`. It detects the project, sets your role as Developer, and shows you the backlog.

### I have an existing codebase. Should I reverse-engineer it?

Yes, if you want SpecGantry's structure — architecture documentation, a feature backlog, and guardrails. Run `/spec-gantry` and select the reverse-engineer option. The agent proposes an architecture and backlog; you review and decide before anything is written.

---

## Roles

### Can a Developer see the architecture spec?

Yes, read-only. Developers need the architecture context to write feature specs that fit the system. Select `[A]` Architecture from the action bar to view it.

### Can a Team Lead build features?

SpecGantry is designed for clear role separation — Team Leads own project-level phases and deployment, developers own feature-level work. A Team Lead can switch their local role to work as a developer, but mixing roles reduces many of the process guarantees the pipeline provides.

### Can a Developer deploy?

No. Deployment is a Team Lead responsibility. The TL triggers the release once all features pass tests — this deploys the entire system as a single release.

### What if the Team Lead leaves?

Another person can take over as Team Lead by updating their local role setting and running `/spec-gantry`. They'll see the full project dashboard with all pending items and can continue managing the project.

### Can multiple developers work in parallel?

Yes. Each developer works on different features — features are isolated from each other in separate directories. Each developer has their own local role settings that stay on their machine. Spec files are committed per-feature, so parallel work doesn't conflict.

---

## The Pipeline

### Can I skip ideation?

No. Ideation validates the project problem and captures constraints before any architecture decisions are made. Without a completed ideation, the architecture session has no project context to work from.

### Can I skip the feature spec?

No. The feature spec gate is the core of what SpecGantry enforces. No spec means no build — SpecGantry verifies the spec is complete, has zero guardrail violations, and has been self-reviewed before development can begin.

### When can I deploy?

Only after all features in the backlog have been built and tested. The deployment gate blocks until every feature has `tests_passing: true`. This ensures the first release contains a complete, coherent system rather than a partial build.

### Can I deploy individual features?

No. SpecGantry deploys the entire system as a single release. This is intentional — cloud infrastructure (containers, serverless, etc.) must be packaged and deployed as a coherent unit. The deployment script covers all features in dependency order within the appropriate architectural components.

### How long does each phase take?

| Phase | Typical Time |
|-------|-------------|
| Ideation | 10–20 minutes |
| Architecture | 20–40 minutes |
| Feature Spec | 5–15 minutes per feature |
| Build | Depends on complexity |
| Test | Minutes (automated) |
| Deploy release | 5–10 minutes (whole system) |

### Can multiple phases overlap?

Feature-level phases run in parallel across different features. Multiple developers can be in different phases on different features simultaneously. Within a single feature, phases are sequential — spec before build, build before deploy. Project-level phases are also sequential — ideation before architecture.

### What happens after all features are deployed?

SpecGantry enters post-deployment mode and asks what you want to work on next. Use `[+] New work` or describe a change when prompted. SpecGantry classifies the work, reads the backlog and feature specs to identify which features are affected, confirms with you, and re-enters the pipeline. See [How It Works → Handling Changes After Deployment](/docs/how-it-works#post-deployment) for details.

### What is a versioned feature?

There are no separately versioned features. Features keep the same `FEATURE-NNN` identity forever. When a bug fix or enhancement changes a feature, the spec is updated inline — changed lines are annotated with the release version (e.g. `` `__1.1.0__` ``), old text is struck through, and a row is appended to the spec's Change History table. This keeps the full audit trail inside the spec itself.

### How does release versioning work?

Every project starts at `1.0.0`. The version only changes when a release is deployed. The bump is computed automatically from the highest-severity change type across all features in the release — `project_change` bumps major, `enhancement` or `new_feature` bumps minor, `bug_fix` bumps patch. The initial release always deploys as `1.0.0`.

### Who decides which features are affected by a bug fix?

SpecGantry does. When you describe new work via `[+] New work`, SpecGantry reads the backlog and all feature specs to determine which features own the described behaviour. It presents the mapping for your confirmation before touching any state — you don't need to identify the target features yourself.

### What's a "guardrail violation"?

A guardrail is a rule from the architecture that applies to all features. Examples:
- "All API endpoints must use JWT authentication"
- "No direct database access from the UI layer"
- "All external API calls must have a timeout of 5 seconds or less"

During the Feature Spec phase, SpecGantry checks every guardrail against the spec. If a spec contradicts one — for example, defining a public endpoint with no auth — the violation is written to the spec file and the gate fails until it's resolved.

Options to resolve a violation:
1. Revise the spec to comply with the guardrail
2. Ask the Team Lead to update the guardrail in the architecture spec (which affects all future features)

---

## Specs and Approval

### What makes a good feature spec?

A spec clear enough that any developer could pick it up and build the same thing. SpecGantry guides you through six sections:

1. **Scope** — What it does and explicitly what it doesn't do
2. **API / Interface Contract** — Every endpoint, function, or event with types
3. **Data** — What data the feature owns, reads, and writes
4. **Implementation Plan** — Ordered tasks, each achievable in one session
5. **Test Plan** — Unit tests, integration tests, edge cases
6. **Non-Functional Considerations** — Performance, security, env var names for all credentials

### Does the Team Lead have to review every spec?

The developer self-reviews. After completing all six sections, the developer confirms they can build it as written — that's the final gate before development begins.

The Team Lead sees in-progress specs on their dashboard and can review them asynchronously. If they spot a concern, they can return the spec to the developer for revision.

### Can I edit a spec after starting to build?

Yes. Return to `/spec-gantry`, select the feature, and choose to edit the spec. Editing resets the self-review confirmation — you must re-review before building can resume. The spec and the implementation should always agree.

---

## State and Progress

### What happens if I close Claude Code mid-session?

All progress is saved after every question. Closing Claude Code at any point loses nothing. The next `/spec-gantry` picks up at the next unanswered question.

### Can I have multiple features in progress?

Yes. You can switch between features from the dashboard. You might have one feature in Build while starting the spec on another.

### How do I restart a phase?

Contact your Team Lead or use `/spec-gantry` and select the feature to revisit a completed phase. Phase state can be reset through the project menu when appropriate.

### Can I move a feature back to pending?

Yes — during the spec phase, select Abandon to return the feature to the backlog unassigned. From later phases, the Team Lead can reassign or defer features through `[P] Project`.

---

## Costs and Tokens

### How does cost tracking work?

SpecGantry tracks token usage automatically at the end of every agent session — no manual steps needed. Token counts are the real values from the API, not estimates. All cost data is stored in `specs/cost-log.ndjson` alongside your other project files and committed to git.

Run `/track-cost` to see the full breakdown by phase and feature.

### Why are my costs higher than expected?

Run `/track-cost` and look at the Cache Write and Cache Read columns — these often account for the majority of cost when agents are working through large codebases or long conversations.

Common reasons totals are higher than expected:
- **Large codebase** — reverse-engineering or building against a large existing project means more context per turn
- **Long conversations** — agents working through complex features accumulate context over many turns
- **Cache writes** — the first session turn incurs a slightly higher rate to build the context cache; subsequent turns are cheaper
- **Iterative spec revisions** — multiple rounds of spec editing each consume tokens

The ideation agent uses a lighter, faster model. Architecture, spec, and development agents use a more capable model that costs more per token.

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
   claude plugin uninstall spec-gantry
   claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
   claude plugin install spec-gantry
   ```

### `/spec-gantry` shows wrong state

Re-run it. The dashboard re-reads all state from disk on every invocation — most inconsistencies self-correct. If the problem persists, check whether the `specs/` files are as expected and try again.

### Feature is stuck — can't advance

Read the gate failure message in the dashboard. It will list exactly which conditions are unmet and what action to take to resolve each one. Address each item and run `/spec-gantry` again.

### Spec won't pass guardrail check

The spec contains a violation. Read the violation message — it names the specific guardrail and what needs to change. Either revise the spec to comply or ask your Team Lead to update the architecture guardrail.

### How do I control the MCP server log level? {#mcp-log-level}

The cost-tracking MCP server logs at `info` level by default. Set the `SPEC_GANTRY_LOG_LEVEL` environment variable to change it:

| Value | What you see |
|-------|-------------|
| `error` | Failures only — silent on success |
| `info` | Key lifecycle events: startup, pricing fetch, cost recorded **(default)** |
| `debug` | Full detail: resolved paths, token counts, every tool call in and out |

Add it to your shell profile so it persists across sessions:

```bash
# ~/.zshrc or ~/.bashrc
export SPEC_GANTRY_LOG_LEVEL=debug
```

Then restart your terminal (or run `source ~/.zshrc`) and reopen Claude Code. The MCP server picks up the env var from your shell environment automatically.

To check what the server is logging, look at the log file written to your project's `logs/spec-gantry-costs.log`, or open Claude Code's MCP viewer to see stderr output in real time.

### Plugin stopped working after a Claude Code update

Reinstall:

```bash
claude plugin uninstall spec-gantry
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
