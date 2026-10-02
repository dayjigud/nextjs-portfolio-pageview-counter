# Luma Android Flutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task; use superpowers:subagent-driven-development only if the user selects delegated execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an installable Android Flutter portfolio demo sharing Luma's web catalog, Google accounts, carts, and orders, with automatic refresh in both active clients.

**Architecture:** Add an Android Flutter project at `mobile/luma_shop/`, using the existing Supabase Auth, catalog/Storage, and trusted Edge Functions. Keep the server authoritative for prices, identity, revisions, checkout, and order ownership. Add owner-scoped Realtime invalidation and lifecycle refresh to Flutter and the existing web client; do not create a second production backend.

**Tech Stack:** Flutter 3.47.6, Dart 3.13.5; Android compile/target SDK 36, minimum SDK 24, explicitly selected installed NDK 30.0.16248370; `supabase_flutter`, `flutter_riverpod`, `go_router`, `http`, `flutter_secure_storage`, `flutter_svg`, `intl`, `uuid`; existing Vite/vanilla JavaScript, PostgreSQL RLS, Supabase Edge Functions and Mailgun.

**Spec:** [Luma Android research and scope](/Users/dayjigud/Documents/GitHub/nextjs-portfolio-pageview-counter/plans/2026-10-02-luma-android-flutter-research-plan.md). Read it together with this plan and the current `AGENTS.md` before execution.

**Status:** Implementation authorized on 2 October 2026 and developed in managed worktree `codex/luma-android`. Local native screens, service/recovery controllers, web sync, publication migration, regression and opt-in integration suites are implemented. Initial debug/release builds verified NDK30; plugin projects provisioned NDK28.2/API35/CMake3.22.1 side by side. Live activation, physical-device acceptance and isolated service/database checks remain pending. Composite task checkboxes below retain their original acceptance requirements; they are not blanket-marked complete based on mocks.

| Tasks | Implemented locally | Remaining acceptance |
| --- | --- | --- |
| 1–3 | Android scaffold, immutable contracts, API and public catalog | Native rendering/networking on phone |
| 4–6 | PKCE guest recovery, revisioned cart, encrypted idempotent checkout | Live Google identity/transfer and authorized demo order |
| 7–8 | Mobile/web invalidation, lifecycle snapshots, draft-preserving web updates, additive migration | Reviewed publication activation, web deployment, isolated owner events |
| 9 | Regression suites and opt-in native/live fixtures | Physical-device and live two-client matrix |
| 10 | Stable local demo signing configuration and APK builds | Phone installation/upgrade/performance |

## Global constraints

- Android only, device testing first. No Play Store submission, iOS, payments, shipment, push notifications, saved addresses, wishlist, or profile editor in this release.
- Preserve the existing demo checkout, fictional delivery details, and explicit consent. Exact disclosure: `Portfolio demo — no payment or shipment.`
- Use the same verified Luma Supabase project and Google provider as the website. Independent device sessions must resolve to the same account user ID.
- Keep server credentials out of mobile configuration and compiled assets. Only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are public build values.
- Cart mutations use `expectedRevision`, quantities 0–10 (0 removes), and at most 20 variants. Handoff expires after 15 minutes. Demo delivery is 250000 kobo. Currency is `NGN`; use integer kobo.
- Checkout request fields are exactly `idempotencyKey`, `cartRevision`, `quoteFingerprint`, and `delivery` containing `recipientName`, `city`, `address`. Consent is a UI gate, not an extra API field.
- Preserve guest bags on cancellation/conflict and preserve unresolved checkout keys and exact payloads across process death. No automatic replay of uncertain cart writes or offline checkouts.
- Keep server bearer-session validation and owner policies. Do not apply pending guest-deletion migrations or deploy/schedule `guest-cleanup`.
- Realtime covers `public.carts` insert/update and `public.orders` insert, as invalidation signals. Keep private outbox data out of subscriptions, caches, and logs.
- Public catalog cache: two-minute TTL, project-scoped, shape-validated. No persistent private cart/order cache; encrypted recovery/session records are separately scoped and purpose-limited.
- Preserve web direct routes, useful initial layouts, Donewell data, and tracked web `dist/`. Keep GitHub CI disabled. No unrelated refactors.
- Pin compatible package versions and commit `pubspec.lock`. Do not upgrade Flutter/Java/NDK merely to suppress a warning; verify the generated Android build first.

## Review focus

