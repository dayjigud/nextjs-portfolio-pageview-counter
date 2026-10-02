# Luma Android development

Android-only Flutter portfolio demo in `mobile/luma_shop/`. It consumes the same Supabase project as `/projects/shop/`, not a second backend. No real payment or shipment. UI sessions select display only; the existing Edge Functions validate bearer identities and authorize every private operation.

## Local setup

Verified on 2 October 2026: Flutter 3.47.6, Dart 3.13.5, macOS Intel, Android Studio bundled Java 25.0.3, compile/target API 36 and minimum API 24. The app explicitly selects NDK 30.0.16248370. Plugin builds automatically provisioned side-by-side NDK 28.2.13676358, SDK API 35 and CMake 3.22.1. Installed CMake 4.1.2 and API 37 remain available. Initial debug and configured release builds passed; the final release was rebuilt after review fixes and its stable-key signature verified; selected NDK30 is a verified build configuration, not a promise about every future plugin.

Flutter: `/Users/dayjigud/develop/flutter`. SDK: `/Users/dayjigud/Library/Android/sdk`. PATH lives in the user's `.zprofile`. Dependencies are pinned in pubspec.yaml and pubspec.lock; use `flutter pub get` and review upgrades deliberately. Android uses its Gradle wrapper; no additional Dart/JDK/Gradle installation is required.

From `mobile/luma_shop`:

```sh
flutter pub get
flutter analyze
flutter test
flutter devices
flutter run -d <android-device-id> --dart-define-from-file=config/luma.local.json
flutter build apk --debug --dart-define-from-file=config/luma.local.json
flutter build apk --release --dart-define-from-file=config/luma.local.json
```

`config/luma.example.json` contains public placeholders. Copy to ignored `config/luma.local.json`, using the same VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY as the web app under SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. These values are public and compiled into the APK. Never use a secret/service-role key. Unconfigured builds render navigation and an availability message without service requests.

## Structure and service contracts

`lib/app` owns bootstrap, Riverpod dependency lifetime, navigation and theme. `lib/core` owns immutable validated contracts, integer-kobo formatting, HTTP, encrypted recovery storage and sync scheduling. `lib/features` contains catalog/auth/cart/checkout controllers and native screens. Controllers accept external-operation dependencies for deterministic testing. The app uses local bundled SVG illustrations only when the corresponding server-provided image fails; no fake product records are generated.

Catalog query: `products.select('*, categories(slug), product_images(*), product_variants(*)').eq('active',true).order('name')`, public bucket `luma-catalog`. In-memory public cache lasts 120 seconds and belongs to one project-scoped repository. Private carts/orders/quotes are memory only.

| Endpoint | Contract |
| --- | --- |
| GET cart | `{id,revision,lines,subtotalKobo}`; lines carry variantId/productName/variantLabel/priceKobo/quantity/active |
| POST cart | `{variantId,quantity,expectedRevision}`; 0 removes, maximum10/item and20 variants; 409 requires review |
| POST cart-handoff | `{action:'prepare'}` with saved guest bearer; `{action:'redeem',token}` with account bearer; single-use 15-minute transfer |
| GET quote | `{cartId,cartRevision,fingerprint,subtotalKobo,deliveryKobo,totalKobo,currency}`; integerNGN kobo, fingerprint64hex |
| POST checkout | Exactly `{idempotencyKey,cartRevision,quoteFingerprint,delivery:{recipientName,city,address}}`; consent stays in UI |
| GET orders | Latest100 private orders; `?id=` reads one; `?requestKey=` recovers a saved request. Only explicit owner-scoped404 means no order |

Every function request supplies apikey and Authorization bearer. Mutations have no automatic transport retries. A lost response is an uncertain result: reconcile cart without re-adding; recover checkout through orders before retrying the exact saved request/key. Network/401/503 must never allocate a replacement key. Server remains authoritative for totals, identity and prices.

## Authentication and recovery

Add exactly `xyz.ayodeji.luma://auth/callback` to the existing Luma Supabase Auth redirect allowlist, preserving all web entries and the canonical site URL. Keep the existing Google-to-Supabase HTTPS callback; no new Google client secret belongs in the APK. The Android manifest has the matching scheme/host/path and disables Flutter's competing built-in deep-link handler. Supabase SDK alone exchanges PKCE codes; the app reacts to Auth state and completes the existing handoff.

