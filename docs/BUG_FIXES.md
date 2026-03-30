# Bug Fixes & Issue Resolution Log

> Consolidated record of all bugs discovered, diagnosed, and fixed in MyRecipeApp.
> Organized by category for quick reference. Each entry links to its GitHub issue/PR.

---

## Table of Contents

- [Frontend](#frontend)
  - [#195 — Video Recipe Extraction Pipeline Broken on Web](#195--video-recipe-extraction-pipeline-broken-on-web)
  - [#100 — Meal Planning Integration Bugs (10 issues)](#100--meal-planning-integration-bugs-10-issues)
- [Backend](#backend)
  - [#195-6 — Nodemon Restarts During Subtitle Extraction](#195-6--nodemon-restarts-during-subtitle-extraction)
- [Build & Release](#build--release)
  - [#99 — Android Gradle APK Build Failure](#99--android-gradle-apk-build-failure)
  - [#52 — Play Store Submission Build Errors](#52--play-store-submission-build-errors)
- [CI/CD Pipeline](#cicd-pipeline)
  - [app.config.js Module Loading Failure in GitHub Actions](#appconfigjs-module-loading-failure-in-github-actions)
- [Testing Infrastructure](#testing-infrastructure)
  - [#42 — Jest Native Module Initialization Crash](#42--jest-native-module-initialization-crash)
- [Environment & Configuration](#environment--configuration)
  - [#195 — Expo Web Token Not Available](#195--expo-web-token-not-available)
  - [#195 — Backend Port Mismatch Across Services](#195--backend-port-mismatch-across-services)
- [Lessons Learned](#lessons-learned)

---

## Frontend

### #195 — Video Recipe Extraction Pipeline Broken on Web

> **Issue:** [#195](https://github.com/nmohamaya/Cooking_app/issues/195) | **Date:** 2026-03-30 | **Severity:** Critical

The entire video extraction feature was non-functional on web. Users saw either a silent flicker (no feedback) or received a hallucinated chocolate chip cookie recipe regardless of the video submitted. **8 bugs** across 4 files.

#### Bug 1: Undefined Function Call

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | Screen flickers, extraction never starts |
| **Root Cause** | `onExtractSuccess` called `simulateExtractionWorkflow()` — a function that was never defined. Threw a silent `ReferenceError`. |
| **Fix** | Replaced with `extractRecipeFromVideo(data?.url)` |

#### Bug 2: URL Not Passed (React State Race Condition)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | Console: `Starting video extraction for URL: ` (empty) |
| **Root Cause** | `VideoRecipeInput` sets URL via `onVideoSelected` → `setUrl()`, but `onExtractSuccess` fires before state updates. `extractRecipeFromVideo()` read stale empty state. |
| **Fix** | Changed function to accept `videoUrl` parameter. Passed URL directly from callback data. |

#### Bug 3: Mock Fallback Returns Fake Data

| | |
| --- | --- |
| **File** | `MyRecipeApp/services/youtubeExtractorService.js` |
| **Symptom** | Every extraction returns chocolate chip cookies |
| **Root Cause** | On backend connection failure, `fetchTranscriptFromAPI` silently fell back to `getMockTranscript()` — a hardcoded recipe for development. This was cached in AsyncStorage and served on all subsequent requests. |
| **Fix** | Removed mock fallback. Connection failures now throw clear error messages. |

#### Bug 4: Redundant Token Check (Wrong Env Var)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | Error: "GitHub token not configured!" on every attempt |
| **Root Cause** | Checked `process.env.EXPO_PUBLIC_GITHUB_TOKEN` (never set) instead of `Constants.expoConfig.extra.githubToken`. On web, the condition `typeof window !== 'undefined'` is always true, so this always failed. |
| **Fix** | Removed redundant check. Token validation handled by `recipeExtraction.js` at the API call level. |

#### Bug 7: Errors Not Displayed in UI

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | Extraction fails silently — user sees brief flicker, no error message |
| **Root Cause** | `error` state was set in catch blocks but never rendered. `errorText` style existed but wasn't used in JSX. |
| **Fix** | Added `{error && <Text style={styles.errorText}>{error}</Text>}` to the input step UI. |

#### Bug 8: No Transcript Quality Validation

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | AI generates hallucinated recipe from meaningless transcript |
| **Root Cause** | Transcript check only verified `length === 0`. Auto-generated subtitles with only `[Music]`, `[Applause]`, and single letters (83 chars) passed validation. AI invented a recipe from scratch. |
| **Fix** | Strip `[Music]`/`[Applause]` tags, require at least 50 characters of real content. |

---

### #100 — Meal Planning Integration Bugs (10 issues)

> **Issue:** [#100](https://github.com/nmohamaya/Cooking_app/issues/100) | **PR:** [#101](https://github.com/nmohamaya/Cooking_app/pull/101) | **Date:** 2026-01-05 | **Severity:** High

10 bugs discovered during meal planning feature integration:

| # | Bug | Root Cause | Fix |
| --- | --- | --- | --- |
| 1 | Meal slot buttons non-functional | Callback not wired to `handleMealSlotPress` | Implemented callback + recipe picker modal |
| 2 | Recipe titles showing IDs | No recipe lookup function | Added `getRecipeTitle` with memoization |
| 3 | mealType undefined in new meals | Parameter lost in callback chain | Fixed callback wrapping to pass both `dayOfWeek` and `mealType` |
| 4 | Recipes appearing in all weeks | No date-based filtering | Implemented date filtering in `getWeeklyMealPlan` |
| 5 | Incorrect meal count display | Counted all meals globally | Changed to count `weekPlanData` only |
| 6 | Shopping list empty | Wrong import + missing recipes array | Fixed import, passed `recipes` to shopping list service |
| 7 | Shopping items reappear after clear | Aggressive `setInterval` auto-refresh | Removed auto-refresh, kept manual refresh button |
| 8 | Clear purchased button error | Wrong function signature | Replaced service call with direct array filtering |
| 9 | Ingredients miscategorized | Missing category mappings | Added mappings for prawns, prosciutto, etc. |
| 10 | Shopping list not persisting | No callback to save to main app | Added `onSaveShoppingList` callback |

**Files:** `App.js`, `WeeklyMealPlanView.js`, `ShoppingListView.js`, `mealPlanningService.js`, `shoppingListService.js`

---

## Backend

### #195-6 — Nodemon Restarts During Subtitle Extraction

> **Issue:** [#195](https://github.com/nmohamaya/Cooking_app/issues/195) (Bug 6) | **Date:** 2026-03-30 | **Severity:** High

| | |
| --- | --- |
| **Symptom** | Transcription job completes but returns `JOB_NOT_FOUND` when polled |
| **Root Cause** | yt-dlp writes subtitle files to `backend/temp/subtitles/`. Nodemon detected new files and restarted the server. Since jobs are in-memory, all were wiped ~0ms after completion. Logs showed `job completed` immediately followed by `Server running` (restart). |
| **Fix** | Created `backend/nodemon.json` — watches only `server.js`, `routes/`, `services/`, `config/`; ignores `temp/`, `logs/`, `coverage/`, `tests/`. |

---

## Build & Release

### #99 — Android Gradle APK Build Failure

> **Issue:** [#99](https://github.com/nmohamaya/Cooking_app/issues/99) | **PR:** [#104](https://github.com/nmohamaya/Cooking_app/pull/104) | **Date:** 2026-01-05 | **Severity:** Critical

EAS build failed with "unknown Gradle error." Four root causes:

| # | Problem | Fix |
| --- | --- | --- |
| 1 | No Android SDK versions specified | Added `minSdkVersion: 23`, `targetSdkVersion: 34` to `app.config.js` |
| 2 | Missing `react-native-gesture-handler` | Installed dependency (required by `@react-navigation/stack`) |
| 3 | 7 dependency version mismatches | Ran `npx expo install --check` and applied fixes |
| 4 | Duplicate config: `app.json` + `app.config.js` | Deleted `app.json`, consolidated to `app.config.js` |

**Key takeaway:** Unit tests passed fine — only the actual EAS build caught these issues. This is why `npx expo install --check` is now a mandatory pre-merge step.

**Files:** `MyRecipeApp/app.config.js`, `MyRecipeApp/package.json`, `MyRecipeApp/app.json` (deleted)

---

### #52 — Play Store Submission Build Errors

> **Issue:** [#52](https://github.com/nmohamaya/Cooking_app/issues/52) | **PR:** [#93](https://github.com/nmohamaya/Cooking_app/pull/93) | **Date:** 2025-12-21 | **Severity:** High

| # | Problem | Fix |
| --- | --- | --- |
| 1 | Bundling failure — JSX syntax error | Fixed unclosed `<View>` tag in `App.js` |
| 2 | EAS not linked | Added EAS project ID to `app.config.js` |
| 3 | Missing Android metadata | Added `package`, `versionCode` to android config |
| 4 | Signing credentials | Created `credentials.json` with production keystore |

**Result:** APK built successfully (69 MB).

**Files:** `App.js`, `app.config.js`, `credentials.json`, `eas.json`

---

## CI/CD Pipeline

### app.config.js Module Loading Failure in GitHub Actions

> **Related to:** [#99](https://github.com/nmohamaya/Cooking_app/issues/99) | **Date:** 2026-01-06 | **Severity:** High

| | |
| --- | --- |
| **Symptom** | CI build validation step fails; works locally |
| **Root Cause** | `app.config.js` used ES6 syntax (`import`/`export default`) but `package.json` didn't set `"type": "module"`. Node.js treated `.js` as CommonJS, causing `require()` to fail in GitHub Actions. Invisible locally because Expo's bundler handled the mismatch. |
| **Fix** | Converted `app.config.js` from ES6 to CommonJS: `require('dotenv/config')` + `module.exports = {}`. Simplified CI validation step. |

**Files:** `MyRecipeApp/app.config.js`, `.github/workflows/ci.yml`

---

## Testing Infrastructure

### #42 — Jest Native Module Initialization Crash

> **Issue:** [#42](https://github.com/nmohamaya/Cooking_app/issues/42) | **Severity:** High

| | |
| --- | --- |
| **Symptom** | `__fbBatchedBridgeConfig is not set` error — entire test suite fails |
| **Root Cause** | React Native's native module initialization ran during Jest's module loading before mocks were set up. `jest.setup.js` wasn't intercepting native module calls early enough. |
| **Fix** | Enhanced `jest.setup.js`: moved `__DEV__`/`__JEST__` flags to top (before imports), added comprehensive mocks for `BatchedBridge`, `TurboModuleRegistry`, `ReactNativeFeatureFlags`. Fixed mock dependency order. |

**Files:** `jest.setup.js`, `package.json`, `__tests__/feedbackModal.test.js`

---

## Environment & Configuration

### #195 — Expo Web Token Not Available

> **Issue:** [#195](https://github.com/nmohamaya/Cooking_app/issues/195) | **Date:** 2026-03-30

| | |
| --- | --- |
| **Symptom** | "GitHub token not configured" error only on web; works on native |
| **Root Cause** | Expo web only exposes env vars with `EXPO_PUBLIC_` prefix. `GITHUB_TOKEN` in `.env` was accessible on native (via `app.config.js` → `Constants.expoConfig.extra`) but not on web via `process.env`. |
| **Fix** | Added `EXPO_PUBLIC_GITHUB_TOKEN` to `.env.example`. Updated `recipeExtraction.js` to check `process.env.EXPO_PUBLIC_GITHUB_TOKEN` as fallback. |

**Files:** `MyRecipeApp/.env.example`, `MyRecipeApp/services/recipeExtraction.js`

---

### #195 — Backend Port Mismatch Across Services

> **Issue:** [#195](https://github.com/nmohamaya/Cooking_app/issues/195) (Bug 5) | **Date:** 2026-03-30

| | |
| --- | --- |
| **Symptom** | YouTube extractor can't reach backend (ECONNREFUSED) |
| **Root Cause** | `youtubeExtractorService.js` defaulted to port `3000`, while `apiClient.js` and `backend/.env` use port `3001`. Services were pointing to different ports. |
| **Fix** | Changed `youtubeExtractorService.js` default from `3000` to `3001`. |

**Files:** `MyRecipeApp/services/youtubeExtractorService.js`

---

## Lessons Learned

These patterns have caused bugs repeatedly. Check for them during code review:

| Pattern | Lesson | First Seen |
| --- | --- | --- |
| **Mock fallbacks in services** | Never silently return fake data. Fail loudly with clear errors. Mock fallbacks mask real bugs and can ship fake data to users. | #195 |
| **Unit tests pass, feature broken** | All 1,126 tests passed, but the end-to-end extraction was completely broken. Integration/manual testing on real browsers catches what unit tests miss. | #99, #195 |
| **Nodemon + temp files** | Any service writing temp files triggers nodemon restart. Always configure `nodemon.json` to ignore `temp/`, `logs/`, etc. | #195 |
| **Expo web env vars** | `process.env.FOO` is NOT available in Expo web builds. Only `EXPO_PUBLIC_*` vars are injected. Always use the prefix for web. | #195 |
| **Duplicate validation logic** | Don't check the same thing in two places with different logic. One will be wrong. Let the service that uses the value validate it. | #195 |
| **ES6/CommonJS mismatch** | Config files loaded by Node.js (not bundler) must use CommonJS unless `"type": "module"` is set. Expo's bundler masks this locally. | CI/CD fix |
| **`npx expo install --check` is critical** | Dependency misalignment won't show up in tests but crashes the app on real devices. Run before every merge. | #99 |
| **Port consistency** | When multiple services reference the backend URL, use a single source of truth (env var or shared config). Hardcoded ports in individual services drift. | #195 |
