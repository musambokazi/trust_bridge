# TrustBridge Documents

Local Android Expo module for offline invoice text recognition. It bundles Google ML Kit Latin text recognition 16.0.1; PDFs are rendered with Android PdfRenderer. No image/text upload is performed by this module. Native files are compiled into the app; do not ship changes over an incompatible OTA channel.

Limits: one job at a time, local app-cache file only, 20 MiB, up to five PDF pages, 2000px PDF render / 2400px sampled image, 15-second recognition timeout per page and 50,000 characters total. Password-protected/unreadable PDFs fail with a manual-entry alternative. Cancellation stops between pages; in-flight recognition finishes or times out before resources close. JS must retain/delete its temporary file only after the native promise settles.

Browser and iOS use manual/pasted-text input; native OCR is currently Android only. Real-device acceptance must cover clear/rotated photographs, scanned/text PDFs, corrupt/encrypted/oversize files, cancellation, background/resume and low-memory devices. Automated browser tests do not prove recognition accuracy.
