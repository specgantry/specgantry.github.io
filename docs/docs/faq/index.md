---
layout: docs
title: FAQ
description: Common questions about SpecGantry v7 — installation, the CWJ loop, developer intelligence, and troubleshooting.
permalink: /docs/faq/
prev_page: "Reference"
prev_page_url: "/docs/architecture"
---

# Frequently Asked Questions

---

## Installation

**How do I install SpecGantry?**

```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

Both commands are required in order. The marketplace must be registered before the plugin can be installed. You only need to add the marketplace once.

**How do I update SpecGantry?**

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

Or from within Claude Code:
```
/plugin marketplace update spec-gantry && /plugin update spec-gantry@spec-gantry
```

**Where is the plugin installed?**

In your Claude home directory, typically `~/.claude/plugins/spec-gantry/`. The plugin runs entirely within Claude Code — no global npm install, no system-level changes.

**Does it work offline?**

Yes. All agents run locally within Claude Code. The only network calls are to the Anthropic API (for Claude), the plugin marketplace (for updates — only when you explicitly run the update command), and optionally a version check on session start.

**Does SpecGantry require git?**

No, but it's strongly recommended. All specs are plain-text YAML and Markdown designed to be committed — meaningful diffs, full history, and a single source of truth across sessions.

---

## The CWJ Loop

**What is the CWJ loop?**

Challenge-Write-Judge. Every phase in SpecGantry runs the same loop: a challenge agent asks what would block the next phase, a write (or build) agent resolves the challenges, and a judge agent asks "would the next phase still be blocked?" If yes: another cycle. If no: the loop exits CLEAR.

The challenger's identity differs by phase:
- **Ideation:** senior developer pre-build — finds what would stop a developer agreeing to start
- **Spec:** developer-proxy — finds what would block a developer trying to build from this document
- **Code:** user-proxy — finds whether a user can actually accomplish what was promised

**What is the north star in v7?**

A single `specs/north-star.md` per project — flowing prose written during ideation from the actual idea. No headings, no sections. Paragraphs describing what good looks like for this system specifically. It ends with a flat list of the challenge questions that shaped it.

It grows across the lifecycle: the spec write agent appends paragraphs when new requirements surface. It is read whole by every challenger and judge at every phase.

**What happened to EXECUTION_GAP and GOAL_GAP?**

These v6 concepts are replaced in v7 by the CWJ loop. The judge returns CLEAR or BLOCKED — no verdict taxonomy. When something is wrong post-deploy, the investigate agent classifies the root cause as CODE_BUG, SPEC_GAP, REQUIREMENT_DRIFT, or NEW_CAPABILITY and routes to the right repair phase automatically.

**What happens when the loop caps?**

The unresolved gaps are surfaced to you: `[Y] Accept and continue · [E] Address manually · [X] Stop`. Accepting continues the pipeline with the partial output and marks the capability as built with known gaps noted.

**What is CYCLING?**

If the judge finds the same blocking gaps across two consecutive iterations, the loop is stuck. The orchestrator detects this and exits with the same CAPPED banner — same user options, same outcome.

**How many iterations does each phase run?**

Default maximums: ideation 5, spec 3, code 3. Configurable in `project-state.yaml` under `cwj_loop.max_iterations`.

---

## Ideation Phase

**How does the ideation challenge loop work?**

The challenge agent fires up to 7 blocking questions per round, grouped by theme. All questions surface at once — the user answers all of them in a single response. The judge then evaluates whether a developer could start writing specs without inventing answers. If BLOCKED, another round with the answers as additional context.

**Why do all questions surface at once instead of one at a time?**

Batching questions per round is faster (one pause vs. seven), and it lets the user see the full scope of what's unresolved before answering. Answers to related questions often inform each other.

**What does the ideation write agent produce?**

`specs/north-star.md` — the per-project cognitive contract, flowing prose.  
`specs/architecture/architecture.md` — pure technical decisions with `## section:name` anchors.  
`specs/capabilities/[CAP-ID]/intent.md` — one per capability.  
`specs/project-state.yaml` — with capability list, iteration counts per phase, and pipeline flags.

The write agent runs only once, after the judge returns CLEAR — not per cycle.

---

## Spec Phase

**What does the spec challenge agent actually check?**

It simulates a developer who has just been handed the intent file and asks "wait, but what about...?" Specifically: loading and async states, empty states, error states with message text and recovery, output format and layout, navigation flow (where the user comes from and goes to), data operations, and whether the intent delivers what the north star promises.

**What does "machine-challenged" mean on the approval prompt?**

It means the spec judge confirmed a developer could build this capability without inventing any answer before surfacing the spec to you. You're reviewing a spec that has already been challenged by a developer-proxy — not a first draft.

**Can I edit the spec after the judge approves?**

Yes. Type `[E]` instead of `[Y]` at the approval prompt. Your edit text is prepended as a new challenge and the write agent resolves it before re-surfacing for approval.

**What is the 80-line limit on capability specs?**

