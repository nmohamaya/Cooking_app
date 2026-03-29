# Google Play Store Submission Guide

## Overview

Step-by-step guide for submitting MyRecipeApp to the Google Play Store, including all checklists and requirements.

**Estimated time:** 30-45 minutes (excluding review wait time)

---

## Prerequisites

### Google Play Developer Account

- [ ] Developer account created and verified ($25 one-time fee)
- [ ] Payment method on file
- [ ] Developer name and profile configured
- [ ] Developer email set
- [ ] Google Play Console accessible: https://play.google.com/console

### App Configuration

- [ ] App name: `MyRecipeApp`
- [ ] Package name: `com.cookingapp.myrecipeapp`
- [ ] Version: `1.0.0`
- [ ] Version code: `1`
- [ ] App icon path: `./assets/icon.png`
- [ ] Splash screen: `./assets/splash-icon.png`
- [ ] Adaptive icon: `./assets/adaptive-icon.png`
- [ ] Android signing keystore generated (`MyRecipeApp/cooking_app_release.keystore`)
- [ ] Release build profile configured in `eas.json`

### Release Build

- [ ] Follow `RELEASE_BUILD_GUIDE.md` instructions
- [ ] Command: `eas build --platform android --build-profile release`
- [ ] Signed APK/AAB successfully generated
- [ ] File size reasonable (< 100MB)
- [ ] SDK versions correct (minSdkVersion: 21, targetSdkVersion: 34)

---

## Store Listing Content

### Text Content

**App title** (max 50 chars):
- Source: `store_listing/app_title.txt`
- Content: "MyRecipeApp - Smart Recipe Extraction & Cooking Assistant"

**Short description** (max 80 chars):
- Source: `store_listing/short_description.txt`
- Content: "AI-powered recipe extraction, multi-timer, and smart cooking companion"

**Full description** (max 4000 chars):
- Source: `store_listing/full_description.txt`
- Includes features, benefits, privacy note, and call-to-action

**Release notes** (max 500 chars):
- Highlight initial release features: AI extraction, multi-timer, meal planning, shopping lists

### Visual Assets

**App icon (512x512 PNG)**
- [ ] Source: `assets/icon.png`
- [ ] Centered logo, no rounded corners (system adds them)
- [ ] File size < 1MB

**Feature graphic (1024x500 PNG)**
- [ ] Showcases key features
- [ ] Text readable and on-brand

**Adaptive icon**
- [ ] Source: `assets/adaptive-icon.png`
- [ ] Background and foreground layers configured

**Screenshots (minimum 2, maximum 8 per orientation)**

Recommended order:
1. Home screen / recipe list
2. Video URL input and extraction
3. Transcription progress
4. Recipe preview with ingredients
5. Recipe detail view
6. Saved recipes collection
7. Recipe editing
8. Meal planning or shopping list

Screenshot requirements:
- Dimensions: 1080x1920 pixels (9:16 aspect ratio) or 1440x2560 (16:9)
- Format: PNG or JPEG
- File size < 5MB each
- Use actual app screenshots, not mockups
- No device bezels or frames
- Text must be clearly readable

---

## Content Rating

Complete the content rating questionnaire in Google Play Console. All answers should be "NO" for this app:

- [ ] Violence: NO
- [ ] Profanity or crude humor: NO
- [ ] Sexual content or nudity: NO
- [ ] Frightening or horror themes: NO
- [ ] Dangerous activities: NO
- [ ] Ads or in-app purchases: NO
- [ ] Unrestricted internet access: NO

**Expected result:** Everyone (3+)

---

## Privacy and Compliance

### Privacy Policy

- [ ] Privacy policy created (`docs/PRIVACY_POLICY.md`)
- [ ] Hosted at an accessible URL

  Option A (GitHub raw):
  ```
  https://github.com/nmohamaya/Cooking_app/blob/main/docs/PRIVACY_POLICY.md
  ```

  Option B (GitHub Pages):
  ```
  https://nmohamaya.github.io/Cooking_app/privacy-policy.html
  ```

- [ ] URL verified accessible in a browser

