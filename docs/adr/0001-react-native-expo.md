# ADR-0001: React Native + Expo

## Status
Accepted

## Context
MyRecipeApp needs to run on multiple platforms with Android as the primary target and iOS planned for the future. The team has existing JavaScript and React expertise, making a React-based solution the natural starting point. Building separate native apps for each platform would double the development and maintenance effort.

## Decision
Use React Native with Expo SDK 54 for the frontend. Expo provides a managed workflow, over-the-air (OTA) updates, and EAS Build for producing release binaries. The app uses Expo's managed workflow rather than a bare React Native setup.

## Consequences
**Positive:**
- Single codebase serves Android, iOS, and web.
- Fast development cycle with Expo's hot reload and managed tooling.
- OTA updates allow shipping fixes without going through app store review.
- Expo's managed workflow reduces native build configuration burden.

**Negative:**
- Limited access to native modules not supported by Expo. Ejecting to bare workflow is possible but adds complexity.
- Tight coupling to the Expo SDK version. Dependency misalignment can cause device crashes that do not surface in tests (see Issue #99).
- Expo SDK upgrades can be non-trivial and may require dependency-wide updates.
