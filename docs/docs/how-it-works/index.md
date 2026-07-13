---
layout: docs
title: How It Works
description: A complete walkthrough of SpecGantry's pipeline — from raw idea to deployed system.
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills Guide"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

A complete walkthrough of the pipeline and what happens at each phase.

---

## The Pipeline at a Glance

<div class="dg-wrap">
<div class="dg-diagram-title">Pipeline at a Glance</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation</div>
      <div class="dg-flow-node-desc">Mature the idea · shape the system · propose story backlog</div>
      <div class="dg-flow-node-meta">architecture.md · project-state.yaml</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> ideation_complete</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-text"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Story Spec</div>
      <div class="dg-flow-node-desc">Spec each story before any code is written</div>
      <div class="dg-flow-node-meta">story-spec.md per story</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> spec_done per story</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-hammer"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Build</div>
      <div class="dg-flow-node-desc">Implementation · gap specs written if needed</div>
      <div class="dg-flow-node-meta">build-report.yaml · gap.md (if any)</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:520px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> all stories built</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Deploy Release</div>
      <div class="dg-flow-node-desc">Deployment script · whole system · release version bumped</div>
      <div class="dg-flow-node-meta">deploy.sh · deploy-artifact.md</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-neutral">
    <div class="dg-flow-node-icon"><i class="bi bi-arrow-repeat"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">[N] New work — post-release modifications</div>
      <div class="dg-flow-node-desc">Bug fix or enhancement: <strong>Investigate</strong> reads codebase · confirms with you · build agent fixes or writes gap.md · re-deploy</div>
      <div class="dg-flow-node-meta">investigate-subagent (read-only) · then development-subagent</div>
    </div>
  </div>

</div>
</div>

Stories run in dependency order. Once all stories are built, you are prompted at a single confirmation point: gap specs (if any) are shown for review and merge, then you confirm to deploy.

After deployment, use `[N] New work` for any changes. Bug fixes and enhancements always start with the investigation agent — it reads the actual codebase to locate the exact files and root cause before any code is touched.

---

## Video Overview

<div class="video-placeholder">
  <div class="video-placeholder-inner">
    <div class="video-icon">▶</div>
    <div class="video-text">
      <strong>SpecGantry Pipeline Walkthrough</strong>
      <span>Coming soon — a complete walkthrough of all phases from ideation to deployment.</span>
    </div>
  </div>
</div>

---

## The Phases {#phases}

### Phase 1 — Ideation {#ideation}

**Time:** 5–30 minutes (depends on project complexity)
**Output:** `specs/architecture/` (6 artifacts) · story backlog in `specs/project-state.yaml`

Ideation is a single conversation that does two things in sequence: matures the raw idea, then shapes the system. There is no separate architecture phase — the output of the conversation is the architecture.

**Quick-start mode**

After you enter a project name and vision, SpecGantry checks whether the project looks simple — no authentication, no AI integration, single actor type, three or fewer capabilities. If so, it switches to quick-start mode:

```
This looks like a simple single-user app — I can set smart defaults and ask only 3 questions.

  [>] Quick start  (tech stack · Docker Hub username · story list)
  [F] Full ideation  (10 topics, shape every decision)
```

Quick-start sets sensible defaults for all architecture sections (problem & users, constraints, risks, guardrails, configuration, UX model), asks three focused questions, and produces the same complete architecture artifacts as full ideation — just faster. Full ideation is always available via `[F]`.

**Beat 1 — Mature the idea** (full ideation only)

SpecGantry acts as a thinking partner, not an interviewer. It reads your vision and reacts to it using one of three stances:

- **"Yes, and…"** — affirms the direction and extends it with something you may not have considered
- **"Fine, but…"** — accepts the premise but surfaces a tradeoff, constraint, or risk it creates
- **"What about…"** — probes a gap or edge case the vision didn't address