1. Callback delivered twice or after process death: one handoff outcome, saved guest recovery, correct destination (Task 4).
2. Auth/account changes during an outstanding fetch: old-user responses cannot repopulate the next user's bag/history (Tasks 2 and 7).
3. Remote updates while a checkout form is being edited: preserve draft and focus; invalidate quote and require review (Tasks 6 and 8).
4. Lost successful write response: reconcile cart without duplication and recover one order using its stable request key (Tasks 5 and 6).
5. App resume after missed events or failed subscription: fresh server snapshot, coalesced refresh, no dependence on uninterrupted sockets (Tasks 7 and 8).

## File map and execution conventions

All paths below are relative to repository root `/Users/dayjigud/Documents/GitHub/nextjs-portfolio-pageview-counter`. Flutter commands run from `mobile/luma_shop`; npm commands run from repository root. Future filenames specify planned files, not existing implementation.

| Area | Planned files and responsibility |
| --- | --- |
| Android project | `mobile/luma_shop/pubspec.yaml`, `pubspec.lock`, `android/app/build.gradle.kts`, `android/app/src/main/AndroidManifest.xml`; build, packages, internet permission, OAuth callback, signing |
| App | `lib/main.dart`, `lib/app/config.dart`, `lib/app/providers.dart`, `lib/app/router.dart`, `lib/app/theme.dart`, `lib/app/luma_app.dart`; bootstrap, dependency injection, navigation, theme |
| Shared transport/recovery | `lib/core/shop_api.dart`, `shop_error.dart`, `money.dart`, `secure_store.dart`; typed HTTP, error mapping, formatting, encrypted persistence |
| Catalog | `lib/features/catalog/{product.dart,catalog_repository.dart,catalog_screen.dart,product_screen.dart}` |
| Auth | `lib/features/auth/{auth_controller.dart,handoff_state.dart,sign_in_screen.dart,transfer_review_screen.dart}` |
| Bag | `lib/features/cart/{cart.dart,cart_controller.dart,cart_screen.dart}` |
| Checkout | `lib/features/checkout/{quote.dart,checkout_request.dart,checkout_controller.dart,checkout_screen.dart}` |
| Orders | `lib/features/orders/{order.dart,orders_screen.dart,receipt_screen.dart}` |
| Sync | `lib/core/shop_sync.dart`, `src/shop/sync.js`, `src/shop/refresh-coordinator.js`; subscription/lifecycle invalidation |
| Tests/config | `mobile/luma_shop/test/{fixtures,core,features}`, `integration_test/`, `config/luma.example.json`; fake transport, controller and widget coverage, device scenarios |
| Backend/docs | CLI-generated `supabase/migrations/<timestamp>_luma_realtime.sql`, `supabase/tests/shop-realtime.sql`, `docs/luma-mobile-development.md`, `docs/luma-operations.md`, `AGENTS.md` |

Use an isolated worktree at execution time, preserving these currently uncommitted planning files. Do not reset the user's checkout. Make a focused local commit after each task's checks pass; committing does not authorize pushing, deployment, or publishing. Prefer native execution because the controller interfaces are closely coupled; no agents are dispatched by this planning task.

## Task 1: Runnable Android shell, configuration, and typed contracts

**Files:** Create the Android project and app/core model files listed above; create `test/app/config_test.dart`, `test/core/models_test.dart`, `test/app/startup_test.dart`, `test/fixtures/shop_fixtures.dart`; modify `.gitignore` for Flutter caches/output, private local configuration and signing material.

**Interfaces produced:** `AppConfig.fromEnvironment()` with `Uri? supabaseUrl`, `String publishableKey`, `bool get isConfigured`; `LumaApp` with providers supplied through Riverpod; routes `/`, `/product/:slug`, `/cart`, `/signin`, `/auth/callback`, `/transfer`, `/checkout`, `/account`, `/receipt/:id`. Models `Product`, `Variant`, `ProductImage`, `Cart`, `CartLine`, `Quote`, `DemoOrder`, `OrderLine`, `Delivery`, `CheckoutRequest`, each with validated `fromJson` or request `toJson`. `Cart.id` is nullable only for the empty no-session display model. `Quote.fingerprint` maps to request `quoteFingerprint`; `OrderLine` must not require cart-only `active`.

