#!/usr/bin/env bash
# run-session.sh — Full agent session orchestrator
#
# Starts a development session: runs pre-flight checks, launches the specified
# agent role, captures the session log, and generates reports at the end.
#
# Usage:
#   scripts/run-session.sh <role> "task description"
#   scripts/run-session.sh backend-dev "Implement issue #42"
#   scripts/run-session.sh --report-only              # Just show reports
#   scripts/run-session.sh --health                   # Run health check only
#
# Flow:
#   1. Pre-flight checks (git state, deps, active work conflicts)
#   2. Run health check baseline (quick)
#   3. Launch agent with session logging
#   4. On exit: run tests, generate session metrics, health diff, summary
#   5. Show dashboard report and prompt for approval on uncommitted changes

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

SCRIPTS_DIR="$REPO_ROOT/scripts"
SESSIONS_DIR="$REPO_ROOT/tasks/sessions"
HEALTH_DIR="$REPO_ROOT/tasks/health-reports"
REPORT_FILE=""
SESSION_LOG=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ───────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════${NC}"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${BLUE}── $1 ──${NC}"
}

print_ok() {
  echo -e "  ${GREEN}✅ $1${NC}"
}

print_warn() {
  echo -e "  ${YELLOW}⚠️  $1${NC}"
}

print_err() {
  echo -e "  ${RED}❌ $1${NC}"
}

ask_approval() {
  local prompt="$1"
  echo ""
  echo -e "${BOLD}${YELLOW}🔒 APPROVAL REQUIRED: $prompt${NC}"
  read -rp "   Proceed? [y/N] " answer
  case "$answer" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

mkdir -p "$SESSIONS_DIR" "$HEALTH_DIR"

# ───────────────────────────────────────────────
# Parse arguments
# ───────────────────────────────────────────────

ROLE=""
TASK=""
REPORT_ONLY=false
HEALTH_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report-only) REPORT_ONLY=true; shift ;;
    --health)      HEALTH_ONLY=true; shift ;;
    --help|-h)
      echo "Usage: scripts/run-session.sh <role> \"task description\""
      echo "       scripts/run-session.sh --report-only"
      echo "       scripts/run-session.sh --health"
      echo ""
      echo "Roles: tech-lead, backend-dev, frontend-dev, qa-engineer, devops, reviewer"
      exit 0
      ;;
    *)
      if [ -z "$ROLE" ]; then
        ROLE="$1"
      else
        TASK="$1"
      fi
      shift
      ;;
  esac
done

# ───────────────────────────────────────────────
# Report-only mode
# ───────────────────────────────────────────────

if [ "$REPORT_ONLY" = true ]; then
  print_header "Session Reports"
  generate_end_report
  exit 0
fi

# ───────────────────────────────────────────────
# Phase 1: Pre-flight checks
# ───────────────────────────────────────────────

run_preflight() {
  print_header "Pre-Flight Checks"

  # Git state
  local branch
  branch=$(git branch --show-current)
  echo "  Branch: $branch"

  local uncommitted
  uncommitted=$(git status --porcelain | wc -l)
  if [ "$uncommitted" -gt 0 ]; then
    print_warn "Uncommitted changes: $uncommitted files"
    git status --short | head -10 | sed 's/^/    /'
    if [ "$uncommitted" -gt 10 ]; then
      echo "    ... and $((uncommitted - 10)) more"
    fi
  else
    print_ok "Working tree clean"
  fi

  # Behind remote?
  git fetch origin main --quiet 2>/dev/null || true
  local behind
  behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
  if [ "$behind" -gt 0 ]; then
    print_warn "Branch is $behind commits behind origin/main"
  else
    print_ok "Up to date with origin/main"
  fi

  # Active work conflicts
  if [ -f "tasks/active-work.md" ]; then
    local active
    active=$(grep -c "in-progress\|🔄" tasks/active-work.md 2>/dev/null || echo "0")
    if [ "$active" -gt 0 ]; then
      print_warn "$active items in progress — check for conflicts"
      grep -E "in-progress|🔄" tasks/active-work.md 2>/dev/null | head -5 | sed 's/^/    /'
    else
      print_ok "No active work conflicts"
    fi
  fi

  # Dependencies
  print_section "Dependencies"
  if [ -d "backend/node_modules" ]; then
    print_ok "Backend node_modules present"
  else
    print_warn "Backend node_modules missing — run: cd backend && npm ci"
  fi
  if [ -d "MyRecipeApp/node_modules" ]; then
    print_ok "Frontend node_modules present"
  else
    print_warn "Frontend node_modules missing — run: cd MyRecipeApp && npm ci"
  fi
}

