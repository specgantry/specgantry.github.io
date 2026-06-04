#!/usr/bin/env node

/**
 * Release script for SpecGantry plugin
 * Creates a GitHub release with the plugin package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const pluginJson = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin/plugin.json'), 'utf-8'));

const VERSION = packageJson.version;
const TAG = `v${VERSION}`;

function createRelease() {
  console.log('🚀 Creating SpecGantry plugin release...\n');
  console.log(`Version: ${VERSION}`);
  console.log(`Tag: ${TAG}\n`);

  try {
    // Verify we're on main branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    if (branch !== 'main') {
      console.error(`❌ Error: Must be on 'main' branch, currently on '${branch}'`);
      process.exit(1);
    }

    // Check if tag already exists
    try {
      execSync(`git rev-parse ${TAG}`, { stdio: 'ignore' });
      console.error(`❌ Error: Tag ${TAG} already exists`);
      process.exit(1);
    } catch (err) {
      // Tag doesn't exist, which is good
    }

    // Create package
    console.log('📦 Creating plugin package...');
    execSync('npm run package', { cwd: ROOT, stdio: 'inherit' });

    if (!fs.existsSync(path.join(ROOT, 'spec-gantry.zip'))) {
      console.error('❌ Error: Package file not created');
      process.exit(1);
    }
    console.log('✅ Package created\n');

    // Create git tag
    console.log(`📝 Creating git tag ${TAG}...`);
    execSync(`git tag -a ${TAG} -m "Release ${VERSION}"`, { cwd: ROOT });
    console.log('✅ Git tag created\n');

    // Instructions for pushing
    console.log('📋 Next steps:\n');
    console.log(`1. Push the tag to GitHub:`);
    console.log(`   git push origin ${TAG}\n`);
    console.log(`2. Create a release on GitHub:`);
    console.log(`   gh release create ${TAG} --notes "SpecGantry v${VERSION}" spec-gantry.zip\n`);
    console.log(`3. Or manually upload spec-gantry.zip to GitHub Releases\n`);
    console.log(`GitHub Release URL:`);
    console.log(`https://github.com/specgantry/specgantry.github.io/releases/tag/${TAG}\n`);

    process.exit(0);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

createRelease();
