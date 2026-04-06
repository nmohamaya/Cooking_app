#!/usr/bin/env bash
#
# Start a Claude Code agent with the correct role, model, and boundary enforcement.
#
# Usage:
#   ./scripts/start-agent.sh <role> "task description"
#   ./scripts/start-agent.sh <role> --dry-run "task description"
#   ./scripts/start-agent.sh --list
#
# Examples:
#   ./scripts/start-agent.sh backend-dev "Implement issue #205: add video frame analysis"
#   ./scripts/start-agent.sh reviewer "Review PR #202"
#   ./scripts/start-agent.sh frontend-dev --dry-run "Plan the meal plan redesign"
#   ./scripts/start-agent.sh --list
#
# The script:
#   1. Runs pre-flight checks (git state, active work conflicts)
#   2. Loads the agent role file from .claude/agents/<role>.md
#   3. Sets CLAUDE_AGENT_ROLE env var (used by boundary enforcement hooks)
#   4. Selects the correct model based on the role file header
#   5. Logs the session transcript (via log-session.sh wrapper if available)
#   6. In dry-run mode: agent plans but does not execute (read-only tools)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTS_DIR="$PROJECT_ROOT/.claude/agents"
ACTIVE_WORK="$PROJECT_ROOT/tasks/active-work.md"
SESSIONS_DIR="$PROJECT_ROOT/tasks/sessions"

