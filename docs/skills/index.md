# SpecGantry Skills Guide

All 5 skills and how to use them.

---

## Overview

| Skill | Entry Point | For | Role |
|-------|-------------|-----|------|
| **spec-gantry** | `/spec-gantry` | Main dashboard | Both |
| **start-project** | `/start-project` | New project setup | Team Lead |
| **bugfix** | `/bugfix` | Quick bug fixes | Developer |
| **reverse-engineer** | `/reverse-engineer` | Analyze existing code | Team Lead |
| **update-pricing** | `/update-pricing` | Token cost tracking | Team Lead |

---

## 1. spec-gantry

**The main dashboard and entry point.**

```
/spec-gantry
```

### What It Does

- Reads all project state from disk
- Renders the current pipeline dashboard
- Shows the next action(s) based on your role
- Accepts menu commands: `[A]rchitecture`, `[B]acklog`, `[P]roject`, `[X]it`

### When to Use It

Every time you start a session. It's your single entry point to the system.

### Example Workflow

```
Day 1:
  /spec-gantry → [1] Start a new project
               → Runs /start-project

Day 2:
  /spec-gantry → [1] Answer ideation questions
               → Resumes ideation from where you left off

Day 3:
  /spec-gantry → [1] Define architecture
               → Runs architecture agent

Day 4:
  /spec-gantry → [1] Continue building Feature-001
               → Resumes dev where you left off
```

### Features

- **Session safe** — Always picks up where you left off
- **Role aware** — Shows different actions for Team Leads vs Developers
- **Cost visible** — Shows spend breakdown
- **Menu-driven** — Keyboard shortcuts for quick navigation

---

## 2. start-project

**Set up a new project from scratch.**

```
/start-project
```

**Normally called automatically by `/spec-gantry`** when no project exists.

### What It Does

Guides you through:
- Project name and vision
- Platform/language/framework
- Team structure
- Key non-functional requirements

Creates:
- `specs/project-state.yaml`
- `specs/ideation-artifact.md`

### Example

```
📋 Project Setup

What's the name of your project?
> MyApp

What problem does it solve?
> Helps teams manage AI-assisted development workflows

[... more questions ...]

✅ Project created! Next: run /spec-gantry
```

### When to Use It

- Creating a brand new project
- If you manually deleted `specs/` and need to restart
- To add an additional project (advanced use case)

---

## 3. bugfix

**Quick fixes for bugs discovered during development.**

```
/bugfix
```

### What It Does

Lets you:
- Log a bug (without stopping feature development)
- Document what's wrong and how to reproduce it
- Assign it a BUGFIX-NNN identifier
- Defer it for later or fix it immediately

**Bugfixes stay separate from the feature backlog until:**
- Team Lead reviews and approves
- Developer marks it as "graduate to feature" (convert to regular feature)

### Example

```
Found a bug during Feature-001 development?

[1] Log it as a bugfix
    (stays separate, can fix later)

[2] Fix it now
    (pause feature dev, fix bug, resume)

[3] Escalate to Team Lead
    (needs immediate attention)
```

### When to Use It

- Bug found during feature development
- Small bug that doesn't block the feature
- Bug in another feature you're not assigned to
- Architecture issue discovered mid-development

---

## 4. reverse-engineer

**Analyze existing code and generate a project spec.**

```
/reverse-engineer
```

**Normally called automatically by `/spec-gantry`** when you open an existing codebase.

### What It Does

Analyzes:
- File structure
- Dependencies and imports
- Architecture patterns
- Database schema (if detectable)
- API endpoints (if REST/GraphQL)

Generates:
- Initial `specs/project-state.yaml`
- Proposed `specs/architecture-spec.md`
- Candidate feature backlog

### Example

```
Found existing codebase. Analyzing...

📁 Structure: Monorepo with services/
🛠️  Tech: Node.js + Express + PostgreSQL
🗄️  DB: 8 tables detected
🔗 APIs: 24 endpoints found

Proposed architecture:
- Auth Service
- API Gateway
- User Service
- Billing Service

Ready to review? [Y/n]
```

### When to Use It

- Joining an existing project
- Documenting undocumented code
- Starting where another team left off
- Preparing code for handoff

