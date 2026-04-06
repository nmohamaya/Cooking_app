#!/usr/bin/env bash
# parse-session-metrics.sh — Extract structured metrics from agent session logs
#
# Usage:
#   scripts/parse-session-metrics.sh                          # All sessions
#   scripts/parse-session-metrics.sh tasks/sessions/FILE.log  # Specific log
#   scripts/parse-session-metrics.sh --summary                # Aggregate summary
#
# Extracts: files changed, tests run, errors, duration, role, model

set -euo pipefail

SESSIONS_DIR="tasks/sessions"
SUMMARY_MODE=false
TARGET_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --summary) SUMMARY_MODE=true; shift ;;
    *)         TARGET_FILE="$1"; shift ;;
  esac
done

# Parse a single session log
parse_session() {
  local file="$1"
  local filename
  filename=$(basename "$file")

  # Extract header fields
  local role
  role=$(grep -oP 'Role:\s*\K\S+' "$file" 2>/dev/null || echo "unknown")
  local model
  model=$(grep -oP 'Model:\s*\K\S+' "$file" 2>/dev/null || echo "unknown")
  local started
  started=$(grep -oP 'Started:\s*\K.+' "$file" 2>/dev/null || echo "unknown")
  local ended
  ended=$(grep -oP 'Ended:\s*\K.+' "$file" 2>/dev/null || echo "unknown")

  # Count files changed (look for Edit/Write tool mentions or git diff output)
  local files_changed
  files_changed=$(grep -cE '(Edit|Write|Created|Modified|Updated)\s+(file|to)' "$file" 2>/dev/null || echo "0")

  # Count test runs
  local test_runs
  test_runs=$(grep -cE '(npm test|npx jest|Tests:)' "$file" 2>/dev/null || echo "0")

  # Count errors
  local errors
  errors=$(grep -ciE '(error|failed|FAIL|❌)' "$file" 2>/dev/null || echo "0")

  # Count tool calls
  local tool_calls
  tool_calls=$(grep -cE '(Read|Edit|Write|Bash|Grep|Glob)' "$file" 2>/dev/null || echo "0")

  # Estimate duration from timestamps
  local duration="unknown"
  if [ "$started" != "unknown" ] && [ "$ended" != "unknown" ]; then
    local start_epoch end_epoch
    start_epoch=$(date -d "$started" +%s 2>/dev/null || echo "0")
    end_epoch=$(date -d "$ended" +%s 2>/dev/null || echo "0")
    if [ "$start_epoch" != "0" ] && [ "$end_epoch" != "0" ]; then
      local diff=$((end_epoch - start_epoch))
      local mins=$((diff / 60))
      local secs=$((diff % 60))
      duration="${mins}m ${secs}s"
    fi
  fi

  # Get file size as proxy for session length
  local file_size
  file_size=$(wc -l < "$file" 2>/dev/null || echo "0")

  echo "┌──────────────────────────────────────────────"
  echo "│ Session: $filename"
  echo "│ Role: $role | Model: $model"
  echo "│ Started: $started"
  echo "│ Duration: $duration | Lines: $file_size"
  echo "│ Files changed: $files_changed | Test runs: $test_runs"
  echo "│ Errors: $errors | Tool calls: $tool_calls"
  echo "└──────────────────────────────────────────────"
}

# Aggregate summary across all sessions
aggregate_summary() {
  local total_sessions=0
  local total_files=0
  local total_tests=0
  local total_errors=0
  local total_tools=0
  local roles=""

  for file in "$SESSIONS_DIR"/*.log; do
    [ -f "$file" ] || continue
    total_sessions=$((total_sessions + 1))

    local fc tc ec tl role
    fc=$(grep -cE '(Edit|Write|Created|Modified|Updated)\s+(file|to)' "$file" 2>/dev/null || echo "0")
    tc=$(grep -cE '(npm test|npx jest|Tests:)' "$file" 2>/dev/null || echo "0")
    ec=$(grep -ciE '(error|failed|FAIL|❌)' "$file" 2>/dev/null || echo "0")
    tl=$(grep -cE '(Read|Edit|Write|Bash|Grep|Glob)' "$file" 2>/dev/null || echo "0")
    role=$(grep -oP 'Role:\s*\K\S+' "$file" 2>/dev/null || echo "unknown")

    total_files=$((total_files + fc))
    total_tests=$((total_tests + tc))
    total_errors=$((total_errors + ec))
    total_tools=$((total_tools + tl))
    roles="$roles $role"
  done

  echo "📊 Session Metrics Summary"
  echo "══════════════════════════════════════"
  echo "Total sessions:    $total_sessions"
  echo "Total file edits:  $total_files"
  echo "Total test runs:   $total_tests"
  echo "Total errors:      $total_errors"
  echo "Total tool calls:  $total_tools"
  echo ""

  if [ $total_sessions -gt 0 ]; then
    echo "Averages per session:"
    echo "  File edits:  $((total_files / total_sessions))"
    echo "  Test runs:   $((total_tests / total_sessions))"
    echo "  Errors:      $((total_errors / total_sessions))"
    echo "  Tool calls:  $((total_tools / total_sessions))"
  fi

  echo ""
  echo "Sessions by role:"
  echo "$roles" | tr ' ' '\n' | sort | uniq -c | sort -rn | while read -r count role; do
    [ -z "$role" ] && continue
    echo "  $role: $count"
  done
}

# Main
if [ -n "$TARGET_FILE" ]; then
  if [ ! -f "$TARGET_FILE" ]; then
    echo "File not found: $TARGET_FILE"
    exit 1
  fi
  parse_session "$TARGET_FILE"
elif [ "$SUMMARY_MODE" = true ]; then
  aggregate_summary
else
  # Parse all session logs
  if [ ! -d "$SESSIONS_DIR" ]; then
    echo "No sessions directory found at $SESSIONS_DIR"
    exit 0
  fi

  log_count=$(find "$SESSIONS_DIR" -name "*.log" 2>/dev/null | wc -l)
  if [ "$log_count" -eq 0 ]; then
    echo "No session logs found in $SESSIONS_DIR"
    echo "Run scripts/log-session.sh to capture agent sessions."
    exit 0
  fi

  for file in "$SESSIONS_DIR"/*.log; do
    [ -f "$file" ] || continue
    parse_session "$file"
    echo ""
  done
fi
