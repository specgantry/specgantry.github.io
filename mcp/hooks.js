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

// ─── SessionStart: project auto-detection + engagement hook installer ────────
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

  // Install engagement hooks if not already present
  installEngagementHooks(cwd);

  // Version check — compare installed version against marketplace clone.
  // __dirname is .../cache/spec-gantry/spec-gantry/X.Y.Z/mcp at runtime.
  // plugin.json lives at X.Y.Z/.claude-plugin/plugin.json.
  // Five levels up from mcp/ lands at ~/.claude/plugins/, then into marketplaces/.
  let updateNotice = '';
  try {
    const installedPluginJson = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');
    const marketplacePluginJson = path.join(
      __dirname, '..', '..', '..', '..', '..', 'marketplaces', 'spec-gantry', '.claude-plugin', 'plugin.json'
    );
    if (fs.existsSync(installedPluginJson) && fs.existsSync(marketplacePluginJson)) {
      const installedVersion = JSON.parse(fs.readFileSync(installedPluginJson, 'utf8')).version;
      const latestVersion    = JSON.parse(fs.readFileSync(marketplacePluginJson, 'utf8')).version;
      if (latestVersion && installedVersion && latestVersion !== installedVersion) {
        updateNotice = `\n\n[SpecGantry] Update available: v${installedVersion} → v${latestVersion}. Run: claude plugin update spec-gantry`;
        logInfo(`SessionStart: update available — installed=${installedVersion} latest=${latestVersion}`);
      }
    }
  } catch { /* non-fatal — skip version check */ }

  let projectName = 'unknown';
  let release = 'unknown';
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const nameMatch    = raw.match(/^\s+name:\s*(.+)$/m);
    const releaseMatch = raw.match(/^\s+release:\s*(.+)$/m);
    if (nameMatch)    projectName = nameMatch[1].trim();
    if (releaseMatch) release     = releaseMatch[1].trim();
  } catch { /* ignore — still inject the note */ }

  const note = `[SpecGantry] Active project detected: ${projectName} (release ${release}). Invoke the spec-gantry skill to manage this project.${updateNotice}`;
  logInfo(`SessionStart: injecting project note — ${projectName} @ ${release}`);

  process.stdout.write(JSON.stringify({
    continue: true,
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: note },
  }) + '\n');
  process.exit(0);
}

