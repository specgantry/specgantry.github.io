#!/usr/bin/env node
// SpecGantry hook handlers — invoked by Claude Code's hook system (not the MCP server)
// Handles: SessionStart (project detection), PreToolUse (agent gating),
//          SubagentStart (stamp byte offset), SubagentStop (cost tracking)
// stdlib-only — no npm dependencies required

'use strict';

const path = require('path');
const fs   = require('fs');
const {
  initLogger, setLogFile, logError, logInfo, logDebug,
  PROJECT_DIR,
  AGENT_MAP,
  resolveTranscriptPath,
  sumTokensFromSlice,
  writeStamp, readStamp, deleteStamp,
  buildCostEntry, appendCostLog, readStdin,
} = require('./shared');

// ─── SessionStart: project auto-detection ────────────────────────────────────
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
async function hookPreToolUse() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch (err) {
    logError('PreToolUse: failed to parse payload:', err.message);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const toolName = payload.tool_name || payload.toolName || '';
  if (toolName !== 'Agent') {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const input     = payload.tool_input || payload.toolInput || {};
  const agentType = input.subagent_type || input.agentType  || '';

  const ALLOWED = [
    /^spec-gantry:/,
    /^Plan$/,
    /^statusline-setup$/,
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

// ─── SubagentStart: record byte offset ───────────────────────────────────────
// Fires before the subagent makes any API calls. Records the current size of
// the transcript file (0 if it doesn't exist yet) so SubagentStop can read
// only the bytes this invocation produced — no cumulative inflation.
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

  if (!mapping) {
    logDebug(`SubagentStart: skipping non-SpecGantry agent "${agentType}"`);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const { agent_id, session_id, cwd } = payload;
  const transcript_path = payload.agent_transcript_path || payload.transcript_path;
  const projectDir = cwd || PROJECT_DIR;

  const transcriptPath = resolveTranscriptPath({
    transcript_path,
    agent_id,
    session_id,
    projectDir,
  });

  // Record the byte offset — how many bytes already exist before this invocation writes anything.
  // If the file doesn't exist yet, offset is 0 and we'll read the whole file at Stop.
  let byteOffset = 0;
  if (transcriptPath) {
    try {
      byteOffset = fs.statSync(transcriptPath).size;
    } catch { /* file doesn't exist yet — offset stays 0 */ }
  }

  writeStamp(projectDir, agent_id, {
    transcript_path: transcriptPath,
    byte_offset: byteOffset,
    phase: mapping.phase,
    agent_type: agentType,
  });

  logDebug(`SubagentStart: stamped ${agentType} agent_id=${agent_id} offset=${byteOffset} path=${transcriptPath}`);

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

  const agentType = payload.agent_type || payload.agentType || '';
  const mapping   = AGENT_MAP[agentType];

  if (!mapping) {
    logDebug(`SubagentStop: skipping non-SpecGantry agent "${agentType}"`);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const { agent_id, session_id, cwd } = payload;
  const transcript_path = payload.agent_transcript_path || payload.transcript_path;
  const projectDir = cwd || PROJECT_DIR;

  // Read the stamp written at SubagentStart
  const stamp = readStamp(projectDir, agent_id);
  deleteStamp(projectDir, agent_id);

  // Resolve transcript path — prefer stamp (recorded at start before any writes),
  // then fall back to payload fields
  const transcriptPath = (stamp && stamp.transcript_path)
    || resolveTranscriptPath({ transcript_path, agent_id, session_id, projectDir });

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    logError('SubagentStop: transcript not found:', transcriptPath, '— skipping cost entry');
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const byteOffset = (stamp && typeof stamp.byte_offset === 'number') ? stamp.byte_offset : 0;

  logDebug(`SubagentStop: reading ${agentType} agent_id=${agent_id} from offset=${byteOffset} path=${transcriptPath}`);

  const tokens = sumTokensFromSlice(transcriptPath, byteOffset);
  const model  = tokens.model || mapping.model;

  logDebug(`SubagentStop: tokens=${JSON.stringify(tokens)} model=${model}`);

  // Skip zero-token entries — subagent exited before making any API calls (e.g. gate failure)
  if (tokens.input_tokens === 0 && tokens.output_tokens === 0) {
    logDebug(`SubagentStop: zero tokens for ${agentType} agent_id=${agent_id} — skipping cost entry`);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  const entry = buildCostEntry({ phase: mapping.phase, agentType, model, projectDir, tokens });

  try {
    appendCostLog(entry, projectDir);
    setLogFile('spec-gantry-costs.log');
    logInfo(`Cost recorded — ${mapping.phase} — ${tokens.input_tokens + tokens.output_tokens} tokens — $${entry.total_cost_usd} (${entry.pricing_source})`);
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
