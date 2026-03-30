# Building Release APK for MyRecipeApp

## Overview

This guide walks through building a production-ready APK for Google Play Store submission.

## Prerequisites

- ✅ EAS CLI installed: `npm install -g eas-cli`
- ✅ Expo account with app registered
- ✅ Android signing keystore: `MyRecipeApp/cooking_app_release.keystore`
- ✅ Keystore password saved securely
- ✅ All tests passing: `npm test`
- ✅ Security audit passing: `npm audit`

## Option 1: Build Locally (Recommended for Testing)

### 1. Install Dependencies

```bash
cd MyRecipeApp

# Install build tools
npm install

# Ensure Expo CLI is available
which eas
# If not found: npm install -g eas-cli

# Verify keystore exists
ls -la cooking_app_release.keystore
```

### 2. Build APK (Local)

```bash
# For development/testing (faster, no signing)
eas build --platform android --local --profile preview

# For production (signed, ready for Play Store)
eas build --platform android --local --profile production \
  --keystore cooking_app_release.keystore \
  --keystore-password YOUR_PASSWORD \
  --key-alias cooking_app_key \
  --key-password YOUR_PASSWORD
```

### 3. Output

After successful build:
```
✅ Build successful!
📁 APK saved to: ./dist/myrecipeapp-production.apk
```

## Option 2: Build with EAS Cloud

For automated builds and easier CI/CD integration:

```bash
cd MyRecipeApp

# Build on EAS servers (requires account)
eas build --platform android --profile production

# Wait for build to complete
eas build:list

# Download finished APK
eas build:download [BUILD_ID]
```

## Build Profiles

The `eas.json` includes:

- **production**: Signed APK for Play Store
- **preview**: Development/testing APK (unsigned)

## UAT Testing Steps

Once APK is built:

### 1. Install on Device

```bash
# Via adb
adb install dist/myrecipeapp-production.apk

# Or manually copy to device and tap to install
```

### 2. Core Feature Testing

- [ ] **AI Recipe Extraction**
  - [ ] Can access recipe extraction screen
  - [ ] Can paste recipe text
  - [ ] AI extracts recipe correctly
  - [ ] Feedback modal appears after extraction

- [ ] **Multi-Timer**
  - [ ] Can set multiple timers
  - [ ] Timers count down correctly
  - [ ] Timers persist in background
  - [ ] Notification fires when timer ends

- [ ] **Recipe Management**
  - [ ] Can save extracted recipes
  - [ ] Can view saved recipes
  - [ ] Can edit recipe details
  - [ ] Can delete recipes

### 3. Performance Testing

- [ ] App launches quickly
- [ ] No crashes during normal use
- [ ] Smooth navigation between screens
- [ ] Memory usage reasonable (check via Settings → Apps)

### 4. Device Compatibility

Test on multiple devices if possible:
- [ ] Android 10+
- [ ] Different screen sizes (phone, tablet)
- [ ] Different memory configurations

### 5. Crash & Error Testing

- [ ] No Force Close errors
- [ ] No ANR (Application Not Responding)
- [ ] Check Android Studio logcat for errors:

```bash
adb logcat | grep -i "error\|crash\|exception"
```

## Debugging Issues

### Build Fails

```bash
# Check detailed logs
eas build:list --verbose

# Check Expo build status
eas build:list --status failed
```

### App Crashes on Device

```bash
# View device logs
adb logcat > app_logs.txt

# Check for specific errors
grep -i "myrecipeapp\|error\|crash" app_logs.txt
```

### Permission Issues

Verify permissions in `app.json`:
- Camera permission (for recipe extraction)
- Storage permission (for saving recipes)

## Build Configuration

Key settings in `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "package": "com.cookingapp.myrecipeapp",
      "versionCode": 1,
      "adaptiveIcon": { ... }
    }
  }
}
```

## Build Optimization

Before building:

```bash
# Clean build cache
rm -rf node_modules/.cache
rm -rf .expo

# Clear Expo cache
eas build:cache:delete

# Rebuild from scratch
npm install
npm test
```

## Size Optimization

If APK size is too large:

```bash
# Analyze bundle
# Use: npm run analyze (if configured)

# Common optimizations:
# - Remove unused dependencies
# - Tree-shake unused code
# - Compress assets
```

## Next Steps

After successful UAT:

1. ✅ All core features tested
2. ✅ No crashes or errors
3. ✅ Performance acceptable
4. ✅ Ready for Play Store submission (Issue #52)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Keystore password incorrect | Verify password, regenerate if needed |
| Build timeout | Try EAS cloud build or increase timeout |
| APK too large | Remove unused dependencies, analyze bundle |
| Device won't install APK | Check Android version, enable unknown sources |
| App crashes on launch | Check logs with adb logcat, review recent changes |

## Support

- Expo Build Documentation: https://docs.expo.dev/build/setup/
- EAS Build: https://docs.expo.dev/build/introduction/
- Android Studio ADB: https://developer.android.com/studio/command-line/adb
- React Native Debugging: https://reactnative.dev/docs/debugging

---

**Related to:** Issue #51 - Build and test release APK for production