- [ ] Scaffold with `flutter create --platforms=android --org xyz.ayodeji --project-name luma_shop mobile/luma_shop`. Keep generated application ID `xyz.ayodeji.luma_shop`, set display label `Luma Shop`, and add the planned dependencies with compatible pinned versions.
- [ ] Set `ndkVersion = "30.0.16248370"` in `android/app/build.gradle.kts` to use the installed NDK instead of `flutter.ndkVersion`. Retain compile/target 36 and min 24. Do not install NDK 28 unless a concrete build/plugin incompatibility requires it; document the evidence for any fallback.
- [ ] Write failing config/model/startup tests. Fixture IDs use the UUIDs in `tests/helpers/shop-fixture.js`; replace its simplified quote/handoff tokens with a 64-character hexadecimal fingerprint/token, and use a UUID for cart ID to match live contracts. Assertions include:
  ```dart
  expect(Cart.fromJson(cartJson(quantity: 2)).subtotalKobo, 29000000);
  expect(Quote.fromJson(quoteJson()).deliveryKobo, 250000);
  expect(DemoOrder.fromJson(orderJson()).demo, isTrue);
  expect(() => Variant.fromJson(variantJson(price: -1)), throwsFormatException);
  ```
  Define those JSON builders in `test/fixtures/shop_fixtures.dart`; one unit at 14500000 kobo, delivery 250000, NGN, confirmed demo order. Hold session/catalog futures in the startup widget test: navigation and disclosure must render before they finish. Unconfigured mode must make zero service requests.
- [ ] Run `flutter test test/app test/core/models_test.dart` and confirm the new behavioral tests fail; replace the generated counter test.
- [ ] Implement models and configuration, schema validation, integer money formatting, theme from current `.luma` styles/rendered site, and immediate startup shell. Do not use the historical design snapshot as current architecture or fabricate catalog data in production.
- [ ] Add `config/luma.example.json` with empty public values; ignore `config/luma.local.json`. Use `--dart-define-from-file=config/luma.local.json` for configured runs. Add main-manifest `android.permission.INTERNET`.
- [ ] Run `flutter analyze`, the task tests, `flutter build apk --debug`, and `flutter build apk --release` in unconfigured mode with the initial selected packages. Verify NDK 30 and Android Gradle/Java 25 compatibility from actual builds; address a concrete error if one occurs. Repeat native builds if later package additions change the plugin set. Final distributable signing is Task 10. Commit only source/lockfile/docs, not SDKs or output.

## Task 2: Existing service API and error adapter

**Files:** Create `lib/core/shop_api.dart`, `shop_error.dart`, `test/core/shop_api_test.dart`; add `docs/luma-mobile-development.md` contract table. Reference existing `src/shop/api.js` and server domain/auth/service files.

**Consumes:** Task 1 models/config, injected `http.Client`, and `Future<Session?> Function()` current-session getter (`Session` from Supabase SDK).

**Produces:** `ShopApi.getCart({Session? sessionOverride}) -> Future<Cart>`; `updateCart({required String variantId, required int quantity, required int expectedRevision, Session? sessionOverride}) -> Future<Cart>`; `prepareHandoff({required Session guestSession}) -> Future<HandoffToken>`; `redeemHandoff(String token) -> Future<Cart>`; `getQuote() -> Future<Quote>`; `placeOrder(CheckoutRequest request) -> Future<DemoOrder>`; `getOrder(String id)`, `findOrderByRequest(String key)` -> `Future<DemoOrder>`; `listOrders() -> Future<List<DemoOrder>>`. `HandoffToken` has `String token`, `DateTime expiresAt`. `ShopError` has `String code`, `String message`, `int? status`, `Map<String,dynamic>? details`.

- [ ] Write `shop_api_test.dart` with `http.MockClient`. Assert exact paths/methods/body fields, bearer and publishable-key headers, encoded order query parameters, session override for guest recovery, and structured 409 details. Assert `quantity: 0` remains 0; server response HTML maps to `SERVICE_UNAVAILABLE`; missing session sends no request; stale response after user change is discarded by consumers using a session generation ID.
- [ ] Run `flutter test test/core/shop_api_test.dart`; confirm failing tests.
- [ ] Implement GET `cart`, `quote`, `orders`; POST `cart`, `cart-handoff`, `checkout` at `/functions/v1/`. Use current JWTs, bounded request timeouts, and no unconditional retry of mutations. A connection failure is an uncertain result, not proof a write failed.
- [ ] Document JSON shapes, errors, and read/mutation retry distinctions. Treat only an explicit owner-scoped orders 404 as no matching order; network/401/503 cannot authorize a new request key.
- [ ] Run the task tests and analyzer; commit.

## Task 3: Catalog and product browsing

**Files:** Catalog feature files, `lib/app/theme.dart`, `test/features/catalog_repository_test.dart`, `catalog_widgets_test.dart`, bundled fallback illustrations under `assets/images/luma/` and their `pubspec.yaml` entries.

