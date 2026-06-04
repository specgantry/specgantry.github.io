# How SpecGantry Works

A detailed breakdown of the pipeline, roles, and phases.

---

## The Pipeline at a Glance

```
PROJECT LEVEL ────────────────────────────────
  Phase 1: Ideation
  Phase 2: Architecture

  Commit → Push to GitHub

FEATURE LEVEL (Parallel) ───────────────────
  Phase 3: Feature Spec (repeats for each feature)
  Phase 4: Development (repeats for each feature)
  Phase 5: Tests & Deploy (repeats for each feature)

Each phase has gates. You cannot proceed without completing the previous phase.
```

---

## The Five Phases

### Phase 1: Ideation (Team Lead/Architect)

**Purpose:** Clarify the project problem and goals.

**Questions answered:**
- What problem are we solving?
- Who are the stakeholders?
- What success looks like
- Constraints and assumptions
- Non-functional requirements

**Output:** `specs/ideation-artifact.md` — A written brief that the whole team can reference.

**Time:** 10–20 minutes

**Gate:** You cannot proceed to Architecture until ideation is complete.

---

### Phase 2: Architecture (Team Lead/Architect)

**Purpose:** Design the system and decompose work into features.

**Defines:**
- Technology stack (languages, frameworks, databases)
- System design (services, API boundaries, data model)
- Non-functional requirements (scalability, security, performance)
- System constraints and tradeoffs
- Feature dependencies

**Output:**
- `specs/architecture-spec.md` — The architecture document
- `specs/project-state.yaml` — The feature backlog (auto-generated from architecture)

**Time:** 20–40 minutes

**Gate:** Developers cannot start specs until architecture is committed to git.

---

### Phase 3: Feature Spec (Developer)

**Purpose:** Define what the feature does before building.

**Specification includes:**
- Requirements (what it does)
- API contracts (inputs, outputs, data structures)
- Integration points (how it connects to other features)
- Test cases (how to verify it works)
- Acceptance criteria (definition of done)

**Output:** `specs/features/FEATURE-XXX/spec.md`

**Time:** 5–15 minutes per feature

**Gate:** Code cannot be written until the spec is approved by the Team Lead.

---

### Phase 4: Development (Developer)

**Purpose:** Implement the feature according to spec.

**Workflow:**
- Create feature branch
- Implement code
- Write unit tests
- Verify against spec requirements
- Self-review

**Output:** Working code in branch, tests passing

**Time:** Depends on feature complexity

**Gate:** Features cannot be deployed until tests pass and Team Lead approves.

---

### Phase 5: Tests & Deployment (Team Lead or Developer)

**Purpose:** Verify feature works and release to production.

**Verification:**
- All unit tests pass
- Integration tests pass
- Code review approval
- Architecture compliance check

**Output:** Feature merged and deployed

**Time:** 5–10 minutes

---

## Roles

### Team Lead / Architect

**Responsibilities:**
- Answer ideation questions (clarify project goals)
- Define architecture (tech stack, design, constraints)
- Review and approve feature specs
- Deploy features
- Track project costs and timeline

**What they see in the dashboard:**
- Project status and backlog
- Open architecture questions (if any)
- Features awaiting approval
- Token spend and cost breakdown

**Cannot do:**
- Start coding (not their role)
- Build features (developers do that)

### Developer

**Responsibilities:**
- Write feature specifications
- Implement features according to spec
- Write tests
- Self-review before approval request
- Notify Team Lead when ready to deploy

**What they see in the dashboard:**
- Their current feature
- Backlog (for picking next feature)
- Self-review checklist

**Cannot do:**
- Approve specs (Team Lead does that)
- Deploy (Team Lead does that)
- View architecture (unless explicitly shared)
- Modify the backlog

---

## How Specs Are Enforced

### The Spec Gate

Developers cannot start coding until:
1. Feature spec exists
2. Spec is reviewed against architecture
3. Team Lead explicitly approves

**Example violation:** Spec says "Use PostgreSQL" but developer tries to use MongoDB.

