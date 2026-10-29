# Deploying SHLOKVEDA to Vercel + Neon

Production checklist. ~10 minutes. The app refuses to run in production
without `DATABASE_URL` (by design), and refuses to sign/verify auth tokens
without `AUTH_SECRET`.

## 0. Before you start
- If a database password was ever pasted into chat/email, **rotate it first**
  (Neon console → Project → Roles → reset password), then use the NEW
  connection string below.
- Never commit real values. `.env*` is gitignored; `.env.example` is the template.

## 1. Prepare the Neon database (one time)
Pick ONE path (never both on the same database):
- **Fresh database (easiest — one command):**
  `DATABASE_URL='postgresql://…' npm run db:setup`
  It runs `prisma/neon-setup.sql` for you (all tables + catalogue seed)
  and refuses to run twice on the same database.
  Manual equivalent: paste the whole of `prisma/neon-setup.sql` into the
  Neon SQL Editor and Run.
- **Existing database (created by an older deploy):** run **every** file in
  `prisma/migrations/` in filename (date) order. Each is written to be safe
  to re-run (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING` / `DROP ... IF
  EXISTS`), so already-applied ones are harmless. In order:
  `20261004_remove_password_reset_tokens.sql`,
  `20261014_add_razorpay_webhook_events.sql` (webhook idempotency table —
  required for payments),
  `20261014_add_tax_included_setting.sql`,
  `20261022_add_banner_secondary_cta.sql` (banner **saves** fail until this
  runs; storefront reads keep working),
  `20261022_add_shipment_tracking_url.sql`,
  `20261023_add_newsletter_subscribers.sql`,
  `20261023_add_static_page_sections.sql` (structured policy pages; until it
  runs, policy pages keep reading the Admin -> Settings texts and CMS page
  saves store plain text only),
  `20261024_add_uploaded_files.sql` (admin-uploaded images stored in Neon;
  the upload endpoint also creates this table if it is missing, so deploying
  the code before this migration does not break uploads),
  `20261024_fill_brochure_opening_stock_100.sql` (owner-approved opening
  balance of 100 units for every brochure pack variant, with matching
  inventory-ledger rows; its marker makes a duplicate run safe and prevents
  later sales/manual corrections from being reset),
  `20261025_replace_primary_product_images.sql` (points 48 products'
  primary photos at the new owner-supplied pack images
  `/products/<slug>-pack.webp`; run it only AFTER the deployment that
  contains those image files is live).
- The fresh-database script already contains all of the above — never run
  both paths on the same database.
- **Stock:** the brochure PDF was checked page by page; it contains product,
  pack size, MRP and page-number data, but no inventory quantities. On
  2026-10-24 the owner approved **100 units per brochure pack variant**.
  A fresh database is seeded at 100 for all 101 variants. For an existing
  database that was created before this change, after pulling the merged code
  run this private one-time command from the repository root:
  `DATABASE_URL='postgresql://…' CONFIRM_FILL_BROCHURE_STOCK_100=YES npm run inventory:fill-brochure-stock`
  Success must verify **101/101** variants at 100. Do not accept live orders
  until you see that success message and spot-check Admin → Inventory Ledger.

## 2. Create the first admin (one time, from your computer)
```bash
DATABASE_URL='postgresql://…' ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min-14-chars-strong' npm run admin:bootstrap
```
This creates the SUPER_ADMIN/ADMIN roles, all permissions, and your login.
It refuses to promote/reset an existing account.

### If your email was already registered as a customer

Do **not** run the database setup again. From your private computer terminal,
run this one command to add the missing admin roles to that existing account.
It does not change the account password:

```bash
DATABASE_URL='postgresql://…' ADMIN_EMAIL=you@example.com CONFIRM_PROMOTE_ADMIN=YES npm run admin:promote
```

Success must say that the account has `SUPER_ADMIN`, `ADMIN`, and
`MANAGE_CMS`. Then sign in at `/admin/login`.


## 3. Deploy on Vercel (use Import, not "clone template")
All fixes are merged into `main` (PR #1). Deploy `main` — it is Vercel's
default production branch, so no branch setting is needed.

1. vercel.com → **Add New → Project**
2. In **Import Git Repository**, pick `siachatgptpro-hash/ecommerce_website`
   (if it's missing from the list, use *Adjust GitHub App Permissions* to grant Vercel access, then refresh)
3. Configure: Framework = Next.js (auto-detected); Production Branch stays
   on `main` (default)
4. Add the environment variables from step 4 below, then **Deploy**

Notes:
- Do NOT use `vercel.com/new/clone` links — that flow copies the repo into a
  new public one and breaks push-to-deploy for this repository.
- Every later push to the branch auto-deploys; other branches get Preview URLs.
- Cron: order-expiry runs **daily** (`0 0 * * *`) because Vercel Hobby (free)
  rejects sub-daily schedules. On Pro, change it to `*/30 * * * *` in `vercel.json`.

## 4. Environment variables (Vercel → Project → Settings → Environment Variables)
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled string incl. `?sslmode=require` |
| `AUTH_SECRET` | ✅ | Long random (e.g. `openssl rand -hex 32`). Login breaks in prod without it |
| `RAZORPAY_KEY_ID` | for online payments | `rzp_live_…` (or `rzp_test_…` while testing). All-caps spelling |
| `RAZORPAY_KEY_SECRET` | for online payments | All-caps spelling |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ for payments | Must exactly match the secret in the Razorpay webhook (step 5). The legacy `Razorpay_WEBHOOK_SECRET` spelling is also accepted |
| `CRON_SECRET` | ✅ | Protects `/api/cron/expire-orders`; Vercel Cron sends it automatically. Without it the cron route returns 503 |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://your-domain` — canonical URLs, sitemap (empty without it), share previews. Set it before the first build; after attaching a custom domain, update it and redeploy |

Notes:
- Razorpay keys saved in **Admin → Hathras Settings** take precedence over
  these env vars (database wins). Use one place consistently — env is fine.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` are only needed locally for step 2
  (bootstrap). They are not runtime credentials; the admin login lives in
  the database after bootstrapping.
- Admin image uploads need **no extra storage service or token**: validated
  JPG/PNG/WEBP bytes are stored in Neon (`UploadedFile.data`) and served
  from `/api/uploads/<id>`. Do not create/connect a Vercel Blob store.
  (Any very old image URLs previously saved from a Blob store remain
  external URLs until the image is uploaded again; catalogue images shipped
  in `public/` are unaffected.)

Then **Deploy**.

## 5. Razorpay webhook (after first deploy)
Razorpay Dashboard → Settings → Webhooks → Add:
- URL: `https://<your-domain>/api/webhooks/razorpay` (lowercase path)
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`

## 6. Post-deploy checks
1. `/admin/login` — sign in with the bootstrap admin.
2. Admin → Hathras Settings: verify store name, phone, address, GSTIN,
   free-shipping threshold and delivery fee. **COD is OFF by default** —
   enable only if you want cash on delivery.
3. Admin → Inventory Ledger: **set real stock** for every variant (the seed
   leaves stock at 0).
4. Payments in **test mode first**: with `rzp_test_…` keys, place a small
   order, pay with a Razorpay test card/UPI, and confirm: order becomes
   CONFIRMED/PAID, the webhook shows 200 deliveries in the Razorpay
   dashboard, and a cancelled order returns its stock.
5. Attach your custom domain (Vercel → Settings → Domains), then update
   `NEXT_PUBLIC_SITE_URL`, point the Razorpay webhook at the final domain,
   and redeploy. Check `/sitemap.xml` lists real URLs.
6. Run PageSpeed Insights once on the live home and a product page.
7. Only then swap Razorpay test keys for live keys (after KYC) — and repeat
   one small real payment end-to-end.
8. Optional deeper check: run the 49-check suite once against a **Neon
   branch** (never prod) — see the header of `scripts/retest-customers.mjs`.

## Notes
- Images are served unoptimized by config — fine for launch; revisit if bandwidth bills grow.
- Admin-uploaded images count toward Neon database storage (max 5 MB each
  by default). Prefer compressed JPG/WEBP product/banner images instead of
  large originals.
- Remaining `npm audit` items require major upgrades (Next 16 / Tailwind 4); everything patchable in-range is patched (next 14.2.35).
