# Play Store & App Store Submission Checklist

**Phase 9: Documentation & Deployment**
**Last Updated:** January 10, 2026

---

## Quick Summary

| Item | Play Store | App Store | Status |
|------|-----------|-----------|--------|
| Developer Account | ✅ Required | ✅ Required | Ready |
| Build APK/IPA | ✅ | ✅ | Ready |
| Code Signing | ✅ | ✅ | Ready |
| Store Listing | ⏳ | ⏳ | In Progress |
| Screenshots | ⏳ | ⏳ | In Progress |
| Privacy Policy | ⏳ | ⏳ | In Progress |
| Estimated Approval | 2-24 hrs | 1-3 days | - |

---

## Play Store Submission Checklist

### Account Setup

- [ ] Developer Account created ($25 one-time fee)
- [ ] Payment method added
- [ ] Developer name set
- [ ] Profile photo added
- [ ] Developer website set (or leave as app link)
- [ ] Developer email configured
- [ ] Privacy policy URL prepared

**Developer Account:** https://play.google.com/console

---

### App Preparation

#### Build & Signing

- [ ] Android build successful: `./gradlew build`
- [ ] APK/AAB generated and tested
- [ ] Keystore file created and backed up
- [ ] Signing certificate fingerprints recorded
- [ ] Test build successful on device
- [ ] No compilation warnings or errors
- [ ] Proguard/R8 optimization applied
- [ ] Version code incremented
- [ ] Version name set (1.0.0)
- [ ] SDK versions correct:
  - [ ] minSdkVersion: 21
  - [ ] targetSdkVersion: 34

#### Code Quality

- [ ] All tests passing: `npm test`
- [ ] Lint errors fixed: `npm run lint`
- [ ] No critical security issues
- [ ] Performance profiled
- [ ] Battery usage acceptable
- [ ] Memory usage acceptable
- [ ] Network efficiency checked

#### Content Policy Compliance

- [ ] No malware or spyware
- [ ] No excessive ads
- [ ] No misleading screenshots
- [ ] No clickbait language
- [ ] COPPA compliance (if targeting children)
- [ ] No restricted content:
  - [ ] Violence
  - [ ] Hate speech
  - [ ] Sexual content
  - [ ] Deceptive practices

---

### Store Listing

#### App Information

- [ ] App name: "MyRecipeApp" (50 chars max)
- [ ] Short description written (80 chars max)
- [ ] Full description written (4000 chars max)
- [ ] Update notes written for release
- [ ] Category selected: "Food & Drink"
- [ ] Content rating questionnaire completed
- [ ] Privacy policy link added
- [ ] Support URL added
- [ ] Website URL added (optional)

**Character Counts:**
- App Name: 50 chars
- Short Description: 80 chars
- Full Description: 4000 chars
- Release Notes: 500 chars

#### Graphics & Media

**App Icon (512×512 PNG)**
- [ ] Created at 512×512 pixels
- [ ] PNG format (transparent background)
- [ ] No rounded corners (system adds)
- [ ] Centered logo
- [ ] File size < 1MB
- [ ] Uploaded successfully

**Feature Graphic (1024×500 PNG)**
- [ ] Created at 1024×500 pixels
- [ ] PNG or JPG format
- [ ] High quality
- [ ] Represents key features
- [ ] Text readable and on-brand
- [ ] Uploaded successfully

**Screenshots (Minimum 2, Maximum 8)**

Recommended 8 screenshots in this order:

1. **Home Screen**
   - App title visible
   - Featured recipes displayed
   - Navigation clear
   - File: `screenshot-1-home.png`

2. **Video URL Input**
   - URL input field prominent
   - Button clearly visible
   - Instructions visible
   - File: `screenshot-2-input.png`

3. **Transcription Progress**
   - Loading animation visible
   - Status messages clear
   - Progress bar visible
   - File: `screenshot-3-progress.png`

4. **Recipe Preview**
   - Recipe details visible
   - Ingredients list shown
   - Instructions visible
   - File: `screenshot-4-preview.png`

5. **Recipe Detail**
   - Full recipe displayed
   - Photos visible
   - Cooking times shown
   - File: `screenshot-5-detail.png`