# Model mapping (must match ## Model: header in agent files)
declare -A ROLE_MODELS=(
  [tech-lead]="claude-opus-4-6"
  [backend-dev]="claude-opus-4-6"
  [frontend-dev]="claude-sonnet-4-6"
  [reviewer]="claude-opus-4-6"
  [reviewer-quick]="claude-sonnet-4-6"
  [qa-engineer]="claude-sonnet-4-6"
  [devops]="claude-sonnet-4-6"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

usage() {
  echo -e "${BLUE}Usage:${NC}"
  echo "  $0 <role> [--dry-run] [--skip-preflight] \"task description\""
  echo "  $0 --list"
  echo ""
  echo -e "${BLUE}Available roles:${NC}"
  for role in "${!ROLE_MODELS[@]}"; do
    local model="${ROLE_MODELS[$role]}"
    printf "  %-18s %s\n" "$role" "$model"
  done | sort
  echo ""
  echo -e "${BLUE}Options:${NC}"
  echo "  --dry-run          Agent plans but does not write code (read-only mode)"
  echo "  --skip-preflight   Skip pre-flight checks (git pull, active work)"
  echo "  --list             Show available roles and exit"
}

list_roles() {
  echo -e "${BLUE}Available Agent Roles${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  printf "  %-18s %-22s %s\n" "ROLE" "MODEL" "FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  for role in "${!ROLE_MODELS[@]}"; do
    local model="${ROLE_MODELS[$role]}"
    local file=".claude/agents/${role}.md"
    if [ -f "$AGENTS_DIR/${role}.md" ]; then
      printf "  ${GREEN}%-18s${NC} %-22s %s\n" "$role" "$model" "$file"
    else
      printf "  ${RED}%-18s${NC} %-22s %s ${RED}(missing)${NC}\n" "$role" "$model" "$file"
    fi
  done | sort
}

# Pre-flight checks
preflight() {
  local role="$1"
  local has_warnings=false

  echo -e "${CYAN}Running pre-flight checks...${NC}"

  # 1. Check we're in a git repo
  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo -e "${RED}  [FAIL] Not inside a git repository${NC}"
    exit 1
  fi
  echo -e "${GREEN}  [OK]${NC} Git repository detected"

  # 2. Pull latest main (non-destructive)
  local current_branch
  current_branch=$(git branch --show-current 2>/dev/null || echo "detached")
  echo -e "${GREEN}  [OK]${NC} Current branch: $current_branch"

  if [ "$current_branch" = "main" ]; then
    echo -e "  ${CYAN}Pulling latest main...${NC}"
    if git pull origin main --ff-only 2>/dev/null; then
      echo -e "${GREEN}  [OK]${NC} Main is up to date"
    else
      echo -e "${YELLOW}  [WARN] Could not fast-forward main — you may need to rebase${NC}"
      has_warnings=true
    fi
  else
    # Fetch main to check how far behind we are
    git fetch origin main --quiet 2>/dev/null || true
    local behind
    behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
    if [ "$behind" != "?" ] && [ "$behind" -gt 0 ]; then
      echo -e "${YELLOW}  [WARN] Branch is $behind commits behind origin/main — consider rebasing${NC}"
      has_warnings=true
    else
      echo -e "${GREEN}  [OK]${NC} Branch is up to date with origin/main"
    fi
  fi

  # 3. Check for uncommitted changes
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo -e "${YELLOW}  [WARN] Uncommitted changes detected — agent will see dirty state${NC}"
    has_warnings=true
  else
    echo -e "${GREEN}  [OK]${NC} Working tree is clean"
  fi

  # 4. Check active-work.md for conflicts
  if [ -f "$ACTIVE_WORK" ]; then
    local active_in_role
    active_in_role=$(grep -c "in-progress" "$ACTIVE_WORK" 2>/dev/null || echo "0")
    if [ "$active_in_role" -gt 0 ]; then
      echo -e "${YELLOW}  [WARN] $active_in_role items currently in-progress (check tasks/active-work.md)${NC}"
      # Show which items
      grep -B2 "in-progress" "$ACTIVE_WORK" 2>/dev/null | grep "^### " | while read -r line; do
        echo -e "         ${CYAN}$line${NC}"
      done
      has_warnings=true
    else
      echo -e "${GREEN}  [OK]${NC} No conflicting active work"
    fi
  fi

  # 5. Check if node_modules exist
  if [ "$role" = "backend-dev" ] || [ "$role" = "qa-engineer" ] || [ "$role" = "devops" ]; then
    if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
      echo -e "${YELLOW}  [WARN] backend/node_modules missing — agent may need to run npm ci${NC}"
      has_warnings=true
    fi
  fi
  if [ "$role" = "frontend-dev" ] || [ "$role" = "qa-engineer" ] || [ "$role" = "devops" ]; then
    if [ ! -d "$PROJECT_ROOT/MyRecipeApp/node_modules" ]; then
      echo -e "${YELLOW}  [WARN] MyRecipeApp/node_modules missing — agent may need to run npm ci${NC}"
      has_warnings=true
    fi
  fi

  if [ "$has_warnings" = true ]; then
    echo ""
    echo -e "${YELLOW}Pre-flight completed with warnings. Proceeding anyway.${NC}"
  else
    echo -e "${GREEN}Pre-flight checks passed.${NC}"
  fi
  echo ""
}

# Parse arguments
if [ $# -eq 0 ]; then
  usage
  exit 1
fi

if [ "$1" = "--list" ]; then
  list_roles
  exit 0
fi

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  usage
  exit 0
fi

ROLE="$1"
shift

DRY_RUN=false
SKIP_PREFLIGHT=false

# Parse flags
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      exit 1
      ;;
  esac
done

TASK="${*:-}"

# Validate role
if [ -z "${ROLE_MODELS[$ROLE]+x}" ]; then
  echo -e "${RED}Error: Unknown role '$ROLE'${NC}"
  echo ""
  usage
  exit 1
fi

# Check agent file exists
AGENT_FILE="$AGENTS_DIR/${ROLE}.md"
if [ ! -f "$AGENT_FILE" ]; then
  echo -e "${RED}Error: Agent file not found: $AGENT_FILE${NC}"
  exit 1
fi

MODEL="${ROLE_MODELS[$ROLE]}"

# Run pre-flight checks
if [ "$SKIP_PREFLIGHT" = false ]; then
  preflight "$ROLE"
fi

# Build the prompt
AGENT_INSTRUCTIONS="$(cat "$AGENT_FILE")"

PROMPT="$AGENT_INSTRUCTIONS"

if [ "$DRY_RUN" = true ]; then
  PROMPT="$PROMPT

## DRY-RUN MODE
You are in planning/read-only mode. You may:
- Read any file in the codebase
- Search code with grep/glob
- Analyze architecture and suggest changes
- Write a detailed implementation plan

You must NOT:
- Create, edit, or write any files
- Run any commands that modify state (git commit, npm install, etc.)
- Make any changes to the codebase

Output a detailed plan of what you WOULD do, including specific files, line numbers, and code snippets."
fi

if [ -n "$TASK" ]; then
  PROMPT="$PROMPT

## Task
$TASK"
fi

# Show what we're about to do
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Agent:${NC}  $ROLE"
echo -e "${GREEN}Model:${NC}  $MODEL"
echo -e "${GREEN}File:${NC}   $AGENT_FILE"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Mode:   DRY-RUN (read-only, planning only)${NC}"
fi
if [ -n "$TASK" ]; then
  echo -e "${GREEN}Task:${NC}   $TASK"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Export role for boundary enforcement hooks
export CLAUDE_AGENT_ROLE="$ROLE"

# If log-session.sh exists, use it for session logging
LOG_SESSION="$SCRIPT_DIR/log-session.sh"
if [ -x "$LOG_SESSION" ] && [ "$DRY_RUN" = false ]; then
  exec "$LOG_SESSION" "$ROLE" "$MODEL" "$TASK" -- claude --model "$MODEL" --print "$PROMPT"
else
  exec claude --model "$MODEL" --print "$PROMPT"
fi
