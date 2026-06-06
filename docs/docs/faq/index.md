---
layout: docs
title: FAQ
description: Frequently asked questions about SpecGantry — installation, roles, pipeline, costs, and troubleshooting.
prev_page: "Architecture"
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

Yes. SpecGantry runs entirely within Claude Code and your local project directory. No cloud calls, no external APIs. The only network activity is the model invocations themselves (Claude Code's normal operation).

### Do I need git?

Not required. SpecGantry saves state as plain text files in `specs/` — git is not involved in any state operation. That said, git is **strongly recommended** for:
- Sharing `specs/` with your team
- Version history of your architecture and specs
- Recovery from accidental file deletion

### How do I update SpecGantry?

If you already have SpecGantry installed, update to the latest version using one of these commands:

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

Or from within Claude Code:
```
/plugin update spec-gantry@spec-gantry
```

Check your current version anytime:
```bash
claude plugin list
```

### What's the difference between `plugin marketplace update` and `plugin update`?

- **`claude plugin marketplace update spec-gantry`** — Updates from the registered marketplace (recommended). Safe, verifies the plugin structure, and keeps you on the latest stable release.
- **`claude plugin update spec-gantry@spec-gantry`** — Direct plugin update. Also works but bypasses the marketplace verification step.

Both achieve the same result — use whichever is more convenient.

---

## Getting Started

### I'm starting a new project. What do I do?

Run `/spec-gantry` in an empty folder. SpecGantry detects no project and prompts you:

```
[1] Start a new project
[2] Reverse-engineer existing code
```

Select `[1]` and answer the initial questions. Takes 5–10 minutes.

### I'm joining a team. What do I do?

Get the project repository from your Team Lead (it should include the `specs/` folder), then:

```bash
git clone <repo-url>
cd <project>
```

Open in Claude Code and run `/spec-gantry`. It detects `specs/project-state.yaml`, sets your role as Developer, and shows you the backlog.

### I have an existing codebase. Should I reverse-engineer it?

Yes, if you want SpecGantry's structure (architecture doc, feature backlog, guardrails). Run:

```
/spec-gantry
  → Detects source files
  → [1] Reverse-engineer this codebase
```

Review the proposed architecture and backlog before confirming. The reverse-engineer agent proposes — you decide.

---

## Roles

### Can a Developer see the architecture spec?

Yes, read-only. Developers need the architecture spec context to write feature specs that fit the system. They can view it with `[A]rchitecture` in the dashboard. They cannot modify it.

### Can a Team Lead build features?

Technically yes — they can edit `.claude/local-state.yaml` to set `role: dev`. SpecGantry doesn't prevent this. But the tool is designed for clear role separation, and mixing roles loses many of the process guarantees.

### What if the Team Lead leaves?

Another person becomes Team Lead by editing `.claude/local-state.yaml`:

```yaml
role: tl
```

Run `/spec-gantry`. They'll see the full project dashboard with all pending approvals and can continue managing the project.

### Can multiple developers work in parallel?

Yes. Each developer:
1. Has their own `.claude/local-state.yaml` (local to their machine, not committed)
2. Works on different features (each feature has its own directory)
3. Commits spec files to their feature branch
4. Pulls the latest `project-state.yaml` from git for backlog updates

No conflicts because each feature lives under `specs/features/FEATURE-XXX/` — separate directories, no shared files during active development.

---

## The Pipeline

### Can I skip ideation?

No. Ideation validates the project problem and captures constraints before any architecture decision is made. It's the foundation the architecture agent builds on. Without it, the architecture session has no project context.

(You can force-skip by editing YAML directly, but you'll lose the guided process and the feasibility assessment.)

### Can I skip the feature spec?

No. This is the core gate that SpecGantry exists to enforce. No feature spec = no build. The orchestrator reads the filesystem — the spec file must exist on disk with all six sections, zero guardrail violations, and a developer self-review confirmation.

### How long does each phase take?

| Phase | Typical Time |
|-------|-------------|
| Ideation | 10–20 minutes |
| Architecture | 20–40 minutes |
| Feature Spec | 5–15 minutes per feature |
| Build | Depends on complexity |
| Deploy | 5–10 minutes |

### Can multiple phases overlap?

Feature-level phases can run in parallel across different features, even while the Team Lead is finalizing architecture details. But within a feature:
- Spec must be complete before Build
- Build (passing tests) must be complete before Deploy

And project-level phases are strictly sequential — Ideation before Architecture.

### What happens after all features are deployed?

SpecGantry enters project-complete mode and prompts you to describe what you want to work on next. The orchestrator classifies your description — bug, enhancement, new feature, or project change — and confirms before creating anything. See [How It Works → Post-Completion](/docs/how-it-works#post-completion-classify-and-route) for the full routing logic.

### What is a versioned feature (FEATURE-NNN-v2)?

When you describe an enhancement to a completed feature, SpecGantry archives the original instead of overwriting it. The original feature's spec and dev artifacts are renamed to `*-v1` variants, and a new `FEATURE-NNN-v2/` directory is created with a full spec cycle. The dashboard shows the archived original collapsed under the active version. Only active (non-superseded) features count toward the progress total.

### What's a "guardrail violation"?

A guardrail is a rule from `architecture-spec.md` that applies to all features. Examples:
- "All API endpoints must use JWT authentication"
- "No direct database access from the UI layer"
- "All external API calls must have a timeout ≤ 5 seconds"

During Feature Spec, the feature-spec agent checks every guardrail against the spec content. If a spec says "this endpoint is publicly accessible with no auth," that violates the JWT guardrail. The violation is written to the spec file and the gate fails until resolved.

Violations cannot be bypassed. The only options are:
1. Revise the spec to comply
2. Get the Team Lead to change the guardrail in `architecture-spec.md` (which affects all future features)

---

## Specs and Approval

### What makes a good feature spec?

A spec that can be handed to any developer and result in the same implementation. The spec agent guides you through six sections:

1. **Scope** — What it does and explicitly doesn't do
2. **API / Interface Contract** — Every endpoint, function, or event with types
3. **Data** — What data the feature owns, reads, and writes
4. **Implementation Plan** — Ordered tasks, each achievable in one session
5. **Test Plan** — Unit tests, integration tests, edge cases
6. **Non-Functional Considerations** — Performance, security, env vars for all credentials

### Does the Team Lead have to review every spec?

The Team Lead doesn't approve — the **developer self-reviews**. The developer reads the completed spec, confirms they can build it as written, and marks it reviewed (`y`). This triggers the gate check.

The Team Lead sees specs marked as in-progress on their dashboard and can review them asynchronously. They can flag concerns by resetting the `spec_reviewed` flag, which returns the feature to the developer.

### Can I edit a spec after starting to build?

Yes. Return to `/spec-gantry`, select the feature, and choose to edit the spec. Note that editing the spec resets the `spec_reviewed` flag — you must re-review and re-confirm before building can resume. This is intentional: the spec and the implementation should always agree.

---

## State and Progress

### What happens if I close Claude Code mid-session?

All state is written to disk after every question. Closing Claude Code at any point loses nothing. Next `/spec-gantry` picks up at the next unanswered question.

### Can I have multiple features in progress?

Yes. Set `current_feature` in `.claude/local-state.yaml` to switch between features. The dashboard shows all your features and their status. You can have one in Build while starting the spec on another.

### How do I restart a phase?

Edit the relevant `state.yaml` and set the phase gate back to `false`:

```yaml
# specs/features/FEATURE-001/state.yaml
phase_gates:
  feature_spec_complete: false   ← set to false
  spec_reviewed: false
```

Next `/spec-gantry` will offer to resume that phase.

### Can I move a feature back to pending?

Yes, from the spec phase: in the feature-spec agent, select `x` (Abandon) to return the feature to the backlog with `status: pending`, unassigned. From later phases, edit the state file directly.

---

## Troubleshooting

### `/spec-gantry` shows wrong state

Re-run it. The dashboard re-reads all state on every invocation — most inconsistencies self-correct. If the problem persists, inspect the YAML files directly.

### Feature is stuck — can't advance

Check the gate failure message. It will list exactly which conditions failed:

```
✗ Gate check failed: feature_spec → build
  spec_reviewed: false  →  resolve: self-review the completed spec
```

Address each failed condition. Run `/spec-gantry` again.

### Spec won't pass guardrail check

The spec contains a `VIOLATION:` marker. Read the violation message — it will name the specific guardrail and what needs to change. Options:
1. Revise the spec section to comply with the guardrail
2. Request a guardrail exception — Team Lead must update `architecture-spec.md` first

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

Yes. The `specs/` folder is plain text — commit it to git. Use `git diff`, `git log`, and `git blame` to track spec evolution. Spec review history is implicit in commit history.

### Can I export a cost report?

SpecGantry doesn't have built-in cost tracking. Use the Anthropic console to monitor your API usage by project or time range.

### Can I extend SpecGantry with custom agents?

Yes. See [Architecture → Extension Points](/docs/architecture#extension-points) for details.

### Can I use SpecGantry with a different AI assistant?

SpecGantry is designed specifically for Claude Code — it uses Claude Code's skill and agent system. It won't work with other AI tools as-is.

---

## Getting Help

- **Bug reports:** [GitHub Issues](https://github.com/specgantry/specgantry.github.io/issues) — include your `specs/` directory (anonymize sensitive content) and what you were doing when the problem occurred
- **Feature requests:** [GitHub Discussions](https://github.com/specgantry/specgantry.github.io/discussions)
- **Contributing:** See [CONTRIBUTING.md](https://github.com/specgantry/specgantry.github.io/blob/main/CONTRIBUTING.md)
