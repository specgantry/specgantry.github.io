# Ideation North Star

**The question this north star answers:**
*"Can every architecture artifact be written without invented assumptions?"*

This document is a **constant**. No plan can redefine it. The ideation-eval-agent holds every ideation output AND every ideation plan against these criteria. A plan whose topics do not cover a criterion here is a GOAL_GAP, not an EXECUTION_GAP.

---

## Criteria

### 1. Actors are fully defined
Every actor (user role, system, external party) is named with:
- A clear purpose: what they are trying to accomplish
- Explicit capabilities: what actions they can take in the system
- Ownership: which data entities they own or can modify

Failing signal: an actor is mentioned in the vision but not defined with capabilities, or a capability is assumed (e.g. "admin manages users") without the actor being explicitly declared.

### 2. Data entities are fully defined
Every data entity that the system must persist or process is named with:
- An owner (which actor creates/owns it)
- A lifecycle description (created when, transitions to what states, deleted when)
- Key fields identified (not exhaustive — enough that a spec agent can derive contracts)

Failing signal: a spec agent would need to invent field names, state machines, or ownership rules not grounded in ideation answers.

### 3. External dependencies are identified
Every third-party service, API, library, or infrastructure dependency is named with:
- Its integration point (which story or layer uses it)
- Its purpose (what it provides)
- Any constraints (rate limits, auth model, cost implications)

Failing signal: a dev agent would encounter an integration requirement with no guidance on which service to use or how to authenticate.

### 4. UX conventions are decided
The following are explicitly defined, not left to developer interpretation:
- Navigation model: how users move between screens (tabs, sidebar, wizard, single-page, etc.)
- Visual system: CSS framework or design system in use, theme approach
- Component conventions: naming, file organization, reuse strategy
- Screen template: the structural pattern every screen follows (header, content area, action bar, etc.)

Failing signal: two developers given the same spec would produce visually or structurally inconsistent screens.

### 5. Deployment target is decided
The following are explicitly defined:
- Platform: cloud provider or self-hosted (GCP / AWS / Azure / Docker Compose / other)
- Container registry: where images are pushed
- Scaling approach: min/max replicas, resource sizing
- Secrets strategy: how secrets are stored and injected
- CI/CD approach: manual, GitHub Actions, or other

Failing signal: the deployment agent would need to ask questions that ideation should have answered.

### 6. Tech stack is decided with no open choices
Every layer of the system has a decided technology:
- Language and runtime (e.g. Node.js 20, Python 3.12)
- Web framework (e.g. Express, FastAPI, Next.js)
- Database (e.g. PostgreSQL, SQLite, MongoDB)
- Any AI/LLM provider if the system uses AI
- Any other significant library or service

Failing signal: the story-spec or dev agent would need to choose a technology not specified in ideation.

### 7. Story list is complete and well-bounded
The story list satisfies all of:
- Every distinct user-facing capability has exactly one story
- No story spans more than one distinct user capability
- No user capability described in the vision is missing a story
- Dependencies between stories are identified (which stories must be built before others)
- Each story has a title and a one-sentence purpose that makes its scope unambiguous

Failing signal: a spec agent would be uncertain whether a capability belongs to one story or another, or a capability from the vision has no story.

### 8. No open questions remain
After ideation, no question exists that would force a spec, development, or deployment agent to invent an answer. Specifically:
- Auth model is decided (authenticated vs unauthenticated, session vs token, provider if third-party)
- Configuration variables are listed (not fully specified, but identified by name and purpose)
- Guardrails are defined (directory structure, secret handling, source organization)
- Any hard constraints (performance, compliance, browser support) are stated

Failing signal: any architecture artifact section would contain `_not yet written_` or equivalent after ideation exits.

---

## Handoff criteria (what ACHIEVED means)

When the ideation-eval-agent returns `verdict: ACHIEVED`, it must confirm all 8 criteria above are met with specific evidence from the written artifacts. The orchestrator derives Goal₀ for each story's spec loop directly from the canonical artifacts on disk — no handoff payload is needed from the eval agent.
