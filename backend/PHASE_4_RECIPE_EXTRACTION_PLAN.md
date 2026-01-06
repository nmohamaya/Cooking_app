# Phase 4: Recipe Extraction Pipeline Implementation Plan

**Issue**: #113  
**Target Branch**: `feature/issue-20-video-transcription`  
**Timeline**: 3-4 days  
**Target Completion**: January 9-10, 2026

---

## Overview

Phase 4 implements the recipe extraction service that converts transcribed text (from Phase 3) into structured recipe JSON. This is the core business logic for the video → recipe pipeline.

**Input**: Transcribed text from video  
**Output**: Structured recipe with ingredients, steps, cooking time, temperature

---

## Architecture

### Service Layer
**File**: `backend/services/recipeExtractionService.js`

```javascript
// Main extraction function
extractRecipe(transcriptionText) → Recipe JSON

// Sub-functions
parseIngredients(text) → Ingredient[]
parseSteps(text) → Step[]
extractCookingTime(text) → number (minutes)
extractTemperature(text) → Temperature
validateRecipe(recipe) → boolean
```

### Route Layer
**File**: `backend/routes/recipes.js` (modify existing stub)

```javascript
POST /api/recipes/extract
  Input: { transcription: string, videoUrl?: string }
  Output: { recipe: Recipe, confidence: number, warnings: string[] }

GET /api/recipes/:id
  Returns saved recipe details

POST /api/recipes/:id/save
  Saves extracted recipe to database
```

### Data Structures

**Recipe JSON**:
```javascript
{
  id: string,
  title: string,
  description: string,
  source: {
    videoUrl: string,
    transcription: string,
    extractedAt: ISO8601
  },
  servings: number,
  prepTime: number,      // minutes
  cookTime: number,      // minutes
  totalTime: number,     // minutes
  difficulty: 'easy' | 'medium' | 'hard',
  ingredients: [
    {
      name: string,
      quantity: number,
      unit: string,       // 'cups', 'tbsp', 'tsp', 'grams', etc.
      optional: boolean,
      preparation: string // 'chopped', 'minced', etc.
    }
  ],
  steps: [
    {
      number: number,
      instruction: string,
      duration: number,   // minutes (optional)
      temperature: number // fahrenheit (optional)
    }
  ],
  temperature: {
    value: number,
    unit: 'F' | 'C'
  },
  cuisines: string[],
  allergies: string[],
  confidence: {
    overall: 0-1,
    ingredients: 0-1,
    steps: 0-1,
    timing: 0-1
  },
  warnings: string[]
}
```

---

## Implementation Steps

### Step 1: Ingredient Parsing (Day 1 AM)
**Goal**: Extract ingredients with quantities, units, and preparation notes

**Approach**:
- Regex patterns for common formats: "2 cups flour", "1 tbsp olive oil"
- Unit normalization: "tsp" → "teaspoon", "cup" → "cups"
- Optional detection: "if desired", "optional"
- Preparation flags: "chopped", "diced", "minced", "grated"

**Test Cases**:
- "2 cups all-purpose flour"
- "1 tbsp olive oil (optional)"
- "3 cloves garlic, minced"
- "1 14-oz can diced tomatoes"
- "salt and pepper to taste"

### Step 2: Cooking Steps Parsing (Day 1 PM)
**Goal**: Extract sequential cooking instructions with timing

**Approach**:
- Sentence splitting and numbering
- Duration detection: "15 minutes", "20 mins", "until golden"
- Temperature detection: "350°F", "180°C"
- Action verb identification: "mix", "bake", "simmer", "sauté"
- Step consolidation: Group related instructions

**Test Cases**:
- "Preheat oven to 350°F"
- "Mix flour and sugar"
- "Bake for 25-30 minutes until golden brown"
- "Simmer on medium heat for 15 minutes"

### Step 3: Metadata Extraction (Day 2 AM)
**Goal**: Extract timing, difficulty, yields, cuisine info

**Approach**:
- Prep time / cook time detection
- Yield/servings recognition
- Cuisine inference from ingredients
- Difficulty assessment based on complexity
- Allergen detection

**Test Cases**:
- "Serves 4-6 people"
- "Italian pasta dish"
- "Prep: 15 min, Cook: 30 min"
- "Contains nuts, dairy"

### Step 4: Validation & Enhancement (Day 2 PM)
**Goal**: Validate recipe structure and add confidence scores

**Approach**:
- Completeness checks (has ingredients, steps, timing)
- Sanity checks (reasonable quantities, timing, temperature)
- Duplicate ingredient consolidation
- Missing data handling with warnings
- Confidence scoring per section

**Validation Rules**:
- At least 3 ingredients required
- At least 3 steps required
- Temperature between 200-500°F (93-260°C)
- Prep/cook time less than 12 hours each

### Step 5: API Integration (Day 3 AM)
**Goal**: Create extraction endpoints and integrate with transcription

**Routes**:
- `POST /api/recipes/extract` - Main extraction endpoint
- Response includes recipe JSON + confidence + warnings

**Integration**:
- Call recipeExtractionService from route
- Return structured JSON response
- Proper error handling with meaningful messages

### Step 6: Testing & Documentation (Day 3 PM)
**Goal**: Comprehensive test coverage and documentation

**Test Suite** (`backend/tests/recipeExtractionService.test.js`):
- 30+ unit tests covering all parsing functions
- Integration tests for end-to-end extraction
- Edge cases and error scenarios
- Confidence score validation

**Documentation**:
- Code comments for complex parsing logic
- README section for recipe extraction API
- Example requests/responses
- Testing guide for developers

---

## Key Challenges & Solutions

### Challenge 1: Ambiguous Language
**Problem**: "Bake for 20 minutes" vs "Bake at 20°F" (nonsensical)

**Solution**:
- Context-aware parsing
- Sanity validation
- Fallback to placeholder values with warnings

### Challenge 2: Missing Structured Data
**Problem**: Casual transcription may lack precise quantities

**Solution**:
- "a pinch of salt" → detect and normalize
- "some flour" → estimate based on context
- Mark low-confidence items with warnings

### Challenge 3: Variable Recipe Formats
**Problem**: Different people describe recipes differently

**Solution**:
- Multiple regex patterns for common variations
- Natural language hints ("first", "next", "meanwhile")
- Step number inference from sentence position

---

## Success Criteria

✅ Extracts recipes from transcribed text  
✅ 80%+ accuracy on ingredients extraction  
✅ 75%+ accuracy on step parsing  
✅ Handles missing/ambiguous data gracefully  
✅ Returns confidence scores  
✅ Provides actionable warnings  
✅ 30+ tests with 90%+ coverage  
✅ <500ms extraction time per recipe  
✅ Proper error handling and edge cases  
✅ Clear API documentation  

---

## Dependencies

- Phase 2: Video download & audio extraction ✅
- Phase 3: Transcription service ✅
- Node.js natural language libraries (consider nlp.js or natural)

## Optional Enhancements

- LLM-assisted parsing for complex recipes
- Ingredient database integration for normalization
- Recipe rating/feedback for ML training
- Multi-language support

---

## Rollout

**Day 1**: Ingredient + Step parsing  
**Day 2**: Metadata extraction + Validation  
**Day 3**: API integration + Testing  
**Day 4**: Code review & refinement  

**PR**: Create PR against `feature/issue-20-video-transcription` branch

---

## Notes

- Keep parsing logic separate from API layer for testability
- Use consistent error messages and warning formats
- Build in extensibility for Phase 5 (UI integration)
- Consider performance - should handle 1000+ word transcriptions quickly
