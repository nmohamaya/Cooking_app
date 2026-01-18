# 🎬 Recipe Link Extraction Feature - Complete Issue Breakdown

## Overview

Adding capability for users to automatically extract recipe ingredients and instructions by providing links from YouTube, TikTok, Instagram, or other recipe video platforms.

### Problem Statement
Currently, users must manually type in recipe details. When recipes are shared via video links (YouTube tutorials, TikTok recipes, Instagram reels), users have to manually transcribe or copy ingredient lists and instructions, which is time-consuming and error-prone.

### Solution
When users paste a recipe link in the "Add Recipe" page, the app will:
1. Validate and parse the link (YouTube, TikTok, Instagram)
2. Extract available transcripts, captions, or video metadata
3. Parse extracted text for ingredients and instructions
4. Present extracted data to user for review/editing
5. Auto-populate recipe form with extracted information

---

## 📊 Issue Structure

**1 Epic Issue + 6 Child Issues = 7 Total Issues**

| Issue | Title | Size | Priority | Status |
|-------|-------|------|----------|--------|
| **#74** | Epic: Extract Recipe from Links | XL | P1 | Backlog |
| **#75** | Link validation & parsing service | S | P1 | Backlog |
| **#76** | YouTube transcript extraction | M | P1 | Backlog |
| **#77** | TikTok/Instagram extraction | L | P1 | Backlog |
| **#78** | Text parsing (ingredients & instructions) | M | P1 | Backlog |
| **#79** | UI integration in Add Recipe page | M | P1 | Backlog |
| **#80** | Error handling & integration testing | M | P1 | Backlog |

---

