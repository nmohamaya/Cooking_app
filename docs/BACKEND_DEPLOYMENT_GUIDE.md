# Backend Deployment Guide (Issue #115)

## Overview
This guide provides step-by-step instructions for deploying the MyRecipeApp backend to production using Railway or AWS Lambda. The backend handles video downloads, transcription, and recipe extraction from multiple platforms.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Railway Deployment](#railway-deployment-recommended)
3. [AWS Lambda Deployment](#aws-lambda-deployment)
4. [Cost Monitoring Setup](#cost-monitoring-setup)
5. [Environment Variables](#environment-variables)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Code Quality
- [ ] All tests passing: `npm test` (1126/1126)
- [ ] No vulnerabilities: `npm audit` (0 vulnerabilities)
- [ ] Code coverage > 85%: `npm run coverage`
- [ ] Linting passes: `npm run lint`
- [ ] All review comments resolved

### Environment Setup
- [ ] GitHub token configured (for Whisper API access)
- [ ] API keys for all integrations ready
- [ ] Database credentials prepared (if using)
- [ ] Logging configuration finalized
- [ ] Cost limits defined (daily/monthly)

### Backend Services
- [ ] Download service tested with all platforms (YouTube, TikTok, Instagram, Website)
- [ ] Transcription service verified with GitHub Models API
- [ ] Recipe extraction service tested with various transcripts
- [ ] Cost tracking service initialized and tested
- [ ] Error handling verified for all edge cases

### Performance Requirements
- [ ] Video download timeout: 5 minutes
- [ ] Audio extraction timeout: 3 minutes
- [ ] Transcription timeout: 10 minutes
- [ ] Recipe extraction timeout: 2 minutes
- [ ] Total request timeout: 30 minutes

### Security Checklist
- [ ] API keys not committed to repository
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Request validation implemented
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention enabled

---

## Railway Deployment (RECOMMENDED)

Railway is the recommended platform for this backend due to:
- Simple Git integration
- Automatic SSL/TLS
- Built-in environment variable management
- Excellent Node.js support
- Free tier available for testing

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git status
git add .
git commit -m "feat(#115): Backend deployment configuration"

# Push to main branch
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub account
3. Click "Create New Project"
4. Select "Deploy from GitHub Repo"
5. Authorize Railway to access your repositories
6. Select `Cooking_app` repository
7. Create project

### Step 3: Configure Environment Variables

In Railway dashboard:

```plaintext
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
GITHUB_TOKEN=your_github_token_here
LOG_LEVEL=info
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=1000
CACHE_MAX_ENTRIES=10000
MAX_VIDEO_SIZE=500
VIDEO_TIMEOUT=300
AUDIO_TIMEOUT=180
TRANSCRIPTION_TIMEOUT=600
RECIPE_EXTRACTION_TIMEOUT=120
```

### Step 4: Configure Start Command

In Railway settings:

```
Build Command: npm install
Start Command: npm start
```

### Step 5: Monitor Deployment

Railway Dashboard shows:
- Build progress
- Deployment status
- Live logs
- Error messages
- Performance metrics

```bash
# View deployment logs locally
railway logs --follow
```

### Step 6: Verify Deployment

Once deployed, verify endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Test download endpoint
curl -X POST https://your-app.railway.app/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=...", "platform": "youtube"}'

# Test cost tracking
curl https://your-app.railway.app/api/cost
```

### Step 7: Setup Monitoring

In Railway dashboard:
1. Enable "Crashlytics" for error tracking
2. Set up email alerts for deployment failures
3. Configure log retention (30 days)
4. Enable metrics collection

---

## AWS Lambda Deployment

Alternative deployment option using AWS Lambda for serverless operation.

### Step 1: Install AWS Tools

```bash
npm install -g aws-cli serverless
```

### Step 2: Configure AWS Credentials

```bash
aws configure
# Enter:
# AWS Access Key ID
# AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### Step 3: Create Serverless Configuration

Create `serverless.yml` in project root:

```yaml
service: cooking-app-backend
provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  memorySize: 1024
  timeout: 900
  environment:
    NODE_ENV: production
    GITHUB_TOKEN: ${env:GITHUB_TOKEN}
    COST_DAILY_LIMIT: 100
    COST_MONTHLY_LIMIT: 1000

functions:
  api:
    handler: backend/serverless.handler
    events:
      - http:
          path: {proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-plugin-warmup

package:
  exclude:
    - node_modules/**
    - .git/**
    - tests/**
```

### Step 4: Create Lambda Handler

Create `backend/serverless.js`:

```javascript
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app, {
  context: 'AWS_LAMBDA',
  notFoundConfig: {
    statusCode: 404,
    body: { message: 'Not Found' }
  }
});
```

### Step 5: Deploy to Lambda

```bash
# Set environment variables
export GITHUB_TOKEN=your_github_token_here

# Deploy
serverless deploy

# Get deployed endpoint
serverless info
```

### Step 6: Configure Lambda Settings

In AWS Lambda console:
- Memory: 1024 MB (may increase based on needs)
- Timeout: 900 seconds (15 minutes)
- Concurrency: 100 (start, increase based on usage)
- Ephemeral storage: 512 MB

### Step 7: Add CloudWatch Alarms

```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cooking-app-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Cost Monitoring Setup

### Daily Cost Tracking

The backend automatically tracks API usage costs via `costTracker.js`:

```javascript
// Automatic cost logging on each API call
GET /api/cost

Response:
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

### Cost Monitoring Dashboard

Access cost dashboard at:
```
Frontend: /screens/CostMonitoringScreen.js
Endpoint: GET /api/cost/stats
```

Display shows:
- Daily costs (last 30 days)
- Monthly total and projections
- Cost by service (transcription, extraction, etc.)
- Alert thresholds (yellow: 75%, red: 90%)
- Budget percentage used

### Alert Configuration

In `backend/.env`, configure limits:

```plaintext
# Daily spending limit (in USD)
COST_DAILY_LIMIT=100

# Monthly spending limit (in USD)
COST_MONTHLY_LIMIT=1000

# Alert thresholds (percentage of limit)
COST_WARNING_THRESHOLD=75
COST_ALERT_THRESHOLD=90
```

### Cost Tracking Events

The system logs costs for:
1. **Transcription** - Whisper API via GitHub Models
   - Cost: $0 (free with GitHub Copilot)
   - Tracked for: Audio duration, language detection
2. **Recipe Extraction** - Local processing (no cost)
3. **API Calls** - Infrastructure costs (fixed)

---

## Environment Variables

### Required Variables

```plaintext
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Authentication
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_RETENTION_DAYS=30
```

### Optional Configuration

```plaintext
# Cost Limits
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=1000
COST_WARNING_THRESHOLD=75
COST_ALERT_THRESHOLD=90

# Service Timeouts (in seconds)
VIDEO_DOWNLOAD_TIMEOUT=300
AUDIO_EXTRACTION_TIMEOUT=180
TRANSCRIPTION_TIMEOUT=600
RECIPE_EXTRACTION_TIMEOUT=120

# Cache Configuration
CACHE_MAX_ENTRIES=10000
CACHE_TTL_DAYS=30

# Database (if using)
DATABASE_URL=postgresql://user:pass@host:5432/db

# CORS
CORS_ORIGIN=https://yourfrontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Creating `.env.production`

```bash
# Copy example
cp backend/.env.example backend/.env.production

# Edit with production values
nano backend/.env.production

# Verify no secrets in git
git add backend/.env.production
```

---

## Monitoring & Logging

### Application Logging

The backend uses Winston logger with multiple transports:

```javascript
// Log levels: error, warn, info, debug, verbose
logger.info('Server started', { port, host });
logger.error('Download failed', { error, url });
logger.debug('Cache hit', { audioHash });
```

### Accessing Logs

#### Railway Deployment
```bash
railway logs --follow
# Real-time log streaming
```

#### AWS Lambda
```bash
# View CloudWatch logs
aws logs tail /aws/lambda/cooking-app-backend --follow

# Get specific time range
aws logs filter-log-events \
  --log-group-name /aws/lambda/cooking-app-backend \
  --start-time 1641600000000 \
  --end-time 1641700000000
```

### Key Metrics to Monitor

1. **Request Metrics**
   - Requests per minute
   - Average response time
   - Error rate (target: <0.1%)
   - P95 latency (target: <30 seconds)

2. **Service Metrics**
   - Download success rate (target: >95%)
   - Transcription accuracy (Whisper confidence)
   - Recipe extraction success rate (target: >80%)
   - Cache hit rate (target: >40%)

3. **Cost Metrics**
   - Daily cost (track against limit)
   - Cost per extraction (target: <$2)
   - Monthly projection
   - Cost by service

4. **Resource Metrics**
   - Memory usage (target: <80%)
   - CPU usage (target: <70%)
   - Disk space (target: >20% free)
   - Connection count (target: <100)

### Setting Up Alerts

#### Railway Alerts

1. Go to Project → Settings → Integrations
2. Add email notification for:
   - Deployment failures
   - Critical errors
   - High memory usage
   - High error rate

#### AWS CloudWatch Alarms

```bash
# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cooking-app-high-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name cooking-app-slow-execution \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 30000 \
  --comparison-operator GreaterThanThreshold
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails: "PORT is not available"
**Solution:**
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill the process
kill -9 <PID>
```

#### 2. GitHub Token Invalid
**Error:** `401 Unauthorized from GitHub Models API`
**Solution:**
```bash
# Verify token has correct permissions
# Token needs: read:user, repo (all)
# Update in railway/Lambda environment
export GITHUB_TOKEN=ghp_new_token
```

#### 3. Timeout on Large Videos
**Error:** `Video download timeout after 300 seconds`
**Solution:**
```bash
# Increase timeout in .env
VIDEO_DOWNLOAD_TIMEOUT=600  # 10 minutes

# Or optimize in downloadService.js
// Implement streaming download for large files
```

#### 4. Out of Memory
**Error:** `JavaScript heap out of memory`
**Solution:**
```bash
# Increase memory allocation
# Railway: Settings → Memory → Set to 2048 MB
# Lambda: Update memorySize to 2048 in serverless.yml

# Or optimize in service
// Implement streaming instead of loading entire file
```

#### 5. High Costs
**Error:** `Daily cost limit exceeded`
**Solution:**
1. Check transcription usage: `GET /api/cost`
2. Implement caching to avoid re-transcribing
3. Use GitHub Copilot (free transcription)
4. Optimize recipe extraction (currently free)

---

## Performance Optimization

### 1. Implement Caching
```javascript
// Already implemented in cacheService.js
// - 30-day TTL
// - LRU eviction strategy
// - In-memory for development, Redis for production
```

### 2. Use Connection Pooling
```javascript
// For database connections (if applicable)
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Optimize Video Downloads
```bash
# Download optimizations
- Stream large files instead of buffering
- Implement resume capability
- Parallel download segments for HTTP range requests
- Prefer smaller video resolutions if appropriate
```

### 4. Compress API Responses
```javascript
// In server.js
app.use(compression());
// Reduces response size by 60-80%
```

### 5. Implement Rate Limiting
```javascript
// Rate limit per IP: 100 requests per 15 minutes
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### 6. Database Indexing (if applicable)
```sql
-- Index frequently queried columns
CREATE INDEX idx_user_id ON videos(user_id);
CREATE INDEX idx_created_at ON videos(created_at);
CREATE INDEX idx_status ON jobs(status);
```

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Health check endpoint responds: `GET /health` → 200 OK
- [ ] All API endpoints accessible and responsive
- [ ] Error handling working (test with invalid input)
- [ ] Logging active and accessible
- [ ] Cost tracking initialized
- [ ] Monitoring alerts configured
- [ ] Database connection working (if applicable)
- [ ] CORS properly configured for frontend
- [ ] SSL/TLS certificate valid
- [ ] Rate limiting active
- [ ] API keys and secrets not exposed

---

## Rollback Procedure

If deployment fails or issues arise:

### Railway Rollback
```bash
# View deployment history
railway deployments list

# Rollback to previous deployment
railway deployments rollback <deployment-id>
```

### AWS Lambda Rollback
```bash
# Get previous Lambda version
aws lambda list-versions-by-function \
  --function-name cooking-app-backend

# Revert to previous version
aws lambda update-alias \
  --function-name cooking-app-backend \
  --name live \
  --function-version <previous-version>
```

---

## Support & Documentation

- **GitHub Issues**: [Project Issues](https://github.com/nmohamaya/Cooking_app/issues)
- **Backend Setup**: See `BACKEND_API_SETUP.md`
- **API Documentation**: See API endpoints in `BACKEND_API_SETUP.md`
- **Cost Tracking**: See `PHASE_3_NOTES.md`
- **Development Guide**: See `README.md`

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-07 | 1.0 | Initial deployment guide for Issue #115 |

