# Video Recipe Extraction Guide

## Overview

The MyRecipeApp now supports extracting recipes directly from cooking videos! Instead of manually typing ingredients and instructions, simply paste a video URL and let the app automatically extract the recipe data.

**Supported Platforms:**
- YouTube (standard, shorts, playlists)
- TikTok (videos, shorts)
- Instagram (reels, posts)
- Food blogs and recipe websites (AllRecipes, Food Network, Simply Recipes, etc.)

---

## Getting Started: Step-by-Step

### 1. Navigate to Add Recipe
Open the MyRecipeApp and tap the **"Add Recipe"** button to begin.

### 2. Choose Video Source
In the Add Recipe screen, you'll see two options:
- **Manual Entry** - Type recipe details manually
- **Extract from Video** - Paste a video URL

Select **"Extract from Video"**.

### 3. Paste Video URL
Paste the video URL into the input field. The app automatically detects the platform (YouTube, TikTok, Instagram, or website).

**Example URLs:**
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://vm.tiktok.com/ZMJxCqcwz/`
- `https://www.instagram.com/reel/ABC123/`
- `https://www.allrecipes.com/recipe/12345/chocolate-cake/`

### 4. Start Extraction
Tap **"Extract Recipe"** button. The app will:
1. **Download** the video
2. **Extract** audio
3. **Transcribe** speech to text
4. **Parse** recipe from transcription
5. **Display** results

Expected time: 30 seconds to 2 minutes depending on video length.

### 5. Review Extracted Recipe
Once extraction completes, you'll see:
- **Recipe Title** (extracted from video or title)
- **Ingredients** with quantities
- **Instructions** step-by-step
- **Confidence Score** (0-100%) - reliability indicator

### 6. Edit if Needed
Review the extracted data. If corrections needed:
- Tap **"Edit"** button
- Modify ingredients or instructions
- Tap **"Save Changes"**

### 7. Save Recipe
When satisfied, tap **"Save Recipe"** to add to your library.

---

## Supported Platforms

### YouTube
✅ **Fully Supported**
- Standard videos: `youtube.com/watch?v=...`
- YouTube Shorts: `youtube.com/shorts/...`
- Timestamps: `youtube.com/watch?v=...&t=123s`
- Playlists: Extracts from first video

**Best Practices:**
- Use videos with clear audio
- Avoid videos with background music over instructions
- 5-60 minute videos work best

### TikTok
✅ **Fully Supported**
- TikTok videos: `tiktok.com/@creator/video/...`
- Mobile short: `vm.tiktok.com/...`
- Desktop short: `vt.tiktok.com/...`

**Best Practices:**
- Select videos with spoken instructions
- Avoid rapid montages without narration
- 15-60 second videos work well

### Instagram
✅ **Fully Supported**
- Reels: `instagram.com/reel/...`
- Posts with video: `instagram.com/p/...`
- IGTV: `instagram.com/tv/...`

**Best Practices:**
- Use videos with captions or clear audio
- Longer content (30-60 seconds) works better
- Avoid heavy music overlays

### Food Blogs & Websites
✅ **Major Sites Supported**
- AllRecipes: `allrecipes.com/recipe/...`
- Food Network: `foodnetwork.com/recipes/...`
- Epicurious: `epicurious.com/recipes/...`
- Simply Recipes: `simplyrecipes.com/recipes/...`
- King Arthur: `kingarthurbaking.com/recipes/...`
- Bon Appétit: `bonappetitmag.com/recipe/...`
- Serious Eats: `seriouseats.com/recipes/...`

**Best Practices:**
- Copy URL from recipe page (not video)
- Website recipes are highly accurate
- Recommended for consistent results

---

## Best Practices for Best Results

### Video Selection
1. **Clear Audio** - Loud, clear voice narration required
2. **Spoken Instructions** - Written on-screen text won't be captured
3. **Continuous Recording** - Avoid heavy cuts/edits
4. **Good Lighting** - Helps with any visual metadata
5. **Complete Recipe** - Ensure video covers all ingredients and steps

### What Works Well
✅ Cooking show episodes
✅ Recipe tutorial videos
✅ Restaurant kitchen videos
✅ Educational cooking content
✅ Longer-form YouTube videos

### What Doesn't Work Well
❌ ASMR videos (too quiet)
❌ Fast-paced montages (too many cuts)
❌ Silent videos with text overlays
❌ Music videos with cooking scenes
❌ Videos with heavy background noise

---

## Understanding Confidence Scores

The app shows a **Confidence Score** (0-100%) for extracted recipes.

### Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100% | Excellent | Use as-is |
| 80-89% | Good | Minor review recommended |
| 70-79% | Fair | Review carefully before saving |
| 60-69% | Low | Edit before saving |
| <60% | Very Low | Recommend manual entry |

### What Affects Confidence?
- **Video quality** - Clear audio increases confidence
- **Completeness** - Including all ingredients and steps
- **Clarity** - Explicit instructions, not implied
- **Language** - English videos have highest confidence

---

## Editing Extracted Data

### Common Edits Needed
1. **Fix quantities** - "2 cups" might extract as "2c"
2. **Correct units** - "tablespoons" might be abbreviated
3. **Add missing items** - Some slow-spoken ingredients may be skipped
4. **Clarify instructions** - Long instructions might need paragraph breaks

