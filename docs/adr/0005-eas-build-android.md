# ADR-0005: EAS Build for Android

## Status
Accepted

## Context
The app targets the Google Play Store and needs reliable, reproducible Android release builds (APK and AAB). Local Android builds proved fragile -- Issue #99 revealed that a missing `react-native-gesture-handler` dependency caused crashes on real devices despite all tests passing. Keystore management for signing release builds added further complexity to local builds.

## Decision
Use Expo Application Services (EAS) Build for all Android APK and AAB generation. EAS manages the keystore, build environment, and native compilation in the cloud.

## Consequences
**Positive:**
- Managed keystore storage and signing. No risk of losing the upload key.
- Reproducible builds in a clean cloud environment, reducing "works on my machine" issues.
- Integrates with CI/CD for automated release builds.
- Catches dependency issues (like the one in Issue #99) that local dev builds may miss.

**Negative:**
- Requires an EAS account and is subject to Expo's pricing for build minutes.
- Build queue times can delay iteration during release preparation.
- Less direct control over the native Android build process (Gradle configuration, NDK settings).
- Cloud dependency -- builds cannot be produced if EAS is down or unreachable.
