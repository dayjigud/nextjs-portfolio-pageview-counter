# Luma operations

## Resource inventory and current limits

Selected isolated Supabase project: `xiunfinvgxoquxiqnnyj` (Luma, Main connection, eu-west-1). The additive schema/catalog can be deployed independently from credentials and OAuth. Application success must never be claimed until the live integrations pass.

Verified Mailgun sending configuration: `MAILGUN_DOMAIN=ayodeji.xyz`, `MAILGUN_REGION=US`, sender `Luma Demo <orders@ayodeji.xyz>`. These are Supabase Edge Function secrets; the API key is configured outside this repository. SPF was verified, DKIM active, and the first live confirmation was accepted and delivered on 30 September 2026.

On 1 October 2026, `email-worker` version 11 was deployed with the Luma-branded responsive HTML receipt and a plain-text alternative. Deployment read-back confirmed `ACTIVE`, unchanged `verify_jwt=false`, and source matching the tested local template and existing shared handlers. An unauthenticated POST returned HTTP 401 with `AUTH_REQUIRED`, confirming the scheduler credential remains mandatory. Desktop/mobile previews and receipt tests passed; this deployment check did not send a test email or verify rendering in a recipient's inbox.

Runtime: official Supabase CLI 2.117.0; pinned Deno 2.7.4 via `npx --yes deno@2.7.4`; PostgreSQL driver `npm:postgres@3.4.7`. No Docker runtime is available locally. Server domain tests are real Deno tests; SQL access/constraint fixtures can run in the dedicated Luma project and roll back their identities. Concurrent request/rollback tests still require the configured server database credential; deterministic browser mocks do not prove these.

## Server secrets (Supabase dashboard → Edge Functions → Secrets)

Never paste secret values in chat or put them in Vite variables.

- `LUMA_DATABASE_URL`: transaction-pooler connection URI for the dedicated `luma_server` LOGIN role, with its password URL encoded, SSL enabled. Migration initially creates NOLOGIN; operator sets a unique generated password through SQL/provider administration. Use pooler user `luma_server.PROJECT_REF` as shown by the dashboard; verify role connection and grants. Do not substitute `postgres` or browser keys.
- `LUMA_ALLOWED_ORIGINS`: comma-separated exact site origins (including development only when needed).
- `LUMA_SITE_URL`: canonical HTTPS site URL used in receipt links.
- `LUMA_SCHEDULER_SECRET`: cryptographically random scheduler-only bearer secret (at least 32 random bytes), also stored in Vault for cron.
- `MAILGUN_API_KEY`: server API key allowed to send messages on the chosen domain.
- `MAILGUN_DOMAIN`: verified sender domain; sandbox domains require recipient authorization.
- `MAILGUN_FROM`: valid sender, e.g. `Luma Demo <orders@YOUR_DOMAIN>`.
- `MAILGUN_REGION`: `EU` for EU API; `US` otherwise. Must match account/domain region.
- Supabase runtime normally injects `SUPABASE_URL` and legacy `SUPABASE_ANON_KEY`; if using a publishable key explicitly, set `SUPABASE_PUBLISHABLE_KEY`. Service-role keys are not used in browser code or normal transactions.

## Google and Mailgun setup

Google Cloud Console / Google Auth Platform: create a web OAuth client in the chosen Google project, configure app branding/audience, basic OpenID/email/profile scopes, authorized JavaScript origins, and `https://xiunfinvgxoquxiqnnyj.supabase.co/auth/v1/callback` as the authorized redirect URI. Put the client ID and client secret in Supabase Auth → Providers → Google, not chat. Supabase Auth URL Configuration separately allowlists the app's `/projects/shop/auth/callback/` URLs. Enable anonymous sign-ins and appropriate abuse/CAPTCHA controls. Check testing-mode audience restrictions before public use.

Mailgun: choose domain/region, verify required DNS (SPF/DKIM and provider-required records), verify sender, and authorize any sandbox recipient. Confirm account restrictions before allowing arbitrary authenticated recipients. The saved authenticated email is the only recipient; no request supplies an email address.

## Deployment and storage

Deploy `cart`, `cart-handoff`, `quote`, `checkout`, and `orders` with `verify_jwt=false` and mandatory handler Auth `/user` validation. Deploy `email-worker` and `guest-cleanup` with gateway JWT verification disabled **only because the handlers validate the dedicated scheduler bearer secret**. All browser endpoints call Auth's `/user` endpoint to validate current identities. Orders/quote/checkout require a confirmed Google identity, not merely the authenticated database role.

Catalog illustrations are maintained in `public/images/luma/`. Upload each file into public Storage bucket `luma-catalog` using the filename stored in `product_images.storage_path`. Bucket public reads are intentional for catalog only. No customer uploads or personal data belong there. Catalog migrations preserve product and variant IDs so saved carts and historical orders remain valid.

## Email scheduler

The illustration files are also bundled in `public/images/luma/` and used if their Storage URLs are unavailable. Add new filenames to the allowlist in `src/shop/pages.js` when extending the catalog. Catalog records originate in Supabase; recent public catalog rows are cached in this browser tab for two minutes to speed navigation. Cart, quote, order, and customer data are not cached by this catalog layer. Server responses remain authoritative for prices and availability. There is no fabricated product/order fallback.

Anonymous CAPTCHA is not active in this build. Before enabling CAPTCHA in the Supabase dashboard, add its client challenge/token flow and verify failure preserves the pending cart action. Do not expose a CAPTCHA site-key setting that the client ignores.

