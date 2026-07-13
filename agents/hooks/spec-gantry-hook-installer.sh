#!/usr/bin/env bash
# SpecGantry hook installer — writes .claude/settings.json, hook script, and CONTRACT.md
set -euo pipefail

PROJECT_DIR="${1:-.}"
CLAUDE_DIR="$PROJECT_DIR/.claude"
HOOKS_DIR="$CLAUDE_DIR/hooks"
SETTINGS="$CLAUDE_DIR/settings.json"
HOOK_SCRIPT="$HOOKS_DIR/spec-gantry-contract.sh"
CONTRACT="$CLAUDE_DIR/CONTRACT.md"
SENTINEL="spec-gantry-contract"

mkdir -p "$HOOKS_DIR"

# 1. Merge hooks into .claude/settings.json using Python for safe JSON handling
python3 - "$SETTINGS" "$SENTINEL" <<'PYEOF'
import json, sys, os

settings_path = sys.argv[1]
sentinel = sys.argv[2]

existing = {}
if os.path.exists(settings_path):
    with open(settings_path) as f:
        existing = json.load(f)

# Skip if already installed
hooks = existing.get("hooks", {})
for event_hooks in hooks.values():
    for group in event_hooks:
        for h in group.get("hooks", []):
            if sentinel in h.get("command", ""):
                print(f"  hooks already installed in {settings_path} — skipping")
                sys.exit(0)

# Merge SessionStart
ss = existing.setdefault("hooks", {}).setdefault("SessionStart", [])
ss.append({"hooks": [{"type": "command", "command": f"bash .claude/hooks/{sentinel}.sh", "statusMessage": "Loading SpecGantry engagement contract..."}]})

# Merge PostCompact
pc = existing["hooks"].setdefault("PostCompact", [])
pc.append({"hooks": [{"type": "command", "command": f"bash .claude/hooks/{sentinel}.sh", "statusMessage": "Reloading SpecGantry engagement contract after compaction..."}]})

with open(settings_path, "w") as f:
    json.dump(existing, f, indent=2)

print(f"  wrote {settings_path}")
PYEOF

# 2. Write the contract hook script
if [[ ! -f "$HOOK_SCRIPT" ]]; then
cat > "$HOOK_SCRIPT" <<'HOOKEOF'
#!/usr/bin/env bash
# SpecGantry engagement contract — injected at SessionStart and PostCompact
set -euo pipefail

CONTRACT_PATH="${CLAUDE_PROJECT_DIR:-.}/.claude/CONTRACT.md"
UPDATE_CACHE="${CLAUDE_PROJECT_DIR:-.}/.claude/spec-gantry-update-check.txt"
REMOTE_VERSION_URL="https://raw.githubusercontent.com/specgantry/specgantry.github.io/main/VERSION"

# --- Version check (async, non-blocking, once per session) ---
check_for_update() {
  # Resolve local installed version from the plugin's own VERSION file
  local plugin_dir
  plugin_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local local_version=""
  # Walk up from hooks/ to find VERSION file in the plugin root
  local search_dir="$plugin_dir"
  for _ in 1 2 3 4 5; do
    if [[ -f "$search_dir/VERSION" ]]; then
      local_version=$(cat "$search_dir/VERSION" | tr -d '[:space:]')
      break
    fi
    search_dir="$(dirname "$search_dir")"
  done
  [[ -z "$local_version" ]] && return  # can't find local version — skip silently

  # Fetch remote version with short timeout (background, non-blocking)
  local remote_version
  remote_version=$(curl -fsSL --max-time 3 "$REMOTE_VERSION_URL" 2>/dev/null | tr -d '[:space:]') || return

  [[ -z "$remote_version" ]] && return

  if [[ "$remote_version" != "$local_version" ]]; then
    # Write update notice to cache — orchestrator reads this at dashboard render time
    cat > "$UPDATE_CACHE" <<EOF
UPDATE_AVAILABLE
local=$local_version
remote=$remote_version
EOF
  else
    # Up to date — clear any stale cache
    rm -f "$UPDATE_CACHE"
  fi
}

# Run version check in background — never blocks session start
check_for_update &
disown

# --- Contract injection ---
if [[ ! -f "$CONTRACT_PATH" ]]; then
  python3 -c "
import json, sys
print(json.dumps({'hookSpecificOutput': {'hookEventName': 'SessionStart', 'additionalContext': sys.argv[1]}}))" \
    "SpecGantry: CONTRACT.md not found — engagement contract not enforced."
  exit 0
fi

CONTENT=$(< "$CONTRACT_PATH")

HOOK_EVENT=$(python3 -c "
import json, sys
raw = sys.stdin.read().strip()
print(json.loads(raw).get('hook_event_name', 'SessionStart') if raw else 'SessionStart')
" 2>/dev/null || echo "SessionStart")

python3 -c "
import json, sys
print(json.dumps({'hookSpecificOutput': {'hookEventName': sys.argv[1], 'additionalContext': sys.argv[2]}}))" \
  "$HOOK_EVENT" "$CONTENT"
HOOKEOF
  chmod +x "$HOOK_SCRIPT"
  echo "  wrote $HOOK_SCRIPT"
else
  echo "  $HOOK_SCRIPT already exists — skipping"
fi

# 3. Write CONTRACT.md
if [[ ! -f "$CONTRACT" ]]; then
cat > "$CONTRACT" <<'CONTRACTEOF'
---
name: spec-gantry-contract
description: Engagement contract — enforces SpecGantry routing for all development work
---

# SpecGantry Engagement Contract

> **BINDING DIRECTIVE — read before responding to any message in this session.**
> This project is managed by SpecGantry. All development work — bugs, enhancements,
> new features, architecture changes — MUST be routed through `/spec-gantry`. Never
> modify code directly without first invoking `/spec-gantry` to get the correct phase
> and subagent. Specs live under `specs/` and must stay in sync with the code at all times.

## Rules

1. **Never write or modify code directly.** Always invoke `/spec-gantry` first — it will route to the correct subagent for the current phase.
2. **Never answer "what does this story do?" from memory.** Read `specs/stories/[STORY-ID]/story-spec.md` and `intent.md`.
3. **After `/compact`, re-read `specs/project-state.yaml`** to restore project context before acting.
4. **If the user asks for a quick fix, still route through `/spec-gantry`.** A bypass means specs drift from code — that is a critical failure for this project.
CONTRACTEOF
  echo "  wrote $CONTRACT"
else
  echo "  $CONTRACT already exists — skipping"
fi

# 4. Add CONTRACT.md to .gitignore if absent
GITIGNORE="$PROJECT_DIR/.gitignore"
if [[ ! -f "$GITIGNORE" ]] || ! grep -qF ".claude/CONTRACT.md" "$GITIGNORE"; then
  echo ".claude/CONTRACT.md" >> "$GITIGNORE"
  echo "  appended .claude/CONTRACT.md to .gitignore"
fi

echo "  SpecGantry engagement hooks installed."
