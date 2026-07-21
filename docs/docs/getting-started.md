---
layout: docs
title: Getting Started
description: Install SpecGantry and run your first session in under 5 minutes.
permalink: /docs/getting-started/
prev_page: "Overview"
prev_page_url: "/docs"
next_page: "How It Works"
next_page_url: "/docs/how-it-works"
---

# Getting Started

**Estimated time: 5 minutes**

---

## Install

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">terminal</span></div>

```bash
$ claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
$ claude plugin install spec-gantry@spec-gantry
```
</div>

Claude Code confirms: `✓ Plugin installed: SpecGantry v7.0.5`

<div class="info">
  <strong>Why two commands?</strong> <code>claude plugin install</code> resolves names from registered marketplaces only. You only need to add the marketplace once — every subsequent project just needs the second command.
</div>

**Already installed? Update:**

```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

---

## Start Your First Session

Open Claude Code in any project directory and run:

```
/spec-gantry
```

SpecGantry detects what's already in the directory:

| Situation | What happens |
|---|---|
| Empty directory | Start new project — enter name and vision |
| Source files, no `specs/` | Reverse-engineer: generates north star, architecture, and capability list from your code |
| `specs/` exists | Resume — dashboard shows pipeline state and routes you to the next action |

---

## New Project: Ideation

SpecGantry asks for a project name and a 2–4 sentence vision. Then the ideation loop begins — an adversarial challenger reads your vision and fires a round of blocking questions, grouped by theme. You answer them all in one response.

```
──────────────────────────────────────────────────────────
  Ideation · Round 1 of 5
──────────────────────────────────────────────────────────

Data ownership
  Recipes are described as personal — is there any concept of sharing
  or exporting, or is this strictly single-user?

Tech fit
  "No login needed" alongside SQLite: does that mean anyone with
  machine access can use it, or should there be a local password?

Scale
  What does "search by ingredient" mean at the edges — partial match,
  exact match, or "find recipes where I have all the ingredients"?
```

When the judge returns CLEAR, the write agent runs once and produces:
- `specs/north-star.md` — what good looks like for this project
- `specs/architecture/architecture.md` — all technical decisions
- `specs/capabilities/[CAP-ID]/intent.md` — one per capability

```
✓ Ideation complete  ·  Recipe management · Tag and organise · Ingredient search
💡 Good moment to /compact — ideation context is large, all decisions are on disk.
```

**Commit your specs now:**
```bash
git add specs/
git commit -m "feat: SpecGantry project init"
```

---

## The Dashboard

After ideation, every `/spec-gantry` session starts with the dashboard:

<div class="docs-terminal" markdown="1">
<div class="terminal-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">claude — spec-gantry</span></div>

```
SpecGantry v7  |  Recipe Manager  |  release 1.0.0
Ideation ✅  ·  Spec [██░] 2/3  ·  Build [█░░] 1/3  ·  Deploy [░░░░] –
──────────────────────────────────────────────────────────
  ID       Capability                         Spec         Build
  ──────────────────────────────────────────────────────────────────
  [001]   Recipe management                   ✅           ✅
  [002]   Tag and organise                    ✅           🔄 challenge·2
  [003]   Ingredient search                   🔄 judge     ⏳
  ──────────────────────────────────────────────────────────────────
  Release 1.0.0                                            ○ not deployed
──────────────────────────────────────────────────────────────────
  Type a capability ID to manage it   [$] Cost & insights
  [1] Build next — [002]: Tag…        [?] Help
  [>] Run to next pause               [X] Exit
  [N] New work
──────────────────────────────────────────────────────────────────
Enter capability ID or action:  >
```
</div>

Type `[>]` to run the full pipeline automatically — spec and build all remaining capabilities, pausing only at genuine decision points.

---

## Spec and Code

**Spec loop (autonomous):** The challenge agent asks what a developer would be blocked on. The write agent resolves every challenge into `capability-spec.md`. The judge checks readiness. You see the result once — when the judge returns CLEAR:

```
✓ Spec validated — CAP-001: Recipe management
  All async states described, empty state covered, error messages specified.

  [Y] Approve spec   [E] Edit   [X] Hold
```

**Code loop (fully automated):** Plan → build → user-proxy challenge traces the experience through the actual source files → repair if blocked. You see the transition note:

```
✓ Build complete · CAP-001  ·  quality: pass (1 cycle)
✓ Build complete · CAP-002  ·  quality: pass (2 cycles — loading state added)
```

---

## Deploy

Once all capabilities are built, SpecGantry prompts to deploy. The deployment agent runs a north-star alignment check first, then generates Dockerfiles, docker-compose.yml, .env.example, and a versioned deploy.sh for your target platform.

---

## Daily Workflow

| Situation | Command |
|---|---|
| Start or resume any work | `/spec-gantry` |
| Auto-run the full pipeline | `/spec-gantry` → `[>]` |
| Report a bug or new capability | `/spec-gantry` → `[N]` |
| Check costs | `/track-cost` |

---

<div class="next-steps-grid">
  <a href="/docs/how-it-works" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-gear"></i></div>
    <div>
      <strong>How It Works</strong>
      <span>Deep dive into the CWJ loop, the north star, and diagnostic routing.</span>
    </div>
  </a>
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>The dashboard, commands, and workflow walkthroughs.</span>
    </div>
  </a>
</div>
