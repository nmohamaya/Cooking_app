# Contribution Guidelines

## Development Workflow

**📋 See [MyRecipeApp/README.md](MyRecipeApp/README.md#project-workflow) for the complete development workflow.**

This includes:
- Issue creation and project board management
- Branch naming conventions
- Commit message standards
- PR requirements and review process
- Post-merge cleanup

## Quick Reference

### Before Starting Work
1. Create an issue (required before any code changes)
2. Set issue status to "In Progress" in GitHub Project
3. Create feature branch from `main`: `git checkout -b feature/issue-N-description`

### During Development
- Write tests for new functionality
- Run tests locally: `npm test`
- Run security audit: `npm run security`
- Make atomic commits with issue reference

### Creating PR
1. Push branch and create PR with "Closes #N" in title/body
2. Set issue status to "In Review"
3. Complete manual testing checklist
4. Wait for CI/CD checks to pass

### After Merge
1. Switch to main: `git checkout main`
2. Pull changes: `git pull origin main`
3. Delete local branch: `git branch -d feature/issue-N-description`

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
