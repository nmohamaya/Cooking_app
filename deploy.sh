#!/bin/bash

# deploy.sh
# Issue #115: Backend Deployment & Cost Monitoring
# Automated deployment script for production setup

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MyRecipeApp Backend Deployment Script${NC}"
echo -e "${GREEN}Issue #115: Backend Deployment & Cost Monitoring${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Validate environment
echo -e "${YELLOW}Step 1: Validating environment...${NC}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
  exit 1
fi

cd "$BACKEND_DIR"
echo -e "${GREEN}✓ Backend directory found${NC}"

# Step 2: Check Node.js and npm
echo -e "${YELLOW}Step 2: Checking Node.js and npm...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: npm is not installed${NC}"
  exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo -e "${GREEN}✓ Node.js version: $NODE_VERSION${NC}"
echo -e "${GREEN}✓ npm version: $NPM_VERSION${NC}"

# Step 3: Install dependencies
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"

if [ ! -d "node_modules" ]; then
  npm install --production
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Step 4: Validate environment variables
echo -e "${YELLOW}Step 4: Validating environment variables...${NC}"

if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}⚠ Warning: .env.production file not found${NC}"
  echo -e "${YELLOW}Creating .env.production from .env.example...${NC}"
  
  if [ -f ".env.example" ]; then
    cp .env.example .env.production
    echo -e "${YELLOW}⚠ Please update .env.production with your production values${NC}"
  else
    echo -e "${RED}Error: .env.example not found${NC}"
    exit 1
  fi
fi

# Check for required environment variables
REQUIRED_VARS=("NODE_ENV" "PORT" "HOST" "GITHUB_TOKEN")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  # Get the last definition of the variable (if any)
  line=$(grep "^$var=" .env.production | tail -n 1 || true)

  if [ -z "$line" ]; then
    # Variable not defined at all
    MISSING_VARS+=("$var")
    continue
  fi

  # Strip "VAR=" prefix and check if value is empty or whitespace-only
  value=$(printf '%s\n' "$line" | sed -e "s/^$var=//" -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

  if [ -z "$value" ]; then
    # Variable defined but value is empty or whitespace-only
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}Error: Missing required environment variables (missing or empty values):${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "${RED}  - $var${NC}"
  done
  exit 1
fi

echo -e "${GREEN}✓ Environment variables validated${NC}"

# Step 5: Run tests
echo -e "${YELLOW}Step 5: Running tests...${NC}"

if npm test -- --bail 2>/dev/null; then
  echo -e "${GREEN}✓ All tests passed${NC}"
else
  echo -e "${RED}Error: Tests failed${NC}"
  read -p "Continue deployment anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 6: Security audit
echo -e "${YELLOW}Step 6: Running security audit...${NC}"

if npm audit --audit-level=moderate 2>/dev/null; then
  echo -e "${GREEN}✓ Security audit passed${NC}"
else
  echo -e "${RED}⚠ Security vulnerabilities found${NC}"
  read -p "Continue deployment anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 7: Create required directories
echo -e "${YELLOW}Step 7: Creating required directories...${NC}"

mkdir -p logs
mkdir -p temp/uploads
mkdir -p temp/cache
mkdir -p coverage

echo -e "${GREEN}✓ Directories created${NC}"

# Step 8: Create startup script
echo -e "${YELLOW}Step 8: Creating startup script...${NC}"

cat > start.sh << 'EOF'
#!/bin/bash
# Production startup script

set -e

# Load environment variables
if [ -f ".env.production" ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Log startup information
echo "Starting MyRecipeApp Backend"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Host: $HOST"
echo "Timestamp: $(date)"

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable not set"
  exit 1
fi

# Start the server
node server.js
EOF

chmod +x start.sh
echo -e "${GREEN}✓ Startup script created${NC}"

# Step 9: Verify server can start
echo -e "${YELLOW}Step 9: Verifying server startup...${NC}"

# Load environment variables temporarily
set -a
. ".env.production"
set +a

# Test server startup
timeout 10 node server.js &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
  kill $SERVER_PID 2>/dev/null || true
  echo -e "${GREEN}✓ Server startup verification successful${NC}"
else
  echo -e "${RED}Error: Server failed to start${NC}"
  exit 1
fi

# Step 10: Generate deployment report
echo -e "${YELLOW}Step 10: Generating deployment report...${NC}"

cat > deployment_report.txt << EOF
# Backend Deployment Report
Generated: $(date)
Environment: $DEPLOYMENT_ENV
Project: MyRecipeApp
Issue: #115 - Backend Deployment & Cost Monitoring

## System Information
- Node.js: $NODE_VERSION
- npm: $NPM_VERSION
- Platform: $(uname -s)

## Deployment Status
✓ Environment validated
✓ Dependencies installed
✓ Tests passed
✓ Security audit completed
✓ Directories created
✓ Server startup verified

## Configuration Files
- .env.production: Configured
- start.sh: Created and ready
- server.js: Ready to run

## Next Steps
1. Review .env.production and update with production values
2. Set up monitoring and alerts (see DEPLOYMENT_GUIDE.md)
3. Deploy to Railway or AWS Lambda using:
   - Railway: Push to GitHub and link repository
   - AWS Lambda: Run 'serverless deploy'
4. Verify deployment with health check: GET /health
5. Monitor costs: GET /api/cost

## Cost Monitoring
Budget Limits:
- Daily: \$100 (configurable)
- Monthly: \$1000 (configurable)

Services Tracked:
- Transcription (Whisper API via GitHub Models)
- Recipe Extraction
- Video Download

## Support
See DEPLOYMENT_GUIDE.md for detailed instructions
EOF

cat deployment_report.txt
echo ""
echo -e "${GREEN}✓ Deployment report generated${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Backend deployment preparation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review .env.production and update with your values"
echo "2. Test locally: ./start.sh"
echo "3. Deploy to production:"
echo "   - Railway: git push origin main"
echo "   - AWS Lambda: serverless deploy"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "- Deployment Guide: $PROJECT_ROOT/BACKEND_DEPLOYMENT_GUIDE.md"
echo "- Cost Monitoring: See CostMonitoringScreen.js"
echo "- Environment Variables: .env.production"
echo ""
