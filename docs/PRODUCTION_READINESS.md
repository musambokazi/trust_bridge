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

1. **Email-flow acceptance.** On 2026-11-08 the default Site URL was set to `trustbridge://auth-callback` and both exact native callbacks (`trustbridge://auth-callback`, `trustbridge-preview://auth-callback`) were saved and verified after reload. Supabase supports native deep-link Site URLs. No web domain was invented. After SMTP is configured, test signup, confirmation, login, reset and expiry end to end on the installed production and preview APKs with an address you control.
2. **Mail delivery.** Configure and verify a custom SMTP sender/domain, delivery limits, bounce handling and recovery templates. The implementation has not sent emails to a real user or verified inbox delivery. Do not disable email confirmation to work around mail problems.
3. **Remaining abuse controls.** Server policy was saved and verified on 2026-11-08: minimum 8 characters, lowercase, uppercase, digit and symbol; secure password change enabled. Email confirmation and secure email change remain enabled; anonymous sign-in remains disabled. Existing rate limits were reviewed and left unchanged. CAPTCHA is not configured: provider keys and a compatible client challenge flow are still needed. Leaked-password protection is unavailable on the current Free plan (Pro and above); no plan upgrade was made. Current-password-on-update was left off to avoid breaking the recovery-only password-change flow.
4. **Signing.** The current GitHub workflow still uses the historical Expo development keystore for internal APK compatibility. Replace it with an organisation-controlled release signing identity, store credentials in the CI secret store, and document backup/recovery. A store/public release cannot rely on that template development key.
5. **Privacy and operations.** Publish legal operator/contact information, approved retention/deletion policies, export and verified deletion handling, incident response and support procedures. The 35-point notices remain drafts until reviewed against actual operations.
6. **Device tests.** Test built-in and third-party recording on every password field, show/hide, email focus, keyboard dismissal, back, tab changes, biometric success/cancellation, background/resume and password fallback. Confirm other screens remain recordable. Test biometric opt-in, restart, enrollment changes and unsupported hardware. Web tests cannot prove these native behaviours. Verify actual Android SecureStore restoration, first-launch gating, keyboard avoidance, image permissions, upload replacement, sign-out, connectivity changes, stale/revoked sessions and update/restart behaviour. Automated browser tests do not substitute for these.
7. **Backup and monitoring.** Confirm database backup availability and restoration procedure for the selected Supabase plan, monitor auth errors and sync failures, define an incident owner and a response process.

## Intentional limits

- One owner-controlled workspace per account; no invitations or cross-company sharing.
- No independent bank ownership, supplier identity, company tax or registration verification.
- New references remain unverified. The UI does not expose an unsupported 'verified' badge.
- Supplier creation and profile changes require connectivity. The encrypted offline outbox covers invoice checks, supplier edits and review checklists with version conflict handling, but not arbitrary profile/registration edits.
- Cache targets are 150 supplier summaries, 150 comparisons, 100 reviews and 100 recent changes, trimmed to fit the encrypted cache budget. At most 50 combined checks/edits may be pending. An unavailable supplier can keep a request pending; resolve before signing out.
- Native offline data cannot receive immediate remote access revocation. Server requests are validated when online.
- Account creation is not fully transactional across profile/workspace tables: retries upsert the same account records and finish an interrupted setup.
- A successful migration or green CI run is not a penetration test or legal certification.

## Auth configuration verified on 2026-11-08

Dashboard sign-in completed after the user solved the CAPTCHA. The following were saved and verified in the project `pbyquxpeizkumucvpcdk`:

- Site URL: `trustbridge://auth-callback`.
- Exact redirect allowlist: `trustbridge://auth-callback` and `trustbridge-preview://auth-callback`. No wildcard redirects.
- Minimum password length: 8 (confirmed visually after reopening the saved provider settings).
- Complexity: lowercase, uppercase, digits and symbols.
- Secure password change: enabled (recent sign-in or reauthentication required for older sessions).
- Email provider, email confirmation and secure email change: enabled.
- Anonymous sign-ins: disabled.
- Email OTP lifetime: 3600 seconds; OTP length: 8 digits; unchanged.
- Rate limits: unchanged, including 30 sign-in/signup requests per 5 minutes per IP, 30 token verifications per 5 minutes per IP and 150 token refreshes per 5 minutes per IP.
- Supabase security advisor: no findings.

Custom SMTP remains disabled. Sender/domain/provider credentials have not been provided, and real confirmation/reset delivery has not been tested. Default templates remain in place. No user account was created and no test email was sent during this dashboard configuration.

CAPTCHA remains disabled until provider keys and client challenge handling are configured together. Leaked-password protection requires Pro or above; the project remains on Free. These saved Auth settings do not establish unrestricted production readiness.

Reference: https://supabase.com/docs/guides/auth/redirect-urls (native deep-link Site URLs), https://supabase.com/docs/guides/auth/password-security and https://supabase.com/docs/guides/auth/auth-smtp.

## Workflow phases 2–6 (2026-11-12)

The v1.0.7 workflow adds immutable comparison snapshots, server-controlled supplier audit history, validated reviewer checklists, an account-scoped conflict-aware outbox and local masked PDF exports. Live rolled-back database integration tests pass; the Supabase security advisor reports no findings after these migrations. This does not remove the public-launch requirements above, including organisation-controlled signing, SMTP acceptance and installed-device testing. See FEATURE_PHASES.md for cache/export limits and validation scope.
