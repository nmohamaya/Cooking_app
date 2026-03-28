#!/bin/bash

# Android Keystore Generation Script for MyRecipeApp
# This script generates a signing keystore for production Android APK builds
# Required for Google Play Store submission
#
# Usage:
#   export KEYSTORE_PASSWORD="your-strong-password"
#   export KEY_PASSWORD="your-strong-password"
#   bash scripts/generate-keystore.sh
#
# Store passwords securely in a password manager or CI/CD secrets.
# NEVER commit passwords to version control.

set -e

KEYSTORE_FILE="cooking_app_release.keystore"
KEYSTORE_ALIAS="cooking_app_key"
KEYSTORE_PASSWORD="${KEYSTORE_PASSWORD:?Error: KEYSTORE_PASSWORD environment variable is required}"
KEY_PASSWORD="${KEY_PASSWORD:?Error: KEY_PASSWORD environment variable is required}"
VALIDITY_DAYS=10000
KEY_SIZE=2048

echo "🔑 Generating Android Signing Keystore for MyRecipeApp"
echo "=================================================="
echo ""
echo "   Keystore file: $KEYSTORE_FILE"
echo "   Alias: $KEYSTORE_ALIAS"
echo "   Validity: $VALIDITY_DAYS days"
echo ""

# Generate keystore using keytool
keytool -genkey -v \
  -keystore "$KEYSTORE_FILE" \
  -keyalg RSA \
  -keysize "$KEY_SIZE" \
  -validity "$VALIDITY_DAYS" \
  -alias "$KEYSTORE_ALIAS" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "CN=MyRecipeApp, O=CookingApp, L=Cupertino, ST=California, C=US"

if [ -f "$KEYSTORE_FILE" ]; then
  echo ""
  echo "✅ Keystore generated successfully!"
  echo "   File: $KEYSTORE_FILE"
  echo "   Alias: $KEYSTORE_ALIAS"
  echo ""
  echo "⚠️  SECURITY: Store passwords in a secure location (password manager, CI/CD secrets, etc.)"
  echo "   Never commit passwords to version control."
else
  echo "❌ Failed to generate keystore"
  exit 1
fi
