# MyRecipeApp API Reference

**API Version:** 1.0.0
**Base URL:** `http://localhost:3001/api` (development)
**Format:** JSON (request and response)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Health and Status](#health-and-status)
4. [Download](#download)
5. [Transcription](#transcription)
6. [Recipes](#recipes)
7. [Cost Tracking](#cost-tracking)
8. [Caching](#caching)
9. [Error Codes](#error-codes)
10. [Rate Limiting](#rate-limiting)
11. [Frontend API Client](#frontend-api-client)
12. [End-to-End Workflow](#end-to-end-workflow)

---

## Authentication

The API uses GitHub token authentication:

```bash
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  http://localhost:3001/api/health
```

The GitHub token is required for AI model access (transcription and recipe extraction).

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "jobId": "job-12345",
    "status": "completed",
    "result": {}
  },
  "timestamp": "2026-01-10T15:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "The provided URL is not valid",
    "details": "URL must start with https://"
  },
  "timestamp": "2026-01-10T15:30:00Z"
}
```

---

## Health and Status

### GET /health

Check API health status.

**Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2026-01-07T19:51:12.000Z",
  "environment": "development",
  "uptime": 123.45
}
```

### GET /api/version

Get API version information.

**Response (200 OK):**

```json
{
  "version": "1.0.0",
  "apiVersion": "v1",
  "lastUpdated": "2026-01-10",
  "features": [
    "video-download",
    "audio-extraction",
    "transcription",
    "recipe-parsing"
  ]
}
```

---

## Download

Routes for downloading videos and extracting audio from supported platforms (YouTube, TikTok, Instagram, websites).

**Route file:** `backend/routes/download.js`
**Service:** `backend/services/downloadService.js`, `backend/services/audioService.js`

### POST /api/download

Start a video download and audio extraction job.

**Request:**

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "MEDIUM",
  "platform": "youtube"
}
```

| Parameter  | Type   | Required | Description                                          |
|------------|--------|----------|------------------------------------------------------|
| `url`      | string | Yes      | Video URL from a supported platform                  |
| `quality`  | string | No       | `LOW`, `MEDIUM`, `HIGH` (default: `HIGH`)            |
| `platform` | string | No       | Platform hint: `youtube`, `tiktok`, `instagram`, `website` |

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "jobId": "download-12345",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "status": "queued",
    "estimatedDuration": 45,
    "steps": {
      "download": "pending",
      "extract": "pending",
      "convert": "pending"
    }
  }
}
```

**Status Codes:**

| Code | Description                  |
|------|------------------------------|
| 202  | Job created, processing started |
| 400  | Invalid URL format           |
| 404  | Video not available          |
| 429  | Rate limit exceeded          |
| 500  | Server error                 |

### GET /api/download/:jobId

Get download job status.

**Path Parameters:**

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| `jobId`   | string | Yes      | Job ID from POST /api/download   |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "jobId": "download-12345",
    "status": "completed",
    "progress": 100,
    "steps": {
      "download": "completed",
      "extract": "completed",
      "convert": "completed"
    },
    "result": {
      "audioPath": "/tmp/uploads/audio_uuid.wav",
      "audioId": "uuid",
      "duration": 215.5,
      "size": 6892800,
      "quality": "MEDIUM"
    }
  }
}
```

**Status values:** `queued`, `processing`, `completed`, `failed`, `cancelled`

### DELETE /api/download/:jobId

Cancel a download job.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "jobId": "download-12345",
    "message": "Download job cancelled",
    "status": "cancelled"
  }
}
```

**Status Codes:**

| Code | Description            |
|------|------------------------|
| 200  | Job cancelled          |
| 404  | Job not found          |
| 409  | Job already completed  |

---

## Transcription

Routes for audio transcription using the GitHub Models API (Claude 3.5 Haiku).

**Route file:** `backend/routes/transcribe.js`
**Services:** `backend/services/audioService.js`, `backend/services/transcriptionService.js`

### POST /api/transcribe

Start an audio transcription job.

**Request:**

```json
{
  "audioFilePath": "/tmp/audio-12345.wav",
  "language": "en",
  "audioMinutes": 5
}
```

| Parameter       | Type   | Required | Description                                    |
|-----------------|--------|----------|------------------------------------------------|
| `audioFilePath` | string | Yes      | Path to audio file                             |
| `language`      | string | No       | Language code (`en`, `es`, `fr`). Auto-detect if omitted |
| `audioMinutes`  | number | No       | Audio duration in minutes                      |

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "jobId": "transcribe-12345",
    "audioFile": "/tmp/audio-12345.wav",
    "language": "en",
    "status": "queued",
    "estimatedDuration": 60,
    "estimatedCost": 0.00
  }
}
```

**Status Codes:**

| Code | Description              |
|------|--------------------------|
| 202  | Transcription job created |
| 400  | Invalid parameters       |
| 404  | Audio file not found     |
| 429  | Rate limit exceeded      |
| 500  | Server error             |

### GET /api/transcribe/:jobId

Get transcription job status and result.

**Response (200 OK) -- completed job:**

```json
{
  "success": true,
  "data": {
    "jobId": "transcribe-12345",
    "status": "completed",
    "progress": 100,
    "steps": [
      { "name": "Queued", "completed": true },
      { "name": "Language Detection", "completed": true },
      { "name": "Transcription", "completed": true },
      { "name": "Cost Calculation", "completed": true }
    ],
    "result": {
      "text": "Welcome to the recipe cooking tutorial...",
      "language": "en",
      "cost": 0.00,
      "confidence": 0.92,
      "cached": false,
      "timestamp": "2026-01-10T15:30:00Z"
    }
  }
}
```

**Status values:** `queued`, `processing`, `completed`, `failed`

### DELETE /api/transcribe/:jobId

Cancel a transcription job. Only cancels jobs in `queued` or `processing` state.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "jobId": "transcribe-12345",
    "message": "Transcription job cancelled"
  }
}
```

### GET /api/transcribe/costs/stats

Get transcription cost statistics.

**Response (200 OK):**

```json
{
  "daily": 0,
  "monthly": 0,
  "total": 0,
  "dateRange": {
    "start": "2026-01-06T19:00:00Z",
    "end": "2026-01-06T19:00:30Z"
  }
}
```

### GET /api/transcribe/costs/log

Get detailed transcription cost history.

**Query Parameters:**

| Parameter | Type   | Default | Description          |
|-----------|--------|---------|----------------------|
| `limit`   | number | 100     | Number of entries (max 1000) |

---

## Recipes

Routes for extracting structured recipes from transcribed text.

**Route file:** `backend/routes/recipes.js`
**Service:** `backend/services/recipeExtractionService.js`, `backend/services/ingredientService.js`, `backend/services/cookingStepsService.js`

### POST /api/recipes

Extract a recipe from a transcript or video URL.

**Request:**

```json
{
  "transcript": "First, gather 2 cups of flour...",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "title": "How to Make Pasta Carbonara",
  "source": "youtube",
  "extractMetadata": true
}
```

| Parameter         | Type    | Required | Description                          |
|-------------------|---------|----------|--------------------------------------|
| `transcript`      | string  | Yes      | Transcribed text from audio          |
| `videoUrl`        | string  | No       | Original video URL (for metadata)    |
| `title`           | string  | No       | Video title hint                     |
| `source`          | string  | No       | Source platform identifier           |
| `extractMetadata` | boolean | No       | Extract title, duration, etc. (default: true) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "recipe": {
      "title": "Pasta Carbonara",
      "description": "Classic Italian pasta carbonara",
      "servings": 2,
      "prepTime": 10,
      "cookTime": 15,
      "difficulty": "medium",
      "ingredients": [
        {
          "name": "eggs",
          "amount": "2",
          "unit": "whole",
          "category": "proteins"
        },
        {
          "name": "pasta",
          "amount": "100",
          "unit": "g",
          "category": "carbohydrates"
        }
      ],
      "instructions": [
        "Boil water and cook pasta",
        "Mix eggs with cheese",
        "Combine pasta with egg mixture"
      ],
      "tags": ["Italian", "pasta"],
      "source": "youtube",
      "confidence": 0.92
    },
    "extractedAt": "2026-01-10T15:30:00Z"
  }
}
```

**Status Codes:**

| Code | Description                       |
|------|-----------------------------------|
| 200  | Recipe extracted                  |
| 400  | Invalid input                     |
| 422  | No recipe found in transcript     |
| 500  | Extraction failed                 |

---

## Cost Tracking

Routes for monitoring API usage costs.

**Route file:** `backend/routes/cost.js`
**Service:** `backend/services/costTracker.js`

### GET /api/cost

Get cost summary.

**Response (200 OK):**

```json
{
  "success": true,
  "costSummary": {
    "totalCost": 15.32,
    "thisMonth": {
      "date": "2026-01-07",
      "cost": 15.32,
      "extractionsCount": 23,
      "averageCost": 0.67
    },
    "byService": {
      "transcription": 10.25,
      "recipeExtraction": 5.07
    },
    "estimatedMonthlyBudget": 75.00,
    "percentageUsed": 20.4
  }
}
```

### GET /api/costs/stats

Get cost statistics with period filtering.

**Query Parameters:**

| Parameter | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| `period`  | string | `month` | `day`, `month`, or `all`       |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalCost": 12.45,
    "dailyCost": 1.23,
    "requestCount": 245,
    "averageCostPerRequest": 0.05,
    "mostExpensiveRequest": {
      "videoUrl": "https://...",
      "cost": 0.45,
      "duration": 75
    },
    "trends": [
      { "date": "2026-01-01", "cost": 0.50 },
      { "date": "2026-01-02", "cost": 0.75 }
    ]
  }
}
```

