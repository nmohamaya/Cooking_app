# Test Strategy

This document describes MyRecipeApp's testing approach, tooling, and coverage targets.

## Overview

| Metric | Value |
| --- | --- |
| Total tests | 1,126+ |
| Code coverage | 88.93% |
| Frontend framework | Jest 29.7.0 + @testing-library/react-native |
| Backend framework | Jest 29.7.0 + Supertest 6.3.3 |
| CI | GitHub Actions (runs on every push/PR to main and develop) |

## Test Philosophy

1. **Test behavior, not implementation** -- use `@testing-library/react-native` patterns (query by text, role, testID; avoid querying by component internals)
2. **Mock at system boundaries** -- mock AsyncStorage, native modules, and external APIs. Never hit real APIs in tests.
3. **Every bug gets a regression test** before the fix ships
4. **Coverage is tracked in CI** -- we aim to keep coverage high (around 85-90%), and all tests must pass before merge

## Frontend Tests (MyRecipeApp/)

### Running

```bash
cd MyRecipeApp
npm test              # all tests with coverage
npm run test:watch    # watch mode
```

### Setup

- **Config**: `package.json` Jest section + `jest.setup.js`
- **Setup file** (`jest.setup.js`): Mocks for AsyncStorage, react-native-gesture-handler, InteractionManager, Alert, native modules
- **Babel**: `babel-preset-expo` for transformation

### What to Test

| Layer | What to test | Example |
| --- | --- | --- |
| Screens | User interactions, navigation, rendering | "tapping Save creates a recipe" |
| Components | Props, callbacks, conditional rendering | "TimerComponent shows pause when running" |
| Services | API calls, data transformation, error handling | "youtubeExtractorService returns parsed recipe" |
| Contexts | State changes, provider behavior | "RecipeContext updates on addRecipe" |

### Mock Strategy

- **AsyncStorage**: Fully mocked in `jest.setup.js` (in-memory Map)
- **Navigation**: Mock `useNavigation`, `useRoute` per test
- **API calls**: Mock `axios` or service modules -- never hit real endpoints
- **Native modules**: Mock `expo-av`, `expo-document-picker`, gesture handler, etc. in setup file
- **Platform**: Default is `ios`/`android` depending on test; use `Platform.select` mocks when testing platform-specific behavior

### Known Pitfall

Check `jest.setup.js` first when a test behaves unexpectedly. Many React Native modules are mocked there, and outdated mocks can cause false passes or confusing failures.

## Backend Tests (backend/)

### Running

```bash
cd backend
npm test              # all tests with coverage
npm run test:watch    # watch mode
```

### Setup

- **Config**: `jest.config.js`
- **Setup file** (`tests/setup.js`): Sets `NODE_ENV=test`, suppresses log output
- **Timeout**: 10 seconds per test
- **Flags**: `forceExit: true`, `detectOpenHandles: true`

### What to Test

| Layer | What to test | Example |
| --- | --- | --- |
| Routes | HTTP status, response shape, error handling | "POST /api/transcribe returns 202 with jobId" |
| Services | Business logic, error paths, edge cases | "parseVTT strips timestamps and deduplicates" |
| Middleware | Security headers, rate limiting, CORS | "helmet sets X-Content-Type-Options: nosniff" |

### Mock Strategy

- **External processes**: Mock `child_process.spawn` for yt-dlp calls
- **File system**: Mock `fs` when testing file-based operations (cost tracker, cache)
- **AI API**: Mock HTTP calls to GitHub Models API
- **No database**: App uses file-based storage, so mock `fs.readFileSync`/`writeFileSync`

### Known Pitfall

Backend Jest uses `forceExit: true` which can mask leaked connections or unclosed timers. If tests hang without this flag, investigate the root cause rather than depending on forced exit.

## Coverage Targets

| Area | Current | Target |
| --- | --- | --- |
| Frontend lines | ~90% | 90%+ |
| Frontend branches | ~85% | 85%+ |
| Backend lines | ~60% | Increasing (15% CI threshold, aiming for 80%+) |
| Backend branches | ~40% | Increasing (10% CI threshold) |

Backend coverage is lower because Phase 1 focused on functionality over coverage. The thresholds will increase as new tests are added.

## CI Pipeline

GitHub Actions runs 5 jobs on every push/PR:

1. **Quality** -- ESLint, dependency validation
2. **Test** -- Jest with coverage for `MyRecipeApp/` frontend
3. **Security** -- `npm audit`
4. **Build** -- `app.config.js` validation, web build check
5. **CI status** -- aggregates results from the other 4 jobs

The Quality, Test, Security, and Build jobs must all pass before merge.

## Adding New Tests

1. Place test files adjacent to source or in `__tests__/` directories
2. Name files `*.test.js` or `*.test.jsx`
3. Use descriptive `describe`/`it` blocks referencing the feature or issue number
4. Mock external dependencies -- don't import real API clients
5. Run the full suite before pushing: `npm test` in both `MyRecipeApp/` and `backend/`
6. Check that test count hasn't decreased (baseline: 1,126+)
