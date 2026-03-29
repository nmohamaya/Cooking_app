# Roadmap

Living document tracking MyRecipeApp's path to Google Play Store launch.

**Last Updated:** March 29, 2026

## Current Status

- **Tests:** 1,126+ passing (88.93% coverage)
- **Security:** 0 vulnerabilities
- **Backend:** Fully functional (transcription, recipe extraction, cost tracking)
- **Frontend:** Functional but needs UI polish

## Phase 1: Backend Fixes (COMPLETE)

Merged March 2026 via PRs #176 and #177.

- Replaced broken audio transcription with yt-dlp subtitle extraction
- Wired recipe extraction and cost tracking routes
- Added security middleware (helmet, rate limiting)
- Removed hardcoded keystore passwords
- Fixed 23 pre-existing test failures

## Phase 2: UI Redesign (PLANNING)

Goal: Polish the UI for Google Play Store quality.

Planned work (4 PRs):
1. Theme foundation and component library integration
2. Screen-by-screen redesign (Home, AddRecipe, RecipeDetail)
3. Navigation and tab redesign
4. Meal planning and shopping list UI

UI library decision pending (React Native Paper recommended).

## Phase 3: End-to-End Testing and QA (PENDING)

- Manual QA on Android devices (multiple screen sizes, Android 8+)
- End-to-end flow testing (URL paste to saved recipe)
- Performance profiling and optimization
- Accessibility audit (WCAG compliance)

## Phase 4: Play Store Submission (PENDING)

- Store listing (description, screenshots, feature graphic)
- Privacy policy finalization and hosting
- App signing and release build
- Internal testing track on Google Play Console
- Production release

## Open Issues

- #175: npm audit vulnerabilities (needs investigation)
- Documentation restructuring (#178-#187) in progress
