# Phase 5: UI Integration for Video Recipe Extraction
**Issue:** #114  
**Parent Issue:** #20 - Video URL Processing with Transcription  
**Date:** January 7, 2026  
**Status:** In Progress

## Overview

Phase 5 integrates the backend video transcription and recipe extraction services (Phases 1-4) into the mobile app UI. Users can now extract recipes from YouTube/TikTok videos directly in the app.

## Architecture

```
Frontend (Phase 5)              Backend (Phases 1-4)
┌─────────────────────────┐     ┌──────────────────────────────┐
│  VideoRecipeInput       │────→│ /api/download (Phase 2)      │
│  (URL validation UI)    │     │ /api/transcribe (Phase 3)    │
│                         │     │ /api/recipes (Phase 4)       │
├─────────────────────────┤     └──────────────────────────────┘
│ TranscriptionProgress   │
│ (Status tracking)       │     ┌──────────────────────────────┐
│                         │────→│ Backend Services:            │
├─────────────────────────┤     │ - downloadService            │
│ RecipePreview Modal     │     │ - transcriptionService       │
│ (Edit & save flow)      │     │ - recipeExtractionService    │
└─────────────────────────┘     └──────────────────────────────┘
```

## Components to Create

### 1. VideoRecipeInput Component
**File:** `MyRecipeApp/components/VideoRecipeInput.js`  
**Purpose:** URL input and validation UI

**Features:**
- Input field with placeholder text
- URL validation with real-time feedback
- Extract button (disabled until valid URL)
- Loading state during extraction
- Clear error messages
- Support for multiple video platforms

**Props:**
```javascript
{
  onExtractStart: function,      // Called when user clicks extract
  onExtractSuccess: function,    // Called with extracted recipe
  onExtractError: function,      // Called with error message
  isLoading: boolean,            // Show loading state
  disabled: boolean,             // Disable input
  platforms: string[]            // Supported platforms
}
```

**Test Coverage:** 10+ tests
- URL validation (YouTube, TikTok, Instagram, etc.)
- Button state (enabled/disabled)
- Loading state transitions
- Error display
- Success callback

### 2. TranscriptionProgress Component
**File:** `MyRecipeApp/components/TranscriptionProgress.js`  
**Purpose:** Show real-time transcription progress

**Features:**
- Step indicators (Download → Extract Audio → Transcribe → Parse)
- Progress bar with percentage
- Current step highlighting
- Time elapsed and estimated time
- Cancel button
- Status messages

**Props:**
```javascript
{
  steps: Step[],           // Array of { name, status }
  currentStep: number,     // Current step index
  progress: number,        // 0-100
  timeElapsed: number,     // Seconds
  estimatedTime: number,   // Seconds (optional)
  onCancel: function,      // Called when user cancels
  isVisible: boolean       // Show/hide modal
}
```

**Step States:** pending, active, completed, error

**Test Coverage:** 12+ tests
- Step progression
- Progress updates
- Time calculation
- Cancel functionality
- Error state display

### 3. RecipePreview Modal
**File:** `MyRecipeApp/components/RecipePreviewModal.js`  
**Purpose:** Display extracted recipe with edit capability

**Features:**
- Recipe title with edit capability
- Ingredients list with edit
- Instructions with edit
- Confidence score display
- Action buttons (Edit, Use Recipe, Discard)
- Scrollable content
- Cost display (optional)

**Props:**
```javascript
{
  recipe: Recipe,              // Extracted recipe object
  onSave: function,            // Save recipe callback
  onDiscard: function,         // Discard callback
  onEdit: function,            // Enter edit mode callback
  isVisible: boolean,          // Show/hide modal
  isEditing: boolean,          // Edit mode flag
  confidence: number,          // 0-1 confidence score
  cost: number                 // API cost (optional)
}
```

