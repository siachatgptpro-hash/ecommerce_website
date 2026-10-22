/**
 * THREE-CUSTOMER END-TO-END RETEST (49 checks)
 * ============================================
 * Simulates three customers against a RUNNING store:
 *   A) Guest "Sita"  - browsing, privacy surface, guest boundaries
 *   B) "Rohan"        - registers and buys (COD), coupons, reviews
 *   C) "Kavita"       - privacy/IDOR + abuse edge cases, cancel, webhooks
 * plus admin/platform checks (user management, analytics, rate limiting).
 *
 * !! WARNING: This script WRITES data - it registers users, creates coupons
 *    (PROBE10/PROBEFREE), places + cancels orders, and toggles the COD
 *    setting ON. NEVER run it against your production database. Run it
 *    against a Neon BRANCH (copy-on-write clone) or any throwaway DB.
 *
 * Usage:
 *   1. Start the app pointed at the THROWAWAY database, e.g.:
 *        DATABASE_URL=<branch-url> AUTH_SECRET=<long-random> \
 *        ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=<admin-pw> \
 *        Razorpay_WEBHOOK_SECRET=<webhook-secret> npm run dev
 *      (Fresh DB? First apply prisma/neon-setup.sql, then
 *       prisma/migrations/20261022_add_shipment_tracking_url.sql)
 *   2. In another terminal:
 *        RETEST_ADMIN_EMAIL=admin@example.com RETEST_ADMIN_PASSWORD=<admin-pw> \
 *        RETEST_WEBHOOK_SECRET=<webhook-secret> node scripts/retest-customers.mjs
 *      Optional: RETEST_BASE_URL=https://your-preview-host
 *
 * Exit code 0 = all 49 checks passed.
 */
// Three-customer re-test probe v2 — correct API contracts
import crypto from 'crypto';

const BASE = process.env.RETEST_BASE_URL || 'http://127.0.0.1:3000';
const ADMIN_EMAIL = process.env.RETEST_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.RETEST_ADMIN_PASSWORD || 'AdminProbe@123';
const WEBHOOK_SECRET = process.env.RETEST_WEBHOOK_SECRET || 'probe-webhook-secret';
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

class Jar {
  constructor() { this.cookies = new Map(); }
  absorb(res) {
    const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of list) {
      const [pair, ...attrs] = c.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      const expired = attrs.some(a => /max-age=0(?!\d)/i.test(a)) || value === '';
      if (expired) this.cookies.delete(name); else this.cookies.set(name, value);
    }
  }
  header() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); }
  has(name) { return this.cookies.has(name); }
}

async function call(method, path, { jar, body, headers = {}, redirect = 'manual' } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(jar && jar.header() ? { Cookie: jar.header() } : {}), ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect,
  });
  if (jar) jar.absorb(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML */ }
  return { status: res.status, json, text, headers: res.headers };
}

async function stockOf(variantId) {
  const r = await call('GET', '/api/products?limit=100');
  for (const p of r.json?.data?.products || []) {
    const v = (p.variants || []).find(x => x.id === variantId);
    if (v) return v.stockQuantity;
  }
  return undefined;
}

// ---------------------------------------------------------------- setup data
const productsRes = await call('GET', '/api/products?limit=100');
const products = productsRes.json?.data?.products || [];
const firstProduct = products[0];
const variantOf = (p) => (p.variants || [])[0];
let smallStock = null;
let cheapVariant = null;
for (const p of products) for (const v of (p.variants || [])) {
  if (v.stockQuantity > 2 && (!smallStock || v.stockQuantity < smallStock.stockQuantity)) smallStock = { ...v, product: p };
  const price = v.sellingPrice ?? v.price ?? Infinity;
  if (price > 0 && price < 400 && (!cheapVariant || price < cheapVariant.price)) cheapVariant = { ...v, price, product: p };
}

