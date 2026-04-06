#!/usr/bin/env bash
# check-agent-boundaries.sh — CI check that PR branches only touch files within their agent's scope
#
# Usage: scripts/check-agent-boundaries.sh <base-branch>
#   e.g.: scripts/check-agent-boundaries.sh origin/main
#
# Detects agent role from the branch name pattern:
#   feature/issue-XX-backend-*  → backend-dev
#   feature/issue-XX-frontend-* → frontend-dev
#   fix/issue-XX-backend-*      → backend-dev
#   etc.
#
# If no agent role is detected (e.g., branch by a human or tech-lead), the check passes.

set -euo pipefail

BASE_BRANCH="${1:-origin/main}"

# Detect role from branch name
BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)

detect_role() {
  case "$BRANCH" in
    *backend*)  echo "backend-dev" ;;
    *frontend*) echo "frontend-dev" ;;
    *infra*|*devops*|*ci*) echo "devops" ;;
    *qa*|*test*) echo "qa-engineer" ;;
    *)          echo "" ;;
  esac
}

ROLE=$(detect_role)

if [ -z "$ROLE" ]; then
  echo "✅ No agent role detected from branch name '$BRANCH' — skipping boundary check"
  exit 0
fi

echo "🔍 Detected agent role: $ROLE (branch: $BRANCH)"

# Get changed files
CHANGED_FILES=$(git diff --name-only "$BASE_BRANCH"...HEAD 2>/dev/null || git diff --name-only "$BASE_BRANCH" HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No files changed"
  exit 0
fi

# Define allowed paths per role
violations=""

check_file() {
  local file="$1"
  local allowed=false

  case "$ROLE" in
    backend-dev)
      case "$file" in
        backend/*|deploy.sh|contracts/*|docs/api/*|docs/architecture/*) allowed=true ;;
        backend/.env*) allowed=true ;;
      esac
      ;;
    frontend-dev)
      case "$file" in
        MyRecipeApp/*|graphics/*|store_listing/*|contracts/*|docs/design/*|docs/guides/*) allowed=true ;;
      esac
      ;;
    devops)
      case "$file" in
        .github/*|scripts/*|deploy.sh|docker*|Dockerfile*|*.yml|*.yaml) allowed=true ;;
        backend/package.json|MyRecipeApp/package.json) allowed=true ;; # dependency updates
      esac
      ;;
    qa-engineer)
      case "$file" in
        backend/tests/*|MyRecipeApp/__tests__/*|MyRecipeApp/jest.setup.js|backend/tests/setup.js) allowed=true ;;
        docs/testing/*) allowed=true ;;
      esac
      ;;
  esac

  if [ "$allowed" = false ]; then
    violations="${violations}\n  ❌ ${file}"
  fi
}

while IFS= read -r file; do
  check_file "$file"
done <<< "$CHANGED_FILES"

if [ -n "$violations" ]; then
  echo ""
  echo "⚠️  Agent boundary violations detected for role '$ROLE':"
  echo -e "$violations"
  echo ""
  echo "These files are outside the allowed scope for $ROLE."
  echo "If this is intentional, a tech-lead must approve the PR."
  echo ""
  # Exit with warning (non-zero) — can be set to failure in CI
  exit 1
else
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l)
  echo "✅ All $FILE_COUNT changed files are within $ROLE boundaries"
  exit 0
fi