**Consumes:** Task 1 models/theme/config and the authenticated/public Supabase client.

**Produces:** `CatalogRepository.load({bool forceRefresh = false}) -> Future<List<Product>>`, `search({required List<Product> products, String query = '', String? category}) -> List<Product>`, `findBySlug(String slug) -> Future<Product?>`.

- [ ] Write failing cache/query/widget tests: case-insensitive name/description search, category slug filtering, active variants, stable IDs, exactly 120-second project-scoped TTL, malformed cached row rejection, missing slug state, Storage failure fallback, and retry after failed load. Assert no fake rating/customer claims in catalog widgets.
- [ ] Run `flutter test test/features/catalog_repository_test.dart test/features/catalog_widgets_test.dart` and confirm failure.
- [ ] Match the existing products query and Storage bucket mapping. Cache public records only. Implement collection/filter/product screens, variant and quantity selection, loading/error/empty states, accessible labels, and the same Luma brand/disclosure. Compare actual SVG rendering; export raster equivalents if shadow filters lose fidelity.
- [ ] Verify cache and widget tests, `flutter analyze`, and catalog on the device/emulator with real public records. Public reads may use the existing project; no fabricated fallback product records. Commit.

## Task 4: Google login and recoverable guest transfer

**Files:** Auth feature files; `lib/core/secure_store.dart`, `lib/app/router.dart`, `lib/app/providers.dart`, Android manifest; tests `test/features/auth_controller_test.dart`, `handoff_recovery_test.dart`, `auth_widgets_test.dart`.

**Consumes:** `ShopApi`, `HandoffToken`, injected `Future<void> Function() flushPendingCart`, and Supabase Auth. Task 5 will supply the real flush callback; use a fake barrier until then.

**Produces:** `AuthController.ensureGuestSession() -> Future<Session>`; `beginGoogle(ReturnDestination destination) -> Future<void>`; `handleAuthReturn(Uri uri) -> Future<void>`; `restorePendingAuth() -> Future<void>`; `reviewTransfer() -> Future<TransferReview>`; `reviseGuest(String variantId, int quantity, int expectedRevision) -> Future<void>`; `retryTransfer() -> Future<void>`; `signOut() -> Future<void>`. Define `ReturnDestination` enum `{catalog,cart,checkout,account,receipt}`, with optional receipt ID stored separately; `TransferReview` contains `Cart guest, account`. Secure store interface: `read(String key)`, `write(String key,String value)`, `delete(String key)`; future results are `String?`, `void`, `void`.

- [ ] Write failing tests for existing account without guest bag, successful filled guest transfer, canceled OAuth, code-exchange failure, expired 15-minute handoff, source revision conflict, merged quantity 11, duplicate callback, and restart before/after account exchange. Assert both bags survive conflicts and token/session state is cleared only after successful transfer or successful guest restoration.
- [ ] Run the auth/recovery/widget tests and confirm failure.
- [ ] Implement external-browser Google OAuth with PKCE and callback `xyz.ayodeji.luma://auth/callback`. Add exact Android intent filter and Supabase redirect allowlist entry during the configuration stage, preserving all web callbacks and canonical site URL. Reuse the existing Google-to-Supabase HTTPS callback. Avoid duplicate SDK/router code exchange.
- [ ] Implement encrypted Supabase session storage and pending recovery. Validate PKCE verifier persistence against the pinned SDK. Store guest session, handoff expiry/token, and safe return destination before leaving the app. Preserve guest recovery even when a transfer token expires. Handle browser return without a successful callback as a recoverable sign-in state.
- [ ] Expose `int get sessionGeneration` on `AuthController`, incrementing on account identity changes and sign-out. Consumers capture it before private requests and compare before applying results; token refresh for the same user must not erase pending recovery. Use server identity checks before private reads; local session selects UI only. Mobile sign-out uses local scope, clears private UI/recovery and sync, and does not delete the account. Test expired/revoked sessions and late old-user responses.
- [ ] Run tests/analyzer and a deliberate Google login on the device. Confirm the existing web Google account resolves to the same Supabase user ID; keep tokens out of logs. Commit.

## Task 5: Cart state, serialized saves, and reviewable conflicts

**Files:** Cart feature files; providers; tests `test/features/cart_controller_test.dart`, `cart_widgets_test.dart`.

**Consumes:** `ShopApi`, `AuthController.ensureGuestSession`, and `Cart` models.

