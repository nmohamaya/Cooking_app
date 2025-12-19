# Google Play Store Listing Setup Guide

## Overview

This guide walks you through entering your app content into Google Play Console for the MyRecipeApp listing.

## Prerequisites

- Google Play Developer Account (created)
- App registered in Google Play Console
- Admin access to the app listing

## Step-by-Step Instructions

### 1. Access Play Console

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Select **MyRecipeApp** from your apps list
4. Go to **App content** section (left sidebar)

### 2. Enter Basic App Information

#### 2.1 App Name and Title
- **App name:** MyRecipeApp (this is internal)
- **Display name:** MyRecipeApp (what users see)
  - Location: App content → Basic info

#### 2.2 Short Description (Max 80 characters)
1. Find **Short description** field
2. Copy from: `store_listing/short_description.txt`
3. Paste:
   ```
   AI-powered recipe extraction, multi-timer, and smart cooking companion
   ```
4. Click **Save**

**Note:** This appears under the app name in search results, so keep it compelling!

### 3. Enter Full Description (Max 4000 characters)

1. Find **Full description** field
2. Copy from: `store_listing/full_description.txt`
3. Paste the complete description (it's formatted with emojis and sections)
4. Click **Save**

**Formatting Tips:**
- Use line breaks between sections
- Use emojis to highlight features (🤖, ⏱️, 📝, etc.)
- Keep text readable and scannable
- Bold key benefits: **Feature Name**

### 4. Select Category and Type

**Category:** Select one (or most appropriate)
- **Food & Drink** (Primary - Cooking/Recipe app)
- **Lifestyle** (Secondary - Personal organization)

**App type:**
- Select: **App** (not game, not instant app)

### 5. Content Rating Questionnaire

**IMPORTANT: Complete this for app distribution!**

1. Go to **App content** section
2. Find **Ads, content rating, and more**
3. Click **Answer questionnaire**
4. Go through each question and select **NO** for all (see `content_rating_questionnaire.md`)
5. Click **Submit questionnaire**
6. Wait for Google to process (usually instant)
7. Expected result: **EVERYONE (3+)**

**Save screenshot of rating confirmation!**

### 6. Enter Target Audience

1. In **Ads, content rating, and more** section
2. Find **Target age group:**
   - Select: **Everyone** or **4 and up**
3. Content rating should now show: **Everyone** with green checkmark

### 7. Privacy Policy

**REQUIRED for Play Store!**

1. Find **Privacy policy** field
2. Paste URL:
   ```
   https://github.com/nmohamaya/Cooking_app/blob/main/docs/PRIVACY_POLICY.md
   ```
   Or if using GitHub Pages:
   ```
   https://nmohamaya.github.io/Cooking_app/privacy-policy.html
   ```
3. Click **Save**

**Verify:** Click the link to ensure privacy policy is accessible

### 8. Contact Information

1. Find **Support email** (in App content → More information)
2. Enter: `privacy@myrecipeapp.com` (or your actual support email)
3. Click **Save**

### 9. Store Listing Graphics and Screenshots

These are uploaded elsewhere (see Issue #50), but note:
- You'll need 2-5 screenshots (1080x1920 or 1440x2560)
- You'll need feature graphic (1024x500)
- You'll need icon (512x512)

### 10. Review Before Publishing

Checklist before submission:
- [ ] App title entered
- [ ] Short description entered (80 char max)
- [ ] Full description entered (4000 char max)
- [ ] Category selected (Food & Drink)
- [ ] Content rating questionnaire completed
- [ ] Rating shows: Everyone (3+) ✅
- [ ] Privacy policy URL added and verified
- [ ] Support email entered
- [ ] Screenshots uploaded (Issue #50)
- [ ] Feature graphic uploaded (Issue #50)
- [ ] App icon uploaded (Issue #50)
- [ ] All fields show green checkmarks ✅

### 11. Save All Changes

**IMPORTANT:** After making all changes:

1. Scroll to bottom
2. Click **Save changes**
3. Wait for confirmation message
4. Verify all sections show green checkmarks

## Common Issues and Solutions

### "Content rating not submitted"
- Solution: Go to "Ads, content rating, and more" → Answer questionnaire
- Complete all questions and click Submit

### "Privacy policy URL not accessible"
- Solution: Verify URL is correct and publicly accessible
- Test by opening URL in browser
- If using GitHub, make sure it's not a private repo

### "Description too long"
- Solution: Full description has 4000 character limit
- Use character counter to verify
- Remove unnecessary content if needed

### "Store listing not visible"
- Solution: Need to upload APK first (Issue #51)
- Store listing is only visible after APK upload

## After Submission

Once all content is entered:

1. **Wait for APK upload** (Issue #51)
2. **Upload release APK** to Play Store
3. **Store listing automatically publishes** after APK acceptance

## Testing Before Publishing

**Preview your store listing:**

1. In Play Console, find **Preview** option
2. View how it appears to users
3. Check:
   - All text displays correctly
   - Screenshots display properly
   - Description is readable
   - No formatting issues

## Support

For Play Store content policy questions:
- https://play.google.com/about/privacy-security-deception/
- https://play.google.com/about/developer-content-policy/
- Google Play Console Help: https://support.google.com/googleplay/

---

**Next Steps After Completing Store Listing:**
1. Issue #50: Create app icons and graphics
2. Issue #51: Build and test release APK
3. Issue #52: Submit APK to Play Store
