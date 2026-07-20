# Spec North Star

**The question this north star answers:**
*"If built exactly as written, does the user get everything the intent promises — nothing missing, nothing ambiguous?"*

This document is a **constant**. No plan can redefine it. The spec-eval-agent holds every story-spec AND every spec plan against these criteria. A plan whose steps do not cover a criterion here is a GOAL_GAP. A spec that passes its own format checklist but fails a criterion here is an EXECUTION_GAP.

---

## Criteria

### 1. Every user-facing action has a visible, reachable trigger
For every action the user must take in the story (submit, cancel, navigate, select, upload, confirm), the spec describes:
- What UI element triggers it (button label, link text, form submit, keyboard shortcut)
- Where that element appears in the layout
- Under what conditions it is enabled or disabled

Failing signal: a developer reading the spec would need to decide where to place a primary action, or whether a button should be enabled before a condition is met.

### 2. Every async operation communicates state throughout — not just on completion
For any operation that takes time (API call, AI generation, file upload, background job), the spec explicitly describes:
- The **loading state**: what the user sees while waiting (spinner, progress bar, skeleton, message)
- The **partial/interim state**: if the operation produces results incrementally (streaming AI, multi-step process), whether and how interim results are shown to the user
- The **completion state**: what the user sees when the operation succeeds
- The **failure state**: what the user sees when the operation fails

Failing signal: spec says "show result when done" without describing loading state, or does not address whether a streaming operation shows partial output. A developer would build a blank screen during the wait.

### 3. Every output is formatted for the information it carries
For every piece of output the user receives (AI-generated text, data table, status message, list, chart), the spec describes:
- The format: prose, list, table, code block, card, badge, etc.
- The layout: where in the screen the output appears, how much space it occupies
- The information hierarchy: what is prominent, what is secondary

Failing signal: spec says "display the result" without describing format. Two developers would produce different layouts. A developer would default to an unstyled dump.

### 4. Every error state is handled with user-readable feedback
For every error the user might encounter (validation failure, API error, empty state, unauthorized, not found), the spec describes:
- The error message: what the user reads (not a technical error code)
- The recovery path: what the user can do next (retry, go back, contact support, etc.)
- Where the error is displayed (inline below a field, toast, full-page, etc.)

Failing signal: spec only describes happy-path criteria. A developer would show raw error objects or blank screens on failure.

### 5. The full user flow has no dead ends
Tracing the user's journey from the entry point described in intent.md to the completion state:
- Every screen that requires data from a prior step receives it
- Every action has a clear next step
- Navigation back/forward is described where the flow allows it
- The user can always tell what to do next

Failing signal: a user who completes step N would not know how to reach step N+1. A flow terminates without confirming success to the user.

### 6. No criterion is ambiguous
Every criterion in `## Criteria` is:
- Observable: there is a specific, deterministic way to verify it from the running code
- Bounded: it describes one behaviour, not a family of behaviours
- Unambiguous: two developers reading it independently would implement the same thing

Failing signal: criterion says "the system should handle errors gracefully" or "the UI should be responsive" — subjective, unverifiable, and open to interpretation.

### 7. Every edge case named in intent.md has a criterion
Reading intent.md: if the intent describes any condition, constraint, or edge case ("if the user has no data yet", "when the AI takes too long", "if the input is malformed"), the spec must have a criterion that addresses it.

Failing signal: intent.md describes a scenario but the spec's criteria section has no entry for it. The developer would not know to handle it.

### 8. Interfaces are complete, unambiguous, and role-gated
For every endpoint or server action in `## Interfaces`:
- Auth requirement is stated
- Every guard/precondition is stated
- Response contract is referenced (not inlined)
- Every error response is listed with its HTTP status and trigger condition

For every UI element, screen section, or action that is conditional on role or permission:
- The required role is named
- What a user without that role sees is stated (hidden, disabled, redirect, error message)

Failing signal: a developer would need to decide what status code to return on a validation failure, or whether an endpoint requires authentication, or what an unauthorised user sees when they encounter a role-gated element.

### 10. Every user input has stated validation rules
For every input field, form, or data submission in the story:
- The validation rule is stated (required, max length, format, allowed values, etc.)
- The trigger point is stated (on blur, on submit, or real-time)
- The error message text is specified (not "show an error" — the actual message the user reads)
- The error display location is stated (inline below the field, above the form, toast, etc.)

Failing signal: a developer would need to decide what constitutes valid input, when to validate it, what to say to the user when it is invalid, or where to show that message.

### 11. Layout and structural decisions are made
The spec does not leave structural decisions to the developer. For any screen or component:
- The layout approach is stated (e.g. "two-column: left nav, right content", "centered card", "full-width table")
- The screen template from `ux:screen-template` is referenced or a deviation is stated
- Significant UI decisions (modal vs page, inline vs separate form, tabs vs accordion) are decided in the spec

Failing signal: spec describes what a screen must contain but not how it is structured. Developer makes a layout choice the product owner did not intend.

---

## Handoff criteria (what ACHIEVED means)

When the spec-eval-agent returns `verdict: ACHIEVED`, it must confirm all 11 criteria above are met with specific evidence from the written story-spec.md. The orchestrator derives Goal₀ for the code loop directly from `story-spec.md`, `intent.md`, and the code north star — no handoff payload is needed from the eval agent.
