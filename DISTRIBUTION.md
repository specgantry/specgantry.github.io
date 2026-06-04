# SpecGantry Plugin Distribution Guide

This document outlines how to distribute SpecGantry as a publicly installable Claude Code plugin.

---

## Distribution Architecture

SpecGantry uses a multi-channel distribution strategy:

### 1. **GitHub Repository** (Source of Truth)
- Hosted at: `https://github.com/specgantry/specgantry.github.io`
- Contains: Plugin source code, skills, agents, documentation
- Purpose: Version control and release management

### 2. **GitHub Releases** (Binary Distribution)
- Packages: `spec-gantry.zip` attached to each release
- Purpose: Claude Code downloads plugin packages from here
- Triggered by: Git tags (e.g., `v1.0.0`)

### 3. **Plugin Marketplace** (Discovery)
- Format: `marketplace.json` in repository root
- Defines: Plugin metadata, installation instructions, icon
- Purpose: Claude Code plugin discovery and registration

---

## File Structure for Distribution

```
spec-gantry/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest (required)
│   ├── .pluginignore            # Exclusions from distribution
│   └── assets/
│       └── icon.png             # Plugin icon
├── marketplace.json             # Marketplace metadata
├── index.ts                      # Plugin entry point
├── package.json                  # NPM metadata & scripts
├── .github/workflows/
│   └── release.yml              # Automated release workflow
├── scripts/
│   ├── build.js                 # Build validation
│   └── release.js               # Release helper
├── skills/
│   ├── spec-gantry/
│   ├── start-project/
│   ├── bugfix/
│   ├── reverse-engineer/
│   └── update-pricing/
├── agents/
│   ├── orchestrator.md
│   ├── ideation/
│   ├── architecture/
│   ├── feature-spec/
│   ├── development/
│   └── deployment/
├── config/
│   └── pricing-history.yaml
├── docs/
│   └── [documentation]
├── DISTRIBUTION.md              # This file
├── LICENSE                       # Apache 2.0
├── CONTRIBUTING.md
└── NOTICE
```

---

## Release Process

### Step 1: Local Testing
```bash
# Validate plugin structure
npm run build

# Test local installation
claude plugin install .
```

### Step 2: Create a Release

**Option A: Automated (Recommended)**
```bash
# Create git tag
git tag -a v1.0.1 -m "Release v1.0.1"

# Push tag to trigger GitHub Actions
git push origin v1.0.1
```

The GitHub Actions workflow will automatically:
- Create the plugin package (`spec-gantry.zip`)
- Create a GitHub Release
- Attach the package for download

**Option B: Manual**
```bash
# Build the package
npm run package

# Create git tag
git tag -a v1.0.1 -m "Release v1.0.1"

# Push tag
git push origin v1.0.1

# Create release on GitHub
gh release create v1.0.1 \
  --notes "SpecGantry v1.0.1" \
  spec-gantry.zip
```

---

## Installation Methods

### For End Users

**From Claude Code CLI:**
```bash
# Not yet available until plugin is registered in marketplace
claude plugin install spec-gantry
```

**From GitHub (Current Method):**
```bash
# Install directly from source repo
claude plugin install https://github.com/specgantry/specgantry.github.io
```

**From Local Directory (Testing):**
```bash
claude plugin install /path/to/spec-gantry
```

---

## Configuration Files Explained

### `.claude-plugin/plugin.json`
Main plugin manifest that Claude Code reads:

```json
{
  "id": "spec-gantry",
  "name": "spec-gantry",
  "displayName": "SpecGantry",
  "version": "1.0.0",
  "description": "AI-powered SDLC pipeline...",
  "repository": "https://github.com/specgantry/specgantry.github.io.git",
  "icon": ".claude-plugin/assets/icon.png",
  "engines": {
    "claude-code": ">=1.0.0"
  }
}
```

**Key fields:**
- `id`: Unique identifier (used in `claude plugin install`)
- `repository`: Git URL (with `.git` suffix for proper cloning)
- `icon`: Relative path to plugin icon (must be PNG, < 10MB)
- `engines`: Minimum Claude Code version required

### `marketplace.json`
Secondary marketplace definition (for plugin registries):

```json
{
  "version": "1.0.0",
  "marketplace": "specgantry",
  "plugins": [{
    "id": "spec-gantry",
    "name": "spec-gantry",
    "repository": "https://github.com/specgantry/specgantry.github.io.git",
    ...
  }]
}
```

This file is used if SpecGantry is registered with a third-party plugin marketplace.

### `package.json`
NPM metadata for build tools:

