# TrustBridge

Frontend for the NEMISA hackathon invoice assessment app. React Native + Expo Router + TypeScript, with Android, iOS and web preview support.

## Run the UI

```sh
cd mobile
npm ci
npm start
# Or: npm run web
```

Use Expo Go compatible with SDK 58, a matching development build, or the web preview. From the repository root, `npm run typecheck`, `npm run lint`, `npm test` and `npm run export:web` delegate to the mobile project.

## Included

- Dashboard with working recent assessment and review links.
- Searchable supplier directory and supplier detail screens.
- Invoice form with supplier selection, validation and keyboard Next navigation.
- Clearly labelled, explainable demonstration results and session-only history.
- History search/filtering, profile, display controls and information sections.
- Sign-in design with password visibility toggle (no live authentication).
- Compact five-tab floating navigation, rounded animated selection and reduced-motion support.

The design uses a 60/30/10 charcoal, white and orange hierarchy. Navigation references were reviewed in VIMBA, Exegomai (`bible_fun_facts`) and Bible Diaries; the components here are newly implemented.

## Demo boundary

**Frontend only. No Supabase connection, real authentication, live banking verification, production risk scoring or cloud persistence is implemented.** Records are fictional. New checks exist only in memory until reload. Never enter real banking details or credentials in this preview.

The local comparison exists solely to demonstrate navigation and result states. Production assessments MUST come from an authenticated, organisation-authorised backend, as specified in the team blueprint. See [UI handoff](docs/UI_HANDOFF.md) for integration points and acceptance checks.

## UI smoke checks

```sh
cd mobile
npm run export:web
npx playwright install chromium
npm run test:ui
```

The browser checks cover supplier search, invoice validation, result navigation, history filters, password visibility, session reset and all five tabs at 320, 390, 768 and 1280 pixels. Physical-device keyboard and safe-area acceptance remain part of the team’s device testing.
