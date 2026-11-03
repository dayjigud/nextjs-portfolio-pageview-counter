# Repository guide for coding agents

Keep this file synchronized with major architecture and development workflow changes. Before finishing a substantial coding task, check whether it changes anything documented here or adds information future agents need; update this file in the same change when it does. Skip documentation churn for minor fixes and cosmetic edits.

## Project overview

This is a Vite site with HTML entry points for Ayodeji Adeniyi's portfolio at `/`, the project gallery/Donewell at `/projects/`, and the Luma shop under `/projects/shop/`. The implementation uses semantic HTML, vanilla JavaScript, Tailwind CSS, and custom CSS. There is no React app or client-side router.

Donewell runs entirely in the browser. It has no account system, server API, or database. The absence of a portfolio link to `/projects/` does not make that page authenticated or access-controlled.

Luma is a tech shop portfolio demo with no payment or shipment. Guests browse and maintain a Supabase-backed anonymous cart; Google authentication is required at checkout. Supabase Edge Functions handle cart revisions, guest transfers, owner-scoped orders, and a Mailgun email outbox. Donewell remains independent of these services.

## Repository map

- `index.html`: portfolio content, featured projects and the native walkthrough dialog; `src/navigation.js`: accessible mobile menu behavior; `src/portfolio-motion.js`: case-study deep links and local guided concept walkthroughs. `public/images/portfolio/` holds authored SVG interface concepts, explicitly labelled as illustrations rather than production screenshots. Walkthroughs never call product APIs or perform bookings. Autoplay is disabled initially for reduced motion and pauses on backgrounding, preference changes or dialog close; manual controls remain available.
- `projects/index.html`: Donewell markup; `src/projects.js`: task state, calendar, filters, repeating tasks, and JSON backup import/export.
- `projects/shop/**/index.html`: direct shop routes; `src/shop/`: catalog, guest/auth state, API requests, rendering, checkout and receipts. `public/images/luma/`: catalog illustrations.
- `supabase/migrations/`: additive database schema and catalog seed; `supabase/functions/`: server handlers; `supabase/tests/`: rollback SQL fixtures. `supabase/pending-migrations/` contains unapproved anonymous account deletion and must not be applied automatically. `docs/luma-operations.md` documents service configuration and verification limits.
- `mobile/luma_shop/`: Android Flutter client sharing the same Luma Supabase project. `lib/app/` owns runtime/providers/router/theme; `lib/core/` owns validated integer-kobo contracts, function transport, encrypted session/recovery storage and sync scheduling; `lib/features/` owns controllers and native screens. Public configuration and signing files are ignored. See `docs/luma-mobile-development.md` for commands, callback setup and verification limits.
- `src/index.css`: shared and page-specific styles. `tailwind.config.js` defines theme tokens and scanned source files; `postcss.config.js` wires Tailwind and Autoprefixer.
- `public/images/`: static images. `vite.config.ts` configures all HTML build entries, relative asset paths, and the initial Luma layouts using `loadingHtml`/`navHtml` from `src/shop/render.js`. Shop HTML uses a `data-shop-initial` marker replaced in development and production; keep that marker when editing entry points.
- `tests/portfolio.spec.js` and `tests/shop.spec.js`: portfolio/Donewell and unconfigured shop browser checks. `tests/shop-auth.spec.js`, `tests/shop-checkout.spec.js`, and `tests/helpers/shop-fixture.js`: configured shop flows with intercepted service responses. `tests/unit/` and `supabase/functions/tests/`: browser helpers and server logic. `playwright.config.js` configures desktop/mobile Chromium.
- `scripts/test-browser.mjs`: runs both browser configuration states and restores the normal production build. `.superdesign/` records the approved Prism design references; its initialization files are design-time snapshots, not current architecture guidance.
- `.github/workflows/ci.yml`: CI install, Chromium setup, and test run. The CI workflow was manually disabled in GitHub on 1 October 2026 at the user's request; leave it disabled unless the user authorizes re-enabling it. Local test commands remain available. `vercel.json`: deployment build and output settings.
- `dist/`: tracked generated production output. Edit source files, then regenerate with `npm run build`; do not hand-edit generated assets.
- `plans/` contains working notes. `Performance_Audit_Report.md` and `OPTIMIZATION_SUMMARY.md` describe an older React version and are historical, not current architecture guidance.

