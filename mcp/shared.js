#!/usr/bin/env node
// SpecGantry shared utilities — used by both server.js (MCP) and hooks.js (hooks)
// stdlib-only — no npm dependencies required

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Logging ──────────────────────────────────────────────────────────────────
const LEVELS = { error: 0, info: 1, debug: 2 };
const LOG_LEVEL = LEVELS[process.env.SPEC_GANTRY_LOG_LEVEL] ?? LEVELS.error;
const LOG_DIR = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude', 'logs');

let LOG_FILE = path.join(LOG_DIR, 'spec-gantry.log');

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
const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const PLUGIN_DIR  = path.dirname(__filename);
const RATES_CACHE = path.join(PLUGIN_DIR, 'rates-cache.json');
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// ─── Agent type → phase + model mapping ──────────────────────────────────────
const AGENT_MAP = {
  'spec-gantry:ideation:ideation-subagent':                 { phase: 'ideation',        model: 'claude-sonnet-4-6' },
  'spec-gantry:investigate:investigate-subagent':           { phase: 'investigation',    model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:story-spec:story-spec-subagent':             { phase: 'story_spec',       model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:development:development-subagent':           { phase: 'development',      model: 'claude-sonnet-4-6' },
  'spec-gantry:evaluate:evaluate-subagent':                 { phase: 'evaluation',       model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:plan:plan-subagent':                         { phase: 'repair_plan',      model: 'claude-haiku-4-5-20251001' },
  'spec-gantry:deployment:deployment-subagent':             { phase: 'deployment',       model: 'claude-sonnet-4-6' },
  'spec-gantry:reverse-engineer:reverse-engineer-subagent': { phase: 'reverse_engineer', model: 'claude-haiku-4-5-20251001' },
};

// Project-level phases — never associated with a story ID.
const PROJECT_LEVEL_PHASES = new Set(['ideation', 'reverse_engineer', 'deployment', 'investigation']);

// ─── Fallback pricing ─────────────────────────────────────────────────────────
const FALLBACK_RATES = {
  'claude-haiku-4-5-20251001': { input_per_1m: 1.00,  output_per_1m:  5.00, cache_write_per_1m: 1.25, cache_read_per_1m: 0.10 },
  'claude-haiku-4-5':          { input_per_1m: 1.00,  output_per_1m:  5.00, cache_write_per_1m: 1.25, cache_read_per_1m: 0.10 },
  'claude-sonnet-4-6':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75, cache_read_per_1m: 0.30 },
  'claude-sonnet-4-5':         { input_per_1m: 3.00,  output_per_1m: 15.00, cache_write_per_1m: 3.75, cache_read_per_1m: 0.30 },
  'claude-opus-4-8':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-7':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-6':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
  'claude-opus-4-5':           { input_per_1m: 5.00,  output_per_1m: 25.00, cache_write_per_1m: 6.25, cache_read_per_1m: 0.50 },
};

// ─── Rates ────────────────────────────────────────────────────────────────────
// Rates cache is the rates-cache.json shipped with the plugin and updated in-repo
// when Anthropic changes pricing. No live fetch — the pricing page is a React SPA
// that requires JS rendering and cannot be scraped with a plain HTTP GET.
// source values: "current" (cache ≤ 30 days old), "stale" (> 30 days), "fallback" (file missing/corrupt)
const RATES_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function loadCachedRates() {
  try {
    const data = JSON.parse(fs.readFileSync(RATES_CACHE, 'utf8'));
    if (!data.rates) return { rates: FALLBACK_RATES, source: 'fallback' };
    const age = data.fetched_at ? Date.now() - new Date(data.fetched_at).getTime() : Infinity;
    const source = age > RATES_MAX_AGE_MS ? 'stale' : 'current';
    if (source === 'stale') {
      logDebug(`Rates cache is stale (${Math.floor(age / 86400000)}d old) — update rates-cache.json in the plugin repo`);
    }
    return { rates: data.rates, source };
  } catch {
    return { rates: FALLBACK_RATES, source: 'fallback' };
  }
}

function getRatesForModel(modelId) {
  const { rates, source } = loadCachedRates();
  if (rates[modelId]) return { r: rates[modelId], source };
  // Strip date suffix (e.g. claude-haiku-4-5-20251001 → claude-haiku-4-5)
  const family = modelId.replace(/-\d{8}$/, '');
  if (rates[family]) return { r: rates[family], source };
  const key = Object.keys(rates).find(k => modelId.startsWith(k) || k.startsWith(family));
  if (key) return { r: rates[key], source };
  // Last resort: match by model family word (haiku/sonnet/opus)
  const fKey = Object.keys(FALLBACK_RATES).find(k => modelId.includes(k.split('-')[1]));
  if (fKey) {
    logError(`getRatesForModel: no exact match for "${modelId}" — using fuzzy match "${fKey}". Add this model to rates-cache.json for accurate pricing.`);
    return { r: FALLBACK_RATES[fKey], source: 'fallback' };
  }
  logError(`getRatesForModel: no match at all for "${modelId}" — defaulting to sonnet rates. Cost figures will be inaccurate.`);
  return { r: FALLBACK_RATES['claude-sonnet-4-6'], source: 'fallback' };
}

// ─── Token reading — byte-offset slice ───────────────────────────────────────
// Reads only the bytes appended to transcriptPath since byteOffset.
// Because JSONL guarantees one complete JSON object per line, every line in the
// slice is parseable without any brace-tracking or partial-object handling.
// byteOffset is recorded at SubagentStart (before the subagent makes any API
// calls), so the slice contains exactly and only this invocation's lines.
function sumTokensFromSlice(transcriptPath, byteOffset) {
  let input_tokens = 0, output_tokens = 0, cache_creation_tokens = 0, cache_read_tokens = 0, model = null;
  try {
    const stat = fs.statSync(transcriptPath);
    const len = stat.size - byteOffset;
    if (len <= 0) {
      logDebug(`sumTokensFromSlice: no new bytes since offset ${byteOffset}`);
      return { input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, model };
    }
    const buf = Buffer.alloc(len);
    const fd = fs.openSync(transcriptPath, 'r');
    try {
      fs.readSync(fd, buf, 0, len, byteOffset);
    } finally {
      fs.closeSync(fd);
    }
    for (const line of buf.toString('utf8').split('\n').filter(Boolean)) {
      try {
        const r = JSON.parse(line);
        if (r.type !== 'assistant') continue;
        const usage = r.message && r.message.usage;
        if (!usage) continue;
        if (!model && r.message && r.message.model) model = r.message.model;
        input_tokens          += (usage.input_tokens                  || 0);
        output_tokens         += (usage.output_tokens                 || 0);
        cache_creation_tokens += (usage.cache_creation_input_tokens   || 0);
        cache_read_tokens     += (usage.cache_read_input_tokens       || 0);
      } catch { /* malformed line — skip */ }
    }
  } catch (err) {
    logError('sumTokensFromSlice failed:', err.message);
  }
  return { input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, model };
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

// ─── Session / transcript path resolution ─────────────────────────────────────
function projectSlug(dir) {
  return path.normalize(dir).replace(/[/\\]/g, '-').replace(/:/g, '-');
}

// Resolve the transcript path for a given agent_id.
// Prefers the explicit path from the hook payload (CC ≥ 2.0.42), then constructs
// it from session_id + agent_id, then scans all sessions by mtime as last resort.
function resolveTranscriptPath({ transcript_path, agent_id, session_id, projectDir }) {
  if (transcript_path) return transcript_path;
  const slug = projectSlug(projectDir || PROJECT_DIR);
  const projBase = path.join(CLAUDE_HOME, 'projects', slug);
  if (session_id) {
    return path.join(projBase, session_id, 'subagents', `agent-${agent_id}.jsonl`);
  }
  // Scan sessions by mtime descending
  try {
    const sessions = fs.readdirSync(projBase)
      .filter(e => /^[0-9a-f-]{36}$/.test(e))
      .map(e => {
        try { const s = fs.statSync(path.join(projBase, e)); return s.isDirectory() ? { id: e, mtime: s.mtimeMs } : null; }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);
    for (const sess of sessions) {
      const p = path.join(projBase, sess.id, 'subagents', `agent-${agent_id}.jsonl`);
      if (fs.existsSync(p)) return p;
    }
  } catch { /* ignore */ }
  return null;
}

// ─── Stamp file helpers ───────────────────────────────────────────────────────
// Stamp files are written at SubagentStart and deleted at SubagentStop.
// They record the transcript path and byte offset so SubagentStop can read
// only the bytes this invocation produced — no cumulative inflation.
function stampPath(projectDir, agentId) {
  return path.join(projectDir || PROJECT_DIR, 'specs', `.agent-stamp-${agentId}.json`);
}

function writeStamp(projectDir, agentId, data) {
  const p = stampPath(projectDir, agentId);
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data), 'utf8');
  } catch (err) {
    logError('writeStamp failed:', err.message);
  }
}