## 🏗️ Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Add Recipe Page (UI)                       │
│                      (Issue #79)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    ▼                      ▼                       ▼
┌─────────────┐    ┌────────────────┐    ┌──────────────────┐
│  Link Input │    │  Preview Modal │    │  Edit Extracted  │
│  & Validation   │    │  & Actions     │    │  Recipe Form     │
│  (Issue #75)    │    └────────────────┘    └──────────────────┘
└─────────────┘
    │
    ▼ (parsed link)
┌────────────────────────────────────────────────────────────┐
│           Content Extraction Layer                          │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│ │  YouTube     │  │  TikTok/     │  │  Fallback/       │  │
│ │  Transcripts │  │  Instagram   │  │  Manual Entry    │  │
│ │ (Issue #76)  │  │  (Issue #77) │  │  (Issue #79)     │  │
│ └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────┬──────────────────────────────────────────┘
                 │ (raw text/content)
                 ▼
        ┌────────────────────────────┐
        │   Text Parsing Service     │
        │  • Extract ingredients     │
        │  • Extract instructions    │
        │  • Normalize units         │
        │     (Issue #78)            │
        └────────────┬───────────────┘
                     │ (structured recipe)
                     ▼
        ┌────────────────────────────┐
        │   Error Handling &         │
        │   Integration Testing      │
        │     (Issue #80)            │
        └────────────────────────────┘
```

---

## 📋 Detailed Issue Breakdown

### Issue #74: Epic - Recipe Extraction from Links

**Overview**: Parent epic tracking all related issues for recipe link extraction feature.

**Acceptance Criteria**:
- [ ] All child issues created and tracked
- [ ] Services for link parsing and extraction implemented
- [ ] UI integrated into Add Recipe page
- [ ] Error handling for edge cases
- [ ] 80%+ test coverage on extraction logic
- [ ] User can successfully extract recipes from 3+ platforms
- [ ] Extracted data validation works correctly

**Supported Platforms**:
- YouTube (videos with captions/transcripts)
- TikTok (recipe videos with metadata/captions)
- Instagram (recipe reels with captions)
- Direct recipe website links (future enhancement)

---

### Issue #75: Link Validation and Parsing Service

**Size**: S (1-4 hours) | **Priority**: P1

**Description**: Create a service module to validate and parse recipe video links from multiple platforms (YouTube, TikTok, Instagram). This is the foundation for the recipe extraction feature.

**Objectives**:
- Extract metadata from URLs (platform type, video ID, etc.)
- Validate URL format for each platform
- Detect platform from URL pattern
- Handle various URL formats (short URLs, share links, etc.)
- Provide utility functions for downstream extraction services

**Acceptance Criteria**:
- [ ] `recipeExtractorService.js` created with link validation functions
- [ ] Support for YouTube URLs (standard, shortened, playlist)
- [ ] Support for TikTok URLs (standard, shortened, mobile)
- [ ] Support for Instagram URLs (reels, stories, posts)
- [ ] Returns structured metadata: `{platform, videoId, url, isValid}`
- [ ] Handles edge cases (invalid URLs, malformed links)
- [ ] 80%+ test coverage
- [ ] Unit tests verify all URL formats
- [ ] Error handling for unsupported platforms

**Functions to Create**:
```javascript
// Validate and parse link
export const parseRecipeLink = (url) => {
  // Returns: {platform, videoId, url, isValid, error?}
}

// Get platform type
export const getPlatformFromUrl = (url) => {
  // Returns: 'youtube' | 'tiktok' | 'instagram' | null
}

// Normalize URL
export const normalizeRecipeUrl = (url) => {
  // Returns: normalized URL string
}

// Validate platform-specific URL
export const validateYoutubeUrl = (url) => {
  // Returns: {isValid: boolean, videoId: string}
}

export const validateTiktokUrl = (url) => {
  // Returns: {isValid: boolean, videoId: string}
}

export const validateInstagramUrl = (url) => {
  // Returns: {isValid: boolean, postId: string}
}
```

**Supported URL Formats**:

**YouTube**:
- https://www.youtube.com/watch?v=dQw4w9WgXcQ
- https://youtu.be/dQw4w9WgXcQ
- https://www.youtube.com/embed/dQw4w9WgXcQ
- https://m.youtube.com/watch?v=dQw4w9WgXcQ

**TikTok**:
- https://www.tiktok.com/@username/video/123456789
- https://vt.tiktok.com/abc123def/
- https://m.tiktok.com/v/123456789
- https://vm.tiktok.com/abc123/

**Instagram**:
- https://www.instagram.com/p/abc123def/
- https://www.instagram.com/reel/abc123def/
- https://www.instagram.com/reels/abc123def/
- https://www.instagram.com/s/aGF1dGV1ciBkZQ==

**Test Coverage**:
- ✅ Valid YouTube URL formats (10+ variants)
- ✅ Valid TikTok URL formats (8+ variants)
- ✅ Valid Instagram URL formats (8+ variants)
- ✅ Invalid URL formats (malformed, missing IDs)
- ✅ Edge cases (empty strings, null values, non-URLs)
- ✅ URL normalization (removing query params, fragments)
- ✅ Error messages for unsupported platforms

---

### Issue #76: YouTube Transcript Extraction Service

**Size**: M (1-2 days) | **Priority**: P1

**Description**: Implement YouTube transcript/caption extraction to fetch available transcripts or auto-generated captions from recipe videos. This service will integrate with the link validation service to extract textual content from YouTube videos.

**Objectives**:
- Fetch YouTube transcripts using youtube-transcript-api or similar
- Handle auto-generated captions as fallback
- Support multiple languages (English priority, others secondary)
- Cache transcripts to avoid repeated API calls
- Return formatted transcript with timestamps (optional)

**Acceptance Criteria**:
- [ ] `youtubeExtractorService.js` created with transcript fetching
- [ ] Fetches transcripts from valid YouTube video IDs
- [ ] Returns transcript as structured text
- [ ] Handles videos without transcripts gracefully
- [ ] Supports auto-generated captions
- [ ] Returns error message for private/deleted videos
- [ ] Caches transcripts in AsyncStorage (1-hour TTL)
- [ ] 75%+ test coverage
- [ ] Handles rate limiting gracefully

**Functions to Create**:
```javascript
// Fetch YouTube transcript
export const getYoutubeTranscript = async (videoId) => {
  // Returns: {success: boolean, transcript: string, language: string, error?: string}
}

// Get available languages for video
export const getAvailableLanguages = async (videoId) => {
  // Returns: string[] (e.g., ['en', 'es', 'fr'])
}

// Fetch transcript with caching
export const getYoutubeTranscriptCached = async (videoId, language = 'en') => {
  // Returns: {transcript: string, fromCache: boolean, expiresAt: timestamp}
}

// Parse transcript with timestamps
export const parseTranscriptWithTimestamps = (transcript) => {
  // Returns: [{text: string, startTime: number, endTime: number}]
}
```

**Data Structure**:
```javascript
// Transcript response
{
  success: true,
  transcript: "Hello everyone... welcome to today's recipe... ingredients... instructions...",
  language: 'en',
  fromCache: false,
  expiresAt: 1234567890,
  videoId: 'dQw4w9WgXcQ'
}

// Or error response
{
  success: false,
  error: 'Video not found or transcripts not available',
  videoId: 'invalid123'
}
```

**Caching Strategy**:
- Store transcripts in AsyncStorage with 1-hour TTL
- Cache key: `youtube_transcript_${videoId}_${language}`
- Include timestamp for expiration checking
- Clear cache on app startup option

**Error Handling**:
- Video not found (404)
- Transcripts not available
- Private/restricted videos
- Rate limiting (429)
- Network errors
- API service unavailable

**Test Coverage**:
- ✅ Valid YouTube video ID (transcript available)
- ✅ Valid YouTube video ID (no transcript available)
- ✅ Invalid video ID (404 error)
- ✅ Private video (access denied)
- ✅ Auto-generated captions fallback
- ✅ Multiple language support
- ✅ Caching mechanism (cache hit, cache miss, expiration)
- ✅ Rate limiting graceful handling
- ✅ Network error handling

**Dependencies**:
- `youtube-transcript-api` or equivalent package
- AsyncStorage (for caching)
- Depends on: #75 (Link validation)

---

### Issue #77: TikTok and Instagram Content Extraction Service

**Size**: L (3-5 days) | **Priority**: P1

**Description**: Implement content extraction for TikTok and Instagram recipe videos. This includes extracting captions, metadata, and video descriptions to obtain recipe information. This is more challenging than YouTube as both platforms restrict API access.

**Objectives**:
- Extract metadata from TikTok video links
- Extract captions/text from Instagram reels
- Get video descriptions when available
- Handle API limitations and restrictions
- Implement web scraping as fallback (with caution)
- Return structured content similar to YouTube transcripts

**Acceptance Criteria**:
- [ ] `socialMediaExtractorService.js` created
- [ ] Extracts TikTok video metadata (title, description, captions)
- [ ] Extracts Instagram reel captions and description
- [ ] Handles rate limiting from platforms
- [ ] Returns structured data: `{success, content, error}`
- [ ] 70%+ test coverage
- [ ] Graceful fallback when API unavailable
- [ ] Error handling for private accounts/videos
- [ ] Implements retry logic with exponential backoff

**Functions to Create**:
```javascript
// Extract TikTok content
export const getTiktokRecipeContent = async (videoId) => {
  // Returns: {success: boolean, content: string, metadata: {title, author}, error?: string}
}

// Extract Instagram reel content
export const getInstagramReelContent = async (postId) => {
  // Returns: {success: boolean, content: string, metadata: {caption, author}, error?: string}
}

// Extract from social media link
export const getSocialMediaContent = async (url) => {
  // Detects platform and calls appropriate function
  // Returns: {success: boolean, content: string, platform: string, error?: string}
}

// Combine metadata and captions
export const parseSocialMediaContent = (metadata, captions) => {
  // Returns: formatted content string
}
```

**Data Structure**:
```javascript
// Social media response
{
  success: true,
  platform: 'tiktok',
  content: "Ingredients: 2 cups flour... Instructions: Mix ingredients...",
  metadata: {
    title: "Easy Recipe",
    author: "@chefname",
    description: "Try this easy recipe",
    duration: 60,
    viewCount: 1000
  },
  source: 'api' | 'scrape'
}

// Or error response
{
  success: false,
  platform: 'instagram',
  error: 'Video is private or user blocked',
  retryAfter: 60
}
```

**Error Handling**:
- Private accounts (cannot access)
- Deleted videos
- Age-restricted content
- Rate limit exceeded (429)
- API service downtime
- Invalid credentials/access tokens
- CORS issues on web platform
- Captcha/human verification required

**Alternative: Assisted Manual Extraction**

**Fallback UI Component**: If automated extraction fails, provide:
- Text input for manual transcript paste
- Option to manually add ingredients/instructions
- Copy-paste helper for user to extract content

**Test Coverage**:
- ✅ Valid TikTok video with metadata
- ✅ Valid Instagram reel with captions
- ✅ Private TikTok video (access denied)
- ✅ Private Instagram account
- ✅ Deleted videos
- ✅ Rate limiting (retry logic)
- ✅ API service downtime
- ✅ Metadata parsing
- ✅ Caption extraction
- ✅ Fallback to manual entry

**Implementation Strategy**:
- **Phase 1**: Implement TikTok content extraction
- **Phase 2**: Implement Instagram content extraction
- **Phase 3**: Fallback to manual extraction UI

---

### Issue #78: Ingredient and Instruction Parsing from Extracted Text

**Size**: M (1-2 days) | **Priority**: P1

**Description**: Create NLP/text parsing service to extract structured ingredient lists and step-by-step instructions from raw video transcripts or captions. This is critical for converting unstructured text into usable recipe data.

**Objectives**:
- Parse raw transcript text to identify ingredients section
- Extract individual ingredients with quantities and units
- Identify cooking instructions/steps
- Clean and normalize parsed data
- Handle variations in formatting (bullet points, numbered lists, etc.)
- Return structured data matching app's recipe schema

**Acceptance Criteria**:
- [ ] `recipeParsingService.js` created with parsing functions
- [ ] Extracts ingredients list from unstructured text
- [ ] Extracts cooking instructions from unstructured text
- [ ] Identifies ingredients section with 85%+ accuracy
- [ ] Identifies instructions section with 85%+ accuracy
- [ ] Normalizes quantities and units
- [ ] Handles variations: "2 cups flour", "2c flour", "2 cups of flour"
- [ ] 80%+ test coverage
- [ ] Handles edge cases (fractional amounts, ranges)
- [ ] Returns confidence scores for extracted data

**Functions to Create**:
```javascript
// Parse recipe from raw text
export const parseRecipeFromText = (rawText) => {
  // Returns: {ingredients: [], instructions: [], metadata: {confidence, issues}}
}

// Extract ingredients section
export const extractIngredientsSection = (text) => {
  // Returns: string (ingredient section text)
}

// Parse ingredient line
export const parseIngredientLine = (line) => {
  // Returns: {name: string, quantity: number, unit: string, optional: boolean}
}

// Extract instructions section
export const extractInstructionsSection = (text) => {
  // Returns: string[] (array of instruction steps)
}

// Parse individual instruction step
export const parseInstructionStep = (stepText, stepNumber) => {
  // Returns: {stepNumber: number, instruction: string, duration?: number}
}

// Normalize ingredient
export const normalizeIngredient = (ingredientObj) => {
  // Returns: normalized ingredient with standard units
}

// Clean text
export const cleanRecipeText = (text) => {
  // Removes timestamps, filler words, etc.
  // Returns: cleaned text
}
```

**Data Structure**:
```javascript
// Parsed recipe
{
  ingredients: [
    {
      name: 'flour',
      quantity: 2,
      unit: 'cups',
      optional: false,
      raw: '2 cups flour'
    },
    {
      name: 'salt',
      quantity: 0.5,
      unit: 'teaspoon',
      optional: false,
      raw: '1/2 tsp salt'
    }
  ],
  instructions: [
    {
      stepNumber: 1,
      instruction: 'Mix dry ingredients in a bowl',
      duration: null
    },
    {
      stepNumber: 2,
      instruction: 'Add wet ingredients and stir',
      duration: null
    }
  ],
  metadata: {
    confidence: 0.87,
    ingredientsConfidence: 0.92,
    instructionsConfidence: 0.82,
    issues: ['Step 5 was unclear', 'Some quantities were estimated']
  }
}
```

**Parsing Strategy**:

**Ingredients Section Detection**:
- Look for keywords: "ingredients", "you'll need", "shopping list", "what you'll need"
- Usually before instructions section
- May have subsections (dry ingredients, wet ingredients, etc.)

**Ingredients Parsing**:
- Regex patterns for quantity extraction: "2", "1/2", "2.5", "2-3"
- Unit normalization: "tsp" → "teaspoon", "c" → "cup"
- Handle compound units: "2 tablespoons", "1 cup plus 2 tablespoons"
- Identify optional: "optional", "if desired", "to taste"
- Extract ingredient name after quantity/unit

**Instructions Section Detection**:
- Look for keywords: "instructions", "steps", "directions", "method"
- Usually after ingredients
- May be numbered or bulleted

**Instructions Parsing**:
- Split by line breaks or step markers
- Remove numbering/bullets
- Extract duration hints: "bake for 30 minutes"
- Clean up formatting and extra whitespace

**Unit Normalization**:
Map variations to standard units:
- Quantity: "1/2", "half", "0.5" → 0.5
- Weight: "g" → "grams", "kg" → "kilograms", "oz" → "ounces", "lb" → "pounds"
- Volume: "tsp" → "teaspoon", "tbsp" → "tablespoon", "c", "cup" → "cup", "ml" → "milliliter", "l" → "liter"
- Count: "piece", "clove", "slice" → normalize to single term

**Confidence Scoring**:
- Overall confidence: average of subsection scores
- Ingredients confidence: based on parsing success rate
- Instructions confidence: based on clarity and completeness
- Return issues/warnings: ambiguous quantities, unclear steps, etc.

**Example Input/Output**:

**Input Transcript**:
```
Hello everyone, today we're making chocolate chip cookies!

INGREDIENTS:
- 2 and 1/4 cups all-purpose flour
- 1 teaspoon baking soda
- 1 teaspoon salt
- 1 cup butter, softened
- 3/4 cup sugar
- 3/4 cup brown sugar
- 2 large eggs, optional
- 2 teaspoons vanilla extract
- 2 cups chocolate chips

INSTRUCTIONS:
1. Preheat oven to 375°F for about 5 minutes
2. Mix flour, baking soda, and salt in a bowl
3. In separate bowl, beat butter and sugars for 2 minutes
4. Add eggs and vanilla to butter mixture
5. Gradually blend in flour mixture
6. Stir in chocolate chips
7. Bake for 9 to 11 minutes until golden
```

**Output**:
```json
{
  "ingredients": [
    {"name": "flour", "quantity": 2.25, "unit": "cups"},
    {"name": "baking soda", "quantity": 1, "unit": "teaspoon"},
    {"name": "salt", "quantity": 1, "unit": "teaspoon"},
    {"name": "butter", "quantity": 1, "unit": "cup"},
    {"name": "sugar", "quantity": 0.75, "unit": "cup"},
    {"name": "brown sugar", "quantity": 0.75, "unit": "cup"},
    {"name": "eggs", "quantity": 2, "unit": "piece", "optional": true},
    {"name": "vanilla extract", "quantity": 2, "unit": "teaspoon"},
    {"name": "chocolate chips", "quantity": 2, "unit": "cup"}
  ],
  "instructions": [
    {"stepNumber": 1, "instruction": "Preheat oven to 375°F"},
    {"stepNumber": 2, "instruction": "Mix flour, baking soda, and salt in a bowl"},
    {"stepNumber": 3, "instruction": "In separate bowl, beat butter and sugars"},
    {"stepNumber": 4, "instruction": "Add eggs and vanilla to butter mixture"},
    {"stepNumber": 5, "instruction": "Gradually blend in flour mixture"},
    {"stepNumber": 6, "instruction": "Stir in chocolate chips"},
    {"stepNumber": 7, "instruction": "Bake for 9 to 11 minutes until golden"}
  ],
  "metadata": {
    "confidence": 0.91,
    "ingredientsConfidence": 0.95,
    "instructionsConfidence": 0.87,
    "issues": []
  }
}
```

**Test Coverage**:
- ✅ Simple ingredient lists (basic format)
- ✅ Complex ingredients (multiple units, optional)
- ✅ Fractional quantities (1/2, 1/3, 2.5)
- ✅ Range quantities (2-3 cups, 1 to 2 tablespoons)
- ✅ Unit variations (c, cup, cups, tsp, tbsp, etc.)
- ✅ Ingredient with multiple words (extra virgin olive oil)
- ✅ Simple numbered instructions
- ✅ Unnumbered bulleted instructions
- ✅ Instructions with duration hints
- ✅ Messy/unformatted text
- ✅ Real YouTube transcript (full integration test)
- ✅ Edge cases (no ingredients section, no instructions)

---

### Issue #79: UI Integration in Add Recipe Page

**Size**: M (1-2 days) | **Priority**: P1

**Description**: Integrate recipe link extraction service into the existing "Add Recipe" page UI. Add UI components and workflows for users to paste recipe links, review extracted data, and confirm before saving to app.

**Objectives**:
- Add recipe link input field to Add Recipe page
- Show loading state while extracting
- Display extracted recipe preview for user review
- Allow user to edit extracted data before saving
- Handle extraction errors gracefully
- Provide fallback to manual entry
- Maintain existing manual recipe creation flow

**Acceptance Criteria**:
- [ ] Recipe link input field added to Add Recipe page
- [ ] "Extract from Link" button triggers extraction flow
- [ ] Loading indicator displays during extraction
- [ ] Extracted recipe preview shown in modal/drawer
- [ ] User can edit extracted ingredients/instructions
- [ ] Edit form pre-filled with extracted data
- [ ] Error messages clear and actionable
- [ ] Fallback to manual entry on extraction failure
- [ ] Back button cancels extraction flow
- [ ] 75%+ component test coverage
- [ ] Works on iOS, Android, Web

**UI Components to Create**:

**1. RecipeLink Input Section**

Location: Top of Add Recipe form

```javascript
<View style={styles.linkInputSection}>
  <Text style={styles.sectionTitle}>Or Extract from Link</Text>
  <TextInput
    placeholder="Paste YouTube, TikTok, or Instagram link"
    value={recipeLink}
    onChangeText={setRecipeLink}
  />
  <TouchableOpacity 
    onPress={handleExtractRecipe}
    disabled={!isValidLink}
  >
    <Text>Extract Recipe</Text>
  </TouchableOpacity>
</View>
```

**2. Extraction Loading Modal**

Shows during extraction:
- Loading spinner
- "Extracting recipe information..."
- Animated progress indicators
- Cancel button to stop extraction

**3. Recipe Preview Modal/Drawer**

Shows extracted recipe for review:
- Recipe name/title (if available)
- Extracted ingredients list with edit capability
- Extracted instructions with edit capability
- Source URL displayed
- Confidence score (if available)
- Action buttons: Cancel, Edit, Confirm

**4. Editable Recipe Form**

Extends existing recipe form:
- Pre-filled ingredients from extraction
- Pre-filled instructions from extraction
- Allow adding/removing/editing items
- Validate data before saving
- Save as new recipe

**User Workflows**:

**Workflow A: Happy Path (Successful Extraction)**
1. User opens Add Recipe page
2. User pastes recipe link in link input
3. User taps "Extract Recipe"
4. Loading modal shows "Extracting recipe..."
5. Extraction completes (2-5 seconds)
6. Preview modal shows extracted recipe
7. User reviews ingredients/instructions
8. User taps "Confirm" → confirms recipe saving
9. Recipe saved to app

**Workflow B: Editing Extracted Recipe**
1. User follows Workflow A steps 1-6
2. User notices missing/incorrect ingredient
3. User taps "Edit" button on preview modal
4. Edit form opens with extracted data
5. User adds/removes/edits items
6. User taps "Save" → saves recipe

**Workflow C: Extraction Failure**
1. User follows Workflow A steps 1-3
2. Extraction fails (video private, link invalid, etc.)
3. Error modal shows: "Could not extract recipe from this link."
4. User can: A) Try different link, B) Go back, C) Enter manually
5. User taps "Enter Manually" → closes extraction flow
6. User returns to manual recipe form

**Workflow D: Partial Extraction**
1. User extracts recipe
2. Preview shows: ⚠️ "Some data may be incomplete"
3. Confidence score: 72%
4. User can proceed with incomplete data or edit
5. User reviews and confirms

**State Management**:
```javascript
const [recipeLink, setRecipeLink] = useState('');
const [isExtracting, setIsExtracting] = useState(false);
const [extractedRecipe, setExtractedRecipe] = useState(null);
const [extractionError, setExtractionError] = useState(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [editMode, setEditMode] = useState(false);
```

**Error Handling**:

**Errors to Handle**:
- Invalid/malformed URL
- Video not found
- Video is private/restricted
- No captions/transcripts available
- Extraction API unavailable
- Network error during extraction
- Rate limited by platform
- Timeout during extraction (>30 seconds)

**Error Messages (User-Friendly)**:
- "Invalid link format. Please check and try again."
- "Video not found. Please verify the link."
- "This video is private. Try another video."
- "No captions available for this video. Please enter recipe manually."
- "Connection error. Please try again."
- "Extraction taking too long. Try again later."

**Test Coverage**:
- ✅ Valid recipe link extraction flow
- ✅ Invalid link error handling
- ✅ Video not found error
- ✅ Network error handling
- ✅ Preview modal displays extracted recipe
- ✅ User can edit extracted recipe
- ✅ User can cancel extraction
- ✅ User can fallback to manual entry
- ✅ Extracted data validation
- ✅ Save extracted recipe successfully
- ✅ Multiple platforms (YouTube, TikTok, Instagram)

**Accessibility**:
- Screen reader compatible
- Sufficient color contrast
- Touch target minimum size
- Clear button labels
- Loading state announced
- Error messages clear

---

### Issue #80: Error Handling, Integration Testing, and Refinement

**Size**: M (1-2 days) | **Priority**: P1

**Description**: Comprehensive error handling, integration testing across all extraction services, and refinement of the entire recipe extraction feature. This issue ensures robustness, reliability, and production-readiness of the recipe link extraction functionality.

**Objectives**:
- Implement comprehensive error handling across all services
- Create integration tests for complete extraction workflows
- Handle edge cases and platform-specific issues
- Implement rate limiting and retry strategies
- Add detailed logging for debugging
- Performance optimization
- Cross-platform testing (iOS, Android, Web)
- User documentation

**Acceptance Criteria**:
- [ ] All extraction services have error handling
- [ ] Integration tests for end-to-end workflows
- [ ] Edge cases handled (private videos, deleted content, rate limits)
- [ ] Retry logic with exponential backoff implemented
- [ ] Rate limiting respected on all platforms
- [ ] Logging system for debugging failures
- [ ] 80%+ test coverage for extraction pipeline
- [ ] Performance acceptable (<5s for typical extraction)
- [ ] Works on iOS, Android, Web
- [ ] User-friendly error messages
- [ ] Documentation for troubleshooting

**Error Handling**:

**Error Types**:
- Network errors (no connection, timeout)
- Platform API errors (rate limiting, service down)
- Invalid data errors (malformed URL, missing content)
- Parsing errors (unexpected text format)
- User errors (link validation failed, video private)

**Error Recovery**:
```javascript
export const extractRecipeWithRetry = async (link, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const backoffMs = options.backoffMs || 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await extractRecipe(link);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (!isRetryableError(error)) throw error;
      
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const isRetryableError = (error) => {
  // Network errors, timeouts, rate limits
  // NOT: Invalid URL, video private, etc.
};
```

**Error Categories and Responses**:

**Category A: Retry-able Errors**
- Network timeout (retry up to 3 times)
- Temporary service unavailable (retry with backoff)
- Rate limited (wait and retry)

**Category B: User Errors**
- Invalid URL format (show validation error, don't retry)
- Video not found (show not found error)
- Video is private (show permission error)
- No captions available (suggest manual entry)

**Category C: Service Errors**
- API key invalid (show setup error)
- Platform API down (show service unavailable)
- Quota exceeded (show quota error)

**Integration Tests**:

**Test Scenarios**:
```javascript
describe('Recipe Extraction - Full Pipeline', () => {
  // YouTube successful extraction
  test('should extract recipe from valid YouTube link');
  
  // YouTube with no transcript
  test('should handle YouTube video without transcript');
  
  // TikTok extraction
  test('should extract recipe from valid TikTok link');
  
  // Instagram extraction
  test('should extract recipe from valid Instagram reel');
  
  // Invalid link
  test('should reject invalid URL');
  
  // Rate limiting
  test('should handle rate limiting with backoff');
  
  // Network error
  test('should retry on network timeout');
  
  // Parsing edge cases
  test('should parse messy unformatted text');
  test('should handle missing ingredients section');
  test('should handle missing instructions section');
  
  // Complete workflow
  test('should complete end-to-end extraction workflow');
  test('should allow user to edit extracted recipe');
  test('should save edited recipe successfully');
});
```

**Rate Limiting Implementation**:

**Strategy**:
```javascript
export const RateLimitManager = {
  limits: {
    youtube: { requestsPerMinute: 60, storage: 'yt_ratelimit' },
    tiktok: { requestsPerMinute: 30, storage: 'tk_ratelimit' },
    instagram: { requestsPerMinute: 30, storage: 'ig_ratelimit' },
  },
  
  async checkLimit(platform) {
    const limit = this.limits[platform];
    const stored = await AsyncStorage.getItem(limit.storage);
    const requests = JSON.parse(stored || '[]');
    
    // Clean old requests (older than 60 seconds)
    const now = Date.now();
    const recentRequests = requests.filter(t => now - t < 60000);
    
    if (recentRequests.length >= limit.requestsPerMinute) {
      const waitTime = 60 - Math.floor((now - recentRequests[0]) / 1000);
      throw new RateLimitError(waitTime);
    }
    
    recentRequests.push(now);
    await AsyncStorage.setItem(limit.storage, JSON.stringify(recentRequests));
  }
};
```

**Logging System**:

**Logging Levels**:
```javascript
export const log = {
  debug: (message, data) => {
    if (__DEV__) console.log('[DEBUG]', message, data);
  },
  info: (message, data) => {
    console.log('[INFO]', message, data);
  },
  warn: (message, error) => {
    console.warn('[WARN]', message, error);
  },
  error: (message, error) => {
    console.error('[ERROR]', message, error);
    // Send to error tracking service (Sentry, etc.)
  }
};
```

**Performance Optimization**:

**Optimization Strategies**:
- Cache transcripts/content (1 hour TTL)
- Parse asynchronously on background thread
- Limit concurrent requests (max 3)
- Cancel in-flight requests if user navigates away
- Debounce URL validation input
- Progressive UI updates (show loading, then preview)

**Performance Targets**:
- Link validation: <100ms
- Transcript fetch: <3 seconds
- Content parsing: <2 seconds
- Total extraction: <5 seconds

**Edge Cases**:

**Edge Case Handling**:
- Very long transcripts (>10,000 chars)
  - Truncate intelligently
  - Process in chunks
  - Show warning about potential incompleteness

- Videos with no ingredients section
  - Show warning
  - Allow manual entry
  - Suggest recipe website links

- Multiple ingredients per line
  - Split and parse individually
  - Use heuristics to detect compound ingredients

- Instructions with embedded timestamps
  - Remove timestamps
  - Keep step numbers
  - Extract duration hints

**Testing Matrix**:

| Platform | Valid Link | No Transcript | Private | Rate Limited | Network Error |
|----------|-----------|---------------|---------|--------------|---------------|
| YouTube | ✅ | ✅ | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ | ✅ | ✅ |
| Instagram | ✅ | ✅ | ✅ | ✅ | ✅ |

**Cross-Platform Testing**:

**iOS**:
- Extract on cellular and WiFi
- Background app refresh handling
- Memory usage under load

**Android**:
- Extraction on various Android versions (7+)
- Memory constraints
- Background process handling

**Web**:
- CORS issues with platform APIs
- Browser API limitations
- Local storage constraints

---

## 🚀 Development Workflow

Each issue follows the strict development process from your README:

1. ✅ Issue created with P1 priority and size label
2. ⏳ Set issue status to "In Progress"
3. ⏳ Create feature branch: `feature/issue-N-description`
4. ⏳ Implement with comprehensive tests
5. ⏳ Create PR with "Closes #N"
6. ⏳ Create test issue for manual QA
7. ⏳ Merge and auto-close issue

---

## 📅 Implementation Timeline

**Recommended Order**:
1. Start with **#75** (Link validation) - foundation
2. Parallelize **#76** & **#77** (YouTube & TikTok/Instagram extraction)
3. Implement **#78** (Text parsing)
4. Build **#79** (UI integration)
5. Finalize with **#80** (Testing & refinement)

**Estimated Duration**: 2-3 weeks (can be parallelized)

**Phase Breakdown**:
- **Phase 1** (Week 1): Infrastructure setup (#75)
- **Phase 2** (Week 1-2): Content extraction (#76, #77)
- **Phase 3** (Week 2): Data processing (#78)
- **Phase 4** (Week 2-3): UI & Integration (#79, #80)

---

## 🎯 Key Features

✅ **Supported Platforms**:
- YouTube (all video formats, with transcripts/captions)
- TikTok (recipe videos with metadata)
- Instagram (recipe reels with captions)

✅ **Extraction Capabilities**:
- Automatic ingredient list extraction
- Step-by-step instruction parsing
- Recipe metadata (title, author, duration)
- Confidence scoring
- Multi-language support (English priority)

✅ **User Experience**:
- Non-intrusive UI (preserves manual entry)
- Loading states with progress
- Preview before saving
- Easy editing of extracted data
- Clear error messages
- Fallback to manual entry

✅ **Technical Excellence**:
- 80%+ test coverage
- Comprehensive error handling
- Rate limiting and retry logic
- AsyncStorage caching (1-hour TTL)
- Performance optimized (<5 seconds extraction)
- Cross-platform support (iOS, Android, Web)

---

## ✨ Next Steps

**Ready to begin!** Here's what to do:

1. **Go to Issue #75**: Link validation and parsing service
2. **Set status to "In Progress"** on GitHub
3. **Create feature branch**: `git checkout -b feature/issue-75-link-validation`
4. **Implement the service**: Parse YouTube, TikTok, Instagram URLs
5. **Write tests**: 80%+ coverage with 10+ test cases
6. **Create PR** when ready following your development workflow

---

## 📚 Additional Resources

### API Documentation
- YouTube API: https://developers.google.com/youtube/v3
- TikTok API considerations: https://www.tiktok.com/developers
- Instagram API: https://developers.facebook.com/docs/instagram-api

### Libraries to Consider
- youtube-transcript-api (NPM package for YouTube transcripts)
- cheerio (for HTML parsing/scraping)
- axios (for HTTP requests)
- node-cache (for caching mechanisms)

### Known Limitations (Documented for Future Reference)
- YouTube: Requires public captions/transcripts
- TikTok: API access limited, may require workarounds
- Instagram: API restrictions, may need official business account
- Accuracy: Parsing accuracy varies by video quality
- Languages: English-first, other languages may have lower accuracy

### Future Enhancements
- Machine learning for better parsing accuracy
- Support for recipe websites (AllRecipes, Food Network, etc.)
- Bulk import from recipe sources
- Recipe image extraction
- Nutritional information from video hints
- Cooking time/difficulty estimation

---

## 📞 Support Notes

- All issues reference the parent epic #74
- Dependencies are clearly marked in each issue
- Implementation is sequential but can be parallelized
- Test coverage targets are consistent (80%+)
- All issues follow your project's development workflow
- Pre-commit checks will run automatically
- Consider using GitHub Project board to track progress

---

**Good luck with implementation!** 🎉
