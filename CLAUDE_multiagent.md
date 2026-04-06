# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MyRecipeApp** — a cross-platform AI-powered recipe management and meal planning app. React Native + Expo frontend with a Node.js + Express backend that extracts recipes from cooking videos (YouTube, Instagram, TikTok) using AI transcription.

**Key stats:** 1,126+ tests, 88.93% code coverage, 0 security vulnerabilities, production-ready.

## Quick Reference

```bash
# Frontend (from MyRecipeApp/)
npm test                        # Run all tests with coverage
npm run test:watch              # Watch mode
npm start                       # Start Expo dev server
npm run web                     # Start web build
npm run lint                    # ESLint
npm run security                # Security audit

# Backend (from backend/)
npm test                        # Run all tests
npm run dev                     # Start dev server (nodemon)
npm start                       # Start production server
npm run lint                    # ESLint
npm run security                # Security audit

# Deployment
bash deploy.sh                  # Automated backend deployment
npx expo install --check        # Validate Expo dependency alignment
```

## Multi-Agent Environment

Multiple AI agents may work concurrently in this codebase using **git worktrees** for isolation. Each agent operates in its own worktree so that concurrent work on different branches does not interfere. When you identify changes you did not make, review them for correctness before proceeding.

**Worktree awareness:**
- Your working directory may be a worktree (check with `git worktree list`)
- Never modify files in another agent's worktree
- Coordinate via branches and PRs, not direct file access across worktrees
- When merging or rebasing, be aware that other worktrees may have in-flight work on shared files

## Architecture

### Project Structure

```
Cooking_app/
├── MyRecipeApp/              # React Native + Expo frontend
│   ├── App.js                # Main app entry (navigation, state management)
│   ├── screens/              # 8 screens (Home, AddRecipe, EditRecipe, RecipeDetail,
│   │                         #   RecipesTab, MealPlanTab, ShoppingTab, CostMonitoring)
│   ├── components/           # 12 component folders (TimerComponents, WeeklyMealPlanView,
│   │                         #   VideoRecipeExtractionWorkflow, TopTabBar, etc.)
│   ├── services/             # 11 service files (apiClient, recipeExtraction,
│   │                         #   timerService, extractor services per platform)
│   ├── contexts/             # React contexts for state management
│   ├── __tests__/            # Frontend test files
│   └── app.config.js         # Expo configuration
├── backend/                  # Node.js + Express API server
│   ├── routes/               # Express routes (download, transcribe, recipes, cost)
│   ├── services/             # Business logic (audio, cache, transcription, recipe
│   │                         #   extraction, ingredients, cooking steps, cost tracking)
│   ├── config/               # env.js, logger.js (Winston), deploymentUtils.js
│   ├── tests/                # Backend test files
│   └── server.js             # Express app entry point
├── docs/                     # 45+ documentation files
├── graphics/                 # UI/UX assets
├── store_listing/            # Play Store submission materials
├── scripts/                  # Deployment and utility scripts
├── .github/workflows/ci.yml  # GitHub Actions CI/CD pipeline
└── deploy.sh                 # Backend deployment script
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React Native | 0.81.5 |
| Frontend platform | Expo SDK | 54.0.30 |
| Navigation | React Navigation | 6.x (bottom tabs + stack) |
| Storage | AsyncStorage | 2.2.0 |
| Backend framework | Express | 4.18.2 |
| Runtime | Node.js | >= 18.0.0 |
| Logging | Winston | 3.11.0 |
| HTTP client | Axios | 1.6.2 |
| AI API | GitHub Copilot Models API | Claude 3.5 Haiku |
| Testing | Jest + @testing-library/react-native | 29.7.0 |
| CI/CD | GitHub Actions | 4 parallel jobs |

### Backend API Flow

```
Video URL → download route → downloadService
         → audioService (extract audio)
         → transcriptionService (GitHub Models API → Claude 3.5 Haiku)
         → recipeExtractionService (parse transcript)
         → ingredientService + cookingStepsService
         → JSON recipe response
