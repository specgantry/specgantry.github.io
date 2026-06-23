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
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Plugin manifest files
MANIFEST_FILE=".claude-plugin/plugin.json"
MARKETPLACE_FILE=".claude-plugin/marketplace.json"
LANDING_PAGE="docs/_layouts/landing.html"
GETTING_STARTED="docs/docs/getting-started/index.md"
SKILL_FILE="skills/spec-gantry/SKILL.md"
SKILLS_GUIDE="docs/docs/skills/index.md"

# Logging helpers
STEP=0

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║         SpecGantry Release Script                ║${NC}"
  echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  ((STEP++))
  echo -e "\n${BOLD}${CYAN}── Step $STEP: $1${NC}"
}

log_info() {
  echo -e "   ${DIM}▸${NC} $1"
}

log_detail() {
  echo -e "   ${DIM}  $1${NC}"
}

log_success() {
  echo -e "   ${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "   ${YELLOW}⚠${NC}  $1"
}

log_error() {
  echo -e "\n   ${RED}✗  Error: $1${NC}\n"
  exit 1
}

print_summary() {
  local version=$1
  echo ""
  echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${GREEN}║   Release v${version} complete!${NC}"
  echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "   ${DIM}Release:${NC}  https://github.com/specgantry/specgantry.github.io/releases/tag/v${version}"
  echo -e "   ${DIM}Website:${NC}  https://specgantry.github.io"
  echo -e "   ${DIM}Install:${NC}  claude plugin install spec-gantry"
  echo ""
}

