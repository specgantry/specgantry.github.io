---
layout: docs
title: "Building Coherent Systems with Story-Based Development"
description: Component decomposition creates coordination overhead. Story-based decomposition eliminates it. Here's how SpecGantry's vertical-slice approach and gap specs keep your system coherent from spec to deployment.
permalink: /blog/parallel-development-at-scale/
---

# Building Coherent Systems with Story-Based Development

*June 5, 2026 · 9 min read · Architecture*

---

One of the most common failure modes in AI-assisted development isn't broken code. It's coherent code that doesn't form a coherent system.

The backend builds an extracurricular section for a student profile. The frontend never renders it. The AI extraction feature gets specced in detail, implemented correctly — and never actually called, because the flow that was supposed to trigger it was built as a separate component that didn't know the feature existed.

These aren't bugs in any individual component. They're failures of **vertical coherence** — the frontend, backend, and AI integration of a single capability never got specified together in one place.

---

## The Component Decomposition Problem

Traditional architectural decomposition cuts the system horizontally: frontend, backend, data layer, AI layer. Each component is assigned to a phase. Each phase produces an artifact.

The problem is that a real user capability spans all of those layers. When each layer is specced and built in isolation, the question "does this feature actually work end-to-end?" isn't answered until integration — by which point you've already spent the tokens building it.

Consider an AI-powered resume extraction feature:
- The spec for the data layer: "Store resume file with extracted fields"
- The spec for the AI integration: "Extract structured data from PDF"
- The spec for the frontend: "Show form with profile fields"

Three individually correct specs that leave open the most important questions: What happens when extraction fails? Which fields does the frontend show? Are the field names in the extracted data the same as the field names in the form? Which event triggers the extraction — file upload, form load, submit?

None of these questions get asked because no one spec owns the full user journey.

---

## User Stories as Vertical Slices

SpecGantry v3 structures work around **user stories** — vertical slices that own the complete capability from UI to backend to AI in a single spec.

A story spec for "Student uploads resume and sees pre-filled profile form" contains:

- **Every screen** in the flow — what it shows, what the user can do, what happens on each action
- **Every data entity** — field names, types, validation rules, required vs. optional
- **AI integration** — the exact prompt template, expected output schema, how each field maps to the UI
- **Enterprise checks** — auth requirements, error states, what happens on failure, AI fallback
- **Acceptance criteria** — numbered, observable, specific

This is the architecture in one document. The build agent reads exactly this. There's no cross-document inference required.

---

## Why This Eliminates Incoherence

When frontend and backend are specced together in one story, the question "does the form field match the API field?" is answered in the spec, not at runtime.

When the AI integration is specced alongside the UI flow that triggers it, the question "what does the user see when AI fails?" must be answered before a line of code is written. The `## Enterprise checks` section makes it mandatory.

When acceptance criteria describe observable end-to-end behavior — "submitting with a valid PDF triggers extraction within 3 seconds; if extraction fails, form fields remain empty and a 'Fill in manually' prompt appears" — the build agent has a precise target. Haiku-level models can execute against precise specs. It's vague specs that require expensive back-and-forth.

The investment shifts: more tokens in the spec once, fewer tokens in confused build turns.

---

## Gap Specs: Handling Mid-Build Discoveries

Precise specs reduce mid-build surprises. They don't eliminate them entirely. When the build agent discovers the spec is incomplete, contradicted by the actual code shape, or has side-effects on another story's data model — the naive fix is to edit the main spec directly.

SpecGantry's answer is the **gap spec**: a delta document written during development instead of modifying the main spec. The gap spec records what changed, which files were affected, any side-effects on other stories, and a recommended spec update.

Before deployment, SpecGantry presents all unmerged gap specs, merges them into the relevant story specs and architecture, then proceeds to deploy. The main specs stay accurate. The audit trail is complete. Every `/spec-gantry` session in the future is working from specs that reflect what was actually built.

This is the mechanism that makes evolution safe. When you return six months later to add a feature, the specs aren't stale documentation of original intent — they're accurate documentation of the current system.

---

## The Orchestrator as Air Traffic Control

Think of the orchestrator as air traffic control for your development pipeline.

Each story spec is a flight plan. Before the build begins, the orchestrator checks:

1. Is the spec internally complete? (Story spec gate — all 6 sections filled, guardrails verified)
2. Are dependencies met? (The story's `depends_on` list)
3. Is the architecture consistent? (Guardrail compliance check)

If any check fails, the story doesn't advance to development. The specific section that needs work is named — not a vague "go fix the spec" but a precise gap in a specific section.

Only after all checks pass does the dev agent receive the spec and start implementation.

The result: when you reach deployment, the system that was built has a very high probability of composing correctly. The story spec made vertical coherence explicit. The guardrail checks ensured every story respects the system-wide constraints. Gap specs captured mid-build discoveries without letting them silently invalidate the specs.

---

## Token Cost Visibility

Because every SpecGantry agent runs through the same pipeline, every build is tracked. The `/track-cost` dashboard shows spend by phase and by story.

When a story costs significantly more than comparable stories, that's a signal. It usually means one of: the story was genuinely more complex, the spec required multiple revision cycles, or the build agent struggled with an underspecified section.

You can't improve what you can't see. Story-level cost visibility gives you the data to have those conversations before the next release.

---

## What This Looks Like in Practice

A development flow with SpecGantry:

1. Ideation derives the story list — 3–5 vertical slices ordered by dependency.
2. Each story gets a full spec: 6 sections, all mandatory, enterprise checks included.
3. The build agent implements each story in dependency order. Gap specs are written for any mid-build discoveries.
4. Once all stories are built, a confirm-deploy prompt appears. Gap specs are reviewed and merged first, then deployment proceeds.
5. The full system deploys as a single release.

Each spec is the complete contract for its story. The build agent needs only the story spec and the architecture — no cross-document inference, no implicit dependencies, no assumptions about what other stories are doing.

---

## The Core Argument

AI-assisted development is fast. The failure mode isn't speed — it's coherence. Systems where each piece was built correctly but doesn't form a coherent whole.

Story-based decomposition forces coherence into the spec rather than hoping it emerges from integration. It makes the vertical slice explicit before code is written. It gives the build agent a precise target.

Precision in the spec means execution in the build. That's the combination that works at Haiku cost.

---

*SpecGantry is open-source and runs inside Claude Code. [See the story spec format →](/docs/how-it-works)*
