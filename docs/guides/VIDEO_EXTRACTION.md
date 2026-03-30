# Video Recipe Extraction Guide

This guide covers how to extract recipes from cooking videos, troubleshoot common issues, and answers frequently asked questions.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Supported Platforms](#supported-platforms)
4. [Best Practices](#best-practices)
5. [Understanding Confidence Scores](#understanding-confidence-scores)
6. [Editing Extracted Data](#editing-extracted-data)
7. [Cost Information](#cost-information)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)
10. [Privacy and Data Handling](#privacy-and-data-handling)

---

## Overview

MyRecipeApp can extract recipes directly from cooking videos. Instead of manually typing ingredients and instructions, paste a video URL and let the app automatically extract recipe data.

**Supported platforms:**

- YouTube (standard videos, shorts, timestamps)
- TikTok (videos, mobile short links)
- Instagram (reels, posts, IGTV)
- Food blogs and recipe websites (AllRecipes, Food Network, Simply Recipes, and others)

**How it works:**

1. User pastes a video URL
2. The app downloads the video
3. Audio is extracted from the video
4. Speech is transcribed to text
5. Recipe data is parsed from the transcription
6. Structured recipe is displayed for review

---

## Getting Started

### Step 1: Navigate to Add Recipe

Open the app and tap the "Add Recipe" button.

### Step 2: Choose Video Source

Select "Extract from Video" (as opposed to Manual Entry).

### Step 3: Paste Video URL

Paste the video URL into the input field. The app automatically detects the platform.

Example URLs:

- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://vm.tiktok.com/ZMJxCqcwz/`
- `https://www.instagram.com/reel/ABC123/`
- `https://www.allrecipes.com/recipe/12345/chocolate-cake/`

### Step 4: Start Extraction

Tap "Extract Recipe". The app will download the video, extract audio, transcribe speech, and parse the recipe. Expected time: 30 seconds to 2 minutes depending on video length.

### Step 5: Review Extracted Recipe

Once extraction completes, review:

- Recipe title (extracted from video or title)
- Ingredients with quantities
- Instructions step-by-step
- Confidence score (0-100%) indicating reliability

### Step 6: Edit if Needed

If corrections are needed, tap "Edit", modify ingredients or instructions, and tap "Save Changes".

### Step 7: Save Recipe

When satisfied, tap "Save Recipe" to add it to your library.

---

## Supported Platforms

### YouTube

Fully supported URL formats:

- Standard: `youtube.com/watch?v=...`
- Shorts: `youtube.com/shorts/...`
- Shortened: `youtu.be/VIDEO_ID`
- Mobile: `m.youtube.com/watch?v=...`
- Embed: `youtube.com/embed/VIDEO_ID`
- With timestamps: `youtube.com/watch?v=...&t=123s`

Best for: 5-60 minute videos with clear audio narration.

### TikTok

Fully supported URL formats:

- Standard: `tiktok.com/@creator/video/...`
- Mobile short: `vm.tiktok.com/...`
- Desktop short: `vt.tiktok.com/...`
- Mobile: `m.tiktok.com/v/...`

Best for: 15-60 second videos with spoken instructions.

### Instagram

Fully supported URL formats:

- Reels: `instagram.com/reel/...`
- Posts with video: `instagram.com/p/...`
- IGTV: `instagram.com/tv/...`

Best for: Videos with captions or clear audio, 30-60 seconds or longer.

### Food Blogs and Websites

Major sites supported:

- AllRecipes (`allrecipes.com/recipe/...`)
- Food Network (`foodnetwork.com/recipes/...`)
- Epicurious (`epicurious.com/recipes/...`)
- Simply Recipes (`simplyrecipes.com/recipes/...`)
- King Arthur Baking (`kingarthurbaking.com/recipes/...`)
- Serious Eats (`seriouseats.com/recipes/...`)

Website recipes are highly accurate and recommended for consistent results.

### Not Supported

- Facebook videos
- Twitter/X videos
- Private or unlisted videos
- Age-restricted videos

---

## Best Practices

### Video Selection

Choose videos with:

1. Clear, loud voice narration
2. Spoken instructions (not just on-screen text)
3. Continuous recording with minimal cuts
4. Complete recipe coverage (all ingredients and steps)

### What Works Well

- Cooking show episodes
- Recipe tutorial videos with step-by-step narration
- Professional cooking content
- Longer-form YouTube videos

### What Does Not Work Well

- ASMR videos (audio too quiet for transcription)
- Fast-paced montages with many cuts
- Silent videos with text overlays only
- Music videos with cooking scenes
- Videos with heavy background noise

---

## Understanding Confidence Scores

The app shows a confidence score (0-100%) for each extracted recipe.

| Score    | Meaning   | Recommended Action                   |
|----------|-----------|--------------------------------------|
| 90-100%  | Excellent | Use as-is                            |
| 80-89%   | Good      | Minor review recommended             |
| 70-79%   | Fair      | Review carefully before saving       |
| 60-69%   | Low       | Edit before saving                   |
| Below 60% | Very Low | Consider manual entry instead        |

**Factors affecting confidence:**

- Audio quality: clear audio produces higher confidence
- Completeness: including all ingredients and steps
- Clarity: explicit instructions, not implied
- Language: English videos have the highest accuracy

---

## Editing Extracted Data

### Common Edits Needed

1. Fix quantities -- "2 cups" might extract as "2c"
2. Correct units -- "tablespoons" might be abbreviated
3. Add missing items -- quietly-mentioned ingredients may be skipped
4. Clarify instructions -- long instructions might need paragraph breaks

### How to Edit

1. Tap "Edit" after extraction
2. Modify any fields: title, servings, ingredients, instructions, prep time, cook time, difficulty
3. Tap "Save Changes"

---

## Cost Information

### Pricing

With GitHub Copilot integration, extraction is free for most users.

**With GitHub Copilot account:** $0.00 per extraction, unlimited.

**Standard pricing (without Copilot):**

- $0.006 per minute of video
- 5-minute video: approximately $0.03
- 30-minute video: approximately $0.18
- 1-hour video: approximately $0.36

### Cost Management

- View cost history: Settings > Cost History
- Set cost alerts: Settings > Cost Alerts (default daily limit: $50, monthly: $500)
- Optimize costs: use shorter videos, use website recipes, cache common recipes

---

## Troubleshooting

### "Invalid URL"

**Problem:** The app does not recognize the URL format.

**Solutions:**

- Copy the full URL from the browser address bar (must include `https://`)
- Remove tracking parameters like `?utm_source=...`
- Remove playlist parameters like `?list=...` (use the video URL, not playlist URL)
- Verify the URL is for a supported platform

Example:

```
Bad:  https://www.youtube.com/watch?v=123&list=abc&t=45s
Good: https://www.youtube.com/watch?v=123
```

### "Video Not Found"

**Problem:** The app says the video does not exist.

**Solutions:**

- Verify the video still exists by opening the URL in a browser
- Check if the video is public (not private or unlisted)
- Check regional availability (some videos are region-restricted)
- Try the full URL format instead of shortened links (e.g., use `youtube.com/watch?v=...` instead of `youtu.be/...`)
- If the video was just uploaded, wait 1-2 minutes and retry

### "Video is Private or Not Available"

**Problem:** Access denied even though you can watch the video in a browser.

**Solutions:**

- Only publicly available videos are supported
- Unlisted videos may not be extractable
- Age-restricted videos may not work
- Use a different public video of the same recipe or enter manually

### "Video is Too Long"

**Problem:** Video exceeds the maximum duration (1 hour).

**Solutions:**

- Find a shorter recipe video (5-60 minutes is ideal)
- Use YouTube Shorts or TikTok videos for shorter content
- Use a timestamp URL to start at the recipe section: `youtube.com/watch?v=VIDEO_ID&t=START_SECONDS`

### "Transcription Failed"

**Problem:** Audio transcription could not complete.

**Solutions:**

- Verify the video has clear, audible speech (not just music or silence)
- Check that the video language is supported (English, Spanish, French)
- Check your internet connection
- Try again in a few minutes (server may be temporarily overloaded)
- Try a different video with clearer audio

### "Timeout Error"

**Problem:** The request took too long to complete.

**Solutions:**

- Use a shorter video (5-10 minutes processes fastest)
- Check your internet connection (minimum 5 Mbps recommended)
- Try again during off-peak hours
- Do not refresh the page during extraction; wait for completion

### "No Recipe Detected"

**Problem:** The app completed transcription but found no recipe.

**Solutions:**

- Verify the video actually contains recipe instructions (ingredients and steps)
- Poor audio quality may result in unusable transcription
- ASMR, fast montage, and music-heavy videos will not produce recipe data
- Try website recipe extraction instead (more accurate)
- Use manual entry as a fallback

### "Cost Limit Exceeded"

**Problem:** Daily or monthly cost limit has been reached.

**Solutions:**

- View cost history in Settings > Cost History
- Adjust limits in Settings > Cost Management
- Daily limit resets at midnight; monthly limit resets on the 1st
- Use website recipes (lower cost) or wait for the limit to reset

### "Extracted Recipe Has Missing Ingredients"

**Solutions:**

- Tap "Edit" and add missing ingredients manually
- This is expected behavior -- 100% accuracy is not possible
- Choose videos with clear, slow narration for better results
- Professional cooking shows tend to produce more complete results

### "Extracted Data Has Wrong Values"

**Problem:** Quantities or units are incorrect (e.g., "2 cups" extracted as "to cups").

**Solutions:**

- Tap "Edit" and correct quantities and units
- Common transcription errors: "to" instead of "2", "tsp" instead of "tbsp", "our" instead of "hour"
- Use videos with clear speech for fewer errors

### Performance Issues

**Extraction is very slow:**

- Check internet speed
- Use shorter videos (under 10 minutes)
- TikTok and YouTube Shorts process fastest

**App crashes during extraction:**

- Close other apps to free memory
- Restart the app and try with a shorter video
- Update to the latest app version

---

## FAQ

### Extraction Accuracy

**Q: How accurate is the recipe extraction?**
A: 85-95% accuracy for videos with clear audio and complete instructions. Always review extracted recipes before saving, especially if the confidence score is below 80%.

**Q: Can I improve extraction accuracy?**
A: Choose videos with clear, loud audio, slow deliberate narration, and complete ingredient and instruction lists. Website recipes have the highest accuracy since they contain structured data.

**Q: Why did it miss some ingredients?**
A: Ingredients may be missed if mentioned too quickly, too quietly, or during background noise. Use the Edit function to add them manually.

### Platform Support

**Q: What video platforms are supported?**
A: YouTube (standard and shorts), TikTok, Instagram (reels, posts, IGTV), and major food blogs/recipe websites.

**Q: Can I extract from private YouTube videos?**
A: No. Only public videos are supported. Private and unlisted videos will produce an error.

**Q: Will you support additional platforms?**
A: Platforms are prioritized based on user requests. Vote for platform support in Settings > Feature Requests.

### Costs and Pricing

**Q: Is extraction free?**
A: With a GitHub Copilot account, extraction is completely free. Without Copilot, the cost is $0.006 per minute of video.

**Q: How do I get free extraction?**
A: Get a GitHub Copilot account ($10/month or free for students), link it in MyRecipeApp Settings, and all extraction becomes free.

**Q: Can I set cost limits?**
A: Yes. Go to Settings > Cost Management to configure daily and monthly limits.

### Technical Questions

**Q: Can I extract offline?**
A: No. An internet connection is required because video processing happens on the server.

**Q: How long does extraction take?**
A: Typical times: 5-minute video takes 30-45 seconds, 15-minute video takes 1-2 minutes, 30-minute video takes 2-4 minutes.

**Q: Can I batch extract recipes?**
A: Currently one at a time. Batch extraction is planned for a future update.

**Q: What if the app crashes during extraction?**
A: The extraction job continues in the background. Restart the app and check "Recent Extractions" for the result.

**Q: Is the extraction deterministic?**
A: No. Results may vary slightly each time due to transcription variability. Best results are usually on the first try.

### Video Quality

**Q: What makes a good recipe video for extraction?**
A: Clear and loud narration, no heavy background music, explicit step-by-step instructions, and a complete recipe from start to finish.

**Q: Why don't ASMR cooking videos work?**
A: ASMR intentionally uses very quiet audio. The transcription service requires clearly audible speech.

### Special Scenarios

**Q: What if the recipe has multiple parts across videos?**
A: Extract each video separately, then edit and combine the results manually into a single recipe.

**Q: Can I extract from a playlist?**
A: No. Use individual video URLs from the playlist.

**Q: What about videos with multiple languages?**
A: Multilingual videos may have accuracy issues. Review carefully, as language mixing can confuse transcription.

### Usage Limits

**Q: Is there a daily extraction limit?**
A: No hard limit on number of extractions, but cost limits apply (configurable in Settings).

**Q: What is the maximum video length?**
A: 1 hour. Longer videos are rejected.

### Comparison: Extraction vs. Manual Entry

| Method     | Time    | Accuracy | Cost          |
|------------|---------|----------|---------------|
| Extraction | 2-5 min | 85-95%   | Free to $0.36 |
| Manual     | 5-10 min| 100%     | Free          |
| Website    | 1-3 min | 100%     | Free          |

Use extraction for complex recipes from interesting videos. Use manual entry for simple recipes or when no video is available.

---

## Privacy and Data Handling

### Data Collected

- Video URL (to download and process)
- Extracted recipe data (stored in your app)
- Cost information (for billing)
- User settings (preferences and limits)

### Data Not Collected

- Personal information beyond app usage
- Video content itself (only transcribed text is retained)
- Browsing history
- Location or contact data

### Data Retention

- Video files: deleted after 24 hours
- Transcriptions: cached for 30 days (can be cleared manually)
- Cost history: kept indefinitely
- Extracted recipes: kept in your account

### Privacy Controls

In Settings, you can:

- Clear transcription cache
- View and delete cost history
- Control data retention periods
- Opt out of analytics

---

## Recipe Link Extraction Architecture

The extraction pipeline involves several services working together:

```
User pastes URL
    |
    v
Link Validation and Platform Detection
    |
    v
Content Extraction (platform-specific)
  - YouTube: transcript/caption extraction
  - TikTok: metadata and caption extraction
  - Instagram: reel caption and description extraction
  - Website: structured recipe data extraction
    |
    v
Text Parsing Service
  - Extract ingredients (with quantities and units)
  - Extract instructions (step-by-step)
  - Normalize units and quantities
  - Calculate confidence scores
    |
    v
Review and Edit UI
    |
    v
Save to Recipe Library
```

### Supported URL Formats

**YouTube:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

**TikTok:**
- `https://www.tiktok.com/@username/video/ID`
- `https://vt.tiktok.com/SHORTCODE/`
- `https://vm.tiktok.com/SHORTCODE/`
- `https://m.tiktok.com/v/ID`

**Instagram:**
- `https://www.instagram.com/p/POSTID/`
- `https://www.instagram.com/reel/REELID/`
- `https://www.instagram.com/reels/REELID/`

### Text Parsing Details

The parsing service extracts structured data from raw transcript text:

**Ingredient detection:** Looks for keywords like "ingredients", "you'll need", "shopping list". Parses quantities (including fractions like 1/2), units (with normalization such as "tsp" to "teaspoon"), and ingredient names.

**Instruction detection:** Looks for keywords like "instructions", "steps", "directions", "method". Splits by line breaks or step markers, extracts duration hints (e.g., "bake for 30 minutes"), and cleans up formatting.

**Confidence scoring:** Calculated per section (ingredients, instructions) based on parsing success rate, clarity, and completeness.
