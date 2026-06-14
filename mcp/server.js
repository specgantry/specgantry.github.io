#!/usr/bin/env node
// SpecGantry Cost Tracking MCP Server
// Long-running stdio JSON-RPC server — serves record_agent_cost and refresh_pricing tools.
// stdlib-only — no npm dependencies required
// Cross-platform: Mac, Linux, Windows

'use strict';

const fs   = require('fs');
const path = require('path');
const {
  initLogger, logError, logInfo, logDebug,
  PLUGIN_DIR, PROJECT_DIR,
  AGENT_MAP,
  getRatesForModel, refreshPricing, atomicWriteJson, RATES_CACHE,
  appendCostLog, readProjectRelease,
  resolveAgentFromToolUseId, detectCurrentSession,
  buildCostEntry,
} = require('./shared');

// ─── Tool: record_agent_cost ──────────────────────────────────────────────────
async function toolRecordAgentCost(args) {
  const { toolUseId, phase, model, story = null, projectDir: reqProjectDir } = args;
  const projectDir = reqProjectDir || PROJECT_DIR;
  logDebug('record_agent_cost called:', JSON.stringify({ toolUseId, phase, model, story }));

  if (!toolUseId || !phase || !model) {
    logError('record_agent_cost: missing required fields');
    return { ok: false, error: 'Missing required fields: toolUseId, phase, model' };
  }

  // Retry once after 500ms — Claude Code may not have flushed the .meta.json yet
  let resolved = resolveAgentFromToolUseId(toolUseId);
  if (!resolved) {
    logDebug('toolUseId not found on first attempt, retrying after 500ms');
    await new Promise(r => setTimeout(r, 500));
    resolved = resolveAgentFromToolUseId(toolUseId);
  }
  if (!resolved) {
    logError('record_agent_cost: could not resolve toolUseId', toolUseId);
    return { ok: false, error: `Could not find subagent for toolUseId: ${toolUseId}` };
  }

  const { agentId, subagentDir } = resolved;
  const transcriptPath = path.join(subagentDir, `agent-${agentId}.jsonl`);
  logDebug('Reading transcript:', transcriptPath);

  const agentType = Object.keys(AGENT_MAP).find(k => AGENT_MAP[k].phase === phase) || `agent-${agentId}`;

  // Sum tokens directly — record_agent_cost is called by the orchestrator which already
  // knows phase/model, so we don't need inferComponentFromTranscript here.
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  let input_tokens = 0, output_tokens = 0, cache_creation_tokens = 0, cache_read_tokens = 0;
  for (const line of lines) {
    try {
      const r = JSON.parse(line);
      if (r.type !== 'assistant') continue;
      const usage = r.message && r.message.usage;
      if (!usage) continue;
      input_tokens          += (usage.input_tokens || 0);
      output_tokens         += (usage.output_tokens || 0);
      cache_creation_tokens += (usage.cache_creation_input_tokens || 0);
      cache_read_tokens     += (usage.cache_read_input_tokens || 0);
    } catch { /* malformed line */ }
  }

  const tokens = { input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens };
  const entry  = buildCostEntry({ phase, agentType, model, component: story, projectDir, tokens });

  appendCostLog(entry, projectDir);
  logInfo(`Cost recorded: ${phase}${story ? ' / ' + story : ''} — ${input_tokens + output_tokens} tokens — $${entry.total_cost_usd} (${entry.pricing_source})`);

  return { ok: true, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost_usd: entry.total_cost_usd };
}

// ─── Tool: refresh_pricing ────────────────────────────────────────────────────
async function toolRefreshPricing(_args) {
  return refreshPricing();
}

// ─── MCP stdio JSON-RPC ───────────────────────────────────────────────────────
const TOOLS = {
  record_agent_cost: {
    description: 'Resolve a subagent by its toolUseId, read real token counts from its JSONL transcript, and append a cost entry to specs/cost-log.ndjson.',
    inputSchema: {
      type: 'object',
      required: ['toolUseId', 'phase', 'model'],
      properties: {
        toolUseId: { type: 'string', description: 'The id field of the Agent tool_use call — looks like toolu_bdrk_...' },
        phase:     { type: 'string', description: 'SpecGantry phase name, e.g. ideation, story_spec, development, deployment' },
        model:     { type: 'string', description: 'Exact model ID from the agent frontmatter, e.g. claude-sonnet-4-6' },
        story:     { type: 'string', description: 'Story ID (STORY-001) or null for project-level phases', nullable: true },
        projectDir: { type: 'string', description: 'Absolute path to the project directory. Defaults to server cwd if omitted.' },
      },
    },
    handler: toolRecordAgentCost,
  },
  refresh_pricing: {
    description: 'Fetch current Anthropic model pricing and update the local rates cache.',
    inputSchema: { type: 'object', properties: {} },
    handler: toolRefreshPricing,
  },
};

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function handleRequest(req) {
  const { id, method, params } = req;
  logDebug('→', method, id !== undefined ? `(id=${id})` : '(notification)');

  if (method === 'initialize') {
    logInfo('MCP client connected');
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'spec-gantry-costs', version: '1.0.0' },
    });
  }

  if (method === 'tools/list') {
    return sendResponse(id, {
      tools: Object.entries(TOOLS).map(([name, def]) => ({
        name, description: def.description, inputSchema: def.inputSchema,
      })),
    });
  }

  if (method === 'tools/call') {
    const tool = TOOLS[params && params.name];
    if (!tool) {
      logError('Unknown tool:', params && params.name);
      return sendError(id, -32601, `Unknown tool: ${params && params.name}`);
    }
    try {
      const result = await tool.handler((params && params.arguments) || {});
      logDebug('←', params.name, JSON.stringify(result));
      return sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
    } catch (err) {
      logError(params.name, 'threw:', err.message);
      return sendError(id, -32603, err.message);
    }
  }

  if (id !== undefined) sendError(id, -32601, `Unknown method: ${method}`);
}

// ─── Startup ──────────────────────────────────────────────────────────────────
(async function main() {
  initLogger('spec-gantry-costs.log');
  logInfo(`Starting spec-gantry-costs MCP server (log level: ${process.env.SPEC_GANTRY_LOG_LEVEL || 'info'})`);
  logDebug('PROJECT_DIR:', PROJECT_DIR);
  logDebug('PLUGIN_DIR:', PLUGIN_DIR);

  detectCurrentSession();
  refreshPricing().catch(() => { /* already logged */ });

  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try { await handleRequest(JSON.parse(trimmed)); }
      catch (err) { sendError(null, -32700, `Parse error: ${err.message}`); }
    }
  });

  process.stdin.on('end', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT',  () => process.exit(0));
  process.on('uncaughtException',  err => logError('Uncaught exception:', err.message, err.stack));
  process.on('unhandledRejection', err => logError('Unhandled rejection:', err));
})();