Sessions, PKCE verifier, temporary guest session/token/return destination and unresolved checkout request are stored through flutter_secure_storage, scoped to project. Android backup is disabled to prevent restoring encrypted blobs without their device key. Guest recovery is kept through cancellation, expiry, conflict and process death until explicit restoration or confirmed transfer. Account changes discard prior responses and private UI; local sign-out affects this phone only. Pending checkout records remain encrypted/account-scoped so returning to that account can recover a lost response.

Only server-definitive checkout rejections may be explicitly resolved and replaced after confirming no saved order. A remote invalidation alone cannot discard an uncertain request. Provider acceptance is not inbox delivery; receipt reads use bounded email-status polling and never subscribe to the private outbox.

## Shared sync activation

Review `20261002152302_luma_realtime.sql` before applying to the verified Luma project `xiunfinvgxoquxiqnnyj`. It adds only missing carts/orders membership to supabase_realtime and preserves existing grants/RLS. No functions, tables, prices or deletion schedules change. Do not run a broad db push if unrelated pending migrations exist. Private outbox stays unpublished.

Both clients subscribe with owner filters and refetch authoritative functions. Subscription is followed by a snapshot; bursts coalesce250ms; active clients refresh on focus/resume and every30seconds as a missed-event fallback. Private owner filters are optimizations; RLS provides authorization. The web checkout preserves draft/focus, marks its quote stale and requires total review. Guest writes and checkout requests are not replayed offline.

Local implementation does not itself enable the production publication or OAuth allowlist. Live project admin access is required; current CLI account does not list the Luma project. Public catalog access was verified:15 products/15 variants/15 images. No live transaction/email was generated for verification.

## Signing and APKs

Application ID: `xyz.ayodeji.luma_shop`; label: Luma Shop. Release configuration reads ignored `android/key.properties`; it accepts storeFile/storePassword/keyAlias/keyPassword. The stable local demo key lives outside Git at `/Users/dayjigud/develop/luma-signing/luma-demo.jks`, with restrictive permissions. Keep this key/password backup private and preserve the key/application ID when upgrading. Without local properties, development release builds use the standard debug identity; the final shared APK must use the stable local key.

Output: `mobile/luma_shop/build/app/outputs/flutter-apk/app-release.apk`. Build output, local config, properties, keystores, SDKs and caches are excluded from commits. Use `adb install -r <apk>` only on the designated device; switching signing identities requires a deliberate uninstall, which loses app data.

## Verification and remaining acceptance

Run Flutter analyzer/tests; web `npm run test:shop:unit`, `npm run test:shop:functions`, and `npm test` after sync changes. Full browser runner restores normal tracked dist; keep CI disabled. SQL fixture `supabase/tests/shop-realtime.sql` requires an isolated database, not the public demo. The opt-in Realtime test requires `LUMA_TEST_ISOLATED=true`, `LUMA_TEST_ADMIN_DATABASE_URL`, `LUMA_TEST_SUPABASE_URL`, `LUMA_TEST_PUBLISHABLE_KEY`, `LUMA_REALTIME_OWNER_TOKEN`, and `LUMA_REALTIME_OUTSIDER_TOKEN`. Use two permanent disposable test users in an isolated project; the fixture changes/cleans up their carts and temporary orders without creating email outbox jobs. It rejects the shared Luma project. Existing transaction tests also require isolation and dedicated credentials; both tests skip without their configuration.

Local evidence (2 October 2026): Flutter analyzer has no issues; 34 Flutter unit/widget regressions pass, including remote draft/focus preservation, saved-request retry after invalidation, OAuth single-flight and old-owner cart rejection. Web unit tests: 13 passed. Browser tests: 108 passed (46 unconfigured + 62 configured). Server checks: 18 passed; two isolated integration tests skipped. A fresh read-only review found six important issues and one minor catalog-refresh issue; all were addressed, followed by the passing mobile suite. This is local evidence, not live acceptance.