function readStamp(projectDir, agentId) {
  try {
    return JSON.parse(fs.readFileSync(stampPath(projectDir, agentId), 'utf8'));
  } catch { return null; }
}

function deleteStamp(projectDir, agentId) {
  try { fs.unlinkSync(stampPath(projectDir, agentId)); } catch { /* already gone */ }
}

// ─── Cost entry builder ───────────────────────────────────────────────────────
function buildCostEntry({ phase, agentType, model, projectDir, tokens }) {
  const { r: rates, source: pricing_source } = getRatesForModel(model);
  const M = 1_000_000;
  const input_cost_usd       = +(tokens.input_tokens          / M * rates.input_per_1m      ).toFixed(8);
  const output_cost_usd      = +(tokens.output_tokens         / M * rates.output_per_1m     ).toFixed(8);
  const cache_write_cost_usd = +(tokens.cache_creation_tokens / M * rates.cache_write_per_1m).toFixed(8);
  const cache_read_cost_usd  = +(tokens.cache_read_tokens     / M * rates.cache_read_per_1m ).toFixed(8);
  const total_cost_usd       = +(input_cost_usd + output_cost_usd + cache_write_cost_usd + cache_read_cost_usd).toFixed(8);
  return {
    phase,
    agent: agentType,
    model,
    story: null,
    release: readProjectRelease(projectDir) || 'unknown',
    date: new Date().toISOString().slice(0, 10),
    input_tokens:          tokens.input_tokens,
    output_tokens:         tokens.output_tokens,
    cache_creation_tokens: tokens.cache_creation_tokens,
    cache_read_tokens:     tokens.cache_read_tokens,
    input_cost_usd,
    output_cost_usd,
    cache_write_cost_usd,
    cache_read_cost_usd,
    total_cost_usd,
    pricing_source,
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
  CLAUDE_HOME, PLUGIN_DIR, RATES_CACHE, PROJECT_DIR,
  AGENT_MAP, PROJECT_LEVEL_PHASES, FALLBACK_RATES,
  loadCachedRates, getRatesForModel, atomicWriteJson,
  appendCostLog, readProjectRelease,
  sumTokensFromSlice,
  resolveTranscriptPath,
  stampPath, writeStamp, readStamp, deleteStamp,
  projectSlug,
  buildCostEntry, readStdin,
};
