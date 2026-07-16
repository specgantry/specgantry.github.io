---
name: feedback_quality_loop_mandatory
description: Quality loop (evaluate → plan → repair) is mandatory after every dev agent invocation, including bug_fix and enhancement paths — never skip it
metadata:
  type: feedback
---

After ANY development subagent invocation — build_next_story, bug_fix, or enhancement — the orchestrator MUST invoke the evaluate subagent (Step Q2) before marking built. The plan+repair subagents run only if evaluate returns FAIL, but evaluate itself is unconditional.

**Why:** The orchestrator repeatedly bypassed the quality loop on small changes ("it's just a CSS tweak", "it's a one-liner"), treating it as overhead rather than a hard step. This left builds unscored and let silent regressions through.

**How to apply:** Treat "→ Step Q2" as a goto with no conditions. Size of the change is irrelevant. Only the signal handlers (concern raised, P1 re-route, `overall_status: fail`) can detour — nothing else. The fix in SKILL.md adds a bold mandatory callout block at the top of Step 4 and changes "On success → enter quality loop" to "On `overall_status: pass` → **→ Step Q2** (mandatory — do not skip)".
