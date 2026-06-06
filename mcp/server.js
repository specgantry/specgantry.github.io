#!/usr/bin/env node
// SpecGantry Cost Tracking MCP Server
// stdlib-only — no npm dependencies required
// Cross-platform: Mac, Linux, Windows

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const https = require('https');
const http  = require('http');

// ─── Fallback pricing (training-knowledge rates, updated 2026-06) ────────────
// These are used when live fetch from anthropic.com/pricing fails.
// Keys match the exact model IDs used in agent frontmatter.
const FALLBACK_RATES = {
  'claude-haiku-4-5-20251001': { input_per_1m: 0.80,  output_per_1m: 4.00,  cache_write_per_1m: 1.00,  cache_read_per_1m: 0.08  },
  'claude-haiku-4-5':          { input_per_1m: 0.80,  output_per_1m: 4.00,  cache_write_per_1m: 1.00,  cache_read_per_1m: 0.08  },
  'claude-sonnet-4-6':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75,  cache_read_per_1m: 0.30  },
  'claude-sonnet-4-5':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75,  cache_read_per_1m: 0.30  },
  'claude-opus-4-8':           { input_per_1m: 15.00, output_per_1m: 75.00, cache_write_per_1m: 18.75, cache_read_per_1m: 1.50  },
  'claude-opus-4-5':           { input_per_1m: 15.00, output_per_1m: 75.00, cache_write_per_1m: 18.75, cache_read_per_1m: 1.50  },
};

// ─── Paths ────────────────────────────────────────────────────────────────────
const CLAUDE_HOME    = path.join(os.homedir(), '.claude');
const PLUGIN_DIR     = path.dirname(__filename);
const RATES_CACHE    = path.join(PLUGIN_DIR, 'rates-cache.json');
const PROJECT_DIR    = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PRICING_URL    = 'https://www.anthropic.com/pricing';

// ─── Slug derivation (matches Claude Code's convention) ──────────────────────
// /Users/foo/myproject  →  -Users-foo-myproject  (Mac/Linux)
// C:\Users\foo\project  →  C--Users-foo-project  (Windows)
function projectSlug(dir) {
  return path.normalize(dir)
    .replace(/[/\\]/g, '-')  // all slashes → dash
    .replace(/:/g, '-')       // Windows drive colon → dash
    .replace(/^-/, '');       // strip leading dash (from leading /)
}

// ─── Rates management ─────────────────────────────────────────────────────────
function loadCachedRates() {
  try {
    const data = JSON.parse(fs.readFileSync(RATES_CACHE, 'utf8'));
    return { rates: data.rates, fetchedAt: data.fetched_at, source: 'live' };
  } catch {
    return { rates: FALLBACK_RATES, fetchedAt: null, source: 'fallback' };
  }
}

