#!/bin/bash

# Android Keystore Generation Script for MyRecipeApp
# This script generates a signing keystore for production Android APK builds
# Required for Google Play Store submission

set -e

KEYSTORE_FILE="cooking_app_release.keystore"
KEYSTORE_ALIAS="cooking_app_key"
KEYSTORE_PASSWORD="Myfirstappforfreedom@84"  # ⚠️ CHANGE THIS TO A STRONG PASSWORD
KEY_PASSWORD="Myfirstappforfreedom@84"       # ⚠️ CHANGE THIS TO A STRONG PASSWORD
VALIDITY_DAYS=10000
KEY_SIZE=2048

echo "🔑 Generating Android Signing Keystore for MyRecipeApp"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Update passwords in this script before running!"
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
  echo ""
  echo "📝 Save these credentials securely:"
  echo "   Keystore Password: $KEYSTORE_PASSWORD"
  echo "   Key Password: $KEY_PASSWORD"
  echo "   Alias: $KEYSTORE_ALIAS"
  echo ""
  echo "⚠️  SECURITY: Store passwords in a secure location (password manager, CI/CD secrets, etc.)"
else
  echo "❌ Failed to generate keystore"
  exit 1
fi