// ============================================================ CUSTOMER A: GUEST
console.log('\n=== Customer A — Guest Sita (browsing, no account) ===');
{
  check('A1 catalog API never exposes costPrice', !JSON.stringify(productsRes.json).includes('costPrice'));
  check('A2 catalog returns products', products.length > 10, `${products.length} products`);

  const rev = await call('GET', `/api/reviews?productId=${firstProduct.id}`);
  check('A3 public reviews strip userId', rev.status === 200 && !JSON.stringify(rev.json).includes('"userId"'));

  const cms = await call('GET', '/api/cms?type=SETTINGS');
  check('A4 public settings contain no secrets', cms.status === 200 && !/SECRET|PASSWORD|API_KEY/.test(JSON.stringify(cms.json ?? {})));

  const v = variantOf(firstProduct);
  const guestCalc = await call('POST', '/api/cart', { body: { items: [{ variantId: v.id, quantity: 1 }] } });
  check('A5 guest can price a cart (no mutation possible)', guestCalc.status === 200 && guestCalc.json?.data?.items?.length === 1, `status ${guestCalc.status}`);
  const guestOrder = await call('POST', '/api/orders', { body: { items: [{ variantId: v.id, quantity: 1 }], shippingAddress: { fullName: 'X Y', phone: '9812345678', addressLine1: '1 St', city: 'Pune', state: 'Maharashtra', postalCode: '421301' } } });
  check('A6 guest cannot place an order', guestOrder.status === 401, `status ${guestOrder.status}`);

  const adminPage = await call('GET', '/admin');
  const loc = adminPage.headers.get('location') || '';
  check('A7 guest bounced from /admin to login', [301, 302, 307].includes(adminPage.status) && loc.includes('/admin/login'), `${adminPage.status} -> ${loc}`);

  const shop = await call('GET', '/shop', { redirect: 'follow' });
  check('A8 shop page renders', shop.status === 200 && shop.text.includes('Shop'));

  const detail = await call('GET', `/product/${firstProduct.slug}`, { redirect: 'follow' });
  check('A9 product page renders, JSON-LD has no Infinity', detail.status === 200 && !detail.text.includes('Infinity'));

  const cat = firstProduct.category?.slug || firstProduct.categoryId;
  const page1 = await call('GET', `/api/products?category=${encodeURIComponent(cat)}&page=1&limit=12`);
  const page2 = await call('GET', `/api/products?category=${encodeURIComponent(cat)}&page=2&limit=12`);
  const ids1 = (page1.json?.data?.products || []).map(p => p.id);
  const ids2 = (page2.json?.data?.products || []).map(p => p.id);
  const overlap = ids1.filter(id => ids2.includes(id));
  check('A10 category pagination disjoint + total consistent', overlap.length === 0 && page1.json?.data?.total === page2.json?.data?.total && ids1.length <= 12 && ((page1.json?.data?.total ?? 0) <= 12 || ids1.length === 12), `total=${page1.json?.data?.total} p1=${ids1.length} p2=${ids2.length}`);
}

