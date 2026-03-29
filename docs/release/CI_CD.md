# CI/CD Infrastructure

**Status**: ✅ All tests passing (1126/1126) | Security: 0 vulnerabilities  
**Last Updated**: January 17, 2026

This document explains the CI/CD pipeline and testing requirements for MyRecipeApp.

## Pipeline Overview

The GitHub Actions CI/CD pipeline consists of 4 parallel jobs:

### 1. **Quality Job** (`quality`)
- Validates package.json
- Runs ESLint for code quality
- Checks code style and formatting

### 2. **Test Job** (`test`)
- Runs Jest unit and integration tests
- Generates coverage reports
- Fails if tests don't pass

### 3. **Security Job** (`security`)
- Runs `npm audit` to check for vulnerabilities
- Uses dependency-review-action for PR dependencies
- Checks for known security issues

### 4. **Build Job** (`build`)
- Validates app.json configuration
- Checks web build compilation
- Ensures bundle is valid

### 5. **Final Status** (`ci-status`)
- Aggregates all job results
- Fails if any job fails
- Provides clear pass/fail signal

## Running Tests Locally

### Install Dependencies
```bash
cd MyRecipeApp
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Security Audit
```bash
npm run security
```

## Branch Protection Rules

### Main Branch
- ✅ All CI checks must pass
- ✅ At least 1 approval required
- ✅ Strict status checks enabled
- ✅ Admin reviews enforced

### Develop Branch
- ✅ All CI checks must pass
- ⚠️ No approval required
- ✅ Strict status checks enabled

## Pre-commit Hooks

To enable pre-commit hooks (optional):
```bash
cd /home/nav/Projects/Cooking_app
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

This will automatically run tests and security checks before committing.

## Coverage Requirements

- Minimum coverage: 70%
- All new features must include tests
- Coverage reports generated in CI

## Security Requirements

- npm audit passes at "moderate" level
- No critical vulnerabilities
- Dependencies kept up-to-date
- No secrets committed

## PR Checklist

Before submitting a PR:
- [ ] `npm test` passes locally
- [ ] `npm run security` passes
- [ ] Coverage maintained or improved
- [ ] No console errors/warnings
- [ ] Code follows style guide
- [ ] Changes documented

## Troubleshooting

### Tests failing locally but passing in CI
- Clear cache: `npm test -- --clearCache`
- Reinstall: `rm -rf node_modules && npm install`

### Security audit false positives
- Check audit: `npm audit --json`
- Review vulnerabilities: `npm audit fix`

### Coverage below threshold
- Run: `npm run test:coverage`
- Review report: `MyRecipeApp/coverage/index.html`

## Resources
- [Jest Documentation](https://jestjs.io/)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub Actions](https://docs.github.com/en/actions)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