### GET /api/costs/log

Get detailed cost log.

**Query Parameters:**

| Parameter   | Type   | Default | Description                    |
|-------------|--------|---------|--------------------------------|
| `limit`     | number | 100     | Number of entries (max 1000)   |
| `offset`    | number | 0       | Skip entries                   |
| `startDate` | string | --      | ISO 8601 date                  |
| `endDate`   | string | --      | ISO 8601 date                  |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "cost-12345",
        "videoUrl": "https://www.youtube.com/watch?v=...",
        "duration": 125,
        "cost": 0.75,
        "status": "completed",
        "timestamp": "2026-01-10T15:30:00Z"
      }
    ],
    "total": 245,
    "limit": 100,
    "offset": 0
  }
}
```

---

## Caching

Routes for managing transcription and result caches.

### GET /api/cache/:hash

Get cached transcription by audio hash.

**Path Parameters:**

| Parameter | Type   | Required | Description             |
|-----------|--------|----------|-------------------------|
| `hash`    | string | Yes      | SHA256 hash of audio    |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "hash": "abc123...",
    "transcript": "Welcome to the recipe...",
    "language": "en",
    "cachedAt": "2026-01-10T15:30:00Z",
    "expiresAt": "2026-02-09T15:30:00Z",
    "cost": 0.00,
    "hits": 5
  }
}
```

