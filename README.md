# 🍳 MyRecipeApp - AI-Powered Recipe Management Platform

> **Created, Updated, and Maintained by AI Agents** 🤖
>
> This project demonstrates advanced AI-driven development practices with continuous integration, intelligent code reviews, and automated testing.

## 📋 Project Overview

**MyRecipeApp** is a powerful React Native + Expo application for recipe management, meal planning, and shopping list generation. It features video transcription capabilities, recipe extraction, duplicate detection, and advanced search filtering.

### 🎯 Core Features

- **📹 Video Transcription**: AI-powered video-to-recipe conversion
- **🍽️ Recipe Management**: Import, organize, and manage recipes
- **📅 Meal Planning**: Plan meals across multiple weeks
- **🛒 Smart Shopping Lists**: Auto-generated and aggregated shopping lists
- **🔍 Search & Filters**: Advanced search with categories and tags
- **🌙 Dark Mode**: Full dark mode support
- **📱 Multi-Platform**: Works on Android and Web  (planned for iOS in the future)
- **♿ Accessibility**: WCAG compliant with full accessibility support

### 📊 Project Statistics

- **1,126+ Tests** (100% passing)
- **88.93% Code Coverage**
- **0 Security Vulnerabilities**
- **React Native 0.81.5 + Expo SDK 54**
- **Node.js + Express Backend**
- **Cross-Platform**: Android, Web (iOS planned)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 and **npm** >= 9.0.0
- **yt-dlp** — for YouTube subtitle extraction (`pip install yt-dlp` or [install guide](https://github.com/yt-dlp/yt-dlp#installation))
- **FFmpeg** — for audio processing (`sudo apt install ffmpeg` on Ubuntu, `brew install ffmpeg` on macOS)
- **GitHub Token** — required for AI features (Claude 3.5 Haiku via GitHub Models API)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm ci

# Create environment file
cp .env.example .env   # Then edit .env and add your GITHUB_TOKEN

# Start development server (auto-reload on changes)
npm run dev             # Runs on http://localhost:3000
```

**Required environment variables** (see `backend/.env.example`):

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | GitHub token for AI model access |
| `PORT` | No | Server port (default: 3000) |
| `CORS_ORIGIN` | No | Allowed origins (default: `http://localhost:8081`) |
| `COST_TRACKING_ENABLED` | No | Enable AI cost tracking (default: false) |

Verify the backend is running:

```bash
curl http://localhost:3000/health        # Should return health status
curl http://localhost:3000/api/version   # Should return API version
```

### 2. Frontend Setup

```bash
cd MyRecipeApp

# Install dependencies
npm ci

# Start Expo development server
npm start              # Opens Expo DevTools

# Or start directly for a specific platform:
npm run web            # Web browser
npm run android        # Android emulator
npm run ios            # iOS simulator (macOS only)
```

> **Note:** The frontend connects to the backend at `http://localhost:3000` by default (configured in `MyRecipeApp/services/apiClient.js`).

### 3. Running Tests

```bash
# Frontend tests (from MyRecipeApp/)
cd MyRecipeApp
npm test               # Runs all tests with coverage

# Backend tests (from backend/)
cd backend
npm test               # Runs all tests with coverage
```

### 4. Security & Dependency Checks

```bash
# Run in both MyRecipeApp/ and backend/
npm run security                    # npm audit

# Frontend only — verify Expo dependency alignment
cd MyRecipeApp
npx expo install --check            # Critical before any merge
```

### Build for Production

```bash
# Android/iOS via EAS Build
cd MyRecipeApp
npx eas build --platform android
npx eas build --platform ios

# Backend deployment
bash deploy.sh                      # Automated validation + deployment
```

---

## 📁 Project Structure

```text
Cooking_app/
├── MyRecipeApp/                    # React Native + Expo frontend
│   ├── App.js                     # Root component (navigation, state)
│   ├── screens/                   # 8 screens (Home, AddRecipe, MealPlan, etc.)
│   ├── components/                # Reusable UI components
│   ├── services/                  # API client, extractors, business logic
│   ├── contexts/                  # React contexts for state management
│   ├── __tests__/                 # Frontend test suites
│   └── app.config.js              # Expo configuration
├── backend/                       # Node.js + Express API server
│   ├── server.js                  # Express app entry point
│   ├── routes/                    # API routes (download, transcribe, recipes, cost)
│   ├── services/                  # Business logic services
│   ├── config/                    # Environment, logger, deployment config
│   └── tests/                     # Backend test suites
├── docs/                          # Organized documentation
│   ├── INDEX.md                   # Documentation entry point
│   ├── ROADMAP.md                 # Living roadmap to Play Store launch
│   ├── adr/                       # Architecture Decision Records
│   ├── architecture/              # C4 diagrams, system overview
│   ├── api/                       # API reference
│   ├── guides/                    # Setup, deployment, video extraction guides
│   ├── design/                    # Design system, UI redesign plan
│   ├── testing/                   # Test strategy, QA checklists
│   └── archive/                   # Historical phase/issue records
├── scripts/                       # Deployment and utility scripts
├── .github/workflows/ci.yml       # GitHub Actions CI/CD pipeline
├── README.md                      # This file
├── CONTRIBUTING.md                # Contributing guidelines
├── SECURITY.md                    # Security policy
├── CODE_OF_CONDUCT.md             # Contributor Covenant v2.1
├── CHANGELOG.md                   # Release history
└── LICENSE                        # MIT License
```

---

## 📱 Launch Roadmap Summary

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap to Google Play Store launch.

---

## 📚 Documentation

See **[docs/INDEX.md](docs/INDEX.md)** for the full documentation index.

| Area | Document |
| --- | --- |
| Architecture | [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md) |
| API Reference | [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md) |
| Deployment | [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) |
| Design System | [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) |
| Test Strategy | [docs/testing/STRATEGY.md](docs/testing/STRATEGY.md) |
| ADRs | [docs/adr/README.md](docs/adr/README.md) |
| Roadmap | [docs/ROADMAP.md](docs/ROADMAP.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |

---

## Development Workflow

This project follows a structured development process designed to catch issues early and maintain code quality. All changes must go through this workflow to ensure stability and quality.

### 🔄 Complete Development Workflow

#### Step 1: Issue Management & Planning

Before starting any work:

1. **Create an Issue** (required)
   - Title format: `[Type] Feature/fix description`
   - Add detailed description, acceptance criteria, and expected behavior
   - Add relevant labels (bug, feature, enhancement, etc.)

2. **Set Issue Status**
   - Mark as "In Progress" when you start working
   - Set in GitHub Projects board for team visibility

#### Step 2: Create a Feature Branch

```bash
git checkout -b feature/issue-XX-short-description
```

**Branch Naming Convention:**

- Feature: `feature/issue-XX-description`
- Bug fix: `fix/issue-XX-description`
- Documentation: `docs/issue-XX-description`

#### Step 3: Implement Changes

- Write code following project conventions
- Commit frequently with clear messages
- Reference issue numbers: `fix(#99): description`
- Run pre-commit checks:

  ```bash
  npm test           # All tests must pass
  npm run security   # 0 vulnerabilities
  ```

#### Step 4: Create Pull Request

1. Push branch: `git push origin feature/issue-XX-description`
2. Create PR with:
   - Clear title: `fix(#XX): description`
   - Description linking issue: `Closes #XX`
   - Acceptance criteria checklist
   - Screenshots/videos for UI changes

3. Request human reviewers
4. Set issue status to "In Review"
5. Ensure CI/CD checks pass

#### Step 5: ✨ CRITICAL - Verify PR Functionality

**This step prevents shipping broken code. All PRs must pass these checks before merging:**

##### 5a. Dependency Verification

```bash
cd MyRecipeApp
npx expo install --check
```

**Purpose**: Catches missing peer dependencies and version mismatches

- Validates all packages match Expo SDK expectations
- Detects missing native module dependencies (like `react-native-gesture-handler`)
- Prevents app crashes in production

**Real Example (Issue #99)**: Testing discovered:

- Missing: `react-native-gesture-handler` → would cause app crash
- Mismatch: `react-native-screens` (3.35.0 vs ~4.16.0)
- Mismatch: `jest` (30.2.0 vs ~29.7.0)

##### 5b. Test Suite & Security

```bash
npm test                  # In both MyRecipeApp/ and backend/
npm run security          # In both MyRecipeApp/ and backend/
```

**Requirements**:

- ✅ All 1,126+ tests must pass
- ✅ 90%+ code coverage maintained
- ✅ 0 security vulnerabilities
- ✅ No regressions in existing functionality

##### 5c. Build Verification

For Android/native changes:

```bash
cd MyRecipeApp
eas build --platform android --profile preview
```

- Validates Gradle compilation succeeds
- Catches build configuration errors
- Tests actual APK generation
- Reviews EAS build logs for warnings/errors

For web changes:

```bash
npm run web
```

For iOS changes:

- Verify iOS build with Xcode (local development)

**Real Example (Issue #99)**: EAS build testing revealed Gradle compilation failures that manual tests didn't catch. Configuration fixes were needed before the build could succeed.

#### Step 6: Address Review Feedback

- Respond to all reviewer comments
- Make requested changes in new commits
- Mark conversations as resolved
- Request re-review when ready

**For handling non-critical comments and creating technical debt issues**: See [CONTRIBUTING.md - Handling Code Review Comments](./CONTRIBUTING.md#-handling-code-review-comments) for detailed guidance on:

- Prioritizing fixes vs. deferred work
- Creating technical debt issues for unfixed comments
- Adding PR comments that link to the created issue
- Ensuring team visibility and accountability

#### Step 7: Manual QA Testing

Once all verification passes, test on actual devices:

- **Android**: Install APK on device/emulator, test all workflows
- **iOS**: Test on simulator, verify navigation and data flows
- **Web**: Test in modern browsers (Chrome, Safari, Firefox)
- **Cross-Platform**: Verify consistency across platforms

**Key Workflows to Test**:

- Navigation between screens
- Data persistence across app restarts
- Error handling (network failures, invalid input)
- Performance (list rendering, search, filters)
- Accessibility (screen reader, contrast, touch targets)

#### Step 8: Merge to Main

Once all steps pass:

```bash
# Via GitHub UI (recommended):
# 1. Click "Squash and merge" on PR
# 2. Use commit message: "feat(#XX): description"

# OR manually:
git checkout main
git pull origin main
git merge --squash feature/issue-XX-description
git commit -m "feat(#XX): description"
git push origin main
```

#### Step 9: Post-Merge Cleanup

```bash
git checkout main
git pull origin main
git branch -d feature/issue-XX-description
git push origin :feature/issue-XX-description  # Delete remote branch
```

---

## 🎯 Multi-Phase Feature Development Workflow

For large features broken into multiple phases (like Issue #20: Video Transcription), use this specialized workflow:

### 📊 Status Tracking

Keep the [docs/ROADMAP.md](docs/ROADMAP.md) updated throughout development:

- Update after each phase completion with metrics and deliverables
- Document any major decisions or pivots
- Track blockers, dependencies, and next steps
- Update weekly during active development

See also [CHANGELOG.md](CHANGELOG.md) for release history.

### Phase Implementation Strategy

**Overview**: Each phase is a separate sub-issue with its own PR, allowing incremental development and review.

```text
Parent Issue (#20): Video Transcription Feature
├─ Phase 1 (#110): Backend infrastructure
│  ├─ Branch: feature/issue-20-video-transcription
│  ├─ PR: #118
│  └─ Status: ✅ Merged (2026-01-06)
├─ Phase 2 (#111): Video download & audio extraction
│  ├─ PR: #119
│  └─ Status: ✅ Merged (2026-01-06)
├─ Phase 3 (#112): GitHub Copilot integration for transcription
│  ├─ PR: #124
│  ├─ Services: transcriptionService, costTracker, cacheService
│  ├─ Tests: 49 new tests, all passing
│  └─ Status: ✅ In Review (Ready to merge, 2026-01-07)
├─ Phase 4 (#113): Recipe extraction pipeline
│  ├─ PR: #124 (same PR as Phase 3)
│  ├─ Services: ingredientService, cookingStepsService, recipeExtractionService
│  ├─ Tests: 111 new tests, all passing (50%+ coverage)
│  └─ Status: ✅ In Review (Ready to merge, 2026-01-07)
└─ Phases 5-8: Remaining UI & integration phases...
```

### Review Comment Handling

When code review comments are received, batch them by severity:

**Priority 1: Critical Bugs** (same-day fix)

- Logic errors, data loss risks, crashes
- Security vulnerabilities
- Memory leaks or resource exhaustion
- Example: Job status not updated, file cleanup not executed

**Priority 2: Memory/Performance** (1-2 hour fix)

- Memory leaks (unbounded queues, job accumulation)
- Race conditions in async code
- Timeout handling issues
- Example: 24-hour TTL cleanup, queue size limits

**Priority 3: Code Quality** (within PR cycle)

- Unused variables or properties
- Inconsistent error messages
- Redundant or dead code
- Example: Remove unused bitrate properties, fix error message format

**Priority 4: Tests & Documentation** (before merge)

- Placeholder tests that need replacement
- Missing comments on coverage thresholds
- Example: Replace dummy tests with TODO comments

### Implementation Steps

1. **Create Sub-Issues for Each Phase**

   ```markdown
   Title: feat(#20): [Phase N] Feature description
   Description:
   - Detailed requirements
   - Dependencies on previous phases
   - Expected deliverables
   - Success criteria
   ```

2. **Single Feature Branch for All Phases**

   ```bash
   # Create once at the start
   git checkout -b feature/issue-20-video-transcription
   
   # Use for ALL phases - keeps related work together
   # Create new PR for each phase, but same branch
   ```

3. **Implement & Test Phase Locally**

   ```bash
   npm test           # All tests pass
   npm audit         # Zero vulnerabilities
   git diff main     # Review changes
   ```

4. **Create PR for Phase**
   - Title: `feat: [Phase N description] (Closes #XXX)`
   - Reference parent issue (#20) in description
   - List dependencies on previous phases
   - Include testing approach

5. **Handle Review Comments**
   - Group by severity (Priority 1 → 4)
   - Fix in single focused commit
   - Re-run tests after fixes
   - Push to same PR (same branch)
   - Mark comments as resolved

6. **Track Deferred Work**
   - If leaving placeholder tests or TODOs for later phases:
     - Create a GitHub issue describing what needs to be done
     - Reference the parent issue (#20) and current phase (#XXX)
     - Link the issue in code comments (`// TODO: See issue #YYY`)
     - Add label `deferred`, `testing`, or `technical-debt` as appropriate
   - This ensures deferred work isn't forgotten and visibility is maintained

7. **Merge When All Checks Pass**
   - All tests passing (100%)
   - Security audit clean (0 vulnerabilities)
   - All review comments resolved
   - Squash commit with clear message

### Example: Issue #20 Phase 2 Review

**Scenario**: PR #119 received 17 code review comments

**Solution Approach**:

```text
Critical Bugs (5 items):
├─ Job status never set to 'processing'
├─ Video path not stored for cleanup
├─ Missing path validation in cleanup
├─ Timeout handlers registered twice
└─ Error handler doesn't update job status
   → Fix in single commit, test, push

Memory Issues (6 items):
├─ No TTL for old download jobs
├─ Queue accumulates unbounded
├─ No cleanup mechanism
├─ Max size enforcement missing
└─ In-memory warning missing
   → Fix in same commit as critical bugs

Code Quality (6 items):
├─ Unused 'metadata' variable
├─ Unused 'bitrate' properties
├─ Irrelevant -q:a parameter
├─ Inconsistent error messages
├─ Placeholder tests
└─ Coverage threshold comments
   → Fix in same commit

Result: All 17 issues fixed in 1 commit, re-tested, pushed
```

### PR Template for Phase Features

```markdown
## Phase N: [Feature Name] (Closes #XXX)

### Overview
Brief description of what this phase accomplishes.

### Dependencies
- [ ] Phase N-1 (#XXX) - Must be merged first
- [ ] External service X - Required for testing
- [ ] Frontend/Backend - Which parts affected

### What's Included
- ✅ Service Y with Z functionality
- ✅ Routes for endpoints A, B, C
- ✅ N passing tests covering [areas]
- ✅ PHASE_N_NOTES.md documentation

### Files Changed
- `backend/services/serviceX.js` - Core logic (X lines)
- `backend/routes/routeX.js` - API endpoints (Y lines)
- `backend/tests/serviceX.test.js` - Tests (Z lines)

### Testing
- ✅ All tests passing (X/X)
- ✅ Coverage threshold maintained (XX%)
- ✅ Security audit: 0 vulnerabilities
- ✅ Pre-commit checks: All passing

### Review Notes
- Addresses PR comments from Phase N-1
- Known limitations: [X, Y, Z]
- Future improvements: [A, B, C] (in Phase N+1)
```

---

## Commit Message Standards

Use this format for all commits:

```text
type(#issue): subject

body (optional)
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons)
- `refactor`: Code restructuring
- `test`: Test changes
- `chore`: Build, dependencies, tooling

**Examples**:

```text
feat(#100): add weekly meal planning feature
fix(#99): resolve Android Gradle build failure
docs(#50): update README with deployment guide
test(#102): add manual QA test cases
```

---

## Why Pre-Merge Verification Matters

**Real incident (Issue #99)**: Testing the EAS build before merge revealed:

1. **Missing Dependency** (`react-native-gesture-handler`)
   - Required by @react-navigation/stack
   - App would crash in production without it
   - Unit tests don't catch this—only actual runtime does

2. **Major Version Mismatches**
   - `react-native-screens`: 3.35.0 vs ~4.16.0
   - `jest`: 30.2.0 vs ~29.7.0
   - Would cause crashes and unexpected behavior

3. **Build Configuration Issues**
   - Android SDK versions not specified
   - Gradle compilation failures with "unknown error"
   - Only discoverable through actual build attempt

**Impact if merged without verification**:

- ❌ App crashes on startup for navigation users
- ❌ Build pipeline fails, blocking Play Store submission
- ❌ Runtime errors in production environment
- ❌ Requires emergency hotfix and re-deployment

**Prevention**: The verification step caught all of these before merging.

---

## Development Best Practices

### Code Quality

- ✅ Write tests for all new features (minimum 90% coverage)
- ✅ Keep functions focused and small (<50 lines)
- ✅ Document complex logic with comments
- ✅ Use meaningful variable/function names

### Git Hygiene

- ✅ Commit frequently (1 commit per logical unit)
- ✅ Keep branches short-lived (<3 days)
- ✅ Always pull before pushing
- ✅ Never force-push to main

### Review Process

- ✅ Respond to all feedback promptly
- ✅ Ask clarifying questions if needed
- ✅ Self-review before requesting review
- ✅ Test changes locally before pushing

### Testing Strategy

- ✅ Write tests as you code, not after
- ✅ Test both happy path and error cases
- ✅ Use meaningful test descriptions
- ✅ Keep tests isolated and independent

---

## Common Workflow Issues & Solutions

| Issue | Cause | Solution |
| --- | --- | --- |
| Merge conflicts | Long-lived branch | Rebase frequently: `git rebase main` |
| Test failures after merge | Local testing incomplete | Run `npm test` before creating PR |
| Build fails on CI | Missing dependencies | Run `npx expo install --check` |
| App crashes in production | Untested code changes | Complete step 5 (verification) |
| Slow code review | Unclear description | Use PR template with detailed info |

---

## Current Development Status

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap and [CHANGELOG.md](CHANGELOG.md) for release history.

**Completed**:

- ✅ Phase 1: Backend fixes — video extraction, recipe/cost routes, security hardening
- ✅ Documentation restructuring — 55+ files consolidated into organized `docs/` structure
- ✅ APK build successful (69 MB)

**In Progress**:

- ⏳ Phase 2: UI redesign (planning)
- ⏳ Local testing and manual QA
- ⏳ Issue #175: npm audit vulnerability fixes

---

## Testing & Quality Standards

- ✅ **Test Coverage**: Minimum 90% statement coverage required (frontend), increasing for backend
- ✅ **Test Pass Rate**: 100% (all 1,126+ tests must pass)
- ✅ **Security**: 0 vulnerabilities allowed
- ✅ **Pre-commit Checks**: ESLint, tests, and security audit must pass
- ✅ **Build Verification**: Successful builds on target platforms (Android, Web)
- ✅ **Expo Dependency Check**: `npx expo install --check` must pass before merge

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React Native 0.81.5 + Expo SDK 54 |
| **Backend** | Node.js (>=18) + Express 4.18 |
| **AI** | Claude 3.5 Haiku via GitHub Models API |
| **Navigation** | React Navigation 6.x (bottom tabs + stack) |
| **Storage** | AsyncStorage (local persistence) |
| **Logging** | Winston 3.11 |
| **Security** | Helmet.js, express-rate-limit, CORS |
| **Testing** | Jest 29.7 + @testing-library/react-native + Supertest |
| **CI/CD** | GitHub Actions (4 parallel jobs) |
| **Build** | EAS (Expo Application Services) |

**Target Platforms**:

- Android 6.0+ (API level 23) to Android 14 (API level 34)
- Web (modern browsers)
- iOS (planned)
