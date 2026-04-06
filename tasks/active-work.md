# Active Work Tracker

This file tracks work currently in progress across all agents and developers.
Every agent should **read this file at session start** and **update it when starting or completing work**.

This prevents merge conflicts from parallel work on the same files and helps agents understand what's in flight.

## Format

```markdown
### [Issue #XX] Short description
- **Agent/Developer:** role or name
- **Branch:** feature/issue-XX-description
- **Status:** in-progress | waiting-for-review | blocked
- **Files touched:** list of key files being modified
- **Started:** YYYY-MM-DD
- **Notes:** any context for other agents
```

## Currently Active

### [Issue #201] Completeness scoring + parallel Phase 1 + configurable AI model
- **Agent/Developer:** backend-dev
- **Branch:** feature/issue-201-completeness-scoring-parallel-extraction
- **Status:** waiting-for-review (PR #202)
- **Files touched:** `backend/services/recipeCompletenessScorer.js`, `backend/services/recipeExtractionOrchestrator.js`, `backend/services/aiExtractionService.js`, `backend/services/linkScrapingService.js`, `backend/routes/extract.js`, `backend/config/env.js`
- **Started:** 2026-04-06
- **Notes:** Has 2 bug fix commits (HTML parser merge fix, duplicate step numbering)

## Recently Completed

_Move items here when merged. Keep for 1 week, then delete._

## Blocked

_Items waiting on external input, other agents, or decisions._
