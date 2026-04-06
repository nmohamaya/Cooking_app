#!/usr/bin/env bash
#
# Agent metrics — shows which Claude models/roles produced commits and PRs.
#
# Usage:
#   ./scripts/agent-stats.sh              # Stats for last 30 days
#   ./scripts/agent-stats.sh --all        # All-time stats
#   ./scripts/agent-stats.sh --since 2w   # Last 2 weeks
#
# Parses "Co-Authored-By: Claude <model>" from commit messages to track
# which model was used. Also shows PR counts per author.

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SINCE="30 days ago"
if [ "${1:-}" = "--all" ]; then
  SINCE=""
elif [ "${1:-}" = "--since" ] && [ -n "${2:-}" ]; then
  SINCE="$2"
fi

SINCE_FLAG=""
if [ -n "$SINCE" ]; then
  SINCE_FLAG="--since=\"$SINCE\""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Agent Metrics${NC}"
if [ -n "$SINCE" ]; then
  echo -e "  Period: last $SINCE"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${GREEN}Commits by Claude Model:${NC}"
if [ -n "$SINCE_FLAG" ]; then
  git log $SINCE_FLAG --format="%b" 2>/dev/null | grep -oP "Co-Authored-By: Claude \K[^<]+" | sort | uniq -c | sort -rn || echo "  (none found)"
else
  git log --format="%b" 2>/dev/null | grep -oP "Co-Authored-By: Claude \K[^<]+" | sort | uniq -c | sort -rn || echo "  (none found)"
fi

echo ""
echo -e "${GREEN}Commits by Type:${NC}"
if [ -n "$SINCE_FLAG" ]; then
  git log $SINCE_FLAG --format="%s" 2>/dev/null | grep -oP "^\w+" | sort | uniq -c | sort -rn || echo "  (none found)"
else
  git log --format="%s" 2>/dev/null | grep -oP "^\w+" | sort | uniq -c | sort -rn || echo "  (none found)"
fi

echo ""
echo -e "${GREEN}Total Commits (period):${NC}"
if [ -n "$SINCE_FLAG" ]; then
  git log $SINCE_FLAG --oneline 2>/dev/null | wc -l
else
  git log --oneline 2>/dev/null | wc -l
fi

echo ""
echo -e "${GREEN}Commits by Agent-Authored vs Human:${NC}"
if [ -n "$SINCE_FLAG" ]; then
  TOTAL=$(git log $SINCE_FLAG --oneline 2>/dev/null | wc -l)
  AGENT=$(git log $SINCE_FLAG --format="%b" 2>/dev/null | grep -c "Co-Authored-By: Claude" || true)
else
  TOTAL=$(git log --oneline 2>/dev/null | wc -l)
  AGENT=$(git log --format="%b" 2>/dev/null | grep -c "Co-Authored-By: Claude" || true)
fi
HUMAN=$((TOTAL - AGENT))
echo "  Agent-authored: $AGENT"
echo "  Human-only:     $HUMAN"
echo "  Total:          $TOTAL"
if [ "$TOTAL" -gt 0 ]; then
  PCT=$((AGENT * 100 / TOTAL))
  echo "  Agent ratio:    ${PCT}%"
fi

echo ""
echo -e "${GREEN}Recent Agent Commits (last 10):${NC}"
if [ -n "$SINCE_FLAG" ]; then
  git log $SINCE_FLAG --format="%h %s" --grep="Co-Authored-By: Claude" 2>/dev/null | head -10 || echo "  (none)"
else
  git log --format="%h %s" --grep="Co-Authored-By: Claude" 2>/dev/null | head -10 || echo "  (none)"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
