---
layout: docs
title: "AI Development Costs Are Visible — If You Track Them at the Right Level"
description: "Real-time cost tracking isn't a nice-to-have in AI-assisted development. It's a project management discipline. Here's why SpecGantry built it into the framework itself."
permalink: /blog/realtime-cost-tracking
---

# AI Development Costs Are Visible — If You Track Them at the Right Level

*June 2026 · Economics · 8 min read*

---

There's a pattern playing out in teams that have adopted AI coding assistants seriously.

Month one: everything feels fast. Features ship, prototypes materialize, and the productivity gains are real. Month two: someone checks the Anthropic billing dashboard and the number is larger than expected. Month three: a finance conversation that nobody wanted to have.

The problem isn't that AI development is expensive. For most projects it's remarkably cost-effective — a complete feature that would have taken three days of senior engineering time might cost $3–8 in tokens. That's an extraordinary value proposition.

The problem is that **cost is invisible until it isn't.** And by the time it is, the habits are set, the team doesn't know which phases drove the spend, and there's no data to inform decisions about where to optimize.

---

## Why Token Costs Are Harder to Track Than You Think

Traditional software development costs map cleanly to time. Hours times rates equals budget. You can see the work happening, you can estimate remaining effort, and you can course-correct mid-project.

Token costs don't work that way. They're:

**Invisible in the moment.** When a developer is deep in a complex feature spec with an AI assistant, they're thinking about the spec — not the fact that each turn of a long conversation adds input tokens because the full context is re-sent on every call.

**Nonlinear.** A well-structured 10-turn session might cost a fraction of what a poorly-structured 40-turn session costs. A developer who restarts an agent session five times while working through a complex architecture decision is spending more than one who completes it in one focused session. Neither developer has any visibility into this.

**Distributed.** In a team setting, multiple developers are running agent sessions simultaneously. The cost of a release isn't just your sessions — it's every session across every developer working that sprint. Nobody sees the aggregate.

**Invisible by phase.** Ideation costs less than architecture, which costs less than complex feature development. But which features cost the most? Which phases dominate spend? Without instrumentation, you don't know.

**Post-hoc by default.** Virtually every AI cost tracking tool tells you what you spent last month. That's useful for accounting. It's useless for project management.

---

## The Problem With "We'll Check at the End"

Here's the failure mode we see consistently.

A team ships release 1.0.0 of a product. It goes well. The AI-assisted approach worked. They check costs: $180 for the whole initial development cycle. Totally reasonable.

They start release 1.1.0. More features, more complexity, bigger codebase. The agents are working against more context per session. A few features require multiple spec revisions. The architecture got expanded during the cycle.

Invoice: $340.

Nobody saw it coming because nobody was watching it as it accumulated. There was no moment where someone could have said "this feature cost $45 to spec — let's look at whether we're writing specs efficiently." Or "we've spent $80 on architecture amendments this sprint — are we adding too much scope mid-cycle?"

The data to have those conversations existed. It just wasn't surfaced in time to act on it.

---

## Cost Tracking as a Development Discipline

The teams that handle this well treat AI cost tracking the same way they treat time tracking or CI metrics: as a first-class signal in the development process, not an afterthought.

Concretely, that means:

**Knowing cost by phase.** If your architecture sessions are consistently more expensive than your development sessions, that might be fine — architecture is complex. Or it might mean your architecture sessions are running too long because the design questions aren't resolved before the session starts.

**Knowing cost by feature.** A feature that cost $50 to develop is a different story than a feature that cost $8. That difference usually reflects something about the spec quality, the implementation complexity, or how many revision cycles the feature went through. You can't improve what you can't measure.

**Knowing cost by model.** Different SpecGantry agents use different models — ideation uses Haiku (lightweight, fast), architecture and development use Sonnet (capable, more expensive). If your model spend profile looks wrong — too much Sonnet in phases that should be Haiku — that's actionable information.

**Knowing cost by release.** As your project matures and the codebase grows, per-feature costs may increase because agents are working against more context. Tracking cost per release lets you spot this trend early.

None of this requires a BI tool or a data engineering team. It requires that cost data is captured accurately, stored alongside the project, and surfaced in the same place developers are already working.

---

## What SpecGantry Does Differently

SpecGantry's approach to cost tracking starts from a different premise than most tools: **cost visibility belongs in the development framework, not in a separate reporting layer.**

The consequence of that premise is that cost data is:

**Automatic.** There's no step where a developer has to remember to log a session or tag it with a project code. Every time a SpecGantry agent completes, a hook fires, reads the actual token counts from the agent transcript, computes cost at current pricing rates, and appends one entry to `specs/cost-log.ndjson`. The developer does nothing.

**Real token counts.** The cost log uses the actual `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens` values from the API response — not estimates, not approximations. Cache writes and cache reads are tracked separately because they have different cost profiles, and conflating them obscures where spend is actually coming from.