### How to Edit

1. Tap **"Edit"** button after extraction
2. Modify any fields:
   - **Title** - Recipe name
   - **Servings** - Number of servings
   - **Ingredients** - List with quantities and units
   - **Instructions** - Step-by-step directions
   - **Prep Time** - Time needed before cooking
   - **Cook Time** - Time needed to cook
   - **Difficulty** - Easy, Medium, Hard

3. Tap **"Save Changes"** when done

---

## Troubleshooting

### "Invalid URL"
**Problem:** App doesn't recognize the URL format.
**Solution:** 
- Copy directly from browser address bar
- Ensure full URL (including https://)
- Check URL is for supported platform

### "Video Not Found"
**Problem:** The video is no longer available.
**Solution:**
- Verify video still exists online
- Try the video in a browser first
- Check if video is public (not private)

### "No Recipe Detected"
**Problem:** App couldn't find recipe in video.
**Solution:**
- Video may not contain recipe instructions
- Audio quality might be too poor
- Try manual entry instead
- Report the video if it should work

### "Transcription Failed"
**Problem:** Audio couldn't be transcribed.
**Solution:**
- Check internet connection
- Try a shorter video
- Ensure video has clear audio
- Wait a few minutes and retry

### "Timeout Error"
**Problem:** Extraction took too long.
**Solution:**
- Use a shorter video (under 5 minutes)
- Check internet connection
- Try again in a few minutes
- Manually enter recipe if persistent

### "Cost Limit Exceeded"
**Problem:** Daily or monthly cost limit reached.
**Solution:**
- Check your cost settings
- Wait until next day (if daily limit)
- Adjust cost limits in Settings
- Use website recipes (lower cost)

---

## Cost Information

### How Much Does It Cost?

With GitHub Copilot integration, **extraction is FREE** for most users!

**Standard Pricing** (if not using Copilot):
- $0.006 per minute of video
- 5-minute video: ~$0.03
- 30-minute video: ~$0.18
- 1-hour video: ~$0.36

**With GitHub Copilot Account:**
- **$0.00** per extraction
- Unlimited free transcriptions
- No daily/monthly limits

### Cost Management

1. **View Cost History**
   - Settings → Cost History
   - See all past extractions and costs

2. **Set Cost Alerts**
   - Settings → Cost Alerts
   - Configure daily limit (default: $50)
   - Configure monthly limit (default: $500)
   - Get notified when approaching limit

3. **Optimize Costs**
   - Use shorter videos (less cost)
   - Use website recipes (cheaper than video)
   - Cache common recipes (no re-extraction cost)
   - Trim silent parts from videos

---

## Privacy & Data Handling

### What Data Is Collected?

The app collects:
- **Video URL** - To download and process
- **Extracted Recipe Data** - Stored in your app
- **Cost Information** - For billing purposes
- **User Settings** - Preferences and limits

### What Data Is NOT Collected?

- Personal information beyond app usage
- Video content itself (only transcribed text)
- Browsing history or other apps
- Location data
- Contact information

### Data Retention

- **Video Data** - Deleted after 24 hours
- **Transcriptions** - Cached for 30 days (you can clear)
- **Cost History** - Kept indefinitely
- **Extracted Recipes** - Kept in your account

### Privacy Controls

In Settings, you can:
- Clear transcription cache
- View and delete cost history
- Control data retention periods
- Opt out of analytics

---

## FAQ

**Q: Can I extract from private YouTube videos?**
A: No, only public videos are supported. Private/unlisted videos will show an error.

**Q: How accurate is the extraction?**
A: 85-95% accurate for clear audio with complete instructions. Quality varies with video clarity.

**Q: What if the recipe has multiple parts?**
A: Some recipes may be split across multiple videos. Extract each separately and manually combine.

**Q: Can I extract offline?**
A: No, internet connection required for video processing.

**Q: How long does extraction take?**
A: Typically 30 seconds to 2 minutes depending on video length and internet speed.

**Q: Why did it miss some ingredients?**
A: If ingredients are mentioned too quickly, quietly, or without clear speech, they may be missed. Review and add manually.

**Q: Can I batch extract multiple recipes?**
A: Currently, one at a time. Plan for batch extraction in future updates.

**Q: Is the extraction deterministic?**
A: No, results may vary slightly each time due to transcription variability. Best results usually first try.

---

## Tips for Success

1. **Choose Quality Content**
   - Professional cooking shows work best
   - Clear narration over background music
   - Step-by-step instruction format

2. **Review Results**
   - Always review extracted recipe
   - Correct any obvious mistakes
   - Add missing details

3. **Use Website Recipes**
   - For well-known recipes, consider website extraction first
   - More accurate than videos
   - Lower cost

4. **Leverage Community**
   - Share successful extractions
   - Report problematic videos
   - Help improve the feature

---

## Need Help?

**In-App Support:**
- Settings → Help → Video Extraction
- FAQ section with common issues
- Contact us form for detailed help

**Online Resources:**
- Full documentation: docs/
- API documentation: backend/API_DOCUMENTATION.md
- GitHub Issues: Report bugs or request features

**Community:**
- GitHub Discussions
- User Forum
- Email: support@myrecipeapp.com

---

**Happy extracting! 🎥👨‍🍳**

Last updated: January 10, 2026
