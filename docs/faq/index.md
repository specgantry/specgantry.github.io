# FAQ — Frequently Asked Questions

Common questions and troubleshooting.

---

## Installation

### Q: Plugin won't install. "Not found in marketplace"

**A:** SpecGantry is installed directly from GitHub, not a marketplace.

```bash
claude plugin install https://github.com/specgantry/specgantry.github.io
```

Not:
```bash
# ❌ This won't work (yet)
claude plugin install spec-gantry
```

### Q: Where does the plugin install to?

**A:** Claude Code manages plugins automatically. They're stored in:
- **macOS:** `~/.claude/plugins/`
- **Windows:** `%APPDATA%\Claude\plugins\`
- **Linux:** `~/.claude/plugins/`

### Q: Can I use SpecGantry offline?

**A:** Yes! SpecGantry runs entirely within Claude Code and your local project. No cloud calls.

### Q: Do I need git?

**A:** Not required, but strongly recommended. SpecGantry saves state as plain text files, so git gives you version control and backup.

---

## Getting Started

### Q: I'm starting a new project. What do I do?

**A:** Just run `/spec-gantry` in an empty folder:

```
/spec-gantry
  → Detects empty project
  → [1] Start new project
  → Answer questions about your app
```

### Q: I'm joining a team. What do I do?

**A:** Get the project repo from your Team Lead, open it, and run:

```
/spec-gantry
  → Detects project-state.yaml
  → Sets your role as Developer
  → Shows you the backlog
  → Pick a feature!
```

### Q: I have existing code. Should I reverse-engineer it?

**A:** If you want SpecGantry structure (specs, architecture doc, feature backlog), yes:

```
/spec-gantry
  → Detects source files
  → [1] Reverse-engineer
```

If you want to skip documentation, you can start fresh and just code manually (not using SpecGantry).

---

## Roles & Permissions

### Q: Can a Developer see the architecture?

**A:** Yes, read-only. Developers need to know the architecture to write specs that fit it.

They cannot modify architecture — only the Team Lead can.

### Q: Can a Team Lead build features?

**A:** Technically yes, by setting their role to Developer in `.claude/local-state.yaml`.

But SpecGantry doesn't prevent it — it just shows that you're doing work in both roles.

### Q: What if the Team Lead leaves?

**A:** Another Team Lead can take over:
1. Edit `.claude/local-state.yaml`
2. Set `role: team-lead`
3. Run `/spec-gantry`

They'll see all project metadata and can continue managing features.

### Q: Can multiple developers work in parallel?

**A:** Yes! Each developer:
1. Has their own `.claude/local-state.yaml` (local to their machine)
2. Works on different features (or different branches)
3. Commits specs to git
4. Pulls latest project state

No conflicts because each feature has its own folder.

---

## The Pipeline

### Q: Can I skip ideation?

**A:** No. Ideation answers basic questions about the project. It's required before architecture.

(Technically you could edit YAML to force it, but that defeats the purpose.)

### Q: Can I skip architecture?

**A:** No. Architecture defines the tech stack and system boundaries. Developers need it to write specs.

### Q: Can a feature skip the spec phase?

**A:** No. Spec must be written and approved before code can be written.

This is the core gate that SpecGantry enforces.

### Q: How long does each phase take?

**A:** Typical times:
- Ideation: 10–20 minutes
- Architecture: 20–40 minutes
- Feature Spec: 5–15 minutes per feature
- Development: Depends on complexity
- Testing: 5–10 minutes

### Q: Can phases overlap?

**A:** Yes! While the Team Lead is defining architecture, a developer can:
- Review the emerging architecture
- Start writing specs for features already in backlog
- Prepare implementation approach

But they cannot start coding until approved.

---

## Specs & Approval

### Q: What makes a good feature spec?

**A:** SpecGantry guides you through this:
- **Acceptance criteria:** How will I know it's done?
- **API contract:** What inputs/outputs?
- **Integration points:** How does it connect?
- **Test cases:** What should I verify?
- **Data model:** Any schema changes?

The spec agent asks all these questions.

### Q: How does Team Lead review a spec?

**A:** The Team Lead:
1. Reads the spec
2. Checks against architecture (violations are flagged)
3. Checks against dependencies (blocking features?)
4. Approves or requests changes

Approval is explicit in state.yaml.

### Q: Can the Team Lead auto-approve specs?

**A:** Yes, they can. But they shouldn't. Spec review catches misalignment before coding.

---

## State & Progress

### Q: What if I need to restart a phase?

**A:** Edit `specs/features/FEATURE-XXX/state.yaml` and set the phase back:

```yaml
status:
  spec_complete: false        ← Change to false
  dev_complete: false
