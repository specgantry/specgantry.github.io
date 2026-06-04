# SpecGantry Documentation

**AI-assisted SDLC pipeline for Claude Code**

Enforces structured development from ideation through deployment — specs before code, architecture as guardrails, role-based ownership, and full token cost transparency.

---

## Core Concepts

### The Problem

AI coding assistants are fast. That speed is also their biggest risk.

It's easy to start building before:
- The problem is fully understood
- The architecture is agreed upon
- Someone has written down what "done" looks like

The result: code that solves the wrong problem, or the right problem in a way that doesn't fit the rest of the system.

### The Solution

SpecGantry enforces the process your team **already knows** it should follow — but usually skips under pressure.

**It puts structure around Claude Code without being rigid.**

---

## How It Works (30 seconds)

```
PROJECT LEVEL (Team Lead/Architect)
  1. Ideation        → Clarify the problem & align stakeholders
  2. Architecture    → Design the system & generate the backlog

  ── Team Lead commits → developers join ──

FEATURE LEVEL (Developers)
  3. Spec            → Write detailed feature specification
  4. Build           → Implement against the spec
  5. Tests & Deploy  → Verify & release

Each phase has gates. You can't proceed without completing the previous one.
```

---

## Key Features

### 🔒 Specs Before Code — Enforced

No developer can start coding until a feature spec exists, has been reviewed against architectural guardrails, and has been explicitly approved. The gate is hard: Claude Code won't proceed without it.

### 🏗️ Architecture as a Living Guardrail

The Team Lead/Architect runs a guided session that produces an architecture spec — tech stack, system boundaries, API contracts, data model, non-functional requirements. Every feature spec written afterwards is automatically checked against it. Violations are flagged before a line of code is written.

### 👥 Role-Based Pipeline Ownership

- **Team Lead/Architect** owns the project — ideation, architecture, deployment
- **Developers** own features — spec, implementation, tests
- Each role sees only what's relevant to them
- Nobody can accidentally perform actions outside their lane

### 🔄 Resumable, Session-Safe Progress

Every phase writes to disk after each question or section. If a session is interrupted — network drop, context reset, end of day — the next `/spec-gantry` picks up exactly where it left off. No work is lost.

### 💰 Token Cost Visibility

Every agent invocation logs model, input tokens, and output tokens. The dashboard gives a running breakdown by phase, feature, and total project spend — so you always know what AI-assisted development is actually costing.

---

## Navigation

| Section | For |
|---------|-----|
| [**Getting Started**](getting-started/) | Installation & first steps |
| [**How It Works**](how-it-works/) | Detailed pipeline explanation |
| [**Skills Guide**](skills/) | All 5 skills & their workflows |
| [**Architecture**](architecture/) | Design decisions & technical details |
| [**FAQ**](faq/) | Common questions & troubleshooting |

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

---

## Who It's For

**Team Leads & Architects** who want their team to follow a consistent process without enforcing it manually through code review friction.

**Developers** who want clear, scoped specs before they start building — and a structured handoff when they're done.

**Solo developers** who want to impose discipline on their own AI-assisted workflow and avoid the trap of building fast in the wrong direction.

---

## Why SpecGantry Matters

Speed without structure leads to:
- Code solving the wrong problem
- Architecture violations discovered too late
- Refactoring during code review
- Frustrated developers and architects
- Wasted token spend on rework

SpecGantry prevents all of this by enforcing the process **before code is written**, not after.

---

## Under the Hood

- **5 Skills** — Orchestration entry point + 4 specialized workflows
- **6 Agents** — Ideation, Architecture, Feature Spec, Dev, Test, Deployment
- **YAML-based state** — Full session resumption from disk
- **Zero external dependencies** — Runs entirely within Claude Code
- **Full token tracking** — Transparent cost reporting

---

## Next Steps

- **First time?** Start with [Getting Started](getting-started/)
- **Want details?** See [How It Works](how-it-works/)
- **Joining a team?** Check [Skills Guide](skills/)
- **Questions?** Browse [FAQ](faq/)

---

**[Repository](https://github.com/specgantry/specgantry.github.io) • [Issues](https://github.com/specgantry/specgantry.github.io/issues)**