# ───────────────────────────────────────────────
# Phase 2: Quick health baseline
# ───────────────────────────────────────────────

run_health_baseline() {
  print_section "Health Baseline"

  # Backend tests
  local backend_result
  backend_result=$(cd backend && npm test 2>&1)
  local backend_tests
  backend_tests=$(echo "$backend_result" | grep -oP 'Tests:\s+\K\d+ passed' || echo "unknown")
  local backend_suites
  backend_suites=$(echo "$backend_result" | grep -oP 'Test Suites:\s+\K\d+ passed' || echo "unknown")

  if echo "$backend_result" | grep -q "Tests:.*passed"; then
    print_ok "Backend: $backend_suites suites, $backend_tests"
  else
    print_err "Backend tests failing"
  fi

  # Frontend tests (quick check)
  local frontend_result
  frontend_result=$(cd MyRecipeApp && npm test -- --passWithNoTests 2>&1)
  local frontend_tests
  frontend_tests=$(echo "$frontend_result" | grep -oP 'Tests:\s+\K\d+ passed' || echo "unknown")

  if echo "$frontend_result" | grep -q "Tests:.*passed"; then
    print_ok "Frontend: $frontend_tests"
  else
    print_warn "Frontend tests — check output"
  fi

  # Feature flags
  local enabled_flags
  enabled_flags=$(node -e "const f = require('./backend/config/features'); const a = f.getAll(); const on = Object.values(a).filter(v => v.enabled).length; console.log(on + '/' + Object.keys(a).length)" 2>/dev/null || echo "unknown")
  echo "  Feature flags: $enabled_flags enabled"

  # Save baseline timestamp
  echo "$(date -Iseconds)" > "$SESSIONS_DIR/.baseline-timestamp"
}

# ───────────────────────────────────────────────
# Phase 3: Launch agent
# ───────────────────────────────────────────────

launch_agent() {
  if [ -z "$ROLE" ]; then
    echo ""
    echo -e "${RED}Error: Role is required${NC}"
    echo "Usage: scripts/run-session.sh <role> \"task description\""
    exit 1
  fi

  local agent_file="$REPO_ROOT/.claude/agents/$ROLE.md"
  if [ ! -f "$agent_file" ]; then
    echo ""
    echo -e "${RED}Error: No agent file found for role '$ROLE'${NC}"
    echo "Available: $(ls .claude/agents/ | sed 's/.md//' | tr '\n' ', ')"
    exit 1
  fi

  print_header "Launching Agent: $ROLE"
  echo "  Task: ${TASK:-interactive session}"
  echo "  Agent file: $agent_file"
  echo ""

  # Determine model
  local model="claude-opus-4-6"
  case "$ROLE" in
    tech-lead|backend-dev|reviewer) model="claude-opus-4-6" ;;
    frontend-dev|devops|qa-engineer|reviewer-quick) model="claude-sonnet-4-6" ;;
    health-check) model="claude-haiku-4-5-20251001" ;;
  esac
  echo "  Model: $model"

  # Session log file
  SESSION_LOG="$SESSIONS_DIR/${ROLE}-$(date +%Y%m%d-%H%M%S).log"

  # Prepare agent instructions
  local agent_instructions
  agent_instructions=$(cat "$agent_file")

  echo ""
  echo -e "${CYAN}Starting agent session... (Ctrl+C to end)${NC}"
  echo ""

  # Log session header
  {
    echo "═══════════════════════════════════════════"
    echo "Role: $ROLE"
    echo "Model: $model"
    echo "Task: ${TASK:-interactive}"
    echo "Started: $(date -Iseconds)"
    echo "Branch: $(git branch --show-current)"
    echo "═══════════════════════════════════════════"
    echo ""
  } > "$SESSION_LOG"

  # Set agent role for boundary hooks
  export CLAUDE_AGENT_ROLE="$ROLE"

  # Launch Claude with the agent instructions
  if [ -n "$TASK" ]; then
    claude --model "$model" --print "$agent_instructions" "$TASK" 2>&1 | tee -a "$SESSION_LOG"
  else
    claude --model "$model" --print "$agent_instructions" 2>&1 | tee -a "$SESSION_LOG"
  fi

  # Log session footer
  {
    echo ""
    echo "═══════════════════════════════════════════"
    echo "Ended: $(date -Iseconds)"
    echo "═══════════════════════════════════════════"
  } >> "$SESSION_LOG"
}

# ───────────────────────────────────────────────
# Phase 4: End-of-session report
# ───────────────────────────────────────────────