After sender and server credential verification, enable `pg_cron`, `pg_net`, and Vault in the selected project. Store the scheduler secret in Vault under `luma_scheduler_secret`. Schedule an HTTP POST to `/functions/v1/email-worker` every minute, using the Vault value in `Authorization: Bearer …` and `{}` JSON. Set a bounded HTTP timeout and review cron/net error logs. The worker itself processes up to 20 leased jobs, recovers five-minute expired leases, and stops after the initial send plus retries after 1, 5, and 30 minutes. Mailgun acceptance is not inbox delivery. A crash after Mailgun acceptance may produce duplicate confirmation mail; order creation remains idempotent.

`20260930171122_luma_email_schedule.sql` installs the named `luma-confirmation-email-worker` job for the dedicated Luma project. It uses a 120-second HTTP timeout and reads the bearer credential from Vault at execution time; no secret appears in the migration or cron command. Calling `cron.schedule` with the existing job name updates that job. The job issues no HTTP request until Vault contains `luma_scheduler_secret` with at least 64 characters. Use the same unique random 64-character alphanumeric value in Vault and the Edge Function secret `LUMA_SCHEDULER_SECRET`; missing or mismatched values prevent processing.

On 30 September 2026, the first live confirmation remained `pending` with `attempts=0` because neither the cron schedule nor its credential was provisioned. After installing the schedule and the operator saving matching credentials, the scheduled worker returned HTTP 200 with `processed=1, accepted=1`; the outbox recorded acceptance on its first attempt. Mailgun reported delivery to Gmail at 18:15:03 Africa/Lagos with a successful SMTP response. The following scheduled call also returned HTTP 200 with no remaining work. To diagnose future issues, inspect `luma_private.email_jobs` (status, attempts, last_error, message_id), `cron.job_run_details`, and `net._http_response` status codes. A successful cron SQL run alone does not prove the asynchronous HTTP request or Mailgun send succeeded. Preserve the queued order and retry it through the worker rather than creating duplicate orders.

**Guest deletion is not deployed without separate approval.** Automatic approval review rejected the initial migration because it included a security-definer function deleting anonymous Auth users. The safer additive schema excludes that function. `supabase/pending-migrations/20260930120911_luma_guest_maintenance.sql` is kept separately for explicit review/approval; it is intentionally outside normal migrations so ordinary schema pushes cannot deploy it. `guest-cleanup` must not be scheduled until this approval and verification. Its private function limits deletion to anonymous users whose carts are inactive over 30 days, excludes active handoffs, uses row locks, and is executable only by the server role. Expired JWTs/current user validation and Auth cascading deletion protect removed identities. Enable the daily cleanup only after isolated fixtures prove permanent/recent/active-transfer accounts survive.

## Verification and rollback

Run `npx --yes deno@2.7.4 test --allow-env --config supabase/functions/deno.json supabase/functions/tests/` and `npx --yes deno@2.7.4 check --config supabase/functions/deno.json supabase/functions/cart/index.ts`. `supabase/tests/shop-access.sql` and `shop-transactions.sql` use explicit rollback fixtures and assertions. They are SQL assertions, not pgTAP suites; run with an isolated database SQL runner, not a production test command. Verify real guest reload, two-tab revision conflicts, existing-account merge replay, changed-price review, concurrent same-key checkout, rate limits, and order/outbox rollback using the configured deployment before declaring ready.

Stop scheduler jobs before rollback. Restore prior frontend deployment; retain additive records/schema and never drop customer orders as a convenience. Preserve pending/accepted email history to avoid uncontrolled retries. Browser configuration contains only project URL and publishable key. Rotate leaked secrets through provider settings and rebuild any public bundle that contained them.

Gateway verification follows [current Supabase migration guidance](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys) and [401 troubleshooting](https://supabase.com/docs/guides/troubleshooting/edge-function-401-error-response): the legacy gateway may reject asymmetric session JWTs/new keys. `verify_jwt=false` delegates mandatory authentication to the handler; missing/invalid sessions return 401 before any database access. Publishable key objects injected in `SUPABASE_PUBLISHABLE_KEYS` are supported alongside explicit key and legacy fallback.

The opt-in `transactions.integration.test.ts` executes real service functions, including concurrent cart changes and same-key orders, transfer replay, price changes, and rate accounting after failure. It is **skipped** without `LUMA_TEST_ISOLATED=true`, `LUMA_TEST_DATABASE_URL` (server-role URL) and `LUMA_TEST_ADMIN_DATABASE_URL` (fixture admin URL). Enable network permission for this dedicated run. Use only a disposable isolated schema/project with email scheduling disabled; it inserts random fixture identities and removes only its own fixtures afterward. Passing ordinary domain tests does not validate concurrent SQL transactions.


## Android callback and shared sync

The Android client lives in `mobile/luma_shop` and shares this project. Add `xyz.ayodeji.luma://auth/callback` to the Auth redirect allowlist only at the reviewed configuration stage; preserve all web callbacks and site URL. Review/apply only `20261002141817_luma_realtime.sql` for carts/orders publication. Existing owner RLS remains mandatory; never publish private outbox data. No Edge Function deployment is needed for publication alone. Mobile setup and tests are in `docs/luma-mobile-development.md`; enabling the callback/publication and publishing the updated web build remain separate reviewed external changes.
