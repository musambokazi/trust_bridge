# Database schema

- `profiles`: private account names, username, phone, avatar path and display scale.
- `workspaces`: owner and business/individual details. Owner identity is immutable.
- `workspace_members`: live admin/reviewer/viewer grants. Only server team operations manage rows.
- `suppliers`: private full bank/tax/branch reference, contact, owner-reviewed timestamp and monotonically increasing version.
- `assessments`: immutable server result JSON, workspace, submitter and optional supplier FK. It contains the invoice summary, masked values, explained risk and reference snapshot. A separate full raw invoice table is intentionally avoided.
- `assessment_reviews`: current validated checklist and notes, last reviewer, workspace, version and server date; separate from the original finding.
- `supplier_changes`: append-only before/after masked snapshots, actor, reason, version and server date.
- `security_events`: append-only successful operation metadata for owner/admin review. Passwords and complete banking/tax fields are excluded.
- `signed_reports`: immutable manifest, PDF hash, detached signature, key identifier and actor. It does not store an uploaded arbitrary PDF or signer seed.
- `plan_requests`: non-financial upgrade requests. No client can activate paid entitlements.
- Private schema: hashed invitations; request windows; monthly entitlements; input hashes and workflow receipts; signing key metadata pointing to encrypted Vault secret IDs.

All exposed tables use RLS and explicit grants. Private tables use deny policies as defence in depth. SQL migrations are authoritative; `mobile/src/backend/database.types.ts` is generated from the deployed schema. Backups and deletion must account for foreign-key cascades and shared company records; see SECURITY_PLAN.md.