Privacy policy must cover:
- [ ] What data is collected and how it is used
- [ ] How data is stored and secured
- [ ] User rights (access, delete, opt-out)
- [ ] Third-party services used
- [ ] GDPR/CCPA compliance notices
- [ ] Contact information
- [ ] Last updated date

### Content Policy Compliance

- [ ] No malware or spyware
- [ ] No misleading screenshots or claims
- [ ] No clickbait language
- [ ] Screenshots match actual app behavior
- [ ] Accurate feature descriptions

---

## Pre-Submission Testing

### Code Quality

- [ ] All tests passing: `npm test` in both `MyRecipeApp/` and `backend/`
- [ ] Lint errors fixed: `npm run lint`
- [ ] Security audit clean: `npm run security`
- [ ] Expo deps aligned: `npx expo install --check`
- [ ] No hardcoded debug values
- [ ] No API keys in code
- [ ] HTTPS enforced for all network calls

### Manual QA on Device

- [ ] Install signed APK on a physical device
- [ ] App launches without crashes (< 3 seconds)
- [ ] All main features working:
  - [ ] View recipes
  - [ ] Create new recipe (manual entry)
  - [ ] Extract recipe from link (YouTube, TikTok, Instagram, blogs)
  - [ ] Multi-timer functionality
  - [ ] Meal planning
  - [ ] Shopping list generation
  - [ ] User feedback submission
- [ ] UI responsive and visually correct
- [ ] Smooth scrolling, no lag
- [ ] No console errors visible
- [ ] All permissions working correctly

### Device Coverage