```

**Key endpoints:**
- `GET /health` — health check
- `GET /api/version` — API version
- Routes in `backend/routes/`: download, transcribe, recipes, cost

### Frontend App Features

- Recipe management (import, organize, search, filter)
- AI-powered video-to-recipe extraction (YouTube, Instagram, TikTok)
- Meal planning (multi-week)
- Smart shopping lists (auto-generated from meal plans)
- Dark mode, accessibility (WCAG), multi-platform (Android, Web, iOS planned)

## Build & Test Commands

### Frontend (`MyRecipeApp/`)

```bash
cd MyRecipeApp

# Install dependencies
npm ci

# Run all tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Coverage report only
npm run test:coverage

# Start development
npm start                       # Expo dev server
npm run android                 # Android emulator
npm run ios                     # iOS simulator
npm run web                     # Web browser

# Validate Expo dependency alignment (CRITICAL before merge)
npx expo install --check
```

**Test configuration:**
- Jest 29.7.0 with `@testing-library/react-native`
- Setup file: `jest.setup.js` (mocks for AsyncStorage, gesture handler, native modules)
- Babel transformation via `babel-preset-expo`

### Backend (`backend/`)

```bash
cd backend

# Install dependencies
npm ci

# Run all tests
npm test

# Watch mode
npm run test:watch

# Development server (auto-reload)
npm run dev

# Production server
npm start
```

**Test configuration:**
- Jest 29.7.0 with Supertest 6.3.3
- Setup file: `tests/setup.js`
- 10-second timeout, `forceExit` and `detectOpenHandles` enabled
- Coverage thresholds: 10% branches, 5% functions, 15% lines (Phase 2-3 baseline — will increase)

### Before Reporting "All Tests Pass" — Verify

- [ ] Correct branch? (`git branch --show-current`)
- [ ] Frontend tests pass? (`cd MyRecipeApp && npm test`)
- [ ] Backend tests pass? (`cd backend && npm test`)
- [ ] Security audit clean? (`npm run security` in both directories)
- [ ] Expo deps aligned? (`cd MyRecipeApp && npx expo install --check`)

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main` and `develop`:

| Job | What it checks |
|-----|---------------|
| **Quality** | ESLint, `npm list --depth=0` dependency validation |
| **Test** | Jest tests with coverage |
| **Security** | `npm audit`, `npm run security` |
| **Build** | `app.config.js` validation, web build check |
| **CI-Status** | Aggregates all jobs — all must pass |

Environment: Node.js 18, `ubuntu-latest`, npm cache enabled.

## Lint and Format

```bash
# Frontend
cd MyRecipeApp && npm run lint      # ESLint with @react-native/eslint-config

# Backend
cd backend && npm run lint          # ESLint with eslint-plugin-security
```

