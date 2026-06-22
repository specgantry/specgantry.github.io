#!/usr/bin/env node
// SpecGantry hook handlers — invoked by Claude Code's hook system (not the MCP server)
// Handles: SessionStart (project detection), PreToolUse (agent gating), SubagentStart (logging), SubagentStop (cost tracking)
// stdlib-only — no npm dependencies required

'use strict';

const path = require('path');
const fs   = require('fs');
const {
  initLogger, setLogFile, logError, logInfo, logDebug,
  CLAUDE_HOME, PROJECT_DIR,
  AGENT_MAP, PROJECT_LEVEL_PHASES,
  sumTokensFromTranscript, inferStoryFromTranscript, readActiveStoryFromProjectState,
  projectSlug, buildCostEntry, appendCostLog, readStdin,
} = require('./shared');

// ─── SessionStart: project auto-detection ────────────────────────────────────
// If specs/project-state.yaml exists in cwd, inject a context note so Claude
// recognises this as an active SpecGantry project without the user typing /spec-gantry.
async function hookSessionStart() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch (err) {
    logError('SessionStart: failed to parse payload:', err.message);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const cwd = payload.cwd || PROJECT_DIR;
  const stateFile = path.join(cwd, 'specs', 'project-state.yaml');

  if (!fs.existsSync(stateFile)) {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  // Extract project name and release from state file (simple regex, no YAML parser needed)
  let projectName = 'unknown';
  let release = 'unknown';
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const nameMatch    = raw.match(/^\s+name:\s*(.+)$/m);
    const releaseMatch = raw.match(/^\s+release:\s*(.+)$/m);
    if (nameMatch)    projectName = nameMatch[1].trim();
    if (releaseMatch) release     = releaseMatch[1].trim();
  } catch { /* ignore — still inject the note */ }

  const note = `[SpecGantry] Active project detected: ${projectName} (release ${release}). Invoke the spec-gantry skill to manage this project.`;
  logInfo(`SessionStart: injecting project note — ${projectName} @ ${release}`);

  process.stdout.write(JSON.stringify({
    continue: true,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: note },
  }) + '\n');
  process.exit(0);
}

