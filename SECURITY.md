# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |

Only the latest release receives security updates.

## Reporting a Vulnerability

If you discover a security vulnerability in MyRecipeApp, please report it responsibly.

**How to report:**

1. **GitHub Security Advisories (preferred):** Go to the [Security tab](https://github.com/nmohamaya/Cooking_app/security/advisories) and create a new advisory.
2. **Email:** Contact the maintainer directly via GitHub profile.

**Do not** open a public GitHub issue for security vulnerabilities.

**What to include:**
- Description of the vulnerability
- Steps to reproduce
- Affected component (frontend, backend, scripts)
- Potential impact assessment

**Response timeline:**
- Acknowledgment within 48 hours
- Initial assessment within 1 week
- Fix or mitigation plan within 2 weeks for confirmed vulnerabilities

## Security Measures

This project implements the following security practices:

- **Helmet.js** for HTTP security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- **Rate limiting** on all `/api/` routes (configurable via environment variables)
- **CORS** restricted to configured origins
- **Input validation** on all API endpoints
- **No hardcoded secrets** — all credentials via environment variables
- **eslint-plugin-security** enabled on backend code
- **npm audit** run in CI pipeline on every push
- **Dependency updates** monitored via GitHub Dependabot

## Scope

The following are in scope for security reports:
- Backend API server (`backend/`)
- Frontend application (`MyRecipeApp/`)
- Build and deployment scripts (`scripts/`, `deploy.sh`)
- CI/CD pipeline configuration (`.github/workflows/`)

Out of scope:
- Third-party dependencies (report to upstream maintainers)
- Social engineering attacks
- Denial of service via rate limiting bypass (informational only)
