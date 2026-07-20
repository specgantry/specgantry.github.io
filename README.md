# SpecGantry

AI-powered SDLC pipeline for Claude Code with a Challenge-Write-Judge loop at every phase — adversarial quality validation from ideation through deployment.

## What's new in v7

**v7.0.0**
- **Challenge-Write-Judge (CWJ) replaces Plan-Produce-Evaluate** — every phase now uses an adversarial challenger agent that asks what a developer (or user) would be blocked on before anything is written or built. The judge asks "would the next phase be blocked?" not "did this pass a checklist."
- **Per-project north star** — a single flowing prose document written during ideation from the actual idea, extended by the spec phase as new requirements surface. Replaces three fixed north star documents shipped with the plugin.
- **Capabilities replace stories** — work units are now capabilities (`CAP-001`, `CAP-002`, etc.) under `specs/capabilities/`. Each has `intent.md` and `capability-spec.md`.
- **Diagnostic investigate agent** — classifies problems as `CODE_BUG`, `SPEC_GAP`, `REQUIREMENT_DRIFT`, or `NEW_CAPABILITY` before routing to the right repair phase. Fixes the right thing instead of always re-running code.
- **Changelog for release safety** — `specs/changelog.md` tracks dropped and deprecated fields across releases. Spec and code agents read it before referencing any interface — prevents using removed APIs in new releases.
- **Developer intelligence in `/track-cost`** — iteration counts per capability per phase, challenge density, outlier detection, release comparison. Not just a cost ledger.

## Installation

**Option 1 — Direct install (terminal):**
```bash
claude plugin marketplace add https://github.com/specgantry/specgantry.github.io
claude plugin install spec-gantry
```

**Option 2 — From within Claude Code:**
```
/plugin marketplace add specgantry/specgantry.github.io
/plugin install spec-gantry
```

Then open any project in Claude Code and run:
```
/spec-gantry
```

## Update

If you already have SpecGantry installed, update to the latest version:

**Option 1 — Terminal:**
```bash
claude plugin marketplace update spec-gantry && claude plugin update spec-gantry@spec-gantry
```

**Option 2 — From within Claude Code:**
```
/plugin marketplace update spec-gantry && /plugin update spec-gantry@spec-gantry
```

## Documentation

https://specgantry.github.io

## License

Apache 2.0
