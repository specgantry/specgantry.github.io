#!/usr/bin/env node
// SpecGantry shared utilities — used by both server.js (MCP) and hooks.js (hooks)
// stdlib-only — no npm dependencies required

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');

// ─── Logging ──────────────────────────────────────────────────────────────────
// Set SPEC_GANTRY_LOG_LEVEL to: error | info (default) | debug
// Call initLogger(filename) once at startup to set the log file.
// server.js uses spec-gantry-costs.log; hooks.js uses spec-gantry-hooks.log.
const LEVELS = { error: 0, info: 1, debug: 2 };
const LOG_LEVEL = LEVELS[process.env.SPEC_GANTRY_LOG_LEVEL] ?? LEVELS.error;
const LOG_DIR = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude', 'logs');

let LOG_FILE = path.join(LOG_DIR, 'spec-gantry.log'); // overridden by initLogger

function initLogger(filename) {
  LOG_FILE = path.join(LOG_DIR, filename);
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch { /* ignore */ }
}

function setLogFile(filename) {
  LOG_FILE = path.join(LOG_DIR, filename);
}

function log(level, ...args) {
  if (LEVELS[level] > LOG_LEVEL) return;
  const prefix = { error: '[sg ERROR]', info: '[sg]', debug: '[sg DEBUG]' }[level];
  const line = `${new Date().toISOString()} ${prefix} ${args.join(' ')}\n`;
  process.stderr.write(line);
  try { fs.appendFileSync(LOG_FILE, line); } catch { /* non-fatal */ }
}
const logError = (...a) => log('error', ...a);
const logInfo  = (...a) => log('info', ...a);
const logDebug = (...a) => log('debug', ...a);

// ─── Constants ────────────────────────────────────────────────────────────────
const CLAUDE_HOME  = path.join(os.homedir(), '.claude');
const PLUGIN_DIR   = path.dirname(__filename);
const RATES_CACHE  = path.join(PLUGIN_DIR, 'rates-cache.json');
const PROJECT_DIR  = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PRICING_URL  = 'https://platform.claude.com/docs/en/about-claude/pricing';

// ─── Agent type → phase + model mapping ──────────────────────────────────────
const AGENT_MAP = {
  'spec-gantry:ideation:ideation-subagent':                   { phase: 'ideation',          model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:investigate:investigate-subagent':             { phase: 'investigation',      model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:story-spec:story-spec-subagent':               { phase: 'story_spec',         model: 'claude-sonnet-4-6' },
  'spec-gantry:development:development-subagent':             { phase: 'development',        model: 'claude-sonnet-4-6' },
  'spec-gantry:deployment:deployment-subagent':               { phase: 'deployment',         model: 'claude-sonnet-4-6' },
  'spec-gantry:reverse-engineer:reverse-engineer-subagent':   { phase: 'reverse_engineer',   model: 'claude-sonnet-4-6' },
};

// Project-level phases — never associated with a story ID.
// investigation is included because the story is discovered by investigation, not known before it.
const PROJECT_LEVEL_PHASES = new Set(['ideation', 'reverse_engineer', 'deployment', 'investigation']);

// ─── Fallback pricing ─────────────────────────────────────────────────────────
// Used when live fetch from the pricing page fails.
const FALLBACK_RATES = {
  'claude-haiku-4-5-20251001': { input_per_1m: 1.00,  output_per_1m: 5.00,  cache_write_per_1m: 1.25, cache_read_per_1m: 0.10 },
  'claude-haiku-4-5':          { input_per_1m: 1.00,  output_per_1m: 5.00,  cache_write_per_1m: 1.25, cache_read_per_1m: 0.10 },
  'claude-sonnet-4-6':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75, cache_read_per_1m: 0.30 },
  'claude-sonnet-4-5':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75, cache_read_per_1m: 0.30 },
  'claude-opus-4-8':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-7':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-6':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-5':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
};

// ─── Rates ────────────────────────────────────────────────────────────────────
function loadCachedRates() {
  try {
    const data = JSON.parse(fs.readFileSync(RATES_CACHE, 'utf8'));
    return { rates: data.rates, source: 'live' };
  } catch {
    return { rates: FALLBACK_RATES, source: 'fallback' };
  }
}