Four topics, one question each: vision, problem & users, constraints, risks & out of scope. After each answer, SpecGantry writes a synthesis — not a transcript of your words, but what it now understands to be true. You confirm a Beat 1 summary before moving on. You can save and stop at the Beat 1 summary — ideation will resume at Beat 2 on the next `/spec-gantry`.

**Beat 2 — Shape the system** (full ideation only)

Directly from the matured idea, SpecGantry proposes the system shape across six topics — each a proposal for you to confirm or redirect, not an open-ended question:

- **Tech stack** — one clear choice per layer
- **Guardrails** — enforceable rules every story must follow
- **Configuration** — every env var the project needs, in a table
- **Story list** — 3–5 vertical slices, dependency-ordered, right-sized. Written to disk on approval.
- **UX model** — navigation pattern, visual system, component conventions
- **Deployment target** — cloud platform, container registry, service architecture, secrets strategy, CI/CD. Each answer is flushed to `specs/architecture/deployment.md` immediately — a crash mid-topic loses at most one answer.

Everything is written to `specs/architecture/` after every answer. A crash mid-session loses at most one exchange.

**Story granularity — Goldilocks rule:**
Stories are building blocks, not micro-tasks. A story is a vertical slice — something completable in 1–3 sessions and demonstrable independently. Related capabilities belong in one story. When in doubt, merge — a story can always be extended later via `[N] New work`.

---

### Phase 2 — Story Spec {#spec-gate}

**Time:** 5–15 minutes per story
**Output:** `specs/stories/STORY-NNN/story-spec.md`

No code is written until a complete spec exists.

The spec covers six sections:

1. **What the user can do** — user-facing capabilities. Every entity the story manages must have its full lifecycle accounted for: list, view, edit, delete. Missing operations must be explicitly declared out of scope with a reason.
2. **Screens and states** — UI flows and state transitions, including empty states, error states, and confirmation dialogs for destructive actions
3. **Data and backend** — data owned, APIs, persistence. Every field named with its type and validation rule. Every endpoint documented.
4. **AI integration** — if AI is used: model ID, literal prompt template (full text, not a description), exact output schema, output-to-UI field mapping, fallback path. The prompt must include an anti-sycophancy instruction. If no AI: marked N/A.
5. **Enterprise checks** — auth, validation, error states, data safety, rate limiting, and a list of any new env vars this story requires
6. **Acceptance criteria** — minimum 4, at least one error-state criterion

Each section is written to disk immediately — sessions resume from the next incomplete section.

After all sections, guardrails from `architecture.md` are checked. Any violation blocks the spec until resolved. You self-review and confirm before build begins.

---

### Phase 3 — Build {#build}

**Time:** Depends on story complexity
**Output:** Source code committed · `specs/stories/STORY-NNN/build-report.yaml` · `specs/stories/STORY-NNN/governor-report.yaml`

The build phase turns the confirmed spec into working code and verifies it meets quality standards before the story is marked done.

**Before the dev agent writes a line**, the Governor reviews the spec and produces a pre-build brief — surfacing ambiguities in acceptance criteria, storage choice questions, UI state gaps, and implementation risks. The dev agent reads this brief as part of its context.

**The dev agent** then builds the full vertical slice — UI, backend, data layer, AI integration — exactly as specced. Key behaviors:
- Respects every guardrail in `architecture.md` and uses env var names exactly as defined in `## Configuration`
- Secrets and all runtime config come from environment variables — no hardcoded values
- Maintains `.env.example` at the project root with every env var the project needs
- Writes machine-readable anchor comments in source files: `@story` (file→story mapping), `@entry` (route/handler entry points), `@contract` (data shapes at layer boundaries), `@gap` (inline at spec divergences)
- Implements a `GET /health` endpoint as the first backend route on any story that exposes a port

**After the build**, the Governor reads the actual code alongside the spec and reviews 7 quality dimensions:

