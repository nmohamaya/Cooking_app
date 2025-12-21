# Google Play Store Submission Checklist - MyRecipeApp v1.0.0

## Pre-Submission Requirements

### ✅ Prerequisites Completed
- [x] Android signing keystore generated (`MyRecipeApp/cooking_app_release.keystore`)
- [x] Privacy policy created and documented (`docs/PRIVACY_POLICY.md`)
- [x] App icons and graphics created (`assets/icon.png`, `assets/adaptive-icon.png`)
- [x] Release build configuration set up (`MyRecipeApp/eas.json`)
- [x] UAT testing guide created (`docs/UAT_TESTING_GUIDE.md`)

### Google Play Developer Account
- [ ] Google Play Developer Account created
- [ ] Developer account verified and active
- [ ] Payment method set up
- [ ] Google Play Console accessible

## App Configuration Checklist

### app.json Configuration
- [x] App name: `MyRecipeApp`
- [x] Package name: `com.cookingapp.myrecipeapp`
- [x] Version: `1.0.0`
- [x] Version code: `1`
- [x] App icon path: `./assets/icon.png`
- [x] Splash screen: `./assets/splash-icon.png`
- [x] Adaptive icon: `./assets/adaptive-icon.png`

### Build Configuration
- [x] Release build profile configured in `eas.json`
- [x] Android signing configured
- [x] Release APK build instructions in `RELEASE_BUILD_GUIDE.md`

## Store Listing Content Checklist

### Text Content
- [x] App title ready (max 50 chars)
  - Location: `store_listing/app_title.txt`
  - Content: "MyRecipeApp - Smart Recipe Extraction & Cooking Assistant"
  
- [x] Short description ready (max 80 chars)
  - Location: `store_listing/short_description.txt`
  - Content: "AI-powered recipe extraction, multi-timer, and smart cooking companion"
  
- [x] Full description ready (max 4000 chars)
  - Location: `store_listing/full_description.txt`
  - Includes: Features, benefits, privacy note, call-to-action

### Privacy & Compliance
- [x] Privacy policy available
  - Location: `docs/PRIVACY_POLICY.md`
  - Must be accessible via URL before submission
  
- [x] Content rating questionnaire completed
  - Location: `store_listing/content_rating_questionnaire.md`
  - Expected rating: Everyone (3+)
  
- [x] App type: Application (not game)
- [x] Target audience: Everyone

### Category & Classification
- [x] Primary category: **Food & Drink**
- [x] Secondary category: **Lifestyle** (optional)
- [x] Content rating: **Everyone**

## Visual Assets Checklist

### Required Graphics
- [x] App icon (192x192 px minimum, preferably 512x512)
  - Location: `assets/icon.png`
  
- [x] Adaptive icon (background + foreground)
  - Location: `assets/adaptive-icon.png`
  
- [x] Feature graphic (1024x500 px)
  - Required for Play Store listing
  - Should showcase app features
  
- [x] Splash screen (optional but recommended)
  - Location: `assets/splash-icon.png`

### Screenshots (Required - at least 2 per orientation)
- [ ] Phone screenshots - Portrait orientation (min 2)
  - [ ] Home/Recipe list screen
  - [ ] Recipe creation with extraction
  - [ ] Timer/cooking screen
  - [ ] Meal plan screen
  - [ ] Shopping list screen

- [ ] Phone screenshots - Landscape orientation (optional but recommended)

**Screenshot Requirements:**
- Size: 1080x1920 pixels (9:16 aspect ratio for phone)
- Format: PNG or JPEG
- Min 2, max 8 screenshots per orientation
- Include UI elements for clarity

## Release Build Checklist

### Build Process
- [ ] Follow `RELEASE_BUILD_GUIDE.md` instructions
- [ ] Command: `eas build --platform android --build-profile release`
- [ ] Wait for build to complete
- [ ] Download signed APK/AAB from EAS

### Build Verification
- [ ] Signed APK/AAB successfully generated
- [ ] File size reasonable (< 100MB)
- [ ] Build includes all latest features:
  - [ ] Recipe extraction from links
  - [ ] Multi-timer functionality
  - [ ] Meal planning features
  - [ ] Shopping list generation
  - [ ] Feedback system

### Manual QA Testing
- [ ] Install APK on test device/emulator
- [ ] App launches successfully
- [ ] No crashes or force closes
- [ ] All main features working:
  - [ ] View recipes
  - [ ] Create new recipe
  - [ ] Extract recipe from link (YouTube, TikTok, Instagram, Blogs)
  - [ ] Multi-timer functionality
  - [ ] Meal planning
  - [ ] Shopping list generation
  - [ ] User feedback submission
- [ ] UI responsive and visually correct
- [ ] No console errors visible
- [ ] All permissions working correctly

## Google Play Console Setup

