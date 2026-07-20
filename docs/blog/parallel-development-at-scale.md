---
layout: docs
title: "Building Coherent Systems with Capability-Based Development"
description: Component decomposition creates coordination overhead. Capability-based decomposition eliminates it. Here's how SpecGantry's vertical-slice approach and diagnostic routing keep your system coherent from challenge to deployment.
permalink: /blog/parallel-development-at-scale/
---

# Building Coherent Systems with Capability-Based Development

*June 5, 2026 · 9 min read · Architecture*

---

One of the most common failure modes in AI-assisted development isn't broken code. It's coherent code that doesn't form a coherent system.

The backend builds a data model for one thing. The frontend renders something different. The AI integration gets specced in detail, implemented correctly — and never actually called, because the flow that was supposed to trigger it was built as a separate component that didn't know the feature existed.

These aren't bugs in any individual component. They're failures of **vertical coherence** — the frontend, backend, and AI integration of a single capability never got specified together in one place. And they weren't challenged together before any code was written.

---

## The Component Decomposition Problem

Traditional architectural decomposition cuts the system horizontally: frontend, backend, data layer, AI layer. Each component is assigned to a phase. Each phase produces an artifact.

The problem is that a real user capability spans all of those layers. When each layer is specced and built in isolation, the question "does this feature actually work end-to-end?" isn't answered until integration — by which point you've already spent the tokens building it.

Consider an AI-powered resume extraction feature:
- The spec for the data layer: "Store resume file with extracted fields"
- The spec for the AI integration: "Extract structured data from PDF"
- The spec for the frontend: "Show form with profile fields"

Three individually correct specs that leave open the most important questions: What happens when extraction fails? Which fields does the frontend show? Are the field names in the extracted data the same as the field names in the form? Which event triggers the extraction — file upload, form load, submit?

None of these questions get asked because no spec owns the full user journey. And no challenger sees the end-to-end picture.

---

## Capabilities as Vertical Slices

SpecGantry v7 structures work around **capabilities** — vertical slices that own the complete capability from UI to backend to AI in a single intent file and spec.

A `capability-spec.md` for "Student uploads resume and sees pre-filled profile form" contains:

- **Every criterion** — observable, bounded, unambiguous. Not "handle errors gracefully" but "when extraction fails, the form fields remain empty and a 'Fill in manually' prompt appears below the upload area."
- **Every interface** — exact endpoint, auth requirement, request shape, response shape, error codes
- **State transitions** — loading states, optimistic update patterns, cache invalidation
- **Layout decisions** — which screen, where the primary action appears, modal vs page
- **Data operations** — which entities are touched, validation rules with error message text

This is the architecture of one user journey in one document. The build agent reads exactly this. The code challenge agent reads the north star and intent, then traces this exact journey through the actual source files.

---

## Why Vertical Coherence Is Engineered In

When frontend and backend are specced together in one capability, the question "does the form field match the API field?" must be answered in the spec challenge phase, not at runtime. The challenge agent asks: "What exactly does the user see when the capability completes successfully? Is it a list, a form, a detail view? How is it formatted?"

When the AI integration is specced alongside the UI flow that triggers it, the question "what does the user see when AI fails?" must be answered before a line of code is written.

When the north star says "every async operation must communicate state throughout," the spec challenge agent reads both the north star and the intent, then asks: "Does anything in this capability take time? What does the user see while waiting?" This gap gets caught as a challenge, not as a code failure after implementation.

The investment shifts: more cycles in the spec challenge round, fewer in the code challenge round.

---

## Diagnostic Routing: When Something Is Wrong

Well-challenged specs reduce mid-build surprises. They don't eliminate them entirely. When the code challenge agent finds something wrong, the naive response is to run more code repair iterations.

SpecGantry's v7 answer is **diagnostic classification**: every gap the code challenge agent finds is classified as `"code"` or `"spec"`.

