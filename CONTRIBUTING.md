# Contribution Guidelines

## Development Workflow

**📋 See [README.md](./README.md#development-workflow) for the complete development workflow.**

The workflow includes:
- Issue creation and project board management
- Branch naming conventions (feature/issue-XX, fix/issue-XX, docs/issue-XX)
- Commit message standards with issue references
- 9-step PR process with critical verification step
- Post-merge cleanup procedures
- Best practices and common issues/solutions

## Quick Reference Checklist

### ✅ Before Starting Work
- [ ] Create an issue (required before any code changes)
- [ ] Set issue status to "In Progress" in GitHub Project
- [ ] Create feature branch: `git checkout -b feature/issue-N-description`

### ✅ During Development
- [ ] Write tests for new functionality (target: 90%+ coverage)
- [ ] Run tests locally: `npm test`
- [ ] Run security audit: `npm run security`
- [ ] Make atomic commits with issue reference: `fix(#N): description`

### ✅ Before Creating PR
- [ ] All tests pass locally (532/532)
- [ ] Security audit passes (0 vulnerabilities)
- [ ] Code is self-reviewed
- [ ] Commit messages reference issue number

### ✅ Creating PR
- [ ] Push branch: `git push origin feature/issue-N-description`
- [ ] Create PR with: `Closes #N` in description
- [ ] Set issue status to "In Review"
- [ ] Request human reviewers

### ⚠️ CRITICAL - Verify PR Functionality (Step 5)
**This prevents shipping broken code. All PRs require:**
- [ ] `npx expo install --check` passes (all dependencies aligned)
- [ ] `npm test` passes (532/532 tests, 91.32%+ coverage)
- [ ] `npm run security` passes (0 vulnerabilities)
- [ ] Platform builds succeed (EAS build or web build)
- [ ] Build logs reviewed for warnings/errors
- [ ] No missing peer dependencies

See [README.md#why-pre-merge-verification-matters](./README.md#why-pre-merge-verification-matters) for why this step is critical.

### ✅ After Review
- [ ] Address all reviewer feedback
- [ ] Request re-review when ready
- [ ] All CI/CD checks pass

### ✅ Handling Code Review Comments
- [ ] Fix all **critical issues** identified in code review
- [ ] **IMPORTANT**: For any non-critical comments/suggestions that are NOT fixed:
  - [ ] Create a new issue labeled `technical-debt` with:
    - Detailed description of each unfixed comment
    - File references and line numbers
    - Original reviewer suggestion/context
    - Clear explanation of why it's deferred
  - [ ] Add a comment to the PR linking to the technical debt issue with:
    - Summary of deferred items
    - Link to the issue (e.g., `[#122](https://github.com/nmohamaya/Cooking_app/issues/122)`)
    - Reference to this guide for documentation consistency
  - [ ] Link the technical debt issue in the PR description
  - [ ] Get approval from maintainers before merge
- [ ] Document which comments were addressed vs. deferred

### ✅ Manual QA Testing
- [ ] Test on Android device/emulator
- [ ] Test on iOS simulator (if applicable)
- [ ] Test on web browser
- [ ] Verify all user workflows work
- [ ] Document any issues found

### ✅ After Merge
- [ ] Switch to main: `git checkout main`
- [ ] Pull changes: `git pull origin main`
- [ ] Delete local branch: `git branch -d feature/issue-N-description`
- [ ] Delete remote branch: `git push origin :feature/issue-N-description`

## Code Standards

### Testing
- All new features must include tests
- Maintain minimum 70% code coverage
- Run tests locally before pushing: `npm test`

### Security
- Run security audit before committing: `npm run security`
- Never commit credentials or API keys
- Use environment variables for sensitive data

### Code Quality
- Follow existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## PR Requirements
- ✅ All CI checks must pass
- ✅ No merge conflicts
- ✅ Tests included and passing
- ✅ Security audit passing
- ✅ **Manual testing completed** (see below)

## Manual Testing Before Merge

### Required for User-Facing Changes
Before merging any PR that affects user-visible functionality:

1. **Web Testing**
   - Run `npm run web` and test the feature in browser
   - Verify the UI renders correctly
   - Test user interactions (buttons, forms, modals)

2. **Mobile Testing (Android/iOS)**
   - Run `npx expo start` and connect via Expo Go
   - Test on actual device or emulator
   - Verify native components work correctly
   - Test file pickers, alerts, and platform-specific features

3. **User Review Checklist**
   - [ ] Feature is visible and accessible in the app
   - [ ] UI matches expected design/behavior
   - [ ] No console errors or warnings
   - [ ] Feature works on target platforms (web/Android/iOS)
   - [ ] Edge cases handled gracefully

4. **Document Test Results**
   - Note any issues found during testing
   - Confirm user sign-off before merge

### Exceptions
- Documentation-only changes
- Test-only changes (no UI impact)
- CI/CD configuration changes

## Reporting Issues
- Check if issue already exists
- Include steps to reproduce
- Provide environment details
- Add relevant labels

## Branch Naming
- `feature/issue-N-description` - new features
- `bugfix/issue-N-description` - bug fixes
- `hotfix/critical-description` - urgent production fixes
- `docs/issue-N-description` - documentation
- `chore/issue-N-description` - maintenance tasks

**Always include issue number in branch name!**
