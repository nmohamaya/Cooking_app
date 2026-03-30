# Issue #195: Video Recipe Extraction Pipeline — Bug Fix Report

> **Issue:** [#195](https://github.com/nmohamaya/Cooking_app/issues/195)
> **Date:** 2026-03-30
> **Severity:** Critical — Feature completely non-functional on web
> **Status:** Fixed

---

## Summary

During local testing of the video recipe extraction feature on web, the entire extraction pipeline was broken. Users experienced either:
- A **silent failure** (screen flickers briefly, returns to input with no feedback)
- A **hallucinated recipe** (chocolate chip cookies) regardless of the video submitted

**8 bugs** were identified across **4 files**, all contributing to the failure.

---

## Bugs Found & Fixes Applied

### Bug 1: Undefined Function Call (Critical)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Line** | 283 |
| **Symptom** | Screen flickers, extraction never starts |
| **Root Cause** | `onExtractSuccess` callback called `simulateExtractionWorkflow()` — a function that was never defined. Should have been `extractRecipeFromVideo()`. This threw a silent `ReferenceError` caught by the outer try/catch. |
| **Fix** | Replaced `simulateExtractionWorkflow()` with `extractRecipeFromVideo(data?.url)` |

### Bug 2: URL Not Passed to Extraction (Critical)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Lines** | 87, 273, 280 |
| **Symptom** | Console shows `Starting video extraction for URL: ` (empty), `Detected provider: null` |
| **Root Cause** | React state race condition. `VideoRecipeInput` sets the URL via `onVideoSelected` → `handleUrlChange` → `setUrl()`, but `onExtractSuccess` fires before the state update propagates. The `extractRecipeFromVideo()` function read from stale `url` state (empty string). |
| **Fix** | Changed `extractRecipeFromVideo` to accept a `videoUrl` parameter. The `onExtractSuccess` callback now passes `data.url` directly from the `VideoRecipeInput` component instead of relying on state. |

### Bug 3: Mock Fallback Returns Fake Data (Critical)

| | |
| --- | --- |
| **File** | `MyRecipeApp/services/youtubeExtractorService.js` |
| **Lines** | 308–313, 372–407 |
| **Symptom** | Every extraction returns a chocolate chip cookie recipe |
| **Root Cause** | When the backend connection failed (wrong port — see Bug 5), `fetchTranscriptFromAPI` caught the `ECONNREFUSED` error and silently fell back to `getMockTranscript()` — a hardcoded chocolate chip cookie recipe intended for development. This mock data was then cached in AsyncStorage and served on subsequent requests. |
| **Fix** | Removed the mock fallback. Connection failures now throw a clear error: `"Cannot connect to backend server. Please ensure the backend is running on port 3001."` |

### Bug 4: Token Check Used Wrong Environment Variable (High)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Lines** | 153–168 |
| **Symptom** | Error: "GitHub token not configured!" on every extraction attempt on web |
| **Root Cause** | The token check looked for `process.env.EXPO_PUBLIC_GITHUB_TOKEN` which is never set. The actual token is loaded via `Constants.expoConfig.extra.githubToken` (from `app.config.js`). On web, `typeof window !== 'undefined'` is always `true`, so this check always failed. |
| **Fix** | Removed the redundant token check from the workflow component. The actual token validation is handled by `recipeExtraction.js` at the API call level, which provides a proper error if the token is missing. |

### Bug 5: Backend Port Mismatch (High)

| | |
| --- | --- |
| **File** | `MyRecipeApp/services/youtubeExtractorService.js` |
| **Line** | 26 |
| **Symptom** | Backend connection refused, triggering mock fallback (Bug 3) |
| **Root Cause** | `BACKEND_CONFIG.BASE_URL` defaulted to `http://localhost:3000` but the backend runs on port `3001` (matching `apiClient.js`). The mismatch meant the YouTube extractor could never reach the backend. |
| **Fix** | Changed default port from `3000` to `3001` |

### Bug 6: Nodemon Restarts During Extraction (High)

| | |
| --- | --- |
| **File** | `backend/nodemon.json` (new file) |
| **Symptom** | Backend transcription job completes but returns `JOB_NOT_FOUND` when polled |
| **Root Cause** | yt-dlp writes subtitle files to `backend/temp/subtitles/`. Nodemon's default file watcher detected these new files and restarted the server. Since transcription jobs are stored in-memory, all jobs were wiped on restart. The job completed successfully (visible in logs) but was lost ~0ms later. |
| **Fix** | Created `backend/nodemon.json` that explicitly watches only source directories (`server.js`, `routes/`, `services/`, `config/`) and ignores `temp/`, `logs/`, `coverage/`, `tests/`. |

### Bug 7: Errors Not Displayed in UI (UX)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Symptom** | Extraction fails silently — user sees a brief flicker but no error message |
| **Root Cause** | The `error` state was set correctly in catch blocks, but the JSX never rendered it. An `errorText` style existed (line 387) but was never used in the component markup. |
| **Fix** | Added `{error && <Text style={styles.errorText}>{error}</Text>}` above the `VideoRecipeInput` component in the input step. |

### Bug 8: No Transcript Quality Validation (UX)

| | |
| --- | --- |
| **File** | `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` |
| **Lines** | 136–142 |
| **Symptom** | AI generates a hallucinated recipe from meaningless transcript |
| **Root Cause** | The transcript check only verified `length === 0`. A video with auto-generated subtitles containing only `[Music]`, `[Applause]`, and single letters (`e`, `oh`, `w`, `n`, `a`) passed this check with 83 characters. The AI then invented a recipe from scratch. |
| **Fix** | Added transcript quality check: strip `[Music]`, `[Applause]` etc. tags, then require at least 50 characters of real content. Shows error: `"No meaningful transcript found... Please try a video where the chef narrates the recipe."` |

---

## Additional Fix: Token Loading for Web

| | |
| --- | --- |
| **File** | `MyRecipeApp/services/recipeExtraction.js` |
| **Line** | 7 |
| **Change** | Added `process.env.EXPO_PUBLIC_GITHUB_TOKEN` as fallback for web builds where `Constants.expoConfig` may be null |

---

## Files Changed Summary

| File | Type | Changes |
| --- | --- | --- |
| `MyRecipeApp/components/VideoRecipeExtractionWorkflow.js` | Modified | Bugs 1, 2, 4, 7, 8 |
| `MyRecipeApp/services/youtubeExtractorService.js` | Modified | Bugs 3, 5 |
| `MyRecipeApp/services/recipeExtraction.js` | Modified | Token loading fix |
| `backend/nodemon.json` | New | Bug 6 |

---

## How to Reproduce (Before Fix)

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd MyRecipeApp && npm start` → press `w` for web
3. Navigate to Add Recipe → Extract from Video
4. Paste any YouTube URL and click Extract
5. **Expected:** Recipe from the actual video
6. **Actual:** Either silent failure (flicker) or chocolate chip cookie recipe

## Verification (After Fix)

1. Start backend with `npm run dev` — confirm no restart when extraction runs
2. Start frontend with `npm start` → web
3. Extract from YouTube video **with narration** → correct recipe extracted
4. Extract from YouTube video **without speech** → clear error message
5. Extract with backend stopped → clear "cannot connect" error (no mock data)

---

## Lessons Learned

1. **Never silently fall back to mock data** — Mock fallbacks in services mask real errors and can ship fake data to production. Fail loudly with clear error messages instead.
2. **Test the actual data flow, not just unit tests** — All 1,126 tests passed, but the end-to-end extraction was completely broken. Integration testing on real devices/browsers catches what unit tests miss.
3. **Nodemon needs explicit ignore patterns** — Any service that writes temp files will trigger nodemon restarts. Always configure `nodemon.json` to ignore `temp/`, `logs/`, etc.
4. **Expo web env vars require `EXPO_PUBLIC_` prefix** — `process.env.GITHUB_TOKEN` is not available in Expo web builds. Only `EXPO_PUBLIC_*` vars are injected.
5. **Don't duplicate validation logic** — The token was checked in the workflow component (incorrectly) AND in the extraction service (correctly). The redundant check used a different env var path and silently blocked all extraction on web.
