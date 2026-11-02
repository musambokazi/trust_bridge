# GitHub Actions preview APK

Two workflows are included:

- **TrustBridge checks**: locked install, TypeScript, lint, unit tests, web export and browser integration tests. Runs for UI/main/preview/production pushes and pull requests.
- **Build Android preview APK**: locked install, source checks, Expo prebuild and Gradle release-variant compilation. Runs when native configuration, dependencies, build scripts or the APK workflow change on `ui/**`, `preview` or `main`. JavaScript is bundled into the APK, so it opens without Expo Go or a development server.

The first workflow commit triggers an APK build on the UI branch. Future UI-only commits run checks without automatically compiling another APK. After merging the workflow into the default branch, use **Actions → Build Android preview APK → Run workflow**, select the desired branch and run it whenever a new APK is needed.

## Download

Open the successful Android workflow run. Under **Artifacts**, select `TrustBridge-preview-APK-<run number>`, extract the downloaded ZIP and install `TrustBridge-0.1.0-arm64-preview.apk` on an ARM64 Android phone. GitHub requires you to sign in to download Actions artifacts. Artifacts are retained for 30 days.

## Signing and scope

This internal preview uses the generated Expo template development signing key. It is not a production/store signing key. Only fictional data and the UI demonstration are included; live authentication and backend checks remain disconnected. A production release requires a dedicated securely managed signing key and the team's release process. The ARM64 build targets current physical Android phones, including the Samsung A36; it is not an x86 emulator APK.

## Expo setup

The build uses Expo prebuild directly on a GitHub-hosted Android runner. No Expo token or EAS cloud credits are required for this preview. No Expo account is assumed or changed. Runtime configuration is fixed at `1.0.1` for future compatibility planning, but **OTA updates are not connected or enabled by this workflow**. Link the team's EAS project and configure `expo-updates` and channels as a separate integration; an existing token by itself does not configure OTA delivery.

Generated native projects, keys and APK binaries are excluded from source control. The workflow uses a read-only GitHub token and runs no secret-dependent code on pull requests.