Native test fixtures: `flutter test integration_test/shop_flow_test.dart -d <android-device-id>` and `flutter test integration_test/recovery_test.dart -d <android-device-id>`. These exercise Flutter/native storage on a device with intercepted services. Complete the live matrix separately.

Pending device/provider acceptance:

- Connect and authorize Android phone; API37 emulator currently stalls before adb becomes online.
- Install/upgrade signed APK and confirm session persistence and release networking.
- Live Google login resolves to the same existing web user ID; callback twice/process death does not double-transfer.
- Web add appears on phone; phone quantity edit appears on web; reconnect/resume catches missed edits.
- Guest cancellation/merge conflict retains both bags; simultaneous edits require review.
- One deliberate demo checkout visible on both clients; lost-response restart recovers one order/outbox job. Obtain separate authorization because this sends email.
- Two real isolated users prove websocket owner authorization, alongside rollback SQL RLS checks.
- TalkBack, large text, keyboard, Android Back, reduced motion, image fidelity and release performance on the phone.

Do not report these live/device checks as passed from mocked tests or Flutter Doctor. Publishing to Play, iOS, real payments/shipment, wishlist, saved addresses and guest deletion remain outside scope.

## Release artifact verification

Initial 1.0.0 release APK: 57.2 MB, application ID `xyz.ayodeji.luma_shop`, version `1.0.0+1`, minimum API24, target/compile API36. `apksigner verify --print-certs` passed using the Luma Shop Demo certificate. Binary inspection confirmed INTERNET, backup disabled, exact OAuth callback and `flutter_deeplinking_enabled=false`. APK SHA256: `fa4d1c632353d0874bedf9f6d5b167b478509a6f0e6477c24ee65738d725a20a`. This proves packaging/signing, not installation or runtime acceptance.

The detailed administrator/phone walkthrough is in `docs/superpowers/plans/2026-10-02-luma-android-flutter.md`, under Google Cloud, Supabase and phone configuration checklist. Final debug build also passed (72.3s).

## Backend deployment update — 2 October 2026

The user authorized deployment and GitHub push. The Main Supabase connection verified Luma project xiunfinvgxoquxiqnnyj as ACTIVE_HEALTHY. Migration luma_realtime applied successfully with remote version 20261002152302; the local filename now matches remote migration history. Post-deployment inspection confirms only public.carts/public.orders in supabase_realtime, and both tables retain RLS. Public Auth settings confirm Google and anonymous login enabled; the custom redirect allowlist and Google console credentials still need live callback verification. No Edge Function source changed, so no function redeployment was needed.

GitHub branch codex/luma-android pushed successfully. Remaining release work: merge/deploy web change; connect/install on Android phone (adb currently lists none); verify exact callback/account identity, guest transfer/recovery and bidirectional sync; run isolated transactions/owner websocket checks and native accessibility/performance. User reports keys entered; their correctness is not inferred from that report.

Post-DDL security advisor warnings were reviewed: anonymous owner cart access is intentional for guest bags; cron's policies are username=current_user and authenticated has no cron schema USAGE. Leaked password protection is disabled; this demo's implemented permanent sign-in is Google. No new missing-RLS advisory was returned.

## Physical device acceptance and refresh correction — 2 October 2026

Signed release installed on an authorized Infinix X6855 running Android16/API36. User confirmed Google OAuth returned successfully and exposed a UI defect: startup/account content stayed stale until navigating. Reproduced in a widget regression: notifying AppRuntime did not refresh cached GoRouter pages. Shell and every routed screen now subscribe directly through state-preserving AnimatedBuilder boundaries. Checkout draft/focus regression still passes. Removed the global top-right refresh button as requested; existing pull-to-refresh remains. Version1.0.1+2 includes this correction. Flutter analyzer clean,37 unit/widget regressions pass. Native cold-launch acceptance recorded after installing the update below; a new live Google callback should also be retested by the user.

Signed1.0.1+2 release built successfully (85.5s), signature matches the stable demo certificate, and in-place installation succeeded. Existing login/private order access survived. A second force-stop/launch loaded the live collection automatically without tab switching or refresh; native header has no refresh button. Live Google callback after this fix remains a user retest; startup and sign-in transitions are covered by the new widget regressions.