generate_end_report() {
  print_header "End-of-Session Report"
  REPORT_FILE="$SESSIONS_DIR/report-$(date +%Y%m%d-%H%M%S).txt"

  {
    echo "═══════════════════════════════════════════"
    echo "  SESSION REPORT — $(date '+%Y-%m-%d %H:%M')"
    echo "═══════════════════════════════════════════"
    echo ""
  } | tee "$REPORT_FILE"

  # --- Test Results ---
  print_section "Test Results"
  {
    echo "── Test Results ──"

    echo ""
    echo "Backend:"
    local be_result
    be_result=$(cd "$REPO_ROOT/backend" && npm test 2>&1 | tail -10)
    echo "$be_result" | grep -E "(Test Suites|Tests:)" | sed 's/^/  /'

    echo ""
    echo "Frontend:"
    local fe_result
    fe_result=$(cd "$REPO_ROOT/MyRecipeApp" && npm test -- --passWithNoTests 2>&1 | tail -10)
    echo "$fe_result" | grep -E "(Test Suites|Tests:)" | sed 's/^/  /'
    echo ""
  } | tee -a "$REPORT_FILE"

  # --- Git Changes ---
  print_section "Changes Made"
  {
    echo "── Changes Made ──"
    echo ""
    echo "Uncommitted files:"
    git status --short | sed 's/^/  /'
    echo ""
    local new_commits
    new_commits=$(git log --oneline origin/main..HEAD 2>/dev/null | head -10)
    if [ -n "$new_commits" ]; then
      echo "New commits (vs main):"
      echo "$new_commits" | sed 's/^/  /'
    fi
    echo ""
  } | tee -a "$REPORT_FILE"

  # --- Feature Flags ---
  print_section "Feature Flags"
  {
    echo "── Feature Flags ──"
    echo ""
    node -e "
      const f = require('./backend/config/features');
      const all = f.getAll();
      for (const [name, info] of Object.entries(all)) {
        const icon = info.enabled ? '🟢' : '⚪';
        const src = info.source === 'default' ? '' : ' (' + info.source + ')';
        console.log('  ' + icon + ' ' + name + src);
      }
    " 2>/dev/null || echo "  (could not read feature flags)"
    echo ""
  } | tee -a "$REPORT_FILE"

  # --- Session Metrics ---
  if [ -n "$SESSION_LOG" ] && [ -f "$SESSION_LOG" ]; then
    print_section "Session Metrics"
    {
      echo "── Session Metrics ──"
      echo ""
      bash "$SCRIPTS_DIR/parse-session-metrics.sh" "$SESSION_LOG" 2>/dev/null || echo "  (no metrics available)"
      echo ""
    } | tee -a "$REPORT_FILE"
  fi

  # --- Security Quick Check ---
  print_section "Security"
  {
    echo "── Security ──"
    echo ""
    local be_audit
    be_audit=$(cd "$REPO_ROOT/backend" && npm audit --omit=dev 2>&1 | tail -1)
    echo "  Backend: $be_audit"
    echo ""
  } | tee -a "$REPORT_FILE"

  # --- Uncommitted changes approval ---
  local uncommitted
  uncommitted=$(git status --porcelain | wc -l)
  if [ "$uncommitted" -gt 0 ]; then
    print_section "Pending Changes"
    echo ""
    echo -e "${YELLOW}There are $uncommitted uncommitted files.${NC}"
    echo "You can review and commit them, or discard with git checkout."
    echo ""
    echo "Changed files:"
    git status --short | head -20 | sed 's/^/  /'
    if [ "$uncommitted" -gt 20 ]; then
      echo "  ... and $((uncommitted - 20)) more"
    fi
  fi

  echo ""
  echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}"
  echo ""
}

# ───────────────────────────────────────────────
# Main execution flow
# ───────────────────────────────────────────────

if [ "$HEALTH_ONLY" = true ]; then
  run_preflight
  run_health_baseline
  exit 0
fi

if [ "$REPORT_ONLY" = true ]; then
  generate_end_report
  exit 0
fi

# Full session flow
run_preflight

if ! ask_approval "Pre-flight checks complete. Continue with agent launch?"; then
  echo "Session cancelled."
  exit 0
fi

run_health_baseline

echo ""
echo -e "${CYAN}Health baseline captured. Launching agent...${NC}"
echo ""

# Launch agent (this blocks until agent exits)
launch_agent

# Generate end-of-session report
generate_end_report

echo ""
echo -e "${BOLD}${GREEN}Session complete!${NC}"
echo ""