| Dimension | What it checks |
|-----------|---------------|
| Spec adherence | Does the code logic satisfy every acceptance criterion, including error paths? |
| Contract fidelity | Are all required fields in each contract actually populated from real data? |
| Input completeness | Are all required fields validated? Correct error status codes? |
| Persistence appropriateness | Is the storage choice right for the entity's lifecycle and use case? |
| UI quality | Theme consistency, loading/error states, accessibility basics, breakpoints |
| Scope hygiene | Extra code not in the spec, or missing code that is in the spec |
| Cross-story coherence | Consistent field names, error patterns, and naming vs prior stories |

Each dimension produces a verdict: **PASS**, **FLAG**, **ADVISORY**, or **SKIP** (for API-only stories on UI dimensions). If any blocking dimension is flagged, the Governor writes file-specific fix instructions and the dev agent does a full rebuild. This loop continues until all blocking dimensions pass or the configured maximum iterations are reached.

The final outcome is recorded in `specs/stories/STORY-NNN/governor-report.yaml` with status `passed`, `partial` (loop detected), or `capped` (max iterations). A capped or partial story is still marked built — the report documents what remains for the user to decide on.

**Test plan**

The build agent writes a `test_plan` section to `build-report.yaml` — one shell command per observable acceptance criterion, with the health check always first:

```yaml
test_plan:
  - label: "app is healthy"
    cmd: "curl -sf http://localhost:3000/health"
  - label: "POST /api/bookmarks creates a bookmark"
    cmd: "curl -sf -X POST http://localhost:3000/api/bookmarks ..."
  - label: "GET /api/bookmarks/:id returns 404 for unknown id"
    cmd: "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/api/bookmarks/99999 | grep -q 404"
```

After the build and governor review complete, SpecGantry offers to run these checks against your running app:

```
✓ Build complete — STORY-001: Bookmark CRUD API  ·  governor: passed (2 iters)

  [R] Run tests (3 criteria)   [S] Skip
```

`[R]` first checks that the app is responding at `/health` — if not, it skips cleanly and marks the story built without running tests. If the app is up, it runs each command and shows pass/fail per criterion. If any fail you can fix and rebuild, or mark the story built anyway.

`[S]` marks the story built immediately.

**Auto-continue mode** always skips test execution and marks stories built immediately — test verification is a manual checkpoint.

The test plan is also used by the investigation agent when you report a bug later — it runs the same checks to pinpoint which criterion is currently failing before any source code is read.

A story is **complete** once the governor review passes and all acceptance criteria are met (or you choose to proceed).

---

### Phase 4 — Deploy Release {#deploy}

**Time:** 5–10 minutes
**Output:** `specs/deploy.sh` · `specs/docker-compose.yml` · `specs/.env.example` · `src/[story]/Dockerfile` · `specs/deploy-artifact.md`

Once all stories are built (and any gap specs are merged), you are prompted to confirm deployment.

The deployment agent:
1. Gathers any missing deployment details interactively (registry identifier, domain, etc.)
2. Runs platform-specific pre-flight checks (CLI installed, auth active, APIs enabled) — shows a pass/fail table before generating anything
3. Computes the next release version from change types in the backlog
4. Resolves deployment order via the dependency graph
5. Generates per-service Dockerfiles and a `docker-compose.yml` for local production-parity testing
6. Generates `specs/.env.example` with every env var the project needs
7. Generates `specs/deploy.sh` covering build, push, migrations, deploy, and health checks per story — with `--dry-run` for local Docker testing. When `--dry-run` completes successfully, the script prints per-service local URLs, log commands for each service, and the stop command.
8. Validates the script with `bash -n` and sets executable permissions
9. Writes `deploy-artifact.md` summarising the release
10. Marks all stories deployed and updates `project.release`

Every release deploys the **entire system** — not individual stories.

---

### Gap Specs {#gap-specs}

If during development the spec is discovered to be incomplete, incorrect, or has side-effects, the build agent writes to the story's single gap file rather than editing the main spec directly:

**File:** `specs/stories/STORY-NNN/gap.md` — one file per story, persists until deploy-time merge

