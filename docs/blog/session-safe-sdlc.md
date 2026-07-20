---
layout: docs
title: "The Session-Safe SDLC — Why AI Development Needs Persistent State"
description: AI coding assistants live in a single context window. When the session ends, the context is gone. Here's why that's a bigger problem than most teams realize — and how session-safe pipelines solve it.
permalink: /blog/session-safe-sdlc/
---

# The Session-Safe SDLC — Why AI Development Needs Persistent State

*June 5, 2026 · 8 min read · Reliability*

---

There's a failure mode in AI-assisted development that doesn't get discussed much, because it doesn't look like a failure when it happens. It looks like a restart.

A developer is mid-way through an ideation challenge round — the session that matures the idea and shapes the system. The challenger has fired five questions. Three are answered. The session closes — context limit, network drop, end of day.

The next day, the developer opens a new session. The ideation challenge agent has no memory of yesterday. The answers given so far, the questions already resolved, the direction the conversation was heading — gone. The developer either reconstructs the answers from memory (which doesn't reproduce exactly) or starts a fresh round (which may surface the same questions and get different answers from a fresh mental state).

Neither outcome is acceptable for a production project. And yet this is the default behavior of every AI coding assistant that doesn't explicitly address session continuity.

SpecGantry was built with session safety as a core invariant. Here's what that means and why it matters.

---

## The Context Window Is Not Storage

The fundamental issue is an architectural one.

AI coding assistants operate on a context window — the token budget for a single inference call. Everything the model "knows" about your project, your decisions, your progress is in that window. When the window closes, the knowledge doesn't persist anywhere. The model doesn't remember your project. It doesn't remember your decisions. It doesn't remember where you stopped.

This is well understood in the abstract. What's less well understood is the practical implication for multi-turn, stateful workflows like SDLC pipelines.

An SDLC pipeline isn't a single prompt. It's a sequence of decisions, challenges, and artifacts built up over multiple sessions across days or weeks. Ideation might span two sessions with multiple challenge rounds. Capability specs are written one at a time, each building on the architecture decisions from earlier. Code builds across sessions as capabilities are completed.

Every one of those sessions is a context window that closes. Every closure is a potential state loss.

The question isn't whether state loss is a risk. It is, by definition. The question is what you do about it.

---

## The Standard Approach (And Why It Fails)

The standard approach to session continuity in AI-assisted development is: paste the relevant context at the start of each new session.

This works in the narrow case. If you're continuing a simple implementation task, pasting the code file and a brief description is usually sufficient.

It fails for SDLC pipelines for three reasons.

**The context is large.** A full ideation session includes the vision, all challenge rounds, all answers, and the artifacts that came out of it. Pasting all of this manually every session isn't sustainable.

**Reconstruction is lossy.** When a developer tries to summarize "where we left off" from memory, the summary reflects their current understanding — not the actual decisions made. Nuances get dropped. The constraint that ruled out a particular database approach because of a specific compliance requirement becomes "we're not using Postgres" — losing the *why* that makes the constraint meaningful when it needs to be applied.

**Partial rounds are the hardest case.** If you're mid-way through a challenge round when the session closes, you need to continue from the right point specifically — not restart the whole round, not skip to the judge. Manual context reconstruction makes it easy to re-cover old ground or skip questions, both of which produce corrupt output.

---

## What Session Safety Actually Means

A session-safe pipeline has one defining property: **every state transition is immediately persisted to disk**.

Not at the end of the session. Not when the artifact is "complete." After every single answer, every single challenge round, every phase transition.

In SpecGantry, this is implemented as a hard invariant across every agent:

- Every challenge round is saved before the user sees the questions. If the session closes mid-round, the next session surfaces the same questions again — the user picks up exactly where they left off.
- The write agent writes artifacts in crash-safe order — north-star.md first, then architecture.md, then intent.md per capability, then marks ideation complete. A crash between any two steps is detected on next session and recovered automatically.
- Every phase transition is written to `project-state.yaml` — which capability is active, which phase it's in, how many cycles have run. A restarted session reads this and continues from that exact point.
- Active loop state is checkpointed after each cycle. A crash mid-loop restores the iteration count and challenge list and re-enters at the challenge step.

The result: sessions are **interruption-safe at the phase level**. Any interruption loses at most one in-progress answer or the current agent's output. Everything confirmed is on disk.

---

## The Resume Protocol

Session safety is about persistence. Resume is about using that persistence correctly.

When SpecGantry starts a new session, it doesn't start from scratch. It reads `project-state.yaml` to determine exactly where to pick up:

1. If no project-state exists: no project found — start fresh.
2. If ideation is incomplete: resume the in-progress challenge round, surfacing the same questions the user was answering.
3. If a capability is mid-pipeline: restore the active CWJ loop and re-enter at the challenge step.
4. If all phases are complete: route to the next unblocked capability.

This routing is deterministic. The orchestrator doesn't try to infer "where we were" from conversation context — it reads the canonical state files and routes from them. The same session-start behavior in every scenario.

This determinism is what makes resume reliable. A probabilistic "try to figure out where we left off from reading the prose" approach fails on partial sessions. The structured state approach resumes correctly every time.

---

## Why This Matters for AI Specifically

Session continuity isn't a new problem. Traditional development tools have had project state for decades. But AI-assisted workflows have a specific property that makes session safety more critical: **the AI's contribution to each session is non-reproducible.**

When the ideation challenge agent fires a round of questions and the developer answers them, those specific answers — in that order, shaped by those specific questions — become the input to the judge and eventually to the write agent. Re-running the challenge round with a reconstructed context produces *similar* questions, but not identical. The answers may be the same or slightly different. The north-star.md that comes out of them will differ in subtle ways.

For a one-off task, this is fine. For a pipeline where each artifact feeds the next, inconsistencies compound. Architecture decisions that differ slightly in emphasis produce capability specs that differ in scope. Specs that differ in scope produce builds that conflict at the boundaries.

Persistent state eliminates this class of error. The challenge round answers written during the original session are canonical. The next session reads those exact answers, not a reconstruction.

---

## The Practical Impact on Developer Experience

Session safety has a direct effect on how developers experience the process — specifically, on the mental cost of the pipeline.

Without session safety, there's constant background anxiety: *if I lose this session, I'll lose the work*. Developers rush through phases. They avoid long challenge rounds. They keep the process lightweight specifically to minimize what they'd need to reconstruct on a restart.

This anxiety is rational. It's a reasonable response to a pipeline that isn't session-safe.

With session safety, the anxiety disappears, because the failure mode is no longer catastrophic. Lose a session mid-ideation? The next session surfaces the same challenge questions — the user picks up with the same round. Lose a session mid-build? The loop state is restored and the challenge re-runs on the code that was already built. Nothing is lost except the in-progress agent output at the moment of interruption.

The practical effect: developers can work on the pipeline in short sessions without worrying about continuity. They can close the laptop mid-spec and know exactly where they'll resume.

At the scale of a project spanning two weeks and multiple developers, this reliability is what makes the pipeline a production tool rather than a demo.

---

## The Broader Point: AI Tools Need SDLC-Grade Reliability

There's a pattern in how AI coding tools have been built so far: optimize for the demo, not the production workflow.

Demo workflows are linear, short, single-session, and forgiving of interruption. Production workflows are multi-session, state-dependent, and intolerant of data loss.

Building an SDLC pipeline with AI assistance requires AI-grade performance in the tools plus SDLC-grade reliability in the process. SpecGantry's session-safe design is the reliability layer. The Claude Code models are the performance layer. Neither alone is sufficient.

The teams that move fastest with AI-assisted development aren't the ones with the highest token budgets or the most capable models. They're the ones who've eliminated the reliability failures that make the process unpredictable — context loss, state corruption, misaligned interpretations. Session safety eliminates one of the most common reliability failures. That's the value.

---

## What Gets Written to Disk

For concreteness, here's the file system that SpecGantry maintains per project:

```
specs/
  north-star.md              ← Written at ideation exit — the cognitive contract
  architecture/
    architecture.md          ← Technical decisions — ## section:name anchors
  project-state.yaml         ← Phase status, active capability, iteration counts
  capabilities/
    CAP-NNN/
      intent.md              ← Experience promise — 2 paragraphs
      capability-spec.md     ← Developer contract — machine-challenged
      build-report.yaml      ← Build outcome, runtime info, test plan
```

Every agent reads its input from this structure before doing anything. Every agent writes to its artifact before completing. No state lives only in the context window.

When a session resumes, the first action is reading the relevant state files. The last action was writing to them. The gap between those two actions is the session that ended — and it's invisible in the output.

That's session safety. The pipeline doesn't notice that the session closed.

---

*SpecGantry is open-source and runs inside Claude Code. [Read how the pipeline phases work →](/docs/how-it-works)*