**Structured by the pipeline.** Because every agent invocation goes through the SpecGantry pipeline, every cost entry is tagged with its phase (`ideation`, `architecture`, `feature_spec`, `development`, `test`, `deployment`), its feature ID where applicable, its model, and the current release version. The structure that makes the pipeline work is the same structure that makes cost reporting meaningful.

**In git.** `specs/cost-log.ndjson` is committed alongside your architecture spec and feature specs. The whole team sees the same cost history. It survives machine changes, team member turnover, and project handoffs.

**Priced at current rates.** The MCP server fetches live pricing from Anthropic's pricing page on startup and caches it. If the fetch fails, it falls back to known rates. Cost entries show whether live or fallback pricing was used.

---

## The /track-cost Dashboard

Running `/track-cost` from anywhere in Claude Code opens a dedicated cost dashboard. The default view shows spend by phase for the current release:

```
Cost Summary  |  release 1.1.0

Phase           Tokens       Cost
────────────────────────────────
ideation         4,404      $0.47
architecture     8,201      $0.82
feature_spec    14,209      $1.43
development     31,445      $3.14
test             6,112      $0.31
deployment       3,890      $0.39
────────────────────────────────
Total           68,261      $6.56
```

From there, three drill-down views are one keypress away:

**By Feature** — which features cost the most, without the phase noise:

```
Feature          Tokens       Cost
───────────────────────────────────
FEATURE-001      26,209      $2.47
FEATURE-002      18,441      $1.84
FEATURE-003       9,112      $0.46
```

**By Release** — how costs have evolved across the project lifetime:

```
Release      Tokens       Cost
──────────────────────────────
1.0.0        80,601      $7.79
1.1.0        42,340      $4.12
```

**By Model** — where spend is concentrated across model tiers:

```
Model           Tokens       Cost
──────────────────────────────────
sonnet-4-6      62,301      $6.23
haiku-4-5       18,300      $0.92
```

All four views are available from within the same dashboard — no separate tool, no browser tab, no export required.

---

## SpecGantry as the Full Stack

Most AI development tools solve one problem. Code generation tools help you write code faster. Project management tools help you track what needs to be done. Cost monitoring tools tell you what you spent.

SpecGantry is intentionally all three, because they can't actually be separated cleanly in AI-assisted development.

**Cost tracking only makes sense with pipeline structure.** A cost entry that says "you spent $3.14 on development" is marginally useful. A cost entry that says "you spent $3.14 on `development` phase for `FEATURE-007` in `release 1.1.0` using `claude-sonnet-4-6`" is actionable. That specificity comes directly from the pipeline structure — phases, features, releases — that SpecGantry enforces.

**Project management only works if the pipeline is real.** Knowing that FEATURE-007 is "in development" means nothing if "in development" just means someone is editing files. SpecGantry's pipeline gates — spec before build, spec reviewed before development, tests passing before deployment — mean the status is trustworthy. The Team Lead's dashboard reflects actual state, not developer self-reporting.

**Development quality requires cost awareness.** When developers know that their spec revision cycles are visible in the cost log, there's a natural incentive to get specs right the first time. When a Team Lead can see that a particular feature cost three times more than comparable features to build, that's a conversation worth having — was the feature genuinely harder, or did the development cycle include a lot of rework?

---

## For Solo Developers

The cost tracking argument applies as much to solo developers as to teams — arguably more, because there's no one else to catch a runaway spend before it hits the invoice.

For a solo developer building an enterprise application, SpecGantry's cost visibility answers questions like:

- Is my architecture too complex for what I'm actually building? (Compare architecture cost vs. total project cost.)
- Am I spending too many tokens on feature spec revisions? (Feature cost per phase.)
- Did this new release cost more than the initial build? (By release view.)
- Am I using the right model for each phase? (By model view.)

These are questions that experienced developers ask themselves implicitly. SpecGantry just gives you the data to answer them explicitly.

---

## The Broader Point

AI-assisted development is still young as a discipline. Teams are still figuring out the right processes, the right habits, and the right instrumentation. Cost visibility is one of those things that looks like a nice-to-have until you've worked on a few AI-assisted projects and seen how spend accumulates invisibly.

Building it into the framework — so it's automatic, structured, and co-located with the project itself — is the right answer. The alternative is discovering, three months into a project, that you've spent more than expected and you have no data to understand why.

SpecGantry exists because structure matters in AI-assisted development. Cost transparency is part of that structure.

---

*SpecGantry is open source under Apache 2.0. Install it in 90 seconds: `claude plugin marketplace add https://github.com/specgantry/specgantry.github.io && claude plugin install spec-gantry`*

---

<div class="next-steps-grid">
  <a href="/docs/skills#track-cost" class="next-step-card">
    <div class="next-step-icon">💰</div>
    <div>
      <strong>/track-cost Reference</strong>
      <span>All four cost dashboard views explained with examples.</span>
    </div>
  </a>
  <a href="/docs/how-it-works#cost-tracking" class="next-step-card">
    <div class="next-step-icon">⚙️</div>
    <div>
      <strong>How Cost Tracking Works</strong>
      <span>The hook architecture, token counting, and pricing resolution explained.</span>
    </div>
  </a>
</div>
