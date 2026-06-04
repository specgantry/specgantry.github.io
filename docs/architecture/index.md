# SpecGantry Architecture

Design decisions, system boundaries, and technical implementation.

---

## Design Philosophy

SpecGantry is built around **three core principles:**

### 1. Structure Before Code

The system enforces that specs, architecture, and planning happen **before** development begins. This is not advisory — it's a hard gate in the pipeline.

**Implementation:** Phase gates in state machine prevent code without prior spec approval.

### 2. Session Safety by Default

Every phase writes state to disk immediately. If a session is interrupted, the next invocation picks up exactly where it left off. Zero data loss by design.

**Implementation:** YAML-based state files in `specs/` directory, updated after every question/section.

### 3. Role-Based Access Control

Team Leads and Developers have different views and permissions. Role determines what they can see and do.

**Implementation:** State machine checks role before allowing actions.

---

## System Architecture

```
Claude Code (IDE)
    ↓
SpecGantry Plugin
    ├── skills/
    │   ├── spec-gantry              (Dashboard & orchestrator)
    │   ├── start-project            (New project setup)
    │   ├── bugfix                   (Bug logging)
    │   ├── reverse-engineer         (Code analysis)
    │   └── update-pricing           (Cost tracking)
    │
    └── agents/
        ├── orchestrator.md          (Coordinates phases)
        ├── ideation-agent.md        (Project clarification)
        ├── architecture-agent.md    (System design)
        ├── feature-spec-agent.md    (Feature specs)
        ├── dev-agent.md             (Development)
        └── test-agent.md            (Testing)

        ↓
    Project Directory
        ├── specs/
        │   ├── project-state.yaml
        │   ├── ideation-artifact.md
        │   ├── architecture-spec.md
        │   └── features/
        │       └── FEATURE-XXX/
        │           ├── state.yaml
        │           ├── spec.md
        │           └── dev-artifact.md
        │
        └── .claude/
            └── local-state.yaml
```

---

## State Machine

SpecGantry operates as a finite state machine with the following states:

```
┌─────────────┐
│   INIT      │ No project detected
└──────┬──────┘
       │ /start-project
       ↓
┌─────────────────┐
│   IDEATION      │ Answering project questions
└──────┬──────────┘
       │ Ideation complete
       ↓
┌──────────────────┐
│   ARCHITECTURE   │ Defining tech stack & system design
└──────┬───────────┘
       │ Architecture complete
       ↓
┌──────────────────┐
│   BACKLOG_READY  │ Features created, ready to assign
└──────┬───────────┘
       │ Developer assigned to feature
       ↓
┌──────────────────┐
│   FEATURE_SPEC   │ Writing feature specification
└──────┬───────────┘
       │ Spec approved by Team Lead
       ↓
┌────────────────┐
│   BUILD        │ Implementing feature
└──────┬─────────┘
       │ Build complete, tests pass
       ↓
┌────────────────┐
│   DEPLOY       │ Ready for production
└────────────────┘
```

---

## Data Model

### Project State (`specs/project-state.yaml`)

```yaml
project:
  name: "My Application"
  vision: "Solve X problem for Y users"
  created_at: 2026-01-15
  team_lead: "alice"

backlog:
  - id: "FEATURE-001"
    title: "User authentication"
    status: complete
    assignee: "bob"
    size: medium
    dependencies: []
  
  - id: "FEATURE-002"
    title: "Payment processing"
    status: in_progress
    assignee: "bob"
    size: large
    dependencies:
      - "FEATURE-001"

architecture_open_questions: []
token_usage:
  ideation:
    input_tokens: 45000
    output_tokens: 12000
  architecture:
    input_tokens: 87000
    output_tokens: 23000
```

### Feature State (`specs/features/FEATURE-XXX/state.yaml`)

```yaml
feature:
  id: "FEATURE-001"
  title: "User authentication"
  domain: "auth"
  assignee: "bob"
  
status:
  spec_started: true
  spec_complete: true
  spec_reviewed: true
  dev_complete: true
  tests_passing: true
  deployment_status: complete
  
metrics:
  complexity: "medium"
  estimated_tokens: 50000
  actual_tokens: 48000

timestamps:
  created: 2026-01-16
  spec_approved: 2026-01-17
  deploy_complete: 2026-01-19
```

### Local State (`.claude/local-state.yaml`)

```yaml
role: "developer"
current_feature: "FEATURE-001"
last_session: 2026-01-19T14:30:00Z
```

---

## Skill Architecture

### spec-gantry (Main Dashboard)

**Responsibility:** Orchestrate the user experience.

**Workflow:**
1. Read all state files
2. Calculate current phase and next actions
3. Render dashboard
4. Wait for user input
5. Invoke appropriate agent
6. Loop back to step 1

**Entry point:** `/spec-gantry`

---

### start-project

**Responsibility:** New project initialization.

**Questions asked:**
- Project name & vision
- Platform/language/framework
- Key non-functional requirements
- Team structure

**Output:** Initializes `specs/project-state.yaml`

---

### reverse-engineer

**Responsibility:** Analyze existing code and suggest structure.

