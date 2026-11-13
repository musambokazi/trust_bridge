# TrustBridge — six delivery phases

All six features are accepted scope. Phases 2–6 are implemented together in v1.0.7, following the owner’s instruction to deliver the remaining scope now. Keep the black/orange/white theme, five floating tabs, main source branch and fixed OTA runtime 1.0.1. Do not couple this work to SMTP setup. Never present a field match or reviewer decision as bank ownership verification or payment authorisation.

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


## Phases 2–6 implementation (v1.0.7)

- Comparisons capture immutable server snapshots (name, bank suffixes, reference version and comparison time). Equal bank suffixes can still show Different, because the server compares full values. Legacy checks do not substitute a newer reference.
- Supplier edits require a reason. A server trigger writes append-only masked before/after history, actor and time. Direct client updates and audit writes are denied. Existing history begins at feature activation; past changes are not fabricated.
- Reviews have three required checks, optional notes, unresolved/reviewed states and independent version numbers. Both server and UI reject reviewed status with an incomplete checklist. A review is not a payment approval.
- Invoice checks, supplier edits and reviews are queued per account before transmission. Unique immutable request IDs deduplicate retries; payload hashes reject reuse with changed content. Stale supplier/review versions become explicit conflicts. Resolution requires reviewing the server copy and issues a new request; another concurrent change conflicts again. Users may explicitly discard a local retry without deleting an already completed server record.
- Sync centre distinguishes actual network state from successful server access, exposes attempts/errors/recent uploads, and reconnects on foreground, network changes and a 30-second foreground interval. Cache targets are 150 suppliers, 150 comparisons, 100 reviews and 100 recent changes, subject to a 350,000-character budget. Downloaded records can be evicted; unsynced work is never evicted to free space. At most 50 combined tasks may be queued. Offline edits remain private to their account.
- PDF export runs locally through Expo Print/Sharing on native devices and the print dialog on web. It uses immutable masked comparison fields, last synced review, pending labels and explicit limits. Notes are opt-in; untrusted text is escaped. Native exports are held in private cache for safe Android handoff and pruned on a later export after an hour (or OS cleanup). User-saved copies remain outside the app's control.

Live Supabase migrations and rolled-back integration tests cover ownership/anonymous denial, unforgeable audit entries, same-suffix mismatch, snapshot immutability, incomplete checklist rejection, payload-bound idempotency and stale-version conflicts. Browser tests intercept API responses and exercise offline restoration, sync, supplier conflict resolution and PDF printing. They do not prove mail delivery or native device behaviour.

v1.0.7 adds Expo Network, Print and Sharing, so both preview and production need new APKs. Runtime remains 1.0.1. Earlier releases are preserved and isolated by their native compatibility channels. Installed-device PDF sharing, cache cleanup, connectivity transitions and the existing native OCR/security flows remain part of release acceptance.


## Follow-up requirement closure (v1.0.8)

The original hackathon blueprint is now extended with tax/branch comparisons, Low/Review/Elevated tiers, unknown-supplier assessments, team roles and MFA, server activity, server quotas and local verification of ML-DSA-65 server-rendered PDF bundles. Unsigned draft printouts remain clearly labelled. See REQUIREMENTS.md for exact implemented behaviour and external acceptance boundaries.
