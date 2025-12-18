# Contribution Guidelines

## Getting Started
1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Ensure all tests pass locally
5. Submit a pull request

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
- ✅ At least one code review approval
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

## Development Workflow

### Local Testing
```bash
cd MyRecipeApp
npm install
npm test
npm run security
npm run web
```

### Before Committing
```bash
npm test -- --coverage
npm run security
npm run lint --if-present
```

## Branch Naming
- `feature/` - new features
- `fix/` - bug fixes
- `docs/` - documentation
- `test/` - test improvements
- `ci/` - CI/CD improvements
