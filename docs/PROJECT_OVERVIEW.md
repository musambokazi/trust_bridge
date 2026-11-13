# TrustBridge

TrustBridge helps an authorised workspace compare invoice information with an independently maintained supplier reference before payment. It is a decision-support tool, not a bank ownership service, invoice authenticator or payment approver.

The mobile client uses React Native/Expo and TypeScript. Supabase Auth, authenticated Edge Functions, PostgreSQL validation/RLS and Vault protect the connected workflow. Offline checks and edits enter an encrypted native outbox; the server alone assigns risk tiers. Shared workspaces have owner, admin, reviewer and viewer permissions.

The core flow is reference → reviewed invoice fields → server comparison → explained risk and recommended checks → saved review → optional ML-DSA-65 signed PDF bundle. Unknown suppliers produce Elevated Concern without an invented reference. Manual entry and offline Android photo/PDF recognition remain available.

Sources stay on main. Runtime remains 1.0.1; native compatibility channels isolate app builds. v1.0.8 adds the integrity verifier's JavaScript dependencies and needs new preview/production builds under the repository's hash policy.