```

Next `/spec-gantry` will pick up from there.

### Q: Can I skip ahead?

**A:** Only by editing YAML directly. The UI gates you intentionally.

If you truly need to skip a phase:
1. Edit the state file
2. Mark the phase as complete
3. Run `/spec-gantry`

But you'll lose the guidance and documentation.

### Q: Where's my work if I close Claude Code?

**A:** In the `specs/` folder in your project. All state is saved to disk immediately.

Close Claude Code anytime. Next session picks up exactly where you left off.

### Q: Can I have multiple features in progress?

**A:** Yes! Each developer:
1. Picks a feature
2. Works on it
3. Finishes (or pauses)
4. Picks another

Your `local-state.yaml` tracks which is current.

---

## Costs & Tokens

### Q: How do costs work?

**A:** Every agent call logs:
- Input tokens used
- Output tokens generated
- Model (Opus, Sonnet, Haiku)

Dashboard shows total spend by phase and feature.

### Q: Can I limit token spending?

**A:** Not automatically, but you can:
1. Run `/update-pricing`
2. Set budget alerts
3. Monitor costs in dashboard
4. Use cheaper models (Haiku vs Opus)

### Q: Why are my costs so high?

**A:** Common causes:
- Using Opus for all phases (try Haiku for dev)
- Very large codebase (reverse-engineer reads all files)
- Lots of iterations on specs
- Many features with complex dependencies

### Q: How are costs calculated?

**A:** Based on actual token usage, not estimated:

```
Input tokens: 10,000 @ $0.003 per 1K = $0.03
Output tokens: 5,000 @ $0.015 per 1K = $0.075
Total: $0.105 per invocation
```

Pricing is configurable via `/update-pricing`.

---

## Troubleshooting

### Q: `/spec-gantry` shows wrong state

**A:** State files might be out of sync. Fix:

```bash
rm -rf specs/
/spec-gantry
```

This starts fresh (destructive!). Only do if you're stuck.

Or manually fix the YAML:
```bash
vim specs/project-state.yaml
```

### Q: Feature is marked complete but it's not

**A:** Edit the state file:

```yaml
# specs/features/FEATURE-001/state.yaml
status:
  deployment_status: in_progress    ← Change from complete
```

### Q: Spec won't approve against architecture

**A:** The spec violates your architecture. Common issues:
- Using wrong tech stack
- Adding database that wasn't designed for
- Breaking API contract
- Crossing system boundaries incorrectly

Read the violation message and revise the spec.

### Q: "Session interrupted" message

**A:** This is normal if Claude Code context reset or network dropped.

All state is saved. Next `/spec-gantry` picks up from the next question.

### Q: Plugin stopped working after Claude Code update

**A:** Try reinstalling:

```bash
claude plugin uninstall spec-gantry
claude plugin install https://github.com/specgantry/specgantry.github.io
```

### Q: Can I merge two projects?

**A:** Not directly. SpecGantry assumes one project per folder.

If you need to merge:
1. Create a new folder
2. Copy `specs/` from project A
3. Add features from project B
4. Manually merge `project-state.yaml`
5. Resolve conflicts

---

## Advanced

### Q: Can I version the specs?

**A:** Yes, use git:

```bash
cd specs/
git status
git diff features/FEATURE-001/spec.md
```

All state is plain text, so git diffs work perfectly.

### Q: Can I restore a deleted feature?

**A:** If committed to git:
```bash
git log --diff-filter=D specs/features/FEATURE-XXX/
git checkout <commit> -- specs/features/FEATURE-XXX/
```

If not committed, it's lost.

### Q: Can I export state to markdown?

**A:** Not automatically, but:
1. YAML files are readable
2. Markdown files (.md) are already readable
3. You can cat/grep the files

Or write a custom export script.

### Q: Can I extend SpecGantry?

**A:** Yes! It's open source. See [Contributing](../../CONTRIBUTING.md).

Common extensions:
- Custom agents for your domain
- New skills (phases)
- Custom validation rules
- Integration with your dev tools

---

## Getting Help

### Q: Where do I report bugs?

**A:** [GitHub Issues](https://github.com/specgantry/specgantry.github.io/issues)

Include:
- What you were doing
- What happened
- What you expected
- Your `specs/` folder (anonymized)

### Q: Where do I suggest features?

**A:** [GitHub Discussions](https://github.com/specgantry/specgantry.github.io/discussions)

Or open an issue with the `enhancement` label.

### Q: Where can I get support?

**A:** 
- Check [FAQ](#faq) (this page)
- Check [How It Works](../how-it-works/)
- Search [GitHub Issues](https://github.com/specgantry/specgantry.github.io/issues)
- Open a new issue with details

---

**Still stuck?** [Open an issue](https://github.com/specgantry/specgantry.github.io/issues) and we'll help! 🚀
