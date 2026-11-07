# TrustBridge connected release 1.0.5

This is a connected validation release, not a declaration that the product is ready for unrestricted public use. Source stays on main. Runtime remains 1.0.1. Password capture protection and biometric unlock require the new 1.0.5 binary and isolated native compatibility channel. Older releases remain available and do not receive incompatible bundles.

## Implemented

- Capture prevention is scoped to focused password/confirmation fields (sign-in, registration, recovery and device-unlock fallback), and biometric system confirmation. Blur, keyboard dismissal, navigation and unmount release input scopes. Password visibility toggles do not disable protection. Inputs remain masked until protection is active; leaving a revealed password masks it before the capture scope is released. The OS protects the entire app window during these short intervals; other screens do not enable prevention. Web is unsupported. This cannot prevent an external camera or guarantee behaviour on compromised devices.
- Optional per-account, per-device biometric lock is enabled/disabled only after successful strong biometric confirmation. Background/relaunch locks the saved account; the opaque lock screen remains recordable. Prompt capture protection releases in finally, including cancellation/errors. Online account-password fallback preserves pending checks. Templates stay with the OS. This local barrier is not server MFA or a hardware-bound encryption key for cached data.
- The biometric preference is stored in encrypted device storage. Changing the device's enrolled fingerprints may allow a newly enrolled owner to unlock. Use a trusted device lock and restrict who can change enrollment.

- Supabase email/password signup and sign-in. Confirmation is enabled on the project. No anonymous sign-in or offline authentication bypass.
- Separate individual and company registration. Password values are sent only to Supabase Auth, never profile/workspace tables or the encrypted pending registration draft.
- Username, contact and workspace details are completed after verified sign-in. A device retains an encrypted registration draft while waiting for confirmation; it is matched to the verified email before use.
- Own-account profiles/workspaces/suppliers/assessments only. RLS enabled on all exposed tables; no anonymous grants. Company registration is not shared membership or verification.
- Private avatars restricted to an account's own fixed path, JPEG only, maximum 2 MiB. Selected images are resized before upload. Signed URLs expire after five minutes.
- Native sessions and account caches use OS-backed SecureStore. Browser sessions use sessionStorage and have different protection properties.
- Saved account/workspace data can be viewed offline after sign-in. The client never treats an offline pending check as verified.
- Checks enter an encrypted, account-scoped outbox before transmission. Server RPC uses a request UUID for idempotency and calculates findings from the owner's supplier baseline. The client cannot directly insert assessment results.
- Full bank references are discarded from pending requests after successful sync; stored results and cached supplier summaries contain the final four characters. The supplier baseline remains private server-side.
- Sign-out blocks while work is pending. Native state and caches are cleared on successful sign-out; server records remain.
- Fixtures remain only as unit-test data, never seeded into live account workspaces.

## Verification completed during implementation

- Actual Supabase SQL tests: ownership, cross-account read/write denial, anonymous denial, server comparison, masking, direct forged-result insert denial, retry idempotency. The fixture users/records are rolled back.
- Supabase security advisor: no findings after moving the comparison writer into the private schema. Performance advisor reports unused indexes on new empty tables; these index the foreign keys and owner queries and should remain.
- Type checking, lint, unit tests, web export.
- Browser tests use intercepted Supabase responses: signup, confirmation-required message, login, profile and workspace persistence, supplier creation, server comparison, keyboard focus, offline session restoration, offline pending checks and resync without duplicates, narrow-screen navigation. They do NOT verify real email delivery.
- Server public Auth settings read: signup enabled, email confirmation required, anonymous sign-in disabled.

- Dependency audit after SDK 58 patches and tested glob/minimatch overrides: no reported production-dependency advisories at the time of the scan. This is not a guarantee against unknown vulnerabilities.

## Must complete before public launch

1. **Email and callback configuration.** In the project's Auth URL configuration allow both `trustbridge://auth-callback` and `trustbridge-preview://auth-callback`. Use a real HTTPS site URL under your control instead of a localhost default. The app requests these native redirects for confirmation and recovery. Test signup, confirmation, login, reset and expiry end to end on installed APKs with an address you control.
2. **Mail delivery.** Configure and verify a custom SMTP sender/domain, delivery limits, bounce handling and recovery templates. The implementation has not sent emails to a real user or verified inbox delivery. Do not disable email confirmation to work around mail problems.
3. **Server password policy and abuse limits.** Confirm that Supabase Auth enforces the displayed minimum length and complexity; the app's strength meter alone is not a server control. Review compromised-password checks, CAPTCHA and email/sign-in rate limits. No credentials may be put into the mobile bundle.
4. **Signing.** The current GitHub workflow still uses the historical Expo development keystore for internal APK compatibility. Replace it with an organisation-controlled release signing identity, store credentials in the CI secret store, and document backup/recovery. A store/public release cannot rely on that template development key.
5. **Privacy and operations.** Publish legal operator/contact information, approved retention/deletion policies, export and verified deletion handling, incident response and support procedures. The 35-point notices remain drafts until reviewed against actual operations.
6. **Device tests.** Test built-in and third-party recording on every password field, show/hide, email focus, keyboard dismissal, back, tab changes, biometric success/cancellation, background/resume and password fallback. Confirm other screens remain recordable. Test biometric opt-in, restart, enrollment changes and unsupported hardware. Web tests cannot prove these native behaviours. Verify actual Android SecureStore restoration, first-launch gating, keyboard avoidance, image permissions, upload replacement, sign-out, connectivity changes, stale/revoked sessions and update/restart behaviour. Automated browser tests do not substitute for these.
7. **Backup and monitoring.** Confirm database backup availability and restoration procedure for the selected Supabase plan, monitor auth errors and sync failures, define an incident owner and a response process.

## Intentional limits

- One owner-controlled workspace per account; no invitations or cross-company sharing.
- No independent bank ownership, supplier identity, company tax or registration verification.
- New references remain unverified. The UI does not expose an unsupported 'verified' badge.
- Supplier creation and profile changes require connectivity. The offline outbox currently covers invoice checks, not arbitrary profile/registration edits.
- Up to 250 supplier summaries and recent results are cached. At most 50 checks may be pending. An unavailable supplier can keep a request pending; resolve before signing out.
- Native offline data cannot receive immediate remote access revocation. Server requests are validated when online.
- Account creation is not fully transactional across profile/workspace tables: retries upsert the same account records and finish an interrupted setup.
- A successful migration or green CI run is not a penetration test or legal certification.

## Dashboard access on 2026-11-07

The dashboard required sign-in. The secure browser sign-in request was declined; no Auth settings were changed. Callback allowlists, server password policy, custom SMTP and mail delivery verification remain pending.
