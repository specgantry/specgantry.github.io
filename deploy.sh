#!/bin/bash

##############################################################################
# SpecGantry Build & Deploy Script
#
# Builds the plugin package and creates a GitHub release with a single command.
#
# Usage:
#   ./deploy.sh --help              Show this help message
#   ./deploy.sh --build-only        Build plugin package without releasing
#   ./deploy.sh vX.Y.Z              Build, tag, and release version X.Y.Z
#
# Examples:
#   ./deploy.sh --help
#   ./deploy.sh --build-only
#   ./deploy.sh v1.0.0
#
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Root directory
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
show_help() {
  cat << 'EOF'
SpecGantry Build & Deploy Script

Builds the plugin package and creates a GitHub release with a single command.

USAGE:
  ./deploy.sh --help              Show this help message
  ./deploy.sh --build-only        Build plugin package without releasing
  ./deploy.sh vX.Y.Z              Build, tag, and release version X.Y.Z

EXAMPLES:
  ./deploy.sh --help
  ./deploy.sh --build-only
  ./deploy.sh v1.0.0

WORKFLOW:

  1. Update version in 3 files (if releasing):
     - package.json
     - .claude-plugin/plugin.json
     - marketplace.json

  2. Commit your changes:
     git commit -m "Release v1.0.0"

  3. Run deploy script:
     ./deploy.sh v1.0.0

  4. GitHub Actions automatically:
     - Creates spec-gantry.zip package
     - Publishes GitHub Release
     - Makes it available for installation

OPTIONS:
  --help           Show this help message
  --build-only     Create package without creating release (for testing)
  vX.Y.Z           Create release with the specified version (e.g., v1.0.0)

REQUIREMENTS:
  - Git repository on main branch
  - No uncommitted changes
  - jq (optional, for JSON validation)
  - GitHub CLI (gh) for release creation (automatic)

For more information, visit: https://github.com/specgantry/specgantry.github.io
EOF
}

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

validate_plugin() {
  log_info "Validating plugin structure..."

  local required_files=(
    ".claude-plugin/plugin.json"
    "marketplace.json"
    "index.ts"
    ".claude-plugin/assets/icon.png"
  )

  local required_dirs=(
    "skills"
    "agents"
    "docs"
  )

  for file in "${required_files[@]}"; do
    if [ ! -f "$ROOT/$file" ]; then
      log_error "Missing required file: $file"
    fi
  done

  for dir in "${required_dirs[@]}"; do
    if [ ! -d "$ROOT/$dir" ]; then
      log_error "Missing required directory: $dir"
    fi
  done

  # Validate JSON files
  if ! command -v jq &> /dev/null; then
    log_warning "jq not installed, skipping JSON validation"
  else
    jq . "$ROOT/.claude-plugin/plugin.json" > /dev/null || log_error "Invalid plugin.json"
    jq . "$ROOT/marketplace.json" > /dev/null || log_error "Invalid marketplace.json"
  fi

  log_success "Plugin structure is valid"
}

build_package() {
  log_info "Creating plugin package..."

  cd "$ROOT"

  # Remove old package if it exists
  rm -f spec-gantry.zip

  # Create the package
  zip -r spec-gantry.zip . \
    -x '.git/*' \
    '.gitignore' \
    'node_modules/*' \
    '.DS_Store' \
    '*.log' \
    '.env*' \
    '.github/*' \
    'deploy.sh' \
    'README.md' \
    'CONTRIBUTING.md' \
    'SECURITY.md' \
    'LICENSE' \
    'NOTICE' \
    '.claude/*' \
    'docs/*' \
    '.pluginignore' > /dev/null 2>&1

  local size=$(du -h spec-gantry.zip | cut -f1)
  log_success "Package created: spec-gantry.zip ($size)"
}

release() {
  local version=$1

  # Validate version format
  if ! [[ $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Invalid version format. Use: v1.0.0"
  fi

  log_info "Preparing release: $version"

  # Check if on main branch
  local branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$branch" != "main" ]; then
    log_error "Must be on 'main' branch. Currently on: $branch"
  fi

  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    log_error "Uncommitted changes detected. Commit or stash them first."
  fi

  # Check if tag already exists
  if git rev-parse "$version" &> /dev/null; then
    log_error "Tag $version already exists"
  fi

  log_info "Creating git tag: $version"
  git tag -a "$version" -m "Release $version"

  log_success "Tag created: $version"
  log_info "Pushing tag to GitHub..."
  git push origin "$version"

  log_success "Tag pushed to GitHub"
  log_warning "Next step: GitHub Actions will automatically create the release"
  log_info "Monitor progress at: https://github.com/specgantry/specgantry.github.io/actions"
  log_info "Release will be available at: https://github.com/specgantry/specgantry.github.io/releases/tag/$version"
}

# Main script
main() {
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi

  case "$1" in
    --help)
      show_help
      exit 0
      ;;
    --build-only)
      validate_plugin
      build_package
      log_success "Build complete"
      log_info "Package: $ROOT/spec-gantry.zip"
      exit 0
      ;;
    v*)
      validate_plugin
      build_package
      release "$1"
      exit 0
      ;;
    *)
      log_error "Unknown option: $1. Use --help for usage information."
      ;;
  esac
}

main "$@"