---

## 5. update-pricing

**Configure and view token cost tracking.**

```
/update-pricing
```

### What It Does

Manages:
- Token prices for each Claude model
- Cost breakdowns (by phase, feature, developer)
- Historical pricing (for audits)
- Cost alerts and budgets

Updates:
- `config/pricing-history.yaml`
- Dashboard cost displays

### Example

```
💰 Token Pricing Configuration

Current rates:
  Claude Opus:  $3/$15 per 1K tokens
  Claude Sonnet: $3/$15 per 1K tokens
  Claude Haiku:  $0.80/$4 per 1K tokens

Update rates? [Y/n]
  > Y

Enter Opus input price: $3.00
Enter Opus output price: $15.00

✅ Pricing updated
```

### When to Use It

- Monthly when Claude pricing changes
- To update for your region's pricing
- To set internal cost limits
- When billing to a client (accurate rates)

---

## Skill Invocation Rules

### Automatic Invocation

These skills are called automatically:
- `/start-project` — When `/spec-gantry` detects no project
- `/reverse-engineer` — When `/spec-gantry` detects code in empty repo

### Manual Invocation

You can call any skill directly:

```
/spec-gantry        ← Main dashboard (most common)
/bugfix             ← Log or fix a bug
/update-pricing     ← Adjust token costs
```

### From the Dashboard

When you see:

```
[1] Answer ideation questions
[2] Continue building Feature-A
```

Selecting `[1]` or `[2]` automatically invokes the appropriate skill.

---

## Skill Exit Behavior

### `/spec-gantry`

- Exits with `[X]it`
- Saves state automatically
- Returns you to normal Claude Code

### `/start-project`

- Completes and returns to `/spec-gantry`
- Saves project state automatically
- Next `/spec-gantry` continues from there

### `/bugfix`

- Logs bug and returns to `/spec-gantry`
- Or fixes it and returns to `/spec-gantry`
- Feature development can resume

### `/reverse-engineer`

- Analyzes code
- Proposes architecture
- Waits for approval
- Returns to `/spec-gantry`

### `/update-pricing`

- Updates pricing config
- Returns to `/spec-gantry`
- Next cost calculations use new rates

---

## State Management

Every skill:
1. Reads current state from `specs/` and `.claude/`
2. Makes edits/additions based on your input
3. Writes state to disk immediately
4. Returns to entry point

**This means:**
- No unsaved work (everything saved to disk)
- Network drops don't lose data
- Context resets don't lose progress
- Multiple sessions can coexist (different roles/features)

---

## Combining Skills

### Common Workflows

**New team project:**
```
/spec-gantry
  → [1] Start new project (/start-project runs)
  → [1] Answer ideation questions
  → [1] Define architecture (/architecture-agent runs)
```

**Joining existing project:**
```
/spec-gantry
  → Detects project-state.yaml
  → [1] Pick up Feature-X
  → Starts feature spec
```

**Existing codebase, no spec:**
```
/spec-gantry
  → Detects source files
  → [1] Reverse-engineer (/reverse-engineer runs)
  → Review proposed architecture
  → Continue from there
```

---

## Troubleshooting Skills

**Skill won't start?**
- Ensure project root is open in Claude Code
- Check `specs/` directory exists (or not, depending on phase)
- Run `/spec-gantry` to validate state

**Skills conflicting?**
- Each skill reads current state first
- Conflicts are detected and reported
- Fix the conflict or revert changes

**Lost progress?**
- All state is in `specs/` folder
- Check git history
- Or manually restore from backups

---

## Advanced: Direct Skill Calls

Most users won't need this, but you can invoke agents directly for specific workflows.

**Example:**

```
/orchestrator → [manual entry point to agents]
```

This bypasses the dashboard and lets you:
- Jump to a specific agent
- Skip phases (not recommended)
- Override state (advanced debugging)

Requires understanding the state file format.

---

## Next Steps

- [**Getting Started**](../getting-started/) — Installation & first run
- [**How It Works**](../how-it-works/) — Full pipeline explanation
- [**FAQ**](../faq/) — Common questions

---

**You're ready to use SpecGantry skills!** 🚀
