# Backend Server for MyRecipeApp

Production-ready Express.js API server for AI-powered video-to-recipe extraction, meal planning, and shopping list generation.

**Status:** ✅ Production Ready | **Tests:** 1,000+ | **Coverage:** 85%+ | **Security:** 0 Vulnerabilities

## Quick Start

```bash
cd backend

# Install dependencies
npm ci

# Create and configure environment
cp .env.example .env   # Edit .env and add your GITHUB_TOKEN

# Start development server (auto-reload on changes)
npm run dev            # Runs on http://localhost:3000

# Verify it's running
curl http://localhost:3000/health
```

## Architecture Overview

### Project Structure

```
backend/
├── server.js                         # Express app entry point
├── package.json                      # Dependencies
├── jest.config.js                    # Jest test configuration
├── .env.example                      # Environment variables template
├── config/
│   ├── env.js                        # Environment configuration
│   ├── logger.js                     # Winston logging setup
│   └── deploymentUtils.js            # Deployment validation & setup
├── routes/
│   ├── download.js                   # Video download endpoint
│   ├── transcribe.js                 # Audio transcription endpoint
│   ├── extract.js                    # Recipe extraction endpoint
│   ├── recipes.js                    # Recipe CRUD operations
│   └── cost.js                       # Cost tracking endpoints
├── services/
│   ├── downloadService.js            # yt-dlp video download wrapper
│   ├── audioService.js               # FFmpeg audio extraction
│   ├── transcriptionService.js       # Claude 3.5 Haiku transcription (GitHub Models API)
│   ├── aiExtractionService.js        # AI-powered recipe extraction from transcripts
│   ├── recipeExtractionService.js    # Recipe parsing & normalization
│   ├── recipeExtractionOrchestrator.js # Orchestrates download → transcribe → extract
│   ├── ingredientService.js          # Ingredient parsing & validation
│   ├── cookingStepsService.js        # Cooking steps extraction & formatting
│   ├── descriptionAnalyzerService.js # Analyzes video descriptions
│   ├── linkScrapingService.js        # Extracts links from descriptions
│   ├── cacheService.js               # In-memory caching for transcripts/recipes
│   └── costTracker.js                # Tracks AI API usage & costs
└── tests/
    ├── *.test.js                     # Unit & integration tests
    └── setup.js                      # Test configuration
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/version` | GET | API version |
| `/download` | POST | Download video & extract audio |
| `/transcribe` | POST | Transcribe audio to text |
| `/extract` | POST | Extract recipe from transcript |
| `/recipes` | GET/POST | Manage recipes |
| `/cost` | GET | View AI usage costs |

### Services Overview

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| **downloadService** | Download videos from YouTube, Instagram, TikTok | yt-dlp |
| **audioService** | Extract audio from downloaded video files | FFmpeg |
| **transcriptionService** | Convert audio to text using Claude 3.5 Haiku | GitHub Models API |
| **aiExtractionService** | Extract structured recipe data from transcript | Claude 3.5 Haiku |
| **recipeExtractionService** | Parse & normalize recipe JSON | — |
| **ingredientService** | Parse ingredient lists, validate quantities | — |
| **cookingStepsService** | Extract & format cooking instructions | — |
| **descriptionAnalyzerService** | Analyze video description metadata | — |
| **linkScrapingService** | Extract links from descriptions | — |
| **cacheService** | Cache transcripts & recipes to reduce API calls | Node.js memory |
| **costTracker** | Log & summarize AI API usage costs | — |

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token for Claude AI access (see instructions below) | `ghp_...` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment (development, production, test) |
| `PORT` | `3000` | Server port |
| `HOST` | `localhost` | Server hostname |
| `LOG_LEVEL` | `debug` | Winston log level (error, warn, info, debug) |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `MAX_FILE_SIZE` | `500MB` | Max upload file size |
| `UPLOAD_DIR` | `./temp/uploads` | Temp directory for uploads |
| `VIDEO_TIMEOUT_MINUTES` | `60` | Video download timeout |
| `MAX_VIDEO_DURATION_HOURS` | `1` | Max video duration allowed |
| `COST_TRACKING_ENABLED` | `true` | Enable AI cost tracking |
| `COST_ALERT_THRESHOLD` | `1.00` | Cost alert threshold (USD) |

