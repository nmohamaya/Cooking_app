# Deployment Guide

Production deployment for MyRecipeApp backend, web frontend, and mobile builds.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
   - [Using deploy.sh](#using-deploysh)
   - [Railway (Recommended)](#railway-recommended)
   - [AWS Lambda](#aws-lambda)
3. [Frontend Web Deployment](#frontend-web-deployment)
   - [Vercel (Recommended)](#vercel-recommended)
   - [Netlify](#netlify)
   - [AWS S3 + CloudFront](#aws-s3--cloudfront)
4. [Mobile Builds](#mobile-builds)
   - [Android (Google Play)](#android-google-play)
   - [iOS (App Store)](#ios-app-store)
5. [Environment Variables](#environment-variables)
6. [Cost Monitoring](#cost-monitoring)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Run these checks from the project root before any deployment:

```bash
# Frontend tests
cd MyRecipeApp && npm test

# Backend tests
cd backend && npm test

# Security audit (both)
cd MyRecipeApp && npm run security
cd backend && npm run security

# Expo dependency alignment
cd MyRecipeApp && npx expo install --check

# Linting
cd MyRecipeApp && npm run lint
cd backend && npm run lint
```

All tests must pass with 100% pass rate and 0 security vulnerabilities before deploying.

---

## Backend Deployment

### Using deploy.sh

The automated deployment script handles validation, testing, and preparation:

```bash
bash deploy.sh
```

The script performs these steps:

1. Validates the backend directory exists
2. Checks Node.js and npm are installed
3. Installs production dependencies
4. Validates required environment variables in `.env.production`
5. Runs the test suite
6. Runs a security audit
7. Creates required directories (`logs/`, `temp/uploads/`, `temp/cache/`, `coverage/`)
8. Generates a `start.sh` startup script
9. Verifies the server can start
10. Generates a deployment report

**Required:** The script expects a `backend/.env.production` file with these variables set:

- `NODE_ENV`
- `PORT`
- `HOST`
- `GITHUB_TOKEN`

If `.env.production` does not exist, the script copies `.env.example` as a starting point.

---

### Railway (Recommended)

Railway is recommended for its simple Git integration, automatic SSL, and built-in environment variable management.

**Setup:**

1. Sign in at [railway.app](https://railway.app) with GitHub
2. Create a new project and select "Deploy from GitHub Repo"
3. Select the `Cooking_app` repository

**Configure build settings:**

```
Build Command: npm install
Start Command: npm start
```

**Set environment variables** in the Railway dashboard:

```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
GITHUB_TOKEN=<your_token>
LOG_LEVEL=info
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=1000
CORS_ORIGIN=https://yourfrontend.com
```

**Verify deployment:**

```bash
curl https://your-app.railway.app/health
```

**View logs:**

```bash
railway logs --follow
```

**Rollback:**

```bash
railway deployments list
railway deployments rollback <deployment-id>
```

---

### AWS Lambda

Alternative serverless deployment using the Serverless Framework.

**Install tools:**

```bash
npm install -g serverless
aws configure
```

**Create `serverless.yml`** in the project root:

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
          path: '{proxy+}'
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

**Create `backend/serverless.js`:**

```javascript
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
```

**Deploy:**

```bash
export GITHUB_TOKEN=your_token
serverless deploy
```

**Recommended Lambda settings:**

- Memory: 1024 MB (increase if needed)
- Timeout: 900 seconds (15 minutes)
- Concurrency: 100 (adjust based on usage)
- Ephemeral storage: 512 MB

**Rollback:**

```bash
aws lambda list-versions-by-function --function-name cooking-app-backend
aws lambda update-alias \
  --function-name cooking-app-backend \
  --name live \
  --function-version <previous-version>
```

---

## Frontend Web Deployment

### Vercel (Recommended)

Zero-config deployment with automatic CI/CD from GitHub.

1. Sign in at [vercel.com](https://vercel.com) with GitHub
2. Import the repository
3. Configure:
   ```
   Framework: Create React App
   Build Command: npm run build
   Output Directory: build
   ```
4. Set environment variables (use `EXPO_PUBLIC_` prefix for web builds):
   ```
   EXPO_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. Deploy triggers automatically on push to main

**Rollback:**

```bash
vercel list
vercel rollback <url>
```

---

### Netlify

1. Sign in at [netlify.com](https://netlify.com)
2. Click "New site from Git" and select the repository
3. Configure:
   ```
   Build command: npm run build
   Publish directory: build
   ```
4. Add environment variables under Site settings > Build & deploy > Environment

Custom domain: Domain Management > Add custom domain > Point DNS to Netlify nameservers.

---

### AWS S3 + CloudFront

```bash
# Create bucket
aws s3 mb s3://myrecipeapp-web

# Build and upload
npm run build
aws s3 sync build/ s3://myrecipeapp-web/ --delete --cache-control "public, max-age=3600"

# Create CloudFront distribution
# AWS Console > CloudFront > Create Distribution
# Origin: S3 bucket, Default Root Object: index.html, Compress: Yes

# Invalidate cache after deploy
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

**Rollback:**

```bash
aws s3 sync s3://backup-bucket/build-backup/ s3://myrecipeapp-web/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

---

## Mobile Builds

MyRecipeApp uses Expo Application Services (EAS) for mobile builds.

EAS Project ID: `41ca11bf-7f02-4bd4-94c7-1ea1405446be`

### Android (Google Play)

```bash
cd MyRecipeApp
npx eas build --platform android
```

**Play Console submission:**

1. Upload the build artifact to Google Play Console
2. Start with Internal Testing, then Closed Testing, then Production
3. Required store listing assets:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - 8+ screenshots
   - Privacy policy URL
   - Content rating questionnaire

Review timeline: 2-24 hours.

### iOS (App Store)

```bash
cd MyRecipeApp
npx eas build --platform ios
```

**Requires:**

- Apple Developer Account ($99/year)
- App Store Connect configuration (bundle ID, signing, etc.)

**Submission:**

1. Upload build via Xcode Organizer or Transporter
2. Configure app information in App Store Connect
3. Submit for review

Review timeline: 1-3 days.

---

## Environment Variables

### Backend Production (`backend/.env.production`)

**Required:**

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
LOG_LEVEL=info
```

**Optional:**

```env
# Cost limits (USD)
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=1000
COST_WARNING_THRESHOLD=75
COST_ALERT_THRESHOLD=90

# Timeouts (seconds)
VIDEO_DOWNLOAD_TIMEOUT=300
AUDIO_EXTRACTION_TIMEOUT=180
TRANSCRIPTION_TIMEOUT=600
RECIPE_EXTRACTION_TIMEOUT=120

# Cache
CACHE_MAX_ENTRIES=10000
CACHE_TTL_DAYS=30

# Security
CORS_ORIGIN=https://yourfrontend.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend

Environment variables for web builds must use the `EXPO_PUBLIC_` prefix:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
EXPO_PUBLIC_GITHUB_TOKEN=<token>
```

Never commit `.env` files to version control.

---

## Cost Monitoring

The backend tracks AI API usage costs automatically via the `costTracker` service.

**Check current costs:**

```bash
curl https://your-backend/api/cost
```

**Response includes:**

- Total cost and monthly breakdown
- Cost per service (transcription, extraction)
- Extraction count and average cost
- Budget percentage used

**Configure limits** via environment variables:

```env
COST_DAILY_LIMIT=100
COST_MONTHLY_LIMIT=1000
COST_WARNING_THRESHOLD=75    # Yellow alert at 75%
COST_ALERT_THRESHOLD=90      # Red alert at 90%
```

The frontend CostMonitoring screen displays a dashboard with daily costs, monthly projections, and alert thresholds.

---

## Monitoring and Logging

The backend uses Winston for structured logging with configurable levels (`error`, `warn`, `info`, `debug`, `verbose`).

### Key Metrics to Monitor

| Category | Metric | Target |
|----------|--------|--------|
| Requests | Error rate | < 0.1% |
| Requests | P95 latency | < 30 seconds |
| Services | Download success rate | > 95% |
| Services | Recipe extraction success rate | > 80% |
| Services | Cache hit rate | > 40% |
| Resources | Memory usage | < 80% |
| Resources | CPU usage | < 70% |
| Cost | Cost per extraction | < $2 |

### Railway Logs

```bash
railway logs --follow
```

### AWS CloudWatch Logs

```bash
aws logs tail /aws/lambda/cooking-app-backend --follow
```

### Setting Up Alerts

**Railway:** Project > Settings > Integrations > Add email notifications for deployment failures and critical errors.

**AWS CloudWatch:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name cooking-app-high-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## Rollback Procedures

### Backend

| Platform | Command |
|----------|---------|
| Railway | `railway deployments rollback <id>` |
| AWS Lambda | Update alias to previous function version |

### Frontend Web

| Platform | Command |
|----------|---------|
| Vercel | `vercel rollback <url>` |
| Netlify | Deploys > Select previous version > Restore |
| AWS S3 | Sync from backup bucket, invalidate CloudFront |

---

## Troubleshooting

### Backend

**Port not available:**

```bash
lsof -i :3000
kill -9 <PID>
```

**GitHub token invalid (401 Unauthorized):**
Regenerate the token at GitHub Settings and update in your deployment platform's environment variables.

**Timeout on large videos:**
Increase `VIDEO_DOWNLOAD_TIMEOUT` in environment variables (default: 300 seconds).

**Out of memory:**
Increase memory allocation on your platform (Railway: Settings > Memory; Lambda: update `memorySize` in serverless.yml).

**Daily cost limit exceeded:**
Check usage at `GET /api/cost`. Review caching effectiveness and consider adjusting limits.

### Frontend Web

**Blank page on load:**
Verify the API URL environment variable is set correctly in the deployment platform.

**API errors in production:**
Confirm the backend is running and the CORS origin is configured to allow requests from the frontend domain.

**Slow load times:**
Analyze bundle size with `npm run analyze`. Consider code splitting and lazy loading.

### Post-Deployment Verification

After any deployment, confirm:

- `GET /health` returns 200 OK
- API endpoints respond correctly
- Error handling works (test with invalid input)
- Logs are being captured
- Cost tracking is active
- CORS allows the frontend origin
- SSL/TLS certificate is valid
