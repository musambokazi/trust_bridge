#!/usr/bin/env bash
# Called from mobile/ after Expo prebuild. Generated Android files are not committed.
set -euo pipefail

# Expo's generated release variant embeds the JS bundle. Its template development
# signing key is appropriate only for this fictional-data UI preview. Do not use
# this APK or key for a production/store release.
cd android
./gradlew :app:assembleRelease \
  -PreactNativeArchitectures=arm64-v8a \
  --no-daemon --max-workers=2 \
  '-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g'

apk_path='app/build/outputs/apk/release/app-release.apk'
test -s "$apk_path"
mkdir -p ../../artifacts
cp "$apk_path" ../../artifacts/TrustBridge-0.1.0-arm64-preview.apk
