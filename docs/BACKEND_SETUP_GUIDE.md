# Backend Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** v16 or higher ([download](https://nodejs.org/))
- **npm** v8 or higher (comes with Node.js)
- **FFmpeg** v4.0+ for audio processing
- **yt-dlp** for video downloading
- **Git** for version control

### System Requirements
- **Disk Space:** 2GB minimum (for temp video files)
- **RAM:** 2GB minimum
- **Internet:** Reliable connection required
- **OS:** macOS, Linux, or Windows

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/nmohamaya/Cooking_app.git
cd Cooking_app
```

---

## Step 2: Install Node.js Dependencies

```bash
npm install
```

This installs all required packages including:
- Express.js - Web framework
- FFmpeg-static - Audio processing
- axios - HTTP client
- dotenv - Environment configuration

---

## Step 3: Install System Dependencies

### macOS
```bash
# Using Homebrew
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

# Or manually:
# 1. Download FFmpeg from https://ffmpeg.org/download.html
# 2. Download yt-dlp from https://github.com/yt-dlp/yt-dlp/releases
# 3. Add to PATH environment variable
```

**Verify Installation:**
```bash
ffmpeg -version
yt-dlp --version
```

---

## Step 4: Configure Environment Variables

### Create .env File

Create a new file named `.env` in the `backend/` directory:

```bash
# Backend Configuration
NODE_ENV=development
PORT=3001

# GitHub Copilot Integration (FREE transcription)
GITHUB_TOKEN=your_github_token_here

# Cost Tracking Limits
COST_DAILY_LIMIT=50
COST_MONTHLY_LIMIT=500

# API Configuration
API_TIMEOUT=60000
MAX_VIDEO_DURATION=3600
MAX_FILE_SIZE=26214400

# Logging
LOG_LEVEL=debug
REQUEST_LOG=true
RESPONSE_LOG=false

# Cache Configuration
CACHE_TTL=86400
MAX_CACHE_ENTRIES=10000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Get GitHub Token

1. Go to [GitHub Settings → Developer Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name: `MyRecipeApp-Transcription`
4. Select scopes:
   - `gist` - For cache storage
   - `read:user` - For user info
5. Click **"Generate token"**
6. Copy token and paste into `.env` as `GITHUB_TOKEN`

⚠️ **Never commit `.env` file to version control!**

---

## Step 5: Create Required Directories

```bash
# Create temp directory for video files
mkdir -p backend/temp
mkdir -p backend/logs
mkdir -p backend/cache

# Create .gitkeep files to preserve directories
touch backend/temp/.gitkeep
touch backend/logs/.gitkeep
```

---

## Step 6: Run Locally

### Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
Backend server is ready!
```

### Test API Health

In another terminal:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Backend server is running",
  "uptime": 2.345
}
```

---

## Step 7: Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# Backend tests only
npm test -- backend/

# Integration tests only
npm test -- __tests__/integration/

# Watch mode for development
npm test -- --watch
```

### Expected Output

```
Test Suites: 22 passed, 22 total
Tests:       1126 passed, 1126 total
Snapshots:   0 total
Time:        ~235 seconds
```

---

## Step 8: Verify Installation

### Run Verification Script

```bash
npm run verify
```

This checks:
✅ Node.js version
✅ npm packages installed
✅ FFmpeg installed
✅ yt-dlp installed
✅ GitHub token valid
✅ .env file exists
✅ Directories created
✅ Server starts successfully

### Manual Verification

```bash
# Test video download
curl -X POST http://localhost:3001/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Test transcription
curl http://localhost:3001/api/transcribe/status/test-job-id

# Test API health
curl http://localhost:3001/health
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Run tests in watch mode
npm test -- --watch

# Terminal 3: Check logs
tail -f backend/logs/app.log
```

### Common Development Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run type checking (if using TypeScript)
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### Debugging

```bash
# Run with verbose logging
DEBUG=* npm run dev

# Run with specific module logging
DEBUG=express:* npm run dev

# Run with breakpoints (requires Node inspector)
node --inspect backend/server.js
```

---

## Troubleshooting Setup Issues

### Issue: `command not found: node`
**Solution:** Node.js not installed or not in PATH
```bash
# Check installation
node --version

# If not installed, download from nodejs.org
# Then add to PATH (especially on Windows)
```

### Issue: `FFmpeg not found`
**Solution:** FFmpeg not installed or not in PATH
```bash
# Verify installation
ffmpeg -version

# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Windows - Add to PATH if installed
```

### Issue: `Module not found errors`
**Solution:** Dependencies not installed
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: `GITHUB_TOKEN invalid`
**Solution:** Token is expired or incorrect
```bash
# Generate new token
# 1. Go to GitHub Settings → Developer Settings → Personal access tokens
# 2. Generate new token
# 3. Copy and update .env file

# Test token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### Issue: `Port 3001 already in use`
**Solution:** Another service using the port
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Issue: `Permission denied` on temp directory
**Solution:** Directory permissions issue
```bash
# Fix permissions
chmod 755 backend/temp
chmod 755 backend/logs

# On Windows, right-click folder → Properties → Security
```

### Issue: `Tests failing locally but passing in CI`
**Solution:** Environment differences
```bash
# Run with same environment as CI
NODE_ENV=test npm test

# Check for hardcoded paths or environment-specific code
grep -r "localhost" backend/
grep -r "/path/to" backend/
```

---

## Environment-Specific Setup

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
REQUEST_LOG=true
RESPONSE_LOG=true
```

### Testing Environment

```bash
# .env.test
NODE_ENV=test
PORT=3002
LOG_LEVEL=error
REQUEST_LOG=false
RESPONSE_LOG=false
GITHUB_TOKEN=test-token
```

### Production Environment

```bash
# .env.production (never commit!)
NODE_ENV=production
PORT=3001
LOG_LEVEL=warn
REQUEST_LOG=true
RESPONSE_LOG=false
GITHUB_TOKEN=<real-token>
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=2000
```

---

## Database Setup (Future)

When adding a database:

```bash
# PostgreSQL
npm install pg pg-promise

# MongoDB
npm install mongoose

# Setup migration
npm run db:migrate
npm run db:seed
```

---

## Docker Setup (Optional)

### Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t myrecipeapp-backend .

# Run container
docker run -p 3001:3001 \
  -e GITHUB_TOKEN=your-token \
  myrecipeapp-backend

# Run with .env file
docker run -p 3001:3001 --env-file .env myrecipeapp-backend
```

---

## Performance Optimization

### Enable Caching

```javascript
// backend/config/cache.js
const CACHE_CONFIG = {
  TTL: 86400, // 1 day
  MAX_SIZE: 10000, // entries
  STRATEGY: 'LRU' // Least Recently Used
};
```

### Enable Compression

```bash
npm install compression

// In server.js
const compression = require('compression');
app.use(compression());
```

### Enable Rate Limiting

```bash
npm install express-rate-limit

// In server.js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

---

## Deployment Preparation

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit passed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] API documentation updated
- [ ] Monitoring setup complete
- [ ] Backup strategy in place

### Security Checklist

- [ ] No hardcoded secrets
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error messages don't leak info

---

## Getting Help

- **Documentation:** See [API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **Issues:** Report on GitHub Issues
- **Email:** support@myrecipeapp.com
- **Discussion:** GitHub Discussions

---

**Happy coding! 🚀**

Last updated: January 10, 2026
