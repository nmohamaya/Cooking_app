# MyRecipeApp - Graphics Directory

This directory contains graphics assets for Google Play Store submission.

## Files

- **GRAPHICS_SPECIFICATIONS.md** - Detailed requirements and design guidelines
- **generate_graphics.py** - Python script to generate placeholder graphics
- **app_icon_512x512.png** - App icon for Play Store
- **feature_graphic_1024x500.png** - Feature banner graphic
- **screenshot_*.png** - App screenshots for Play Store listing

## Quick Start

### Generate Placeholder Graphics

```bash
# Install dependencies (if needed)
pip install Pillow

# Generate all graphics
python graphics/generate_graphics.py
```

This creates:
- 512×512 px app icon
- 1024×500 px feature graphic
- 3 screenshots (1080×1920 px each)

**Note:** These are placeholders for testing. Use professional designs for actual submission.

### Use Professional Graphics

For production submission to Play Store:

1. **Design tools:** Canva, Figma, Adobe XD, or hire a designer
2. **Follow specifications** in GRAPHICS_SPECIFICATIONS.md
3. **Save to this directory**
4. **Upload to Play Console**

## Graphics Specifications

See **GRAPHICS_SPECIFICATIONS.md** for:
- Exact dimensions and file formats
- Design guidelines and best practices
- Color palette recommendations
- Typography suggestions
- Uploading instructions
- Quality checklist

## File Organization

```
graphics/
├── README.md (this file)
├── GRAPHICS_SPECIFICATIONS.md
├── generate_graphics.py
├── app_icon_512x512.png
├── feature_graphic_1024x500.png
├── screenshot_1_extraction_1080x1920.png
├── screenshot_2_timer_1080x1920.png
└── screenshot_3_recipes_1080x1920.png
```

## Next Steps

1. **Generate or create graphics** (see above)
2. **Review against specifications** (GRAPHICS_SPECIFICATIONS.md)
3. **Commit to repository**
4. **Upload to Play Console** (Issue #52)

## Resources

- Play Store Graphics Guide: https://support.google.com/googleplay/android-developer/answer/9866151
- Canva (free templates): https://www.canva.com
- Material Design: https://material.io/design

---

**Part of:** Issue #50 - Create app icons and graphics for Play Store
