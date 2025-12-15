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
