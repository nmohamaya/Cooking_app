# Video Recipe Extraction - FAQ

## Frequently Asked Questions

### Extraction Accuracy

**Q: How accurate is the recipe extraction?**
A: We achieve 85-95% accuracy for videos with clear audio and complete instructions. Accuracy depends on:
- Video audio quality (clearest = best)
- Speech clarity (slow, clear narration = best)
- Completeness (full recipe = best)
- Language (English = highest accuracy)

Always review extracted recipes before saving, especially if confidence score < 80%.

**Q: Why did it miss some ingredients?**
A: Ingredients may be missed if:
- Mentioned too quickly (can't be transcribed)
- Mentioned too quietly (audio doesn't capture)
- Ingredient list is very long (some at edges may be missed)
- Background noise interference

**Solution:** Use the Edit function to add missing ingredients manually.

**Q: Can I improve extraction accuracy?**
A: Yes! Choose videos with:
- Clear, loud audio
- Slow, deliberate narration
- Complete ingredient lists stated clearly
- Step-by-step instructions (not implied)

Website recipes have highest accuracy (100% structured data).

---

### Platform Support

**Q: What video platforms are supported?**
A: Currently supported:
- ✅ YouTube (standard, shorts, with timestamps)
- ✅ TikTok (standard, mobile short, desktop short)
- ✅ Instagram (reels, posts, IGTV)
- ✅ Food blogs (AllRecipes, Food Network, Simply Recipes, etc.)

Not supported:
- ❌ Facebook videos
- ❌ Twitter/X videos
- ❌ Private/unlisted videos
- ❌ Age-restricted videos

**Q: Can I extract from TikTok?**
A: Yes! TikTok extraction fully supported. Copy the video URL and paste into the app.

**Q: Can I extract from Instagram Reels?**
A: Yes! Both Reels and standard Instagram videos work.

**Q: Will you support [platform] soon?**
A: We prioritize based on user requests. Vote for platform support in Settings → Feature Requests.

---

### Costs & Pricing

**Q: Is extraction free?**
A: With GitHub Copilot account: **YES, completely free!**
Without Copilot: $0.006 per minute of video
- 5-minute video: ~$0.03
- 30-minute video: ~$0.18
- 1-hour video: ~$0.36

**Q: Why is some extraction free and some costs money?**
A: Free with GitHub Copilot account integration. Standard pricing if using standard transcription API. Most users get it free!

**Q: How do I get free extraction?**
A:
1. Get GitHub Copilot account ($10/month or free for students)
2. Link your account in MyRecipeApp Settings
3. All extraction becomes free!

**Q: Can I set cost limits?**
A: Yes! Settings → Cost Management:
- Daily limit (default: $50)
- Monthly limit (default: $500)
- You'll be alerted if approaching limit

**Q: How do I view my cost history?**
A: Settings → Cost History
See all past extractions and detailed cost breakdown.

**Q: Can I reduce costs?**
A: Yes!
- Use GitHub Copilot (free!)
- Use shorter videos
- Use website recipes (no cost)
- Cache recent transcriptions (no re-extraction cost)
- Batch during off-peak hours

---

### Technical Questions

**Q: Is my video data kept?**
A:
- **Videos:** Deleted after 24 hours
- **Transcripts:** Cached for 30 days (you can clear)
- **Recipes:** Kept in your account indefinitely
- **Metadata:** Kept for analytics/improvement

**Q: Can I extract offline?**
A: No, internet connection required. We process videos on our servers.

**Q: How long does extraction take?**
A: Typical times:
- 5-minute video: 30-45 seconds
- 15-minute video: 1-2 minutes
- 30-minute video: 2-4 minutes
- 1-hour video: 4-6 minutes

Plus network delay. Faster with better internet connection.

**Q: Can I batch extract recipes?**
A: Currently one at a time. Batch extraction planned for future updates. Vote for this feature!

**Q: What if the app crashes during extraction?**
A:
- Your extraction will resume if you restart
- Job continues in background
- Check status in "Recent Extractions"
- Report crash if it happens repeatedly

---

### Video Quality

**Q: What makes a good recipe video?**
A: Best videos have:
1. **Clear Audio** - Loud, audible narration
2. **No Background Music** - Or quiet background with clear voice
3. **Step-by-Step** - Ingredients and instructions explicit
4. **Complete** - Full recipe from start to finish
5. **Professional** - Good lighting, clear speech

**Examples:**
- ✅ Tasty recipe videos
- ✅ Gordon Ramsay tutorials
- ✅ Food Network shows
- ✅ "How to..." cooking channels
- ❌ ASMR cooking (too quiet)
- ❌ Fast montages (too many cuts)
- ❌ Music videos with cooking scenes
- ❌ Silent videos with captions

**Q: Why don't ASMR cooking videos work?**
A: ASMR intentionally uses very quiet audio. Our transcription needs clearly audible speech. Choose regular cooking videos instead.

**Q: Why do fast-paced videos fail?**
A: Rapid cuts and transitions make transcription impossible. Choose videos with continuous narration.

---

### Special Scenarios

**Q: What if the recipe has multiple parts?**
A: Some recipes span multiple videos:
- Extract each video separately
- Edit individual extractions as needed
- Combine ingredients and instructions manually
- Save as single recipe in your library

**Q: Can I extract from playlist?**
A: No, playlists aren't supported. Use individual video URLs from the playlist.

**Q: What if video has multiple languages?**
A: Multilingual videos may have accuracy issues. Try extracting, but review carefully. Language mixing can confuse transcription.

**Q: Can I extract captions instead of audio?**
A: We only extract from audio narration currently. Captions alone don't provide ingredient quantities. Full implementation planned for future.

---

### Usage Limits

**Q: Is there a daily extraction limit?**
A: No hard limit, but cost limits apply:
- Daily: $50 (configurable)
- Monthly: $500 (configurable)
- Rate limit: 10 extractions per minute per user

**Q: What's the maximum video length?**
A: 1 hour maximum. Longer videos will be rejected. Use shorter videos for best results.

**Q: What's the maximum file size?**
A: 26 MB limit for downloaded files. If video larger, we compress it.

---

### Feature Requests

**Q: Can I suggest a feature?**
A: Yes! Ways to share ideas:
1. Settings → Feature Requests
2. GitHub Issues (feature label)
3. User Forum Discussions
4. Email: support@myrecipeapp.com

Features with most votes prioritized for development!

**Q: When will [feature] be available?**
A: Check Roadmap in Settings. Planned features include:
- Batch extraction (Q2 2026)
- Video preview (Q2 2026)
- Collaborative recipes (Q3 2026)
- Mobile app (Q3 2026)

---

### Getting Help

**Q: What if my problem isn't listed here?**
A: See TROUBLESHOOTING_GUIDE.md for common issues, or contact us:
- Email: support@myrecipeapp.com
- GitHub Issues: Report bugs
- User Forum: Ask community
- In-app Chat: Talk to support agent

**Q: How do I report a bug?**
A:
1. Note the video URL
2. Screenshot of error
3. Device/OS info
4. What you were trying to do
5. Share via Settings → Report Bug or GitHub Issues

**Q: Can I get personal support?**
A: Premium support plan coming soon. For now:
- Email: support@myrecipeapp.com
- Response time: 24-48 hours
- GitHub Issues: Fastest response

---

### Comparison

**Q: How does extraction compare to manual entry?**
A:
| Method | Time | Accuracy | Cost |
|--------|------|----------|------|
| Extraction | 2-5 min | 85-95% | Free-$0.36 |
| Manual | 5-10 min | 100% | $0 |
| Website copy | 1-3 min | 100% | $0 |

**Extraction is best for:** Complex recipes, interesting videos, learning new techniques
**Manual entry is best for:** Quick recipes, family recipes, simple dishes

**Q: Should I always use extraction?**
A: No. Use extraction when:
- ✅ Source is interesting video
- ✅ Complex recipe with many steps
- ✅ Want to preserve video reference
- ✅ You have time for review/editing

Use manual when:
- ✅ Simple recipe
- ✅ No video available
- ✅ Website recipe easier
- ✅ Want fastest entry

---

**Last Updated:** January 10, 2026

**Still have questions?** Contact support@myrecipeapp.com
