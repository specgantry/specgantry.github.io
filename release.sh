#!/bin/bash

##############################################################################
# SpecGantry Release Script
#
# Auto-increments version and creates a release.
#
# Usage:
#   ./release.sh              Auto-increment and release (e.g., 0.0.1 → 0.0.2)
#   ./release.sh --help       Show help
#   ./release.sh --current    Show current version
#   ./release.sh vX.Y.Z       Release specific version (e.g., 1.0.0)
#
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Plugin manifest files
MANIFEST_FILE=".claude-plugin/plugin.json"
MARKETPLACE_FILE=".claude-plugin/marketplace.json"
LANDING_PAGE="docs/_layouts/landing.html"
GETTING_STARTED="docs/docs/getting-started/index.md"
SKILL_FILE="skills/spec-gantry/SKILL.md"

# Functions
log_info() {
  echo -e "${BLUE}→${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

show_help() {
  cat << 'EOF'
SpecGantry Release Script

Auto-increments version and creates a release.

USAGE:
  ./release.sh              Auto-increment and release
  ./release.sh --help       Show this help message
  ./release.sh --current    Show current version
  ./release.sh vX.Y.Z       Release specific version (e.g., 1.0.0)

AUTO-INCREMENT PATTERN:
  0.0.1 → 0.0.2 → ... → 0.0.9
  0.0.9 → 0.1.0
  0.1.9 → 0.2.0
  0.9.9 → 1.0.0
  1.0.9 → 1.1.0
  etc.

EXAMPLES:
  ./release.sh              (auto-increment patch: 0.0.1 → 0.0.2)
  ./release.sh --current    (show current version)
  ./release.sh v1.0.0       (release v1.0.0 specifically)

PROCESS:
  1. Stages any uncommitted changes
  2. Updates version in .claude-plugin/plugin.json
  3. Commits all changes
  4. Tags release in git
  5. Pushes commits and tags to GitHub
  6. Release page created automatically

For more info, visit: https://github.com/specgantry/specgantry.github.io
EOF
}

get_current_version() {
  grep -o '"version": "[^"]*"' "$MANIFEST_FILE" | cut -d'"' -f4
}

increment_version() {
  local version=$1
  local major minor patch

  # Parse version
  major=$(echo "$version" | cut -d. -f1)
  minor=$(echo "$version" | cut -d. -f2)
  patch=$(echo "$version" | cut -d. -f3)

  # Increment patch
  ((patch++))

  # Handle overflow: patch 10 → 0, increment minor
  if [ "$patch" -eq 10 ]; then
    patch=0
    ((minor++))
  fi

  # Handle overflow: minor 10 → 0, increment major
  if [ "$minor" -eq 10 ]; then
    minor=0
    ((major++))
  fi

  echo "${major}.${minor}.${patch}"
}

validate_version() {
  local version=$1

  if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Invalid version format: $version. Use: vX.Y.Z (e.g., v1.0.0)"
  fi
}

release() {
  local version=$1

  log_info "Preparing release: $version"

  # Check branch
  local branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$branch" != "main" ]; then
    log_error "Must be on 'main' branch. Currently on: $branch"
  fi

  # Check for uncommitted changes and stage them
  if ! git diff-index --quiet HEAD --; then
    log_warning "Uncommitted changes detected. Including in release commit."
    git add -A
  fi

  # Check if tag exists
  if git rev-parse "v$version" &> /dev/null; then
    log_error "Tag v$version already exists"
  fi

  # Update version in both manifests and docs pages
  log_info "Updating version in $MANIFEST_FILE, $MARKETPLACE_FILE, $LANDING_PAGE, $GETTING_STARTED, and $SKILL_FILE"

  # Use sed to update version (works on both macOS and Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$MANIFEST_FILE"
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$MARKETPLACE_FILE"
    sed -i '' "s/v[0-9]\{1,\}\.[0-9]\{1,\}\.[0-9]\{1,\}/v$version/g" "$LANDING_PAGE"
    sed -i '' "s/v[0-9]\{1,\}\.[0-9]\{1,\}\.[0-9]\{1,\}/v$version/g" "$GETTING_STARTED"
    sed -i '' "s/v[0-9]\{1,\}\.[0-9]\{1,\}\.[0-9]\{1,\}/v$version/g" "$SKILL_FILE"
  else
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$MANIFEST_FILE"
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$MARKETPLACE_FILE"
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$version/g" "$LANDING_PAGE"
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$version/g" "$GETTING_STARTED"
    sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$version/g" "$SKILL_FILE"
  fi

  log_success "Version updated to $version"

  # Commit
  log_info "Creating commit"
  git add "$MANIFEST_FILE" "$MARKETPLACE_FILE" "$LANDING_PAGE" "$GETTING_STARTED" "$SKILL_FILE"
  git commit -m "Release v$version"
  log_success "Commit created"

  # Push to main
  log_info "Pushing to main"
  git push origin main
  log_success "Pushed to main"

  # Create tag
  log_info "Creating git tag v$version"
  git tag -a "v$version" -m "Release v$version"
  log_success "Tag created"

  # Push tag
  log_info "Pushing tag to GitHub"
  git push origin "v$version"
  log_success "Tag pushed to GitHub"

  # Summary
  echo ""
  log_success "Release v$version complete!"
  echo ""
  echo "Release page: https://github.com/specgantry/specgantry.github.io/releases/tag/v$version"
  echo "Website: https://specgantry.github.io"
  echo "Install: claude plugin marketplace add https://github.com/specgantry/specgantry.github.io && claude plugin install spec-gantry"
}

# Main
main() {
  case "$1" in
    --help)
      show_help
      exit 0
      ;;
    --current)
      local current=$(get_current_version)
      echo "Current version: $current"
      exit 0
      ;;
    v*)
      # Explicit version provided
      local version="${1#v}"
      validate_version "$version"
      release "$version"
      ;;
    "")
      # Auto-increment
      local current=$(get_current_version)
      log_info "Current version: $current"

      local next=$(increment_version "$current")
      log_info "Next version: $next"

      release "$next"
      ;;
    *)
      log_error "Unknown option: $1. Use --help for usage."
      ;;
  esac
}

main "$@"
