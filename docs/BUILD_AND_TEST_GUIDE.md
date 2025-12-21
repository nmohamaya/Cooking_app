# Build and Test Guide for Issue #52

## Overview
This guide documents the process to build the release APK and perform manual QA testing for Google Play Store submission.

## Prerequisites Verification
- ✅ Android keystore configured (`cooking_app_release.keystore`)
- ✅ App package name: `com.cookingapp.myrecipeapp`
- ✅ Version: 1.0.0 (versionCode: 1)
- ✅ All tests passing (532/532 - 100%)
- ✅ Code coverage: 91.32%
- ✅ Security audit: 0 vulnerabilities
- ✅ Privacy policy: Approved and accessible
- ✅ Graphics assets: Complete

## Build Process

### Option 1: EAS Build (Recommended for Production)

#### Step 1: Authenticate with EAS
```bash
cd MyRecipeApp
eas login
# Enter your Expo account credentials
```

#### Step 2: Build Release APK
```bash
# Build using production profile (configured for release APK)
eas build --platform android --build-profile production
```

**Build Output:**
- APK file will be generated and available for download
- Build ID will be provided for tracking
- Build time: Typically 5-10 minutes

#### Step 3: Download the APK
- Visit https://expo.dev/builds
- Find the completed build
- Download the APK file
- Save to a secure location

### Option 2: Local Build (Alternative)

If EAS is unavailable, you can build locally:

```bash
cd MyRecipeApp
npm install

# Generate signed APK using React Native
# This requires Android SDK and Gradle installed
# For Expo projects, use:
eas build --platform android --local
```

### Build Configuration Details

**eas.json Settings:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**app.json Android Configuration:**
```json
"android": {
  "package": "com.cookingapp.myrecipeapp",
  "versionCode": 1,
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  }
}
```

**Keystore Configuration:**
- Location: `cooking_app_release.keystore`
- Alias: Set during keystore creation
- Used for signing the APK
- Required for Google Play Store submission

## APK Testing

### Test Environment Setup

#### Device/Emulator Requirements
- **Android Version:** 6.0 (API 23) or higher
- **RAM:** Minimum 2GB
- **Storage:** Minimum 500MB free space
- **Network:** WiFi or mobile data

#### Installation Steps
```bash
# Connect device via USB or use Android Emulator
adb install -r /path/to/apk/file.apk

# Or for emulator:
emulator -avd <emulator_name> -no-snapshot
adb install -r /path/to/apk/file.apk
```

### Manual QA Testing Checklist

#### 1. Application Launch & Initialization
- [ ] App launches without crashes
- [ ] Loading screen displays properly
- [ ] No error messages on startup
- [ ] App initializes all services (extraction, timer, storage)
- [ ] Welcome/onboarding screen displays correctly
- [ ] Navigation works smoothly

**Time Estimate:** 2 minutes

#### 2. Recipe Management
- [ ] Can add a recipe manually
- [ ] Can view all recipes in list
- [ ] Can view recipe details
- [ ] Can edit recipe information
- [ ] Can delete recipe
- [ ] Recipes persist after app restart
- [ ] Search functionality works
- [ ] Filters work correctly (by cuisine, difficulty, etc.)

**Time Estimate:** 5 minutes

#### 3. Recipe Link Extraction Feature
- [ ] Modal opens from AddRecipeScreen
- [ ] Can input YouTube recipe URL
- [ ] Can input TikTok recipe URL
- [ ] Can input Instagram recipe URL
- [ ] Can input blog recipe URL
- [ ] Extraction service processes URLs correctly
- [ ] Preview shows extracted recipe details
- [ ] Can confirm and save extracted recipe
- [ ] Error handling for invalid URLs
- [ ] Error handling for network issues

**Time Estimate:** 8 minutes

#### 4. Multi-Timer System
- [ ] Can add multiple timers
- [ ] Timer displays correctly
- [ ] Can set custom duration
- [ ] Timer counts down accurately
- [ ] Alarm sounds when timer ends
- [ ] Can pause timer
- [ ] Can resume timer
- [ ] Can cancel timer
- [ ] Multiple timers run simultaneously
- [ ] Timers continue in background
- [ ] Timers persist on app close

**Time Estimate:** 8 minutes