6. **Saved Recipes**
   - Collection view
   - Multiple recipes shown
   - Search/filter visible
   - File: `screenshot-6-collection.png`

7. **Recipe Editing**
   - Edit form visible
   - All fields shown
   - Edit capabilities clear
   - File: `screenshot-7-edit.png`

8. **Mobile Responsive**
   - Landscape view shown
   - Responsive layout visible
   - Touch interactions visible
   - File: `screenshot-8-responsive.png`

**Screenshot Requirements:**
- Dimensions: 1440×2560 pixels (or similar 16:9 ratio)
- JPG or PNG format
- File size: < 5MB each
- No device bezels/frames
- Text clearly readable
- Showcase key features
- Show actual app, not mockups

---

### Content Policies

#### Age Ratings

Answer these for content rating:

- [ ] Violence: None
- [ ] Profanity: None
- [ ] Sexual Content: None
- [ ] Substance Use: None
- [ ] Gambling: None
- [ ] Ads or In-app Purchases: None (for now)

**Result:** "Everyone" or "Everyone 10+"

#### Privacy Policies

Privacy Policy must include:

- [ ] Data collection practices
  - [ ] What data is collected?
  - [ ] How is it used?
  - [ ] How is it stored?
- [ ] User rights
  - [ ] Right to access data
  - [ ] Right to delete data
  - [ ] Right to opt-out
- [ ] Third-party services
  - [ ] Google Analytics (if used)
  - [ ] Sentry (if used)
  - [ ] API providers
- [ ] Data security
  - [ ] Encryption methods
  - [ ] Access controls
  - [ ] Security practices
- [ ] Contact information
  - [ ] Support email
  - [ ] Privacy contact
  - [ ] Address (optional)
- [ ] GDPR/CCPA Compliance
  - [ ] EU users notice
  - [ ] California users notice
  - [ ] Data processing agreements
- [ ] Update frequency
  - [ ] Last updated date
  - [ ] Notification of changes

**Template:** See `PRIVACY_POLICY.md`

#### Advertising Policies

- [ ] No misleading claims
- [ ] Accurate feature descriptions
- [ ] Screenshots match actual app
- [ ] No fake reviews encouraged
- [ ] No deceptive pricing
- [ ] Clear in-app purchase disclosures (if any)

---

### Testing Checklist

#### Functionality Testing

- [ ] App launches without crashes
- [ ] Home screen loads correctly
- [ ] URL input accepts valid URLs
- [ ] URL validation works correctly
- [ ] Invalid URLs show error messages
- [ ] Video download works
- [ ] Audio extraction works
- [ ] Transcription completes
- [ ] Recipe extraction works
- [ ] Recipe display correct
- [ ] Recipe editing works
- [ ] Recipe saving works
- [ ] Recipe deletion works
- [ ] Search functionality works
- [ ] Filter functionality works

#### Device Testing