## Setup and commands

Use Node.js 22 or newer and npm (required by the pinned Supabase client). Portfolio and Donewell require no service configuration. Luma reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from ignored `.env.local` (see `.env.example`); these public values are compiled into its bundle. Keep OAuth, Mailgun, database and scheduler secrets exclusively in server/provider configuration, never in Vite variables. Unconfigured Luma displays its availability state. Playwright reads `CI` to adjust retries, reporting, and server reuse in CI.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

`npm test` builds and tests the unconfigured portfolio/gallery state, then builds with public fixture configuration for mocked shop flows, and always restores the normal production build. Browser tests use the production preview server. If Chromium is missing, run `npx playwright install chromium`. `npm run test:shop:unit` checks pure browser helpers; `npm run test:shop:functions` checks server logic using pinned Deno. SQL fixtures require an isolated database runner, not pgTAP. Mocked browser responses do not verify live providers or concurrent database transactions. The package has no general lint or formatting check. Vercel builds with `npm run build` and serves `dist/`.

## Implementation conventions and constraints

- Keep page markup in its HTML entry point, behavior in the corresponding `src/*.js` module, and styling in `src/index.css`. Follow existing semantic controls, ARIA state, visible focus styles, and `prefers-reduced-motion` handling.
- Donewell saves its task array in `localStorage` under `donewell-tasks-v1`. Preserve existing saved tasks when evolving the data shape. JSON backup import/export uses version `1`; keep current backups readable.
- Due dates are local calendar dates in `YYYY-MM-DD` form. Avoid UTC conversions that could shift a user's date. Repeating tasks require a due date, and the date picker must work in both add and edit forms with keyboard and narrow screens.
- Task rows are rendered from user-entered data in `src/projects.js`; keep escaping and backup validation intact when changing rendering or import behavior.
- The portfolio and Donewell share the stylesheet but have distinct page styling. Check both pages when changing shared CSS or Tailwind configuration.
- Scope shop CSS under `.luma`. Preserve guest carts on OAuth cancellation or merge conflict, validate server identities before transactions, and never trust client prices, email addresses, cart owners or order totals. Keep checkout request keys stable until an order is recovered/confirmed, including after a lost response and reload.
- Google and shopping bag icons are local SVG markup in `src/shop/render.js`. Keep decorative icons hidden from assistive technology and preserve button/link names when text is visually hidden on narrow screens.
- Browser Edge Functions deliberately use `verify_jwt = false` because the legacy gateway check does not support the selected signing-key setup; their shared handler must validate every bearer session through Supabase Auth before database access. Scheduler functions validate a separate server secret. Never remove these checks.
- Confirmation email processing requires the named one-minute cron job from `20260930171122_luma_email_schedule.sql` and matching scheduler secrets in Vault (`luma_scheduler_secret`) and Edge Functions (`LUMA_SCHEDULER_SECRET`). A queued outbox row is not proof of a Mailgun request or delivery; verify attempts, worker response, and provider logs. Never embed credentials in migrations or cron command text.
- `renderEmail` in `supabase/functions/_shared/domain.ts` supplies the branded HTML receipt and plain-text alternative to Mailgun. Keep email layout in presentation tables with inline essential styles, escape order content and receipt URLs, and preserve the demo notice and private-receipt sign-in guidance. Template-only updates require deploying `email-worker`; the Vite build does not update sent emails. `supabase/functions/tests/email.test.ts` checks receipt amounts, links, escaping, and excluded delivery details.
- Both Luma clients treat owner-scoped Realtime events as invalidation signals and refetch trusted functions. `src/shop/sync.js` and `refresh-coordinator.js` coordinate web subscriptions, pending writes, focus/resume and periodic fallback. Web checkout remote changes preserve draft/focus and require quote review. The additive `20261002141817_luma_realtime.sql` publication migration requires explicit deployment approval; source presence does not prove live activation.
- Flutter sessions, PKCE and guest/checkout recovery use project-scoped encrypted storage; Android backup is disabled. Keep uncertain checkout keys and exact payloads across restart/account switches, and never replace a key merely because a remote cart event occurs. Native callback is `xyz.ayodeji.luma://auth/callback`; Supabase SDK alone exchanges it. Server keys never enter app config.
- Luma renders its initial layout before service requests. Local session data controls display only; server handlers validate identities before private data access. Public catalog rows may be reused from `sessionStorage` under `luma-public-catalog-v1` for two minutes and are scoped to the configured Supabase URL. Never cache private carts, quotes, orders or customer data there; server cart/checkout responses remain authoritative for prices and availability.
- Add-to-bag uses the loaded server cart and serializes pending additions. The badge includes pending quantities immediately; reconcile failures against the server and never blindly replay an add after a lost response. Wait for pending saves before navigating to the bag or starting OAuth.
- Cart revisions and single-use guest handoffs are transactional. Rate-limit accounting commits independently so failed requests consume limits. Orders and email jobs commit together; Mailgun runs separately with leased, bounded retries. Provider acceptance is not proof of inbox delivery.