**Status Codes:**

| Code | Description    |
|------|----------------|
| 200  | Cache hit      |
| 404  | Not in cache   |
| 410  | Cache expired  |

### DELETE /api/cache/:hash

Remove a specific cached entry.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Cache entry deleted",
    "hash": "abc123..."
  }
}
```

### POST /api/cache/clear

Clear the entire cache.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Cache cleared",
    "entriesDeleted": 45,
    "spaceFreed": "125 MB"
  }
}
```

---

## Error Codes

| Code                   | HTTP | Description                   | Retryable |
|------------------------|------|-------------------------------|-----------|
| `INVALID_URL`          | 400  | URL format invalid            | No        |
| `INVALID_AUDIO`        | 400  | Audio file corrupt            | No        |
| `INVALID_AUDIO_FORMAT` | 400  | Unsupported audio format      | No        |
| `INVALID_API_KEY`      | 401  | GitHub token invalid/expired  | No        |
| `VIDEO_PRIVATE`        | 403  | Video is private              | No        |
| `VIDEO_NOT_FOUND`      | 404  | Video does not exist          | No        |
| `FILE_NOT_FOUND`       | 404  | Audio file does not exist     | No        |
| `VIDEO_TOO_LONG`       | 413  | Video exceeds 1-hour limit    | No        |
| `FILE_TOO_LARGE`       | 413  | File exceeds size limit       | No        |
| `NO_RECIPE_FOUND`      | 422  | No recipe in transcript       | No        |
| `RATE_LIMIT_EXCEEDED`  | 429  | Too many requests             | Yes       |
| `TIMEOUT`              | 408  | Request exceeded timeout      | Yes       |
| `DOWNLOAD_FAILED`      | 500  | Download process failed       | Yes       |
| `TRANSCRIPTION_FAILED` | 500  | Transcription failed          | Yes       |
| `CACHE_ERROR`          | 500  | Cache operation failed        | Yes       |
| `INTERNAL_ERROR`       | 500  | General server error          | Yes       |

---

## Rate Limiting

**Backend limits:**

- 100 requests per 15 minutes per IP
- 10 concurrent downloads per user
- 5 concurrent transcriptions per user

**GitHub Models API limits:**

- 2 requests per minute (free tier)

**Rate limit response:**

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

**Rate limit headers:**

```
X-RateLimit-Limit: 2
X-RateLimit-Remaining: 1
X-RateLimit-Reset: 1234567890
```

---

## Frontend API Client

The frontend communicates with the backend through `MyRecipeApp/services/apiClient.js`.

### Configuration

```javascript
import apiClient from './services/apiClient';

// Change base URL at runtime
apiClient.setApiBaseUrl('https://production-api.example.com');

// Modify configuration
apiClient.setApiConfig({
  TIMEOUT: 30000,
  REQUEST_LOG: true,
  RESPONSE_LOG: false,
  RETRY_ATTEMPTS: 5
});
```

### Configuration Object

```javascript
{
  BASE_URL: string,              // API base URL
  TIMEOUT: number,               // Request timeout in ms (default: 60000)
  RETRY_ATTEMPTS: number,        // Number of retry attempts (default: 3)
  RETRY_DELAY: number,           // Base delay for exponential backoff in ms (default: 1000)
  REQUEST_LOG: boolean,          // Log outgoing requests (default: true)
  RESPONSE_LOG: boolean          // Log responses (default: false)
}
```