- `"code"` — the spec had (or implied) this requirement and the code missed it. Targeted code repair.
- `"spec"` — the north star requires this but the spec never captured it. Re-spec first, then rebuild.

A spec-classified gap sent to the code repair loop produces another iteration of the wrong fix. The code can be repaired to match the spec, but if the spec was insufficient for the north star, matching the spec still produces the wrong outcome.

This is the core difference from a simple evaluate→repair loop: the right phase gets fixed.

The investigate agent that runs on post-deploy problems extends this classification further: `CODE_BUG` (code doesn't match spec), `SPEC_GAP` (spec was insufficient), `REQUIREMENT_DRIFT` (requirement changed), `NEW_CAPABILITY` (genuinely new work). Each routes to a different phase. You don't re-spec a code bug. You don't patch code for a requirement drift.

---

## The Architecture as a Single File

In v7, the architecture lives in one file: `specs/architecture/architecture.md` with `## section:name` anchors.

Each capability spec declares which sections it reads via a `reads:` block in the frontmatter. The build agent loads only those sections. The challenge agent reads `## section:api-interfaces` and `## section:data-model` to understand existing contracts and entities.

This means: when a capability spec references an API interface, the reference is to the canonical section in architecture.md. There's no drift between "what the spec references" and "what the architecture defines." The architecture is the architecture — one file, always current, read by every agent that needs it.

---

## The Orchestrator as Pipeline Control

Think of the orchestrator as the sequencer for your development pipeline.

Each capability has a state: `spec_done`, `built`, `deployed`, plus iteration counts per phase. The pipeline processes capabilities in topological order — dependencies must be specced before dependents are started.

Before the spec loop starts, the gate checks: `ideation_complete`, at least one intent.md, tech-stack decided. Before the code loop starts: `spec_done: true` for this capability.

The result: when you reach deployment, the system that was built has very high probability of composing correctly. The capability spec made vertical coherence explicit. The challenge rounds ensured the spec captured what the north star requires. Diagnostic classification repaired the right thing when something was wrong.

---

## Developer Intelligence on Coherence

Because every SpecGantry agent runs through the CWJ pipeline, every build is tracked. The `/track-cost` insights view shows iteration counts per capability per phase.

When a capability had 3 code CWJ cycles, the outlier section shows which challenge triggered each repair cycle. Was it a loading state missed in spec? A design smell found in code that should have been caught in spec challenge? This tells you where the coherence failure entered the pipeline.

You can't improve what you can't see. Capability-level iteration visibility gives you the data to ask: did the spec challenge round catch enough? Did we enter the code loop with a well-specified capability?

---

## What This Looks Like in Practice

A development flow with SpecGantry v7:

1. Ideation derives the capability list — 3–5 vertical slices ordered by dependency. The challenge round ensures the scope is clear enough that a spec agent wouldn't need to invent answers.
2. Each capability gets a full spec: criteria, interfaces, state, layout, data — all challenged by a developer-proxy before the judge approves.
3. The build agent implements each capability in dependency order. The code challenge agent traces the user's experience through the actual source files.
4. Diagnostic classification routes any gap to the right phase — code repair, spec re-run, or north-star amendment.
5. The deployment agent runs a north-star alignment check — verifying that what's being shipped delivers what the north star promised — before generating deployment artifacts.

Each spec is the complete contract for its capability. The build agent reads the spec and the architecture sections it declares. The code challenge agent reads the north star and intent. The user's experience is the ultimate standard.

---

## The Core Argument

AI-assisted development is fast. The failure mode isn't speed — it's coherence. Systems where each piece was built correctly but doesn't form a coherent whole.

Capability-based decomposition forces coherence into the spec rather than hoping it emerges from integration. The challenge round makes the vertical slice explicit before code is written. The user-proxy code challenge confirms the experience after code is built.

Precision in the spec means execution in the build. Challenge in the spec means coherence in the system.

---

*SpecGantry is open-source and runs inside Claude Code. [See the capability spec format →](/docs/how-it-works)*
