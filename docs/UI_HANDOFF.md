# Frontend handoff

## Design

A charcoal workspace with editorial headings, open list rows and restrained white reading/form panels. Orange is reserved for primary actions, selected navigation and discrepancy emphasis. Orange button labels are dark for contrast; warnings on white use dark brown. Ratios describe the overall visual hierarchy rather than a fixed pixel count on every screen.

The floating bar combines the compact silhouette found in Bible Diaries/Exegomai with the measured animated indicator behaviour reviewed in VIMBA. It has five routes: Home, Suppliers, Check, History and Profile. It respects safe-area insets, hides for native keyboards, supports screen-reader tab labels/selection and honours reduced motion. Main content reserves bottom space for the overlay. Supplier and assessment detail pages use back navigation.

## Integration seams

- `mobile/src/domain/demo.ts`: typed fixtures, input types and local demonstration comparisons. Do not reuse the local comparison as a trusted production risk engine.
- `mobile/src/state/DemoState.tsx`: replace session-only fixtures with an authenticated API repository. Do not expose service-role credentials in mobile code.
- `mobile/app/(tabs)/check.tsx`: validate input for immediate feedback, then submit to the team's authenticated `check-invoice` Edge Function. The server must repeat validation and enforce organisation access. Display backend findings; the client must not choose a trusted risk score.
- `mobile/app/assessment/[id].tsx`: retrieve an authorised assessment by ID. Handle loading, network failure, access denied and missing records when integrating.
- Supplier updates are intentionally absent until backend authorisation, audit logging and a review process exist. Contact addresses use the reserved `.example` domain.
- `mobile/app/sign-in.tsx`: visual form only. Connect Supabase Auth and session management separately; do not treat Explore demo as authentication.
- Replace preview privacy/security descriptions with reviewed production notices before release. This frontend makes no claim of implemented RLS, POPIA compliance, certified security or fraud detection accuracy.

## Preview acceptance

1. Dashboard review action opens filtered History; all five bottom tabs navigate.
2. Supplier search filters records and detail pages show masked references.
3. Check form rejects missing/invalid values; supplier picker and keyboard Next work.
4. Changed banking reference produces an explained review state; a matching fixture shows no discrepancies detected, never payment approval.
5. Unknown and unverified suppliers need independent verification.
6. New demo results appear in History during the current session. Refresh clears new results.
7. Sign-in Show/Hide works and the preview does not send credentials.
8. Check narrow phone layouts, large text, desktop web and physical Android/iOS keyboards.

## Scope

No database, backend functions, user accounts, telemetry, deployment, EAS configuration or app release is created by this frontend change. The team retains ownership of integration and deployment.
