# System architecture

1. Supabase Auth issues a confirmed account session; optional TOTP raises assurance to AAL2. The client stores native tokens and per-account/per-workspace caches in OS-backed SecureStore. Web uses sessionStorage.
2. Check invokes `check-invoice` with the user's JWT. The Edge Function authenticates using Auth getUser and forwards the caller identity to the database RPC. It never accepts a client risk level.
3. PostgreSQL checks current role/MFA, bounded fields, account request rate and monthly workspace quota. It compares full values, writes the immutable masked result and server audit event in one transaction.
4. Shared reads use live membership RLS. Supplier changes and reviewer checklists use versioned, payload-bound idempotency receipts. Conflicts require explicit resolution.
5. Online report signing obtains a consistent authorised server snapshot. The server renders and signs it; a service-only RPC encrypts signing seed material in Vault. The user receives PDF + proof in a ZIP. The app verifies locally against a separately retrieved trusted public key registry.
6. The offline verifier does not upload selected documents. It validates bounded uncompressed ZIP contents, PDF/snapshot hashes and the ML-DSA signature. It never treats a self-supplied public key as trusted.

Trust boundaries: device/client → HTTPS Auth/Edge gateway → user-scoped database access → narrowly scoped private database functions; signing Edge service identity → service-only Vault/signature registration RPCs. Service-role credentials exist only in Edge environment variables.

Private functions have explicit grants and fixed empty search paths. They perform their own identity and role checks; RLS remains enabled on public tables. Audit/snapshot/signature tables have no ordinary client write privileges. Shared membership decisions are not read from editable user metadata.

Offline changes are local intentions until acknowledged. Network reachability alone is not successful sync. Workspace switches are online and blocked while current work is pending; downloaded data is not a fresh access/verification guarantee.