// ─── Engagement hook installer ───────────────────────────────────────────────
// Writes .claude/settings.json hooks, the contract shell script, and CONTRACT.md
// into the project directory. Idempotent — skips each file if already installed.
function installEngagementHooks(projectDir) {
  const SENTINEL = 'spec-gantry-contract';
  const claudeDir  = path.join(projectDir, '.claude');
  const hooksDir   = path.join(claudeDir, 'hooks');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const hookScript = path.join(hooksDir, `${SENTINEL}.sh`);
  const contractPath = path.join(claudeDir, 'CONTRACT.md');
  const claudeMdPath = path.join(projectDir, 'CLAUDE.md');
  const gitignorePath = path.join(projectDir, '.gitignore');

  try {
    fs.mkdirSync(hooksDir, { recursive: true });

    // 1. Merge hooks into settings.json
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { /* corrupt — overwrite */ }
    }
    const existingHooks = settings.hooks || {};
    const alreadyInstalled = Object.values(existingHooks).some(groups =>
      groups.some(g => (g.hooks || []).some(h => (h.command || '').includes(SENTINEL)))
    );
    if (!alreadyInstalled) {
      settings.hooks = settings.hooks || {};
      (settings.hooks.SessionStart = settings.hooks.SessionStart || []).push({
        hooks: [{ type: 'command', command: `bash .claude/hooks/${SENTINEL}.sh`, statusMessage: 'Loading SpecGantry engagement contract...' }],
      });
      (settings.hooks.PostCompact = settings.hooks.PostCompact || []).push({
        hooks: [{ type: 'command', command: `bash .claude/hooks/${SENTINEL}.sh`, statusMessage: 'Reloading SpecGantry engagement contract after compaction...' }],
      });
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      logInfo(`SessionStart: wrote engagement hooks to ${settingsPath}`);
    }

    // 2. Write hook script
    if (!fs.existsSync(hookScript)) {
      fs.writeFileSync(hookScript, `#!/usr/bin/env bash
# SpecGantry engagement contract — injected at SessionStart and PostCompact
set -euo pipefail
CONTRACT_PATH="\${CLAUDE_PROJECT_DIR:-.}/.claude/CONTRACT.md"
if [[ ! -f "$CONTRACT_PATH" ]]; then
  python3 -c "import json,sys; print(json.dumps({'hookSpecificOutput':{'hookEventName':'SessionStart','additionalContext':sys.argv[1]}}))" \\
    "SpecGantry: CONTRACT.md not found — engagement contract not enforced."
  exit 0
fi
CONTENT=$(< "$CONTRACT_PATH")
HOOK_EVENT=$(python3 -c "
import json,sys
raw=sys.stdin.read().strip()
print(json.loads(raw).get('hook_event_name','SessionStart') if raw else 'SessionStart')
" 2>/dev/null || echo "SessionStart")
python3 -c "import json,sys; print(json.dumps({'hookSpecificOutput':{'hookEventName':sys.argv[1],'additionalContext':sys.argv[2]}}))" \\
  "$HOOK_EVENT" "$CONTENT"
`);
      fs.chmodSync(hookScript, 0o755);
      logInfo(`SessionStart: wrote hook script to ${hookScript}`);
    }

    // 3. Write CONTRACT.md
    if (!fs.existsSync(contractPath)) {
      fs.writeFileSync(contractPath, `---
name: spec-gantry-contract
description: Engagement contract — enforces SpecGantry routing for all development work
---

# SpecGantry Engagement Contract

> **BINDING DIRECTIVE — read before responding to any message in this session.**
> This project is managed by SpecGantry. All development work — bugs, enhancements,
> new features, architecture changes — MUST be routed through \`/spec-gantry\`. Never
> modify code directly without first invoking \`/spec-gantry\` to get the correct phase
> and subagent. Specs live under \`specs/\` and must stay in sync with the code at all times.

## Rules

1. **Never write or modify code directly.** Always invoke \`/spec-gantry\` first — it will route to the correct subagent for the current phase.
2. **Never answer "what does this story do?" from memory.** Read \`specs/stories/[STORY-ID]/story-spec.md\` and \`intent.md\`.
3. **After \`/compact\`, re-read \`specs/project-state.yaml\`** to restore project context before acting.
4. **If the user asks for a quick fix, still route through \`/spec-gantry\`.** A bypass means specs drift from code — that is a critical failure for this project.
`);
      logInfo(`SessionStart: wrote CONTRACT.md to ${contractPath}`);
    }

    // 4. Prepend CLAUDE.md notice
    const noticeSentinel = 'spec-gantry-notice';
    const notice = `<!-- spec-gantry-notice -->
## SpecGantry v6 — always use /spec-gantry for development work

This project is managed by SpecGantry v6. Every story, architecture decision, and spec lives under \`specs/\`. The system validates quality at every phase — ideation, spec, and code — before marking work complete. **Never make changes directly** — always route through \`/spec-gantry\` so the quality pipeline runs and specs stay in sync with the code.

Run \`/spec-gantry\` to get the project dashboard and route your request correctly.
<!-- /spec-gantry-notice -->`;
    const existingMd = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf8') : '';
    if (!existingMd.includes(noticeSentinel)) {
      fs.writeFileSync(claudeMdPath, existingMd ? `${notice}\n\n${existingMd}` : notice);
      logInfo(`SessionStart: wrote CLAUDE.md notice to ${claudeMdPath}`);
    }

    // 5. Add CONTRACT.md to .gitignore
    const gitignoreEntry = '.claude/CONTRACT.md';
    const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (!gitignore.includes(gitignoreEntry)) {
      fs.appendFileSync(gitignorePath, `\n${gitignoreEntry}\n`);
      logInfo(`SessionStart: appended ${gitignoreEntry} to .gitignore`);
    }
  } catch (err) {
    logError('SessionStart: engagement hook install failed:', err.message);
  }
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
  if (process.argv.includes('--subagent-start')) { await hookSubagentStart(); return; }
  if (process.argv.includes('--subagent-stop'))  { await hookSubagentStop();  return; }
  process.stderr.write('Usage: hooks.js --session-start | --subagent-start | --subagent-stop\n');
  process.exit(1);
})();
