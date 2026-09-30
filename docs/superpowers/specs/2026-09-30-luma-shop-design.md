# Luma shop design specification

Date: 2026-09-30, Africa/Lagos
Status: visual direction approved; functional specification awaiting review. Implementation has not started.

## Intent and agreed decisions

Build a portfolio demonstration of an end-to-end tech gadget shop. Luma appears as project 02 after Donewell on `/projects/`. Visitors can browse products, sign in through Google, maintain a saved cart, place a simulated order, receive a real Mailgun confirmation, and review their own order history. Supabase is the source of truth for shop business data.

The user selected tech gadgets and accessories, a portfolio demo, and simulated checkout without card details. They approved Prism Playground integrated into the existing projects page. The approved design is [Superdesign draft v2](https://p.superdesign.dev/draft/915202d9-2dce-46dc-9f3d-83a65613918d), on the [project canvas](https://superdesign.dev/teams/bcf6ae71-b64e-4f7b-bb97-9698d780cde5/projects/100fe9e1-396a-4f42-b6a0-799396d90f4e).

The following functional defaults are proposed for review: NGN pricing, Google sign-in required before persistent cart changes, a fixed fictional delivery fee of NGN 2,500, no separate tax calculation, fictional delivery details, and no admin interface. These are scope decisions, not claims that the user separately selected them.

Success means the complete browsing-to-receipt flow works across reloads and devices, another customer cannot access a user's data, and the portfolio and Donewell retain their existing behavior and appearance.

## Scope and exclusions

Include an embedded shop panel, full catalog, product details, cart, checkout, confirmation, Google sign-in, account/order history, database persistence, transactional email, responsive layouts, accessibility, and service failure states.

Exclude live payments, payment gateways, card collection, actual fulfillment, coupons, reviews, wishlist, inventory reservations, password login, admin dashboard, and marketing email. Products have an availability flag but no finite-stock accounting in this demo. Catalog management uses seed data and the Supabase dashboard.

“Persist everything” applies to shop records: products, catalog relationships, profiles, cart items, orders, order snapshots, and email jobs. Temporary UI state such as an open drawer, search text, hover state, or unsaved form typing need not be stored. Authentication sessions may use the Supabase client's normal browser persistence. Donewell remains local-first and keeps `donewell-tasks-v1` and backup version 1.

## Visual design and integration

Keep the projects page's dark workshop header/intro/footer, cream project sections, orange accents, numbered metadata, thin rules, and oversized Archivo headings. Luma's outer section mirrors Donewell's editorial framing: `02 / Commerce`, `2026`, an eyebrow, `Luma.`, and a concise customer-facing description.

Inside the bounded shop panel, retain Prism's cyan, coral, violet, and blue light pools, glass navigation, rounded bento cards, and playful gadget illustrations. Use Archivo and Inter to connect it to the surrounding site. Scope gradients, blur, animations, and navigation to Luma. They must never become viewport-wide overlays or alter Donewell. A persistent shop navigation on standalone pages may use sticky positioning.

The approved canvas is a visual reference, not production-ready source. Do not copy its simplified Donewell controls, fake date/task examples, technical integration prose, hardcoded cart count, or “Live Demo Preview” claims into production. Preserve Donewell's actual markup and behavior. Rewrite global “no accounts” and offline claims to distinguish Donewell from the connected shop.

Use truthful copy: “Portfolio demo — no payment or shipment.” Forms use readable surfaces instead of excessive transparency. Provide visible focus, labeled icon buttons, keyboard-operable dialogs, reduced-motion behavior, contrast meeting WCAG AA, and a blur fallback. Design for 320px through desktop without horizontal overflow. Use accurate gadget imagery/illustrations; final asset selection occurs before implementation. Avoid invented ratings or social proof.

## Page and interaction map

| URL | Responsibility |
| --- | --- |
| `/projects/` | Existing workshop and Donewell, followed by a compact Luma catalog panel and Open full shop link |
| `/projects/shop/` | Full catalog with search, category filters, product cards, account entry, and cart access |
| `/projects/shop/product/?slug=...` | Product image, description, specifications, available variant selector, price, add-to-cart |
| `/projects/shop/cart/` | Saved cart, quantity controls, removal, subtotal, and proceed-to-checkout |
| `/projects/shop/checkout/` | Demo delivery form, authoritative quote, order review, and Place demo order |
| `/projects/shop/confirmation/?order=...` | Owner-only persisted receipt, demo disclaimer, and email status |
| `/projects/shop/account/` | Google profile summary, sign out, own order history, and links to receipts |
| `/projects/shop/auth/callback/` | OAuth code exchange and return to the requested shop action |

These are Vite HTML entries, not a client-side router. Query parameters select products and receipts, with validation and owner checks. Direct loads, refreshes, and deep links must work in production.

Browsing is public. On the first signed-out add-to-cart attempt, prompt Google sign-in, retain only the selected product/variant/quantity as a short-lived pending action, and execute it once after successful return. Cancellation preserves browsing context. No anonymous persistent cart is included in v1.

The embedded panel and full shop use the same catalog/cart modules and database records. Successful signed-in mutations are persisted before reporting success. A catalog change or unavailable item produces an actionable message and requires a fresh quote. Product cards and details share consistent names and pricing.

## Customer checkout flow

1. Browse, search, filter, and select a product. Sign in if needed, then add a valid variant to the saved cart.
2. Adjust quantities (1–10 per variant; maximum 20 distinct cart lines), remove items, and open checkout.
3. Pre-fill display name when available. Collect a demo recipient name, city, and fictional address; show a clear instruction to use fictional delivery details. Receipt email is the authenticated account's email and is not editable.
4. Request a server-calculated quote. Show item prices, subtotal, fixed demo delivery fee, and total, all in NGN. No tax or charge is represented as real.
5. Submit with a persisted idempotency key and cart revision. Disable repeat submission while awaiting the response, while retaining a retry path after a network failure.
6. Server creates the order, immutable order items, and email job atomically, and clears only the checked-out cart revision. A stale/concurrently changed cart is rejected for review rather than silently cleared.
7. Render the persisted receipt. Clearly state no payment was collected and no shipment will occur. Email status is separate from order status.

Empty carts cannot proceed. Expired sessions trigger sign-in with return context. A network timeout after submission is resolved using the same idempotency key: it must not create another order. If the latest price differs from the reviewed quote, return a price-change response and require explicit review before placing the order.

## Application architecture

Retain Vite, semantic HTML, vanilla JavaScript modules, Tailwind, and shared `src/index.css`. Keep Luma selectors scoped under its own root/classes. No React migration or unrelated refactor is required.

Proposed browser modules divide responsibilities into Supabase client/config, auth, catalog, cart, checkout, order history, rendering/escaping, and page initialization. `src/projects.js` remains Donewell-specific. Add separate shop initialization to the projects entry without coupling either app's state.

Supabase supplies Auth, Postgres, and Storage. Public browser configuration is limited to the project URL and publishable key. Mailgun credentials, privileged database credentials, and Google OAuth client secrets never enter frontend bundles, repository artifacts, or browser-visible error messages.

Use authenticated Supabase Edge Functions for quotes and checkout. The handler validates the user with Supabase Auth and applies ownership checks even when a privileged database connection is needed. The quote is server-derived; the final transaction independently validates it. Use a dedicated least-privileged server database role and a parameterized Postgres transaction for order creation, with browser roles denied order writes. Do not expose a privileged SQL RPC to browser roles.

Use separate development/test and public-demo environments. Selecting the existing Supabase account/project, deployment domain, Google Cloud project, and Mailgun sender is an implementation prerequisite; do not assume a project or modify unrelated resources.

## Database design and access

| Record | Main fields and constraints | Customer access |
| --- | --- | --- |
| `categories` | id, unique slug, label, sort order | Public read |
| `products` | id, unique slug, name, description, category id, specifications, active flag | Public read of active products |
| `product_variants` | id, product id, label, integer price in kobo, currency NGN, active flag | Public read of active variants of active products |
| `product_images` | id, product id, Storage object path, alt text, sort order | Public read of active-product imagery |
| `profiles` | user id referencing Auth, display name, timestamps | Own row; editable display name only |
| `carts` | id, unique user id, monotonically increasing revision, timestamps | Own cart read; mutations through authenticated server endpoint |
| `cart_items` | cart id, variant id, quantity; unique cart/variant | Own cart items read; mutations through endpoint |
| `orders` | UUID, display reference, user id, demo flag, confirmed status, NGN totals, recipient email snapshot, demo delivery details, idempotency key, request fingerprint, created timestamp | Own orders read only |
| `order_items` | order id, product/variant ids, immutable name/variant/price/quantity snapshots | Read through owned parent order |
| private `email_jobs` | unique order/type, status, attempts, next attempt, lease expiry, Mailgun message id, last sanitized error | Server only |
| private `request_limits` | user id, window, action, counter | Server only |

All monetary values use integer kobo and checked arithmetic; UI formats naira consistently. Order totals and item snapshots cannot be overwritten by customers or affected by later catalog edits. Use foreign keys, non-negative prices, quantity bounds, indexes on ownership/filter fields, and a unique `(user_id, idempotency_key)` constraint.

Enable RLS on exposed tables and explicitly grant only necessary operations. Ownership policies include parent relationships, and update policies include `WITH CHECK`. Avoid authorization based on user-editable metadata. Public Storage reads are limited to catalog assets; uploads are server/operator-only. No personal data is stored in a public bucket.

## Server operations and concurrency

- Cart mutation endpoint: validate session, ownership, active variant, bounds, and expected cart revision; update items and revision within one transaction. Return a conflict on stale revision, then refetch.
- Quote endpoint: read the owned cart, calculate authoritative prices and fee, return its revision and normalized quote fingerprint. Reject empty/unavailable carts.
- Checkout endpoint: authenticate, enforce limits, lock cart, resolve idempotency key before rejecting an already-cleared cart, compare revision and quote, then insert order/items/email job and clear the cart in one transaction. Reusing a key with different request content returns a conflict. Use one lock order to avoid deadlocks.
- Email worker: claim a due job with a lease, send from trusted saved order content to its saved authenticated recipient, then record Mailgun acceptance. Scheduler calls are service-authenticated; they are not public mail-sending endpoints.

Proposed limits: 3 new demo orders per hour and 10 per day per user; count atomically on the server. Idempotent retries do not count as new orders. Rate-limit cart/quote requests separately. Return useful user-facing errors without exposing internals.

## Google sign-in configuration

Use Supabase's Google provider, configured through Google Cloud Console/Google Auth Platform: application branding, audience, basic profile/email/OpenID scopes, web OAuth client, authorized origins, and the Supabase callback URL. Configure the shop's callback URL in Supabase's redirect allowlist separately from Google's provider callback.

Use the browser PKCE flow and explicit code exchange on the shop callback page. Preserve only allowlisted relative return routes and validated pending cart actions. Handle denied consent, failed exchange, expired sessions, reload, sign-out, and a return on another device without a stored pending action.

Google testing-mode audience restrictions must be checked before declaring public sign-in ready. Account/profile display information is not authorization. Email recipients derive from the server-validated authenticated user; request payloads cannot select a different destination.

## Mailgun confirmations and retries

Use Mailgun's HTTP API from the worker with a verified sender domain. During restricted testing, a sandbox domain may be used only for its authorized recipients. A public demo with arbitrary Google users needs an appropriately configured sending domain/account.

The subject is `Luma demo order confirmed — {reference}`. Provide both HTML and plain text: demo disclosure, reference, products, quantities, demo totals, and an owner-authenticated receipt link. Escape all interpolated content. Omit fictional address details from email to minimize exposure. Disable marketing tracking by default.

An order is confirmed independently of email state. Use pending, processing, accepted, retrying, and failed job states; Mailgun API acceptance does not prove inbox delivery. Show “Confirmation email requested” rather than claiming delivered. No delivery webhook is required for v1.

After a failed attempt, retry after 1, 5, and 30 minutes, then mark failed and expose a sanitized status to the owner. A scheduled worker must actually run these retries; enqueueing alone is insufficient. Run the scheduler every minute and recover expired processing leases. No customer-triggered unlimited resend endpoint is included.

A unique job prevents ordinary duplicate sends, but a crash after Mailgun acceptance and before the database update can still result in duplicate email. Treat delivery as at-least-once and document this limit rather than promising exactly-once email. Orders themselves remain idempotent.

## Catalog and configuration defaults

Seed the demo catalog in Supabase rather than hardcoding the authoritative catalog into JavaScript:

| Product | Illustrative NGN price |
| --- | ---: |
| Luma A1 Wireless Headphones | 145,000 |
| Luma Buds Pro | 85,000 |
| SoundCylinder | 65,000 |
| MagStand 3-in-1 | 45,000 |
| MechKey Flow | 110,000 |
| Pro Hub USB-C | 35,000 |
| Luma Watch S1 | 185,000 |

Use one default variant per product initially. Categories are Audio, Desk, Power, and Wearables. Product details include enough fictional specifications to demonstrate the shopping experience, clearly within the demo context.

Required configuration: browser Supabase URL/publishable key; server database credential, Mailgun API key/domain/region/from address, canonical site URL; Google client id/secret in Supabase provider settings; scheduler authentication secret. Pin dependency versions and preserve lockfiles. An example configuration documents names without secrets.

Repository `vercel.json` currently includes a catch-all rewrite to `/index.html`. Verify platform filesystem precedence, then remove or narrow that rewrite as needed so every Vite HTML entry, nested shop route, asset, and OAuth callback resolves correctly. Configure Vite entries and Tailwind scanning accordingly. Update AGENTS.md when the implemented backend, environment variables, entry points, and commands actually change. Regenerate tracked `dist/` after implementation.

## Validation and completion criteria

1. Visual review of the embedded section, storefront, product details, cart, checkout, confirmation, and account on desktop and 320px/390px mobile. Extend Superdesign from the selected direction for checkout/account before implementing those screens; correct known canvas simplifications rather than importing them.
2. Full existing Playwright suite after shared CSS/page changes; focused new coverage for browsing, keyboard interaction, mobile layouts, form validation, and persistence. Preserve existing tests and report unrelated failures.
3. Database integration tests prove user A cannot read or mutate user B's records, public catalog writes fail, and browser roles cannot create orders or access private email jobs.
4. Checkout tests cover tampered prices/fees, unknown/inactive variants, invalid quantities, stale quote/cart revision, concurrent cart changes, double-clicks, retry after timeout, atomic rollback, and existing idempotency key with changed payload.
5. Email tests cover acceptance, failure/retry, lease recovery, unauthorized scheduler calls, altered recipient payload, and safe templating. Use mocked Mailgun in automated tests plus one approved controlled-recipient live test during integration.
6. Google integration is verified with a real authorized test user, callback configuration, denied consent, sign-out, reload, and return context. Automated browser tests may stub external login; report real integration separately.
7. Verify deep links on production preview and actual Vercel preview. Inspect built assets for accidental secrets. Run Supabase advisors and resolve findings relevant to the new schema before public release.
8. A returning signed-in customer sees the same saved cart and own persisted orders on a second browser/device. Offline shop states explain the need to reconnect; Donewell remains usable with its existing local data.

## Delivery stages and review boundary

After this specification is approved, write a detailed implementation plan with file changes, migration strategy, service setup, tests, and rollback steps. Then agree on execution before building.

Implementation stages: finish flow designs; add shop frontend structure; create isolated Supabase schema/seed/Storage/Auth; integrate cart and atomic checkout; integrate worker/Mailgun; verify Google and end-to-end behavior; regenerate production output and prepare a deployment preview. These are dependencies, not completed work.

Before service setup, resolve which Supabase account/project to use, which Google Cloud project/domain to register, and which Mailgun sending domain/region to configure. No credentials are requested in chat. Use provider configuration and server secret stores. Costs/account limits and DNS availability are checked against the actual selected services at that stage.

## Technical references

- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Edge Function authorization headers](https://supabase.com/docs/guides/functions/auth-headers)
- [Mailgun domain verification](https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-verify)
- [Mailgun sandbox restrictions](https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox)

Documentation checked on 2026-09-30. Recheck version-specific APIs before implementation. The reviewed recent Supabase database breaking-change entry concerns specialized extensions/operators not proposed in this schema.