// ============================================================ ADMIN SEED COUPONS
const admin = new Jar();
{
  const login = await call('POST', '/api/auth/login', { jar: admin, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check('S0 admin login works; response carries no token', login.status === 200 && !JSON.stringify(login.json).includes('token'), `status ${login.status}`);

  const now = new Date();
  const start = new Date(now.getTime() - 86400000).toISOString();
  const end = new Date(now.getTime() + 30 * 86400000).toISOString();
  const c1 = await call('POST', '/api/admin/coupons', { jar: admin, body: { code: 'PROBE10', description: 'probe', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 0, maxDiscountCap: 200, startDate: start, endDate: end, isActive: true } });
  check('S1 admin creates PERCENTAGE coupon', [200, 201].includes(c1.status), `status ${c1.status} ${c1.text.slice(0, 140)}`);
  const c2 = await call('POST', '/api/admin/coupons', { jar: admin, body: { code: 'PROBEFREE', description: 'probe', discountType: 'FREE_SHIPPING', discountValue: 0, minOrderValue: 1000, startDate: start, endDate: end, isActive: true } });
  check('S2 admin creates FREE_SHIPPING coupon with value 0', [200, 201].includes(c2.status), `status ${c2.status} ${c2.text.slice(0, 140)}`);
}

// ============================================================ CUSTOMER B: Rohan
console.log('\n=== Customer B — Rohan (registers and buys) ===');
const Rohan = new Jar();
let RohanOrder = null;
{
  const shortPw = await call('POST', '/api/auth/register', { body: { fullName: 'Rohan', email: 'Rohan@example.com', password: 'short7' } });
  check('B1 7-char password rejected', shortPw.status === 422, `status ${shortPw.status}`);

  const reg = await call('POST', '/api/auth/register', { jar: Rohan, body: { fullName: 'Rohan', email: 'Rohan@example.com', phone: '9812345678', password: 'probe-password-1' } });
  check('B2 register succeeds; no token in body; session cookie set', reg.status === 201 && !JSON.stringify(reg.json).includes('token') && Rohan.has('shlokveda_session_token'), `status ${reg.status} cookie=${Rohan.has('shlokveda_session_token')}`);

  const dup = await call('POST', '/api/auth/register', { body: { fullName: 'Rohan Clone', email: 'Rohan@example.com', password: 'probe-password-2' } });
  check('B3 duplicate email is a clean 409', dup.status === 409, `status ${dup.status}`);

  let statuses = [];
  for (let i = 0; i < 12; i++) {
    const r = await call('POST', '/api/auth/login', { body: { email: 'victim@example.com', password: 'wrong-password' }, headers: { 'X-Forwarded-For': `203.0.113.${10 + i}` } });
    statuses.push(r.status);
  }
  check('B4 credential stuffing blocked despite rotating IPs', statuses.includes(429), `statuses ${statuses.join(',')}`);

  const me = await call('GET', '/api/auth/me', { jar: Rohan });
  check('B5 /me returns Rohan without passwordHash', me.status === 200 && me.json?.data?.email === (String.fromCharCode(114,111,104,97,110) + '@example.com') && !JSON.stringify(me.json).includes('passwordHash'), `status ${me.status} email=${me.json?.data?.email} hash=${JSON.stringify(me.json).includes('passwordHash')} keys=${Object.keys(me.json?.data || {}).join(',')}`);

  const v = variantOf(firstProduct);
  const add = await call('POST', '/api/cart', { jar: Rohan, body: { items: [{ variantId: v.id, quantity: 2 }] } });
  check('B6 cart pricing for logged-in user', add.status === 200 && add.json?.data?.items?.[0]?.quantity === 2, `status ${add.status}`);

  const calcBad = await call('POST', '/api/cart/calculate', { jar: Rohan, body: { items: [{ variantId: v.id, quantity: 2 }], couponCode: 'NOPE123' } });
  check('B7 invalid coupon shows error (not silent)', !!calcBad.json?.data?.couponError, `couponError=${calcBad.json?.data?.couponError}`);

  const calcOk = await call('POST', '/api/cart/calculate', { jar: Rohan, body: { items: [{ variantId: v.id, quantity: 2 }], couponCode: 'PROBE10' } });
  const d = calcOk.json?.data || {};
  const expectedCoupon = Math.min(Math.round(d.subtotal * 0.10 * 100) / 100, 200);
  check('B8 10% coupon math correct', Math.abs((d.couponDiscount || 0) - expectedCoupon) < 0.02 && Math.abs((d.finalPayableAmount || 0) - (d.subtotal - d.couponDiscount + d.shippingFee)) < 0.02, `subtotal=${d.subtotal} coupon=${d.couponDiscount} shipFee=${d.shippingFee} payable=${d.finalPayableAmount}`);

  const address = { fullName: 'Rohan', phone: '9812345678', addressLine1: '42 Example Street', city: 'Pune', state: 'Maharashtra', postalCode: '421301' };
  const codOff = await call('POST', '/api/orders', { jar: Rohan, body: { items: [{ variantId: v.id, quantity: 2 }], shippingAddress: address } });
  check('B9 COD blocked while disabled in settings', [400, 422].includes(codOff.status) && codOff.text.includes('Cash on Delivery'), `status ${codOff.status}`);

  await call('PUT', '/api/admin/settings', { jar: admin, body: { enableCod: true } });
  const stockBefore = await stockOf(v.id);
  const codOn = await call('POST', '/api/orders', { jar: Rohan, body: { items: [{ variantId: v.id, quantity: 2 }], couponCode: 'PROBE10', shippingAddress: address } });
  RohanOrder = codOn.json?.data;
  check('B10 COD order succeeds once enabled', codOn.status === 201 && !!RohanOrder?.orderNumber, `status ${codOn.status} order=${RohanOrder?.orderNumber}`);

  const stockAfter = await stockOf(v.id);
  check('B11 stock deducted exactly by 2', stockAfter === stockBefore - 2, `${stockBefore} -> ${stockAfter}`);

  const orders = await call('GET', '/api/orders', { jar: Rohan });
  const mine = (orders.json?.data?.orders || []).find(o => o.orderNumber === RohanOrder?.orderNumber);
  check('B12 order listed for owner', !!mine);
  if (mine) {
    check('B13 order totals reconcile', Math.abs(mine.totalPayableAmount - (mine.subtotalAmount - (mine.couponDiscount || 0) + mine.shippingFee)) < 0.02, `payable=${mine.totalPayableAmount} sub=${mine.subtotalAmount} coup=${mine.couponDiscount} ship=${mine.shippingFee}`);
  }

  // online checkout with unconfigured gateway must fail cleanly with no side effects
  const online = await call('POST', '/api/payments/create-order', { jar: Rohan, body: { customerName: 'Rohan', customerEmail: 'Rohan@example.com', customerPhone: '9812345678', items: [{ variantId: v.id, quantity: 1 }], shippingAddress: address } });
  const stockAfter2 = await stockOf(v.id);
  const orders2 = await call('GET', '/api/orders', { jar: Rohan });
  check('B14 unconfigured gateway fails cleanly (no phantom order/stock)', online.status >= 400 && stockAfter2 === stockAfter && (orders2.json?.data?.total ?? -1) === 1, `online=${online.status} stock=${stockAfter2} orders=${orders2.json?.data?.total} msg=${online.text.slice(0, 110)}`);

  // forged payment verification must never confirm anything
  const verify = await call('POST', '/api/payments/verify', { jar: Rohan, body: { orderId: RohanOrder?.id || 'missing', razorpayOrderId: 'order_forged123', razorpayPaymentId: 'pay_forged123', razorpaySignature: 'deadbeefdeadbeef' } });
  check('B15 forged payment signature rejected', verify.status >= 400 && verify.status < 500, `status ${verify.status}`);

  // review upsert + moderation queue (M8): second submission updates the
  // first; unapproved reviews stay off the public listing until moderated.
  const r1 = await call('POST', '/api/reviews', { jar: Rohan, body: { productId: firstProduct.id, rating: 5, title: 'Good', comment: 'Works well for me.' } });
  const r2 = await call('POST', '/api/reviews', { jar: Rohan, body: { productId: firstProduct.id, rating: 4, title: 'Good (updated)', comment: 'Updating my earlier review.' } });
  const adminList = await call('GET', '/api/admin/reviews', { jar: admin });
  const allReviews = adminList.json?.data?.reviews || (Array.isArray(adminList.json?.data) ? adminList.json.data : []);
  const mineReviews = allReviews.filter(x => x.productId === firstProduct.id && (x.title === 'Good' || (x.title || '').includes('updated')));
  const publicList = await call('GET', `/api/reviews?productId=${firstProduct.id}`);
  const pub = publicList.json?.data?.reviews || (Array.isArray(publicList.json?.data) ? publicList.json.data : []);
  check('B16 repeat review updates in place and re-enters moderation', r1.status === 201 && r2.status === 200 && mineReviews.length === 1 && mineReviews[0].rating === 4 && pub.filter(x => (x.title || '').includes('updated')).length === 0, `r1=${r1.status} r2=${r2.status} stored=${mineReviews.length} rating=${mineReviews[0]?.rating} publicYet=${pub.length}`);
}

// ============================================================ CUSTOMER C: Kavita
console.log('\n=== Customer C — Kavita (privacy + abuse edge cases) ===');
const Kavita = new Jar();
{
  const reg = await call('POST', '/api/auth/register', { jar: Kavita, body: { fullName: 'Kavita', email: 'Kavita@example.com', phone: '9812345679', password: 'probe-password-3' } });
  check('C0 Kavita registers', reg.status === 201, `status ${reg.status}`);

  const otherDetail = await call('GET', `/api/orders/${RohanOrder.orderNumber}`, { jar: Kavita });
  check('C1 cannot read another customers order (API)', [403, 404].includes(otherDetail.status), `status ${otherDetail.status}`);

  // Next streams a 200 shell before notFound() resolves, so the security
  // invariant to assert is content: none of Rohan's PII may appear.
  const conf = await call('GET', `/order-confirmation?orderNumber=${RohanOrder.orderNumber}`, { jar: Kavita });
  check('C2 confirmation page leaks no PII to non-owner', !conf.text.includes('Rohan Sharma') && !conf.text.includes('9812345678') && !conf.text.includes('42 Example Street'), `status ${conf.status}`);

  const track = await call('GET', `/orders/${RohanOrder.orderNumber}`, { jar: Kavita });
  check('C3 tracking page leaks no PII to non-owner', !track.text.includes('Rohan Sharma') && !track.text.includes('9812345678') && !track.text.includes('42 Example Street'), `status ${track.status}`);

  const v = variantOf(firstProduct);
  const address = { fullName: 'Kavita', phone: '9812345679', addressLine1: '7 Lake View', city: 'Nashik', state: 'Maharashtra', postalCode: '422001' };
  const oversell = await call('POST', '/api/orders', { jar: Kavita, body: { items: [{ variantId: v.id, quantity: 99999 }], shippingAddress: address } });
  check('C4 oversell rejected (4xx, not 500)', oversell.status >= 400 && oversell.status < 500, `status ${oversell.status}`);

  const fractional = await call('POST', '/api/orders', { jar: Kavita, body: { items: [{ variantId: v.id, quantity: 1.5 }], shippingAddress: address } });
  check('C5 fractional quantity rejected', fractional.status >= 400 && fractional.status < 500, `status ${fractional.status}`);

  if (smallStock) {
    const half = Math.floor(smallStock.stockQuantity / 2) + 1;
    const dupLines = await call('POST', '/api/orders', { jar: Kavita, body: { items: [{ variantId: smallStock.id, quantity: half }, { variantId: smallStock.id, quantity: half }], shippingAddress: address } });
    check('C6 duplicate lines cannot bypass stock', dupLines.status >= 400 && dupLines.status < 500, `status ${dupLines.status} (stock=${smallStock.stockQuantity}, lines ${half}+${half})`);
  }

  // own order, customer self-cancel (idempotent, stock restored once)
  const stockBefore = await stockOf(v.id);
  const own = await call('POST', '/api/orders', { jar: Kavita, body: { items: [{ variantId: v.id, quantity: 1 }], shippingAddress: address } });
  const ownNumber = own.json?.data?.orderNumber;
  const cancel1 = await call('POST', `/api/orders/${ownNumber}/cancel`, { jar: Kavita, body: {} });
  const cancel2 = await call('POST', `/api/orders/${ownNumber}/cancel`, { jar: Kavita, body: {} });
  const stockAfterX = await stockOf(v.id);
  check('C7 customer can cancel own order; replay is safe', own.status === 201 && cancel1.status === 200 && [200, 400, 422].includes(cancel2.status), `own=${own.status} c1=${cancel1.status} c2=${cancel2.status}`);
  check('C8 cancelled stock restored exactly once', stockAfterX === stockBefore, `${stockBefore} -> ${stockAfterX}`);

  const cancelOthers = await call('POST', `/api/orders/${RohanOrder.orderNumber}/cancel`, { jar: Kavita, body: {} });
  check('C9 cannot cancel another customers order', cancelOthers.status === 404, `status ${cancelOthers.status}`);

  // FREE_SHIPPING below min => error surfaced, shipping still charged; above min => waived, no double discount (H1)
  const lowVariantId = cheapVariant ? cheapVariant.id : v.id;
  const calcLow = await call('POST', '/api/cart/calculate', { jar: Kavita, body: { items: [{ variantId: lowVariantId, quantity: 1 }], couponCode: 'PROBEFREE' } });
  const low = calcLow.json?.data || {};
  check('C10 free-shipping coupon below min: error shown, shipping charged', !!low.couponError && low.shippingFee > 0 && Math.abs(low.finalPayableAmount - (low.subtotal + low.shippingFee)) < 0.02, `sub=${low.subtotal} ship=${low.shippingFee} payable=${low.finalPayableAmount} err=${low.couponError}`);
  const calcHigh = await call('POST', '/api/cart/calculate', { jar: Kavita, body: { items: [{ variantId: v.id, quantity: 8 }], couponCode: 'PROBEFREE' } });
  const high = calcHigh.json?.data || {};
  check('C11 free-shipping above min: shipping waived once, no double discount', high.subtotal >= 1000 && high.shippingFee === 0 && (high.couponDiscount || 0) === 0 && Math.abs(high.finalPayableAmount - high.subtotal) < 0.02, `sub=${high.subtotal} ship=${high.shippingFee} coup=${high.couponDiscount} payable=${high.finalPayableAmount}`);

  // webhook forgery + replay-safe handling (M14)
  const forged = await call('POST', '/api/webhooks/Razorpay', { body: { event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_fake', id: 'pay_fake' } } } } });
  const forgedLow = await call('POST', '/api/webhooks/razorpay', { body: { event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_fake', id: 'pay_fake' } } } } });
  check('C12 unsigned webhook rejected', [400, 401].includes(forgedLow.status), `status ${forgedLow.status}`);
  const whBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_unknown', id: 'pay_unknown' } } } });
  const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(whBody).digest('hex');
  const wh = await fetch(BASE + '/api/webhooks/razorpay', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-Razorpay-signature': sig }, body: whBody });
  check('C13 validly-signed unknown-order webhook acknowledged safely', wh.status === 200, `status ${wh.status}`);

  const logout = await call('POST', '/api/auth/logout', { jar: Kavita, body: {} });
  const meAfter = await call('GET', '/api/auth/me', { jar: Kavita });
  check('C14 logout clears cookie + session dead', logout.status === 200 && !Kavita.has('shlokveda_session_token') && meAfter.status === 401, `logout=${logout.status} me=${meAfter.status}`);
}

// ============================================================ ADMIN/PLATFORM
{
  const users = await call('GET', '/api/admin/users?search=Rohan@example.com', { jar: admin });
  const list = users.json?.data?.users || [];
  const target = list.find(u => u.email === (String.fromCharCode(114,111,104,97,110) + '@example.com'));
  check('S3 user search actually filters; no passwordHash', users.status === 200 && list.length === 1 && !!target && !JSON.stringify(users.json).includes('passwordHash'), `returned=${list.length} emails=${list.map(u => u.email).join(',')} hash=${JSON.stringify(users.json).includes('passwordHash')}`);

  const meAdm = await call('GET', '/api/auth/me', { jar: admin });
  const selfDeactivate = await call('PATCH', `/api/admin/users/${meAdm.json?.data?.id}`, { jar: admin, body: { isActive: false } });
  check('S4 admin cannot deactivate themselves', selfDeactivate.status >= 400, `status ${selfDeactivate.status}`);

  const off = await call('PATCH', `/api/admin/users/${target.id}`, { jar: admin, body: { isActive: false } });
  const loginOff = await call('POST', '/api/auth/login', { body: { email: 'Rohan@example.com', password: 'probe-password-1' } });
  const on = await call('PATCH', `/api/admin/users/${target.id}`, { jar: admin, body: { isActive: true } });
  const Rohan2 = new Jar();
  const loginOn = await call('POST', '/api/auth/login', { jar: Rohan2, body: { email: 'Rohan@example.com', password: 'probe-password-1' } });
  check('S5 deactivation blocks login immediately; reactivation restores it', off.status === 200 && [401, 403].includes(loginOff.status) && on.status === 200 && loginOn.status === 200, `off=${off.status} loginOff=${loginOff.status} on=${on.status} loginOn=${loginOn.status}`);

  const custAdminApi = await call('GET', '/api/admin/analytics', { jar: Rohan2 });
  check('S6 customer token rejected by admin API', [401, 403].includes(custAdminApi.status), `status ${custAdminApi.status}`);

  const dash = await call('GET', '/api/admin/analytics', { jar: admin });
  check('S7 analytics count only real customers', dash.status === 200 && dash.json?.data?.totalCustomers === 2, `customers=${dash.json?.data?.totalCustomers} (Rohan+Kavita)`);
}

const failed = results.filter(r => !r.pass);
console.log(`\n===== RESULT: ${results.length - failed.length}/${results.length} passed =====`);
if (failed.length) failed.forEach(f => console.log('FAILED:', f.name, '-', f.detail));
process.exit(failed.length ? 1 : 0);
