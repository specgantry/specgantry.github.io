#!/usr/bin/env node

/**
 * Build script for SpecGantry plugin
 * Validates plugin structure and prepares for distribution
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function validatePlugin() {
  console.log('📦 Building SpecGantry plugin...\n');

  const checks = [
    {
      name: 'Plugin manifest (.claude-plugin/plugin.json)',
      path: path.join(ROOT, '.claude-plugin/plugin.json'),
      validate: validatePluginJson,
    },
    {
      name: 'Marketplace config (marketplace.json)',
      path: path.join(ROOT, 'marketplace.json'),
      validate: validateMarketplaceJson,
    },
    {
      name: 'Plugin icon',
      path: path.join(ROOT, '.claude-plugin/assets/icon.png'),
    },
    {
      name: 'Entry point (index.ts)',
      path: path.join(ROOT, 'index.ts'),
    },
    {
      name: 'Skills directory',
      path: path.join(ROOT, 'skills'),
      isDir: true,
    },
    {
      name: 'Agents directory',
      path: path.join(ROOT, 'agents'),
      isDir: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    try {
      if (check.isDir) {
        if (fs.existsSync(check.path) && fs.statSync(check.path).isDirectory()) {
          console.log(`✅ ${check.name}`);
          passed++;
        } else {
          console.log(`❌ ${check.name} — not found or not a directory`);
          failed++;
        }
      } else {
        if (fs.existsSync(check.path)) {
          if (check.validate) {
            check.validate(check.path);
          }
          console.log(`✅ ${check.name}`);
          passed++;
        } else {
          console.log(`❌ ${check.name} — not found`);
          failed++;
        }
      }
    } catch (err) {
      console.log(`❌ ${check.name} — ${err.message}`);
      failed++;
    }
  });

  // Count skills and agents
  const skillsDir = path.join(ROOT, 'skills');
  const agentsDir = path.join(ROOT, 'agents');

  const skills = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );

  const agents = fs.readdirSync(agentsDir).filter(f =>
    fs.statSync(path.join(agentsDir, f)).isDirectory()
  ).length + 1; // orchestrator.md + subdirs

  console.log(`\n📚 Content:`);
  console.log(`   ${skills.length} skills configured`);
  console.log(`   ${agents} agents configured`);

  console.log(`\n${passed} checks passed, ${failed} checks failed`);

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✨ Plugin build validation successful!\n');
  process.exit(0);
}

function validatePluginJson(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!content.id || !content.name || !content.version) {
    throw new Error('Missing required fields: id, name, or version');
  }

  if (!content.repository.includes('.git')) {
    console.warn('   ⚠️  Repository URL should end with .git for best compatibility');
  }
}

function validateMarketplaceJson(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!content.plugins || !Array.isArray(content.plugins) || content.plugins.length === 0) {
    throw new Error('Invalid marketplace.json: must contain at least one plugin');
  }
}

validatePlugin();
