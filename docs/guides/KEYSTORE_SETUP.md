# Android Keystore Setup Guide

## Overview
This document describes the Android keystore setup for signing production APK builds for Google Play Store submission.

## What is a Keystore?
A keystore is a binary file that contains cryptographic keys used to digitally sign your Android APK. Google Play requires all apps to be signed with the same key throughout their lifetime.

## Keystore Security ⚠️

**The keystore file and its password are CRITICAL secrets. Protect them at all costs:**
- Never commit the keystore to version control
- Never share the keystore file or passwords publicly
- Store passwords in a secure location (password manager, 1Password, LastPass, etc.)
- For CI/CD: Use GitHub Secrets to store keystore credentials

The keystore is added to `.gitignore` and will NOT be committed to the repository.

## Generating the Keystore

### Option 1: Using the Script (Automated)

```bash
# Edit the script with your preferred passwords
nano scripts/generate-keystore.sh

# Make the script executable and run it
chmod +x scripts/generate-keystore.sh
./scripts/generate-keystore.sh
```

### Option 2: Manual Command

```bash
keytool -genkey -v \
  -keystore cooking_app_release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias cooking_app_key \
  -storepass your_secure_password_here \
  -keypass your_secure_password_here \
  -dname "CN=MyRecipeApp, O=CookingApp, L=Cupertino, ST=California, C=US"
```

## Keystore Location

After generation, the keystore should be placed in:
```
MyRecipeApp/cooking_app_release.keystore
```

The file will be ignored by Git (see `.gitignore`).

## Keystore Credentials

**Save these securely (use password manager):**
- Keystore File: `cooking_app_release.keystore`
- Keystore Password: `[your_secure_password]`
- Key Alias: `cooking_app_key`
- Key Password: `[your_secure_password]`
- Validity: 10000 days (~27 years)
- Algorithm: RSA (2048-bit)

## Verifying the Keystore

To verify the keystore was created correctly:

```bash
# List keystore contents
keytool -list -v -keystore cooking_app_release.keystore -storepass your_password

# Expected output should show:
# - Alias: cooking_app_key
# - Key type: RSA
# - Certificate Fingerprints: SHA1, SHA256, MD5
```

## Using the Keystore for Builds

### Local Development Builds

To build a signed APK for testing locally:

```bash
cd MyRecipeApp

# Build release APK with signing
eas build --platform android --type release \
  --local \
  --keystore cooking_app_release.keystore \
  --keystore-password your_password \
  --key-alias cooking_app_key \
  --key-password your_password
```

### CI/CD Integration (GitHub Actions)

For automatic builds in CI/CD, store secrets in GitHub:

1. Go to repository Settings → Secrets and variables → Actions
2. Create secrets:
   - `KEYSTORE_PASSWORD`: Your keystore password
   - `KEY_PASSWORD`: Your key password
   - `KEY_ALIAS`: cooking_app_key

Then reference in GitHub Actions workflows.

## Backup & Recovery

**IMPORTANT:** Backup your keystore file securely!

If you lose the keystore or passwords, you'll need to generate a new key and cannot update the existing Play Store app. You would need to:
1. Create a new app listing on Google Play
2. Use a different package name
3. Essentially create a new app

**Backup process:**
```bash
# Make secure backups
cp cooking_app_release.keystore ~/backups/
# Store password in password manager
# Document keystore creation date and validity expiration (10000 days from creation)
```

## Certificate Expiration

The generated certificate is valid for 10000 days (~27 years), which exceeds Google Play's requirement of 25+ years validity.

**Do NOT generate a new keystore** - use the same one for all future updates to the same app!

## Troubleshooting

### "keytool: command not found"
You need to install Java Development Kit (JDK):
```bash
# macOS
brew install openjdk

# Ubuntu/Debian
sudo apt-get install default-jdk

# Windows
Download from: https://www.oracle.com/java/technologies/downloads/
```

### "Certificate fingerprint" mismatch in Play Store
Ensure you're using the exact same keystore and passwords for all builds. The fingerprint must match what's registered in Play Console.

### "Invalid keystore format"
The keystore file may be corrupted. Regenerate it using the script above.

## Additional Resources

- [Android Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Google Play: App Signing](https://play.google.com/console/about/guides/app-signing/)
- [Expo: Building with EAS](https://docs.expo.dev/build/setup/)