```json
{
  "name": "spec-gantry",
  "version": "1.0.0",
  "scripts": {
    "build": "node scripts/build.js",
    "package": "zip -r spec-gantry.zip ...",
    "release": "node scripts/release.js"
  }
}
```

**Scripts:**
- `npm run build` — Validate plugin structure
- `npm run package` — Create distribution ZIP
- `npm run release` — Helper for manual releases

---

## GitHub Actions Workflow

File: `.github/workflows/release.yml`

**Triggered by:** Push to any git tag matching `v*` (e.g., `v1.0.0`)

**Actions:**
1. Checkout code
2. Create `spec-gantry.zip` package
3. Create GitHub Release with the package attached
4. Generate release notes automatically

**Prerequisites:**
- Repository must have GitHub Actions enabled
- No additional secrets required (uses built-in `GITHUB_TOKEN`)

---

## Version Management

### Semantic Versioning

Follow [semver](https://semver.org/):
- **MAJOR** — Breaking changes to skill/agent APIs
- **MINOR** — New skills or non-breaking feature additions
- **PATCH** — Bug fixes and documentation updates

### Version Locations

Update version in TWO files when releasing:

1. **`package.json`** — NPM version
```json
{
  "version": "1.0.1"
}
```

2. **`.claude-plugin/plugin.json`** — Plugin version
```json
{
  "version": "1.0.1"
}
```

3. **`marketplace.json`** — Marketplace version
```json
{
  "plugins": [{
    "version": "1.0.1"
  }]
}
```

Then create git tag: `git tag -a v1.0.1 -m "Release v1.0.1"`

---

## Debugging Installation Issues

### Issue: "Plugin not found in any marketplace"

**Cause:** Claude Code can't download from the repository.

**Solution:**
1. Verify repository URL ends with `.git`:
   ```json
   "repository": "https://github.com/specgantry/specgantry.github.io.git"
   ```

2. Test repository accessibility:
   ```bash
   git clone https://github.com/specgantry/specgantry.github.io.git
   ```

3. Ensure `plugin.json` is at root level:
   ```
   .claude-plugin/plugin.json  ← Should be here
   ```

### Issue: Missing files after installation

**Cause:** `.pluginignore` is excluding essential files.

**Current `.pluginignore`:**
```
.git/
.gitignore
node_modules/
.DS_Store
*.log
.env
.env.local
```

**Required files (never ignore):**
- `skills/*/SKILL.md`
- `agents/*.md`
- `marketplace.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/assets/icon.png`

### Issue: Plugin installs but skills don't appear

**Cause:** Skills directory structure is incorrect.

**Required structure:**
```
skills/
├── spec-gantry/
│   └── SKILL.md        ← Must be named SKILL.md
├── start-project/
│   └── SKILL.md
└── ...
```

---

## Registering with Claude Code Marketplace

To make SpecGantry discoverable in Claude Code's built-in plugin marketplace:

1. **Prepare plugin** (this guide covers this)
2. **Create GitHub Release** with `v1.0.0` tag
3. **Submit to marketplace** (contact Anthropic or use marketplace registration portal if available)
4. **Verification** — Anthropic team reviews and approves
5. **Publication** — Plugin appears in `claude plugin install` search

---

## Maintenance

### Regular Checks

- **Weekly:** Monitor GitHub issues for installation problems
- **Monthly:** Update skills/agents and create patch releases
- **Quarterly:** Plan major features and breaking changes

### Update Workflow

1. Make changes to skills, agents, or configuration
2. Bump version in `package.json` and `plugin.json`
3. Commit and tag: `git tag -a v1.0.1 -m "Release v1.0.1"`
4. Push tag: `git push origin v1.0.1`
5. GitHub Actions automatically creates release

---

## Rollback Procedure

If a release has critical issues:

```bash
# Delete local tag
git tag -d v1.0.1

# Delete remote tag
git push origin :refs/tags/v1.0.1

# Delete GitHub Release (via web UI)
# https://github.com/specgantry/specgantry.github.io/releases

# Fix the issue

# Create new tag when ready
git tag -a v1.0.2 -m "Release v1.0.2"
git push origin v1.0.2
```

---

## Success Metrics

After distribution, track:

- **Download count** from GitHub Releases
- **Installation success rate** (via GitHub issues)
- **User feedback** on compatibility and features
- **Marketplace ranking** (if registered)

---

## Support & Contribution

For users having installation issues:
- GitHub Issues: https://github.com/specgantry/specgantry.github.io/issues
- Documentation: https://specgantry.github.io/docs
- Contributing: See CONTRIBUTING.md

---

**Last Updated:** June 2026  
**Next Review:** September 2026