// ─── PreToolUse: Agent tool guard ────────────────────────────────────────────
// Blocks any Agent spawn whose subagent_type is not an approved spec-gantry:*:* agent.
// Prevents Claude Code from going off-script with general-purpose agents, etc.
async function hookPreToolUse() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch (err) {
    logError('PreToolUse: failed to parse payload:', err.message);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const toolName  = payload.tool_name  || payload.toolName  || '';
  if (toolName !== 'Agent') {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const input     = payload.tool_input || payload.toolInput || {};
  const agentType = input.subagent_type || input.agentType  || '';

  const ALLOWED = [
    /^spec-gantry:/,   // all SpecGantry subagents
    /^Plan$/,          // Claude Code plan mode — read-only, harmless
    /^statusline-setup$/, // Claude Code status line helper
  ];

  const allowed = !agentType || ALLOWED.some(p => p.test(agentType));

  if (!allowed) {
    logInfo(`PreToolUse: blocking unsanctioned agent type "${agentType}"`);
    process.stdout.write(JSON.stringify({
      continue: false,
      stopReason: `SpecGantry: agent type "${agentType}" is not permitted. Only spec-gantry subagents may be spawned during a SpecGantry session.`,
    }) + '\n');
  } else {
    logDebug(`PreToolUse: allowing agent type "${agentType || '(default)'}"`);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  }
  process.exit(0);
}

// ─── SubagentStart: phase logging ────────────────────────────────────────────
async function hookSubagentStart() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch (err) {
    logError('SubagentStart: failed to parse payload:', err.message);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const agentType = payload.agent_type || payload.agentType || '';
  const mapping   = AGENT_MAP[agentType];
  if (mapping) logInfo(`Agent started: ${mapping.phase} (${agentType})`);

  process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  process.exit(0);
}

// ─── SubagentStop: cost tracking ─────────────────────────────────────────────
async function hookSubagentStop() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch (err) {
    logError('SubagentStop: failed to parse payload:', err.message);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const { agent_id, session_id, cwd } = payload;
  // Claude Code 2.0.42+ provides agent_transcript_path; older versions used transcript_path
  const transcript_path = payload.agent_transcript_path || payload.transcript_path;
  const agentType = payload.agent_type || payload.agentType || '';
  const mapping   = AGENT_MAP[agentType];

  logDebug('SubagentStop: payload fields:', JSON.stringify({ agent_id, session_id, cwd, agentType, has_agent_transcript_path: !!payload.agent_transcript_path, has_transcript_path: !!payload.transcript_path }));

  if (!mapping) {
    logDebug(`SubagentStop: skipping non-SpecGantry agent "${agentType}"`);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  logInfo(`SubagentStop: recording cost for ${mapping.phase} (${agentType})`);

  const projectDir = cwd || PROJECT_DIR;
  logDebug(`SubagentStop: projectDir="${projectDir}" (cwd="${cwd}" PROJECT_DIR="${PROJECT_DIR}")`);

  // Resolve transcript: prefer the explicit path from the payload; fall back to
  // constructing it from agent_id/session_id if the field is absent (pre-2.0.42).
  const resolvedTranscript = transcript_path || (() => {
    const slug = projectSlug(projectDir);
    // session_id may be absent in newer CC versions — scan sessions by mtime as last resort
    if (session_id) {
      return path.join(CLAUDE_HOME, 'projects', slug, session_id, 'subagents', `agent-${agent_id}.jsonl`);
    }
    const projBase = path.join(CLAUDE_HOME, 'projects', slug);
    try {
      const sessions = fs.readdirSync(projBase)
        .filter(e => /^[0-9a-f-]{36}$/.test(e))
        .map(e => { try { const s = fs.statSync(path.join(projBase, e)); return s.isDirectory() ? { id: e, mtime: s.mtimeMs } : null; } catch { return null; } })
        .filter(Boolean).sort((a, b) => b.mtime - a.mtime);
      for (const sess of sessions) {
        const p = path.join(projBase, sess.id, 'subagents', `agent-${agent_id}.jsonl`);
        if (fs.existsSync(p)) return p;
      }
    } catch { /* ignore */ }
    return null;
  })();

  logDebug('SubagentStop: transcript path:', resolvedTranscript);

  if (!resolvedTranscript || !fs.existsSync(resolvedTranscript)) {
    logError('SubagentStop: transcript not found:', resolvedTranscript, '— skipping cost entry');
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const tokens  = sumTokensFromTranscript(resolvedTranscript);
  const model   = tokens.model || mapping.model;
  let component = null;

  if (!PROJECT_LEVEL_PHASES.has(mapping.phase)) {
    component = inferStoryFromTranscript(resolvedTranscript, projectDir);
    if (!component) {
      logDebug(`SubagentStop: story inference failed for ${mapping.phase}, rechecking active_story fallback`);
      const activeStory = readActiveStoryFromProjectState(projectDir);
      if (activeStory) {
        component = activeStory;
        logInfo(`SubagentStop: recovered story from active_story fallback: ${component}`);
      }
    }
  }

  logDebug('SubagentStop: tokens:', JSON.stringify(tokens), 'model:', model, 'story:', component);

  const entry = buildCostEntry({ phase: mapping.phase, agentType, model, component, projectDir, tokens });

  try {
    appendCostLog(entry, projectDir);
    // Cost entry goes to the costs log; switch file for this write then switch back
    setLogFile('spec-gantry-costs.log');
    logInfo(`Cost recorded — ${mapping.phase}${component ? ' / ' + component : ''} — ${tokens.input_tokens + tokens.output_tokens} tokens — $${entry.total_cost_usd} (${entry.pricing_source})`);
    setLogFile('spec-gantry-hooks.log');
  } catch (err) {
    logError('SubagentStop: failed to write cost-log.ndjson:', err.message);
  }

  process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  process.exit(0);
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
(async function main() {
  initLogger('spec-gantry-hooks.log');
  if (process.argv.includes('--session-start'))  { await hookSessionStart();  return; }
  if (process.argv.includes('--pre-tool-use'))   { await hookPreToolUse();    return; }
  if (process.argv.includes('--subagent-start')) { await hookSubagentStart(); return; }
  if (process.argv.includes('--subagent-stop'))  { await hookSubagentStop();  return; }
  process.stderr.write('Usage: hooks.js --session-start | --pre-tool-use | --subagent-start | --subagent-stop\n');
  process.exit(1);
})();