**Produces:** `CartController.refresh() -> Future<void>`; `add(String variantId,{int quantity = 1}) -> Future<void>`; `setQuantity(String variantId,int quantity) -> Future<void>`; `flushPending() -> Future<void>`; `Stream<CartState> get changes`; `CartState` exposes `Cart cart`, `int pendingQuantity`, `bool saving`, `ShopError? error`, `int get badgeQuantity`. Register as a Riverpod-owned controller/stream with disposal. Bind Task 4 flush callback to `flushPending`.

- [ ] Write failing tests: two rapid adds serialize revisions; badge immediately includes queued units; failure removes pending badge quantity; committed add with lost response refetches without replay; stale revision yields conflict/review; limits 10/20; zero removes; unavailable variants remain reviewable; logout/account switch drops old results. Widget tests assert useful bag layout before private load, keyboard/large text, and pending-save navigation waits.
- [ ] Run the task tests and confirm failure.
- [ ] Implement authoritative snapshot plus serialized mutations and pending badge. On uncertain failure or conflict, fetch latest server state, surface review, and do not blindly resubmit. Ensure Realtime refresh can wait for the mutation queue without deadlock.
- [ ] Wire product/card adds, editable quantity/removal, navigation barrier, sign-in barrier, and checkout barrier. Production cart/quote/order values remain in memory only.
- [ ] Run task tests/analyzer and deliberate two-client cart editing with a designated account. Commit.

## Task 6: Demo checkout, exact-request recovery, orders and receipts

**Files:** Checkout and orders feature files; tests `test/features/checkout_recovery_test.dart`, `checkout_widgets_test.dart`, `orders_widgets_test.dart`.

**Consumes:** `ShopApi`, `CartController.flushPending`, secure store, confirmed Google identity, and models.

**Produces:** `CheckoutController.loadQuote() -> Future<void>`; `submit(Delivery delivery,{required bool demoConsent}) -> Future<DemoOrder>`; `recoverPending() -> Future<DemoOrder?>`; `invalidateQuote() -> void`. `PendingCheckout` contains account ID, stable UUID key, exact serialized `CheckoutRequest`, creation time, and unresolved status. `CheckoutState` contains quote/draft/review/loading/error state. Orders screens consume existing API methods, not new server endpoints.

- [ ] Write failing tests: consent false sends nothing; actual totals use server quote (delivery 250000); double-tap sends one pending operation; lost success response plus restart queries the saved key and resolves one order; orders lookup network failure retains unresolved state; same-key retry preserves identical body; different-user pending state cannot submit; unavailable item and changed quote require review.
- [ ] Add focus/draft widget tests: remote cart change preserves recipient/city/address text and focus, disables submit until a new quote is reviewed, and never places an order automatically. Enforce web UI lengths: name/city 2–100, address 5–300; trim before persistence. The server remains final validator.
- [ ] Run task tests and confirm failure.
- [ ] Implement quote/checkout screens with exact demo notice, consent gate and fictional details. Persist the request before sending. Recover by request key before retry; uncertainty retains the key. A definitive quote/cart rejection requires explicit resolution and review before creating a fresh attempt; never reuse a key with modified details.
- [ ] Implement account/history and private receipt routes; historical order lines do not require `active`. Preserve the server's latest-100-orders behavior without implying pagination. Unknown order/foreign owner produces a private not-found state. Refresh receipt email status through the orders endpoint while visible with bounded backoff; never equate provider acceptance with inbox delivery. Keep existing email receipt links pointing to the web private receipt in v1.
- [ ] Run tests/analyzer and configured mocked device flows. A real demo order/email is a separate deliberate integration check, not a normal test side effect. Commit.

## Task 7: Owner-scoped Realtime backend setup and Flutter lifecycle sync

**Files:** CLI-generated `supabase/migrations/<timestamp>_luma_realtime.sql`, `supabase/tests/shop-realtime.sql`, `lib/core/shop_sync.dart`; tests `test/core/shop_sync_test.dart`; update operations docs.

**Consumes:** SDK Auth state, `CartController.flushPending/refresh`, `CheckoutController.invalidateQuote`, and existing orders reads.

**Produces:** `ShopSync.start(String userId) -> Future<void>`, `stop() -> Future<void>`, `resume() -> Future<void>`, `Stream<ShopInvalidation> get changes`; enum `ShopInvalidation {cart,orders,reconnected}`. It owns channels/timers and session generation, not business mutations.