**What happens:**
- SpecGantry flags the violation
- Development phase blocks
- Team Lead must either approve the deviation or send it back to spec

This prevents "code first, ask questions later" scenarios.

---

## Session Safety & Resumption

Every phase writes to disk after completing each section.

**Example:** During ideation, after each question:
```yaml
# specs/ideation-artifact.md is updated with the answer
# If context resets, next /spec-gantry picks up at the next question
```

**What this means:**
- Network dropped mid-session? Pick up where you left off
- Context reset? No work is lost
- End of day? Session saves automatically
- Multiple team members? Each has their own state

---

## Cost Tracking

Every agent invocation logs:
- Model used (Claude Opus, Sonnet, Haiku)
- Input tokens consumed
- Output tokens generated
- Phase and feature

**Dashboard shows:**
- Total spend by phase
- Cost per feature
- Cost per developer
- Running balance

**Why it matters:**
- Identify expensive features early
- Budget for AI-assisted development
- Optimize model selection (Haiku vs Opus)
- Prevent runaway token consumption

---

## Feature Dependencies

Architecture can define feature dependencies:
```yaml
dependencies:
  - FEATURE-002: Must complete before FEATURE-003
  - FEATURE-005: Blocks FEATURE-001
```

**Effect:**
- Developers cannot start a feature if dependencies aren't complete
- Dashboard shows which features are blocked
- Clear dependency chains prevent rework

---

## Backlog Management

The Team Lead can:
- Prioritize features
- Add new features (without re-running architecture)
- Assign features to developers
- Reassign in-progress features
- Defer features (don't delete, preserve history)
- Graduate bugfixes to regular features

**Developers see:**
- Only their assigned features
- Unassigned features they can pick up
- Features they can start (dependencies met)

---

## The Dashboard

Every time you run `/spec-gantry`, it re-reads state and renders the current dashboard.

**Header shows:**
- Project name
- Progress (N/total features complete)
- Your role (Team Lead or Developer)
- Architecture questions (if any, for Team Leads)

**Feature board shows:**
- All features in pipeline
- Status of each phase for each feature
- Cost estimate per feature
- Assignee
- Warnings (spec issues, blockers)

**Actions section shows:**
- 1–4 relevant next steps
- Changes based on your role and current state

**Menu bar:**
- `[A]rchitecture` — View or edit architecture (Team Lead only)
- `[B]acklog` — View/manage backlog (Team Lead only)
- `[P]roject` — Project settings (Team Lead only)
- `[X]it` — Exit SpecGantry, return to normal Claude Code

---

## File Structure

SpecGantry stores everything in `specs/` folder:

```
specs/
├── project-state.yaml           # Project metadata, backlog
├── ideation-artifact.md         # Project vision & questions
├── architecture-spec.md         # System design
└── features/
    ├── FEATURE-001/
    │   ├── state.yaml           # Progress, metrics, metadata
    │   ├── spec.md              # Feature specification
    │   └── dev-artifact.md      # Dev notes, implementation details
    ├── FEATURE-002/
    │   └── ...
```

Plus `.claude/local-state.yaml` tracks your role and current feature.

---

## Error Recovery

**If something goes wrong:**

1. **Conflicted state?**
   - Run `/spec-gantry` again
   - It re-reads all state from disk
   - Most issues resolve automatically

2. **Need to restart a phase?**
   - Edit `state.yaml` (Team Lead only)
   - Set the phase back to `in_progress`
   - Next run picks up from there

3. **Corrupted YAML?**
   - Fix the YAML manually (it's just text)
   - Or delete the file and re-run the phase

4. **Lost work?**
   - If you pushed to git, it's in git history
   - If not pushed, work is in the `specs/` folder
   - Worst case: You have what you wrote, start fresh

---

## Next Steps

- [**Getting Started**](../getting-started/) — Installation walkthrough
- [**Skills Guide**](../skills/) — What each skill does
- [**FAQ**](../faq/) — Troubleshooting

**You're ready to use SpecGantry!** 🚀
