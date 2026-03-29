# Backend Development Phases 1-4

> This is an archived document consolidating backend Phase 1-4 development notes.

---

## Table of Contents

1. [Phase 1: Server Infrastructure (Issue #110)](#phase-1-server-infrastructure-issue-110)
2. [Phase 2: Video Download and Audio Extraction (Issue #111)](#phase-2-video-download-and-audio-extraction-issue-111)
3. [Phase 3: Transcription Integration (Issue #112)](#phase-3-transcription-integration-issue-112)
4. [Phase 4: Recipe Extraction Pipeline (Issue #113)](#phase-4-recipe-extraction-pipeline-issue-113)

---

## Phase 1: Server Infrastructure (Issue #110)

### What Was Created

1. **Server Infrastructure** (`server.js`)
   - Express server with middleware
   - CORS enabled for frontend communication
   - JSON body parser with 10MB limit
   - Health check endpoint for monitoring
   - Error handling with proper status codes
   - Graceful shutdown on SIGTERM/SIGINT

2. **Configuration System** (`config/env.js`)
   - Centralized environment variables
   - Type-safe configuration access
   - Sensible defaults

3. **Logging** (`config/logger.js`)
   - Winston logger setup
   - File rotation (5MB files, keep 5)
   - Separate error logs
   - Console output in development
   - JSON formatted logs for production parsing

4. **Route Structure** (`routes/`)
   - `/transcribe` - Video transcription endpoints (Phase 3)
   - `/recipes` - Recipe CRUD endpoints (Phase 4)
   - `/cost` - Cost tracking endpoints (Phase 6)
   - All routes had placeholder implementations with phase references

5. **Testing Framework** (`jest.config.js`, `tests/`)
   - Jest configured for Node.js
   - Supertest for API testing
   - Coverage thresholds: 20% branches/functions, 30% lines/statements
   - Server tests covering health, version, errors, CORS

6. **Package Configuration** (`package.json`)
   - All necessary dependencies
   - npm scripts for dev/test/lint/security

### File Structure

```
backend/
  server.js              (155 lines)
  package.json           (45 lines)
  jest.config.js         (23 lines)
  .env.example           (28 lines)
  README.md              (115 lines)
  config/
    env.js               (36 lines)
    logger.js            (37 lines)
  routes/
    transcribe.js        (40 lines)
    recipes.js           (48 lines)
    cost.js              (38 lines)
  tests/
    server.test.js       (54 lines)
    setup.js             (2 lines)
```

Total: 13 files, approximately 521 lines of code.

### Dependencies

**Production:** express, cors, dotenv, axios, multer, uuid, winston

**Development:** nodemon, jest, supertest, eslint, eslint-plugin-security

### Status

Phase 1 complete. All endpoints responding, error handling in place, logging configured, CORS working, tests passing.

---

## Phase 2: Video Download and Audio Extraction (Issue #111)

### What Was Created

1. **Download Service** (`services/downloadService.js`)
   - Video download from YouTube, TikTok, Instagram, Twitter, Facebook
   - URL validation for supported platforms
   - Video metadata fetching (duration, title, uploader)
   - Timeout protection (configurable via environment variables)

2. **Audio Service** (`services/audioService.js`)
   - Audio extraction from video using ffmpeg
   - Three quality presets: LOW (64kbps, 16kHz), MEDIUM (128kbps, 16kHz), HIGH (192kbps, 44.1kHz)
   - Audio format: WAV (PCM 16-bit mono)
   - Audio duration calculation
   - File cleanup and timeout protection (10 minute max)

3. **Download Routes** (`routes/download.js`)
   - POST /api/download - Start download and extraction job
   - GET /api/download/:jobId - Get job status
   - DELETE /api/download/:jobId - Cancel job
   - In-memory job queue with background processing

4. **Tests**
   - 34 test cases covering both services
   - URL validation tests for all platforms (13 tests)
   - Quality preset validation (6 tests)
   - Duration calculations (2 tests)
   - Error handling (8 tests)
   - Download functionality (5 tests)

### Error Handling

**Download Service Errors:**
- `INVALID_URL` - URL does not match supported platforms
- `DOWNLOAD_FAILED` - Video unavailable, private, or geoblocked
- `DOWNLOAD_TIMEOUT` - Download exceeded time limit
- `PROCESS_ERROR` - System error with yt-dlp

**Audio Service Errors:**
- `EXTRACTION_FAILED` - ffmpeg failed to extract audio
- `EXTRACTION_TIMEOUT` - Extraction exceeded 10 minute limit
- `PROCESS_ERROR` - System error with ffmpeg
- `DURATION_ERROR` - Failed to get audio duration

### External Dependencies

Requires yt-dlp and ffmpeg to be installed on the system.

### Status

Phase 2 complete. 34 tests passing. Test coverage: 26.78% statements.

---

## Phase 3: Transcription Integration (Issue #112)

### What Was Created

1. **Transcription Service** (`services/transcriptionService.js`, 265 lines)
   - Audio transcription using GitHub Models API (models.inference.ai.azure.com)
   - Authentication via GitHub token (instead of OpenAI API key)
   - Model: GPT-4o mini for cost-efficient transcription
   - Cost: Free with GitHub Copilot account
   - Language detection capability
   - Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
   - Retryable errors: 429, 500, 502, 503, timeouts
   - Non-retryable errors: 401 (invalid token), 400 (bad request)

2. **Cost Tracker** (`services/costTracker.js`, 182 lines)
   - Track cost entries per request
   - Get daily/monthly/total cost stats
   - Detailed cost history log
   - Daily limit: $50 (configurable via `COST_DAILY_LIMIT`)
   - Monthly limit: $500 (configurable via `COST_MONTHLY_LIMIT`)
   - Warnings logged when limits exceeded
   - Cost logs rotated (keep last 10,000 entries)

3. **Cache Service** (`services/cacheService.js`, 281 lines)
   - Smart caching to prevent duplicate API calls
   - 30-day TTL (Time To Live)
   - Max 10,000 cached entries
   - LRU (Least Recently Used) eviction strategy
   - Access count tracking
   - Cost savings calculation
   - In-memory Map storage (Redis planned for production)

4. **Transcription Routes** (`routes/transcribe.js`, 398 lines)
   - POST /api/transcribe - Start async transcription job (202 Accepted)
   - GET /api/transcribe/:jobId - Get job status and progress
   - DELETE /api/transcribe/:jobId - Cancel job
   - GET /api/transcribe/costs/stats - Cost statistics
   - GET /api/transcribe/costs/log - Cost history

5. **Tests**
   - transcriptionService.test.js: 26 tests (audio transcription, language detection, token validation, retry logic, error handling, confidence scoring, cost calculations)
   - cacheService.test.js: 23 tests (cache key generation, store/retrieve, expiration, LRU eviction, statistics, performance)

### Error Codes

- `INVALID_API_KEY` - GitHub token not configured
- `API_RATE_LIMIT` - Too many requests (retries automatically)
- `TRANSCRIPTION_FAILED` - General failure
- `TIMEOUT` - Request timeout
- `INVALID_AUDIO_FORMAT` - Bad audio file
- `AUDIO_TOO_LONG` - Exceeds limits
- `FILE_NOT_FOUND` - Audio file missing
- `CACHE_ERROR` - Cache operation failed
- `PROCESS_ERROR` - Language detection failed

### Status

Phase 3 complete. 49 new tests (83 total backend tests). Coverage: approximately 33%.

---

## Phase 4: Recipe Extraction Pipeline (Issue #113)

### Overview

Phase 4 implemented the recipe extraction service that converts transcribed text (from Phase 3) into structured recipe JSON. This was the core business logic for the video-to-recipe pipeline.

**Input:** Transcribed text from video
**Output:** Structured recipe with ingredients, steps, cooking time, temperature

### Architecture

**Service layer:** `backend/services/recipeExtractionService.js`

Core functions:
- `extractRecipe(transcriptionText)` - Main extraction, returns Recipe JSON
- `parseIngredients(text)` - Extract ingredients with quantities, units, preparation notes
- `parseSteps(text)` - Extract sequential cooking instructions with timing
- `extractCookingTime(text)` - Extract prep/cook times
- `extractTemperature(text)` - Extract cooking temperatures
- `validateRecipe(recipe)` - Validate extracted recipe structure

**Route layer:** `backend/routes/recipes.js`

- POST /api/recipes/extract - Main extraction endpoint
- GET /api/recipes/:id - Retrieve saved recipe
- POST /api/recipes/:id/save - Save extracted recipe

### Recipe JSON Structure

```javascript
{
  id: string,
  title: string,
  description: string,
  source: {
    videoUrl: string,
    transcription: string,
    extractedAt: "ISO8601"
  },
  servings: number,
  prepTime: number,       // minutes
  cookTime: number,       // minutes
  totalTime: number,      // minutes
  difficulty: "easy" | "medium" | "hard",
  ingredients: [
    {
      name: string,
      quantity: number,
      unit: string,        // "cups", "tbsp", "tsp", "grams", etc.
      optional: boolean,
      preparation: string  // "chopped", "minced", etc.
    }
  ],
  steps: [
    {
      number: number,
      instruction: string,
      duration: number,    // minutes (optional)
      temperature: number  // fahrenheit (optional)
    }
  ],
  temperature: {
    value: number,
    unit: "F" | "C"
  },
  cuisines: [],
  allergies: [],
  confidence: {
    overall: 0-1,
    ingredients: 0-1,
    steps: 0-1,
    timing: 0-1
  },
  warnings: []
}
```

### Implementation Steps

1. **Ingredient Parsing** - Regex patterns for formats like "2 cups flour", "1 tbsp olive oil (optional)", "3 cloves garlic, minced". Unit normalization ("tsp" to "teaspoon"). Optional detection ("if desired", "optional"). Preparation flags ("chopped", "diced", "minced").

2. **Cooking Steps Parsing** - Sentence splitting and numbering. Duration detection ("15 minutes", "20 mins", "until golden"). Temperature detection ("350F", "180C"). Action verb identification. Step consolidation.

3. **Metadata Extraction** - Prep time and cook time detection. Yield/servings recognition. Cuisine inference from ingredients. Difficulty assessment. Allergen detection.

4. **Validation and Enhancement** - Completeness checks (at least 3 ingredients and 3 steps required). Sanity checks (temperature between 200-500F, times less than 12 hours). Duplicate ingredient consolidation. Confidence scoring per section.

### Key Challenges and Solutions

**Ambiguous language:** Context-aware parsing with sanity validation. Fallback to placeholder values with warnings.

**Missing structured data:** Normalize casual language ("a pinch of salt"). Estimate based on context when quantities are vague. Mark low-confidence items with warnings.

**Variable recipe formats:** Multiple regex patterns for common variations. Natural language hints ("first", "next", "meanwhile"). Step number inference from sentence position.

### Success Criteria

- Extracts recipes from transcribed text
- 80%+ accuracy on ingredient extraction
- 75%+ accuracy on step parsing
- Handles missing/ambiguous data gracefully
- Returns confidence scores and actionable warnings
- Sub-500ms extraction time per recipe

### Status

Phase 4 complete. Recipe extraction pipeline functional with ingredient parsing, step extraction, metadata extraction, and validation.

---

## Phase Dependencies

```
Phase 1: Backend infrastructure (Issue #110)
    |
    v
Phase 2: Video download and audio extraction (Issue #111)
    |
    v
Phase 3: Transcription integration (Issue #112)
    |
    v
Phase 4: Recipe extraction pipeline (Issue #113)
    |
    v
Phase 5: UI integration
Phase 6: Deployment and monitoring
Phase 7: Comprehensive testing
Phase 8: Documentation
```

---

## Cumulative Test Counts

| Phase   | New Tests | Total Tests | Coverage     |
|---------|-----------|-------------|--------------|
| Phase 1 | 5         | 5           | Baseline     |
| Phase 2 | 29        | 34          | 26.78%       |
| Phase 3 | 49        | 83          | ~33%         |
| Phase 4 | 30+       | 113+        | Target 90%+  |