Capability specs are developer contracts, not documentation dumps. The architecture provides shared context; the spec references it. If a spec exceeds 80 lines substantially, it is flagged as potentially oversized — the orchestrator notes it but does not block.

---

## Code Phase

**Why doesn't the code challenge run on iteration 1?**

On iteration 1, nothing has been built yet — there are no source files or build reports to evaluate. The challenge agent would have nothing to read and would return vacuously CLEAR. The loop skips directly to plan+build on iteration 1, then the challenge fires after the first build.

**What does the quality block in build-report.yaml contain?**

```yaml
quality:
  overall: pass
  iterations: 2
```

**What does `quality: capped` mean?**

The maximum iteration count was reached with unresolved gaps. The capability is still marked built; the report documents what remains. The deployment agent will surface a non-blocking warning.

**What is a spec-classified gap?**

When the code challenge agent finds that the north star requires something the spec never captured, it routes to the spec phase before any code repair — fixing the spec first, then rebuilding. This is why the same code repair iteration on a spec-level gap never converges: the spec must be corrected first.

---

## State and Progress

**How does session resume work?**

All progress is saved after every answer and every phase transition. On resume, SpecGantry reads `project-state.yaml` to determine exactly where to pick up — which capability was active, which phase it was in — and continues from that point. No work is lost.

**How does auto-continue work?**

Type `[>]` to enable. The pipeline runs without pausing at spec approval prompts — a judge-validated spec is auto-approved. Auto-continue stops at: spec gaps, arch gaps, loop caps, all capabilities built, subagent errors. When it stops, the full dashboard re-renders.

**Can I hold a capability mid-spec?**

Yes. Type `[X]` at the spec approval prompt. The capability is left with `spec_done:false`. Type the capability ID to resume — the held spec is shown for review.

---

## Costs and Developer Intelligence

**How does cost tracking work?**

The `SubagentStop` hook fires automatically when each agent completes. Token counts are read directly from the agent transcript — exact API values. One entry is appended to `specs/cost-log.ndjson` per agent run.

**What are the three columns in /track-cost?**

**Challenge** — the cost of adversarial questioning. Low, high leverage.  
**Write** — the cost of generating artifacts and code. Dominates total spend.  
**Judge** — the cost of the unblock check. Consistent; a high judge cost relative to challenge signals repeated rejection.

**What is an outlier in the insights view?**

Any capability where the code phase ran more than one cycle is marked `◀ outlier`. The insights view shows which challenge triggered each repair cycle and what the exit was.

**What does challenge density measure?**

The average number of questions the challenge agent fired per cycle, per phase. High density in spec (5–6 questions/cycle) signals a capability that wasn't well-understood going in. High density in code signals a mismatch between the north star's promises and what was built.

**Why are costs not being recorded?**

Cost tracking requires Node.js. Check that `node` is available in your shell:

```bash
node --version
```

If Node.js is installed but costs still aren't recording, enable debug logging:

```bash
SPEC_GANTRY_LOG_LEVEL=debug /spec-gantry
```

Check `~/.claude/logs/spec-gantry-hooks.log` for errors.

---

## Engagement Hooks

**What are engagement hooks?**

When SpecGantry detects a project (`specs/project-state.yaml` exists), it automatically installs a `SessionStart` hook into `.claude/settings.json`. On every session start, the hook injects `CONTRACT.md` — a binding directive telling Claude to always route development through `/spec-gantry` — as system context before the first message.

**What is CONTRACT.md?**

A short file (gitignored) containing instructions for Claude: route all development through `/spec-gantry`, never make code changes directly. It is re-generated on every project setup.

**Are the hook files safe to commit?**

`settings.json` and the hook script are safe to commit. `CONTRACT.md` is gitignored by default — it's regenerated on setup and adds noise with no benefit if committed.

---

## Advanced

**Can I use SpecGantry with other AI tools?**

Yes. SpecGantry manages the pipeline and specs. The build agent writes standard source code — no SpecGantry-specific runtime dependencies. You can run, test, and deploy the output with any tool.

**Can I adjust the capability scope after ideation?**

Yes. Use `[N] New work` and describe the change. The investigate agent classifies it — if it's `NEW_CAPABILITY`, ideation re-enters in amendment mode, which extends the north star and architecture without re-running full ideation. Existing capability flags are preserved.

**What is v7 vs v6?**

v7 replaces the Plan-Produce-Evaluate loop with Challenge-Write-Judge. The key shift: PPE asked "did produce follow the plan?" — a compliance check. CWJ asks "would the next phase be blocked?" — a cognitive check. The north star moves from three fixed documents shipped with the plugin to one per-project flowing prose document written from the actual idea. Stories become capabilities. The investigate agent gains diagnostic classification. Developer intelligence replaces the cost ledger.

**How do I migrate a v6 project to v7?**

Open Claude Code in your v6 project directory and run `/spec-gantry`. The reverse-engineer agent detects the existing `specs/stories/` structure and synthesises a v7 project structure — north-star.md, architecture.md, and capability stubs — from the existing files. Existing built capabilities are preserved.
