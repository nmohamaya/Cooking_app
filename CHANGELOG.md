# Changelog

All notable changes to MyRecipeApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Security middleware: helmet headers and rate limiting on API routes (#177)
- yt-dlp subtitle extraction replacing broken audio transcription (#176)
- Wired recipe extraction and cost tracking routes (#176)

### Fixed
- 23 pre-existing backend test failures across 3 test suites (#168)
- AsyncStorage import in all affected services and tests (#162)
- YouTube video extraction flow (#163)

### Changed
- Migrated transcription service from GPT-4o-mini to Claude 3.5 Haiku (#166)
- Removed hardcoded passwords from keystore generation script (#177)

## [1.0.0] - 2025-12-21

### Added
- AI-powered recipe extraction from YouTube, TikTok, Instagram, and food blogs
- Multi-timer system for managing multiple cooking timers simultaneously
- Weekly meal planning with drag-and-drop scheduling
- Smart shopping list auto-generated from meal plans
- User feedback system for in-app feature rating
- Dark mode with system preference detection
- Accessibility support (WCAG compliant)
- Backend API server with Express (download, transcribe, recipes, cost routes)
- Cost tracking and monitoring for AI API usage
- Automated CI/CD pipeline with GitHub Actions
- EAS Build integration for Android releases

[Unreleased]: https://github.com/nmohamaya/Cooking_app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/nmohamaya/Cooking_app/releases/tag/v1.0.0
