# Quality Dimensions Registry

This file is the single source of truth for all quality dimensions used by the evaluate subagent. Every dimension has a fixed definition and expectation — the evaluator reads this file to build its active rubric per story.

**How the rubric is built:**
1. All `tier: core` dimensions are always included.
2. Each `tier: conditional` dimension is included only when its `applicable_when` signal is detected in `story-spec.md` or `build-report.yaml`.
3. The resulting flat list is the `active_rubric` for this evaluation.

**Signals detected from story context:**
- `has_ui` — story-spec has `## Interfaces` with screen/component/form entries, or build-report lists frontend files (`.jsx`, `.tsx`, `.vue`, `.html`, `.css`)
- `has_ai` — story-spec or intent.md references AI, LLM, prompt, generate, summarise, classify, or build-report lists files under `src/ai/`
- `has_data_mutations` — story-spec has `## State` or `## Data` with create/update/delete operations, or build-report lists migration files or DB query files
- `has_external_calls` — story-spec references external APIs, webhooks, third-party services, or build-report lists files with fetch/axios/http client calls
- `has_auth` — story-spec `## Permissions` section is non-empty, or build-report lists auth/session/middleware files

---

## Core dimensions (always evaluated)

### spec_adherence
- **Expectation:** Every criterion in `## Criteria` is satisfied by the implementation. Each criterion has observable evidence in the source code — a route exists, a field is validated, a state transition is handled. Missing criteria are FAIL; vague criteria that cannot be verified from code alone are SKIP with reason.
- **cannot_evaluate_when:** `story-spec.md` has no `## Criteria` section.

### contract_fidelity
- **Expectation:** Every contract referenced in `reads: contracts:` is honoured. Required fields from the contract YAML block are present in every response shape. Field names match exactly — no invented names, no omitted required fields. Cross-layer functions carry correct `@contract` anchor comments.
- **cannot_evaluate_when:** No contracts in `reads:` block.

### input_completeness
- **Expectation:** Every input path that reaches the backend or AI layer is validated before use. Required fields are checked for presence and type. Invalid input returns a meaningful error (not a 500 or silent failure). Edge cases named in the spec (empty, null, boundary values) are handled explicitly.
- **cannot_evaluate_when:** Story has no input-receiving endpoints or functions.

### scope_hygiene
- **Expectation:** The implementation contains only what the story-spec requires. No unrequested features, no speculative abstractions, no extra endpoints. Files modified are limited to what `build-report.yaml → files_modified` declares. No modifications to arch artifacts or other stories' files.
- **cannot_evaluate_when:** Never — always evaluable from code + spec comparison.

---

## Conditional dimensions

### element_visibility
- **applicable_when:** `has_ui`
- **Expectation:** Every interactive element (button, link, form field, tab, modal trigger) is visible and reachable in the normal user flow. No element is hidden behind an unreachable state. Primary actions are prominent — not buried or styled as disabled by default when they should be active. Loading and disabled states exist for async actions.
- **cannot_evaluate_when:** Story UI is purely informational (no interactive elements).

### interactive_completeness
- **applicable_when:** `has_ui`
- **Expectation:** Every user action described in the story (submit, cancel, delete, navigate) has a working handler. Clicking a button does something — no dead click targets. Form submission triggers the intended backend call. Navigation links resolve to real routes.
- **cannot_evaluate_when:** Cannot fully verify without running the app — flag as SKIP if handler exists but outcome requires runtime.

### empty_and_error_states
- **applicable_when:** `has_ui`
- **Expectation:** The UI handles three states explicitly: empty (no data yet), error (API call failed or validation failed), and loading (async in flight). Empty state shows a meaningful message, not a blank screen. Error state shows user-readable feedback, not a raw error object. Loading state prevents double-submission.
- **cannot_evaluate_when:** Never for UI stories — these states are always inspectable in source.

### flow_continuity
- **applicable_when:** `has_ui`
- **Expectation:** A user can complete the full flow described in `intent.md` without hitting a dead end. Every screen that requires data from a prior step receives it. Navigation back/forward does not lose state unexpectedly. The flow described in intent (start → complete action → see result) has a clear path through the UI.
- **cannot_evaluate_when:** Multi-screen flows that require session state — flag individual broken links as FAIL, but full flow assessment may be SKIP.

