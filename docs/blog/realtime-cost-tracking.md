---
layout: docs
title: "AI Development Costs Are Visible — If You Track the Right Things"
description: "Real-time cost tracking isn't enough in AI-assisted development. You need iteration counts, challenge density, and outlier detection. Here's why SpecGantry built developer intelligence into the framework itself."
permalink: /blog/realtime-cost-tracking/
---

# AI Development Costs Are Visible — If You Track the Right Things

*June 2026 · Economics · 8 min read*

---

There's a pattern playing out in teams that have adopted AI coding assistants seriously.

Month one: everything feels fast. Features ship, prototypes materialize, and the productivity gains are real. Month two: someone checks the Anthropic billing dashboard and the number is larger than expected. Month three: a finance conversation that nobody wanted to have.

The problem isn't that AI development is expensive. For most projects it's remarkably cost-effective — capabilities that would have taken days of senior engineering time can be implemented for a fraction of that cost in tokens. That's an extraordinary value proposition.

The problem is that **cost is invisible until it isn't.** And by the time it is, the habits are set, the team doesn't know which phases drove the spend, and there's no data to inform decisions about where to optimize.

---

## Why Token Costs Are Harder to Track Than You Think

Traditional software development costs map cleanly to time. Hours times rates equals budget. You can see the work happening, you can estimate remaining effort, and you can course-correct mid-project.

Token costs don't work that way. They're:

**Invisible in the moment.** When an agent is running a second CWJ cycle on a capability because the judge rejected the first write, the developer isn't watching it accumulate. The cost is incurred quietly.

**Nonlinear.** A capability that clears the spec loop in one cycle costs a fraction of one that takes three. The difference isn't just the token count — it's a signal about spec quality and ideation depth that affects future capabilities too.

**Distributed across phases.** Challenge, write, and judge agents have different cost profiles. The challenge agent is cheap (Haiku, bounded output). The write and build agents are expensive (Sonnet, long context). Knowing that challenge costs are low but judge costs are high for a specific capability tells you something different than knowing the total.

**Invisible by iteration.** Most cost tools tell you what you spent on a capability. They don't tell you that it took three code cycles — the first two of which were wasted because the spec had a gap the challenge round didn't catch. The same total cost can represent one efficient cycle or three inefficient ones.

**Post-hoc by default.** Virtually every AI cost tracking tool tells you what you spent last month. That's useful for accounting. It's not useful for deciding, mid-capability, whether the current spec is worth continuing or should be re-challenged.

---

## The Problem With Cost Alone

Here's the failure mode we see consistently.

A team ships release 1.0.0. It goes well. They check costs at the end: reasonable for the scope. Good.

They start release 1.1.0. More capabilities, more complexity, bigger codebase. A few capabilities required multiple spec revisions. One capability went through three code cycles because a spec gap was found after the second build.

The invoice for release 1.1.0 is nearly double release 1.0.0.

Nobody saw it coming because the data they were watching — aggregate cost — didn't surface the signals that matter: which capabilities took multiple cycles, which cycles were spec-classified repairs (meaning the spec was wrong going in), and where in the CWJ loop the spend is actually concentrated.

The data to have those conversations existed. It just wasn't surfaced in the right structure.

---

## Developer Intelligence vs Cost Ledger

The teams that handle this well don't just track what they spent. They track:

**Iteration counts per phase.** A capability with `spec: 1 cycle · code: 1 cycle` is straightforward. A capability with `spec: 3 cycles · code: 3 cycles` deserves a look — was it genuinely complex, or was ideation underspecified going in?

**Challenge density.** How many questions did the challenge agent fire per cycle? High density in spec (5–6 questions/cycle) suggests the capability wasn't well-understood when ideation ended. High density in code suggests a mismatch between the north star's promises and what was built.

**Outlier detection.** Which capabilities took more code cycles than the rest? The outlier section in `/track-cost` shows what challenge triggered each repair cycle. Was it a loading state missed in the spec? An error path that returns a raw exception? A design smell caught late? This tells you where to improve the challenge quality upstream.

**Release comparison.** As the project matures and the codebase grows, per-capability costs may increase because agents work against more context. Tracking cost and iteration counts per release lets you spot this trend and ask whether ideation depth should increase.

