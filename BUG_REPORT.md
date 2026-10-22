# Bug Report — Sholkveda Storefront

_Audit date: 2026-10-22 · Scope: all of `src/`, `prisma/`, `scripts/`, config, dependencies._
_Method: full code read + `tsc`/`lint`/existing test suites (all pass) + production build (passes) + live probing of a locally running dev server (in-memory mode) + targeted pricing/inventory scripts. Items marked **✅ verified** were reproduced live, not just read from code._

> Note: several bugs differ between the two data modes (in-memory vs Postgres). Where a bug is mode-specific it says so.

---

## 🔴 Critical

### C1. Order-confirmation page exposes any customer's name, address & phone — no login needed ✅ verified
`src/app/order-confirmation/page.tsx:20-24` loads an order purely from the `?orderId=` / `?orderNumber=` query param and renders the full shipping address and phone number. There is **no authentication and no ownership check** (contrast with `src/app/orders/[orderNumber]/page.tsx`, which does check). Order numbers are sequential (`SV-2026-10001`, `SV-2026-10002`, …), so every customer's PII is enumerable by anyone.
_Repro: `curl http://localhost:3100/order-confirmation?orderNumber=SV-2026-10001` returned the test customer's full name, street address and mobile number, unauthenticated. Bonus bug: it even prints “Payment confirmed / Thank you, your order has been placed” for a **cancelled/unpaid** order, because it only checks that the order exists._

### C2. Admin dashboard leaks business + customer data to unauthenticated visitors ✅ verified
`src/app/admin/page.tsx:23-27` is a Server Component that queries analytics, recent orders and inventory **with no server-side auth check**. The only gate is the client-side `useAuth()` check in `src/app/admin/layout.tsx`. Next.js still executes the page on the server and serialises its output into the RSC/flight payload, so the data is in the HTML source before the client hides it.
_Repro: unauthenticated `curl http://localhost:3100/admin` returned 23 KB containing “Victim Customer”, `SV-2026-10001`, “Gross Revenue”, “Recent Customer Orders”._

### C3. Logout doesn't log you out (cookie name typo) ✅ verified
`src/app/api/auth/logout/route.ts:5` clears a cookie named `sholkveda_session_token`, but login/register set — and every reader checks — `shlokveda_session_token` (15 occurrences vs 1). The real HttpOnly session cookie is never cleared.
_Repro: register → `POST /api/auth/logout` → `GET /api/auth/me` still returns **200 with the full user**. On refresh the UI silently logs the user back in via `/api/auth/me`. On a shared computer the account (incl. admin) stays accessible after “Sign Out”._

---

## 🟠 High

### H1. Two admin API endpoints have no authentication at all ✅ verified
- `GET /api/admin/products/[id]` (`src/app/api/admin/products/[id]/route.ts:8`) — returns any product (incl. inactive/draft and variant `costPrice`) to anonymous callers. Returned **200** without a token.
- `GET /api/admin/cms/banners` (`src/app/api/admin/cms/banners/route.ts:9`) — lists all banners incl. inactive, anonymous. **200** without a token.
(All other admin routes correctly return 401, verified for comparison.)

### H2. Overselling: stock is never reserved, and cart lines are not aggregated ✅ verified
`PricingService.calculateCart` (`src/services/pricing.service.ts`) checks each cart line against stock **individually** and never sums duplicate `variantId` lines. `20 + 20` units passed validation against a stock of 25 (also via `POST /api/cart/calculate`). Worse, `OrderService.initiateCheckout` doesn't reserve stock (`reservedQuantity` exists in the schema but is **never used anywhere**), so two customers can both pay for the last unit: the second payment is captured by Razorpay, then stock decrement fails in `verifyAndCompletePayment` → customer has paid, order cannot be fulfilled, and there is **no automatic refund**.

