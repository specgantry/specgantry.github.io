---
layout: docs
title: How It Works
description: The Challenge-Write-Judge loop — why adversarial challenge at every phase produces better outcomes than speed-first AI development.
permalink: /docs/how-it-works/
prev_page: "Getting Started"
prev_page_url: "/docs/getting-started"
next_page: "Skills & Agents"
next_page_url: "/docs/skills"
---

# How SpecGantry Works

The core idea is simple: **challenge before you write, at every phase.** An independent adversarial agent asks what would block the next phase before anything is written or built. Only when it can't find a blocker does the work proceed.

This runs three times — at ideation, at spec, and at code — with a different adversary each time.

---

## The Challenge-Write-Judge Loop

<div class="dg-wrap">
<div class="dg-diagram-title">The same loop at every phase</div>
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-shield-exclamation"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Challenge</div>
      <div class="dg-flow-node-desc">An adversarial agent asks what would block the next phase — specific to this project, not a checklist. Never writes files.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-pencil-square"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Write / Build</div>
      <div class="dg-flow-node-desc">Every challenge resolved. At ideation you answer; at spec and code, agents resolve autonomously.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-patch-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Judge</div>
      <div class="dg-flow-node-desc"><em>"Would the next phase be blocked?"</em> CLEAR exits. BLOCKED continues with specific gaps. Independent — never the same agent that wrote.</div>
    </div>
  </div>

</div>
</div>

The challenger identity changes per phase:

| Phase | Who the challenger represents | What they ask |
|---|---|---|
| Ideation | Senior developer pre-build | "What would stop me agreeing to start?" |
| Spec | Developer about to build | "What would block me building from this?" |
| Code | User trying to accomplish the task | "Can I actually do what was promised?" |

Gaps caught at ideation cost nothing to fix. Gaps caught at spec save a full build cycle. Gaps caught at code are far cheaper than gaps caught in production.

---

## The Pipeline

Four phases. Hard gates between each. No phase starts until the previous one clears.

<div class="dg-wrap">
<div class="dg-flow">

  <div class="dg-flow-node dg-ideation">
    <div class="dg-flow-node-icon"><i class="bi bi-lightbulb"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Ideation — you answer, agent challenges</div>
      <div class="dg-flow-node-desc">The only phase with high human interaction. Challenge rounds surface ambiguity before anything is committed to spec. Produces a north star, architecture file, and an experience promise per capability.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Gate: every capability has a committed experience promise</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-spec">
    <div class="dg-flow-node-icon"><i class="bi bi-file-earmark-check"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Spec — autonomous, you approve once</div>
      <div class="dg-flow-node-desc">A developer-proxy challenger asks what would block building this. A write agent resolves every gap. You see the spec once — when a judge has confirmed a developer wouldn't be blocked.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Gate: machine-challenged spec, user-approved</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-build">
    <div class="dg-flow-node-icon"><i class="bi bi-hammer"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Code — fully automated</div>
      <div class="dg-flow-node-desc">Build agent implements end-to-end. A user-proxy then reads the actual source files and asks if a user can accomplish what was promised. Gaps are repaired before the capability exits.</div>
    </div>
  </div>

  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>
  <div class="dg-flow-gate-row" style="justify-content:center;width:100%;max-width:560px">
    <div class="dg-flow-gate-badge"><i class="bi bi-lock-fill" style="font-size:.6rem"></i> &nbsp;Gate: all capabilities built and challenge-cleared</div>
  </div>
  <div class="dg-flow-arrow"><div class="dg-flow-arrow-line"></div><div class="dg-flow-arrow-head">▼</div></div>

  <div class="dg-flow-node dg-deploy">
    <div class="dg-flow-node-icon"><i class="bi bi-rocket-takeoff"></i></div>
    <div class="dg-flow-node-body">
      <div class="dg-flow-node-title">Deploy</div>
      <div class="dg-flow-node-desc">North-star alignment check first. Then Dockerfiles, docker-compose, and a versioned deploy script for your target platform.</div>
    </div>
  </div>

</div>
</div>

---

## When Something Goes Wrong

When a bug or gap surfaces post-build, an investigate agent classifies the root cause before routing to a repair loop. The classification matters: a spec gap sent to the code repair loop will never converge — the spec must be fixed first.

| Classification | What it means | Where the fix goes |
|---|---|---|
| Code bug | Code doesn't match the spec | Re-enter code loop |
| Spec gap | Code did what spec said; spec was insufficient | Re-run spec, then rebuild |
| Requirement drift | Misunderstood at ideation | Amend the north star, re-spec, rebuild |
| New capability | Genuinely new work | Ideation in amendment mode |

---

## Next Steps

<div class="next-steps-grid">
  <a href="/docs/skills" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-tools"></i></div>
    <div>
      <strong>Skills Guide</strong>
      <span>The dashboard, commands, and workflow walkthroughs.</span>
    </div>
  </a>
  <a href="/docs/faq" class="next-step-card">
    <div class="next-step-icon"><i class="bi bi-question-circle"></i></div>
    <div>
      <strong>FAQ</strong>
      <span>Common questions on installation, costs, and troubleshooting.</span>
    </div>
  </a>
</div>
