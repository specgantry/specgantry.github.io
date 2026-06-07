# Contributing to SpecGantry

SpecGantry is a Claude Code plugin built entirely from Markdown agent/skill files and a bash hook. Adding or customizing it requires no compilation — edit the relevant `.md` files and Claude Code picks up the changes.

---

## Adding a New Subagent

1. Create a Markdown file in the appropriate `agents/` subdirectory:
   ```
   agents/[phase]/your-agent-name.md
   ```

2. Add YAML frontmatter at the top:
   ```yaml
   ---
   name: your-agent-name
   description: One-sentence description of what this agent does and when it runs
   model: haiku   # or sonnet — choose based on task complexity
   tools: Read, Write, Bash   # only the tools this agent genuinely needs
   ---
   ```

3. Write the system prompt below the frontmatter. Cover:
   - What input it reads (which artifact file, or what the orchestrator passes)
   - What analysis or action it performs
   - What it outputs and where it writes its output (`specs/` for committed artifacts)
   - What it reports back to the orchestrator

4. Register the agent in `.claude-plugin/plugin.json` under `"agents"`:
   ```json
   "agents": [
     "...",
     "your-phase/your-agent-name"
   ]
   ```

5. Update `agents/orchestrator.md` to route to your new agent at the appropriate phase.

### Model Selection Guidelines

| Task type | Model |
|---|---|
| Text classification, brief analysis, simple parsing | `haiku` |
| Technical writing, architecture decisions, code review | `sonnet` |
| Complex multi-file implementation | `sonnet` |

Default to Haiku unless the task requires reasoning across large context or producing complex structured output.

---

## Customizing Phase Gates

Phase gate logic lives in `skills/spec-gantry/SKILL.md` under **Gate & Routing Actions**.

To add a new gate condition:
1. Add a new field to the `phase_gates` block in the initial YAML template (in `skills/spec-gantry/SKILL.md` under **init_project**)
2. Add a gate check entry in the relevant action section of `skills/spec-gantry/SKILL.md`
3. Update the stage completion logic in the Feature Pipeline section to reflect the new gate flag

### Adding a New Phase

To add a phase between existing ones (e.g. a `security-review` phase between development and deployment):

1. Add a new agent: `agents/security/security-reviewer.md`
2. Register it in `.claude-plugin/plugin.json`
3. Add the new phase to the orchestrator's routing table in `orchestrator.md`
4. Add the new phase gate flag to the initial YAML: `security_review_complete: false`
5. Update the stage completion logic in `skills/spec-gantry/SKILL.md`
6. Document the new phase in `README.md`

---

## File Naming and Path Conventions

| Type | Location | Notes |
|---|---|---|
| Agent prompts | `agents/[phase]/` | kebab-case, matches `name:` frontmatter |
| Skills | `skills/[name]/SKILL.md` | kebab-case, matches `name:` frontmatter |
| Hooks | `hooks/` | `on-[event].sh` |
| Plugin manifest | `.claude-plugin/plugin.json` | agent/skill/hook registration |
| Pricing history | `config/pricing-history.yaml` | committed to plugin repo |

**Runtime output (written to target project):**

| Artifact | Location | Committed |
|---|---|---|
| `project-state.yaml` | `specs/` | yes |
| `ideation-artifact.md` | `specs/` | yes |
| `architecture-spec.md` | `specs/` | yes |
| `deploy-artifact.md` | `specs/` | yes |
| `feature-spec.md` | `specs/features/[id]/` | yes, on dev branch |
| `state.yaml` | `specs/features/[id]/` | yes, on dev branch |
| `dev-artifact.yaml` | `specs/features/[id]/` | yes, on dev branch |
| `local-state.yaml` | `.claude/` | no — gitignored |

---

## Testing the Plugin

Since SpecGantry has no compiled code, testing is functional — run through the workflows and verify behaviour.

### Full pipeline test

1. Open a test project in Claude Code with SpecGantry installed
2. Run `/spec-gantry` — verify the dashboard renders with the disclaimer header
3. Choose option `[1] Start a new project` — verify `specs/project-state.yaml` and `.claude/local-state.yaml` are created
4. Complete the ideation phase — verify `specs/ideation-artifact.md` is written with a `## Recommendation` section
5. Complete the architecture phase — verify `specs/architecture-spec.md` and backlog entries in `specs/project-state.yaml`
6. As a developer, pick up a feature — verify `specs/features/FEATURE-001/feature-spec.md` is created and written section by section
7. Approve the spec — verify `spec_approved: true` is set and code-executor is invoked automatically
8. Complete development — verify `specs/features/FEATURE-001/dev-artifact.yaml` exists with `overall_status: pass`

### Phase gate tests

**Gate 1: Block development without approved spec**
1. Create a feature via `/spec-gantry`
2. Manually create `specs/features/FEATURE-001/state.yaml` with `feature_spec_complete: false`
3. Attempt to invoke code-executor
4. Orchestrator must refuse: `feature-spec.md must exist and pass the feature spec gate`

**Gate 2: Block deployment without passing tests**
1. Reach the development phase
2. Manually create `specs/features/FEATURE-001/dev-artifact.yaml` with `overall_status: fail`
3. Attempt to advance to deployment
4. Orchestrator must refuse and list failing tests

**Gate 3: Bugfix fast-track**
1. Run `/bugfix` with a bug description
2. Verify `specs/features/BUGFIX-001/state.yaml` is created with `hot_path: true` and `feature_spec_complete: true`
3. Verify code-executor is invoked without checking for a feature spec

**Gate 4: Architecture guardrail enforcement**
1. Complete the architecture phase with at least one guardrail
2. Start a feature spec and enter content that violates the guardrail
3. Verify feature-spec-subagent flags the conflict with `⚠ Guardrail conflict:` before writing the section
4. Verify the final `## Guardrail Compliance` section contains `VIOLATION:` and the spec gate fails

---

## Submitting Changes

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-change`
3. Make your changes — agent and skill files only need frontmatter + prompt edits
4. Test manually using the functional test steps above
5. Submit a pull request with a description of what the change does and why