### H3. FREE_SHIPPING coupons give money off twice ✅ verified
`src/services/pricing.service.ts:132-136`: a free-shipping coupon sets `shippingFee = 0` **and** `couponDiscount = defaultShippingFee`. The total becomes `subtotal − ₹50 + 0`. A ₹380 item checked out at **₹330** instead of ₹380. It also grants the flat ₹50 when the cart already qualifies for free shipping. Separately, `validateCoupon` (`:203-205`) hardcodes the free-shipping value to `50` regardless of the configured fee.

### H4. Cancelling an order in the admin UI never refunds and never restocks ✅ verified (dead path)
The admin order screen sends `PUT /api/admin/orders/[id]` with `status: "CANCELLED"`, which routes to `OrderService.updateFulfillment` — a plain status flip. The real cancellation logic (stock restore + Razorpay refund in `OrderService.cancelOrder`, exposed via `PATCH /api/admin/orders/[id]/status`) is **never called by any UI**. An admin who “cancels (Refund / Void)” a paid order silently keeps the customer's money and loses the inventory. The same unvalidated PUT accepts literally any status — verified live by setting an order's status to `"BANANA"`.

### H5. Inventory can be permanently corrupted via the endpoint the admin UI actually uses ✅ verified
`POST /api/admin/inventory/adjust` performs **no validation** (the Zod-validated `POST /api/admin/inventory` exists but the UI doesn't use it). Sending `quantityChange: "abc"` set a variant's `stockQuantity` to the string `"25abc"`; `NaN` does the same numerically. Every later stock comparison for that variant is garbage (`qty > NaN` is always false → effectively unlimited stock, broken displays).

### H6. Public reviews API leaks reviewer email addresses ✅ verified
`GET /api/reviews?productId=…` returns `user: { id, name, email }` for every approved review (enriched in `CMSRepository.listReviews`). Verified: the test reviewer's email is in the anonymous response. In in-memory mode, full review objects (with `userId`) are also embedded inside every public product payload via `populateProduct`, including on the homepage.

### H7. Admin authorization trusts a 7-day-old JWT; no revocation
`authenticateAdmin` (`src/lib/admin-auth.ts`) only verifies the JWT signature and the roles/permissions embedded **at login time**. Deactivating or demoting a user has no effect on admin APIs for up to 7 days (`getCurrentUser` does re-check `isActive`, but admin routes don't use it). Related: if `AUTH_SECRET` is unset in production, `src/services/auth.service.ts:13-14` silently generates a random per-process secret — on multi-instance/serverless deployments sessions randomly break (users logged out, intermittent 401s). `DATABASE_URL` has a production guard; `AUTH_SECRET` does not.

### H8. Production webhook handler depends on a table the setup script doesn't create
`src/app/api/webhooks/razorpay/route.ts` inserts into `"RazorpayWebhookEvent"`, but `prisma/neon-setup.sql` (the one-file bootstrap the README instructs) does **not** create that table — it's only in the separate migration `prisma/migrations/20261014_add_razorpay_webhook_events.sql`. A deploy that follows the README gets a 500 on every Razorpay webhook, so payments that complete away from the browser (closed tab, UPI collect, etc.) are never confirmed.

---

## 🟡 Medium

### M1. Duplicate/fractional cart quantities accepted by the pricing API ✅ verified
`POST /api/cart/calculate` skips Zod entirely and passes raw JSON to the pricing service: `quantity: 1.5` returned a successful ₹570 calculation. (Checkout's own schema does enforce integers, so this is currently a display/quote integrity hole plus an oversell vector combined with H2.)

### M2. Percentage coupons are uncapped ✅ verified
`CouponSchema` allows `discountValue > 100`. A 150% coupon produced `couponDiscount (₹570) > subtotal (₹380)` and a final payable of just the ₹50 shipping fee.

### M3. Invalid coupons are silently dropped at checkout ✅ verified
If a coupon expires / hits its limit between cart and checkout, `calculateCart` just applies no discount and checkout proceeds at full price — no error, no notice. The Razorpay amount simply ends up higher than the cart total the customer saw.

### M4. Category pages silently truncate products ✅ verified
`src/app/category/[slug]/page.tsx:29` uses `limit: 20` with no pagination. Current catalogue: **Syrups & Juices has 38 products (18 unreachable)** and Herbal Capsules has 23 (3 unreachable) via their category pages.

### M5. Product “Description” and “Directions” tabs are blank/generic
`ProductDetailClient.tsx:330,362` renders `product.description` and `product.dosage` — alias fields that no repository ever populates. The real data (`fullDescription`, `usageInstructions`) is loaded but never shown; `benefits`/`precautions` aren't displayed either (the Safety tab is hardcoded text).

### M6. Admin UI role gate uses obsolete role names → only SUPER_ADMIN can enter
`src/app/admin/layout.tsx:58-69` (and `src/app/account/page.tsx:72,87`) checks for `STORE_ADMIN` / `ORDER_FULFILLMENT` / `user.role`, none of which exist in the backend (`SUPER_ADMIN, ADMIN, PRODUCT_MANAGER, ORDER_MANAGER, CONTENT_MANAGER`, `roles[]`). Users with ADMIN/manager roles — whom the APIs would accept — are locked out of the UI. Corollary: **`/admin/login` is unreachable**, because it lives inside that same layout, which replaces it with the “Restricted” gate for logged-out visitors.

### M7. Login redirect (`?next=`) is ignored
Checkout and product pages redirect to `/login?next=/checkout` etc., but `src/app/login/page.tsx:37` and `register/page.tsx:54` always `router.push('/account')`. Customers forced to log in mid-checkout lose their place.

### M8. Cancellation is not atomic; coupon usage is never released
`OrderService.cancelOrder` restores stock **before** calling the Razorpay refund. If the refund call fails, the order stays un-cancelled but stock was already returned — a retry restores it **again** (inventory inflation). Successful cancellations also never release the consumed coupon, so customers permanently lose single-use coupons on cancelled orders.

### M9. Coupon limits are enforced after money is captured (PG) or not at all (in-memory) ✅ partially verified
Usage is recorded after payment completion. In Postgres mode, `recordUsage` can throw “usage limit reached” **after** the payment transaction committed and the order is CONFIRMED — the customer sees a payment-verification error on a successfully paid order. In in-memory mode `recordUsage` has no limit checks and no idempotency at all (verified: recording the same order twice counts twice), so per-user/global limits are unenforceable there.

### M10. Rate limiter is bypassable and leaks memory ✅ verified
`src/lib/rate-limit.ts` keys buckets by `x-real-ip`/`x-forwarded-for`. Verified: 12 failed logins with rotating `X-Forwarded-For` never hit 429 (same-identity requests 429'd at attempt 11). Requests without proxy headers all share one `unknown` bucket (users can DoS each other), and the `Map` is never pruned — it grows forever with distinct IPs. It's also per-process, so it barely functions on serverless (acknowledged in its comment).

### M11. Checkout phone validation disagrees between browser and server ✅ verified
The browser strips non-digits and accepts any 10 digits, then sends the **raw, un-normalised** string; the server requires `/^[6-9]\d{9}$/`. Inputs like `1234567890` or `98765 43210` pass the form and then fail checkout with a generic “Please check your contact, delivery, and cart details” 422.

### M12. Admin screens display blank/wrong fields due to field-name mismatches
- Inventory page (`src/app/admin/inventory/page.tsx`): renders `v.product?.name` (API returns bare variants → blank “Formulation” column, product-name search broken) and `v.reorderThreshold || 10` (real field is `lowStockThreshold`, seeded 5 → wrong threshold/low-stock flags).
- Dashboard low-stock feed (`src/app/admin/page.tsx`): `item.product?.name` vs API's `productName` → blank names.
- Coupons page: shows `c.minOrderAmount` / `c.usageCount` vs real `minOrderValue` / `usedCount` → always ₹0 / blank.
- Order financial breakdown (admin order detail + order confirmation): shows `discountAmount` (MRP savings) and omits `couponDiscount` entirely → displayed numbers don't add up to the total when a coupon was used; the admin-entered `trackingUrl` is silently discarded by the API.

### M13. Settings are split-brained; two admin toggles do nothing
The in-memory seed writes `BUSINESS_NAME`, `BUSINESS_ADDRESS_LINE1`, `DEFAULT_SHIPPING_FEE`, `COD_ENABLED`, … while `SettingsRepository.getBusinessSettings()` reads `STORE_NAME`, `ADDRESS_LINE1`, `BASE_SHIPPING_FEE`, `ENABLE_COD`, … — the seeded values are dead and hardcoded fallbacks always win. The admin “Taxes & GST included” toggle changes nothing (`estimatedGst` is hardcoded `0` in pricing) and `enableCod` is saved but checkout hard-rejects COD regardless (it also has no UI control). Latent footgun: `SettingsRepository.set()` defaults `isPublic = true` and its Postgres upsert overwrites `isPublic` — any future call that forgets the flag flips a secret setting (e.g. `RAZORPAY_KEY_SECRET`) into the publicly served `/api/cms` payload.

### M14. Abandoned checkouts accumulate forever
Every “Pay” click creates a `PENDING` order + Razorpay order. Dismissing the payment modal never cancels it server-side and there is no expiry job/cron (`vercel.json` has none), so the orders table fills with orphaned pending orders that pollute admin queues and analytics counts.

### M15. `costPrice` is sent to every shopper ✅ verified
All public catalogue responses and server-rendered pages include each variant's `costPrice`. It's 0 for brochure products today, but the moment admins enter real costs (the product form even auto-fills 50% of selling price), store margins are public.

---

## 🟢 Low / hygiene

- **Shipping fee/threshold of 0 is unconfigurable** ✅ verified — `parseFloat(x) || 499/50` treats `"0"` as unset. Empty-cart client calc additionally hardcodes a ₹999 threshold.
- **Shop pagination loses state**: page links keep `category`/`formulation` but drop `search` and `sort` (`src/app/shop/page.tsx`). There is also **no sort UI** at all, and `sort=featured` secretly maps to `newest`.
- **Unvalidated admin mutations**: product `PUT` (mass-assigns raw JSON — in-memory mode even allows overwriting `id`/arbitrary fields), banner create/update, and review moderation PUT all skip the Zod schemas that exist for their POST counterparts. `POST /api/admin/cms?type=<unknown>` returns **201 with `data: undefined`**.
- **Duplicate/dead API surface**: `/api/cart` vs `/api/cart/calculate`; `/api/payments/create-order`+`/verify` vs `/api/payments/razorpay/order`+`/verify` (the latter pair is unused; `/verify` also skips body validation); `POST /api/orders` is a stub that always 400s; `/api/products` is only used by `SearchModal`, which itself is never imported. `GET /api/admin/reviews` contains `approvedOnly = … ? false : false` (always false).
- **Sitemap advertises pages that 404** ✅ verified — `/blog` and `/blog/[slug]` are in `sitemap.ts` but no blog routes exist. Blog/testimonial/FAQ CMS data has no storefront rendering at all; `SearchModal`'s “popular searches” name products that aren't in the catalogue.
- **Homepage count is wrong** ✅ verified — “View all **8** listings” uses the *featured* count but links to the 84-product shop.
- **Lists silently cap**: account page shows only the first 20 orders (and reports that page size as “Orders Placed”); admin orders screen filters/searches only the first 25 orders client-side and offers a bogus `PROCESSING` status filter; admin products API hardcodes `limit: 100`.
- **Coupon UX**: cart's `applyCoupon` reads `data.error?.message`, but the API returns the reason in `data.data.message` — users always see generic “Invalid coupon code” instead of e.g. the minimum-order message.
- **Cart error handling**: cart recalculation failures are swallowed (`console.error` only), leaving stale totals or items priced at ₹0 with no way for the shopper to see/fix the offending item from the mini-cart.
- **Auth-context key mismatch**: `persistSession` writes `sholkveda_user` but cleanup removes `shlokveda_user` (stale PII remains in localStorage after logout); `shlokveda_token` is removed in two places but never set anywhere; the in-memory `token` state is lost on reload (only the cookie keeps the session). Wishlist toggle uses a stale state closure and trusts unvalidated `JSON.parse` from localStorage.
- **Reviews**: no product-existence check (in-memory happily stores reviews for fake products; PG would 500 on FK), no per-user duplicate prevention, no rate limit; the “Verified Buyer” badge keys off `isVerifiedPurchase`, which the in-memory path never sets.
- **Webhook verify uses `===`** instead of a timing-safe compare (`RazorpayService.verifyWebhookSignature`); browser payment verification doesn't check the paid amount (the webhook path does). Duplicate webhook deliveries stuck in `PROCESSING` fall through and reprocess — safe in PG mode only because completion is atomic there.
- **Analytics accuracy/perf (PG mode)**: revenue/top-products are computed over at most the latest 1,000 orders while `totalOrders` is the true count; dashboard hydration is N+1 (3 queries × order, 4 × product); `totalCustomers` counts admins (and inactives in-memory) inconsistently between modes.
- **In-memory ↔ Postgres divergences**: product delete is hard-delete (in-memory, so the admin “restore” button can never work there and order history breaks) vs soft-delete (PG); in-memory product edit recreates variant IDs when the client omits them, orphaning carts; in-memory order numbers derive from `db.orders.size` and repeat after every restart; in-memory stock is seeded 25/product vs 0 in Neon (documented, but preview behaviour ≠ production).
- **Missing account features**: no password-reset flow (the reset-token table was dropped), and no API to manage users — admins cannot create staff accounts, change roles, or deactivate anyone (`MANAGE_CUSTOMERS`, `MANAGE_PAYMENTS`, `MANAGE_BLOG` permissions are defined but unused). Saved addresses are dead code: repository methods exist, but no API route or UI uses them; checkout addresses are never saved.
- **Smaller items**: `/api/settings` puts `Cache-Control` inside the JSON body instead of response headers ✅ verified; checkout State dropdown lists only 11 states + “Other”; header flashes a wrong default announcement (“Free shipping on ₹500+…”) before settings load; JSON-LD is injected via `dangerouslySetInnerHTML` with unescaped `JSON.stringify` (a product name containing `</script>` breaks out); search `ILIKE` wildcards (`%`, `_`) are unescaped; `next.config.mjs` allows images from any host (`hostname: '**'`); uploads endpoint checks “is any admin role” rather than a specific permission.
- **Dependencies/tooling**: `npm audit` → **19 vulnerabilities (1 critical, 13 high)**; `next@14.2.24` is flagged as having a security vulnerability by npm itself. Prisma packages are version-skewed (`@prisma/client`/`prisma` 5.19 vs `@prisma/engines`/`@prisma/adapter-pg` 7.x) and Prisma is entirely unused at runtime (raw `pg` everywhere), as are `@neondatabase/serverless` and `pdf-parse`. The 68 MB `ONLY AYURVEDA BROCHURE.pdf` is committed to git (`.git` ≈ 71 MB).

---

## What is *not* broken (checked)

- `npx tsc --noEmit`, `next lint` (1 warning), `npm run build`, and all three existing test suites (`test:backend`, `test:qa`, `test:security`) pass.
- Razorpay signature verification (checkout) uses HMAC + `timingSafeEqual`; payment/order ownership is checked on `/api/payments/*` and `/api/orders/*`; passwords are bcrypt-hashed; the Postgres payment-completion path is properly transactional with row locks; most admin APIs do enforce permission checks (the gaps are H1/C2 above).
