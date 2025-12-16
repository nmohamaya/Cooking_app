# Recipe Extraction Testing Guide

## Test Overview
This document tracks end-to-end testing of the AI recipe extraction feature using real cooking video transcripts.

**Testing Date:** December 16, 2025  
**AI Model:** GPT-4o via GitHub Models (Free)  
**Feature:** Manual text input → AI extraction → Form population

---

## Test Transcripts

### Test 1: Simple Recipe (Chocolate Chip Cookies)
**Characteristics:**
- Clear structure with distinct ingredients and steps
- Standard American measurements
- Simple sequential instructions
- Total time mentioned (15 min prep, 10 min bake)

**Expected Extraction Quality:** ★★★★★ (Excellent)

---

### Test 2: Complex Recipe (Beef Wellington)
**Characteristics:**
- Multiple components (duxelles, prosciutto wrap, pastry)
- Professional cooking language (Gordon Ramsay style)
- Longer cooking process with cooling/resting times
- More ingredients and detailed techniques

**Expected Extraction Quality:** ★★★★☆ (Good)

---

### Test 3: Vegan Recipe (Creamy Cashew Pasta)
**Characteristics:**
- Plant-based ingredients only
- Casual, friendly tone
- Clear ingredient list and simple steps
- Quick recipe (15 min prep, 10 min cook)

**Expected Extraction Quality:** ★★★★★ (Excellent)

---

### Test 4: Precise Baking (French Macarons)
**Characteristics:**
- Gram measurements (very precise)
- Technical baking terms (macaronage, stiff peaks)
- Multiple waiting periods (30-60 min, 24 hours)
- Two-part recipe (shells + filling)

**Expected Extraction Quality:** ★★★★☆ (Good)  
**Challenge:** Handling precise measurements and technical terms

---

### Test 5: Informal Recipe (Garlic Bread)
**Characteristics:**
- Very casual language ("like 10 minutes", "whatever you got")
- Approximate measurements ("half a stick, maybe 4 tablespoons?")
- Minimal structure
- Very short transcript

**Expected Extraction Quality:** ★★★☆☆ (Fair)  
**Challenge:** Extracting from informal, vague descriptions

---

### Test 6: Incomplete Recipe (Chicken Stir Fry)
**Characteristics:**
- Missing ingredient quantities
- Vague instructions ("cook until not pink")
- No precise timings
- Missing preparation details

**Expected Extraction Quality:** ★★☆☆☆ (Poor)  
**Purpose:** Test how AI handles incomplete information

---

## Testing Procedure

### For Each Transcript:

1. **Copy the transcript** from `test-transcripts.js`
2. **Open the app** on web (http://localhost:8081)
3. **Navigate to "Add Recipe"** screen
4. **Click "Extract from Text"** button
5. **Paste the transcript** into the modal dialog
6. **Click "Extract"** and measure:
   - Response time (seconds)
   - Was extraction successful? (Yes/No)
   - Were all fields populated? (Yes/No)
7. **Review extracted data** for:
   - Title accuracy
   - Category appropriateness
   - Ingredients completeness
   - Instructions clarity
   - Prep/cook time accuracy
8. **Save the recipe** if extraction is acceptable
9. **Rate the extraction quality** (1-5 stars)
10. **Note any issues or bugs**

---

## Test Results Template

### Test 1: Chocolate Chip Cookies
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

### Test 2: Beef Wellington
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

### Test 3: Vegan Pasta
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

### Test 4: French Macarons
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

### Test 5: Garlic Bread
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

### Test 6: Incomplete Stir Fry
- **Response Time:** ___ seconds
- **Extraction Success:** ☐ Yes ☐ No
- **All Fields Populated:** ☐ Yes ☐ No
- **Title Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Ingredients Completeness:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Instructions Quality:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Time Accuracy:** ☐ Perfect ☐ Good ☐ Fair ☐ Poor
- **Overall Rating:** ☐ ★★★★★ ☐ ★★★★☆ ☐ ★★★☆☆ ☐ ★★☆☆☆ ☐ ★☆☆☆☆
- **Issues Found:**
- **Comments:**

---

## Error Handling Tests

### Test 7: Empty Input
**Procedure:** Click "Extract" with empty text field  
**Expected:** Error message displayed  
**Actual:**  
**Result:** ☐ Pass ☐ Fail

### Test 8: Non-Recipe Text
**Input:** "This is just random text that has nothing to do with cooking or recipes."  
**Expected:** Graceful handling, possibly empty fields or error  
**Actual:**  
**Result:** ☐ Pass ☐ Fail

### Test 9: Very Long Transcript
**Input:** Combine all 6 test transcripts into one  
**Expected:** Should handle or error gracefully if too long  
**Actual:**  
**Actual:**  
**Result:** ☐ Pass ☐ Fail

### Test 10: Invalid GitHub Token (Optional)
**Procedure:** Temporarily modify .env to use invalid token  
**Expected:** Clear error message about authentication  
**Actual:**  
**Result:** ☐ Pass ☐ Fail

---

## Performance Metrics

| Test | Response Time | Success Rate | Quality Rating |
|------|--------------|--------------|----------------|
| Test 1: Cookies | | | /5 |
| Test 2: Wellington | | | /5 |
| Test 3: Vegan Pasta | | | /5 |
| Test 4: Macarons | | | /5 |
| Test 5: Garlic Bread | | | /5 |
| Test 6: Incomplete | | | /5 |
| **Average** | | | /5 |

---

## Bugs and Issues Discovered

1. **Issue:** _______________  
   **Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
   **Steps to Reproduce:**  
   **Expected Behavior:**  
   **Actual Behavior:**

2. **Issue:** _______________  
   **Severity:** ☐ Critical ☐ High ☐ Medium ☐ Low  
   **Steps to Reproduce:**  
   **Expected Behavior:**  
   **Actual Behavior:**

---

## Recommendations

### Immediate Improvements Needed:
- [ ] _______________
- [ ] _______________
- [ ] _______________

### Future Enhancements:
- [ ] _______________
- [ ] _______________
- [ ] _______________

---

## Testing Completed By: __________
**Date:** __________  
**Overall Feature Status:** ☐ Ready for Production ☐ Needs Minor Fixes ☐ Needs Major Fixes