- [ ] Write failing sync tests with a fake event source: subscribe then snapshot; burst of 20 events coalesces to one refresh after 250 ms; pending writes finish before refresh; lost connection/resume forces fresh snapshot; old-user late event ignored; disposal cancels callbacks/timers; remote cart edit invalidates quote without wiping draft.
- [ ] Run `flutter test test/core/shop_sync_test.dart` and confirm failure.
- [ ] Inspect live/staging publication and owner policies read-only. Generate migration with `supabase migration new luma_realtime` after discovering CLI help. Add only missing `public.carts` and `public.orders` publication entries, making the change idempotent. No policy weakening, no private schema publication, no table recreation.
- [ ] Add rollback SQL assertions proving owner select and outsider denial for cart/order records, and publication membership. Test in an isolated database. SQL row access alone does not prove Realtime websocket authorization; Task 9 provides that evidence.
- [ ] Implement owner filters plus RLS-protected subscriptions for cart INSERT/UPDATE and order INSERT. Treat payloads as invalidation only; do not log whole rows (orders include private fields). Await subscribe confirmation, then snapshot. Use 250 ms coalescing, bounded reconnection backoff, app-resume refresh, and manual refresh fallback; keep server rate limits in view.
- [ ] In account/checkout screens, refresh visible data through existing functions. Tear down channels before user changes and discard in-flight prior generation results. Guests may observe only their local anonymous user's cart; they do not receive account order subscriptions.
- [ ] Run tests/analyzer and isolated SQL fixtures. Apply the additive publication to the shared Luma project only after the change is reviewed and explicitly authorized for deployment. Commit source/migration/docs; no function deployment is needed solely for publication setup. [Realtime setup and RLS guidance](https://supabase.com/docs/guides/realtime/postgres-changes).

## Task 8: Automatic refresh in the existing website

**Files:** Create `src/shop/sync.js`, `src/shop/refresh-coordinator.js`, `tests/unit/shop-sync.test.js`, `tests/shop-sync.spec.js`; modify `src/shop/pages.js`, and `tests/helpers/shop-fixture.js` only to extend fixtures. Keep current `initShopPage(root, embedded = false)` and direct routes.

**Consumes:** Existing Supabase client, API methods and page-local add queue; Task 7 publication.

**Produces:** `watchShopChanges({client,userId,onInvalidate,onSubscribed,onError}) -> () => void` in `sync.js`; `createRefreshCoordinator({refresh,waitForWrites,delayMs=250}) -> {invalidate(),flush(),dispose()}` in `refresh-coordinator.js`. `onInvalidate` receives `{kind:'cart'|'orders'}`. Callbacks are ignored after stop/user change.

- [ ] Write failing unit tests for fake channel events, exact table/event/filter registration, coalescing, queue ordering, cleanup, and identity generation. Add browser cases for badge/bag update, account new order, focus/resume catch-up, subscription failure fallback, and checkout form text/focus preservation.
- [ ] Exercise the production subscription path using a mocked Supabase websocket/transport in tests, not a test-only production event hook. Extend the existing fixture with controllable remote state and events. Run `npm run test:shop:unit` and `npm test` for unit and browser verification, confirming the new cases fail before implementation and pass afterward.
- [ ] Confirm new assertions fail before implementing. Then integrate subscription/lifecycle refresh in `initShopPage`. Wait for pending writes; snapshot after SUBSCRIBED; refresh cart badge/data and visible order list. For checkout, mark quote stale, preserve fields/focus and require review rather than rerendering the form destructively. Avoid full-page rerenders on every event.
- [ ] Register visibility/focus/page lifecycle cleanup without duplicated channels after bfcache restore. Preserve initial layout and catalog caching; receipt status still comes from bounded orders refresh rather than private outbox subscription.
- [ ] Run `npm run test:shop:unit`, `npm run test:shop:functions`, and `npm test`. Full browser runner restores the normal production build and tracked `dist/`; confirm it does. Never modify assertions to conceal baseline failures. Commit web source/tests/generated output together.

## Task 9: Cross-client integration, privacy, and device QA

**Files:** Create `mobile/luma_shop/integration_test/{shop_flow_test.dart,recovery_test.dart}`, `supabase/functions/tests/realtime.integration.test.ts`, and a reproducible manual acceptance matrix in `docs/luma-mobile-development.md`.

**Consumes:** All app/web flows, isolated database/service configuration and designated test identities. `realtime.integration.test.ts` is a new opt-in websocket test, separate from the existing transaction suite.

- [ ] Add deterministic injected-transport device tests for guest browsing/bag, callback cancel/conflict recovery, app restart during unresolved checkout, offline/error screens, text scaling, Android Back, and receipt privacy. Keep test dependency overrides outside production binaries.
- [ ] Add an opt-in real Realtime test requiring isolated backend configuration: owner subscribes to own cart/order, outsider deliberately requests owner filters and receives no owner payloads, owner writes produce one invalidation/refetch, reconnect sees fresh state. Disable email scheduling for isolated order fixtures; clean only those fixtures.
- [ ] Run device integration tests with `flutter test integration_test -d <android-device-id>` using test configuration and production-style controllers. Report skipped live-provider/transaction tests explicitly if their isolated credentials are unavailable.
- [ ] Run the existing isolated transaction suite to cover concurrent cart revisions, handoff replay, quote changes, same-key checkout and order/outbox atomicity. Use documented opt-in settings; do not run destructive tests against the shared demo project.
- [ ] Perform a deliberate real Google login/cross-client acceptance check after shared deployment approval: same account ID; web add appears on phone; phone edit appears on web; one demo order visible on both; guest bags isolated; remote updates don't destroy checkout drafts. Record actual observations, not just test counts. A live order may send email; use a designated account and explicit authorization for that check.
- [ ] Profile a release/profile build on the actual phone. Verify immediate shell, image fidelity, smooth scrolling, keyboard/small-screen layout, TalkBack labels, large text, reduced animation, and no private data after account switching. Commit tests/docs.

## Task 10: Installable APK and maintained workflow

**Files:** Android release signing configuration (public template only), `.gitignore`, `docs/luma-mobile-development.md`, `docs/luma-operations.md`, `AGENTS.md`; optional local verification script `scripts/test-mobile.sh`.

**Consumes:** Reviewed implementation, passing task checks and Android device. Outputs a locally installable signed APK and reproducible setup/run/build instructions; no store publishing.

- [ ] Configure a stable local release signing key outside version control, ignore key/password files, and keep the same application ID across builds. Public build configuration is compiled in; no server secrets or recovery fixture data may be bundled.
- [ ] Run `flutter analyze`, `flutter test`, and device integration checks appropriate to final changes. Run relevant web/server suites after sync changes; do not re-enable CI. Build with `flutter build apk --release --dart-define-from-file=config/luma.local.json`.
- [ ] Install the generated APK on the phone, verify configured networking/login, then test an upgrade using the same key/application ID and confirm session persistence. Keep APK output outside tracked web `dist/`; provide the verified artifact path.
- [ ] Check compiled configuration and Git changes for accidental private credentials; use checks that do not print secret values. Document versions, SDK discovery, NDK/JDK decisions, callback allowlist, deployment/read-back steps, and limitations.
- [ ] Update `AGENTS.md` with actual mobile architecture, commands and verification boundaries. Link the research/implementation documents from mobile development docs. Commit the final focused changes. End with evidence and outstanding provider/device limitations, not a claim based only on mocks.

## Deployment, rollback and completion

Local execution does not imply external deployment approval. Make the migration and any web changes concrete and reviewable first. Present their diff/test evidence before requesting authorization to apply the shared publication or publish the updated website. Adding one mobile OAuth callback must preserve current web callbacks; verify existing web login afterward. Receipt/email-worker source is unchanged by this plan and does not need redeployment.

Rollback web sync by restoring the prior web build; rollback mobile by installing a prior APK with matching signing identity. Remove only publication entries added by this change if approved; retain catalog, accounts, carts, orders and email history. No deletion migrations belong in rollback.

Completion requires an actual Android APK install/run, verified shared Google identity, bidirectional cart/order visibility, reconnect recovery, private-data isolation, and explicit evidence for any live-provider checks. Flutter doctor, mocked tests, and an isolated database test each verify different layers; none alone establishes all of these outcomes.

## Review and execution handoff

Review this plan together with the research document before implementation. Recommended execution: native, task by task, because the app shares closely coupled auth/cart/recovery interfaces and the existing backend. If the user prefers independent implementer/reviewer agents per task, use subagent-driven execution instead; no delegation is assumed.

## Google Cloud, Supabase and phone configuration checklist

The implemented flow opens Google in the external browser through Supabase `signInWithOAuth` with PKCE. Google returns to Supabase over HTTPS; Supabase then returns to Android. For this implementation, reuse the existing **Web application** OAuth client. A new Android Google client, SHA registration in Google Cloud, Firebase project or `google-services.json` is unnecessary. Native `google_sign_in`/ID-token authentication would require different configuration and code. This follows the [Supabase Flutter SDK browser OAuth flow](https://github.com/supabase/supabase-flutter/blob/main/packages/supabase_flutter/README.md).

### 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/), select the project that already owns Luma's web Google login, then open **Google Auth Platform → Clients** (older UI: APIs & Services → Credentials).
2. Open the existing **Web application** OAuth client. Under **Authorized redirect URIs**, verify/add exactly:
   `https://xiunfinvgxoquxiqnnyj.supabase.co/auth/v1/callback`
   Save. Preserve existing working entries. This is Google's callback; the Android custom scheme belongs in Supabase's allowlist instead.
3. Preserve the website's existing **Authorized JavaScript origins**. Origins contain scheme/host/port, no `/projects/shop/` path. The Android browser OAuth flow adds no new JavaScript origin.
4. In **Google Auth Platform → Audience**, check the current publishing status. If External/Testing, add each Google account used on the phone and web under **Test users → Add users**, then Save. Keep existing audience choices.
5. Under **Data Access**, confirm basic `openid`, email and profile scopes. Under **Branding**, retain/configure Luma's name, support email and developer contact. No additional Google API permissions are needed for shopping.
6. Compare this client's ID with **Supabase → Authentication → Sign In / Providers → Google**. Enable Google if needed; its client ID and secret must refer to this same web client. Enter any secret directly in Supabase, never in the APK or repository.

These console instructions follow [Supabase's Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google) and [Google's OAuth redirect configuration](https://developers.google.com/identity/protocols/oauth2/web-server). Existing live settings were not inspected through an administrator account in this implementation run.

### 2. Supabase Auth and backend

Open the existing project **xiunfinvgxoquxiqnnyj**, not a new database.

1. **Authentication → URL Configuration → Redirect URLs → Add URL**: enter exactly `xyz.ayodeji.luma://auth/callback`, then Save. Preserve web callbacks and the canonical Site URL. Do not change Site URL to the phone scheme. [Supabase redirect allowlist](https://supabase.com/docs/guides/auth/redirect-urls).
2. Confirm anonymous sign-ins remain enabled for guest bags. If CAPTCHA is required, the mobile sign-up flow must acquire and supply a valid challenge token before guest testing; this app currently has no CAPTCHA challenge UI. Do not disable an existing protection silently.
3. After migration review/authorization, apply only `supabase/migrations/20261002141817_luma_realtime.sql` in the correct project's SQL Editor, preserving migration history through your deployment workflow. It idempotently adds `public.carts` and `public.orders` to `supabase_realtime`. Alternatively inspect **Database → Publications → supabase_realtime** for those memberships. Never apply the pending guest-deletion migration. Verify membership and retain owner RLS. [Realtime publication setup](https://supabase.com/docs/guides/realtime/postgres-changes).
4. Confirm existing `cart`, `cart-handoff`, `quote`, `checkout`, `orders` and `email-worker` deployments and server secrets using `docs/luma-operations.md`. No new Edge Function is required. Native Dart requests have no browser Origin header; current handler permits them while still validating bearer identity. Preserve `LUMA_ALLOWED_ORIGINS` for web; do not add the Android scheme as a CORS origin.
5. Verify public catalog/Storage and the existing Mailgun worker/cron/Vault configuration. Keep all provider/database/scheduler secrets server-side. No new mail service or mobile credentials are required.
6. After review/authorization, deploy the web source/build from this branch so both active clients include sync. Until deployment, the live website retains its previous behavior.

### 3. Android and end-to-end acceptance

1. The app already contains INTERNET permission, package `xyz.ayodeji.luma_shop`, exact scheme/host/path intent filter and the disabled competing Flutter deep-link handler. [Flutter deep-link flag](https://docs.flutter.dev/release/breaking-changes/deep-links-flag-change).
2. Enable Developer options and USB debugging on the phone, connect it, accept this Mac's RSA prompt, then check `adb devices`. Install the signed release with `adb install -r mobile/luma_shop/build/app/outputs/flutter-apk/app-release.apk` from repository root. Preserve the signing key for upgrades; API24+ is required.
3. Sign in using the same Google account on phone and web. Confirm the same Supabase user UUID without printing tokens. Check both empty-account login and filled guest transfer, cancellation, repeated callback and restart recovery.
4. Test web add → phone bag, phone edit → web bag, missed-event resume and checkout draft preservation. Then run isolated owner/outsider checks. An authorized fictional checkout must create one order visible in both clients; email acceptance/inbox delivery are separate evidence.

This checklist is prepared for user/admin execution; no Google settings, live migration, web deployment or email-producing checkout was changed automatically.