## Service configuration and deployment

The isolated Luma project has additive schema, seeded catalog metadata, and six deployed functions: `cart`, `cart-handoff`, `quote`, `checkout`, `orders`, and `email-worker`. Check live configuration rather than inferring readiness from source or a successful build. User-entered provider keys are outside this repository; Google/anonymous Auth, the restricted database role connection, allowed origins, Mailgun sender, Storage uploads, and scheduler activation each need separate verification. Follow `docs/luma-operations.md` for their settings and integration checks.

Deploy only the intended functions explicitly. Anonymous account deletion was rejected by automatic approval review and remains unapproved: do not apply `supabase/pending-migrations/`, deploy `guest-cleanup`, or activate its schedule without explicit authorization. No automatic 30-day deletion is currently promised by the UI. Keep all private credentials out of commits and compiled assets; `.env.local` stays ignored.

## Testing expectations

Run relevant Playwright tests after behavior changes; run the full `npm test` suite for portfolio or shared-style changes. Tests cover navigation, desktop and mobile layouts, keyboard interaction, accessibility, Donewell persistence/calendar/recurrence/filters/backups, guest cart privacy, Google transfer recovery, checkout retries, and private receipts. The disabled CI workflow is configured for Node 22 with unit, Deno, and browser checks; run these checks locally while it remains disabled. The opt-in real service/database transaction suite requires isolated database credentials and may be skipped without them; report that limitation separately from mocked browser coverage. Report failures rather than changing tests to hide them. After source changes that affect production output, run `npm run build` so tracked `dist/` matches the source.

## Android development

From `mobile/luma_shop`, use `flutter pub get`, `flutter analyze`, `flutter test`, `flutter run --dart-define-from-file=config/luma.local.json`, and `flutter build apk --release --dart-define-from-file=config/luma.local.json`. The public config file and `android/key.properties` remain ignored. Commit pubspec.lock; keep output/SDKs/private signing material out of Git. Preserve application ID and signing key for upgrades. Current app selects NDK30.0.16248370; plugins may provision their own side-by-side NDK/SDK/CMake versions.

`flutter test integration_test -d <android-device-id>` runs injected-service device flows and encrypted recovery without live orders/emails. SQL and Realtime privacy fixtures need isolated backend credentials; `realtime.integration.test.ts` additionally needs two disposable test-user tokens and rejects the shared Luma host. Mocked tests/doctor/build success do not establish physical-device, Google-provider, publication, or inbox delivery acceptance. CI stays disabled.
