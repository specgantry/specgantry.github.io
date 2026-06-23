#!/usr/bin/env node
// SpecGantry Cost Tracking MCP Server
// Exposes refresh_pricing — returns current rates cache info.
// record_agent_cost has been removed: cost tracking is handled automatically
// by the SubagentStart/SubagentStop hooks in hooks.js.
// stdlib-only — no npm dependencies required

'use strict';

const fs   = require('fs');
const {
  initLogger, logError, logInfo, logDebug,
  loadCachedRates, atomicWriteJson, RATES_CACHE, FALLBACK_RATES,
  readStdin,
} = require('./shared');

// ─── Tool: refresh_pricing ────────────────────────────────────────────────────
// Returns the current rates cache info. Does not attempt a live fetch —
// the pricing page is a React SPA that cannot be scraped with a plain HTTP GET.
// To update rates, edit rates-cache.json in the plugin repo.
async function toolRefreshPricing(_args) {
  const { rates, source } = loadCachedRates();
  const cacheData = (() => {
    try { return JSON.parse(fs.readFileSync(RATES_CACHE, 'utf8')); } catch { return null; }
  })();
  return {
    ok: true,
    source,
    fetched_at: cacheData && cacheData.fetched_at || null,
    model_count: Object.keys(rates).length,
    rates,
  };
}

// ─── MCP stdio JSON-RPC ───────────────────────────────────────────────────────
const TOOLS = {
  refresh_pricing: {
    description: 'Return current rates cache info. To update rates, edit rates-cache.json in the plugin repo.',
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
  logInfo('Starting spec-gantry-costs MCP server');

  const { source, rates } = loadCachedRates();
  logInfo(`Rates loaded — source: ${source}, models: ${Object.keys(rates).length}`);

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
