# Release Checklist for SpecGantry

Use this checklist when preparing a new release. Follow the steps in order.

## Pre-Release (Development Phase)

- [ ] All changes merged to `main` branch
- [ ] All tests passing (if applicable)
- [ ] Documentation updated
- [ ] Changelog or release notes prepared
- [ ] No breaking changes to skill/agent APIs (or clearly documented)

## Version Bump (1 hour before release)

- [ ] Update `package.json` version field
  ```bash
  # Edit file and update "version"
  vim package.json
  ```

- [ ] Update `.claude-plugin/plugin.json` version field
  ```bash
  # Edit file and update "version"
  vim .claude-plugin/plugin.json
  ```

- [ ] Update `marketplace.json` version field
  ```bash
  # Edit file and update version in plugins array
  vim marketplace.json
  ```

- [ ] Verify all three files have matching versions
  ```bash
  grep -r '"version"' package.json .claude-plugin/plugin.json marketplace.json
  ```

## Build Validation

- [ ] Run build validation script
  ```bash
  npm run build
  ```
  ✅ All checks must pass

- [ ] Create local test package (optional but recommended)
  ```bash
  npm run package
  ```

- [ ] Test local installation
  ```bash
  claude plugin install .
  ```

## Git Operations

- [ ] Stage version bump commits
  ```bash
  git add package.json .claude-plugin/plugin.json marketplace.json
  ```

- [ ] Commit version bumps
  ```bash
  git commit -m "Release v1.0.1"
  ```

- [ ] Create annotated git tag
  ```bash
  git tag -a v1.0.1 -m "Release v1.0.1"
  ```

- [ ] Verify tag was created
  ```bash
  git tag -l | tail -1
  ```

## Push to GitHub

- [ ] Push main branch
  ```bash
  git push origin main
  ```

- [ ] Push release tag
  ```bash
  git push origin v1.0.1
  ```

- [ ] Verify tag appears on GitHub
  ```
  https://github.com/specgantry/specgantry.github.io/releases
  ```

## GitHub Actions Automation

- [ ] Wait for GitHub Actions workflow to complete
  - Check: https://github.com/specgantry/specgantry.github.io/actions
  - Status: Should show green checkmark
  - Artifact: `spec-gantry.zip` should be attached to release

- [ ] Verify release package contents
  ```bash
  # Download and inspect
  unzip -l spec-gantry.zip | head -20
  ```

## Post-Release

- [ ] Announce release (if applicable)
  - GitHub Discussions
  - Email newsletter
  - Social media
  - Claude Code community channels

- [ ] Monitor for issues
  - Watch GitHub Issues tab
  - Check for installation problems
  - Verify all skills load correctly

- [ ] Update documentation if needed
  - Website: https://specgantry.github.io
  - Docs: https://specgantry.github.io/docs
  - Changelog: If maintaining one

## Rollback (If Critical Issue Found)

If release has critical bugs:

- [ ] Delete local tag
  ```bash
  git tag -d v1.0.1
  ```

- [ ] Delete remote tag
  ```bash
  git push origin :refs/tags/v1.0.1
  ```

- [ ] Delete GitHub Release (via web UI)
  ```
  https://github.com/specgantry/specgantry.github.io/releases
  ```

- [ ] Fix the issue in code

- [ ] Bump to new version (e.g., v1.0.2)

- [ ] Repeat release process

---

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

| Change Type | Increment | Example |
|---|---|---|
| Breaking change to APIs | MAJOR | 1.0.0 → 2.0.0 |
| New skill or non-breaking feature | MINOR | 1.0.0 → 1.1.0 |
| Bug fix, docs, small improvement | PATCH | 1.0.0 → 1.0.1 |

---

## Troubleshooting

### "Tag already exists"
```bash
# Delete and recreate
git tag -d v1.0.1
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin :refs/tags/v1.0.1  # Delete remote
git push origin v1.0.1              # Push new tag
```

### "Workflow didn't trigger"
- GitHub Actions only triggers on **annotated tags** (not lightweight tags)
- Use: `git tag -a v1.0.1 -m "..."` (not `git tag v1.0.1`)
- Wait 1-2 minutes for workflow to appear in Actions tab

### "Build validation failed"
- Run `npm run build` locally to see detailed errors
- Check skill/agent files exist in correct locations
- Verify `.claude-plugin/plugin.json` is valid JSON
- Ensure `assets/icon.png` exists and is readable

### "Plugin won't install"
- Verify repository URL ends with `.git`
- Ensure `plugin.json` is at `.claude-plugin/plugin.json` (exact path)
- Test with `claude plugin install .` first (local installation)
- Check for issues in `.pluginignore` excluding essential files

---

## Release Commit Template

```
Release vX.Y.Z

- New features: [list]
- Bug fixes: [list]
- Documentation: [list]
- Breaking changes: [list, if any]

Changelog: https://github.com/specgantry/specgantry.github.io/releases/tag/vX.Y.Z

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

---

**Last Updated:** June 2026  
**For Help:** See DISTRIBUTION.md or GitHub Issues
