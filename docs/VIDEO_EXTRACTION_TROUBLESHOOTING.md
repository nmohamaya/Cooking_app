# Video Extraction Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Invalid URL" Error

**Problem:** The app displays "Invalid URL" when you try to extract from a video.

**Possible Causes:**
- URL format not recognized
- URL is incomplete or malformed
- Unsupported platform

**Solutions:**

1. **Copy URL correctly**
   - Copy the full URL from browser address bar
   - Ensure it starts with `https://`
   - Don't include query parameters like `?list=...`

2. **Check supported platforms**
   - YouTube: `youtube.com/watch?v=...` ✅
   - TikTok: `tiktok.com/@creator/video/...` ✅
   - Instagram: `instagram.com/reel/...` ✅
   - Facebook: Not supported ❌

3. **Clean up URL**
   - Remove tracking parameters: `?utm_source=...`
   - Remove timestamps: `&t=123s` (optional)
   - Remove playlists: `?list=...` (playlist URL won't work, use video URL)

**Example:**
```
❌ Bad: https://www.youtube.com/watch?v=123&list=abc&t=45s
✅ Good: https://www.youtube.com/watch?v=123&t=45s
✅ Better: https://www.youtube.com/watch?v=123
```

---

### Issue 2: "Video Not Found"

**Problem:** App says the video doesn't exist when you know it does.

**Possible Causes:**
- Video was deleted
- Video is no longer public
- URL is incorrect
- Video region-restricted

**Solutions:**

1. **Verify video still exists**
   - Open URL in browser
   - Confirm video plays in your region
   - Check if video is public (not unlisted/private)

2. **Check regional availability**
   - Some videos available only in certain countries
   - Use VPN if video not available in your region
   - Contact creator if region-restricted

3. **Try different URL format**
   - YouTube short: `youtu.be/VIDEO_ID` → use full URL instead
   - TikTok: `vm.tiktok.com/...` → try `tiktok.com/@user/video/...`

4. **Wait and retry**
   - If video was just uploaded, wait 1-2 minutes
   - Server needs time to process new videos
   - Try again in a moment

---

### Issue 3: "Video is Private or Not Available"

**Problem:** Access denied even though you can watch the video in browser.

**Possible Causes:**
- Video requires authentication
- Video is unlisted
- Private video shared with specific people
- Age-restricted content

**Solutions:**

1. **Check privacy settings**
   - Go to video and check if it's truly public
   - Unlisted videos may not be extractable
   - Only publicly available videos work

2. **Age verification**
   - Some videos require age verification
   - Try accessing in private browser window
   - Age verification may not work for extraction

3. **Alternative:**
   - Ask creator to make video public
   - Use different public video of same recipe
   - Manually enter recipe information

---

### Issue 4: "Video is Too Long"

**Problem:** "Video exceeds maximum duration (1 hour)"

**Causes:**
- Video longer than 1 hour

**Solutions:**

1. **Use shorter video**
   - Find a shorter recipe video (5-60 minutes ideal)
   - Use YouTube shorts (15-60 seconds)
   - Use TikTok videos

2. **Trim the video**
   - Download video locally
   - Use video editor to trim to relevant section
   - Upload trimmed version if creating content
   - Re-share the shorter version URL

3. **Extract key section**
   - Note the timestamp where recipe starts
   - Try `youtube.com/watch?v=VIDEO_ID&t=START_SECONDS`
   - This should start at that timestamp

---

### Issue 5: "Transcription Failed"

**Problem:** Audio transcription couldn't complete successfully.

**Possible Causes:**
- Poor audio quality
- No speech in video
- Unsupported language
- Network timeout
- Server temporarily down

**Solutions:**

1. **Check audio quality**
   - Is audio clear and loud?
   - Is there background music overpowering speech?
   - Try video with clearer audio

2. **Verify speech exists**
   - Video must have spoken narration
   - Text-only or silent videos won't work
   - Audio must be audible

3. **Check language support**
   - English, Spanish, French supported
   - Try videos in supported languages
   - Multilingual videos may have issues

4. **Network/server issues**
   - Check internet connection
   - Try again in a few minutes
   - Server may be temporarily overloaded

5. **Fallback option**
   - Manually enter recipe instead
   - Use website recipe extraction (if available)
   - Try different video source

**Example:** 
- ❌ Cooking show with heavy background music
- ✅ Cooking tutorial with clear narration

---

### Issue 6: "Timeout Error"

**Problem:** "The request took too long to complete"

**Causes:**
- Slow internet connection
- Video processing taking longer than expected
- Server temporarily slow
- Video file very large

**Solutions:**

1. **Check internet speed**
   - Need good bandwidth for video download
   - Test at speedtest.net
   - Minimum 5 Mbps recommended

2. **Use shorter video**
   - 5-10 minute videos fastest
   - Long videos (30+ min) timeout more often
   - Try TikTok (15-60 sec) or YouTube Shorts

3. **Retry after waiting**
   - Wait a few minutes
   - Server may be less busy
   - Try during off-peak hours (not 6-9 PM)

4. **Check server status**
   - Visit status page (if available)
   - Check social media for outages
   - Contact support if persistent

---

### Issue 7: "No Recipe Detected"

**Problem:** App completes transcription but says no recipe found.

**Causes:**
- Video doesn't contain recipe
- Recipe is very brief
- Audio quality too poor for transcription
- Recipe instructions incomplete

**Solutions:**

1. **Verify recipe content**
   - Does video actually contain a complete recipe?
   - Are ingredients and instructions stated?
   - Is recipe more than just ingredient list?

2. **Quality issues**
   - Poor transcription may miss recipe details
   - Video's speech too unclear
   - Background noise too loud
   - Try different video

3. **Incomplete recipe**
   - Video may only show part of recipe
   - Use manual entry to complete it
   - Combine with written recipe if available

4. **Content type**
   - ASMR videos (too quiet) won't work
   - Montage videos (too many cuts) won't work
   - Music videos with cooking scenes won't work

---

### Issue 8: "Cost Limit Exceeded"

**Problem:** "Daily/monthly cost limit has been reached"

**Causes:**
- Daily limit of $50 reached
- Monthly limit of $500 reached
- Too many extractions today

**Solutions:**

1. **View cost history**
   - Settings → Cost History
   - See breakdown of past extractions
   - Identify expensive extractions

2. **Adjust cost limits**
   - Settings → Cost Management
   - Increase daily limit (if budget allows)
   - Increase monthly limit (if budget allows)

3. **Reduce usage**
   - Use website recipes (free/cheap)
   - Batch extract later when limit resets
   - Use cache (reuse recent transcriptions)
   - Trim videos before extracting

4. **Wait for reset**
   - Daily limit resets at midnight
   - Monthly limit resets on 1st of month
   - Can extract again after reset

---

### Issue 9: "Extracted Recipe Has Missing Ingredients"

**Problem:** Some ingredients mentioned in video weren't extracted.

**Causes:**
- Audio quality issues
- Ingredients mentioned too quickly
- Ingredients mentioned quietly
- Transcription errors

**Solutions:**

1. **Edit after extraction**
   - Tap "Edit" button on extracted recipe
   - Add missing ingredients manually
   - Review quantities and units
   - Tap "Save Changes"

2. **Prevent in future**
   - Use videos with clear, slow narration
   - Avoid videos with background noise
   - Choose professional cooking shows
   - Use website recipes instead

3. **Adjust confidence score expectations**
   - 100% accuracy not possible
   - Always review extracted data
   - Edit before saving
   - This is normal!

---

### Issue 10: "Extracted Data Has Wrong Values"

**Problem:** Quantities or units are incorrect or weird.

**Examples:**
- "2 cups" extracted as "to cups"
- "tablespoons" extracted as "tsp"
- "1 hour" extracted as "one our"

**Solutions:**

1. **Edit extracted recipe**
   - Tap "Edit" button
   - Correct quantities and units
   - Fix any obvious transcription errors
   - Save corrected version

2. **Common fixes**
   - "to" or "2" → "2"
   - "tsp" or "tbsp" → standardize
   - "our" → "hour"
   - "a pinch" → "1/4 teaspoon"

3. **Prevent in future**
   - Use videos with clear speech
   - Pause at ingredient list if available
   - Use website recipes for accuracy
   - Choose professional over amateur content

---

## Performance Issues

### Issue: "Extraction is very slow"

**Solutions:**
- Check internet speed
- Use shorter video (< 10 min)
- Try during off-peak hours
- Use TikTok/Shorts (fastest)
- Wait longer, don't refresh

### Issue: "App crashes during extraction"

**Solutions:**
- Close other apps to free RAM
- Restart the app
- Try with shorter video
- Update app to latest version
- Report crash with video URL

### Issue: "Can't cancel extraction"

**Solutions:**
- Wait for cancellation to process
- Close and reopen app
- Long extractions may not be cancellable
- Report issue if stuck

---

## Data & Privacy Issues

### Issue: "Privacy concerns about video data"

**Information:**
- Videos are deleted after 24 hours
- Transcripts cached for 30 days (you can clear)
- Only metadata stored permanently
- Your recipes stay in your account
- No data sold or shared

**Control:**
- Settings → Clear Cache (remove transcripts)
- Settings → Privacy → Delete History
- Opt out of analytics (optional)

---

## Still Not Resolved?

### Get Help

1. **Check Documentation**
   - See VIDEO_RECIPE_EXTRACTION_GUIDE.md
   - Check video selection best practices
   - Review FAQ section

2. **Try Alternatives**
   - Manually enter recipe
   - Use website recipe extraction
   - Use a different video source

3. **Report Issue**
   - Contact support: support@myrecipeapp.com
   - Include video URL and error message
   - Describe what you've already tried
   - Include device/OS info

4. **Community Help**
   - GitHub Issues (for bugs)
   - User Forum (for help)
   - Discussions (for general questions)

---

**Last Updated:** January 10, 2026
