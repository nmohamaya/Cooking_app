# UAT Testing Guide for MyRecipeApp

## User Acceptance Testing (UAT) - Release Build

This guide provides step-by-step instructions for testing the release APK before Play Store submission.

## Pre-UAT Checklist

- [ ] Release APK built successfully
- [ ] APK installed on physical device(s)
- [ ] Device running Android 10 or higher
- [ ] Network connectivity available (for AI recipe extraction)
- [ ] All previous build tests passed

## Test Scenarios

### Scenario 1: AI Recipe Extraction

**Goal:** Verify AI-powered recipe extraction works correctly

**Prerequisites:** Recipe text ready for testing

**Steps:**
1. Open MyRecipeApp
2. Navigate to "Extract Recipe" screen
3. Paste sample recipe text (e.g., "Boiled Eggs: Boil water, add eggs, cook 10 minutes, remove and cool")
4. Tap "Extract" button
5. Verify recipe appears with:
   - [ ] Correct recipe name
   - [ ] All ingredients extracted
   - [ ] Cooking instructions parsed
   - [ ] Cooking time identified
6. Verify feedback modal appears asking for feedback
7. Submit feedback (positive or negative)
8. Verify recipe is saved

**Expected Result:** Recipe extracted accurately, feedback modal displayed, recipe saved successfully

**Failure Handling:** If extraction fails:
- Check network connectivity
- Review error message in app
- Check device logs: `adb logcat | grep myrecipeapp`

---

### Scenario 2: Multi-Timer Functionality

**Goal:** Verify multi-timer widget works correctly for cooking tasks

**Prerequisites:** App installed, at least 2 minutes available for testing

**Steps:**
1. Open saved recipe
2. Navigate to "Timers" section
3. Add first timer: "Simmer" for 1 minute
4. Add second timer: "Prep" for 2 minutes
5. Add third timer: "Chop" for 30 seconds
6. Tap "Start All"
7. Verify:
   - [ ] All timers count down
   - [ ] Timers display correct labels
   - [ ] Timers update simultaneously
   - [ ] Fastest timer finishes first (30s)
8. Press home button to minimize app
9. Verify timers continue running in background
10. Return to app
11. Verify timers are still counting down
12. Wait for first timer to expire
13. Verify notification appears

**Expected Result:** All timers function correctly, persist in background, notifications work

**Failure Handling:** If timers malfunction:
- Check device volume settings (for notifications)
- Check battery saver not interfering
- Review device logs for timer-related errors

---

### Scenario 3: Recipe Management

**Goal:** Verify recipe save, edit, and delete functionality

**Steps:**
1. Extract and save a recipe (from Scenario 1)
2. Navigate to "My Recipes"
3. Verify recipe appears in list
4. Tap recipe to view details
5. Tap "Edit"
6. Modify recipe (change name, add ingredient)
7. Save changes
8. Verify changes appear in list view
9. Tap recipe again to open details
10. Verify modified details are saved
11. Tap "Delete"
12. Confirm deletion
13. Verify recipe removed from list

**Expected Result:** Recipe CRUD operations work correctly, changes persist

**Failure Handling:** If any operation fails:
- Check app logs for errors
- Verify storage permissions granted
- Test on different device if possible

---

### Scenario 4: Privacy and Data Security

**Goal:** Verify privacy-first approach and data handling

**Steps:**
1. Access Privacy Policy in app (if link available)
2. Verify privacy policy link works
3. Check Settings → Privacy
4. Verify no tracking or analytics enabled
5. Delete all recipes
6. Navigate to Settings → Clear Cache
7. Verify app settings preserved but data deleted
8. Check device storage:
   ```bash
   adb shell find /data/data/com.cookingapp.myrecipeapp -type f
   ```
9. Verify no cloud sync or backup attempts

**Expected Result:** Privacy-first approach maintained, all data local only

**Failure Handling:** If unexpected network calls detected:
- Review network logs: `adb shell tcpdump`
- Check for unauthorized third-party requests
- Report security concern

---

### Scenario 5: App Stability and Performance

**Goal:** Verify app stability under normal usage

**Steps:**
1. Launch app
2. Measure launch time (should be < 3 seconds)
3. Navigate through all screens repeatedly
4. Extract multiple recipes quickly
5. Set multiple timers simultaneously
6. Edit multiple recipes
7. Monitor device logs for crashes:
   ```bash
   adb logcat | grep "FATAL\|ERROR\|ANR"
   ```
8. Check memory usage:
   ```bash
   adb shell dumpsys meminfo com.cookingapp.myrecipeapp
   ```
9. Run app for 15+ minutes continuously
10. Verify no crashes or freezes

**Expected Result:** App stable, responsive, minimal memory footprint

**Failure Handling:** If crashes occur:
- Collect full device logs
- Note exact steps to reproduce
- Report with device model and Android version

---

### Scenario 6: UI/UX and Usability

**Goal:** Verify app UI is intuitive and user-friendly

**Steps:**
1. Open app with fresh install mindset
2. Evaluate first-time user experience
3. Check all buttons are clickable and responsive
4. Verify text is readable (font size, contrast)
5. Test navigation back buttons
6. Verify error messages are clear
7. Test with device in landscape and portrait
8. Verify all features accessible from main menu

**Expected Result:** UI is intuitive, responsive, accessible

**Issues to Report:**
- Confusing navigation
- Unreadable text
- Non-responsive buttons
- Unclear error messages

---

### Scenario 7: Feature Completeness Verification

**Goal:** Verify all planned v1.0.0 features are implemented

**Checklist:**
- [ ] AI Recipe Extraction
  - [ ] Can extract from text
  - [ ] Feedback modal works
  - [ ] Feedback improves extraction

- [ ] Multi-Timer Widget
  - [ ] Can set multiple timers
  - [ ] Timers persist in background
  - [ ] Notifications work

- [ ] Recipe Management
  - [ ] Can save recipes
  - [ ] Can edit recipes
  - [ ] Can delete recipes
  - [ ] Can view recipe list

- [ ] Privacy & Security
  - [ ] Data stored locally only
  - [ ] No unauthorized network calls
  - [ ] Privacy policy accessible

- [ ] Stability
  - [ ] No crashes
  - [ ] No performance issues
  - [ ] Handles errors gracefully

---

## Issue Reporting Template

If you find an issue during UAT:

```
**Bug Report:**
Title: [Clear, concise title]

**Device:**
- Model: [Device model]
- Android Version: [e.g., 12, 13]
- App Version: 1.0.0

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Expected result]
4. [Actual result]

**Logs:**
[Relevant error messages from `adb logcat`]

**Attachment:**
[Screenshot if applicable]
```

---

## Test Sign-Off

Once all scenarios pass:

- [ ] All core features tested
- [ ] No critical bugs found
- [ ] No crashes or ANRs
- [ ] Performance acceptable
- [ ] Privacy verified
- [ ] UI/UX satisfactory
- [ ] Ready for Play Store submission

**Tester Name:** _______________
**Date:** _______________
**Notes:** _______________

---

**Ready for Play Store Submission (Issue #52)**
