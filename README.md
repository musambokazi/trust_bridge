# TrustBridge

Expo React Native invoice-reference review app. The connected 1.0.3 release uses Supabase Auth, private profiles/workspaces, supplier records, server-calculated comparisons and private avatar storage.

## Development

Node 24:
```sh
npm --prefix mobile ci
npm run typecheck
npm run lint
npm test
npm run export:web
npm --prefix mobile run test:ui
```

The mobile configuration contains only a public Supabase client key. Database grants/RLS enforce access. Never place a service-role key, database password or signing credential in app source.

Supabase migrations are in `supabase/migrations`. The SQL isolation suite in `supabase/tests/account_isolation.sql` creates temporary fixture records and rolls the entire transaction back. Use only against the intended project; do not copy credentials into test files.

## Delivery and release status

Source is main. Expo runtime is fixed at 1.0.1; app versions change for native dependencies. GitHub builds preview and production APKs when required, preserves prior releases and publishes compatible Production OTA updates. Install the new APK for native features; old runtimes stay on their isolated channels.

Read [production readiness](docs/PRODUCTION_READINESS.md) before a public launch. Email callback/SMTP configuration, real-device acceptance tests, release signing and privacy operations are outstanding; the connected validation release is not yet certified production-ready.