function getRatesForModel(modelId) {
  const { rates, source } = loadCachedRates();
  if (rates[modelId]) return { r: rates[modelId], source };
  const family = modelId.replace(/-\d{8}$/, '');
  if (rates[family]) return { r: rates[family], source };
  const key = Object.keys(rates).find(k => modelId.startsWith(k) || k.startsWith(family));
  if (key) return { r: rates[key], source };
  const fKey = Object.keys(FALLBACK_RATES).find(k => modelId.includes(k.split('-')[1]));
  return { r: fKey ? FALLBACK_RATES[fKey] : FALLBACK_RATES['claude-sonnet-4-6'], source: 'fallback' };
}

// ─── Pricing fetch + parse ────────────────────────────────────────────────────
function fetchPricingPage() {
  return new Promise((resolve, reject) => {
    const mod = PRICING_URL.startsWith('https') ? https : http;
    const req = mod.get(PRICING_URL, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectMod = res.headers.location.startsWith('https') ? https : http;
        redirectMod.get(res.headers.location, { timeout: 10000 }, (res2) => {
          let body = ''; res2.on('data', c => body += c); res2.on('end', () => resolve(body)); res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      let body = ''; res.on('data', c => body += c); res.on('end', () => resolve(body)); res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function parsePricingHtml(html) {
  const rates = {};
  const MODEL_PATTERNS = [
    { pattern: /Claude\s+Opus\s+4\.8\b/i,   id: 'claude-opus-4-8' },
    { pattern: /Claude\s+Opus\s+4\.7\b/i,   id: 'claude-opus-4-7' },
    { pattern: /Claude\s+Opus\s+4\.6\b/i,   id: 'claude-opus-4-6' },
    { pattern: /Claude\s+Opus\s+4\.5\b/i,   id: 'claude-opus-4-5' },
    { pattern: /Claude\s+Sonnet\s+4\.6\b/i, id: 'claude-sonnet-4-6' },
    { pattern: /Claude\s+Sonnet\s+4\.5\b/i, id: 'claude-sonnet-4-5' },
    { pattern: /Claude\s+Haiku\s+4\.5\b/i,  id: 'claude-haiku-4-5-20251001' },
  ];
  const priceRe = /\$([\d]+(?:\.[\d]+)?)\s*\/\s*MTok/g;
  for (const { pattern, id } of MODEL_PATTERNS) {
    const nameRe = new RegExp(pattern.source, 'gi');
    let nameMatch;
    while ((nameMatch = nameRe.exec(html)) !== null) {
      const segment = html.slice(nameMatch.index, nameMatch.index + 500);
      const prices = [];
      let m; priceRe.lastIndex = 0;
      while ((m = priceRe.exec(segment)) !== null && prices.length < 5) prices.push(parseFloat(m[1]));
      if (prices.length >= 5) {
        rates[id] = { input_per_1m: prices[0], output_per_1m: prices[4], cache_write_per_1m: prices[1], cache_read_per_1m: prices[3] };
        break;
      } else if (prices.length >= 2) {
        rates[id] = { input_per_1m: prices[0], output_per_1m: prices[prices.length - 1], cache_write_per_1m: +(prices[0] * 1.25).toFixed(4), cache_read_per_1m: +(prices[0] * 0.10).toFixed(4) };
        break;
      }
    }
  }
  return Object.keys(rates).length >= 2 ? rates : null;
}

async function refreshPricing() {
  try {
    logDebug('Fetching pricing from', PRICING_URL);
    const html = await fetchPricingPage();
    const rates = parsePricingHtml(html);
    if (!rates) throw new Error('Could not parse pricing from page');
    const entry = { fetched_at: new Date().toISOString(), source_url: PRICING_URL, rates };
    atomicWriteJson(RATES_CACHE, entry);
    logInfo('Pricing refreshed —', Object.keys(rates).length, 'models cached at', RATES_CACHE);
    return { ok: true, rates, fetched_at: entry.fetched_at };
  } catch (err) {
    logError('Pricing fetch failed:', err.message, '— using fallback rates');
    return { ok: false, error: err.message, fallback_used: true };
  }
}

// ─── File utilities ───────────────────────────────────────────────────────────
function atomicWriteJson(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function appendCostLog(entry, projectDir) {
  const p = path.join(projectDir || PROJECT_DIR, 'specs', 'cost-log.ndjson');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(entry) + '\n', 'utf8');
}

function readProjectRelease(projectDir) {
  try {
    const yaml = fs.readFileSync(path.join(projectDir, 'specs', 'project-state.yaml'), 'utf8');
    const m = yaml.match(/^\s+release:\s+"?([^"\n]+)"?/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

// ─── Transcript utilities ─────────────────────────────────────────────────────
function sumTokensFromTranscript(transcriptPath) {
  let input_tokens = 0, output_tokens = 0, cache_creation_tokens = 0, cache_read_tokens = 0, model = null;
  try {
    for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)) {
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
  } catch (err) { logError('sumTokensFromTranscript failed:', err.message); }
  return { input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, model };
}

function readActiveStoryFromProjectState(projectDir) {
  try {
    const yaml = fs.readFileSync(path.join(projectDir, 'specs', 'project-state.yaml'), 'utf8');
    const m = yaml.match(/^\s*active_story:\s*"?([^"\n]+)"?/m);
    const val = m ? m[1].trim() : null;
    return (val && val !== 'null' && val !== '') ? val : null;
  } catch { return null; }
}

// Infer story ID from the subagent transcript.
// Pass 1: first user message with parentUuid === null (canonical orchestrator prompt).
// Pass 2: first 5 user messages scanning for story_id: STORY-NNN key-value pattern.
// Pass 3: read active_story from specs/project-state.yaml (fallback for story-level phases).
function inferStoryFromTranscript(transcriptPath, projectDir) {
  try {
    const parsed = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const userMessages = parsed.filter(r => r.type === 'user');
    logDebug(`inferStoryFromTranscript: found ${userMessages.length} user messages in transcript`);

    // Pass 1: Look in canonical orchestrator prompt (parentUuid === null)
    for (const r of userMessages) {
      if (r.parentUuid === null) {
        const msg = JSON.stringify(r.message || '');
        logDebug(`inferStoryFromTranscript Pass 1: checking canonical message (first 100 chars): ${msg.slice(0, 100)}`);
        const m = msg.match(/(STORY-\d+)/);
        if (m) {
          logDebug(`inferStoryFromTranscript Pass 1: MATCHED ${m[1]}`);
          return m[1];
        }
      }
    }
    logDebug('inferStoryFromTranscript Pass 1: no match in canonical message');

    // Pass 2: Scan first 5 user messages for story_id pattern
    for (let i = 0; i < Math.min(5, userMessages.length); i++) {
      const msg = JSON.stringify(userMessages[i].message || '');
      const m = msg.match(/story_id[^\w]+(STORY-\d+)/i);
      if (m) {
        logDebug(`inferStoryFromTranscript Pass 2: MATCHED ${m[1]} in message ${i}`);
        return m[1];
      }
    }
    logDebug('inferStoryFromTranscript Pass 2: no match in first 5 messages');
  } catch (err) { logDebug('Error parsing transcript for story inference:', err.message); }

  // Pass 3: Read from active_story in project-state.yaml (authoritative for story-level phases)
  if (projectDir) {
    logDebug(`inferStoryFromTranscript Pass 3: checking project-state.yaml at ${projectDir}`);
    const fromState = readActiveStoryFromProjectState(projectDir);
    if (fromState) {
      logDebug(`inferStoryFromTranscript Pass 3: MATCHED ${fromState}`);
      return fromState;
    }
    logDebug('inferStoryFromTranscript Pass 3: no active_story in project-state.yaml');
  } else {
    logDebug('inferStoryFromTranscript Pass 3: projectDir not provided, skipping');
  }

  return null;
}

// ─── Session resolution ───────────────────────────────────────────────────────
function projectSlug(dir) {
  // Claude Code project dirs use the absolute path with / replaced by - (leading - preserved).
  // e.g. /Users/foo/myapp → -Users-foo-myapp  (NOT Users-foo-myapp)
  return path.normalize(dir).replace(/[/\\]/g, '-').replace(/:/g, '-');
}

function resolveAgentFromToolUseId(toolUseId, projectDir) {
  const slug = projectSlug(projectDir || PROJECT_DIR);
  const projDir = path.join(CLAUDE_HOME, 'projects', slug);
  logDebug('Resolving toolUseId', toolUseId, 'in', projDir);
  try {
    const sessionDirs = fs.readdirSync(projDir)
      .filter(e => /^[0-9a-f-]{36}$/.test(e))
      .map(e => { try { const s = fs.statSync(path.join(projDir, e)); return s.isDirectory() ? { id: e, mtime: s.mtimeMs } : null; } catch { return null; } })
      .filter(Boolean).sort((a, b) => b.mtime - a.mtime);
    for (const sess of sessionDirs) {
      const subDir = path.join(projDir, sess.id, 'subagents');
      try {
        for (const f of fs.readdirSync(subDir).filter(f => f.endsWith('.meta.json'))) {
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8'));
            if (meta.toolUseId === toolUseId) {
              const agentId = f.replace(/^agent-/, '').replace(/\.meta\.json$/, '');
              return { agentId, sessionId: sess.id, subagentDir: subDir };
            }
          } catch { /* malformed meta */ }
        }
      } catch { /* subagents dir may not exist */ }
    }
  } catch (err) { logError('resolveAgentFromToolUseId failed:', err.message); }
  return null;
}

function detectCurrentSession(projectDir) {
  const slug = projectSlug(projectDir || PROJECT_DIR);
  const projDir = path.join(CLAUDE_HOME, 'projects', slug);
  try {
    const sessions = fs.readdirSync(projDir)
      .filter(e => /^[0-9a-f-]{36}$/.test(e))
      .map(e => { try { const s = fs.statSync(path.join(projDir, e)); return s.isDirectory() ? { id: e, mtime: s.mtimeMs } : null; } catch { return null; } })
      .filter(Boolean).sort((a, b) => b.mtime - a.mtime);
    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      const marker = path.join(projectDir || PROJECT_DIR, 'specs', '.current-session');
      try { fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, sessionId, 'utf8'); } catch { /* non-fatal */ }
      return sessionId;
    }
  } catch { /* project dir may not exist yet */ }
  return null;
}

// ─── Cost entry builder ───────────────────────────────────────────────────────
function buildCostEntry({ phase, agentType, model, component, projectDir, tokens }) {
  const { r: rates, source: pricing_source } = getRatesForModel(model);
  const M = 1_000_000;
  const input_cost_usd       = +(tokens.input_tokens          / M * rates.input_per_1m).toFixed(8);
  const output_cost_usd      = +(tokens.output_tokens         / M * rates.output_per_1m).toFixed(8);
  const cache_write_cost_usd = +(tokens.cache_creation_tokens / M * rates.cache_write_per_1m).toFixed(8);
  const cache_read_cost_usd  = +(tokens.cache_read_tokens     / M * rates.cache_read_per_1m).toFixed(8);
  const total_cost_usd       = +(input_cost_usd + output_cost_usd + cache_write_cost_usd + cache_read_cost_usd).toFixed(8);
  return {
    phase, agent: agentType, model, story: component || null,
    release: readProjectRelease(projectDir),
    date: new Date().toISOString().slice(0, 10),
    input_tokens: tokens.input_tokens, output_tokens: tokens.output_tokens,
    cache_creation_tokens: tokens.cache_creation_tokens, cache_read_tokens: tokens.cache_read_tokens,
    input_cost_usd, output_cost_usd, cache_write_cost_usd, cache_read_cost_usd, total_cost_usd, pricing_source,
  };
}

// ─── Stdin reader (used by hooks) ─────────────────────────────────────────────
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

module.exports = {
  initLogger, setLogFile, log, logError, logInfo, logDebug,
  CLAUDE_HOME, PLUGIN_DIR, RATES_CACHE, PROJECT_DIR, PRICING_URL,
  AGENT_MAP, PROJECT_LEVEL_PHASES, FALLBACK_RATES,
  loadCachedRates, getRatesForModel, refreshPricing, atomicWriteJson,
  appendCostLog, readProjectRelease,
  sumTokensFromTranscript, inferStoryFromTranscript, readActiveStoryFromProjectState,
  projectSlug, resolveAgentFromToolUseId, detectCurrentSession,
  buildCostEntry, readStdin,
};
