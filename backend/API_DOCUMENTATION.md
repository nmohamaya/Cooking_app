# Backend API Documentation

## API Overview

The MyRecipeApp backend provides REST API endpoints for video downloading, audio extraction, transcription, and recipe parsing.

**Base URL:** `http://localhost:3001` (development)  
**API Prefix:** `http://localhost:3001/api`

---

## Authentication

Currently, the API uses GitHub token authentication:

```bash
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  http://localhost:3001/api/health
```

Future: API key authentication will be implemented for frontend apps.

---

## Response Format

All responses use JSON format:

### Success Response (200 OK)

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

### Error Response (4xx, 5xx)

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

## Endpoints

### Health & Status

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "message": "Backend server is running",
  "uptime": 1234.56,
  "timestamp": "2026-01-10T15:30:00Z"
}
```

**Status Codes:** 200 OK

---

#### GET /api/version

Get API version information.

**Response:**
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

**Status Codes:** 200 OK

---

### Video Processing

#### POST /api/download

Download a video and extract audio.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "high",
  "format": "mp4"
}
```

**Parameters:**
- `url` (string, required) - Video URL
- `quality` (string) - Video quality: `high`, `medium`, `low` (default: `high`)
- `format` (string) - Output format: `mp4`, `webm`, `avi` (default: `mp4`)

**Response:**
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
- `202 Accepted` - Job created, processing started
- `400 Bad Request` - Invalid URL format
- `404 Not Found` - Video not available
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Error Codes:**
- `INVALID_URL` - URL format is invalid
- `VIDEO_NOT_FOUND` - Video doesn't exist
- `VIDEO_PRIVATE` - Video is private or restricted
- `VIDEO_TOO_LONG` - Video exceeds 1-hour limit
- `DOWNLOAD_FAILED` - Download process failed
- `RATE_LIMIT_EXCEEDED` - Rate limit hit

---

#### GET /api/download/:jobId

Get download job status.

**Parameters:**
- `jobId` (path, required) - Job ID from POST /api/download

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "download-12345",
    "status": "processing",
    "progress": 65,
    "steps": {
      "download": "completed",
      "extract": "in_progress",
      "convert": "pending"
    },
    "videoFile": "/tmp/video-12345.mp4",
    "audioFile": "/tmp/audio-12345.wav",
    "estimatedTimeRemaining": 20
  }
}
```

**Status:** `processing` | `completed` | `failed` | `cancelled`

**Status Codes:**
- `200 OK` - Status retrieved
- `404 Not Found` - Job ID not found
- `500 Internal Server Error` - Server error

---

#### DELETE /api/download/:jobId

Cancel a download job.

**Parameters:**
- `jobId` (path, required) - Job ID

**Response:**
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
- `200 OK` - Job cancelled
- `404 Not Found` - Job not found
- `409 Conflict` - Job already completed

---

### Transcription

#### POST /api/transcribe

Start audio transcription job.

**Request:**
```json
{
  "audioPath": "/tmp/audio-12345.wav",
  "language": "en",
  "model": "base"
}
```

**Parameters:**
- `audioPath` (string, required) - Path to audio file
- `language` (string) - Language code: `en`, `es`, `fr`, etc. (auto-detect if omitted)
- `model` (string) - Model size: `tiny`, `base`, `small`, `medium`, `large` (default: `base`)

**Response:**
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
- `202 Accepted` - Transcription job created
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Audio file not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

#### GET /api/transcribe/:jobId

Get transcription job status.

**Parameters:**
- `jobId` (path, required) - Job ID from POST /api/transcribe

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "transcribe-12345",
    "status": "completed",
    "progress": 100,
    "transcript": "Welcome to the recipe cooking tutorial...",
    "language": "en",
    "duration": 125,
    "confidence": 0.92,
    "cost": 0.00,
    "processedAt": "2026-01-10T15:30:00Z"
  }
}
```

**Status:** `queued` | `processing` | `completed` | `failed`

**Status Codes:**
- `200 OK` - Status retrieved
- `404 Not Found` - Job not found
- `500 Internal Server Error` - Server error

---

### Recipe Extraction

#### POST /api/recipes

Extract recipe from transcript or video.

**Request:**
```json
{
  "transcript": "First, gather 2 cups of flour...",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "extractMetadata": true
}
```