**Recipe Object Structure:**
```javascript
{
  title: string,
  ingredients: Ingredient[],   // { name, quantity, unit }
  instructions: Step[],        // { text, time, temperature, techniques }
  metadata: {
    servings: number,
    prepTime: number,
    cookTime: number,
    difficulty: string
  }
}
```

**Test Coverage:** 15+ tests
- Recipe display
- Edit mode toggle
- Save/discard actions
- Ingredient editing
- Instruction editing
- Confidence score display

### 4. URL Validation Utility
**File:** `MyRecipeApp/utils/urlValidator.js`  
**Purpose:** Validate video URLs

**Functions:**
```javascript
isValidVideoUrl(url: string): boolean
getVideoProvider(url: string): string  // 'youtube', 'tiktok', etc.
extractVideoId(url: string): string
getSupportedProviders(): string[]
```

**Supported Platforms:**
- YouTube (youtube.com, youtu.be)
- TikTok (tiktok.com, vm.tiktok.com)
- Instagram (instagram.com)
- Twitter/X (twitter.com, x.com)
- Facebook (facebook.com)

**Test Coverage:** 20+ tests
- URL format validation
- Platform detection
- Video ID extraction
- Edge cases (shortened URLs, parameters, etc.)

## Integration Points

### API Endpoints (Created in Phase 2-4)
```
POST /api/download
  Request: { url, quality }
  Response: { jobId, status }
  
GET /api/download/:jobId
  Response: { status, progress, audioPath }
  
POST /api/transcribe
  Request: { audioPath, language }
  Response: { jobId, status }
  
GET /api/transcribe/:jobId
  Response: { status, progress, transcript }
  
POST /api/recipes/extract
  Request: { transcribedText }
  Response: { recipe, confidence }
```

### Add Recipe Form Integration
**File:** `MyRecipeApp/screens/AddRecipeScreen.js`

**Changes:**
- Add VideoRecipeInput component above manual entry form
- Extract button triggers API calls sequentially
- On success: populate form with extracted data
- Allow manual editing before saving
- Show cost transparency

## User Workflows

### Workflow A: Happy Path (Extract from Video)
1. User opens "Add Recipe" screen
2. Pastes YouTube URL in video input
3. URL validation shows green checkmark
4. Taps "Extract Recipe" button
5. See TranscriptionProgress modal with steps
6. System downloads video → extracts audio → transcribes → parses recipe
7. RecipePreview modal shows extracted recipe (12 ingredients, 5 steps)
8. User reviews and taps "Use This Recipe"
9. Form populated with extracted data
10. User edits/reviews if needed
11. Taps "Save Recipe" → recipe saved

**Time:** ~2-3 minutes for average video

### Workflow B: Editing Extracted Data
1. See RecipePreview modal with extracted recipe
2. Notice missing ingredient (e.g., "salt and pepper")
3. Tap "Edit" button
4. Enter edit mode in modal
5. Add missing ingredient with quantity
6. Correct temperature conversions if needed
7. Tap "Save Changes"
8. Back to preview with updated data
9. Tap "Use This Recipe"
10. Form populated and saved

### Workflow C: Invalid URL
1. User pastes invalid URL
2. URL validation shows red error: "Invalid video URL"
3. User corrects URL
4. Green checkmark appears
5. Can now tap extract

### Workflow D: Error Handling
1. User pastes valid URL
2. Video is private/unavailable
3. See error: "Video is private or not available"
4. Option to retry or enter manually
5. User falls back to manual recipe entry

### Workflow E: Cost Awareness
1. User has cost alerts enabled in settings
2. Extracts recipe from 15-min video
3. See estimated cost: $0.06
4. User confirms and proceeds
5. After extraction, see actual cost: $0.05

## Error Messages & Handling

