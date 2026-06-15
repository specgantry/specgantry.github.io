#!/usr/bin/env node
// Cost aggregation: reads specs/cost-log.ndjson, groups by (story, release, model, phase),
// sums metrics, backs up to specs/.backups/, writes aggregated records, minimal output

'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const COST_LOG_PATH = path.join(PROJECT_DIR, 'specs', 'cost-log.ndjson');
const BACKUP_DIR = path.join(PROJECT_DIR, 'specs', '.backups');

function readCostLog() {
  if (!fs.existsSync(COST_LOG_PATH)) return [];
  const content = fs.readFileSync(COST_LOG_PATH, 'utf8');
  const records = [];
  for (const line of content.split('\n').filter(l => l.trim())) {
    try {
      records.push(JSON.parse(line));
    } catch (e) {}
  }
  return records;
}

function createBackup() {
  if (!fs.existsSync(COST_LOG_PATH)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const now = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const existing = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(`b-${now}`)).length;
  const backupPath = path.join(BACKUP_DIR, `b-${now}-${existing + 1}.ndjson`);
  try {
    fs.copyFileSync(COST_LOG_PATH, backupPath);
    return backupPath;
  } catch (e) {
    return null;
  }
}

function aggregateRecords(records) {
  const agg = new Map();

  for (const record of records) {
    const key = JSON.stringify({
      story: record.story,
      release: record.release,
      model: record.model,
      phase: record.phase,
    });

    if (!agg.has(key)) {
      agg.set(key, {
        story: record.story,
        release: record.release,
        model: record.model,
        phase: record.phase,
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        input_cost_usd: 0,
        output_cost_usd: 0,
        cache_write_cost_usd: 0,
        cache_read_cost_usd: 0,
        total_cost_usd: 0,
        latest_date: '2000-01-01',
        agents: new Set(),
      });
    }

    const a = agg.get(key);
    a.input_tokens += record.input_tokens || 0;
    a.output_tokens += record.output_tokens || 0;
    a.cache_creation_tokens += record.cache_creation_tokens || 0;
    a.cache_read_tokens += record.cache_read_tokens || 0;
    a.input_cost_usd += record.input_cost_usd || 0;
    a.output_cost_usd += record.output_cost_usd || 0;
    a.cache_write_cost_usd += record.cache_write_cost_usd || 0;
    a.cache_read_cost_usd += record.cache_read_cost_usd || 0;
    a.total_cost_usd += record.total_cost_usd || 0;

    if (record.date && record.date > a.latest_date) {
      a.latest_date = record.date;
    }
    if (record.agent) {
      a.agents.add(record.agent);
    }
  }

  const result = [];
  for (const a of agg.values()) {
    const agent = Array.from(a.agents)[0] || 'unknown';
    result.push({
      phase: a.phase,
      agent: agent,
      model: a.model,
      story: a.story,
      release: a.release,
      date: a.latest_date,
      input_tokens: a.input_tokens,
      output_tokens: a.output_tokens,
      cache_creation_tokens: a.cache_creation_tokens,
      cache_read_tokens: a.cache_read_tokens,
      input_cost_usd: Math.round(a.input_cost_usd * 100000000) / 100000000,
      output_cost_usd: Math.round(a.output_cost_usd * 100000000) / 100000000,
      cache_write_cost_usd: Math.round(a.cache_write_cost_usd * 100000000) / 100000000,
      cache_read_cost_usd: Math.round(a.cache_read_cost_usd * 100000000) / 100000000,
      total_cost_usd: Math.round(a.total_cost_usd * 100000000) / 100000000,
      pricing_source: 'live',
    });
  }

  result.sort((a, b) => {
    const sa = a.story || '';
    const sb = b.story || '';
    if (sa !== sb) return sa.localeCompare(sb);
    if (a.release !== b.release) return a.release.localeCompare(b.release);
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    return a.model.localeCompare(b.model);
  });

  return result;
}

function writeCostLog(records) {
  try {
    const lines = records.map(r => JSON.stringify(r));
    fs.writeFileSync(COST_LOG_PATH, lines.join('\n') + '\n');
    return true;
  } catch (e) {
    return false;
  }
}

function aggregateCostLog() {
  const records = readCostLog();
  const originalCount = records.length;

  if (originalCount === 0) {
    return { success: true, originalCount: 0, aggregatedCount: 0 };
  }

  // Sum tokens before aggregation
  const tokensBefore = records.reduce((sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0), 0);

  const backupPath = createBackup();
  const aggregated = aggregateRecords(records);

  // Sum tokens after aggregation
  const tokensAfter = aggregated.reduce((sum, r) => sum + (r.input_tokens || 0) + (r.output_tokens || 0), 0);

  // Verify data integrity
  if (tokensBefore !== tokensAfter) {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, COST_LOG_PATH);
    }
    return { success: false, originalCount, aggregatedCount: 0, totalCost: 0 };
  }

  const success = writeCostLog(aggregated);

  if (success) {
    const totalCost = aggregated.reduce((sum, r) => sum + (r.total_cost_usd || 0), 0);
    return {
      success: true,
      originalCount,
      aggregatedCount: aggregated.length,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  }

  // Write failed, restore backup
  if (backupPath && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, COST_LOG_PATH);
  }

  return { success: false, originalCount, aggregatedCount: 0, totalCost: 0 };
}

module.exports = { aggregateCostLog, readCostLog, aggregateRecords, writeCostLog };

if (require.main === module) {
  const result = aggregateCostLog();
  if (result.success) {
    const ratio = result.originalCount > 0
      ? Math.round((1 - result.aggregatedCount / result.originalCount) * 100)
      : 0;
    console.log(`✓ ${result.originalCount}→${result.aggregatedCount} (${ratio}%) $${result.totalCost.toFixed(2)}`);
  } else {
    console.error('✗ Aggregation failed');
    process.exit(1);
  }
}
