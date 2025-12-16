# MyRecipeApp

A React Native cooking recipe app with media support, export/import functionality, and comprehensive CI/CD pipeline.

## Features

- 📝 Create, edit, and delete recipes
- 📷 Add images from camera/gallery
- 🎥 Link TikTok/YouTube videos to recipes
- 🤖 **NEW:** AI-powered recipe extraction from text/transcripts
- 📤 Export recipes to JSON
- 📥 Import recipes from JSON
- 🔍 Browse and search recipes
- 💾 Local storage with AsyncStorage
- 🌐 Works on web and mobile (Android/iOS)

## Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Storage:** AsyncStorage
- **Media:** expo-image-picker, expo-av
- **Testing:** Jest, React Native Testing Library
- **CI/CD:** GitHub Actions
- **Security:** npm audit, ESLint security plugin

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for mobile testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on web
npm run web

# Run on Android (with device/emulator)
npm run android

# Run on iOS (macOS only)
npm run ios
```

### Configuration (Optional)

#### AI Recipe Extraction Setup

To enable automatic recipe extraction from video descriptions/transcripts using **GitHub Models (FREE)**:

1. **Get a GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Cooking App")
   - Select scopes: `repo`, `read:packages`
   - Click "Generate token" and copy it

2. **Configure Environment:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your GitHub token
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```

3. **Restart the server:**
   ```bash
   npm start
   ```

**Note:** GitHub Models provides **FREE** access to GPT-4o and other AI models for GitHub users. No credit card required! Without the token, you can still add recipes manually.

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Security audit
npm run security

# Linting
npm run lint
```

## Project Workflow

### ⚠️ IMPORTANT: Never Work Directly on Main Branch

**ALWAYS create a feature branch before making any code changes.** Direct commits to `main` are not allowed.

### Development Process

#### 1. Create Issue
- **Title:** Clear, descriptive title
- **Body:** Detailed requirements and acceptance criteria
- **Labels:** `enhancement`, `bug`, `security`, `documentation`, or `chore`
- **Assign:** Assign to yourself or team member

#### 2. Create Branch (REQUIRED)
**Always branch from `main` before making any changes:**
```bash
git checkout main
git pull origin main
git checkout -b feature/issue-N-description
```

**Branch Naming Convention:**
- `feature/issue-5-recipe-media` - New features
- `bugfix/issue-10-export-crash` - Bug fixes
- `hotfix/critical-security-fix` - Urgent production fixes
- `chore/update-dependencies` - Maintenance tasks

#### 3. Develop Locally
- Make **atomic commits** (one logical change per commit)
- Reference issue in commits: `"feat: add image picker (Issue #5)"`
- Run tests locally before pushing
- Pre-commit hooks automatically run tests and security checks

**Commit Message Convention:**
```bash
feat: add image picker to recipe form (Issue #5)
fix: export crashes on empty recipes (Issue #5)
security: update vulnerable dependencies (Issue #5)
docs: update README with media features (Issue #5)
refactor: simplify export logic (Issue #5)
test: add unit tests for export function (Issue #5)
chore: update dependencies (Issue #5)
```

#### 4. Create Pull Request
- **Title:** `"Add feature X (Issue #N)"` or `"Fix bug Y (Issue #N)"`
- **Body:** Include `"Closes #N"` to auto-link and close issue
- **Description:** Summarize changes, testing status, and screenshots if applicable
- **Wait:** CI/CD pipeline must pass before merging

**PR Template:**
```markdown
## Summary
Brief description of changes

## Changes
- ✅ Feature/fix 1
- ✅ Feature/fix 2

## Testing
- ✅ Tests pass locally
- ✅ Tested on web
- 🟡 Mobile testing pending

Closes #N
```

#### 5. Review
- **Self-review:** Check code quality and test coverage
- **CI/CD:** Verify all checks pass (quality, test, security, build)
- **Address feedback:** Make changes if needed

#### 6. Merge
- **Method:** Use "Squash and merge" (keeps main history clean)
- **Auto-close:** Issue automatically closes when PR is merged
- **Branch:** Automatically deleted after merge

#### 7. If More Work Needed

**Option A: Small fix related to same issue**
```bash
git checkout main
git pull origin main
git checkout -b bugfix/issue-5-export-fix
# Make fix
# Create new PR: "Fix export bug (Issue #5)"
```

**Option B: New feature or unrelated change**
- Create **new issue** (e.g., Issue #6)
- Create PR for the new issue
- Follow workflow from step 2

**❌ Never:** Reopen or reuse merged PRs/branches

### Hotfix Workflow (Urgent Issues)

For critical bugs in production:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-description

# 2. Fix the issue quickly
# Make minimal changes

# 3. Create PR with [HOTFIX] prefix
# Title: "[HOTFIX] Fix critical security issue"

# 4. Fast-track review and merge
# 5. Deploy immediately
```

### Merge Strategy

**Squash and Merge (Recommended)**
- ✅ Clean main branch history (one commit per feature)
- ✅ Easy to revert entire features
- ✅ Simplified git log
- One squashed commit per PR on main

### Branch Protection Rules

Main branch is protected with:
- ✅ Require pull request before merging
- ✅ Require status checks to pass (quality, test, security, build)
- ✅ Require branches to be up to date before merging
- ❌ Force pushes disabled
- ✅ Automatic branch deletion after merge

## CI/CD Pipeline

The project uses GitHub Actions for automated testing and validation:

### Jobs

1. **Quality** - Code quality and linting checks
2. **Test** - Unit and integration tests with coverage
3. **Security** - npm audit and vulnerability scanning
4. **Build** - Build validation and configuration checks

### Pre-commit Hooks

Local hooks run before each commit:
- Jest tests
- npm security audit
- Prevents commits with failing tests or vulnerabilities

## Project Structure

```
MyRecipeApp/
├── App.js              # Main application file
├── assets/             # Images, fonts, etc.
├── components/         # Reusable components (legacy)
├── contexts/           # React contexts (legacy)
├── screens/            # Screen components (legacy)
├── coverage/           # Test coverage reports
├── jest.setup.js       # Jest configuration
├── package.json        # Dependencies and scripts
└── app.json           # Expo configuration
```

## Testing Documentation

### Automated Tests

The AI recipe extraction feature has been thoroughly tested:

- **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** - Quick overview and results
- **[TEST_RESULTS_REPORT.md](TEST_RESULTS_REPORT.md)** - Comprehensive test report
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Manual testing procedures

### Test Scripts

```bash
# Run single transcript test
node test-extraction-api.js

# Run all 6 transcript tests
node test-all-transcripts.js
```

### Test Data

- **test-transcripts.js** - Raw transcript data (6 diverse recipes)
- **TEST_TRANSCRIPTS_COPY.md** - Easy copy-paste format for manual testing

### Test Results Summary

✅ **100% Success Rate** (6/6 tests)  
⭐ **93% Quality Score** (6.5/7 average)  
⏱️ **2.7s Avg Response Time**  
💰 **$0.00 Cost** (FREE GitHub Models API)

## Contributing

1. **ALWAYS create a branch** before making changes (never work on main)
2. Follow the project workflow above
3. Ensure all tests pass
4. Update documentation as needed
5. Add tests for new features
6. Follow commit message conventions

## License

0BSD

## Support

For issues and questions, please create a GitHub issue using the appropriate template.