- [ ] Tested on at least one Samsung device
- [ ] Tested on at least one Google Pixel device
- [ ] Tested on small (4.5"), medium (5.5"), and large (6"+) screens
- [ ] Tested on Android 8.0+ (multiple versions if possible)
- [ ] Tested in portrait and landscape orientation

### Accessibility

- [ ] Colors have sufficient contrast
- [ ] Text readable (min 14sp)
- [ ] Touch targets min 48dp
- [ ] Content description labels present
- [ ] Screen reader compatible

### Performance

- [ ] App startup < 3 seconds
- [ ] No memory leaks
- [ ] Memory usage stable (< 200MB)
- [ ] Battery drain acceptable
- [ ] Network requests efficient

---

## Step-by-Step Submission Process

### Step 1: Create App Listing

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: `MyRecipeApp`
   - Default language: English
   - App category: Food & Drink
   - App or game: App
4. Accept Declaration of Conformance
5. Click **Create app**

### Step 2: Enter Store Listing

In **App content** > **Store listing**:

1. Enter short description (from `store_listing/short_description.txt`)
2. Enter full description (from `store_listing/full_description.txt`)
3. Upload app icon (512x512)
4. Upload feature graphic (1024x500)
5. Upload phone screenshots (min 2)
6. Click **Save**

### Step 3: Complete Content Rating

1. Navigate to **App content** > **Ads, content rating, and more**
2. Click **Answer questionnaire**
3. Answer all questions (all "NO" for this app)
4. Submit questionnaire
5. Verify rating shows "Everyone (3+)"

### Step 4: Set Up Contacts and Privacy

1. Enter developer contact email
2. Enter website URL: `https://github.com/nmohamaya/Cooking_app`
3. Enter privacy policy URL
4. Verify privacy policy URL is accessible
5. Click **Save**

### Step 5: Configure Release

1. Navigate to **Releases** > **Production**
2. Click **Edit release** or **Create new release**
3. Upload signed APK/AAB file
4. Wait for Google to validate the upload
5. Add release notes for version 1.0.0
6. Click **Save**

### Step 6: Set Distribution

- [ ] Pricing set: Free
- [ ] Distribution countries selected
- [ ] Target audience confirmed

### Step 7: Final Review

Before submitting, verify:

- [ ] App title is clear and accurate
- [ ] Short description is compelling (max 80 chars)
- [ ] Full description is complete
- [ ] App icon is clear and visible
- [ ] Feature graphic is professional
- [ ] Screenshots are clear (min 2)
- [ ] Privacy policy URL is accessible
- [ ] Content rating shows "Everyone"
- [ ] APK/AAB is uploaded and validated
- [ ] No missing required fields (marked with *)
- [ ] All text is in English, no typos
- [ ] Category is correct (Food & Drink)
- [ ] No red error or warning messages in Console

### Step 8: Submit for Review

1. Click **Review** button
2. Verify the summary screen
3. Click **Submit for review**
4. Note the submission time

**Review timeline:**
- Fast: 1-3 hours
- Standard: 3-24 hours
- Slower: up to 3 days (rare, first submissions may take longer)

---

## Post-Submission

### Monitoring

**First 24 hours:**
- [ ] Check email for review result from Google
- [ ] Check Play Console > Releases > Production for status
- [ ] Be prepared to address rejection issues quickly

**After approval:**
- [ ] Search for app on Play Store and download it
- [ ] Test the production build on a real device
- [ ] Monitor downloads via Play Console dashboard
- [ ] Monitor crash reports via Play Console
- [ ] Respond to user reviews

### Ongoing Maintenance

- [ ] Plan monthly dependency updates
- [ ] Fix bugs from user feedback promptly
- [ ] Quarterly feature releases
- [ ] Security patches as needed
- [ ] Monitor app store analytics

---

## Handling Rejection

### Process

1. Read the rejection email carefully -- Google explains the specific issue
2. Fix the issue mentioned
3. Increment version code in `MyRecipeApp/app.json`:
   ```json
   "android": {
     "versionCode": 2
   }
   ```
4. Rebuild signed APK: `eas build --platform android --build-profile release`
5. Upload new build and resubmit

### Common Rejection Reasons

| Reason | Fix |
|--------|-----|
| Missing or invalid privacy policy | Ensure URL is publicly accessible and content is complete |
| Incomplete content rating | Revisit and resubmit questionnaire |
| Low quality screenshots | Use actual app screenshots at correct dimensions |
| Broken app functionality | Fix crashes, retest on physical device |
| Policy violation | Review Google Play developer content policy |
| Misleading metadata | Update descriptions to accurately reflect features |

---

## Troubleshooting

### Privacy Policy Not Accessible

- Verify URL is correct and publicly reachable
- If using GitHub, ensure the repository is public
- If using GitHub Pages, ensure the site is built and deployed
- Test by opening the URL in an incognito browser window

### APK Upload Fails

- Ensure APK is signed with production keystore (not debug)
- Verify package name matches: `com.cookingapp.myrecipeapp`
- Ensure version code is higher than any previous release
- Try uploading AAB format instead of APK
- Check file is not corrupted (re-download from EAS if needed)

### Screenshots Rejected

- Must be exactly 1080x1920 or 1440x2560 pixels
- Format must be PNG or JPEG
- Minimum 2 screenshots required
- Must show actual app UI, not mockups

### Content Rating Shows "Unrated"

- Revisit the questionnaire and answer all required questions
- Resubmit the questionnaire
- Verify you selected "App" (not "Game") during setup
- Wait a few hours for the rating to update

### App Stuck in Review

- Normal to take up to 3 days for first submissions
- Check email for any requests from Google
- If stuck beyond 3 days, contact Google Play Support

---

## Version Management

| Release Type | Version | Version Code | Example |
|-------------|---------|-------------|---------|
| Initial release | 1.0.0 | 1 | Current |
| Bug fix | 1.0.1 | 2 | Patch |
| New feature | 1.1.0 | 3 | Minor |
| Major rewrite | 2.0.0 | 4+ | Major |

---

## Resources

- Google Play Console Help: https://support.google.com/googleplay/android-developer
- Google Play Developer Content Policy: https://play.google.com/about/developer-content-policy/
- Expo Build Documentation: https://docs.expo.dev/build/setup/
- Privacy Policy Template: `docs/PRIVACY_POLICY.md`
- Release Build Guide: `docs/guides/RELEASE_BUILD.md`

---

**Last Updated:** March 2026
**Package Name:** com.cookingapp.myrecipeapp
