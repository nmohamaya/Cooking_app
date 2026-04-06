#!/usr/bin/env bash
#
# Log an agent session transcript.
#
# Called by start-agent.sh automatically. Captures the full session output
# to tasks/sessions/YYYY-MM-DD-HHmm-<role>.log
#
# Usage (called by start-agent.sh):
#   ./scripts/log-session.sh <role> <model> <task> -- <command...>
#
# Manual usage:
#   ./scripts/log-session.sh backend-dev claude-opus-4-6 "Fix issue #99" -- claude --model claude-opus-4-6 --print "..."

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SESSIONS_DIR="$PROJECT_ROOT/tasks/sessions"

ROLE="${1:-unknown}"
MODEL="${2:-unknown}"
TASK="${3:-no task}"
shift 3

# Skip the "--" separator
if [ "${1:-}" = "--" ]; then
  shift
fi

# Create sessions directory
mkdir -p "$SESSIONS_DIR"

# Generate log filename
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
LOG_FILE="$SESSIONS_DIR/${TIMESTAMP}-${ROLE}.log"

# Write session header
{
  echo "=========================================="
  echo "Agent Session Log"
  echo "=========================================="
  echo "Date:    $(date -Iseconds)"
  echo "Role:    $ROLE"
  echo "Model:   $MODEL"
  echo "Task:    $TASK"
  echo "Branch:  $(git branch --show-current 2>/dev/null || echo 'detached')"
  echo "Commit:  $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  echo "=========================================="
  echo ""
} > "$LOG_FILE"

echo "Session logging to: $LOG_FILE"
echo ""

# Run the command, tee output to both terminal and log file
"$@" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

# Write session footer
{
  echo ""
  echo "=========================================="
  echo "Session ended: $(date -Iseconds)"
  echo "Exit code: $EXIT_CODE"
  echo "Branch:    $(git branch --show-current 2>/dev/null || echo 'detached')"
  echo "Commit:    $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
  echo "=========================================="
} >> "$LOG_FILE"

# Add .gitignore for sessions directory (logs can be large)
if [ ! -f "$SESSIONS_DIR/.gitignore" ]; then
  echo "*.log" > "$SESSIONS_DIR/.gitignore"
fi

exit "$EXIT_CODE"
