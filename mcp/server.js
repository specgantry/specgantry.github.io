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

// ─── Logging ──────────────────────────────────────────────────────────────────
// All log output goes to stderr AND to PROJECT_DIR/logs/spec-gantry-costs.log.
// The log file is easy to find and tail; stderr is for Claude Code's MCP viewer.
// Set SPEC_GANTRY_LOG_LEVEL env var to control verbosity:
//   error  — failures only (silent on success)
//   info   — key lifecycle events: startup, pricing fetch result, cost recorded (default)
//   debug  — full detail: resolved paths, token counts, every tool call in/out
const LEVELS = { error: 0, info: 1, debug: 2 };
const LOG_LEVEL = LEVELS[process.env.SPEC_GANTRY_LOG_LEVEL] ?? LEVELS.info;
const LOG_FILE  = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), 'logs', 'spec-gantry-costs.log');

// Ensure log directory exists (best-effort — never throw)
try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }); } catch { /* ignore */ }

function log(level, ...args) {
  if (LEVELS[level] > LOG_LEVEL) return;
  const prefix = { error: '[sg-costs ERROR]', info: '[sg-costs]', debug: '[sg-costs DEBUG]' }[level];
  const line = `${new Date().toISOString()} ${prefix} ${args.join(' ')}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(LOG_FILE, line); } catch { /* non-fatal */ }
}
const logError = (...a) => log('error', ...a);
const logInfo  = (...a) => log('info',  ...a);
const logDebug = (...a) => log('debug', ...a);

// ─── Fallback pricing (rates as of 2026-06, from platform.claude.com/docs/en/about-claude/pricing) ────
// These are used when live fetch from the pricing page fails.
// Keys match the exact model IDs used in agent frontmatter.
const FALLBACK_RATES = {
  'claude-haiku-4-5-20251001': { input_per_1m: 1.00,  output_per_1m: 5.00,  cache_write_per_1m: 1.25,  cache_read_per_1m: 0.10  },
  'claude-haiku-4-5':          { input_per_1m: 1.00,  output_per_1m: 5.00,  cache_write_per_1m: 1.25,  cache_read_per_1m: 0.10  },
  'claude-sonnet-4-6':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75,  cache_read_per_1m: 0.30  },
  'claude-sonnet-4-5':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75,  cache_read_per_1m: 0.30  },
  'claude-opus-4-8':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25,  cache_read_per_1m: 0.50  },
  'claude-opus-4-7':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25,  cache_read_per_1m: 0.50  },
  'claude-opus-4-6':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25,  cache_read_per_1m: 0.50  },
  'claude-opus-4-5':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25,  cache_read_per_1m: 0.50  },
};

// ─── Paths ────────────────────────────────────────────────────────────────────
const CLAUDE_HOME    = path.join(os.homedir(), '.claude');
const PLUGIN_DIR     = path.dirname(__filename);
const RATES_CACHE    = path.join(PLUGIN_DIR, 'rates-cache.json');
const PROJECT_DIR    = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PRICING_URL    = 'https://platform.claude.com/docs/en/about-claude/pricing';

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

// Parse dollar amounts from the platform.claude.com pricing docs page.
// The page renders a markdown table with columns:
//   Model | Base Input Tokens | 5m Cache Writes | 1h Cache Writes | Cache Hits & Refreshes | Output Tokens
// Example row: | Claude Opus 4.8 | $5 / MTok | $6.25 / MTok | $10 / MTok | $0.50 / MTok | $25 / MTok |
// This is a best-effort parser; falls back gracefully on parse failure.
function parsePricingHtml(html) {
  const rates = {};

  // Map of model name patterns (as they appear in the table) → canonical model ID.
  // Most-specific patterns first to avoid Opus 4.5 matching Opus 4.8's row.
  const MODEL_PATTERNS = [
    { pattern: /Claude\s+Opus\s+4\.8\b/i,   id: 'claude-opus-4-8'  },
    { pattern: /Claude\s+Opus\s+4\.7\b/i,   id: 'claude-opus-4-7'  },
    { pattern: /Claude\s+Opus\s+4\.6\b/i,   id: 'claude-opus-4-6'  },
    { pattern: /Claude\s+Opus\s+4\.5\b/i,   id: 'claude-opus-4-5'  },
    { pattern: /Claude\s+Sonnet\s+4\.6\b/i, id: 'claude-sonnet-4-6' },
    { pattern: /Claude\s+Sonnet\s+4\.5\b/i, id: 'claude-sonnet-4-5' },
    { pattern: /Claude\s+Haiku\s+4\.5\b/i,  id: 'claude-haiku-4-5-20251001' },
  ];

  const priceRe = /\$([\d]+(?:\.[\d]+)?)\s*\/\s*MTok/g;

  for (const { pattern, id } of MODEL_PATTERNS) {
    // The model name appears in nav links and multiple tables — scan all occurrences
    // and use the first one that has enough $/MTok values in the following 500 chars.
    const nameRe = new RegExp(pattern.source, 'gi');
    let nameMatch;
    let found = false;
    while ((nameMatch = nameRe.exec(html)) !== null) {
      const segment = html.slice(nameMatch.index, nameMatch.index + 500);
      const prices = [];
      let m;
      priceRe.lastIndex = 0;
      while ((m = priceRe.exec(segment)) !== null && prices.length < 5) {
        prices.push(parseFloat(m[1]));
      }

      if (prices.length >= 5) {
        rates[id] = {
          input_per_1m:       prices[0],
          output_per_1m:      prices[4],
          cache_write_per_1m: prices[1],  // 5-minute cache write
          cache_read_per_1m:  prices[3],  // cache hit / refresh
        };
        found = true;
        break;
      } else if (prices.length >= 2) {
        rates[id] = {
          input_per_1m:       prices[0],
          output_per_1m:      prices[prices.length - 1],
          cache_write_per_1m: +(prices[0] * 1.25).toFixed(4),
          cache_read_per_1m:  +(prices[0] * 0.10).toFixed(4),
        };
        found = true;
        break;
      }
    }
  }

  return Object.keys(rates).length >= 2 ? rates : null;
}

async function refreshPricing() {
  try {
    logDebug('Fetching pricing from', PRICING_URL);
    const html  = await fetchPricingPage();
    const rates = parsePricingHtml(html);
    if (!rates) throw new Error('Could not parse pricing from page');

    const entry = { fetched_at: new Date().toISOString(), source_url: PRICING_URL, rates };
    atomicWriteJson(RATES_CACHE, entry);
    logInfo('Pricing refreshed —', Object.keys(rates).length, 'models cached at', RATES_CACHE);
    logDebug('Rates:', JSON.stringify(rates));
    return { ok: true, rates, fetched_at: entry.fetched_at };
  } catch (err) {
    logError('Pricing fetch failed:', err.message, '— using fallback rates');
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
  logDebug('Resolving toolUseId', toolUseId, 'in', projDir);

  try {
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
      .sort((a, b) => b.mtime - a.mtime);

    logDebug('Searching', sessionDirs.length, 'session dir(s) for toolUseId');

    for (const sess of sessionDirs) {
      const subDir = path.join(projDir, sess.id, 'subagents');
      try {
        const files = fs.readdirSync(subDir).filter(f => f.endsWith('.meta.json'));
        logDebug('Session', sess.id, '—', files.length, 'subagent(s)');
        for (const f of files) {
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8'));
            if (meta.toolUseId === toolUseId) {
              const agentId = f.replace(/^agent-/, '').replace(/\.meta\.json$/, '');
              logDebug('Matched:', f, '→ agentId', agentId, 'in session', sess.id);
              return { agentId, sessionId: sess.id, subagentDir: subDir };
            }
          } catch { /* malformed meta, skip */ }
        }
      } catch { /* subagents dir may not exist */ }
    }
  } catch (err) {
    logError('resolveAgentFromToolUseId failed:', err.message);
  }

  logDebug('toolUseId not found:', toolUseId);
  return null;
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
      logDebug('Current session:', sessionId);
      return sessionId;
    }
  } catch { /* project dir may not exist yet */ }
  logDebug('No session directory found for project slug:', projectSlug(PROJECT_DIR));
  return null;
}

// ─── Tool: record_agent_cost ──────────────────────────────────────────────────
async function toolRecordAgentCost(args) {
  const { toolUseId, phase, model, feature = null } = args;
  logDebug('record_agent_cost called:', JSON.stringify({ toolUseId, phase, model, feature }));

  if (!toolUseId || !phase || !model) {
    logError('record_agent_cost: missing required fields');
    return { ok: false, error: 'Missing required fields: toolUseId, phase, model' };
  }

  // Resolve agentId and sessionId from the toolUseId via .meta.json lookup.
  // Retry once after 500ms in case Claude Code hasn't flushed the .meta.json yet.
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

  const { agentId, sessionId, subagentDir } = resolved;
  const subagentFile = path.join(subagentDir, `agent-${agentId}.jsonl`);
  logDebug('Reading transcript:', subagentFile);

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

  logDebug('Token counts — input:', input_tokens, 'output:', output_tokens,
           'cache_write:', cache_creation_tokens, 'cache_read:', cache_read_tokens);
  logDebug('Pricing source:', pricing_source, '— total_cost_usd:', total_cost_usd);

  appendCostLog(entry);
  logInfo(`Cost recorded: ${phase}${feature ? ' / ' + feature : ''} — ${input_tokens + output_tokens} tokens — $${total_cost_usd} (${pricing_source})`);

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
    if (!tool) {
      logError('Unknown tool:', toolName);
      return sendError(id, -32601, `Unknown tool: ${toolName}`);
    }
    try {
      const result = await tool.handler(toolArgs);
      logDebug('←', toolName, JSON.stringify(result));
      return sendResponse(id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
    } catch (err) {
      logError(toolName, 'threw:', err.message);
      return sendError(id, -32603, err.message);
    }
  }

  // Ignore notifications (no id), respond to unknown methods with an error
  if (id !== undefined) sendError(id, -32601, `Unknown method: ${method}`);
}

// ─── Agent type → phase + model mapping ──────────────────────────────────────
// Claude Code constructs agentType as: "plugin-name:subdir:agent-name"
// for plugin agents, or bare names like "Explore" for built-in agents.
const AGENT_MAP = {
  // Fully qualified names (spec-gantry:category:agent-name)
  'spec-gantry:ideation:ideation-agent':                    { phase: 'ideation',        model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:architecture:architecture-agent':            { phase: 'architecture',     model: 'claude-sonnet-4-6' },
  'spec-gantry:feature-spec:feature-spec-agent':            { phase: 'feature_spec',     model: 'claude-sonnet-4-6' },
  'spec-gantry:development:dev-agent':                      { phase: 'development',      model: 'claude-sonnet-4-6' },
  'spec-gantry:development:test-agent':                     { phase: 'test',             model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:deployment:deployment-agent':                { phase: 'deployment',       model: 'claude-sonnet-4-6' },
  'spec-gantry:reverse-engineer:reverse-engineer-agent':    { phase: 'reverse_engineer', model: 'claude-sonnet-4-6' },

  // Short names (in case Claude Code passes agent name without plugin namespace)
  'ideation-agent':                                         { phase: 'ideation',        model: 'claude-haiku-4-5-20251001' },
  'architecture-agent':                                     { phase: 'architecture',     model: 'claude-sonnet-4-6' },
  'feature-spec-agent':                                     { phase: 'feature_spec',     model: 'claude-sonnet-4-6' },
  'dev-agent':                                              { phase: 'development',      model: 'claude-sonnet-4-6' },
  'test-agent':                                             { phase: 'test',             model: 'claude-haiku-4-5-20251001' },
  'deployment-agent':                                       { phase: 'deployment',       model: 'claude-sonnet-4-6' },
  'reverse-engineer-agent':                                 { phase: 'reverse_engineer', model: 'claude-sonnet-4-6' },

  // orchestrator is intentionally absent — it's the router, not a costed worker
  // If it appears in AGENT_MAP, code will skip it (null value triggers skip logic)
};

// Infer feature ID from the subagent's transcript: look for current_feature in state files
// or FEATURE-/BUGFIX- patterns in the agent's input text.
function inferFeatureFromTranscript(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        // Look in the first user message (the prompt passed to the agent)
        if (r.type === 'user' && r.parentUuid === null) {
          const text = JSON.stringify(r.message || '');
          const m = text.match(/(FEATURE-\d+(?:-v\d+)?|BUGFIX-\d+)/);
          if (m) return m[1];
        }
      } catch { /* skip */ }
    }
  } catch { /* transcript unreadable */ }
  return null;
}

// Sum token usage from a subagent JSONL transcript.
function sumTokensFromTranscript(transcriptPath) {
  let input_tokens = 0, output_tokens = 0, cache_creation_tokens = 0, cache_read_tokens = 0;
  let model = null;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        if (r.type !== 'assistant') continue;
        const usage = r.message && r.message.usage;
        if (!usage) continue;
        if (!model && r.message.model) model = r.message.model;
        input_tokens          += (usage.input_tokens || 0);
        output_tokens         += (usage.output_tokens || 0);
        cache_creation_tokens += (usage.cache_creation_input_tokens || 0);
        cache_read_tokens     += (usage.cache_read_input_tokens || 0);
      } catch { /* malformed line */ }
    }
  } catch (err) {
    logError('sumTokensFromTranscript failed:', err.message);
  }
  return { input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, model };
}

// ─── Hook mode: SubagentStop handler ─────────────────────────────────────────
// Invoked by Claude Code's SubagentStop hook with JSON payload on stdin.
// Reads the subagent transcript, infers phase/model, and appends to cost-log.json.
async function runHookMode() {
  let payload;
  try {
    const raw = await new Promise((resolve, reject) => {
      let data = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', c => data += c);
      process.stdin.on('end', () => resolve(data));
      process.stdin.on('error', reject);
    });
    payload = JSON.parse(raw);
  } catch (err) {
    logError('Hook: failed to parse stdin payload:', err.message);
    process.exit(0); // never block Claude Code
  }

  const { agent_id, tool_use_id, session_id, transcript_path, cwd } = payload;
  const agentType = payload.agent_type || payload.agentType || '';

  logDebug('Hook SubagentStop:', JSON.stringify({ agent_id, agentType, session_id }));

  // Only process SpecGantry agents — ignore Explore, Plan, claude-code-guide, etc.
  const mapping = AGENT_MAP[agentType];
  if (!mapping) {
    logDebug(`Hook: agent type "${agentType}" not found in AGENT_MAP. Available keys: ${Object.keys(AGENT_MAP).slice(0, 5).join(', ')} ...`);
    logDebug('Hook: skipping non-SpecGantry agent:', agentType);
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
    process.exit(0);
  }

  logInfo(`Hook: recording cost for ${mapping.phase} (${agentType})`);

  // Read token counts from the transcript Claude Code provides
  const resolvedTranscript = transcript_path ||
    (() => {
      // Fallback: derive path from session_id and agent_id if transcript_path absent
      const slug = projectSlug(cwd || PROJECT_DIR);
      return path.join(CLAUDE_HOME, 'projects', slug, session_id, 'subagents', `agent-${agent_id}.jsonl`);
    })();

  logDebug('Hook: transcript path:', resolvedTranscript);
  const tokens = sumTokensFromTranscript(resolvedTranscript);

  // Use model from transcript if available (more accurate than frontmatter default)
  const model = tokens.model || mapping.model;
  const feature = inferFeatureFromTranscript(resolvedTranscript);

  logDebug('Hook: tokens:', JSON.stringify(tokens), 'model:', model, 'feature:', feature);

  // Compute cost
  const { r: rates, source: pricing_source } = getRatesForModel(model);
  const M = 1_000_000;
  const input_cost_usd       = +(tokens.input_tokens          / M * rates.input_per_1m).toFixed(8);
  const output_cost_usd      = +(tokens.output_tokens         / M * rates.output_per_1m).toFixed(8);
  const cache_write_cost_usd = +(tokens.cache_creation_tokens / M * rates.cache_write_per_1m).toFixed(8);
  const cache_read_cost_usd  = +(tokens.cache_read_tokens     / M * rates.cache_read_per_1m).toFixed(8);
  const total_cost_usd       = +(input_cost_usd + output_cost_usd + cache_write_cost_usd + cache_read_cost_usd).toFixed(8);

  const entry = {
    phase:               mapping.phase,
    agent:               agentType,
    model,
    feature:             feature || null,
    date:                new Date().toISOString().slice(0, 10),
    input_tokens:        tokens.input_tokens,
    output_tokens:       tokens.output_tokens,
    cache_creation_tokens: tokens.cache_creation_tokens,
    cache_read_tokens:   tokens.cache_read_tokens,
    input_cost_usd,
    output_cost_usd,
    cache_write_cost_usd,
    cache_read_cost_usd,
    total_cost_usd,
    pricing_source,
  };

  const projectDir = cwd || PROJECT_DIR;
  const logPath = path.join(projectDir, 'specs', 'cost-log.json');
  try {
    const existing = (() => { try { return JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch { return []; } })();
    existing.push(entry);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    atomicWriteJson(logPath, existing);
    logInfo(`Hook: cost recorded — ${mapping.phase}${feature ? ' / ' + feature : ''} — ${tokens.input_tokens + tokens.output_tokens} tokens — $${total_cost_usd} (${pricing_source})`);
  } catch (err) {
    logError('Hook: failed to write cost-log.json:', err.message);
  }

  // Hook must output JSON and exit 0 — never block Claude Code
  process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  process.exit(0);
}

// ─── Startup ──────────────────────────────────────────────────────────────────
(async function main() {
  // Hook mode: invoked by Claude Code's SubagentStop hook
  if (process.argv.includes('--hook')) {
    await runHookMode();
    return;
  }

  // MCP server mode: long-running stdio JSON-RPC server
  logInfo(`Starting spec-gantry-costs MCP server (log level: ${process.env.SPEC_GANTRY_LOG_LEVEL || 'info'})`);
  logInfo('Log file:', LOG_FILE);
  logDebug('PROJECT_DIR:', PROJECT_DIR);
  logDebug('CLAUDE_HOME:', CLAUDE_HOME);
  logDebug('PLUGIN_DIR:', PLUGIN_DIR);

  detectCurrentSession();
  refreshPricing().catch(() => {/* already logged inside refreshPricing */});

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
  process.on('uncaughtException', err => logError('Uncaught exception:', err.message, err.stack));
  process.on('unhandledRejection', err => logError('Unhandled rejection:', err));
})();
