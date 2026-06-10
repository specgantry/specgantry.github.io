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

Get the project repository from your Team Lead (it should include the `specs/` folder), then open it in Claude Code and run `/spec-gantry`. It detects the project, sets your role as Developer, and shows you the component backlog.

### I have an existing codebase. Should I reverse-engineer it?

Yes, if you want SpecGantry's structure — architecture documentation, a component backlog, and guardrails. Run `/spec-gantry` and select the reverse-engineer option. The agent proposes an architecture and backlog; you review and decide before anything is written.

---

## Roles

### Can a Developer see the architecture spec?

Yes, read-only. Developers need the architecture context to write component specs that fit the system. Select `[A]` Architecture from the action bar to view it.

### Can a Team Lead build components?

SpecGantry is designed for clear role separation — Team Leads own project-level phases and deployment, developers own component-level work. A Team Lead can switch their local role to work as a developer, but mixing roles reduces many of the process guarantees the pipeline provides.

### Can a Developer deploy?

No. Deployment is a Team Lead responsibility. The TL triggers the release once all components pass tests and integration testing is complete — this deploys the entire system as a single release.

### What if the Team Lead leaves?

Another person can take over as Team Lead by updating their local role setting and running `/spec-gantry`. They'll see the full project dashboard with all pending items and can continue managing the project.

### Can multiple developers work in parallel?

Yes. Each developer works on different components — components are isolated from each other in separate directories. Each developer has their own local role settings that stay on their machine. Spec files are committed per-component, so parallel work doesn't conflict.

---

## The Pipeline

### Can I skip ideation?

No. Ideation produces `architecture-spec.md` and the component backlog — neither exists without it. There is no separate architecture phase; ideation does both in one conversation.

### Is there a separate architecture phase?

No. Ideation is a two-beat session: Beat 1 matures the idea, Beat 2 shapes the system. The output of Beat 2 is the architecture — tech stack, system boundaries, guardrails, and a component backlog. There is no separate step to complete before components can be picked up.

### Does the Team Lead need to approve the backlog?

Yes. After ideation, SpecGantry presents the proposed component list for the TL's review. No component spec work can begin until the TL explicitly approves with `[Y] Approve`. This is a hard gate — `backlog_approved:true` must be set in `project-state.yaml`.

### Can I skip the component spec?

No. The component spec gate is the core of what SpecGantry enforces. No spec means no build — SpecGantry verifies the spec is complete and has zero guardrail violations before development can begin.

### When can I deploy?

Once integration tests pass. Individual component unit tests are necessary but not sufficient — the system must be functionally solid end-to-end. The deployment gate requires `integration_tests_passing:true`, which means all component unit tests passed AND all critical cross-component scenarios in `integration-scenarios.md` passed.

### Can I deploy individual components?

No. SpecGantry deploys the entire system as a single release. This is intentional — cloud infrastructure (containers, serverless, etc.) must be packaged and deployed as a coherent unit. The deployment script covers all components in dependency order.

### What are gap specs and when are they written?

Gap specs are delta documents written during development when the spec turns out to be incomplete, contradicted by the actual code shape, or has side-effects on another component's interface. Rather than editing the main spec while other developers may still be building against it, the developer writes a `gap-YYYY-MM-DD.md` file recording what changed, files affected, side-effects, and a recommended spec update.

Gap specs are merged automatically before integration testing begins. If no gaps exist, integration testing proceeds immediately.

### What happens during gap merge?

Before integration tests run, SpecGantry checks for unmerged gap specs across all components. If any exist, they are merged in chronological order: component spec edits are applied in place, architecture changes are appended as amendment blocks (never overwriting prior content), side-effects on other components are checked and minimal corrections applied. Each gap file is deleted after it is merged. The TL receives a summary of what changed before integration testing proceeds.

### How long does each phase take?

| Phase | Typical Time |
|-------|-------------|
| Ideation (idea maturation + system shaping) | 15–30 minutes |
| Backlog approval | 2–5 minutes |
| Component Spec | 5–15 min per component (+5 min domain elaboration on first of each domain) |
| Development (TDD + full test gate) | Depends on complexity |
| Gap merge (if gaps exist) | 2–5 minutes |
| Integration Test | Minutes to tens of minutes (depends on scenario count) |
| Deploy release | 5–10 minutes (whole system) |

### Can multiple phases overlap?

Yes — components run their Spec → Development lifecycle in parallel. You can have one component in development while another is still in spec. Within a single component, phases are sequential. Ideation and backlog approval must complete before any component work begins.

### Why does architecture feel lighter than expected?

By design. The initial system shaping (Beat 2 of ideation) only covers what must exist before any component work begins: tech stack, system boundaries, guardrails, and a dependency-ordered backlog. Detailed domain elaboration — data model, interface contracts, domain NFRs — happens just-in-time when the first component of each domain is picked up. You only elaborate what you actually build.

### What is domain elaboration?

When you pick up the first component of a domain, three quick architecture questions elaborate that domain before the spec begins: data model, interface contracts, and domain-specific constraints. The answers are appended to `architecture-spec.md` and used as context for the spec. Subsequent components in the same domain skip this step.

### How should components be sized?

Components are building blocks, not micro-tasks. A component should represent a meaningful vertical slice of the system — something a developer can complete in 1–3 sessions and demonstrate independently. Related capabilities within a domain belong in one component. A component can have internally separated code (models, services, controllers) but it ships as a unit with one spec.

