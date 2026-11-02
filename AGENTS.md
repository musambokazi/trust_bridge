# TrustBridge project instructions

- Work on and push source changes to `main` unless the project owner explicitly changes this instruction.
- The Expo OTA runtime is permanently `1.0.1`. The shorthand “1.01” refers to this three-part value. Do not use an appVersion runtime policy.
- The first app release is `1.0.1`. Increment the app version and Android versionCode only when a new native APK is needed. Keep package.json, package-lock.json and app.json versions aligned.
- Preview and production are separate Expo environments/build profiles/channels/update branches. Source stays on main. Both APKs must be downloadable from GitHub Releases and visible in Expo EAS.
- Reuse existing compiled releases for compatible JavaScript/UI updates. Respect the native compatibility hash and isolated channels; never reset runtime-baseline.json merely to bypass a compatibility failure.
- Keep EXPO_TOKEN and signing credentials out of source, logs and app bundles. The current development key is for fictional-data internal previews; do not present it as production/store signing.
- This is a frontend demonstration. Do not imply that live authentication, supplier verification, database access controls or a production security review have been implemented.
- Run typecheck, lint and relevant tests. Read the matching Expo SDK docs before changing Expo/native APIs. Generated android/ios projects are not committed or edited as source.