#### 5. Meal Planning
- [ ] Can access meal plan calendar
- [ ] Can select date
- [ ] Can add recipe to date
- [ ] Can view daily meal plan
- [ ] Can view weekly meal plan
- [ ] Can edit meal plan
- [ ] Can delete meal from plan
- [ ] Meal plan persists across sessions
- [ ] Navigation between weeks works

**Time Estimate:** 5 minutes

#### 6. Shopping List Generator
- [ ] Can generate shopping list from meal plan
- [ ] List includes all ingredients from selected recipes
- [ ] Can mark ingredients as purchased
- [ ] Can remove items from list
- [ ] Can add custom items
- [ ] Can clear completed items
- [ ] List persists across sessions
- [ ] Share functionality works (if available)

**Time Estimate:** 5 minutes

#### 7. User Feedback System
- [ ] Feedback form accessible
- [ ] Can enter feedback text
- [ ] Can submit feedback
- [ ] Feedback saved locally
- [ ] No crashes on feedback submission
- [ ] Confirmation message displays

**Time Estimate:** 3 minutes

#### 8. UI/UX & Navigation
- [ ] All screens load properly
- [ ] No layout issues or broken UI elements
- [ ] Text is readable
- [ ] Buttons are clickable
- [ ] Navigation between screens is smooth
- [ ] Back button works correctly
- [ ] Modal windows open/close properly
- [ ] Responsive design on different screen sizes
- [ ] Landscape orientation works (if supported)

**Time Estimate:** 5 minutes

#### 9. Performance & Stability
- [ ] App doesn't lag during operations
- [ ] No memory leaks observed
- [ ] App responds quickly to user interactions
- [ ] No unexpected crashes
- [ ] Handles rapid user interactions
- [ ] Background operations don't freeze UI
- [ ] Proper error handling throughout
- [ ] Network operations handle timeouts gracefully

**Time Estimate:** 5 minutes

#### 10. Data Persistence & Storage
- [ ] All data saves correctly to device storage
- [ ] Data retrieves properly after app restart
- [ ] Database operations are reliable
- [ ] No data corruption observed
- [ ] Cache is cleaned appropriately
- [ ] Local storage limits are respected

**Time Estimate:** 3 minutes

#### 11. Permissions & Privacy
- [ ] No unexpected permission requests
- [ ] All necessary permissions are requested
- [ ] Permissions can be granted/denied
- [ ] App functions properly with granted permissions
- [ ] Privacy policy is accessible
- [ ] Data collection complies with policy
- [ ] No sensitive data logged

**Time Estimate:** 3 minutes

#### 12. Network & Connectivity
- [ ] Works with WiFi enabled
- [ ] Works with mobile data enabled
- [ ] Handles network disconnection gracefully
- [ ] Reconnects when network restored
- [ ] Shows appropriate messages during network issues
- [ ] API calls succeed (recipe extraction services)
- [ ] Timeouts are handled properly

**Time Estimate:** 5 minutes

#### 13. Edge Cases & Error Handling
- [ ] Empty recipe list is handled
- [ ] Empty meal plan is handled
- [ ] Invalid input handling
- [ ] Large recipe titles/descriptions handled
- [ ] Special characters in recipe names work
- [ ] Very long ingredient lists handled
- [ ] Simultaneous operations don't cause conflicts
- [ ] Recovery from forced stop/restart

**Time Estimate:** 4 minutes

**Total Testing Time:** ~71 minutes (approximately 1 hour 10 minutes)

### Test Results Recording

#### Test Summary Template
```
Date: [Test Date]
Tester: [Name]
Device: [Model, Android Version]
APK Version: 1.0.0
Build: [Build ID from EAS]

Test Results:
- Total Checks: __/101
- Passed: __
- Failed: __
- Pass Rate: __%

Issues Found:
1. [Issue]: [Description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]

Critical Issues: __
High Priority Issues: __
Medium Priority Issues: __
Low Priority Issues: __

Recommendation:
- [ ] Ready for submission
- [ ] Fix issues and retest
- [ ] Major issues found - review needed
```

### Common Issues & Solutions

#### Issue: APK Installation Fails
**Solution:**
```bash
# Uninstall previous version
adb uninstall com.cookingapp.myrecipeapp

# Install fresh
adb install -r /path/to/apk/file.apk
```

#### Issue: App Crashes on Launch
**Solution:**
- Check logcat for error details: `adb logcat | grep -i "recipe\|myrecipe"`
- Verify app.json configuration
- Check permissions in AndroidManifest.xml
- Try uninstall and reinstall

