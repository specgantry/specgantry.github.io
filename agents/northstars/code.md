# Code North Star

**The question this north star answers:**
*"Does the running software deliver the full experience the intent describes — correct, complete, and usable?"*

This document is a **constant**. No plan can redefine it. The code-eval-agent holds every build AND every code plan against these criteria. It evaluates in two passes: (1) the existing quality dimension rubric (compliance with spec), and (2) these north star criteria (experience quality grounded in the Goal object from the spec handoff). Both must pass for `verdict: ACHIEVED`.

A build that passes all spec dimensions but fails a north star criterion is a GOAL_GAP — the spec was insufficient, and the orchestrator routes back to the spec loop, not the code loop.

---

## Criteria

### 1. Code satisfies every spec criterion
The existing dimension rubric applies in full:
- `spec_adherence`: every criterion in `## Criteria` has observable evidence in the code
- `contract_fidelity`: every contract referenced in `reads:` is honoured with exact field names
- `input_completeness`: every input path is validated before use
- `scope_hygiene`: implementation contains only what the story-spec requires
- All applicable conditional dimensions (`element_visibility`, `interactive_completeness`, `empty_and_error_states`, `flow_continuity`, `prompt_output_coherence`, `ai_failure_handling`, `output_usefulness`, `cross_flow_data_integrity`, `persistence_appropriateness`, `state_consistency`, `external_call_resilience`, `contract_boundary_fidelity`, `permission_boundary_fidelity`)

This criterion is a floor, not a ceiling. Passing all dimensions does not mean the north star is met.

### 2. Async operations show meaningful feedback during the operation
For every async operation in the code (API call, AI generation, file upload, database query that may be slow):
- A loading indicator or progress state is shown while the operation is in flight
- If the operation is streaming or incremental, partial results are rendered as they arrive — not held until completion
- The user is never left staring at a static screen during a wait

Failing signal: code makes an async call and only updates the UI on resolve/reject. No loading state exists. For streaming AI: response is buffered and shown all at once.

### 3. Output format matches the information being conveyed
For every piece of output the user receives:
- The format is appropriate for the content (prose in a readable container, structured data in a table or list, code in a code block, status in a badge)
- The layout places the output where the user expects it based on the flow
- Text is readable: appropriate font size, line length, contrast; not a raw JSON dump or unstyled string

Failing signal: AI-generated text is rendered as `{"result": "..."}`. A list of items is rendered as a comma-separated string. Output appears in an incorrectly sized container that forces scrolling or overflows.

### 4. Every error state is surfaced to the user in readable form
For every error path in the code:
- The user sees a human-readable message, not a stack trace, HTTP status code, or raw error object
- The message tells the user what went wrong and what they can do (retry, go back, contact support)
- The error is displayed in the appropriate location (inline below the triggering field, toast for transient errors, full-page for fatal errors)

Failing signal: catch block logs to console but shows nothing to the user. Error state renders `Error: 500`. Form validation failure clears the form without explanation.

### 5. The full user flow is completable without dead ends
Following the user flow described in intent.md through the code:
- Every navigation link resolves to a real route
- Every action that should transition the user to a new state does so
- The user receives confirmation when a significant action completes (success message, navigation to result, state update)
- No action silently does nothing

Failing signal: submit button fires a request but the UI does not respond on success. A link navigates to a 404. After completing the flow, the user is returned to the start with no indication of what happened.

### 6. The implementation does not make the obvious next requirement impossible
For any algorithmic, structural, or data-layer component introduced by this story:
- Configuration is externalised where the spec or intent implies it will vary (timeouts, thresholds, model names, limits)
- The component is not hard-wired to a single path that the intent implies will need to handle multiple cases
- Extension points are not sealed: a function that the intent implies will process more types is not written as a fixed switch with no extension path

This criterion applies only when the code-eval-agent reads the intent and sees that the current implementation would require a rewrite (not a configuration change) to handle the next obvious requirement. It does not mandate speculative abstraction.

Failing signal: intent describes a "smart processor" that handles one item type; the code hard-codes that type as a constant with no configuration. Adding a second type requires modifying core logic rather than adding a handler.

### 7. State is consistent between UI and server after every mutation
After every create, update, or delete operation:
- The UI reflects the new server state — either via re-fetch or correctly implemented optimistic update
- Stale data is not displayed after a successful mutation
- If the mutation fails, the UI rolls back to the prior state

Failing signal: user deletes an item; it disappears optimistically but reappears on next render because the list was not invalidated. User creates a record; the form clears but the list does not update.

---

## Verdict logic

**`ACHIEVED`** — zero FAILs in the active quality dimension rubric AND zero blocking northstar_gaps (advisory gaps are noted but do not block).

**`EXECUTION_GAP`** — one or more dimension FAILs where the spec is sufficient and the code just needs to be fixed. Orchestrator routes to code-plan-agent.

**`GOAL_GAP`** — code satisfies the spec but the spec was insufficient for the north star. Specifically: a north star criterion above (criteria 2–6) is violated, but there is no spec criterion that the developer could have used to catch it. The spec did not require the behaviour that the north star demands. Orchestrator routes back to spec loop with upgraded_goal.

The code-eval-agent must be precise about which verdict applies:
- If the spec had a criterion for the failing behaviour and the code just didn't implement it → `EXECUTION_GAP`
- If the spec had no criterion for the failing behaviour and the north star requires it → `GOAL_GAP`
- If both apply (spec gap AND code gap on different dimensions) → `GOAL_GAP` takes precedence (fix the upstream spec gap first)

---

## Handoff criteria (what ACHIEVED means)

When the code-eval-agent returns `verdict: ACHIEVED`, it confirms:
- All quality dimensions in the active rubric: PASS or SKIP
- All 7 north star criteria above: met, with specific citation from the code
- `handoff: { built: true }` — the story is ready to be marked built by the orchestrator
