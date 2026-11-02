# DevPeeps artwork for TrustBridge 1.0.2

The team-provided DevPeeps image is used intact for the native application icon, Android adaptive icon, splash artwork and web favicon. The app remains named TrustBridge (TrustBridge Preview for the preview package).

- `mobile/assets/branding/devpeeps-source.jpg`: unchanged uploaded source artwork.
- `icon.png`: opaque 1024px square, complete image fitted to 896px on a black canvas.
- `adaptive-icon.png`: opaque 1024px square, complete image centred at 480px to protect the main logo within Android launcher masks.
- `splash-icon.png`: 512px asset, displayed at a modest 220 logical pixels on a black splash background with contain scaling.
- `favicon.png`: 96px PNG derived from the complete icon artwork.

All display assets preserve the image's aspect ratio, lettering and artwork. Platform launcher/splash masks may still trim decorative corner marks. No logo is redrawn, stretched or replaced by a partial mark.

The splash screen uses the Expo SDK 58 splash-screen config plugin; generated native files are not committed. Native icon, splash and adaptive icon changes require installing the new 1.0.2 APK. Runtime stays 1.0.1, and existing 1.0.1 release downloads and update channels remain available. The native compatibility hash includes referenced icon/splash image bytes, so later replacements at the same paths are also detected.