#### Issue: Timer Not Working
**Solution:**
- Verify system time is set correctly
- Check if background execution is allowed
- Test on device with developer options enabled
- Check battery optimization settings

#### Issue: Recipe Extraction Fails
**Solution:**
- Verify network connectivity
- Check API endpoints are reachable
- Verify extraction services are configured
- Test with different recipe sources

#### Issue: Data Not Persisting
**Solution:**
- Check device storage availability
- Verify AsyncStorage configuration
- Check file permissions
- Look for storage write errors in logs

## Performance Benchmarks

Target metrics for release version:

### App Launch Time
- **Target:** < 3 seconds from tap to main screen
- **Critical:** Must be < 5 seconds
- **Measurement:** Use device stopwatch from app icon tap to main screen display

### Feature Response Times
- **Recipe Addition:** < 2 seconds
- **Recipe Extraction:** < 10 seconds (varies by network)
- **Timer Start:** < 1 second
- **Meal Plan Navigation:** < 1 second
- **Shopping List Generation:** < 3 seconds

### Memory Usage
- **Initial Launch:** < 150MB
- **With 50 recipes:** < 250MB
- **Critical Threshold:** < 500MB

### Battery Impact
- **Idle:** No noticeable drain
- **Timer Running:** Normal operation (1-2% per hour)
- **Background:** No battery drain when not in use

## Security Testing

### Data Privacy Checks
- [ ] No sensitive data in logs
- [ ] API keys not exposed
- [ ] No hardcoded credentials
- [ ] HTTPS used for all API calls
- [ ] Local data encrypted properly
- [ ] No data sent to unapproved servers

### Permission Verification
- [ ] Only necessary permissions requested
- [ ] Permissions match functionality
- [ ] No location tracking without permission
- [ ] No camera access without permission
- [ ] No microphone access without permission
- [ ] No contacts access without permission

### Certificate Verification
- [ ] APK properly signed with release keystore
- [ ] Signature valid and matches app identity
- [ ] No certificate warnings on Play Store

## Final Checklist Before Submission

- [ ] All manual tests passed (101 checks)
- [ ] No critical or high-priority bugs
- [ ] All performance benchmarks met
- [ ] Security testing passed
- [ ] Privacy policy verified
- [ ] Screenshots prepared (2-8 images, 1080x1920 px)
- [ ] Release notes prepared
- [ ] Version matches app.json (1.0.0)
- [ ] APK is signed correctly
- [ ] App can be installed via Google Play Store (after submission)

## Next Steps

1. **Document Results:**
   - Complete test results form
   - Screenshot each test for documentation
   - Record any issues found

2. **Fix Any Issues:**
   - Create issues for any bugs found
   - Schedule fixes for identified problems
   - Retest after fixes

3. **Prepare Submission:**
   - Ensure all tests pass
   - Screenshots ready
   - Create Google Play Console listing
   - Complete content rating questionnaire

4. **Submit to Google Play Store:**
   - Use GOOGLE_PLAY_SUBMISSION_GUIDE.md
   - Follow all steps in submission checklist
   - Monitor review process
   - Be ready for potential rejections

## Resources

- **EAS Documentation:** https://docs.expo.dev/eas/
- **Expo Build Documentation:** https://docs.expo.dev/build-reference/
- **Google Play Store Requirements:** https://play.google.com/console/about/help-center/
- **Android Testing Guide:** https://developer.android.com/training/testing
- **APK Analysis Tools:** 
  - Android Profiler (included with Android Studio)
  - Logcat (included with Android SDK)
  - APK Analyzer (Android Studio)

## Support & Troubleshooting

If you encounter issues during build or testing:

1. **Check Build Logs:** Review EAS build output for errors
2. **Review Console Logs:** Check `adb logcat` for runtime errors
3. **Verify Configuration:** Check app.json and eas.json settings
4. **Test Network:** Ensure device has internet connectivity
5. **Device Storage:** Verify sufficient storage space available
6. **Permissions:** Check device permissions settings

For detailed error messages, always check:
- `adb logcat` output
- EAS build logs
- Android device storage
- Network connectivity

---
**Document Version:** 1.0.0  
**Last Updated:** December 21, 2025  
**Status:** Ready for Testing  
**Related Issue:** #52 - Google Play Store Submission