### Create App Listing
- [ ] Go to Google Play Console (https://play.google.com/console)
- [ ] Create new app
- [ ] Enter app name: "MyRecipeApp"
- [ ] Select category: "Food & Drink"
- [ ] Select type: "App"

### Enter Store Listing
- [ ] **Title**: "MyRecipeApp - Smart Recipe Extraction & Cooking Assistant"
- [ ] **Short description**: From `store_listing/short_description.txt`
- [ ] **Full description**: From `store_listing/full_description.txt`
- [ ] **Category**: Food & Drink
- [ ] **Content rating**: Complete questionnaire (should get Everyone/3+)
- [ ] **Privacy policy URL**: Link to PRIVACY_POLICY.md or hosted version
- [ ] **Contact email**: Your support email
- [ ] **Website**: GitHub repository URL (https://github.com/nmohamaya/Cooking_app)

### Upload Graphics
- [ ] **App icon** (512x512): `assets/icon.png`
- [ ] **Feature graphic** (1024x500): Feature image
- [ ] **Screenshots**: Min 2 screenshots for phone (portrait)
- [ ] **Promo graphics** (optional): For featured placement

## Content Rating Questionnaire

**All questions should be answered "NO" for this app:**
- [ ] Does your app contain violence?
  - Answer: **NO**
- [ ] Does your app contain profanity or crude humor?
  - Answer: **NO**
- [ ] Does your app contain sexual content or nudity?
  - Answer: **NO**
- [ ] Does your app have frightening or horror themes?
  - Answer: **NO**
- [ ] Does your app encourage or provide instructions for dangerous activities?
  - Answer: **NO** (cooking is not dangerous activity in Play Store context)
- [ ] Does your app contain ads?
  - Answer: **NO** (currently, no ads in app)
- [ ] Does your app contain unrestricted internet access?
  - Answer: **NO** (API calls are restricted/safe)

**Expected Result:** Everyone / 3+ rating

## Pre-Submission Verification

### Code Quality
- [ ] All tests passing: `npm test` (532/532)
- [ ] Code coverage acceptable: > 90%
- [ ] No console errors or warnings
- [ ] No hardcoded debug values
- [ ] Proper error handling throughout

### Security
- [ ] No API keys in code
- [ ] HTTPS enforced for all network calls
- [ ] User data properly handled
- [ ] Privacy policy accurately describes data usage
- [ ] No tracking/analytics without user consent

### Performance
- [ ] App launches in < 3 seconds
- [ ] No memory leaks
- [ ] Smooth scrolling and interactions
- [ ] All features responsive

### Localization
- [ ] All text in English (for global release)
- [ ] No missing translations
- [ ] Proper text encoding

## Submission Process

### Final Steps Before Submit
1. [ ] Review entire app one more time
2. [ ] Test on actual device (not just emulator)
3. [ ] Verify privacy policy is accessible
4. [ ] Double-check app title and description
5. [ ] Verify all screenshots are clear and professional

### Submit for Review
- [ ] Go to **Release → Production** in Google Play Console
- [ ] Upload signed APK/AAB file
- [ ] Review all metadata one final time
- [ ] Click **Review** button
- [ ] Click **Submit for review**

### Post-Submission
- [ ] Wait for Google's review (typically 1-3 hours, sometimes longer)
- [ ] Monitor email for review result
- [ ] Be prepared to address any issues if app is rejected
- [ ] Once approved, app goes live on Google Play Store

## Important Notes

⚠️ **Critical Points:**
1. Privacy policy must be accessible at a valid URL before submission
2. Content rating questionnaire is mandatory
3. App title and description cannot contain contact information
4. Screenshots should be actual app screenshots, not mockups
5. Ensure APK is signed and not in debug mode

⏱️ **Timeline:**
- Review typically takes 1-3 hours but can take up to 24 hours
- First submission might take longer if Google has questions
- Be available to respond to any issues quickly

📝 **Version Management:**
- Current version: 1.0.0
- Version code: 1
- Next update: Increment version to 1.0.1 and version code to 2

## Troubleshooting

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Make necessary changes
- [ ] Increment version code
- [ ] Rebuild signed APK
- [ ] Resubmit

### Common Rejection Reasons
- Missing or invalid privacy policy
- Incomplete content rating
- Low quality screenshots
- Broken app functionality
- Policy violations

### Support Resources
- Google Play Console Help: https://support.google.com/googleplay/android-developer
- App Policies: https://play.google.com/about/developer-content-policy/
- Expo Build Documentation: https://docs.expo.dev/build/setup/

## Final Checklist

Before clicking "Submit":
- [ ] All required fields filled in Play Console
- [ ] All graphics uploaded and visible
- [ ] All screenshots uploaded (min 2)
- [ ] Privacy policy URL accessible
- [ ] Content rating completed
- [ ] APK/AAB file signed and uploaded
- [ ] App tested and working
- [ ] No obvious bugs or crashes
- [ ] Metadata reviewed for typos

---

**Status:** Ready for submission ✅

**Last Updated:** 2025-12-21
**Version:** 1.0.0
**Package Name:** com.cookingapp.myrecipeapp
