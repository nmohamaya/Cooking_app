# Issue #99: Android Gradle APK Build Failure

> This is an archived document covering Issue #99 investigation and resolution.

**Issue:** Android APK build fails during EAS build with "unknown error"
**Status:** Resolved
**Resolution Date:** January 5, 2026
**PR:** #104

---

## Table of Contents

1. [Problem Summary](#problem-summary)
2. [Root Causes](#root-causes)
3. [Resolution](#resolution)
4. [Validation Results](#validation-results)
5. [Lessons Learned](#lessons-learned)
6. [Impact on Project](#impact-on-project)

---

## Problem Summary

The EAS APK build process was failing with a Gradle compilation error:

```
Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.
```

The error provided no actionable details, making diagnosis difficult. This blocked all Android testing and Play Store submission.

### Previous Fix Attempts

- Commit `10fa0b1` -- Removed invalid `nodeVersion` field from eas.json schema (correct but insufficient)
- Commit `c5e088c` -- Attempted to specify Node version for build (did not address root cause)

These fixes addressed build environment issues but did not resolve the Gradle compilation error.

---

## Root Causes

Four distinct categories of issues were discovered:

### 1. Missing Android SDK Version Specifications

The build configuration did not explicitly specify which Android SDK versions to use. Without `minSdkVersion` and `targetSdkVersion`, Gradle could not determine which build tools and SDKs to use, causing compilation to fail.

**Fix:** Added explicit Android SDK specifications to `app.config.js`:

```javascript
android: {
  minSdkVersion: 23,   // Android 6.0
  targetSdkVersion: 34  // Android 14 (latest)
}
```

These values align with React Native 0.81.4's Gradle configuration expectations and meet Play Store submission requirements.

### 2. Missing Critical Peer Dependency

`react-native-gesture-handler` was not installed but is required by `@react-navigation/stack`. The app would compile in some configurations but crash immediately on startup when trying to use navigation.

**Fix:**

```bash
npm install react-native-gesture-handler
```

### 3. Dependency Version Mismatches

Multiple packages had version mismatches incompatible with Expo SDK 54.0:

| Package                       | Installed | Required  |
|-------------------------------|-----------|-----------|
| `react-native-screens`        | 3.35.0    | ~4.16.0   |
| `jest`                        | 30.2.0    | ~29.7.0   |
| `expo`                        | 54.0.10   | ~54.0.30  |
| `expo-status-bar`             | 3.0.8     | ~3.0.9    |
| `react-native`               | 0.81.4    | 0.81.5    |
| `babel-preset-expo`           | 54.0.8    | ~54.0.9   |
| `@react-native-picker/picker` | 2.11.4    | 2.11.1    |

**Fix:**

```bash
npx expo install --check
```

This automatically resolved all version mismatches.

### 4. Expo Configuration Conflict

The project had both a static `app.json` and a dynamic `app.config.js` with different values. Expo doctor reported that `app.config.js` was not using the values from `app.json`, creating ambiguity about which configuration would be used.

**Fix:** Removed the redundant static `app.json` and consolidated all configuration to `app.config.js` (which supports environment variables).

---

## Resolution

### Files Modified

**MyRecipeApp/app.config.js**
- Added `minSdkVersion: 23` to android configuration
- Added `targetSdkVersion: 34` to android configuration

**MyRecipeApp/package.json**
- Updated 7 packages to match Expo 54.0.30 specifications
- Installed `react-native-gesture-handler` (new peer dependency)

**MyRecipeApp/app.json**
- Deleted (consolidated to app.config.js)

### Commits

- Commit 1: "fix(#99): add explicit Android SDK versions and fix dependency mismatches"
- Commit 2: "fix(#99): consolidate app configuration - use app.config.js as single source of truth"

---

## Validation Results

All pre-merge verification steps passed:

- Expo Doctor: 17/17 checks passed
- Tests: 532/532 passing (91.32% coverage)
- Security Audit: 0 vulnerabilities
- Pre-commit checks: All passing (ESLint, tests, security)

EAS APK build succeeded:

- Build ID: d5e7796c-b984-4c82-be8d-a000e81ec0b1
- Gradle compilation: successful
- APK generated: 69 MB valid APK file

---

## Lessons Learned

### Testing alone is insufficient for build verification

Unit tests verified code logic but completely missed all four categories of issues. Only actual compilation exposed these problems.

| Issue Type                    | Caught by Tests | Caught by Build |
|-------------------------------|-----------------|-----------------|
| Code logic errors             | Yes             | Yes             |
| Missing peer dependencies     | No              | Yes             |
| Dependency version mismatches | No              | Yes             |
| Build configuration errors    | No              | Yes             |
| Native module linking         | No              | Yes             |

Without pre-merge build verification, this PR would have merged successfully (all 532 tests pass), but the app would fail to compile in production, crash on startup due to the missing gesture handler, and have navigation bugs due to version mismatches.

### Key takeaways

1. **`npx expo install --check` is non-negotiable before merge.** Expo dependency misalignment does not show up in tests but crashes the app on real devices.
2. **Dependency ecosystem matters.** One missing peer dependency equals an app crash in production.
3. **Version alignment is critical.** Expo SDK packages are tightly coupled.
4. **Configuration should be single source of truth.** Avoid duplicating configuration across app.json and app.config.js.
5. **Pre-merge verification must include a build step.** This was added to the development workflow as a mandatory step.

---

## Impact on Project

### Blockers Unblocked

- Issue #99: Android Gradle build failure -- resolved
- Issue #102: Manual QA testing -- unblocked (APK builds successfully)
- Issue #52: Play Store submission -- unblocked (can proceed after QA)

### Workflow Improvement

Pre-merge build verification was added as a mandatory step in the development workflow. This step caught four categories of production issues that 532 passing tests completely missed.

---

## Technical References

- [React Native 0.81 Gradle Setup](https://reactnative.dev/docs/gradle)
- [Expo Android Configuration](https://docs.expo.dev/build-reference/app-config/#android)
- [Android SDK Versions Guide](https://developer.android.com/guide/topics/manifest/uses-sdk-element)