**Parameters:**
- `transcript` (string) - Transcribed text
- `videoUrl` (string) - Original video URL (for metadata)
- `extractMetadata` (boolean) - Extract title, duration, etc. (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "recipe": {
      "title": "Chocolate Cake",
      "servings": 8,
      "prepTime": 15,
      "cookTime": 35,
      "difficulty": "medium",
      "ingredients": [
        {
          "name": "all-purpose flour",
          "quantity": 2,
          "unit": "cups"
        }
      ],
      "instructions": [
        "Preheat oven to 350°F",
        "Mix dry ingredients..."
      ]
    },
    "confidence": 0.88,
    "extractedAt": "2026-01-10T15:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Recipe extracted
- `400 Bad Request` - Invalid input
- `422 Unprocessable Entity` - No recipe found in transcript
- `500 Internal Server Error` - Extraction failed

---

### Cost Tracking

#### GET /api/costs/stats

Get cost statistics.

**Query Parameters:**
- `period` (string) - `day`, `month`, `all` (default: `month`)

**Response:**
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
      {"date": "2026-01-01", "cost": 0.50},
      {"date": "2026-01-02", "cost": 0.75}
    ]
  }
}
```

**Status Codes:**
- `200 OK` - Stats retrieved
- `500 Internal Server Error` - Server error

---

#### GET /api/costs/log

Get detailed cost log.

**Query Parameters:**
- `limit` (number) - Number of entries (default: 100, max: 1000)
- `offset` (number) - Skip entries (default: 0)
- `startDate` (date) - ISO 8601 format
- `endDate` (date) - ISO 8601 format

**Response:**
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

**Status Codes:**
- `200 OK` - Log retrieved
- `400 Bad Request` - Invalid date format
- `500 Internal Server Error` - Server error

---

### Caching

#### GET /api/cache/:hash

Get cached transcription by audio hash.

**Parameters:**
- `hash` (path, required) - SHA256 hash of audio

**Response:**
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
- `200 OK` - Cache hit
- `404 Not Found` - Not in cache
- `410 Gone` - Cache expired

---

#### DELETE /api/cache/:hash

Remove specific cached entry.

**Parameters:**
- `hash` (path, required) - SHA256 hash

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cache entry deleted",
    "hash": "abc123..."
  }
}
```

**Status Codes:**
- `200 OK` - Deleted
- `404 Not Found` - Not found

---

#### POST /api/cache/clear

Clear entire cache.

**Response:**
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

**Status Codes:**
- `200 OK` - Cache cleared
- `500 Internal Server Error` - Clear failed

---

## Rate Limiting

**Limits:**
- 100 requests per 15 minutes per IP
- 10 concurrent downloads per user
- 5 concurrent transcriptions per user

**Response when limit exceeded:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_URL | 400 | URL format invalid |
| VIDEO_NOT_FOUND | 404 | Video doesn't exist |
| VIDEO_PRIVATE | 403 | Video is private |
| VIDEO_TOO_LONG | 413 | Video exceeds time limit |
| DOWNLOAD_FAILED | 500 | Download process failed |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| NO_RECIPE_FOUND | 422 | No recipe in transcript |
| INVALID_AUDIO | 400 | Audio file corrupt |
| TRANSCRIPTION_FAILED | 500 | Transcription failed |
| CACHE_ERROR | 500 | Cache operation failed |
| INTERNAL_ERROR | 500 | Server error |

---

## Example Workflows

### Complete Video to Recipe Extraction

```bash
# 1. Download video
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=..."}'
# Returns: {"data": {"jobId": "download-123"}}

# 2. Check download status
curl http://localhost:3001/api/download/download-123
# Wait until status = "completed"

# 3. Transcribe audio
curl -X POST http://localhost:3001/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audioPath": "/tmp/audio-123.wav"}'
# Returns: {"data": {"jobId": "transcribe-456"}}

# 4. Check transcription status
curl http://localhost:3001/api/transcribe/transcribe-456
# Wait until status = "completed"

# 5. Extract recipe
curl -X POST http://localhost:3001/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"transcript": "...full transcript..."}'
# Returns: {"data": {"recipe": {...}, "confidence": 0.92}}
```

---

## Testing API Locally

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  http://localhost:3001/api/version

# Test POST with data
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

**API Documentation Version:** 1.0  
**Last Updated:** January 10, 2026
