# Deploying SHOLKVEDA to Vercel + Neon

Production checklist. ~10 minutes. The app refuses to run in production
without `DATABASE_URL` (by design), and refuses to sign/verify auth tokens
without `AUTH_SECRET`.

## 0. Before you start
- If a database password was ever pasted into chat/email, **rotate it first**
  (Neon console → Project → Roles → reset password), then use the NEW
  connection string below.
- Never commit real values. `.env*` is gitignored; `.env.example` is the template.

## 1. Prepare the Neon database (one time)
In the Neon SQL Editor (or `psql "$DATABASE_URL"` locally):
- **Fresh database:** run the whole of `prisma/neon-setup.sql`
  (creates all tables incl. `Shipment.trackingUrl`, seeds the catalogue).
- **Existing database created before Oct 2026:** run only
  `prisma/migrations/20261022_add_shipment_tracking_url.sql`.

## 2. Create the first admin (one time, from your computer)
```bash
DATABASE_URL='postgresql://…' ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min-14-chars-strong' npm run admin:bootstrap
```
This creates the SUPER_ADMIN/ADMIN roles, all permissions, and your login.
It refuses to promote/reset an existing account.


## Fastest path: one-click deploy of the `arena/07899005-ecommerce-website` branch
Click (you'll log in with your own Vercel/GitHub account — no token sharing):

**[Deploy this branch to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/siachatgptpro-hash/ecommerce_website/tree/arena/07899005-ecommerce-website&env=DATABASE_URL,AUTH_SECRET,Razorpay_KEY_ID,Razorpay_KEY_SECRET,Razorpay_WEBHOOK_SECRET,CRON_SECRET,NEXT_PUBLIC_SITE_URL&project-name=sholkveda&repository-name=ecommerce_website)**

- Vercel imports the repo **at that branch** and prompts you for the env values from step 4 below.
- It first creates a **Preview** deployment of the branch. To make it live, pick one:
  - **Recommended:** merge PR #1 into `main` (production deploys from `main`), or
  - Vercel → Deployments → ⋯ on the branch deployment → **Promote to Production**, or
  - Vercel → Settings → Git → **Production Branch** = `arena/07899005-ecommerce-website`.
- Do steps 1–2 (database SQL + admin bootstrap) before or right after — the
  store builds without them but needs `DATABASE_URL` at runtime.
- Cron note: the order-expiry cron runs **daily** (`0 0 * * *`) because
  Vercel Hobby (free) rejects sub-daily schedules. On Pro, change it to
  `*/30 * * * *` in `vercel.json`.

## 3. Import the project in Vercel
vercel.com → **Add New → Project** → import this GitHub repository.
`vercel.json` is already configured (framework, security headers/CSP,
30-min order-expiry cron). Merge the pull request so `main` is production.

## 4. Environment variables (Vercel → Project → Settings → Environment Variables)
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled string incl. `?sslmode=require` |
| `AUTH_SECRET` | ✅ | Long random (e.g. `openssl rand -hex 32`). Login breaks in prod without it |
| `Razorpay_KEY_ID` | for online payments | `rzp_live_…` (or `rzp_test_…` while testing) |
| `Razorpay_KEY_SECRET` | for online payments | |
| `Razorpay_WEBHOOK_SECRET` | ✅ | **Exact spelling: Razorpay** (all-caps Razorpay is a different, wrong variable) |
| `CRON_SECRET` | ✅ | Protects `/api/cron/expire-orders`; Vercel Cron sends it automatically |
| `BLOB_READ_WRITE_TOKEN` | for admin image uploads | Create a Blob store in the Vercel Storage tab; token is added for you |
| `NEXT_PUBLIC_SITE_URL` | recommended | `https://your-domain` — canonical URLs + sitemap |

Then **Deploy**.

## 5. Razorpay webhook (after first deploy)
Razorpay Dashboard → Settings → Webhooks → Add:
- URL: `https://<your-domain>/api/webhooks/razorpay` (lowercase path)
- Secret: same value as `Razorpay_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`

## 6. Post-deploy checks
1. `/admin/login` — sign in with the bootstrap admin.
2. Admin → Settings: store details; **COD is OFF by default** — enable only if you want it.
3. Place a ₹1-ish test order with Razorpay test keys; confirm payment → order CONFIRMED; cancel it and confirm stock returns.
4. Run the full 49-check suite once against a **Neon branch** (never prod):
   see the header of `scripts/retest-customers.mjs`.

## Notes
- Images are served unoptimized by config — fine for launch; revisit if bandwidth bills grow.
- Remaining `npm audit` items require major upgrades (Next 16 / Tailwind 4 / @vercel/blob 2); everything patchable in-range is patched (next 14.2.35).