| Error | Message | Action |
|-------|---------|--------|
| Invalid URL | "Invalid video URL. Please check and try again." | Suggest format |
| Video Private | "Video is private or not available." | Retry/Manual |
| Video Too Long | "Video is too long (>1 hour). Please use shorter video." | Suggest limit |
| No Audio | "No captions found. Please use video with audio." | Help text |
| Transcription Failed | "Transcription failed. Please try again or enter manually." | Retry/Manual |
| Parsing Failed | "Could not extract recipe. Please try another video." | Retry/Manual |
| Cost Exceeded | "Cost limit exceeded. Please check settings." | Go to settings |
| Network Error | "Network error. Please check connection." | Retry button |

## Testing Strategy

### Unit Tests (75+ tests)
- URL validation (20 tests)
- Component rendering (15 tests)
- Button states (10 tests)
- Error handling (15 tests)
- Data transformations (10 tests)
- Callback invocations (5 tests)

### Integration Tests (15+ tests)
- Full extraction workflow
- Error recovery
- API integration
- Form population
- Data persistence

### Manual Testing Checklist
- [ ] YouTube URL extraction works
- [ ] TikTok URL extraction works
- [ ] Invalid URL shows error
- [ ] Progress modal shows all steps
- [ ] Recipe preview displays correctly
- [ ] Edit mode allows changes
- [ ] Cost display accurate
- [ ] Cancel during transcription works
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Works in web browser
- [ ] Error messages are clear
- [ ] Fallback to manual entry works

## File Structure
```
MyRecipeApp/
├── components/
│   ├── VideoRecipeInput.js
│   ├── TranscriptionProgress.js
│   ├── RecipePreviewModal.js
│   ├── __tests__/
│   │   ├── VideoRecipeInput.test.js
│   │   ├── TranscriptionProgress.test.js
│   │   └── RecipePreviewModal.test.js
│   └── ...
├── screens/
│   ├── AddRecipeScreen.js (modified)
│   └── ...
├── utils/
│   ├── urlValidator.js
│   ├── __tests__/
│   │   └── urlValidator.test.js
│   └── ...
└── ...
```

## Implementation Checklist

### Step 1: Foundation Components
- [ ] Create VideoRecipeInput component
- [ ] Create TranscriptionProgress component
- [ ] Create RecipePreviewModal component
- [ ] Write unit tests for each component (40+ tests)

### Step 2: Utilities & Integration
- [ ] Create URL validation utility
- [ ] Write URL validation tests (20+ tests)
- [ ] Create API integration utility
- [ ] Test API calls

### Step 3: UI Integration
- [ ] Integrate VideoRecipeInput into AddRecipeScreen
- [ ] Connect to API endpoints
- [ ] Handle loading/error states
- [ ] Test full workflows

### Step 4: Testing & Polish
- [ ] Complete all unit tests (75+ total)
- [ ] Integration testing
- [ ] Manual QA on all platforms
- [ ] Error message refinement
- [ ] Performance optimization

### Step 5: Documentation
- [ ] Component documentation
- [ ] API integration guide
- [ ] User guide
- [ ] Troubleshooting section

## Dependencies
- **Frontend:** React Native, react-native-gesture-handler, @react-navigation
- **Backend:** Phases 1-4 services (already completed)
- **APIs:** Download, transcription, recipe extraction endpoints

## Timeline
- **Component Creation:** 4 hours
- **Testing:** 3 hours
- **Integration:** 3 hours
- **Polish & Documentation:** 2 hours
- **Total:** ~12 hours (1-2 days)

## Success Criteria
- ✅ 75%+ test coverage
- ✅ All workflows functional
- ✅ Error handling graceful
- ✅ Works on iOS, Android, Web
- ✅ Performance: <500ms for UI, <3min for extraction
- ✅ All tests passing
- ✅ 0 security vulnerabilities
- ✅ Clear documentation

## Next Steps (Phase 6)
- API endpoint creation for remaining features
- Advanced editing capabilities
- Recipe recommendations
- Batch extraction
- Sharing & collaboration

---

**Status:** 🚀 Ready to implement  
**Priority:** P1  
**Size:** M (1-2 days)