The gap file records: what changed, which files were affected, side-effects on other stories, and a recommended spec update. The main spec stays stable. Multiple discoveries accumulate as additional bullets in the same file — no new files are created.

### Gap Merge {#gap-merge}

**Time:** 2–5 minutes
**Output:** Updated `story-spec.md` · gap.md deleted

When all stories are built, SpecGantry checks for unmerged gap files and presents any it finds. After confirmation, each gap is merged into the story spec in place (sections edited, not appended). Each `gap.md` is deleted after successful merge. A summary is shown before the deploy prompt.

If no gaps exist, SpecGantry skips straight to the deploy prompt.

---

## Reverse Engineering an Existing Codebase {#reverse-engineering}

If `/spec-gantry` is run in a directory that has source files but no `specs/` folder, it detects this and offers a choice: start a new project or analyse the existing codebase. Selecting reverse-engineer runs a dedicated agent that:

1. **Silently analyses** the codebase — tech stack, structure, user-facing capabilities, auth model, completion level per feature, env vars from `.env.example` or config files, and entry points per story
2. **Presents a story list** with a `Status` column for each story: `built` (fully implemented), `partial` (exists but incomplete), or `missing` (not yet built). You can edit the list — merge, rename, change status — before confirming.
3. **Writes spec files** — `specs/architecture.md` (including a populated `## Configuration` table), `specs/project-state.yaml` with correct `built`/`deployed` flags per story, and stub `build-report.yaml` files for built stories so the deployment agent can read their runtime profiles
4. **Tags source files** — adds `@story`, `@entry`, and `@contract` anchor comments to route/handler files so the investigation agent can navigate the codebase immediately
5. **Confirms** — shows a summary of stories identified, env vars documented, and files tagged

**Status mapping in the pipeline:**
- `built` stories → `built:true · deployed:true` — they enter the pipeline at the modification stage immediately. Use `[N] New work` to fix bugs or add enhancements.
- `partial` / `missing` stories → `built:false · deployed:false` — they follow the normal spec → build → deploy pipeline
- `partial` stories that you'd prefer to treat as enhancements (rather than a full rebuild) can be changed to `built` during the review step

**Routing after reverse-engineering:** the pipeline skips the automatic "Spec next story" action for stories with `built:true · spec_done:false` — these already have running code and don't need a full spec cycle before modifications can begin. Their `~` status in the dashboard shows they have no written spec yet. Type a story ID directly to write its spec at any time.

---

## Release Versioning {#versioning}

SpecGantry uses standard X.Y.Z semver. The version is a project-level concept — not per-story.

- Every project starts at `1.0.0`
- The version only changes when a release is deployed
- The bump is computed automatically from the highest-severity change type across all stories in the release:

| Change type | Bump | Example |
|---|---|---|
| `project_change` | major | `1.0.0` → `2.0.0` |
| `enhancement` or `new_story` | minor | `1.0.0` → `1.1.0` |
| `bug_fix` only | patch | `1.0.0` → `1.0.1` |

The initial release always deploys as `1.0.0`.

---

## The Architecture Artifact {#architecture-artifact}

`specs/architecture/architecture.md` is the single source of truth for the system. It contains:

- **Vision** — what the system is, who it's for, why it's worth building
- **Problem & Users** — user population, use case, success criteria
- **Constraints** — hard stops that architecture must respect
- **Risks & Out of Scope** — top risks with mitigations, explicit v1 deferral list
- **Tech Stack** — confirmed choices per layer
- **Guardrails** — enforceable rules every story must respect
- **Configuration** — env var table: every variable the project uses, its description, and a safe example value
- **Change history** — gap merges append a row to each story spec's change history table; architecture is never overwritten

Story specs **reference** this document rather than duplicating it. This keeps both the architecture and story specs slim.

---

## Handling Changes After Deployment {#post-deployment}

Use `[N] New work` at any point to describe new work — bug fix, enhancement, new story, or architectural change. SpecGantry classifies the work, reads the backlog and story specs to determine what's affected, confirms with you, and re-enters the pipeline.

