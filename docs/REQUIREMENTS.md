# Implemented requirements and acceptance boundaries

| Area | Acceptance behaviour |
|---|---|
| Invoice fields | Name, invoice ID, amount, full bank reference, tax reference and branch code; import suggestions remain editable and explicitly reviewed. Missing tax/branch fields are flagged. |
| Risk rules v2 | Low Concern requires all four comparison fields available and matching, with an owner/admin-reviewed baseline. One discrepancy, missing information or an unreviewed baseline requires review. Two or more discrepancies, or no supplier baseline, yield Elevated Concern. |
| Unknown supplier | Explicit selection creates a saved assessment with no comparison snapshot and guidance to hold payment and complete onboarding. A supplied foreign workspace supplier UUID is rejected. |
| Roles | Owner manages members; owner/admin maintain references; owner/admin/reviewer submit assessments and checklists; viewer reads authorised workspace records and exports them. No role authorises a payment. |
| Invitations | 256-bit random code, hash stored, intended confirmed email only, expires in 48 hours; owner can revoke it. Delivery is manual/private, not automatic email. |
| Team changes | Live membership checked on each server operation. Offline caches cannot receive immediate revocation. Pending work must be resolved before switching workspaces. |
| MFA | Optional Supabase TOTP setup and step-up; enabled accounts need AAL2 for live workspace access. Biometrics are a separate local control. |
| Integrity | Server renders PDF from authorised saved records; signs PDF hash and snapshot hash using ML-DSA-65. Verifier uses trusted registry keys, rejects modified content/unknown/revoked keys. Cached key revocation may be stale offline. |
| Audit | Server-written successful supplier, assessment, review, team, export and signed-report events; ordinary clients cannot insert/update/delete them. Platform Auth events remain separate. |
| Usage | Monthly server allowance, retry-safe accounting, workspace metrics; free pilot 1,000. Starter 50, Business 300, Professional 1,000 only after operator entitlement activation. No active paid checkout. |
| Data rights | Masked active-workspace export with explicit 1,000-record collection limits. Password-confirmed deletion checks company membership/retention first; external copies/backups are not recalled. |

Still outside completed acceptance: real SMTP delivery, merchant billing/receipts/tax/refund operations, organisation signing credentials, final legal operator/contact and approved retention policy, physical-device acceptance, backup restoration evidence, penetration testing and real customer-demand validation. These cannot be inferred from green CI. Do not advertise POPIA certification, FIPS module validation or a tamper-proof guarantee.
