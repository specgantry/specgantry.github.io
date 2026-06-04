# Getting Started with SpecGantry

Everything you need to install and run SpecGantry for the first time.

---

## Installation

### Prerequisites

- Claude Code installed and authenticated
- (Optional) Git repository for your project
- Estimated setup time: **5–10 minutes**

### Step 1: Install the Plugin

In any Claude Code session, run:

```bash
claude plugin install https://github.com/specgantry/specgantry.github.io
```

Claude Code will:
- Clone the repository
- Verify plugin structure
- Load skills and agents
- Show confirmation

### Step 2: Open Your Project

```
File → Open Folder
```

Choose either:
- **Empty folder** — For a brand new project
- **Existing codebase** — For reverse-engineering
- **Team project** — To join as a developer

### Step 3: Launch SpecGantry

In Claude Code, run:

```
/spec-gantry
```

That's it. The dashboard will guide you from there.

---

## What Happens Next

### New Project (Empty Folder)

```
Welcome to SpecGantry v1.0.0!
📊 No project spec detected.

🚀 Quick Setup
[1] Start a new project
[2] Reverse-engineer existing code
```

Select `[1] Start a new project`. You'll be asked:
- Project name
- Project vision/goals
- Target platform/language
- Team structure

SpecGantry then runs the `/start-project` skill and creates:
- `specs/project-state.yaml` — Project metadata
- `specs/ideation-artifact.md` — Your project brief

**Time: 5–10 minutes**

### Existing Codebase

```
📚 Found source code. Options:

[1] Reverse-engineer this code into a project spec
[2] Skip, start a fresh project instead
```

Select `[1]` to analyze your code. SpecGantry will:
- Scan file structure
- Identify tech stack and patterns
- Generate an initial project spec
- Propose architecture

You'll review and refine it. Takes **10–15 minutes**.

### Joining a Team

If you open a project where `specs/project-state.yaml` already exists:

```
🎯 SpecGantry Project Detected!
Project: "Acme Platform"
Your Role: Developer

📋 Current Backlog [8 features]
  ✅ Auth Module       (complete)
  🔄 Payment Gateway   (in progress)
  ⏳ Notifications     (ready for pickup)
```

You're automatically set as a **Developer**. Pick a feature and get started.

---

## First Actions for Each Role

### Team Lead / Architect

1. **Complete Ideation**
   - Clarify project goals
   - Align with stakeholders
   - Document assumptions
   - Takes 10–20 minutes

2. **Define Architecture**
   - Tech stack decisions
   - System design
   - API contracts
   - Data model
   - Takes 20–30 minutes

3. **Review Generated Backlog**
   - Prioritize features
   - Assign to developers
   - Commit and push

### Developer

1. **Pick a Feature**
   - Your Team Lead creates the backlog
   - You see unassigned features
   - Select one to work on

2. **Write the Feature Spec**
   - Requirements
   - API contracts
   - Test cases
   - Acceptance criteria

3. **Get Spec Reviewed**
   - Self-review: Can you build this?
   - Submit for Team Lead review
   - Get approval

4. **Build the Feature**
   - Implement
   - Write tests
   - Verify against spec

### Solo Developer

1. **Complete both roles**
   - Run ideation yourself
   - Define architecture yourself
   - Then work features like a developer

---

## Dashboard Overview

When you run `/spec-gantry`, you see:

```
========================================
  Project: My App | Vision from ideation
========================================

📊 Progress      [3/8 features complete]
👤 Role          Developer

📋 Feature Pipeline Board

  Feature A          ✅ Spec → ✅ Review → ✅ Build → ✅ Tests → ✅ Done
  Feature B          ✅ Spec → ✅ Review → 🔄 Build → ○ Tests → ○ Done
  Feature C          ○ Spec  → ○ Review  → ○ Build  → ○ Tests → ○ Done

⚡ Actions

  [1] Continue building Feature B
  [2] Pick up Feature C and start the spec

  [A]rchitecture  [B]acklog  [P]roject  e[X]it
```

---

## Directory Structure

After SpecGantry runs, your project contains:

```
project-root/
├── specs/
│   ├── project-state.yaml        # Project metadata
│   ├── ideation-artifact.md      # Project vision & questions
│   ├── architecture-spec.md      # System design
│   └── features/
│       ├── FEATURE-001/
│       │   ├── state.yaml        # Progress & metadata
│       │   ├── spec.md           # Feature specification
│       │   └── dev-artifact.md   # Implementation notes
│       ├── FEATURE-002/
│       │   └── ...
├── .claude/
│   └── local-state.yaml          # Your role & current feature
└── [your source code...]
```

**Never edit these files manually.** SpecGantry manages them. If you modify them outside the system, you may lose data or cause conflicts.

---

## Common First Steps

### If You're the Team Lead

1. Run `/spec-gantry`
2. Select `[1] Answer ideation questions`
3. Answer 5–10 clarifying questions
4. SpecGantry generates the backlog
5. Commit `specs/` folder to git
6. Invite developers to the repo

### If You're a Developer

1. Wait for Team Lead to commit `specs/` folder
2. Pull the repository
3. Run `/spec-gantry`
4. View the backlog
5. Select an unassigned feature
6. Start writing the spec

### If You're Solo

1. Run `/spec-gantry`
2. Complete ideation as the architect
3. Complete architecture as the architect
4. Then work features as a developer

---

## Next Steps

- [**How It Works**](../how-it-works/) — Understand the full pipeline
- [**Skills Guide**](../skills/) — Learn what each skill does
- [**FAQ**](../faq/) — Common questions

---

## Getting Help

- **Plugin won't install?** → Check [FAQ: Installation](../faq/#installation)
- **Confused about roles?** → Read [How It Works: Roles](../how-it-works/#roles)
- **Question not listed?** → Open an issue on [GitHub](https://github.com/specgantry/specgantry.github.io/issues)

**You're all set! Run `/spec-gantry` to begin.** 🚀