When in doubt, err toward fewer, larger components. You can always add scope via `[+] New work` after deployment.

### What happens after all components are deployed?

SpecGantry enters post-deployment mode and asks what you want to work on next. Use `[+] New work` or describe a change when prompted. SpecGantry classifies the work, reads the backlog and component specs to identify what's affected, confirms with you, and re-enters the pipeline. You can also use `[+] New work` at any point mid-pipeline. See [How It Works → Handling Changes After Deployment](/docs/how-it-works#post-deployment) for details.

### How do components stay versioned over time?

Components keep the same `COMP-NNN` identity forever. When a bug fix or enhancement changes a component, the spec is updated inline — changed lines are annotated with the release version (e.g. `` `__1.1.0__` ``), old text is struck through, and a row is appended to the spec's Change History table. This keeps the full audit trail inside the spec itself.

### How does release versioning work?

Every project starts at `1.0.0`. The version only changes when a release is deployed. The bump is computed automatically from the highest-severity change type across all components in the release — `project_change` bumps major, `enhancement` or `new_component` bumps minor, `bug_fix` bumps patch. The initial release always deploys as `1.0.0`.

### Who decides which components are affected by a bug fix?

SpecGantry does. When you describe new work via `[+] New work`, SpecGantry reads the backlog and all component specs to determine which components own the described behaviour. It presents the mapping for your confirmation before touching any state — you don't need to identify the target components yourself.

### What's a "guardrail violation"?

A guardrail is a rule from the architecture that applies to all components. Examples:
- "All API endpoints must use JWT authentication"
- "No direct database access from the UI layer"
- "All external API calls must have a timeout of 5 seconds or less"

During the Component Spec phase, SpecGantry checks every guardrail against the spec. If a spec contradicts one — for example, defining a public endpoint with no auth — the violation is written to the spec file and the gate fails until it's resolved.

Options to resolve a violation:
1. Revise the spec to comply with the guardrail
2. Ask the Team Lead to update the guardrail in the architecture spec (which affects all future components)

---

## Specs and Approval

### What makes a good component spec?

A spec clear enough that any developer could pick it up and build the same thing. SpecGantry guides you through five sections:

1. **Scope** — What it does and explicitly what it doesn't do
2. **Interface Contract** — What it exposes or consumes (delta from the domain section in architecture-spec.md)
3. **Data** — What data it owns or accesses (delta from the domain data model)
4. **Features** — Ordered internal tasks grouped into parallel tiers
5. **Test Plan** — Unit tests, integration hooks, edge cases

The spec also notes which integration scenarios in `integration-scenarios.md` this component participates in.

### Does the Team Lead have to review every component spec?

No. The developer self-reviews at the end of the spec phase — after completing all five sections and passing the guardrail check, the developer confirms the spec is ready to build. That's the final gate before development begins. There is no separate TL review step.

### Can I edit a spec after starting to build?

Yes. Return to `/spec-gantry`, select the component, and choose to edit the spec. Editing resets `spec_complete` — you must re-confirm the spec before building can resume. The spec and the implementation should always agree.

### Can I edit a spec while another developer is building against it?

The safe path for mid-build adjustments is a gap spec, not a direct edit. If your build reveals the spec needs changing, write a gap spec instead — this keeps the main spec stable for anyone else building in parallel. Gap specs are merged before integration testing begins.

---

## State and Progress

### What happens if I close Claude Code mid-session?

All progress is saved after every question. Closing Claude Code at any point loses nothing. The next `/spec-gantry` picks up at the next unanswered question.

### Can I have multiple components in progress?

Yes. You can switch between components from the dashboard. You might have one component in development while starting the spec on another.

### How do I restart a phase?

Use `/spec-gantry` and select the component to revisit a completed phase. Phase state can be reset through the project menu when appropriate. Contact your Team Lead for resets that affect project-level gates.

### Can I move a component back to pending?

Yes — during the spec phase, select Abandon to return the component to the backlog unassigned. From later phases, the Team Lead can reassign or defer components through `[P] Project`.

---

## Costs and Tokens

### How does cost tracking work?

SpecGantry tracks token usage automatically at the end of every agent run — no manual steps needed. Token counts are the real values from the API, not estimates. All cost data is stored in `specs/cost-log.ndjson` alongside your other project files and committed to git.

Run `/track-cost` for a navigable cost dashboard with four views: summary by phase, by component, by release, and by model. Switch between views by typing `1`, `2`, or `3` — the menu persists across views so you don't need to navigate back.

### Why are my costs higher than expected?

Run `/track-cost` and look at the Cache Write and Cache Read columns — these often account for the majority of cost when agents are working through large codebases or long conversations.

Common reasons totals are higher than expected:
- **Large codebase** — reverse-engineering or building against a large existing project means more context per turn
- **Long conversations** — agents working through complex components accumulate context over many turns
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
   claude plugin uninstall spec-gantry
   claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
   claude plugin install spec-gantry
   ```

### `/spec-gantry` shows wrong state

Re-run it. The dashboard re-reads all state from disk on every invocation — most inconsistencies self-correct. If the problem persists, check whether the `specs/` files are as expected and try again.

### Component is stuck — can't advance

Read the gate failure message in the dashboard. It will list exactly which conditions are unmet and what action to take to resolve each one. Address each item and run `/spec-gantry` again.

### Spec won't pass guardrail check

The spec contains a violation. Read the violation message — it names the specific guardrail and what needs to change. Either revise the spec to comply or ask your Team Lead to update the architecture guardrail.

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