### Setup Instructions

1. **Get a GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "MyRecipeApp Backend")
   - Select scopes: `repo`, `read:packages`
   - Click "Generate token" and copy it (you won't see it again)

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your token to `.env`:**
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   ```

4. **Restart the server:**
   ```bash
   npm run dev
   ```

## Running the Backend

### Development

```bash
# Install dependencies (clean install)
npm ci

# Start dev server with auto-reload
npm run dev

# Watch mode for tests
npm run test:watch
```

### Testing

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests without coverage
npm run test:nocover

# Check security vulnerabilities
npm run security

# Lint code (ESLint)
npm run lint
```

### Production

```bash
# Start production server
npm start

# Or use the deployment script
bash ../deploy.sh
```

### Verify Server Health

```bash
# Health check
curl http://localhost:3000/health

# API version
curl http://localhost:3000/api/version

# Download & transcribe a video
curl -X POST http://localhost:3000/download \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=..."}'
```

## System Dependencies

The backend requires system-level tools to be installed:

### Required

- **yt-dlp** — Download videos from YouTube, Instagram, TikTok, etc.
  - **Ubuntu/Debian:** `sudo apt install yt-dlp`
  - **macOS:** `brew install yt-dlp`
  - **Windows:** `choco install yt-dlp` or download from [GitHub](https://github.com/yt-dlp/yt-dlp)
  - **Verify:** `yt-dlp --version`

- **FFmpeg** — Extract audio from video files
  - **Ubuntu/Debian:** `sudo apt install ffmpeg`
  - **macOS:** `brew install ffmpeg`
  - **Windows:** `choco install ffmpeg` or download from [FFmpeg.org](https://ffmpeg.org)
  - **Verify:** `ffmpeg -version`

## Testing

The backend includes **1,000+ tests** with 85%+ code coverage:

```bash
# Run all tests
npm test

# Run tests and watch for changes
npm run test:watch

# Run tests without coverage report
npm run test:nocover

# Run specific test file
npm test -- cost.routes.test.js

# Update test snapshots (after intentional changes)
npm test -- -u
```

### Test Statistics

- Total tests: 1,000+
- Coverage: 85%+
- All tests automated via GitHub Actions CI/CD

## Logging

The backend uses **Winston** for structured logging:

### Log Files

- **Combined:** `logs/combined.log` — All logs
- **Error:** `logs/error.log` — Errors only
- **Cost Tracking:** `logs/cost-tracking.json` — AI API usage

### Log Levels (from `LOG_LEVEL` env var)

- `error` — Errors only
- `warn` — Warnings and errors
- `info` — General info + warnings + errors (production)
- `debug` — All logs including debug (development)

### Development Logging

In development mode, logs are also printed to the console:

```
[2026-03-30 10:15:23] info: Server started on http://localhost:3000
[2026-03-30 10:15:24] debug: GET /health 200 1.234ms
[2026-03-30 10:15:30] info: Transcribing audio from video...
```

## Deployment

The project includes an automated deployment script:

```bash
bash deploy.sh
```

This script:
1. Validates Node.js/npm versions
2. Verifies all required environment variables
3. Creates required directories (`logs/`, `temp/uploads/`, `temp/cache/`)
4. Installs dependencies
5. Runs tests and security audit
6. Deploys to production

For detailed deployment instructions, see [docs/guides/DEPLOYMENT.md](../docs/guides/DEPLOYMENT.md).

## Contributing

1. Create a branch: `git checkout -b feature/issue-XX-description`
2. Make changes and write tests for new functionality
3. Run tests: `npm test`
4. Run security audit: `npm run security`
5. Create a pull request
6. After merge, delete the feature branch

See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete contribution guidelines.
