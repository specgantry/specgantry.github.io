# SpecGantry Plugin Structure Analysis

## Overview
This is a **Claude Code Plugin** that provides an AI-powered SDLC pipeline with multiple skills and agents. The plugin is properly structured but has some configuration issues preventing installation.

---

## Current Structure ✅

### 1. **Plugin Configuration** (`.claude-plugin/`)
- `plugin.json` — Main plugin manifest
- `.pluginignore` — Specifies what to exclude during distribution
- `assets/icon.png` — Plugin icon (4.1 MB PNG)

### 2. **Skills** (`/skills/`)
Each skill is a Claude Code skill definition file (`SKILL.md`):
- **spec-gantry** — Main dashboard and SDLC pipeline entry point
- **start-project** — Initializes new projects (used by Team Lead)
- **bugfix** — Bug fix workflow
- **reverse-engineer** — Reverse-engineers existing codebases into project specs
- **update-pricing** — Pricing history management

### 3. **Agents** (`/agents/`)
Specialized agents for different pipeline phases:
- **orchestrator.md** — Coordinates the pipeline
- **ideation/** — Project planning and requirements
- **architecture/** — System design and architecture planning
- **feature-spec/** — Feature specification writing
- **development/** — Dev and test agents
- **deployment/** — Deployment orchestration

### 4. **Configuration** (`/config/`)
- `pricing-history.yaml` — Token usage cost tracking

---

## Issues Found ⚠️

### Issue 1: **Missing Plugin Entry Point**
- **Problem:** Claude Code plugins need an entry point file (e.g., `main.ts`, `index.ts`, or `plugin.ts`)
- **Current State:** The plugin only has skill `.md` files, no compiled/executable entry point
- **Impact:** Claude Code can't load the plugin even if installation succeeds

### Issue 2: **Incorrect Repository URL in Configs**
**Files affected:**
- `marketplace.json` (line 17)
- `.claude-plugin/plugin.json` (line 13)

```json
"repository": "https://github.com/specgantry/specgantry.github.io"
```

**Problem:** This points to the GitHub Pages site, not the source repository. Claude Code's package manager expects an actual source repo with releases.

**Should be:**
```json
"repository": "https://github.com/mangeshpise/Code/SpecGantry"
```
Or wherever your actual source repository is hosted.

### Issue 3: **Broken Download URL**
**File:** `.claude-plugin/plugin.json` (line 27)

```json
"downloadUrl": "https://github.com/specgantry/specgantry.github.io/releases/download/latest/spec-gantry.zip"
```

**Problem:** 
- Points to the GitHub Pages repo (wrong location)
- References a `/releases` endpoint that doesn't exist on GitHub Pages
- No `spec-gantry.zip` file exists at that location

---

## How Claude Code Plugins Work

For a plugin to be installable via `claude plugin install`, Claude Code needs:

1. **Plugin Manifest** (`plugin.json`) ✅ — Already present
2. **Skills/Agents** ✅ — Already present
3. **Executable Entry Point** ❌ — **MISSING**
4. **Valid Repository URL** ❌ — **INCORRECT**
5. **Release Distribution** ❌ — **NOT SET UP**

---

## Recommended Fixes

### Option A: Simple Local Installation (for testing)
```bash
cd /Users/mangeshpise/Code/SpecGantry
claude plugin install .
```
This installs directly from the current directory without needing a repository.

**Status:** Will likely fail without an entry point file.

### Option B: Fix Repository & Create Entry Point
1. Create a plugin entry point file:
   ```bash
   touch /Users/mangeshpise/Code/SpecGantry/index.ts
   ```

2. Update repository URLs in both config files to point to the actual source repo

3. For marketplace installation, you'd need:
   - A GitHub repo with releases
   - CI/CD to build and package the plugin
   - The plugin registered in Claude Code's marketplace

### Option C: Distribute as Skill Files Only
If you want users to use individual skills without a full plugin package:
- Keep the `.md` files as-is
- Users can copy them directly into their `.claude/skills/` directory
- No entry point needed

---

## Configuration Issues to Fix

### Fix 1: Update marketplace.json
Replace line 17:
```diff
- "repository": "https://github.com/specgantry/specgantry.github.io",
+ "repository": "https://github.com/mangeshpise/SpecGantry",  // or your actual repo URL
```

### Fix 2: Update .claude-plugin/plugin.json
Replace line 13:
```diff
- "repository": "https://github.com/specgantry/specgantry.github.io",
+ "repository": "https://github.com/mangeshpise/SpecGantry",  // or your actual repo URL
```

Remove or update line 27 (downloadUrl) once you set up releases:
```diff
- "downloadUrl": "https://github.com/specgantry/specgantry.github.io/releases/download/latest/spec-gantry.zip",
+ "downloadUrl": "https://github.com/mangeshpise/SpecGantry/releases/download/v1.0.0/spec-gantry.zip",
```

---

## Next Steps

1. **Determine your distribution goal:**
   - Local development only → Fix repository URLs, create entry point
   - Public marketplace → Also set up GitHub releases & CI/CD
   - Skill files only → No changes needed, users copy `.md` files directly

2. **For public distribution:**
   - Create a GitHub repository to host the source
   - Set up GitHub Releases with `.zip` packages
   - Register with Claude Code's plugin marketplace (if available)

3. **For local testing:**
   - Create a simple `index.ts` entry point that imports and exports your skills
   - Test with `claude plugin install /local/path`

---

## Plugin File Reference

| File | Purpose | Status |
|------|---------|--------|
| `plugin.json` | Plugin manifest | ✅ Present, needs URL fixes |
| `.pluginignore` | Distribution exclusions | ✅ Properly configured |
| `assets/icon.png` | Plugin icon | ✅ Present |
| `index.ts` | Entry point | ❌ Missing |
| `package.json` | Dependencies | ❌ Missing (if using npm) |
| Skills (`*.md`) | Skill definitions | ✅ All present |
| Agents (`*.md`) | Agent definitions | ✅ All present |
| Repository | Source code hosting | ❌ Wrong URL configured |
| GitHub Releases | Binary distribution | ❌ Not set up |
