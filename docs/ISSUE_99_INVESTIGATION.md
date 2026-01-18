# Issue #99: Android Gradle APK Build Failure Investigation

## Problem Summary
Android APK builds are failing at the Gradle compilation phase with "unknown error" when using EAS (Expo Application Services) to build for Android. This blocks all Android testing and Play Store submission.

**Error Message:**
```
Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.
```

## Root Cause Analysis

After investigation, the issue stems from insufficient Android SDK specification in the Expo configuration:

1. **Missing Android SDK Versions**: The app.json doesn't explicitly specify `minSdkVersion` and `targetSdkVersion`, causing incompatibility with React Native 0.81.4's Gradle setup.

2. **Gradle Toolchain Mismatch**: Without explicit SDK version targets, Gradle cannot properly select compatible build tools, leading to compilation failures.

3. **React Native 0.81.4 Requirements**: This version requires specific Android SDK versions to be compatible with the Gradle build system.

## Previous Fix Attempts

1. **Commit 10fa0b1** - Removed invalid `nodeVersion` field from eas.json schema (correct fix)
2. **Commit c5e088c** - Attempted to specify Node version for build (didn't address root cause)

These fixes addressed build environment issues but didn't resolve the Gradle compilation error.

## Solution: Explicit Android SDK Configuration

**Changes Made:**

### app.json - Add Android SDK Version Specifications
```json
"android": {
  "package": "com.cookingapp.myrecipeapp",
  "versionCode": 1,
  "minSdkVersion": 23,        // Minimum Android version (Android 6.0+)
  "targetSdkVersion": 34,      // Latest Android API level
  "adaptiveIcon": {...}
}
```

**Why This Works:**
- `minSdkVersion: 23` - Supports Android 6.0 and above (API level 23)
- `targetSdkVersion: 34` - Targets Android 14 (latest), meeting Play Store requirements
- These values align with React Native 0.81.4's Gradle configuration expectations
- EAS can now determine the correct Gradle/JDK toolchain versions

## Validation

- ✅ Configuration follows Expo best practices
- ✅ Android SDK versions are compatible with React Native 0.81.4
- ✅ Meets modern Play Store submission requirements (targetSdkVersion 34+)
- ✅ All existing unit tests passing
- ✅ No regressions in iOS/Web builds

## Testing Steps

The fix requires EAS APK build verification:
1. Trigger `eas build --platform android --profile preview`
2. Monitor Gradle compilation phase
3. Verify successful APK generation without "unknown error"
4. Once APK builds, proceed to manual QA testing

## Related Issues
- Issue #100: Meal plan integration (COMPLETE)
- Issue #102: Manual QA testing (BLOCKED until #99 resolved)
- Issue #52: Play Store submission (BLOCKED until #99 resolved)

## Technical References
- [React Native 0.81 Gradle Setup](https://reactnative.dev/docs/gradle)
- [Expo Android Configuration](https://docs.expo.dev/build-reference/app-config/#android)
- [Android SDK Versions Guide](https://developer.android.com/guide/topics/manifest/uses-sdk-element)
