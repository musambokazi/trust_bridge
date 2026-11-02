# TrustBridge delivery

## Versions and branches

- Commit source and delivery changes to **main** until the project owner changes this instruction.
- The first released app version is **1.0.1**. Increment the app version and Android versionCode when another native APK is required.
- Keep the Expo OTA runtime **1.0.1**. Use three-part semantic versions, not the ambiguous shorthand `1.01`.
- Expo has **preview** and **production** build profiles, environments, channels and update branches. These are independent of the source Git branch.

## Automated delivery

`Release APKs and publish Expo updates` runs on main pushes and can also be run manually. It:

1. Runs TypeScript, lint, unit and browser checks.
2. Links the Expo project using EXPO_TOKEN, verifies versions and checks for an existing GitHub Release.
3. When the app version has no release, builds both standalone Android APKs on Expo EAS. Preview and production have distinct package IDs and can be installed side by side.
4. Publishes both APK files under the versioned GitHub Release (`v1.0.1` initially), as well as temporary Actions artifacts.
5. Publishes Android OTA updates to both environments. When the release already exists and native compatibility matches, it publishes OTA updates without rebuilding either APK.

The app checks for an update at launch and when returning to the foreground. When downloaded, it offers Restart and apply. The current frontend uses session-only demo data; restarting resets new demo checks.

## Fixed runtime and native compatibility

A fixed runtime number does not by itself establish native compatibility. `runtime-baseline.json` records the first native dependency/configuration hash. If production dependencies or native configuration change, the workflow requires a new app version and isolates the new binary on hash-suffixed channels/branches such as `preview-<hash>` and `production-<hash>`. It never repoints the older channels to incompatible bundles. The visible runtime remains 1.0.1. App-version-only changes with the same native dependencies continue using compatible existing channels.

This hash is deliberately conservative: dependency upgrades may require another APK even if they are JavaScript-only. Do not reset the initial baseline to bypass compatibility checks.

## Expo configuration

Add the **EXPO_TOKEN** Actions repository secret in **musambokazi/trust_bridge**, or expose it in both GitHub environments preview and production. Secrets in VIMBA or another repository are not inherited. Optionally set the **EXPO_ACCOUNT** repository variable to the intended Expo account slug; otherwise the token's signed-in account is used. The account must be allowed to create/link the project and build/publish both environments. No paid plan is purchased automatically.

The linking workflow prints only the public project ID and owner. `app.config.js` and `eas.json` configure the channel and package for each environment. Never commit the token. Once linked, retain the public EAS project ID and owner in app.json to make ownership explicit.

## Download

Open the repository's **Releases**, select the desired version (currently **TrustBridge 1.0.2**), and download either `TrustBridge-1.0.2-preview.apk` or `TrustBridge-1.0.2-production.apk`. Expo also shows the corresponding builds. These are APK files, not Play Store AAB files; no Metro server or Expo Go is required.

## Demo signing and scope

Both profiles are internal-distribution UI demonstrations and use the Expo template development key supplied through local EAS credentials. The production channel is an update destination, not a claim of production readiness. Real store releases need a dedicated securely managed signing key. Supplier data is fictional; live login, database verification and permissions remain for the team's backend integration.

Generated Android/iOS projects, credentials, signing keys, APKs and CI metadata are excluded from version control. No app binaries or secrets are committed to main.