### Available Functions

```javascript
import apiClient, {
  downloadVideo,
  getDownloadStatus,
  cancelDownload,
  transcribeAudio,
  extractRecipe,
  getVideoMetadata,
  getPlatformInfo,
  checkApiHealth,
  analyzeApiError,
  getAvailablePlatforms,
  setApiBaseUrl,
  setApiConfig,
  getApiConfig
} from './services/apiClient';
```

### Retry Logic

The client implements exponential backoff:

- Max retries: 3
- Base delay: 1000ms
- Max delay: 10000ms
- Multiplier: 2x
- Retryable: timeout, rate limit, 5xx server errors
- Non-retryable: 4xx client errors, authentication failures

### Error Handling

```javascript
import { analyzeApiError } from './services/apiClient';

try {
  await downloadVideo(url);
} catch (error) {
  const analysis = await analyzeApiError(error);
  console.log('Error type:', analysis.type);
  console.log('Retryable?', analysis.isRetryable);
  console.log('Suggestions:', analysis.suggestions);
}
```

Error analysis types: `timeout`, `rate_limited`, `server_error`, `invalid_request`, `authentication`, `network`, `generic`, `unknown`.

---

## End-to-End Workflow

### Complete Video-to-Recipe Extraction (curl)

```bash
# 1. Download video
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=..."}'
# Returns: {"data": {"jobId": "download-123"}}

# 2. Check download status (poll until completed)
curl http://localhost:3001/api/download/download-123

# 3. Transcribe audio
curl -X POST http://localhost:3001/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audioFilePath": "/tmp/audio-123.wav"}'
# Returns: {"data": {"jobId": "transcribe-456"}}

# 4. Check transcription status (poll until completed)
curl http://localhost:3001/api/transcribe/transcribe-456

# 5. Extract recipe
curl -X POST http://localhost:3001/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"transcript": "...full transcript..."}'
# Returns: {"data": {"recipe": {...}, "confidence": 0.92}}
```

### Complete Video-to-Recipe Extraction (JavaScript)

```javascript
import {
  downloadVideo,
  transcribeAudio,
  extractRecipe
} from './services/apiClient';

async function extractRecipeFromVideo(videoUrl) {
  // Step 1: Download video
  const downloadResult = await downloadVideo(videoUrl, {
    quality: 'medium',
    format: 'mp4'
  });

  // Step 2: Transcribe audio
  const transcriptionResult = await transcribeAudio(
    downloadResult.videoPath,
    { language: 'en' }
  );

  // Step 3: Extract recipe
  const recipeResult = await extractRecipe(
    transcriptionResult.transcript
  );

  return recipeResult.recipe;
}
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=3000
HOST=localhost
LOG_LEVEL=debug
GITHUB_TOKEN=<required>
MAX_FILE_SIZE=500MB
UPLOAD_DIR=./temp/uploads
CORS_ORIGIN=*
VIDEO_TIMEOUT_MINUTES=60
MAX_VIDEO_DURATION_HOURS=1
COST_TRACKING_ENABLED=true
COST_ALERT_THRESHOLD=1.00
COST_DAILY_LIMIT=50
COST_MONTHLY_LIMIT=500
```

### Frontend (`MyRecipeApp/.env`)

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=60000
REACT_APP_REQUEST_LOG=true
REACT_APP_RESPONSE_LOG=false
REACT_APP_RETRY_ATTEMPTS=3
```

Note: Use the `EXPO_PUBLIC_` prefix for environment variables that must be available in web builds.

---

## Testing the API Locally

```bash
# Start backend server
cd backend && npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Test version endpoint
curl http://localhost:3001/api/version

# Test with authentication
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  http://localhost:3001/api/version
```

---

## Service Architecture

```
Video URL --> POST /api/download --> downloadService
          --> audioService (extract audio)
          --> POST /api/transcribe --> transcriptionService (GitHub Models API)
          --> POST /api/recipes --> recipeExtractionService
          --> ingredientService + cookingStepsService
          --> JSON recipe response
```

**Backend services:**

| Service                      | Purpose                              |
|------------------------------|--------------------------------------|
| `downloadService.js`         | Download videos from URLs            |
| `audioService.js`            | Extract audio from video             |
| `transcriptionService.js`    | Transcribe audio via GitHub Models   |
| `recipeExtractionService.js` | Parse recipes from text              |
| `ingredientService.js`       | Parse ingredients                    |
| `cookingStepsService.js`     | Parse cooking instructions           |
| `cacheService.js`            | Cache transcriptions and results     |
| `costTracker.js`             | Track API usage costs                |