function fetchPricingPage() {
  return new Promise((resolve, reject) => {
    const mod = PRICING_URL.startsWith('https') ? https : http;
    const req = mod.get(PRICING_URL, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow one redirect
        const redirectMod = res.headers.location.startsWith('https') ? https : http;
        redirectMod.get(res.headers.location, { timeout: 10000 }, (res2) => {
          let body = '';
          res2.on('data', c => body += c);
          res2.on('end', () => resolve(body));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

// Parse dollar amounts from the Anthropic pricing page HTML.
// The page renders prices as text like "$3.00" in proximity to model names.
// This is a best-effort parser; falls back gracefully on parse failure.
function parsePricingHtml(html) {
  const rates = {};

  // Map of patterns we look for → model ID
  const MODEL_PATTERNS = [
    { pattern: /haiku.{0,30}4[-.]?5/i,  id: 'claude-haiku-4-5-20251001' },
    { pattern: /sonnet.{0,30}4[-.]?6/i, id: 'claude-sonnet-4-6' },
    { pattern: /sonnet.{0,30}4[-.]?5/i, id: 'claude-sonnet-4-5' },
    { pattern: /opus.{0,30}4[-.]?8/i,   id: 'claude-opus-4-8' },
    { pattern: /opus.{0,30}4[-.]?5/i,   id: 'claude-opus-4-5' },
  ];

  // Extract price values near each model name.
  // The page typically has input price before output price in DOM order.
  for (const { pattern, id } of MODEL_PATTERNS) {
    const match = html.search(pattern);
    if (match === -1) continue;

    // Look for dollar amounts in a window after the model name
    const window = html.slice(match, match + 2000);
    const prices = [];
    const priceRe = /\$\s*([\d]+(?:\.[\d]+)?)/g;
    let m;
    while ((m = priceRe.exec(window)) !== null && prices.length < 2) {
      prices.push(parseFloat(m[1]));
    }

    if (prices.length >= 2) {
      rates[id] = {
        input_per_1m:       prices[0],
        output_per_1m:      prices[1],
        cache_write_per_1m: +(prices[0] * 1.25).toFixed(4),
        cache_read_per_1m:  +(prices[0] * 0.10).toFixed(4),
      };
    }
  }

  return Object.keys(rates).length >= 2 ? rates : null;
}

async function refreshPricing() {
  try {
    const html  = await fetchPricingPage();
    const rates = parsePricingHtml(html);
    if (!rates) throw new Error('Could not parse pricing from page');

    const entry = { fetched_at: new Date().toISOString(), source_url: PRICING_URL, rates };
    atomicWriteJson(RATES_CACHE, entry);
    return { ok: true, rates, fetched_at: entry.fetched_at };
  } catch (err) {
    return { ok: false, error: err.message, fallback_used: true };
  }
}

function getRatesForModel(modelId) {
  const { rates, source } = loadCachedRates();

  // Direct match
  if (rates[modelId]) return { r: rates[modelId], source };

  // Family fallback: strip version suffix and try prefix match
  const family = modelId.replace(/-\d{8}$/, '');
  if (rates[family]) return { r: rates[family], source };

  // Substring match for model family
  const key = Object.keys(rates).find(k => modelId.startsWith(k) || k.startsWith(family));
  if (key) return { r: rates[key], source };

  // Last resort: use fallback table directly
  const fKey = Object.keys(FALLBACK_RATES).find(k => modelId.includes(k.split('-')[1]));
  return { r: fKey ? FALLBACK_RATES[fKey] : FALLBACK_RATES['claude-sonnet-4-6'], source: 'fallback' };
}

// ─── Atomic JSON file write ───────────────────────────────────────────────────
function atomicWriteJson(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

// ─── cost-log.json management ────────────────────────────────────────────────
function costLogPath() {
  return path.join(PROJECT_DIR, 'specs', 'cost-log.json');
}

function readCostLog() {
  try {
    return JSON.parse(fs.readFileSync(costLogPath(), 'utf8'));
  } catch {
    return [];
  }
}

function appendCostLog(entry) {
  const log = readCostLog();
  log.push(entry);
  const p = costLogPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  atomicWriteJson(p, log);
}

// ─── Session + agent resolution via .meta.json ───────────────────────────────
// The orchestrator passes the toolUseId (the Agent tool call's `id` field —
// visible to the LLM as `toolu_bdrk_...`). The MCP server then:
//   1. Scans the most-recent session's subagents/ for a .meta.json whose
//      toolUseId matches.
//   2. Derives agentId from the filename: agent-[agentId].meta.json
//   3. Reads the session UUID from the first line of the subagent JSONL.
// This way the LLM never has to know agentId or sessionId — both are resolved
// from filesystem state.
function resolveAgentFromToolUseId(toolUseId) {
  const slug    = projectSlug(PROJECT_DIR);
  const projDir = path.join(CLAUDE_HOME, 'projects', slug);

  let sessionId = null;
  let sessionSubagentDir = null;

  try {
    // Find all session directories (UUID-named dirs that contain a subagents/ folder)
    const entries = fs.readdirSync(projDir);
    const sessionDirs = entries
      .filter(e => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(e))
      .map(e => {
        const full = path.join(projDir, e);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) return { id: e, mtime: stat.mtimeMs };
        } catch { /* skip */ }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime); // most recent first

    // Search session dirs from newest to oldest for the matching toolUseId
    for (const sess of sessionDirs) {
      const subDir = path.join(projDir, sess.id, 'subagents');
      try {
        const files = fs.readdirSync(subDir).filter(f => f.endsWith('.meta.json'));
        for (const f of files) {
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8'));
            if (meta.toolUseId === toolUseId) {
              // filename is agent-[agentId].meta.json
              const agentId = f.replace(/^agent-/, '').replace(/\.meta\.json$/, '');
              sessionId = sess.id;
              sessionSubagentDir = subDir;
              return { agentId, sessionId, subagentDir: subDir };
            }
          } catch { /* malformed meta, skip */ }
        }
      } catch { /* subagents dir may not exist */ }
    }
  } catch { /* project dir not found */ }

  return null; // not found
}

// ─── Session detection ────────────────────────────────────────────────────────
// Finds the most-recently-modified session directory for the current project.
// Called at server startup; result written to specs/.current-session so the
// orchestrator can read it for informational purposes if needed.
function detectCurrentSession() {
  const slug    = projectSlug(PROJECT_DIR);
  const projDir = path.join(CLAUDE_HOME, 'projects', slug);

  try {
    const entries = fs.readdirSync(projDir);
    const sessions = entries
      .filter(e => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(e))
      .map(e => {
        const full = path.join(projDir, e);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) return { id: e, mtime: stat.mtimeMs };
        } catch { return null; }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);

    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      const marker = path.join(PROJECT_DIR, 'specs', '.current-session');
      try {
        fs.mkdirSync(path.dirname(marker), { recursive: true });
        fs.writeFileSync(marker, sessionId, 'utf8');
      } catch { /* non-fatal */ }
      return sessionId;
    }
  } catch { /* project dir may not exist yet */ }
  return null;
}

// ─── Tool: record_agent_cost ──────────────────────────────────────────────────
async function toolRecordAgentCost(args) {
  const { toolUseId, phase, model, feature = null } = args;

  if (!toolUseId || !phase || !model) {
    return { ok: false, error: 'Missing required fields: toolUseId, phase, model' };
  }

  // Resolve agentId and sessionId from the toolUseId via .meta.json lookup.
  // Retry once after 500ms in case Claude Code hasn't flushed the .meta.json yet.
  let resolved = resolveAgentFromToolUseId(toolUseId);
  if (!resolved) {
    await new Promise(r => setTimeout(r, 500));
    resolved = resolveAgentFromToolUseId(toolUseId);
  }
  if (!resolved) {
    return { ok: false, error: `Could not find subagent for toolUseId: ${toolUseId}` };
  }

  const { agentId, sessionId, subagentDir } = resolved;
  const subagentFile = path.join(subagentDir, `agent-${agentId}.jsonl`);

  // Sum token usage across all assistant messages in the subagent transcript
  const lines = fs.readFileSync(subagentFile, 'utf8').split('\n').filter(Boolean);
  let input_tokens = 0, output_tokens = 0, cache_creation_tokens = 0, cache_read_tokens = 0;

  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.type !== 'assistant') continue;
      const usage = record.message && record.message.usage;
      if (!usage) continue;
      input_tokens            += (usage.input_tokens || 0);
      output_tokens           += (usage.output_tokens || 0);
      cache_creation_tokens   += (usage.cache_creation_input_tokens || 0);
      cache_read_tokens       += (usage.cache_read_input_tokens || 0);
    } catch { /* malformed line — skip */ }
  }

  // Compute cost
  const { r: rates, source: pricing_source } = getRatesForModel(model);
  const M = 1_000_000;
  const input_cost_usd        = +(input_tokens            / M * rates.input_per_1m).toFixed(8);
  const output_cost_usd       = +(output_tokens           / M * rates.output_per_1m).toFixed(8);
  const cache_write_cost_usd  = +(cache_creation_tokens   / M * rates.cache_write_per_1m).toFixed(8);
  const cache_read_cost_usd   = +(cache_read_tokens       / M * rates.cache_read_per_1m).toFixed(8);
  const total_cost_usd        = +(input_cost_usd + output_cost_usd + cache_write_cost_usd + cache_read_cost_usd).toFixed(8);

  const entry = {
    phase,
    agent:                    `agent-${agentId}`,
    model,
    feature:                  feature || null,
    date:                     new Date().toISOString().slice(0, 10),
    input_tokens,
    output_tokens,
    cache_creation_tokens,
    cache_read_tokens,
    input_cost_usd,
    output_cost_usd,
    cache_write_cost_usd,
    cache_read_cost_usd,
    total_cost_usd,
    pricing_source,
  };

  appendCostLog(entry);

  return { ok: true, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost_usd };
}

