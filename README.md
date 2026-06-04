---
layout: default
title: SpecGantry
permalink: /
---

# Welcome to SpecGantry

**AI-assisted SDLC pipeline for Claude Code.** Enforces structured development from ideation through deployment — specs before code, architecture as guardrails, role-based ownership, and full token cost transparency.

```bash
/spec-gantry
```

One command. The dashboard guides you from there.

---

## Why SpecGantry?

AI coding assistants are **fast**. That speed is also their biggest risk.

It's easy to start building before:
- The problem is fully understood
- The architecture is agreed upon
- Someone has written down what "done" looks like

**SpecGantry puts structure around Claude Code** so that speed doesn't come at the cost of quality or coherence. It enforces the process your team already knows it should follow — but usually skips under pressure.

---

## The Core Idea

```
PROJECT LEVEL (Team Lead/Architect)
  1. Ideation        → Clarify goals & assumptions
  2. Architecture    → Define tech stack & system design

  ── Commit → Team joins ──

FEATURE LEVEL (Developers)
  3. Spec            → Write feature specification
  4. Build           → Implement & test
  5. Deploy          → Release to production

Each phase has gates. You can't proceed without completing the previous one.
```

---

## Key Features

<div class="feature-grid">

<div class="feature-card">
  <h4>🔒 Specs Before Code — Enforced</h4>
  <p>No developer can start coding until a feature spec exists, has been reviewed against architectural guardrails, and has been explicitly approved. The gate is hard.</p>
</div>

<div class="feature-card">
  <h4>🏗️ Architecture as a Guardrail</h4>
  <p>Team Leads define the architecture once. Every feature spec is automatically checked against it. Violations are flagged before a line of code is written.</p>
</div>

<div class="feature-card">
  <h4>👥 Role-Based Ownership</h4>
  <p>Team Leads own the project. Developers own features. Each sees only what's relevant to them. Nobody can accidentally perform actions outside their lane.</p>
</div>

<div class="feature-card">
  <h4>🔄 Session-Safe Progress</h4>
  <p>Every phase writes to disk immediately. If a session is interrupted, the next run picks up exactly where it left off. No work is lost.</p>
</div>

<div class="feature-card">
  <h4>💰 Token Cost Visibility</h4>
  <p>Every agent invocation logs tokens used. Dashboard shows spend by phase, feature, and team member. You always know what AI-assisted development is costing.</p>
</div>

<div class="feature-card">
  <h4>📋 Full Documentation</h4>
  <p>Ideation, architecture, specs, implementation notes — it's all captured in plain text, git-friendly files. Perfect for handoffs and audits.</p>
</div>

</div>

---

## Who It's For

- **Team Leads & Architects** who want their team to follow a consistent process without enforcing it through code review friction
- **Developers** who want clear, scoped specs before they start building — and a structured handoff when they're done
- **Solo developers** who want to impose discipline on their own AI-assisted workflow and avoid the trap of building fast in the wrong direction

---

## Installation (90 seconds)

```bash
# Install from GitHub
claude plugin install https://github.com/specgantry/specgantry.github.io
```

Then open a project in Claude Code and run:

```
/spec-gantry
```

The dashboard guides you from there.

- **New project?** → Runs setup automatically
- **Existing codebase?** → Offers to reverse-engineer it
- **Joining a team?** → Detects the project and sets your role

---

## Next Steps

<div class="quick-links">
  <h3>Get Started</h3>
  <ul>
    <li><a href="{{ '/docs/getting-started' | relative_url }}"><strong>Getting Started</strong></a> — Installation & first run (5 min)</li>
    <li><a href="{{ '/docs/how-it-works' | relative_url }}"><strong>How It Works</strong></a> — Detailed pipeline explanation</li>
    <li><a href="{{ '/docs/skills' | relative_url }}"><strong>Skills Guide</strong></a> — What each skill does</li>
    <li><a href="{{ '/docs/faq' | relative_url }}"><strong>FAQ</strong></a> — Common questions & troubleshooting</li>
  </ul>
</div>

---

## Under the Hood

- **5 Skills** — Dashboard, project setup, bug tracking, code analysis, pricing
- **6 Agents** — Ideation, architecture, feature spec, dev, test, deployment
- **YAML State** — All progress saved to disk, git-friendly
- **Zero Dependencies** — Runs entirely within Claude Code
- **Full Cost Tracking** — Transparent token usage reporting

---

## Status

✅ **Production Ready**

SpecGantry is fully functional and ready for use. Install it in Claude Code and start enforcing better development discipline today.

---

## Repository

- **Source:** [github.com/specgantry/specgantry.github.io](https://github.com/specgantry/specgantry.github.io)
- **Issues:** [GitHub Issues](https://github.com/specgantry/specgantry.github.io/issues)
- **License:** [Apache 2.0](LICENSE)

---

## Contributing

SpecGantry is open source. Contributions welcome!

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

**Ready to get started?** → **[Installation & First Steps]({{ '/docs/getting-started' | relative_url }})**
