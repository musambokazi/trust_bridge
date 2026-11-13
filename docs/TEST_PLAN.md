# Validation and release acceptance

Automated: TypeScript/lint; Node unit tests; actual ML-DSA verification and altered PDF/context/manifest/signature rejection; unknown/revoked key refusal; bounded ZIP parsing; conservative import parsing; delivery/runtime checks; browser flows; Deno type checks for all Edge handlers; dependency advisories.

Database integration tests run in transactions with fixtures rolled back: cross-workspace/anonymous denial, viewer/reviewer/admin boundaries, invitation email/replay binding, membership removal, MFA step-up, immutable ownership, masked snapshots, same-suffix full-value mismatch, audit write denial, incomplete-review rejection, monthly quotas including the legacy RPC, idempotent retries and stale-version conflicts.

A dedicated temporary account was used for a live Edge test without sending email: supplier review → Low Concern check → authorised assessment read → server PDF/signature → local verification → altered-manifest rejection. The account was removed through password-confirmed self-service deletion. No customer's records were used. This is not evidence of real email delivery or a penetration test.

Browser tests intercept API traffic. They cover registration, input focus/password toggles, profile persistence, invoice import review, offline review restoration and sync, reference conflict resolution, masked unsigned print, signed bundle download and local verification, and narrow-screen tab layouts. They cannot prove Android screen-recording protection, native OCR accuracy, biometrics or native file-sharing handoff.

Physical-device checklist before public release: first install/onboarding; confirmation/deep-link/reset through real SMTP; every password field/show-hide/focus handoff and third-party recorder; biometric success/cancel/fallback/enrollment changes; TOTP enrol/verify/remove and lost-authenticator recovery; camera/PDF import/corrupt file/cancellation; offline/reconnect/expired/revoked session; team switch/removal while pending; signed ZIP save/share/reopen/verify; cached-key revocation warning; account export/deletion; OTA restart preserving context.

Do not mark unperformed tests passed. Keep the release labelled internal until organisation signing, SMTP acceptance, legal/operations ownership, restore evidence and installed-device checks are complete.
