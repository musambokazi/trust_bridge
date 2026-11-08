# TrustBridge — six delivery phases

All six features are accepted scope. Delivery is sequential: complete and verify one phase before starting the next. Keep the black/orange/white theme, five floating tabs, main source branch and fixed OTA runtime 1.0.1. Do not couple this work to SMTP setup. Never present a field match or reviewer decision as bank ownership verification or payment authorisation.

| Phase | Feature | Completion criteria |
|---|---|---|
| 1 | Invoice photo/PDF import | Android photograph or selected image/PDF → offline text recognition → editable field suggestions → explicit review confirmation → Check. Paste text/manual entry remain available. No auto-selected trusted supplier, silent comparison, original-file upload or automatic payment decision. |
| 2 | Side-by-side comparison | Saved supplier reference versus submitted invoice values; explicit matches, differences and unavailable values; responsive layout; bank values masked by default; result uses the immutable server comparison snapshot, not today's changed supplier record. |
| 3 | Supplier change history | Authenticated supplier editing with required change reason and server-written append-only before/after audit entries. Tenant-isolated history shows actor/time/reason, with sensitive values masked. Clients cannot forge audit entries or edit past events. |
| 4 | Review checklist | Trusted-contact callback, supporting-document checks and discrepancy resolution; reviewer notes and reviewed/unresolved states stored separately from the server comparison. An incomplete checklist cannot appear as completed. No fake team approval workflow. |
| 5 | Sync centre | Account-scoped overview of cached records, queued operations, last successful sync and actionable failures; retry without duplicates; clear offline/online state; no silent deletion of pending work. Extend the encrypted outbox to Phase 3/4 edits with conflict handling before enabling offline writes there. |
| 6 | Exportable review report | User-initiated PDF/share of the immutable comparison, findings, checklist and notes; masked sensitive fields; review date and offline/pending status; limitations and source context. Escape untrusted content, clean temporary exports and test multi-page layout. |

## Phase 1 implementation and verification

Version 1.0.6 adds Expo DocumentPicker and an Android-only local Expo module. ML Kit Latin recognition is bundled for offline use; Android PdfRenderer rasterizes PDF pages before recognition. The module accepts local app-cache files only, checks file size, limits PDFs to five pages, bounds bitmap dimensions and recognized text, serializes jobs and supports cancellation between pages. Selected image orientation is applied before recognition. Browser/iOS support pasted text and manual entry; native photo/PDF recognition is not advertised there.

Files are temporary. The importer deletes its picker-created cache copies and its own working copy after the native promise settles, including error/cancellation. Interrupted processes can leave OS-managed cache files; this is not a permanent encrypted invoice archive. Raw OCR/pasted text is transient, not written to profile/workspace tables. Only user-reviewed form values enter the existing encrypted check outbox when the user explicitly submits a comparison.

Field suggestions are deterministic and conservative: explicitly labelled invoice number, supplier name, bank/account reference and total. Conflicting candidates stay blank. Non-ZAR currency produces a warning and no automatic ZAR amount. Users can edit every suggestion and must confirm their review before using it. Applying a draft replaces the four invoice fields (including blanks), but preserves the selected supplier ID and never updates the supplier baseline.

Automated checks cover labelled-field parsing, ambiguous/foreign totals, grouping/decimal separators, malicious/control/excessive text, explicit review gating, applying the reviewed draft and the existing server-comparison/offline workflow. Native code compilation is required. Recognition accuracy, camera permissions, orientation, PDF corruption/encryption, cancellation and biometric-lock behaviour still require installed-device acceptance; browser tests do not prove them.

## Release policy

Phase 1 needs a new native APK, v1.0.6, with runtime 1.0.1 and isolated preview/production channels. Future source-only phases may use OTA only when their native compatibility hash matches. Local module native files are included in the hash. Additional native dependencies in Phase 6 may require a later app version; decide when that phase starts. Preserve all earlier releases.
