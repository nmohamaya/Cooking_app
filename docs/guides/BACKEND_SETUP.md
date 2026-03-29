# Backend Setup Guide

Local development setup for the MyRecipeApp backend.

---

## Prerequisites

### Required Software

| Software | Minimum Version | Installation |
|----------|----------------|--------------|
| Node.js | 18.0.0 | [nodejs.org](https://nodejs.org/) |
| npm | 8.x | Included with Node.js |
| FFmpeg | 4.0+ | See platform instructions below |
| yt-dlp | Latest | See platform instructions below |
| Git | Any recent | [git-scm.com](https://git-scm.com/) |

### System Requirements

- Disk space: 2 GB minimum (temp video files)
- RAM: 2 GB minimum
- Reliable internet connection

---

## 1. Clone and Install

```bash
git clone https://github.com/nmohamaya/Cooking_app.git
cd Cooking_app/backend
npm install
```

---

## 2. Install System Dependencies

### macOS

```bash
brew install ffmpeg yt-dlp
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install ffmpeg python3-pip
sudo pip3 install yt-dlp
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install ffmpeg python3-pip
sudo pip3 install yt-dlp
```

### Windows

```bash
# Using Chocolatey
choco install ffmpeg yt-dlp

# Or download manually:
# FFmpeg: https://ffmpeg.org/download.html
# yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
# Add both to your PATH
```

### Verify Installation

```bash
node --version    # >= 18.0.0
ffmpeg -version
yt-dlp --version
```

---

## 3. Configure Environment Variables

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Edit with your values:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Required: GitHub token for AI transcription (GitHub Models API)
GITHUB_TOKEN=your_github_token_here

# Logging
LOG_LEVEL=debug

# Cost tracking
COST_TRACKING_ENABLED=true
COST_ALERT_THRESHOLD=1.00
COST_DAILY_LIMIT=50
COST_MONTHLY_LIMIT=500

# API limits
MAX_FILE_SIZE=500MB
VIDEO_TIMEOUT_MINUTES=60
MAX_VIDEO_DURATION_HOURS=1

# Cache
CACHE_TTL=86400
MAX_CACHE_ENTRIES=10000

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (use * for local dev, restrict in production)
CORS_ORIGIN=*
```

### Getting a GitHub Token

1. Go to [GitHub Settings > Developer Settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it (e.g., `MyRecipeApp-Dev`)
4. Select scopes: `read:user`
5. Generate and copy the token into your `.env` file

Never commit `.env` files to version control.

---

## 4. Create Required Directories

```bash
cd backend
mkdir -p temp/uploads temp/cache logs
```

---

## 5. Run the Server

### Development (auto-reload)

```bash
cd backend
npm run dev
```

### Production mode

```bash
cd backend
npm start
```

### Verify it is running

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "message": "Backend server is running"
}
```

---

## 6. Run Tests

```bash
cd backend
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

---

## 7. Linting

```bash
cd backend
npm run lint
```

The backend uses ESLint with `eslint-plugin-security` enabled.

---

## Development Workflow

A typical development session uses two terminals:

```bash
# Terminal 1: Run backend with auto-reload
cd backend && npm run dev

# Terminal 2: Run tests in watch mode
cd backend && npm run test:watch
```

### Debugging

```bash
# Verbose logging
DEBUG=* npm run dev

# Express-specific logging
DEBUG=express:* npm run dev

# Node inspector (for breakpoints)
node --inspect backend/server.js
```

---

## Troubleshooting

### Port already in use

```bash
lsof -i :3000
kill -9 <PID>
# Or use a different port:
PORT=3001 npm run dev
```

### Module not found errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### GitHub token invalid (401 Unauthorized)

Regenerate the token at GitHub Settings and update your `.env` file. Test with:

```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### FFmpeg not found

Reinstall using the platform instructions above and verify with `ffmpeg -version`.

### Permission denied on temp/logs directories

```bash
chmod 755 backend/temp backend/logs
```

### Tests pass locally but fail in CI

Ensure you are using Node.js 18 and run with `npm ci` instead of `npm install` to match CI behavior.
