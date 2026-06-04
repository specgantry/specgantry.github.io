# Your First SpecGantry Release — Step by Step

This guide walks you through releasing SpecGantry v1.0.0 to the world. Follow these steps in order.

---

## Before You Start

**Prerequisites:**
- ✅ You're on the `main` branch
- ✅ All changes are committed
- ✅ You've pushed to GitHub
- ✅ You have `git` and access to push tags

**Time required:** ~5 minutes

---

## Step 1: Validate the Build (2 minutes)

Run the build validation script to ensure everything is correct:

```bash
npm run build
```

You should see:
```
✅ Plugin manifest (.claude-plugin/plugin.json)
✅ Marketplace config (marketplace.json)
✅ Plugin icon
✅ Entry point (index.ts)
✅ Skills directory
✅ Agents directory

📚 Content:
   5 skills configured
   6 agents configured

6 checks passed, 0 checks failed

✨ Plugin build validation successful!
```

**If you see ❌ marks:** Fix the issues before proceeding.

---

## Step 2: Update Version Numbers (1 minute)

The current version is likely 1.0.0. Update it in THREE files:

### File 1: `package.json`
```bash
# Open the file
vim package.json
```

Find the `"version"` field and update it:
```json
{
  "name": "spec-gantry",
  "version": "1.0.0",    ← Update this
  ...
}
```

### File 2: `.claude-plugin/plugin.json`
```bash
vim .claude-plugin/plugin.json
```

Find the `"version"` field:
```json
{
  "id": "spec-gantry",
  "version": "1.0.0",    ← Update this
  ...
}
```

### File 3: `marketplace.json`
```bash
vim marketplace.json
```

Find the `"version"` field in the `plugins` array:
```json
{
  "plugins": [
    {
      "id": "spec-gantry",
      "version": "1.0.0",    ← Update this
      ...
    }
  ]
}
```

**Quick check — all three should match:**
```bash
grep -r '"version"' package.json .claude-plugin/plugin.json marketplace.json
```

---

## Step 3: Commit Version Updates (1 minute)

Stage and commit your version bump:

```bash
# Stage the changes
git add package.json .claude-plugin/plugin.json marketplace.json

# Verify staged changes
git status
```

You should see all three files staged for commit.

```bash
# Create commit
git commit -m "Release v1.0.0"
```

---

## Step 4: Create Git Tag (1 minute)

Create an annotated git tag to trigger the release:

```bash
# Create the tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Verify it was created
git tag -l | tail -3
```

You should see `v1.0.0` in the output.

---

## Step 5: Push to GitHub (1 minute)

Push both the commit and the tag to GitHub:

```bash
# Push main branch
git push origin main

# Push the release tag (this triggers GitHub Actions!)
git push origin v1.0.0
```

Watch the output for confirmation messages.

---

## Step 6: Wait for GitHub Actions (2-3 minutes)

GitHub Actions automatically creates your release package:

1. **Go to Actions:** https://github.com/specgantry/specgantry.github.io/actions

2. **Look for workflow:** You should see "Release Plugin" running with a yellow ⏳ icon

3. **Wait for completion:** It will change to ✅ green checkmark (usually takes 1-2 minutes)

4. **Check the release:** https://github.com/specgantry/specgantry.github.io/releases
   - You should see `v1.0.0` at the top
   - `spec-gantry.zip` should be attached

---

## Step 7: Verify the Release (1 minute)

### Check Release Page
```
https://github.com/specgantry/specgantry.github.io/releases/tag/v1.0.0
```

You should see:
- ✅ Release title: "Release v1.0.0"
- ✅ Package attached: `spec-gantry.zip`
- ✅ File size: ~500KB - 1MB (reasonable size)

### Test Installation (Optional)
Users can now install with:
```bash
claude plugin install https://github.com/specgantry/specgantry.github.io
```

---

## 🎉 You're Done!

Your SpecGantry plugin is now publicly distributed!

### What Happened
1. ✅ Built and validated the plugin
2. ✅ Created a git tag for version v1.0.0
3. ✅ GitHub Actions automatically packaged it
4. ✅ Release is available on GitHub for download

### What Users Can Do Now
- Install: `claude plugin install https://github.com/specgantry/specgantry.github.io`
- Use all 5 skills: `spec-gantry`, `start-project`, `bugfix`, `reverse-engineer`, `update-pricing`
- Access all agents: orchestrator, ideation, architecture, feature-spec, dev, test, deployment

---

## 🚀 Next Release (Future)

For the next release (e.g., v1.0.1), just repeat this process:

```bash
# 1. Update version in 3 files (1.0.1)
# 2. Commit: git commit -m "Release v1.0.1"
# 3. Tag: git tag -a v1.0.1 -m "Release v1.0.1"
# 4. Push: git push origin main && git push origin v1.0.1
# Done! GitHub Actions does the rest.
```

---

## ⚠️ If Something Goes Wrong

### "I tagged the wrong commit"
```bash
# Delete the local tag
git tag -d v1.0.0

# Delete the remote tag
git push origin :refs/tags/v1.0.0

# Create it correctly
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### "GitHub Actions didn't trigger"
- Make sure you used an **annotated tag**: `git tag -a v1.0.0 ...` (not `git tag v1.0.0`)
- Wait 2-3 minutes for the workflow to appear in Actions tab
- Tag must match the pattern `v*` (e.g., `v1.0.0`, `v1.0.1`)

### "Release was created but ZIP is missing"
- Check GitHub Actions workflow for errors
- Verify all required files exist: `npm run build`
- Contact GitHub support if workflow is broken

### "I want to redo the release"
```bash
# Delete the GitHub release (via web UI)
# Then:
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
# Create it again with corrections
```

---

## 📚 Need More Details?

- **How does this work?** → See `DISTRIBUTION.md`
- **Release checklist for next time?** → See `.github/RELEASE_CHECKLIST.md`
- **Quick reference?** → See `DISTRIBUTION-QUICKSTART.md`

---

## 🎯 Success Metrics

After your first release, monitor:

- [ ] GitHub Release page shows v1.0.0
- [ ] `spec-gantry.zip` is downloadable
- [ ] Plugin can be installed via `claude plugin install https://github.com/specgantry/specgantry.github.io`
- [ ] All skills appear in `claude skill list`
- [ ] No errors when using skills

---

**You're all set! 🚀 Happy releasing!**
