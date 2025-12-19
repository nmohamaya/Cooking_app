# Google Play Store Graphics Requirements

## Overview

This document specifies the graphics and visual assets required for the Google Play Store listing.

## Required Graphics

### 1. App Icon (512 × 512 px)

**Specifications:**
- Dimensions: 512 × 512 pixels
- Format: PNG (transparent background) or JPEG
- File size: < 1 MB
- Safe area: Keep important content within inner 72 × 72 px square
- No text/branding text should be included
- Must be unique and distinguishable from other icons

**Design Guidelines:**
- Use MyRecipeApp brand colors (recommend: recipe-related colors - warm oranges, greens)
- Include recognizable cooking/recipe symbol
- Ensure clarity at small sizes (app drawer icon at 48×48 px)
- High contrast for visibility

**File to Upload:**
- `graphics/app_icon_512x512.png`

### 2. Feature Graphic (1024 × 500 px)

**Specifications:**
- Dimensions: 1024 × 500 pixels (landscape)
- Format: PNG or JPEG
- File size: < 1 MB
- Safe area: Keep important content 80 px away from edges
- NO app icon in the center
- Can include text and branding

**Design Guidelines:**
- Eye-catching headline text (e.g., "AI Recipe Extraction")
- Show key app features
- Use brand colors
- Professional, modern design
- Communicates app value proposition
- No app store badges or version numbers

**File to Upload:**
- `graphics/feature_graphic_1024x500.png`

### 3. Screenshots (Multiple - Required)

**Specifications:**
- Minimum: 2 screenshots (Recommended: 3-5)
- Dimensions: 
  - **Phone (preferred):** 1080 × 1920 px or 1440 × 2560 px
  - **Tablet:** 1024 × 768 px or 1024 × 1024 px
- Format: PNG or JPEG
- File size: < 1 MB each
- Aspect ratio: Maintain device screen ratio

**Requirements:**
- No app icon or ratings in screenshots
- Can include text overlays (optional)
- Should show app UI and features
- Portrait orientation for phones

**Recommended Screenshots:**

**Screenshot 1: Main Screen - Recipe Extraction**
- Show: Recipe extraction interface
- Text overlay: "AI-Powered Recipe Extraction"
- Feature: Recipe input and extraction functionality
- File: `graphics/screenshot_1_extraction_1080x1920.png`

**Screenshot 2: Multi-Timer Feature**
- Show: Multi-timer widget with multiple timers running
- Text overlay: "Multi-Timer Widget"
- Feature: Multiple active timers with labels
- File: `graphics/screenshot_2_timer_1080x1920.png`

**Screenshot 3: Recipe Management (Optional)**
- Show: Recipe list/saved recipes
- Text overlay: "Organize Your Recipes"
- Feature: Recipe collection and management
- File: `graphics/screenshot_3_recipes_1080x1920.png`

**Screenshot 4: Privacy & Security (Optional)**
- Show: Settings or privacy info
- Text overlay: "Your Data, Your Control"
- Feature: Privacy-first approach
- File: `graphics/screenshot_4_privacy_1080x1920.png`

## Color Palette (Recommended)

**Primary Colors:**
- Primary Orange: #FF6B35 (warm, cooking-related)
- Primary Green: #004E89 (fresh ingredients)
- Accent Blue: #1A7F7F (trustworthy)

**Secondary Colors:**
- Light Orange: #FFE66D (highlight)
- Light Gray: #F5F5F5 (background)
- Dark Gray: #333333 (text)

## Typography

**Font Recommendations:**
- Primary font: Roboto or Open Sans (modern, readable)
- Size: 24-48 pt for headlines, 16-20 pt for body text
- Weight: Bold for headlines, Regular for body text

## Creating Graphics

### Option 1: DIY Using Design Tools

**Tools:**
- **Canva** (free/paid) - https://www.canva.com
  - Has Play Store templates
  - Easy drag-and-drop
  - Large asset library
- **Figma** (free/paid) - https://www.figma.com
  - Professional design tool
  - Collaborative
- **Adobe XD** (free/paid)
- **GIMP** (free, open-source)
- **Photoshop** (paid)

**Steps:**
1. Open tool and create new project
2. Set dimensions per specifications above
3. Design icon, feature graphic, and screenshots
4. Export as PNG with transparent background
5. Save to `graphics/` directory

### Option 2: Hire Designer

- Fiverr, Upwork, 99designs
- Cost: $50-500+ depending on requirements
- Time: 3-7 days

### Option 3: Use Placeholder Graphics (Automated)

A Python script is provided: `generate_graphics.py`

```bash
# Install dependencies
pip install Pillow

# Generate placeholder graphics
python graphics/generate_graphics.py
```

This creates:
- `app_icon_512x512.png` - Placeholder icon
- `feature_graphic_1024x500.png` - Feature banner
- `screenshot_1_extraction_1080x1920.png` - Sample screenshots
- `screenshot_2_timer_1080x1920.png`
- `screenshot_3_recipes_1080x1920.png`

**Note:** Placeholder graphics are for testing only. Use professional designs for actual Play Store submission.

## File Organization

```
graphics/
├── README.md (this file)
├── generate_graphics.py (placeholder generator)
├── app_icon_512x512.png
├── feature_graphic_1024x500.png
├── screenshot_1_extraction_1080x1920.png
├── screenshot_2_timer_1080x1920.png
├── screenshot_3_recipes_1080x1920.png
└── screenshot_4_privacy_1080x1920.png (optional)
```

## Quality Checklist

- [ ] Icon is 512×512 px PNG
- [ ] Icon has no text overlay
- [ ] Icon is unique and distinguishable
- [ ] Feature graphic is 1024×500 px
- [ ] Feature graphic has compelling headline
- [ ] Screenshots are 1080×1920 px or 1440×2560 px
- [ ] Screenshots are in portrait orientation
- [ ] All graphics are < 1 MB each
- [ ] Graphics have good contrast and readability
- [ ] Graphics use consistent branding/colors
- [ ] Graphics don't include ratings or badges
- [ ] All graphics saved as PNG or JPEG

## Uploading to Play Store

1. Go to **Google Play Console**
2. Select **MyRecipeApp**
3. Go to **App content** → **Graphic assets**
4. **Icon:** Upload `app_icon_512x512.png`
5. **Feature graphic:** Upload `feature_graphic_1024x500.png`
6. **Screenshots:** Upload 2-5 screenshots
7. Click **Save**

## Resources

- **Play Store Graphics Guide:** https://support.google.com/googleplay/android-developer/answer/9866151
- **Design Guidelines:** https://material.io/design
- **Canva Play Store Templates:** https://www.canva.com/create/google-play-store-apps/
- **App Store Optimization:** https://www.appacademy.com/aso-guide/

---

**Next Steps:**
1. Generate or create graphics
2. Place in `graphics/` directory
3. Commit to repository
4. Update Issue #50 status
5. Ready for Play Store submission in Issue #52
