#!/usr/bin/env bash
# cleanup-branches.sh — List and optionally delete stale merged branches
#
# Usage:
#   scripts/cleanup-branches.sh              # List stale branches (dry run)
#   scripts/cleanup-branches.sh --delete     # Delete stale branches
#   scripts/cleanup-branches.sh --days 14    # Custom staleness threshold (default: 7)
#
# A branch is "stale" if it has been merged into main and the merge is older
# than the threshold. Never deletes main, develop, or release branches.

set -euo pipefail

DELETE=false
DAYS=7

while [[ $# -gt 0 ]]; do
  case "$1" in
    --delete) DELETE=true; shift ;;
    --days)   DAYS="$2"; shift 2 ;;
    *)        echo "Unknown option: $1"; exit 1 ;;
  esac
done

PROTECTED_PATTERN="^(main|master|develop|release)"

echo "🔍 Scanning for branches merged into main (stale > ${DAYS} days)..."
echo ""

# Fetch latest remote info
git fetch --prune origin 2>/dev/null || true

THRESHOLD_DATE=$(date -d "${DAYS} days ago" +%s 2>/dev/null || date -v-${DAYS}d +%s)

stale_count=0
kept_count=0

# Check local merged branches
for branch in $(git branch --merged main --format='%(refname:short)' 2>/dev/null); do
  # Skip protected branches
  if [[ "$branch" =~ $PROTECTED_PATTERN ]]; then
    continue
  fi

  # Get last commit date
  last_commit=$(git log -1 --format=%ct "$branch" 2>/dev/null || echo "0")

  if [ "$last_commit" -lt "$THRESHOLD_DATE" ]; then
    stale_count=$((stale_count + 1))
    age_days=$(( ($(date +%s) - last_commit) / 86400 ))
    last_msg=$(git log -1 --format='%s' "$branch" 2>/dev/null || echo "(unknown)")

    if [ "$DELETE" = true ]; then
      echo "  🗑️  Deleting: $branch (${age_days}d old) — $last_msg"
      git branch -d "$branch" 2>/dev/null || echo "    ⚠️  Could not delete $branch (may not be fully merged)"
    else
      echo "  📌 Stale: $branch (${age_days}d old) — $last_msg"
    fi
  else
    kept_count=$((kept_count + 1))
  fi
done

# Check remote merged branches
echo ""
echo "Remote branches merged into origin/main:"

for branch in $(git branch -r --merged origin/main --format='%(refname:short)' 2>/dev/null); do
  # Skip origin/main, origin/HEAD, protected
  short="${branch#origin/}"
  if [[ "$short" =~ $PROTECTED_PATTERN ]] || [ "$short" = "HEAD" ]; then
    continue
  fi

  last_commit=$(git log -1 --format=%ct "$branch" 2>/dev/null || echo "0")

  if [ "$last_commit" -lt "$THRESHOLD_DATE" ]; then
    stale_count=$((stale_count + 1))
    age_days=$(( ($(date +%s) - last_commit) / 86400 ))

    if [ "$DELETE" = true ]; then
      echo "  🗑️  Deleting remote: $short (${age_days}d old)"
      git push origin --delete "$short" 2>/dev/null || echo "    ⚠️  Could not delete origin/$short"
    else
      echo "  📌 Stale remote: $short (${age_days}d old)"
    fi
  fi
done

echo ""
echo "Summary: $stale_count stale branches found, $kept_count recent branches kept"

if [ "$DELETE" = false ] && [ "$stale_count" -gt 0 ]; then
  echo ""
  echo "Run with --delete to remove stale branches:"
  echo "  scripts/cleanup-branches.sh --delete"
fi