You can also act on a specific story directly from the dashboard. Type a story ID for a story that is already built — SpecGantry shows an inline prompt:

```
STORY-001: Bookmark CRUD API  ·  ✅ spec · ✅ built
──────────────────────────────────────────────────────────
What would you like to change?  >
```

Describe the change — a bug, an enhancement, or a new feature in that story's area — and SpecGantry routes it correctly without going through the `[N] New work` flow.

| Type | What happens |
|---|---|
| `bug_fix` | Investigation agent reads the codebase to locate the exact files and root cause — confirms findings with you. Build agent uses the findings as a targeted brief. Spec is not touched. Patch release on next deploy. |
| `enhancement` | Investigation agent locates where the change slots in. Orchestrator writes/appends to `gap.md` for the affected story. Build agent implements against spec + gap. Spec merges at deploy time. Minor release on next deploy. |
| `new_story` | Ideation agent runs in amendment mode to assign ID, update backlog and architecture. Then normal pipeline. |
| `project_change` | Ideation agent runs in amendment mode first. Impacted story specs reset for re-spec. |

---

## Session Safety & Resumption

SpecGantry saves progress after every question, every answer, and every section. If a session is interrupted at any point, the next `/spec-gantry` picks up at the next unanswered item. This applies to all phases — ideation, story spec, and build.

---

## Engagement Hooks {#engagement-hooks}

**The problem:** Claude Code sessions have finite context. As a session grows — or after a `/compact` — Claude can lose track of the fact that this project is managed by SpecGantry and start making code changes directly, bypassing the pipeline entirely. Specs drift from code, and the core value of SpecGantry is lost.

**The fix:** when SpecGantry detects a project (`specs/project-state.yaml` exists), it automatically installs three files into the project's `.claude/` directory:

| File | Purpose |
|------|---------|
| `.claude/settings.json` | Registers `SessionStart` and `PostCompact` hooks with Claude Code |
| `.claude/hooks/spec-gantry-contract.sh` | Shell script that reads `CONTRACT.md` and emits it as `additionalContext` |
| `.claude/CONTRACT.md` | The binding directive injected into every session (gitignored) |

**How it works at runtime:**

1. You open Claude Code in the project directory
2. Claude Code fires the `SessionStart` hook — `spec-gantry-contract.sh` runs, reads `CONTRACT.md`, and injects its contents as system-level context before the first message
3. Claude sees the directive before any user input: route all development through `/spec-gantry`, never bypass
4. After `/compact` clears the conversation context, the `PostCompact` hook fires again — same injection, so Claude is immediately re-oriented

**This runs entirely in Node.js via `hooks.js`** — not by Claude, not by the skill. It is deterministic and cannot be skipped.

**Existing projects** get hooks installed automatically on the next session open after updating to v5.2.2+. No manual action needed — `hooks.js` checks for `specs/project-state.yaml` on every `SessionStart` and installs the hooks silently if they are missing.

<div class="info">
  <strong>CONTRACT.md is gitignored.</strong> It is regenerated on every project setup — committing it would add noise with no benefit. The hook script and <code>settings.json</code> are safe to commit if you want them version-controlled.
</div>

---

## Cost Visibility {#cost-tracking}

SpecGantry tracks the real cost of every agent run automatically. Token usage is stored in `specs/cost-log.ndjson` and committed to git. Run `[$] Cost` or `/track-cost` for a breakdown by phase, story, release, and model.

<div class="info">
  <strong>Cost data in git:</strong> <code>specs/cost-log.ndjson</code> is committed alongside your specs — full history of AI development costs over the project lifetime.
</div>

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>Every skill command in detail — when to use each one and what it produces.</span>
    </div>
  </a>
  <a href="/docs/architecture" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-diagram-3"></i></div>
    <div>
      <strong>Reference</strong>
      <span>File structure, security model, design principles, and extension points.</span>
    </div>
  </a>
</div>