ESLint is the primary linting tool. No Prettier configured — follow existing code style.

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=debug
GITHUB_TOKEN=<required>           # GitHub token for Copilot/Claude API access
MAX_FILE_SIZE=500MB
UPLOAD_DIR=./temp/uploads
CORS_ORIGIN=*
VIDEO_TIMEOUT_MINUTES=60
MAX_VIDEO_DURATION_HOURS=1
COST_TRACKING_ENABLED=true
COST_ALERT_THRESHOLD=1.00
```

### Frontend (`MyRecipeApp/.env`)

```env
GITHUB_TOKEN=<required>           # Must use EXPO_PUBLIC_ prefix for web builds
```

**Never commit `.env` files.** Use `.env.example` as reference. The `deploy.sh` script validates required env vars before deployment.

## Development Workflow

### Branch & Commit Conventions

- **Branch naming:** `feature/issue-XX-description`, `fix/issue-XX-description`, `bugfix/issue-XX-description`, `docs/issue-XX-description`, `chore/issue-XX-description`, `hotfix/critical-description`
- **Always include issue number in branch name**
- **Commit format:** `type(#issue): subject` — types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- **PR title:** `feat(#XX): description`, body must include `Closes #XX`
- **PR size:** Keep PRs small and focused — aim for **under 500 lines changed** (excluding tests and generated files). Large features should be split across multiple PRs (e.g., backend services first, then frontend wiring, then UI updates). Smaller PRs get reviewed faster, have fewer merge conflicts, and are easier to revert. If a PR exceeds ~800 lines, consider splitting it.

### Implementation Workflow (Steps 1-9)

1. **Create a GitHub Issue** — description, acceptance criteria, labels (required before any code)
2. **Branch from main:** `git checkout main && git pull && git checkout -b feature/issue-XX-desc`
3. **Implement** — commit frequently, reference issue numbers, write tests for all new functionality
4. **Pre-push verification (all required):**
   - Frontend tests: `cd MyRecipeApp && npm test` (100% pass rate)
   - Backend tests: `cd backend && npm test` (100% pass rate)
   - Security: `npm run security` (0 vulnerabilities in both)
   - Expo deps: `cd MyRecipeApp && npx expo install --check`
5. **Create PR** — push branch, CI runs automatically, set issue to "In Review"
6. **Address review** — batch by priority (P1: crashes/security, P2: performance, P3: code quality, P4: tests/docs)
7. **Manual QA testing** — test on Android device/emulator, web browser, iOS simulator if applicable
8. **Merge** — Squash and merge via GitHub UI preferred
9. **Cleanup** — delete feature branch locally (`git branch -d`) and on remote (`git push origin :branch`)

### Review Fix Protocol

After addressing review comments:
1. Commit with list of fixes: `fix: address PR #N review comments`
2. Update PR body with "Review Fixes" table mapping each comment to the fix
3. Post PR comment summarizing fixes grouped by category
4. Re-run tests before pushing
5. For deferred non-critical items: create a `technical-debt` issue with file references, line numbers, and reviewer context

### Multi-Phase Features

- Each phase gets a separate sub-issue and PR
- Branch from updated main after prior phase merges (preferred)
- Never branch a later phase from stale main when both phases touch the same files

## Proactive Improvement Suggestions

When working on any task, **always look for and suggest improvements** you notice — even if outside the immediate scope. This includes:
- **Infrastructure:** CI pipeline, deployment scripts, dev tooling, Expo config
- **Architecture:** Component structure, service boundaries, state management, API design
- **Code quality:** Performance, readability, error handling, test coverage gaps
- **Functional:** Missing features, edge cases, untested user flows
- **Testing:** Flaky tests, missing mocks, coverage blind spots, missing platform-specific tests
- **Security:** API key exposure, input validation, dependency vulnerabilities, CORS config
- **UX/Accessibility:** WCAG compliance, dark mode gaps, responsive layout issues

Flag these as suggestions (don't silently implement them). Use your judgement on severity — mention critical issues immediately, batch minor suggestions at the end of your response.

**Security issues are critical** — any API key exposure, unvalidated user input, XSS vectors, missing CORS restrictions, or dependency vulnerabilities must be reported **immediately** when noticed, not batched.

## Code Patterns

### JavaScript/React Native

- Use environment variables for all configuration — no hardcoded API URLs, keys, or magic numbers
- AsyncStorage for local persistence — always handle errors on read/write
- Services layer for business logic — keep components focused on rendering
- Platform-specific extractors in `services/` (YouTube, Instagram, TikTok, website)
- Use `EXPO_PUBLIC_` prefix for env vars that must be available in web builds

### Backend (Express)

- Route → Service separation (routes handle HTTP, services handle logic)
- Winston logger for structured logging (`backend/config/logger.js`)
- Multer for file uploads with size limits
- Cost tracking for AI API usage (`costTracker` service)
- Temp file cleanup — uploads go to `temp/uploads/`, cache to `temp/cache/`

### Testing

- New features must include tests — target 90%+ coverage for frontend, increasing for backend
- Use `@testing-library/react-native` for component tests (test behavior, not implementation)
- Use Supertest for backend API route tests
- Mock external dependencies (AsyncStorage, native modules, API calls) — never hit real APIs in tests
- New bugs get a regression test before the fix

## Root Cause Analysis

**Always fix the root cause** of issues rather than fixing symptoms or updating tests without understanding the underlying problem. When a test fails, investigate *why* the code produced that output before changing the test. If a fix requires changing test expectations, explain why the new expectation is correct.

**Real example from this project:** Issue #99 — missing `react-native-gesture-handler` would have crashed the app in production. Mocked tests passed fine but the real dependency was missing. This is why `npx expo install --check` is a critical pre-merge step.

## Planning & Self-Correction

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, stop and re-plan — don't keep pushing
- Write plans to `tasks/todo.md` with checkable items; mark items complete as you go
- Use subagents to keep the main context window clean
- After any correction from the user: update `tasks/lessons.md` with the pattern
- Review `tasks/lessons.md` at session start
- When given a bug report: fix it directly — don't ask for hand-holding

## Known Pitfalls

**`npx expo install --check` is non-negotiable before merge**
Expo dependency misalignment won't show up in tests but will crash the app on real devices. Always run this check. (Learned from Issue #99.)

**Frontend test mocking is extensive — check `jest.setup.js` first**
Many React Native modules are mocked (AsyncStorage, gesture handler, InteractionManager, Alert, native modules). If a test behaves unexpectedly, check whether the mock is outdated or missing.

**Backend `forceExit` masks open handles**
Backend Jest config uses `forceExit: true`. This can mask leaked connections or unclosed timers. If backend tests hang without `forceExit`, investigate the root cause rather than relying on the flag.

**PR body updates — do it immediately after fixes**
After pushing review-fix commits, update the PR body right away. Don't wait to be asked.

**Don't trust test counts — verify after changes**
After any significant change, compare test count to the known baseline (currently 1,126+). A passing run at the wrong count is not "all tests pass".

**`EXPO_PUBLIC_` prefix required for web env vars**
Environment variables without the `EXPO_PUBLIC_` prefix are not available in web builds. If a feature works on mobile but fails on web, check the env var prefix.

## Common Issues

| Issue | Solution |
|-------|----------|
| Tests pass locally, CI fails | Check Node.js version (must be 18), verify `npm ci` vs `npm install` |
| Expo dependency mismatch | Run `npx expo install --check` and follow its suggestions |
| Web build can't access env vars | Use `EXPO_PUBLIC_` prefix |
| Backend tests hang | Check for unclosed connections, missing `afterAll` cleanup |
| AsyncStorage errors in tests | Verify mock in `jest.setup.js` matches current API |
| ESLint "not configured" in CI | Lint step uses `--if-present` fallback — configure if needed |

## Security Practices

- **Never commit** `.env` files, API keys, or tokens
- Use `npm run security` (both frontend and backend) before every push
- `eslint-plugin-security` is enabled on the backend — don't disable its rules
- Validate all user input on API routes (file uploads, URLs, form data)
- CORS is currently `*` — restrict before production deployment
- GitHub token grants access to AI models — treat it as a secret

## Key Documentation

- `README.md` — Full project overview, quick start, development workflow
- `CONTRIBUTING.md` — PR checklist and contribution guidelines
- `SECURITY.md` — Security policy, vulnerability reporting
- `CHANGELOG.md` — Release history (Keep a Changelog format)
- `docs/INDEX.md` — Central entry point for all documentation
- `docs/ROADMAP.md` — Living roadmap to Google Play launch
- `docs/api/API_REFERENCE.md` — Complete backend API reference
- `docs/architecture/OVERVIEW.md` — System architecture with C4 diagrams
- `docs/guides/DEPLOYMENT.md` — Production deployment guide
- `docs/design/DESIGN_SYSTEM.md` — UI/UX design specifications
- `docs/testing/STRATEGY.md` — Test philosophy, tooling, coverage targets
- `docs/testing/QA_CHECKLIST.md` — Manual QA testing checklist
- `docs/adr/README.md` — Architecture Decision Records index

## Deployment

### Backend

```bash
bash deploy.sh                    # Automated: validates env, installs deps, runs tests, deploys
```

The script validates Node.js/npm versions, required env vars, runs tests and security audit, and creates required directories (`logs/`, `temp/uploads/`, `temp/cache/`, `coverage/`).

### Frontend (Mobile)

```bash
cd MyRecipeApp
npx eas build --platform android  # Android build via EAS
npx eas build --platform ios      # iOS build via EAS
```

EAS project ID: `41ca11bf-7f02-4bd4-94c7-1ea1405446be`

### Frontend (Web)

Recommended: Vercel (zero-config, auto CI/CD from GitHub), Netlify, or AWS S3 + CloudFront.