### prompt_output_coherence
- **applicable_when:** `has_ai`
- **Expectation:** The AI prompt template directly addresses the functional purpose stated in `intent.md`. The prompt includes the context the model needs (relevant data fields, user role, task description). The expected output format is specified in the prompt. The code correctly extracts and uses the fields from the AI response that the rest of the feature depends on.
- **cannot_evaluate_when:** Prompt is loaded from an external file not in `files_modified`.

### ai_failure_handling
- **applicable_when:** `has_ai`
- **Expectation:** Every AI call has explicit error handling: network failure, API rate limit, malformed response, and empty/null output are all handled without crashing. The user sees a meaningful fallback, not a 500 or blank result. Timeouts are configured — no unbounded waits.
- **cannot_evaluate_when:** Never — always inspectable from source.

### output_usefulness
- **applicable_when:** `has_ai`
- **Expectation:** Evaluated against `intent.md`, not the spec criteria. Does the AI output, as shaped by the prompt and parsed by the code, actually serve the functional purpose the user is trying to accomplish? A response that is non-empty but irrelevant to the intent is FAIL. Judge this by reading the prompt template, the output parsing logic, and the intent description together — ask: would a user of this feature find the AI output genuinely helpful for the task described in intent?
- **cannot_evaluate_when:** Intent.md does not describe the user's goal clearly enough to judge relevance — flag SKIP with reason.

### cross_flow_data_integrity
- **applicable_when:** `has_data_mutations`
- **Expectation:** Data written in one step of the flow is correctly read back in subsequent steps. A record created via POST is retrievable via GET with the same fields. Status transitions follow the state machine in `data-model.md`. No orphaned records — deletes cascade or are blocked as the data model specifies. Concurrent write scenarios do not silently overwrite each other.
- **cannot_evaluate_when:** Flow spans multiple stories not yet built — flag affected steps as SKIP.

### persistence_appropriateness
- **applicable_when:** `has_data_mutations`
- **Expectation:** The storage mechanism matches the data's lifecycle as described in `intent.md` and `data-model.md`. Transient data (session, in-flight) is not persisted to the database. Persistent data (records, state) is not stored only in memory or local state. Indexes exist for fields used in query conditions.
- **cannot_evaluate_when:** Data lifecycle is not described in intent or data-model — flag SKIP.

### state_consistency
- **applicable_when:** `has_data_mutations`
- **Expectation:** UI state and server state stay in sync after mutations. After a successful create/update/delete, the UI reflects the new state — either via re-fetch or optimistic update that is rolled back on error. Stale data is not displayed after a mutation completes.
- **cannot_evaluate_when:** State sync requires runtime observation — if the pattern exists in code (re-fetch call or optimistic update) flag PASS; if absent flag FAIL.

### external_call_resilience
- **applicable_when:** `has_external_calls`
- **Expectation:** Every external API call has a timeout configured. Network failures return a user-visible error, not a 500. Retry logic exists for transient failures where appropriate. API keys and base URLs come from environment variables — never hardcoded. Response validation exists before the response is used downstream.
- **cannot_evaluate_when:** Never — always inspectable from source.

### contract_boundary_fidelity
- **applicable_when:** `has_external_calls`
- **Expectation:** The request shape sent to the external API matches the documented contract (URL, method, required headers, body fields). The response fields actually used by the code exist in the external API's documented response. No fields are assumed present without a null-check.
- **cannot_evaluate_when:** External API contract is not documented in arch artifacts — flag SKIP with note to add it.

### permission_boundary_fidelity
- **applicable_when:** `has_auth`
- **Expectation:** Every endpoint and action that the story's `## Permissions` section restricts is protected by a middleware or guard that checks the correct role or ownership. An unauthenticated request to a protected endpoint returns 401. An authenticated but unauthorised request returns 403. No endpoint that should be protected is reachable without auth checks.
- **cannot_evaluate_when:** Auth middleware is defined in a story not yet built — flag SKIP with dependency note.