show_help() {
  cat << 'EOF'
SpecGantry Release Script

Auto-increments version and creates a release.

USAGE:
  ./release.sh              Auto-increment and release
  ./release.sh --help       Show this help message
  ./release.sh --current    Show current version
  ./release.sh --dry-run    Build site + index locally and serve at http://localhost:4001
  ./release.sh vX.Y.Z       Release specific version (e.g., v1.0.0)

AUTO-INCREMENT PATTERN:
  0.0.1 → 0.0.2 → ... → 0.0.9
  0.0.9 → 0.1.0
  0.1.9 → 0.2.0
  0.9.9 → 1.0.0
  1.0.9 → 1.1.0
  etc.

PROCESS:
  1. Validates branch and pre-conditions
  2. Updates version in all manifest and doc files
  3. Verifies version sync across manifests
  4. Builds Jekyll site locally (requires Ruby + Bundler)
  5. Builds Pagefind search index (requires Node.js + npx)
  6. Deploys built site to gh-pages branch
  7. Commits all changes to main
  8. Tags release in git
  9. Pushes commits and tags to GitHub

PREREQUISITES:
  Ruby + Bundler:  gem install bundler && cd docs && bundle install
  Node.js + npx:  comes with Node.js (https://nodejs.org)

For more info, visit: https://github.com/specgantry/specgantry.github.io
EOF
}

get_current_version() {
  grep -o '"version": "[^"]*"' "$MANIFEST_FILE" | cut -d'"' -f4
}

increment_version() {
  local version=$1
  local major minor patch

  major=$(echo "$version" | cut -d. -f1)
  minor=$(echo "$version" | cut -d. -f2)
  patch=$(echo "$version" | cut -d. -f3)

  ((patch++))

  if [ "$patch" -eq 10 ]; then
    patch=0
    ((minor++))
  fi

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

check_build_deps() {
  if ! command -v bundle &> /dev/null; then
    log_error "Bundler not found. Install with: gem install bundler"
  fi
  log_success "Bundler found: $(bundle --version)"

  if ! command -v npx &> /dev/null; then
    log_error "npx not found. Install Node.js from https://nodejs.org"
  fi
  log_success "npx found: $(npx --version)"
}

build_site() {
  print_step "Installing Ruby gems"
  (cd docs && bundle install --quiet)
  log_success "Gems ready"

  print_step "Building Jekyll site"
  (cd docs && JEKYLL_ENV=production bundle exec jekyll build --destination _site)
  log_success "Site built → docs/_site/"

  print_step "Building Pagefind search index"
  npx pagefind --site docs/_site --output-path docs/_site/pagefind
  log_success "Search index built → docs/_site/pagefind/"
}

deploy_to_gh_pages() {
  local version=$1
  # Fixed path inside .git — never cleaned by the OS, fully owned by git.
  # Using a stable path means any leftover from a previous interrupted run
  # is always found and cleaned up reliably.
  local worktree_path
  worktree_path="$(git rev-parse --git-dir)/gh-pages-deploy"

  print_step "Deploying to gh-pages branch"

  # Always clean up any prior worktree at this path before starting —
  # handles both interrupted runs (directory still exists) and stale
  # registrations (directory already gone). Never fails even if absent.
  if git worktree list --porcelain | grep -q "^worktree $worktree_path$"; then
    git worktree remove --force "$worktree_path" 2>/dev/null || true
  fi
  rm -rf "$worktree_path"
  git worktree prune

  # Check if gh-pages branch exists on remote
  if git ls-remote --heads origin gh-pages | grep -q gh-pages; then
    git worktree add "$worktree_path" gh-pages
  else
    log_info "gh-pages branch does not exist — creating orphan branch"
    git worktree add --orphan -b gh-pages "$worktree_path"
  fi

  rsync -a --delete --exclude='.git' docs/_site/ "$worktree_path/"

  (
    cd "$worktree_path"
    git add -A
    if git diff --cached --quiet; then
      log_warning "No changes in built site — skipping gh-pages commit"
    else
      git commit -m "Deploy v$version"
      git push --force origin gh-pages
      log_success "Deployed to gh-pages"
    fi
  )

  git worktree remove --force "$worktree_path"
  rm -rf "$worktree_path"
}

verify_version_sync() {
  local expected=$1
  local all_ok=true

  print_step "Verifying version sync"

  local files=(
    "$MANIFEST_FILE"
    "$MARKETPLACE_FILE"
  )

  for file in "${files[@]}"; do
    local found
    found=$(grep -o '"version": "[^"]*"' "$file" | head -1 | cut -d'"' -f4)
    if [ "$found" = "$expected" ]; then
      log_success "$file → $found"
    else
      log_warning "$file → $found (expected $expected)"
      all_ok=false
    fi
  done

  if [ "$all_ok" = false ]; then
    log_error "Version mismatch detected after update. Aborting release."
  fi
}

dry_run() {
  print_header

  echo -e "   ${BOLD}${YELLOW}Dry Run — no git operations will be performed${NC}"
  echo -e "   ${DIM}$(date '+%Y-%m-%d %H:%M:%S')${NC}"

  check_build_deps
  build_site

  local page_count
  page_count=$(find docs/_site -name "*.html" | wc -l | tr -d ' ')
  local index_size
  index_size=$(du -sh docs/_site/pagefind 2>/dev/null | cut -f1 || echo "?")

  echo ""
  echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${GREEN}║   Build complete                                 ║${NC}"
  echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "   ${DIM}Pages built:${NC}    $page_count HTML files"
  echo -e "   ${DIM}Search index:${NC}   $index_size  (docs/_site/pagefind/)"
  echo -e "   ${DIM}Server:${NC}         http://localhost:4001"
  echo ""
  echo -e "   ${BOLD}What to check:${NC}"
  echo -e "   ${DIM}1.${NC} Search bar appears top-right on every page"
  echo -e "   ${DIM}2.${NC} Type a query — results should appear instantly"
  echo -e "   ${DIM}3.${NC} Click a result — it should navigate to the correct page"
  echo -e "   ${DIM}4.${NC} Works on both the landing page (dark nav) and docs pages (light nav)"
  echo ""
  echo -e "   ${DIM}Press Ctrl+C to stop the server when done.${NC}"
  echo ""

  cd docs/_site && python3 -m http.server 4001
}

release() {
  local version=$1

  print_header

  echo -e "   ${BOLD}Releasing:${NC}  v${version}"
  echo -e "   ${DIM}$(date '+%Y-%m-%d %H:%M:%S')${NC}"

  # Step 1: Pre-flight checks
  print_step "Pre-flight checks"

  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$branch" != "main" ]; then
    log_error "Must be on 'main' branch. Currently on: $branch"
  fi
  log_success "Branch: $branch"

  if git rev-parse "v$version" &> /dev/null; then
    log_error "Tag v$version already exists"
  fi
  log_success "Tag v$version is available"

  if ! git diff-index --quiet HEAD --; then
    log_warning "Uncommitted changes detected — will be included in release commit"
    git diff-index --name-only HEAD -- | while read -r f; do
      log_detail "modified: $f"
    done
  else
    log_success "Working tree clean"
  fi

  check_build_deps

  # Step 2: Update versions
  print_step "Updating version to $version"

  local sed_files=(
    "$MANIFEST_FILE:json"
    "$MARKETPLACE_FILE:json"
    "$LANDING_PAGE:semver"
    "$GETTING_STARTED:semver"
    "$SKILL_FILE:semver"
    "$SKILLS_GUIDE:semver"
  )

  for entry in "${sed_files[@]}"; do
    local file="${entry%%:*}"
    local mode="${entry##*:}"

    if [[ "$OSTYPE" == "darwin"* ]]; then
      if [ "$mode" = "json" ]; then
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$file"
      else
        sed -i '' "s/v[0-9]\{1,\}\.[0-9]\{1,\}\.[0-9]\{1,\}/v$version/g" "$file"
      fi
    else
      if [ "$mode" = "json" ]; then
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$file"
      else
        sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$version/g" "$file"
      fi
    fi
    log_success "Updated $file"
  done

  # Step 3: Verify sync
  verify_version_sync "$version"

  # Step 4: Build site and search index
  build_site

  # Step 5: Deploy to gh-pages
  deploy_to_gh_pages "$version"

  # Step 6: Commit
  print_step "Creating release commit"
  git add -A .
  local changed_files
  changed_files=$(git diff --cached --name-only)
  echo "$changed_files" | while read -r f; do
    log_detail "staged: $f"
  done
  git commit -m "Release v$version"
  log_success "Commit created: $(git rev-parse --short HEAD)"

  # Step 7: Push to main
  print_step "Pushing to main"
  git push origin main
  log_success "Pushed to origin/main"

  # Step 8: Tag and push
  print_step "Tagging and pushing v$version"
  git tag -a "v$version" -m "Release v$version"
  log_success "Tag created: v$version"
  git push origin "v$version"
  log_success "Tag pushed to GitHub"

  print_summary "$version"
}

# Main
main() {
  case "$1" in
    --help)
      show_help
      exit 0
      ;;
    --current)
      local current
      current=$(get_current_version)
      echo "Current version: $current"
      exit 0
      ;;
    --dry-run)
      dry_run
      ;;
    v*)
      local version="${1#v}"
      validate_version "$version"
      release "$version"
      ;;
    "")
      local current
      current=$(get_current_version)
      local next
      next=$(increment_version "$current")
      release "$next"
      ;;
    *)
      log_error "Unknown option: $1. Use --help for usage."
      ;;
  esac
}

main "$@"
