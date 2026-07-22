# State Files Reference

Reference for all state files used by the SpecGantry v7 orchestrator and agents.

---

## `specs/project-state.yaml`

Pipeline state. Written by the orchestrator. Agents read it; only the orchestrator writes it (with exceptions noted below).

```yaml
project:
  name: "My Project"
  created: 2026-07-19
  release: "1.0.0"
  next_release_type: null        # patch | minor | major | null
  active_capability: null        # CAP-NNN or null
  active_phase: null             # see valid values below

ideation_complete: false
arch_seeded: false
pending_arch_gap: null           # { reason, resume_phase } or null
pending_spec_gap: null           # { cap_id, reason, resume_phase } or null
auto_continue: false

cwj_loop:
  max_iterations:
    ideation: 5
    spec: 3
    code: 3

capabilities:
  CAP-001:
    title: "Menu item management"
    spec_done: false
    built: false
    deployed: false
    depends_on: []
    cwj_iterations:
      spec: 0        # number of full spec CWJ cycles completed
      code: 0        # number of full code CWJ cycles completed
    exit_reason:
      spec: null     # achieved | capped | cycling
      code: null
    narrative: null  # synthesized journey paragraph — rewritten after each judge/challenger verdict

narrative: null      # project-level narrative — written at ideation exit, rewritten on REQUIREMENT_DRIFT
```

**Valid `active_phase` values:**
`ideation_challenge` · `ideation_judge` · `ideation_write` ·
`spec_challenge` · `spec_write` · `spec_judge` ·
`code_plan` · `code_build` · `code_challenge` ·
`deployment` · `investigation` · `amendment` · `null`

**Write ownership:**
- `built: true` — orchestrator only (after code CWJ loop exits achieved)
- `spec_done: true` — orchestrator only (after spec judge returns CLEAR and user approves)
- `deployed: true` — deployment agent
- `project.release` / `project.next_release_type` — orchestrator only
- `cwj_iterations` — orchestrator only (increments after each full CWJ cycle)
- `exit_reason` — orchestrator only (records how the loop exited)
- `pending_spec_gap` — code-build agent or orchestrator
- `pending_arch_gap` — spec-write agent or code-build agent
- `narrative` (project-level) — ideation-write-agent (normal + amendment mode), reverse-engineer-subagent
- `capabilities.[CAP-ID].narrative` — spec-write-agent (spec phase), code-build-agent (code phase)

---

## `specs/north-star.md`

The cognitive contract for the project. Flowing prose — no headings, no sections. Written at ideation exit by `ideation-write-agent`. Extended by `spec-write-agent` when new requirements surface during spec phase. Ends with a `---` separator followed by a flat list of challenge questions (the appendix).

Read by: ideation challenge + judge, spec challenge + judge, code challenge.
Written by: ideation-write-agent (initial), spec-write-agent (appended paragraphs + appendix questions).

---

## `specs/architecture/architecture.md`

Pure technical decisions. Uses `## section:name` anchors for surgical reads. All architecture content in one file — no separate data-model.md, actors.md, etc.

Sections: `vision`, `tech-stack`, `data-model`, `actors`, `api-interfaces`, `deployment`, `guardrails`, `configuration`.

Read by: spec-write-agent, code-plan-agent, code-build-agent, deployment agent.
Written by: ideation-write-agent.

---

## `specs/changelog.md`

Append-only release history. One block per release. Created by the orchestrator on first release bump (after 1.0.0). Read by spec-write-agent and code-plan-agent before referencing any field or interface.

Format:
```
## Release 1.1.0 — 2026-08-01
- Added: bulk_import capability
- Changed: user.name split into user.first_name + user.last_name
- Deprecated: POST /api/submit (use POST /api/submissions)
- Dropped: user.profile_image (use avatar_url)
```

---

## `specs/capabilities/[CAP-ID]/intent.md`

Two paragraphs. Written by ideation-write-agent at ideation exit.

Paragraph 1: What the user does, what the system does in response, governing rules.
Paragraph 2: What "done" looks like, what failure looks like, edge cases specific to this capability.

Read by: spec challenge + write + judge, code plan + challenge.

---

## `specs/capabilities/[CAP-ID]/capability-spec.md`

Developer contract. YAML frontmatter + sections. Written by spec-write-agent. Max ~70 lines.

Frontmatter: `cap_id`, `title`, `depends_on`, `reads` (sections from architecture.md this spec depends on).

Sections: `## Criteria`, `## Interfaces`, `## State`, `## Layout`, `## Data`.

Read by: code-plan-agent, code-build-agent, spec-judge-agent.

---

## `specs/capabilities/[CAP-ID]/build-report.yaml`

Written by code-build-agent after completing the build.

```yaml
cap_id: CAP-001
iteration: 1
overall_status: pass | fail
source: built | reverse-engineered
runtime:
  exposed_ports: [3000]
  start_command: "node src/server.js"
  source_root: "src/"
  language: node
  has_migrations: false
files_modified:
  - src/api/items.js
gap_specs: []
warnings: []
test_plan:
  - criterion: "Item appears in list after creation"
    method: "POST /api/items, then GET /api/items — item present"
quality:               # written by orchestrator after CWJ loop exits
  overall: pass | partial | capped
  iterations: 2
  exit_reason: "challenge agent confirmed CLEAR"
```

---

## Scratchpad and session files (gitignored)

| File | Written by | Deleted by | Purpose |
|---|---|---|---|
| `specs/.ideation-turn.md` | Orchestrator | Orchestrator on exit | Current ideation Q&A turn state |
| `specs/.capability-spec-turn.md` | Orchestrator | Orchestrator on exit | Current spec turn state |
| `specs/.investigate-turn.md` | Orchestrator | Orchestrator on exit | Current investigation turn state |
| `specs/capabilities/[CAP-ID]/.cwj-loop.yaml` | Orchestrator | Orchestrator on loop exit | CWJ loop state per capability |
| `specs/scratchpad/` | Any agent | Agent or orchestrator | Intermediate scratch files |
| `specs/.agent-stamp-*.json` | Hooks (SubagentStart) | Hooks (SubagentStop) | Token byte-offset stamps for cost tracking |

---

## `.gitignore` entries (added by init_project)

```
specs/.ideation-turn.md
specs/.capability-spec-turn.md
specs/.investigate-turn.md
specs/scratchpad/
specs/capabilities/*/.cwj-loop.yaml
specs/.agent-stamp-*.json
```