- [ ] Tested on Samsung devices (Play Store requirement)
- [ ] Tested on Google Pixel devices
- [ ] Tested on different screen sizes:
  - [ ] Small (4.5")
  - [ ] Medium (5.5")
  - [ ] Large (6"+)
- [ ] Tested on different Android versions:
  - [ ] Android 5.0 (minSdkVersion)
  - [ ] Android 8.0
  - [ ] Android 10
  - [ ] Android 12+
- [ ] Tested in portrait orientation
- [ ] Tested in landscape orientation
- [ ] Tested with screen rotation

#### Performance Testing

- [ ] App startup time < 2 seconds
- [ ] No lag during scrolling
- [ ] No crashes during normal use
- [ ] Memory usage stable (< 200MB)
- [ ] Battery drain acceptable
- [ ] Network requests efficient
- [ ] Offline mode works

#### Accessibility Testing

- [ ] Colors have sufficient contrast
- [ ] Text is readable (min 14sp)
- [ ] Touch targets are large (min 48dp)
- [ ] Content description labels added
- [ ] Screen reader compatible
- [ ] Keyboard navigation works

---

### Submission

#### Pre-Submission

- [ ] All checklist items completed
- [ ] App tested on physical device
- [ ] Build tested in Google Play Console internal testing
- [ ] No warning messages in Play Console
- [ ] Target audience confirmed
- [ ] Pricing set (Free)
- [ ] Distribution countries selected
- [ ] Release name set
- [ ] Release notes finalized

#### Submit for Review

1. Go to Google Play Console
2. Select your app
3. Navigate to "Release" → "Production"
4. Review all information
5. Create release
6. Upload signed APK/AAB
7. Review automatically generated sections
8. Add screenshots
9. Add store listing details
10. Review content rating
11. Accept all terms
12. Submit for review

**Expected Review Time:** 2-24 hours

---

## App Store Submission Checklist

### Account Setup

- [ ] Apple Developer Account created ($99/year)
- [ ] App Store Connect access configured
- [ ] Payment and tax forms completed
- [ ] Bank account verified
- [ ] Team ID set up
- [ ] Bundle ID created and unique
- [ ] Provisioning profiles configured
- [ ] Code signing certificates valid

**Developer Account:** https://developer.apple.com

---

### App Preparation

#### Build & Signing

- [ ] Xcode project builds successfully
- [ ] Archive created without errors
- [ ] Code signing configured correctly
- [ ] Team ID matches certificate
- [ ] Provisioning profile selected
- [ ] iOS build successfully created
- [ ] Version number set (1.0.0)
- [ ] Build number set (1)
- [ ] Min iOS deployment target: 12.0 or higher
- [ ] Bundle ID matches App Store Connect

#### Code Quality

- [ ] All tests passing: `npm test`
- [ ] No console warnings or errors
- [ ] No deprecated API usage
- [ ] Crash-free verified
- [ ] Performance optimized
- [ ] Memory leaks checked
- [ ] Battery impact minimal

#### App Store Review Guidelines

- [ ] No private APIs used
- [ ] No hardcoded credentials
- [ ] No misleading functionality
- [ ] IDFA usage disclosed (if applicable)
- [ ] Terms of service included
- [ ] Privacy policy included
- [ ] No restricted content:
  - [ ] No violence
  - [ ] No hate speech
  - [ ] No sexual content
  - [ ] No spam

---

### Store Listing

#### App Information

- [ ] App name set: "MyRecipeApp"
- [ ] Subtitle: "Extract Recipes from Videos"
- [ ] Description written (4000 chars max)
- [ ] Promotional text: "Extract recipes from your favorite cooking videos"
- [ ] Keywords set: "recipe, video, cooking, extract, youtube"
- [ ] Category selected: "Food & Drink"
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] App website URL added
- [ ] Demo video URL (optional)
- [ ] Requires login? No

#### Graphics & Media

**App Icon (1024×1024 PNG)**
- [ ] Created at 1024×1024 pixels
- [ ] PNG format with transparency
- [ ] Clean and recognizable
- [ ] No rounded corners (system adds)
- [ ] No Apple logos or confusion
- [ ] Uploaded successfully

**App Preview (Optional)**
- [ ] Video created showing app walkthrough
- [ ] 30 seconds or less
- [ ] iPhone 6.5" aspect ratio (for primary)
- [ ] MP4 format

**Screenshots (Minimum 2, Maximum 10)**

Same as Play Store (8 recommended):
1. Home screen
2. URL input
3. Transcription progress
4. Recipe preview
5. Recipe detail
6. Saved recipes
7. Recipe editing
8. Mobile features

**Screenshot Requirements for App Store:**
- Dimensions: 1284×2778 pixels (iPhone Pro Max) or 1170×2532 (iPhone 12/13)
- JPG or PNG format
- No device frames (system adds them)
- Portrait orientation only
- Show actual app screenshots

---

### Content Policies

#### Age Rating

Select rating for App Store:
- [ ] 4+ (No objectionable content)
- [ ] 12+ (Mild content)
- [ ] 17+ (Restricted content)

Result: "4+" (General Audiences)

#### Licensing

- [ ] EULA included or standard Apple EULA accepted
- [ ] Export compliance confirmed (no restrictions needed)
- [ ] Third-party content licenses documented
- [ ] Attribution requirements met

#### Advertising Identifier (IDFA)

- [ ] Does app use IDFA? No
- [ ] Does app install other apps? No
- [ ] Does app attribute purchases? No

---

### Testing Checklist

#### Device Testing

- [ ] Tested on iPhone SE (small screen)
- [ ] Tested on iPhone Pro (standard size)
- [ ] Tested on iPhone Pro Max (large screen)
- [ ] Tested on iPhone with notch/Dynamic Island
- [ ] Tested on iPad (if supporting)
- [ ] Tested on iOS 12+ (if that's your minimum)
- [ ] Tested on latest iOS version

#### iOS Specific Testing

- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Safe area insets respected
- [ ] Face ID/Touch ID compatible
- [ ] Home indicator visible (iPhone X+)
- [ ] Notch/Dynamic Island respected
- [ ] Background app refresh working
- [ ] Push notifications work (if used)
- [ ] Camera permissions working
- [ ] Photo library permissions working

#### Performance Testing

- [ ] App launches in < 2 seconds
- [ ] No hangs or freezes
- [ ] Smooth scrolling (60 FPS)
- [ ] Memory usage acceptable
- [ ] Battery drain minimal
- [ ] Network efficient
- [ ] Background tasks optimized

---

### Submission

#### Pre-Submission

- [ ] App builds and archives successfully
- [ ] All tests passing
- [ ] Code signed with production certificate
- [ ] Provisioning profile valid
- [ ] All screenshots uploaded (2-10)
- [ ] App icon ready
- [ ] App name and description finalized
- [ ] Privacy policy accessible
- [ ] Version and build numbers set
- [ ] Supported devices selected
- [ ] Supported languages selected
- [ ] Content rating completed
- [ ] Terms accepted

#### Submit for App Store Review

1. Open Xcode or App Store Connect
2. Create new app version
3. Upload build (using Xcode or Transporter)
4. Wait for build processing (10-30 minutes)
5. Add version release notes
6. Review all metadata
7. Review screenshots
8. Review app privacy
9. Review compliance
10. Submit for review

**Expected Review Time:** 1-3 days

---

## Post-Submission

### Monitoring

**First 24 Hours:**
- [ ] Monitor for crashes
- [ ] Check user reviews daily
- [ ] Monitor downloads/engagement
- [ ] Check error logs
- [ ] Monitor server logs

**First Week:**
- [ ] Response time for user feedback
- [ ] Bug fix turnaround (if needed)
- [ ] Update strategy if issues found
- [ ] Analytics review
- [ ] Performance monitoring

### Maintenance

- [ ] Plan monthly updates
- [ ] Feature releases every quarter
- [ ] Security patches as needed
- [ ] Dependency updates monthly
- [ ] User support monitoring
- [ ] App store analytics review

### Marketing

- [ ] Press release issued
- [ ] Social media announcement
- [ ] Email to users (if applicable)
- [ ] Blog post published
- [ ] Community announcement
- [ ] Influencer mentions (optional)

---

## Rejection Handling

If app is rejected:

1. **Review rejection reason** - Read Apple/Google email carefully
2. **Identify issue** - Determine what needs fixing
3. **Fix issue** - Update code or metadata
4. **Test fix** - Ensure issue is resolved
5. **Resubmit** - Upload new build with increment version code/number
6. **Communicate** - Use "Resolution" section to explain fix

**Common Rejection Reasons:**
- Crashes on startup → Fix crashes, test on device
- Misleading screenshots → Update screenshots to match actual app
- Privacy policy issue → Fix privacy policy content
- Policy violation → Review and comply with policies
- Incomplete metadata → Complete all required fields
- Performance issues → Optimize performance

---

## Checklists Summary

| Category | Play Store | App Store |
|----------|-----------|-----------|
| Account Setup | 7 items | 7 items |
| Build & Signing | 9 items | 6 items |
| Code Quality | 5 items | 6 items |
| Store Listing | 8 items | 8 items |
| Graphics | 3 files | 3 files |
| Screenshots | 8 images | 8 images |
| Content Policies | 3 items | 3 items |
| Testing | 20+ items | 20+ items |
| Submission | 11 items | 10 items |

**Total Checklist Items:** 100+

---

## Resources

- [Play Store Policies](https://support.google.com/googleplay/android-developer/answer/9888379)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Android Best Practices](https://developer.android.com/quality)
- [iOS Best Practices](https://developer.apple.com/design/tips/)

---

**Last Updated:** January 10, 2026
**Status:** Ready for Submission ✅
