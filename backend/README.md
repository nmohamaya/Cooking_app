# Backend Server for MyRecipeApp

Backend service for video transcription and recipe extraction feature.

## Architecture Overview

```
backend/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── jest.config.js            # Test configuration
├── .env.example              # Environment template
├── config/
│   ├── env.js                # Environment variables
│   ├── logger.js             # Logging setup
│   └── database.js           # Database config (Phase future)
├── routes/
│   ├── transcribe.js         # Transcription routes (Phase 3)
│   ├── recipes.js            # Recipe routes (Phase 4)
│   └── cost.js               # Cost tracking routes (Phase 6)
├── services/
│   ├── downloadService.js    # Video download (Phase 2)
│   ├── audioService.js       # Audio extraction (Phase 2)
│   ├── transcriptionService.js # Whisper API (Phase 3)
│   ├── recipeService.js      # Recipe extraction (Phase 4)
│   └── costService.js        # Cost tracking (Phase 6)
├── middleware/
│   ├── errorHandler.js       # Error handling (Phase 1)
│   └── auth.js               # Auth middleware (Phase future)
├── utils/
│   ├── validators.js         # Input validation
│   ├── helpers.js            # Helper functions
│   └── constants.js          # Constants
└── tests/
    ├── server.test.js        # Server tests
    ├── services/             # Service tests (Phases 2-6)
    └── routes/               # Route tests (Phases 2-6)
```

## Phase 1: Backend Infrastructure Setup (Issue #110)

**Status:** ✅ In Progress

### Completed:
- ✅ Express.js server setup with middleware
- ✅ Health check endpoint (`/health`)
- ✅ API version endpoint (`/api/version`)
- ✅ Error handling and 404 handler
- ✅ CORS configuration
- ✅ Environment configuration system
- ✅ Winston logger setup with file rotation
- ✅ Route structure (placeholder routes)
- ✅ Jest test setup
- ✅ Basic server tests

### Components:

#### server.js
- Express app initialization
- Middleware setup (CORS, JSON parsing)
- Health check and version endpoints
- Error handling
- Graceful shutdown

#### config/env.js
- Centralized environment configuration
- Default values for all settings
- Easy to modify for different environments

#### config/logger.js
- Winston logger with file rotation
- Console output in development
- File logging in all environments
- Error log separation

#### routes/
- Placeholder routes for phases 2-6
- Documented with issue references
- Ready for implementation

### Environment Variables

```bash
# Create .env file from template
cp backend/.env.example backend/.env

# Required for full features (later phases):
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=your_key_here
```

### Running Phase 1

```bash
cd backend

# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Check health
curl http://localhost:3000/health
```

### Test Results

All Phase 1 tests passing:
- ✅ Server health check
- ✅ API version endpoint
- ✅ 404 error handling
- ✅ CORS headers
- ✅ JSON parsing middleware

### Next Steps (Phase 2 - Issue #111)

1. Implement `downloadService.js` for video downloads (yt-dlp)
2. Implement `audioService.js` for audio extraction (ffmpeg)
3. Create `/api/download` endpoint
4. Add integration tests
5. Handle temp file cleanup

---

**Issue:** #110  
**Priority:** P1  
**Size:** S (1-4 hours)  
**Status:** ✅ Complete