None of this requires a BI tool. It requires that the data is structured correctly from the start — and that the pipeline produces the right signals.

---

## What SpecGantry Does Differently

SpecGantry's approach to developer intelligence starts from a different premise: **the signals that matter are pipeline signals, not just token signals.**

The consequence of that premise is that the `specs/cost-log.ndjson` entries are tagged with pipeline structure — phase (ideation challenge, spec write, code challenge, etc.), capability ID, model, and release. And `project-state.yaml` tracks iteration counts and exit status per capability per phase.

The `/track-cost` dashboard combines both sources:

**Cost table** — Challenge/Write/Judge columns per capability, per phase. Tells you where token spend goes within each capability.

**Iteration summary** — iteration counts from project-state. Tells you how many cycles each phase took, and which capability was most expensive in cycles, not just dollars.

**Challenge density** — computed from cost-log entries tagged with challenge phase. Tells you how hard each challenge agent had to work per cycle.

**Outliers** — capabilities where code phase ran more than one cycle, with the challenge text that triggered repair. Tells you what specifically was caught late.

**Release comparison** — cost and iteration counts split across releases. Tells you whether the project is getting more expensive per capability as it matures.

Everything automatic. No developer action required. Every agent run captured via the SubagentStop hook using exact API token counts — not estimates.

---

## The /track-cost Dashboard

Running `/track-cost` opens the developer intelligence dashboard:

```
SpecGantry v7  |  HireFlow  |  release 1.1.0
Spec [████] 4/4  ·  Build [████] 4/4
──────────────────────────────────────────────────────────

Release 1.1.0                          Challenge    Write    Judge    Total
───────────────────────────────────────────────────────────────────────────
Ideation                                  $0.22    $0.81    $0.14    $1.17
Investigation                                —     $0.04       —     $0.04
Deployment                                   —     $0.21       —     $0.21

[001] User authentication
  Spec                                    $0.09    $0.11    $0.07    $0.27
  Code                                    $0.18    $1.94    $0.12    $2.24
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.27    $2.05    $0.19    $2.51

[002] Job posting
  Spec                                    $0.11    $0.14    $0.09    $0.34
  Code                                    $0.31    $3.47    $0.28    $4.06  ◀ outlier
  ────────────────────────────────────────────────────────────────────────
  Capability total                        $0.42    $3.61    $0.37    $4.40

═══════════════════════════════════════════════════════════════════════════
Total                                     $1.02    $6.72    $0.70    $8.44

  [T] Show tokens   [I] Insights   Run /spec-gantry to return.
```

Type `[I]` for the insights view — iteration counts, challenge density, outlier breakdown, cost efficiency ratios.

Type `[T]` to switch to token counts. Same layout.

---

## The Broader Point

AI-assisted development is still young as a discipline. Teams are still figuring out the right processes, the right habits, and the right instrumentation.

Cost visibility is one of those things that looks like a nice-to-have until you've worked on a few AI-assisted projects and seen how spend accumulates invisibly. But cost alone is insufficient — you need the pipeline signals that explain the cost.

A capability that cost $4.06 in code says nothing by itself. A capability that cost $4.06 in code, took 3 cycles, where the second cycle was triggered by a challenge that caught a missing loading state and the third by a design smell that should have been caught in spec challenge — that's actionable.

Building developer intelligence into the framework — automatic, structured, co-located with the project — is the right answer. The alternative is discovering, three months in, that you've spent more than expected and you have no data to understand why.

SpecGantry exists because structure matters in AI-assisted development. Developer intelligence is part of that structure.

---

*SpecGantry is open source under Apache 2.0. Install it in 90 seconds: `claude plugin marketplace add https://github.com/specgantry/specgantry.github.io && claude plugin install spec-gantry@spec-gantry`*

---

<div class="next-steps-grid">
  <a href="/docs/skills#track-cost" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-graph-up-arrow"></i></div>
    <div>
      <strong>/track-cost Reference</strong>
      <span>The cost table, insights view, and release comparison explained with examples.</span>
    </div>
  </a>
  <a href="/docs/how-it-works#cost-tracking" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How Cost Tracking Works</strong>
      <span>The hook architecture, token counting, and pipeline signal structure explained.</span>
    </div>
  </a>
</div>