// ─── Tool: refresh_pricing ────────────────────────────────────────────────────
async function toolRefreshPricing(_args) {
  return refreshPricing();
}

// ─── MCP stdio protocol ───────────────────────────────────────────────────────
const TOOLS = {
  record_agent_cost: {
    description: 'Resolve a subagent by its toolUseId, read real token counts from its JSONL transcript, and append a cost entry to specs/cost-log.json.',
    inputSchema: {
      type: 'object',
      required: ['toolUseId', 'phase', 'model'],
      properties: {
        toolUseId: { type: 'string', description: 'The id field of the Agent tool_use call — looks like toolu_bdrk_... — visible to the orchestrator when it invokes the Agent tool' },
        phase:     { type: 'string', description: 'SpecGantry phase name, e.g. ideation, architecture, feature_spec, development, test, deployment' },
        model:     { type: 'string', description: 'Exact model ID from the agent frontmatter, e.g. claude-sonnet-4-6' },
        feature:   { type: 'string', description: 'Feature ID (FEATURE-001) or null for project-level phases', nullable: true },
      },
    },
    handler: toolRecordAgentCost,
  },
  refresh_pricing: {
    description: 'Fetch current Anthropic model pricing from anthropic.com/pricing and update the local rates cache.',
    inputSchema: { type: 'object', properties: {} },
    handler: toolRefreshPricing,
  },
};