**Process:**
1. Scan directory structure
2. Identify file types and languages
3. Detect frameworks and patterns
4. Propose tech stack
5. Generate initial architecture
6. Create candidate features

**Output:** Proposed `architecture-spec.md` for review

---

### bugfix

**Responsibility:** Log and manage bugs outside normal feature pipeline.

**Workflow:**
1. User describes bug
2. Log with BUGFIX-NNN ID
3. Attach to project state
4. Can be fixed immediately or deferred
5. Can be "graduated" to regular feature

---

### update-pricing

**Responsibility:** Manage token cost tracking.

**Functionality:**
- Update model prices
- View cost breakdowns
- Set budget alerts
- Generate cost reports

---

## Agent Architecture

### orchestrator

**Purpose:** Coordinates skill invocations and state transitions.

**Responsibilities:**
- Read state
- Determine current phase
- Decide next action
- Invoke appropriate agent
- Update state

---

### ideation-agent

**Purpose:** Guide project clarification.

**Process:**
1. Ask clarifying questions
2. Capture stakeholder input
3. Document assumptions
4. Identify constraints
5. Write ideation artifact

**Output:** `specs/ideation-artifact.md`

---

### architecture-agent

**Purpose:** Design system and decompose into features.

**Process:**
1. Review ideation artifact
2. Ask architecture questions
3. Document tech decisions
4. Define system boundaries
5. Create feature candidates
6. Generate backlog

**Output:** `specs/architecture-spec.md` + backlog

---

### feature-spec-agent

**Purpose:** Write detailed feature specifications.

**Process:**
1. Load feature outline from backlog
2. Guide spec writing (requirements, APIs, tests)
3. Validate against architecture
4. Check completeness
5. Support self-review

**Output:** `specs/features/FEATURE-XXX/spec.md`

---

### dev-agent

**Purpose:** Guide feature implementation.

**Process:**
1. Load feature spec
2. Review existing architecture
3. Suggest implementation approach
4. Provide code guidance
5. Track progress
6. Verify against spec

**Output:** Source code + notes in `dev-artifact.md`

---

### test-agent

**Purpose:** Guide testing and deployment verification.

**Process:**
1. Review test requirements from spec
2. Guide test writing
3. Verify all tests pass
4. Check acceptance criteria
5. Clear for deployment

**Output:** Passing tests + verification notes

---

## State Persistence

### Why YAML for State?

- **Human-readable** — Can inspect/edit manually if needed
- **Git-friendly** — Diffs are clear
- **Lossless** — No serialization issues
- **Language-agnostic** — Any tool can read it

### Where State Lives

```
specs/
  ├── project-state.yaml          ← Project-level metadata
  ├── ideation-artifact.md        ← Ideation output
  ├── architecture-spec.md        ← Architecture output
  └── features/
      └── FEATURE-001/
          ├── state.yaml          ← Feature-level metadata
          ├── spec.md             ← Feature specification
          └── dev-artifact.md     ← Dev implementation notes
```

### Persistence Model

**After each user input:**
1. Update relevant state file
2. Write to disk
3. Validate YAML
4. Return to checkpoint

**Result:** If interrupted, next session picks up at next question.

---

## Cost Tracking

Every agent tracks:
- Model used (Opus, Sonnet, Haiku)
- Input tokens
- Output tokens
- Timestamp

**Aggregation:**
- By phase (ideation, architecture, feature, dev, test)
- By feature (cost-per-feature breakdown)
- By team member (cost-per-developer)
- Total project cost

---

## Security Model

### Role-Based Access

**Team Lead can:**
- View all features
- Approve specs
- Deploy features
- Modify backlog
- View all costs

**Developer can:**
- See their assigned features
- View architecture (read-only)
- Write specs
- Implement and test
- Request approval

### File Permissions

State files are plain text in the project repo. Security relies on:
- Git access controls
- Repository permissions
- Team trust
- Code review process

---

## Scalability

### Single File Limitations

State files are stored per-feature:
```
features/FEATURE-001/state.yaml
features/FEATURE-002/state.yaml
...
```

**This scales well for:**
- Up to ~100 features per project
- Multiple parallel features (different developers)
- Feature reordering and reassignment

**If you hit limits:**
- Archive old features
- Start a new project phase
- Contact support

---

## Extension Points

SpecGantry is designed to be extended:

1. **Custom agents** — Add domain-specific guidance
2. **Custom skills** — Add workflow steps
3. **Custom phases** — Extend beyond standard pipeline
4. **Custom validation** — Add architecture checks

See [Contributing](../../CONTRIBUTING.md) for details.

---

## Performance Characteristics

- **Dashboard render:** <1 second (reads all state)
- **State update:** <100ms (writes one file)
- **Phase transition:** <500ms (orchestrator + state update)
- **Agent invocation:** Depends on model (typically 1–5 minutes)

---

## Next Steps

- [**Getting Started**](../getting-started/) — Install & first run
- [**How It Works**](../how-it-works/) — Pipeline details
- [**Contributing**](../../CONTRIBUTING.md) — Extend SpecGantry

---

**Questions?** Open an issue on [GitHub](https://github.com/specgantry/specgantry.github.io/issues)
