# Threat model and operations

## Assets and trust

Protect session tokens, supplier bank/tax references, business contacts, assessment/review records, team grants, audit history and report signing seeds. An authenticated client is untrusted; supplier legitimacy and correctness of owner-entered baselines are external assumptions. Vault/Edge/database administrators remain privileged trust roots.

| STRIDE threat | Implemented control | Residual risk / acceptance |
|---|---|---|
| Spoofing | Confirmed Supabase session, Auth getUser, optional TOTP with AAL2 checks, email-bound invitations, password-confirmed deletion | SMTP delivery, account recovery and real-device biometric tests still need acceptance. Password theft without enabled MFA remains a risk. |
| Tampering | Server-only risk decisions, immutable snapshots, versions/conflicts, payload-bound retry IDs, append-only audit, ML-DSA signed PDF/snapshot | A signature cannot make an incorrect supplier baseline true. Privileged compromise or signing-key theft remains possible. |
| Repudiation | Server actor/time/action logs and registered signed manifests | Not an external timestamp/notary, legal signature certification or complete platform admin log. |
| Disclosure | RLS, live roles, native encrypted caches, private avatars, masked snapshots/exports, no service key in app | Compromised devices, already shared exports, retained offline copies and malicious authorised members remain risks. |
| Denial of service | Bounded request bodies/fields/import pages/ZIP expansion, per-user rate limits, monthly allowances | Auth provider rate limits and platform protection still matter; a distributed service attack requires operational monitoring/response. |
| Privilege escalation | Live database membership, immutable workspace ownership, private invoker wrappers/explicit grants, no editable metadata authorisation | Owner/admin mistakes and privileged operator access require access reviews. |

## Incident response

1. An operator reviews failing service-health/CI runs and Supabase Auth/Edge/database logs. Do not ask users to send passwords or full bank details.
2. Record UTC incident time, affected workspace IDs, safe error codes and responsible operator; preserve relevant server events without editing them.
3. Contain by revoking affected workspace membership/sessions. Removing a user must also consider live tokens; workspace role checks and `require_user` enforce database state, and offline caches cannot be remotely recalled immediately.
4. If report signing is suspected compromised, mark the affected `private.report_key.revoked_at` under privileged, reviewed change control. The next signing request creates a fresh seed in Vault. Refresh verifiers' registry; offline verifiers may be stale. Do not delete old public-key metadata.
5. Restore service only after confirming access boundaries, affected signing keys and root cause. Document notification decisions with the legal/operator lead; no automatic legal compliance claim is made.

## Backup and recovery

Use a selected Supabase backup/PITR capability or an operator-owned encrypted backup process. Keep database credentials and encryption/restore keys outside GitHub and app bundles. Signing-seed recovery must be tested with Vault and the selected platform backup method; a normal public-schema-only dump is not sufficient. Maintain a separate trusted public-key registry/fingerprint archive for old report verification.

Before public launch, restore a backup into an isolated non-customer environment. Verify RLS/grants, membership removal, assessment snapshots, audit integrity and public/private signing-key separation; create/verify a new report, then tamper with its bytes and confirm rejection. Record the actual recovery point/time. No backup restoration has yet been performed by this change.

## Signing and release identity

CI accepts four organisation keystore secrets together: TRUSTBRIDGE_KEYSTORE_BASE64, TRUSTBRIDGE_KEYSTORE_PASSWORD, TRUSTBRIDGE_KEY_ALIAS, TRUSTBRIDGE_KEY_PASSWORD. Partial configuration fails closed. When none exist, internal validation keeps the historical debug identity for existing-install compatibility. This is not public/store signing. Replacing that known development key requires a reviewed install/data-migration strategy; do not silently promise an in-place Android upgrade under an unrelated certificate.

## Privacy and deletion

Native downloaded caches are bounded; pending work is never evicted to free space. Shared account data is keyed by user and workspace. Exports are initiated explicitly; review notes are opt-in. Private export files are pruned on a later export after one hour or by OS cleanup. External copies are the recipient's responsibility.

Deletion requires current-password confirmation and existing MFA assurance. Workspace owners must remove teammates first. Accounts that contributed to another organisation are blocked pending an operator retention review. The app must not silently erase another company's evidence. Final legal operator/contact, retention schedules and lawful-process handling still need approval. These controls do not constitute POPIA certification.