function sendResponse(id, result) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(msg + '\n');
}

function sendError(id, code, message) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  process.stdout.write(msg + '\n');
}

async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'spec-gantry-costs', version: '1.0.0' },
    });
  }

  if (method === 'tools/list') {
    return sendResponse(id, {
      tools: Object.entries(TOOLS).map(([name, def]) => ({
        name,
        description: def.description,
        inputSchema: def.inputSchema,
      })),
    });
  }

  if (method === 'tools/call') {
    const toolName = params && params.name;
    const toolArgs = (params && params.arguments) || {};
    const tool = TOOLS[toolName];
    if (!tool) return sendError(id, -32601, `Unknown tool: ${toolName}`);
    try {
      const result = await tool.handler(toolArgs);
      return sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
    } catch (err) {
      return sendError(id, -32603, err.message);
    }
  }

  // Ignore notifications (no id), respond to unknown methods with an error
  if (id !== undefined) sendError(id, -32601, `Unknown method: ${method}`);
}

// ─── Startup ──────────────────────────────────────────────────────────────────
(async function main() {
  // Detect current session and write marker file
  detectCurrentSession();

  // Attempt background pricing refresh (don't block startup)
  refreshPricing().catch(() => {/* non-fatal */});

  // Read newline-delimited JSON-RPC from stdin
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const req = JSON.parse(trimmed);
        await handleRequest(req);
      } catch (err) {
        sendError(null, -32700, `Parse error: ${err.message}`);
      }
    }
  });

  process.stdin.on('end', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT',  () => process.exit(0));
})();
