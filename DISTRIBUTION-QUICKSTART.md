# SpecGantry Distribution Quick Start

## Ready to Release? Follow These 3 Steps

### Step 1: Validate Your Build
```bash
npm run build
```
✅ All checks should pass

### Step 2: Increment Version
Update version in THREE files:
- `package.json` → `"version": "1.0.1"`
- `.claude-plugin/plugin.json` → `"version": "1.0.1"`
- `marketplace.json` → `"version": "1.0.1"` (in plugins array)

### Step 3: Create and Push Release

**Automated (Recommended):**
```bash
# Commit version bumps
git add package.json .claude-plugin/plugin.json marketplace.json
git commit -m "Release v1.0.1"

# Create tag (triggers GitHub Actions automatically)
git tag -a v1.0.1 -m "Release v1.0.1"

# Push everything
git push origin main
git push origin v1.0.1
```

**Manual Alternative:**
```bash
# Create package locally
npm run package

# Create tag
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# Upload to GitHub Releases
gh release create v1.0.1 --notes "SpecGantry v1.0.1" spec-gantry.zip
```

---

## What Happens Next

1. **GitHub Actions runs** → Creates `spec-gantry.zip` automatically
2. **Release is published** → Available at GitHub Releases
3. **Users can install:**
   ```bash
   claude plugin install https://github.com/specgantry/specgantry.github.io
   ```

---

## Testing Before Release

### Local Installation Test
```bash
# Install from current directory
claude plugin install .

# Verify skills are loaded
claude skill list | grep -i spec-gantry
```

### Check Distribution Package
```bash
# Create package (from release script)
npm run package

# Verify ZIP contains required files
unzip -l spec-gantry.zip | grep -E "(SKILL.md|plugin.json|icon.png)"
```

---

## Common Tasks

### Check Current Version
```bash
cat package.json | grep version
```

### List All Releases
```bash
git tag | sort -V | tail -10
```

### View Release on GitHub
```
https://github.com/specgantry/specgantry.github.io/releases
```

### Rollback to Previous Version
```bash
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
# Then delete release from GitHub web UI
```

---

## Next Steps After First Release

1. **Monitor GitHub issues** for installation problems
2. **Update documentation** at https://specgantry.github.io
3. **Announce plugin** to Claude Code community
4. **Register with marketplace** (contact Anthropic when ready)

---

For detailed information, see **DISTRIBUTION.md**
