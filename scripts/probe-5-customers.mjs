#!/usr/bin/env node
/**
 * Deep 5-persona customer probe (complements scripts/retest-customers.mjs).
 *
 * Personas:
 *  A Asha   — new customer: registration rules, boundaries, COD happy path
 *  B Rohit  — returning customer: coupons, identifiers, reviews, cancels
 *  C Meena  — adversarial customer: IDOR, admin surface, forgery, fuzzing
 *  D Vikram — catalogue explorer: categories, sorting, pagination, search
 *  E Sana   — account lifecycle: deactivation, sessions, isolation
 *
 * Any HTTP >= 500 anywhere is recorded as a bug. Requires a running server.
 * Env: BASE_URL (default http://localhost:3000), RETEST_ADMIN_EMAIL,
 *      RETEST_ADMIN_PASSWORD.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.RETEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.RETEST_ADMIN_PASSWORD;
const TS = Date.now().toString().slice(-6);
// Run-unique valid Indian mobiles (registration enforces phone uniqueness,
// so fixed numbers would collide on re-runs against a warm in-memory DB).
const ph = (n) => `98${TS}${String(n).padStart(2, '0')}`;

let passed = 0;
const failures = [];
const serverErrors = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures.push(`${name} — ${detail}`);
    console.log(`FAIL  ${name} — ${detail}`);
  }
}

class Jar {
  constructor() { this.map = new Map(); }
  absorb(res) {
    const list = res.headers.getSetCookie?.() || [];
    for (const c of list) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      if (i > 0) this.map.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  header() {
    return [...this.map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  get(k) { return this.map.get(k); }
  set(k, v) { this.map.set(k, v); }
}

async function call(method, path, { jar, body, headers = {}, rawBody } = {}) {
  const h = { ...headers };
  if (jar) h.cookie = jar.header();
  let payload;
  if (rawBody !== undefined) payload = rawBody;
  else if (body !== undefined) { h['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers: h, body: payload, redirect: 'manual' });
  if (jar) jar.absorb(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  // The cron endpoint intentionally returns 503 when CRON_SECRET is unset (fail-closed).
  if (res.status >= 500 && !(path.startsWith('/api/cron/') && res.status === 503)) serverErrors.push(`${method} ${path} -> ${res.status}`);
  return { status: res.status, json, text, headers: res.headers };
}

async function section(title, fn) {
  console.log(`\n===== ${title} =====`);
  try { await fn(); } catch (err) {
    failures.push(`${title} crashed: ${err.message}`);
    console.log(`FAIL  ${title} crashed — ${err.message}`);
  }
}

const addr = (name, phone) => ({ fullName: name, phone, addressLine1: '17 Lotus Enclave', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' });

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('Set RETEST_ADMIN_EMAIL / RETEST_ADMIN_PASSWORD'); process.exit(2);
  }
  const admin = new Jar();
  const login = await call('POST', '/api/auth/login', { jar: admin, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check('S0 admin login', login.status === 200, `status ${login.status}`);

  const prodRes = await call('GET', '/api/products?limit=100');
  const products = prodRes.json?.data?.products || prodRes.json?.data || [];
  check('S1 product catalogue loads', Array.isArray(products) && products.length > 50, `count=${products.length}`);
  const variants = products.flatMap((p) => (p.variants || []).map((v) => ({ ...v, product: p })));
  const price = (v) => v.sellingPrice ?? v.price ?? 0;
  const stock = (v) => (v.stockQuantity ?? 0) - (v.reservedQuantity ?? 0);
  const cheap = [...variants].filter((v) => stock(v) >= 20).sort((a, b) => price(a) - price(b))[0];
  const mid = variants.find((v) => price(v) >= 400 && price(v) <= 700 && stock(v) >= 10);
  const lowStock = [...variants].filter((v) => stock(v) > 0).sort((a, b) => stock(a) - stock(b))[0];
  const firstProduct = products.find((p) => p.slug);
  console.log(`INFO  cheap=${cheap?.id}@${cheap ? price(cheap) : '?'} mid=${mid?.id}@${mid ? price(mid) : '?'} lowStock=${lowStock?.id} stock=${lowStock ? stock(lowStock) : '?'}`);

  // Coupons for persona B
  const now = new Date();
  const start = new Date(now.getTime() - 864e5).toISOString();
  const end = new Date(now.getTime() + 864e5 * 30).toISOString();
  const pastEnd = new Date(now.getTime() - 864e5).toISOString();
  const mkCoupon = (body) => call('POST', '/api/admin/coupons', { jar: admin, body: { description: 'p5 probe', minOrderValue: 0, startDate: start, endDate: end, isActive: true, ...body } });
  const cPct = await mkCoupon({ code: `P5TEN${TS}`, discountType: 'PERCENTAGE', discountValue: 10, maxDiscountCap: 200 });
  const cFlat = await mkCoupon({ code: `P5FLAT${TS}`, discountType: 'FIXED_AMOUNT', discountValue: 100000 });
  const cExp = await mkCoupon({ code: `P5EXP${TS}`, discountType: 'PERCENTAGE', discountValue: 15, endDate: pastEnd });
  const cOff = await mkCoupon({ code: `P5OFF${TS}`, discountType: 'PERCENTAGE', discountValue: 15, isActive: false });
  check('S2 probe coupons created', [cPct, cFlat, cExp, cOff].every((c) => c.status === 201), `${cPct.status}/${cFlat.status}/${cExp.status}/${cOff.status}`);
  const CPN = { pct: `P5TEN${TS}`, flat: `P5FLAT${TS}`, exp: `P5EXP${TS}`, off: `P5OFF${TS}` };

  const settings0 = await call('GET', '/api/settings');
  const codInitially = settings0.json?.data?.enableCod ?? settings0.json?.data?.business?.enableCod;
  await call('PUT', '/api/admin/settings', { jar: admin, body: { enableCod: true } });
  console.log(`INFO  enableCod initial=${codInitially}`);

  const personas = {};
  const register = async (key, fullName, phone) => {
    const jar = new Jar();
    const email = `p5.${key}.${TS}@example.com`;
    const r = await call('POST', '/api/auth/register', { jar, body: { fullName, email, phone, password: 'probe-password-5' } });
    personas[key] = { jar, email, phone, fullName, regStatus: r.status, userId: r.json?.data?.id || r.json?.data?.user?.id };
    return r;
  };

  /* ================= A: Asha — new customer ================= */
  let ashaOrder = null;
  await section('A Asha (new customer)', async () => {
    const badPw = await call('POST', '/api/auth/register', { body: { fullName: 'Asha Verma', email: `p5.badpw.${TS}@example.com`, password: 'short77' } });
    check('A1 weak password rejected', badPw.status === 422, `status ${badPw.status}`);
    const badEmail = await call('POST', '/api/auth/register', { body: { fullName: 'Asha Verma', email: 'not-an-email', password: 'probe-password-5' } });
    check('A2 malformed email rejected', badEmail.status === 422, `status ${badEmail.status}`);
    const badPhone = await call('POST', '/api/auth/register', { body: { fullName: 'Asha Verma', email: `p5.badph.${TS}@example.com`, phone: '12345', password: 'probe-password-5' } });
    check('A3 short phone rejected', badPhone.status === 422, `status ${badPhone.status}`);
    const phone5 = await call('POST', '/api/auth/register', { body: { fullName: 'Asha Verma', email: `p5.ph5.${TS}@example.com`, phone: '5876543210', password: 'probe-password-5' } });
    check('A4 phone starting with 5 rejected (Indian mobile rule)', phone5.status === 422, `status ${phone5.status}`);
    const longName = await call('POST', '/api/auth/register', { body: { fullName: 'A'.repeat(600), email: `p5.long.${TS}@example.com`, phone: ph(9), password: 'probe-password-5' } });
    check('A5 600-char name does not 500', longName.status < 500, `status ${longName.status}`);

    const reg = await register('asha', 'Asha Verma', ph(1));
    const A = personas.asha;
    check('A6 register succeeds with session cookie', reg.status === 201 && !!A.jar.get('shlokveda_session_token'), `status ${reg.status}`);
    const dupUpper = await call('POST', '/api/auth/register', { body: { fullName: 'Asha Clone', email: A.email.toUpperCase(), password: 'probe-password-6' } });
    check('A7 duplicate email (different case) rejected', dupUpper.status === 409, `status ${dupUpper.status}`);

    // Free-shipping boundary + arithmetic via calculate
    const calcFor = (items, couponCode) => call('POST', '/api/cart/calculate', { jar: A.jar, body: { items, ...(couponCode ? { couponCode } : {}) } });
    const c1 = await calcFor([{ variantId: cheap.id, quantity: 1 }]);
    const d1 = c1.json?.data || {};
    console.log(`INFO  calc keys: ${Object.keys(d1).join(',')}`);
    const threshold = d1.freeShippingThreshold ?? 499;
    const p = price(cheap);
    const qBelow = Math.max(1, Math.floor((threshold - 1) / p));
    const qAbove = Math.ceil((threshold + 1) / p);
    const below = (await calcFor([{ variantId: cheap.id, quantity: qBelow }])).json?.data || {};
    const above = (await calcFor([{ variantId: cheap.id, quantity: qAbove }])).json?.data || {};
    check('A8 shipping charged below threshold', below.subtotal < threshold && below.shippingFee > 0, `subtotal=${below.subtotal} fee=${below.shippingFee} thr=${threshold}`);
    check('A9 shipping free above threshold', above.subtotal >= threshold && above.shippingFee === 0, `subtotal=${above.subtotal} fee=${above.shippingFee}`);
    const identityOk = [below, above].every((d) => Math.abs((d.finalPayableAmount ?? -1) - (d.subtotal - (d.couponDiscount || 0) - (d.discountAmount || 0) + d.shippingFee + (d.taxAmount || 0))) < 0.02);
    check('A10 payable arithmetic identity holds', identityOk, `below.pay=${below.finalPayableAmount} above.pay=${above.finalPayableAmount}`);

    // Quantity edges on calculate
    const q0 = await calcFor([{ variantId: cheap.id, quantity: 0 }]);
    check('A11 quantity 0 rejected on calculate', q0.status >= 400 && q0.status < 500, `status ${q0.status}`);
    const qNeg = await calcFor([{ variantId: cheap.id, quantity: -3 }]);
    check('A12 negative quantity rejected', qNeg.status >= 400 && qNeg.status < 500, `status ${qNeg.status}`);
    const qFloat = await calcFor([{ variantId: cheap.id, quantity: 1.5 }]);
    check('A13 fractional quantity rejected', qFloat.status >= 400 && qFloat.status < 500, `status ${qFloat.status}`);
    const qOver = await calcFor([{ variantId: lowStock.id, quantity: stock(lowStock) + 5 }]);
    check('A14 over-stock quantity handled (reject or clamp, never 500)', qOver.status < 500, `status ${qOver.status} stock=${stock(lowStock)}`);

    // Client price tampering must be ignored
    const tamper = await call('POST', '/api/cart/calculate', { jar: A.jar, body: { items: [{ variantId: mid.id, quantity: 1, price: 1, sellingPrice: 1, totalPrice: 1 }] } });
    const td = tamper.json?.data || {};
    check('A15 client-supplied prices ignored', tamper.status === 200 && td.subtotal === price(mid), `subtotal=${td.subtotal} expected=${price(mid)}`);

    // COD order validation + happy path
    const badPin = await call('POST', '/api/orders', { jar: A.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: { ...addr('Asha Verma', A.phone), postalCode: '1234' } } });
    check('A16 bad PIN rejected with field errors', badPin.status === 422 && /pincode|postalCode|PIN/i.test(JSON.stringify(badPin.json)), `status ${badPin.status}`);
    const badPhoneOrder = await call('POST', '/api/orders', { jar: A.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: addr('Asha Verma', '1234567890') } });
    check('A17 bad phone rejected on order', badPhoneOrder.status === 422, `status ${badPhoneOrder.status}`);
    const okOrder = await call('POST', '/api/orders', { jar: A.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }, { variantId: mid.id, quantity: 1 }], shippingAddress: addr('Asha Verma', A.phone) } });
    ashaOrder = okOrder.json?.data;
    check('A18 COD order placed', okOrder.status === 201 && !!ashaOrder?.orderNumber, `status ${okOrder.status} order=${ashaOrder?.orderNumber}`);
    const expectedTotal = (() => { const sub = price(cheap) + price(mid); return sub >= threshold ? sub : sub + (below.shippingFee || 0); })();
    check('A19 order total matches catalogue math', Math.abs((ashaOrder?.totalAmount ?? -1) - expectedTotal) < 0.02, `total=${ashaOrder?.totalAmount} expected=${expectedTotal}`);

    const second = await call('POST', '/api/orders', { jar: A.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: addr('Asha Verma', A.phone) } });
    const list = await call('GET', '/api/orders?limit=100', { jar: A.jar });
    const mine = list.json?.data?.orders || [];
    const newestFirst = mine.length >= 2 && mine[0].orderNumber === second.json?.data?.orderNumber;
    check('A20 order history is newest-first and only mine', mine.length === 2 && newestFirst, `count=${mine.length} first=${mine[0]?.orderNumber}`);

    const confirm = await call('GET', `/order-confirmation?orderNumber=${ashaOrder.orderNumber}`, { jar: A.jar });
    check('A21 owner can open confirmation page', confirm.status === 200 && confirm.text.includes(ashaOrder.orderNumber) && confirm.text.includes('Asha Verma'), `status ${confirm.status}`);
  });

  /* ================= B: Rohit — returning customer ================= */
  await section('B Rohit (coupons, reviews, cancels)', async () => {
    await register('rohit', 'Rohit Nair', ph(2));
    const B = personas.rohit;
    const upper = new Jar();
    const loginUpper = await call('POST', '/api/auth/login', { jar: upper, body: { email: B.email.toUpperCase(), password: 'probe-password-5' } });
    check('B1 login is email case-insensitive', loginUpper.status === 200, `status ${loginUpper.status}`);
    const byPhone = new Jar();
    const loginPhone = await call('POST', '/api/auth/login', { jar: byPhone, body: { email: B.phone, password: 'probe-password-5' } });
    check('B2 login with mobile number works (error copy promises email/mobile)', loginPhone.status === 200, `status ${loginPhone.status}`);
    const byPhone91 = new Jar();
    const loginPhone91 = await call('POST', '/api/auth/login', { jar: byPhone91, body: { email: `+91${B.phone}`, password: 'probe-password-5' } });
    console.log(`INFO  +91-prefixed mobile login status=${loginPhone91.status}`);

    const calc = (couponCode) => call('POST', '/api/cart/calculate', { jar: B.jar, body: { items: [{ variantId: mid.id, quantity: 1 }], couponCode } });
    const exp = await calc(CPN.exp);
    check('B3 expired coupon gives no discount at calculate', exp.status === 200 && (exp.json?.data?.couponDiscount || 0) === 0, `status ${exp.status} discount=${exp.json?.data?.couponDiscount}`);
    const off = await calc(CPN.off);
    check('B4 inactive coupon gives no discount at calculate', off.status === 200 && (off.json?.data?.couponDiscount || 0) === 0, `status ${off.status} discount=${off.json?.data?.couponDiscount}`);
    const expOrder = await call('POST', '/api/orders', { jar: B.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], couponCode: CPN.exp, shippingAddress: addr('Rohit Nair', B.phone) } });
    check('B4b expired coupon strictly rejected at order placement', expOrder.status === 422, `status ${expOrder.status} msg=${expOrder.json?.error?.message || ''}`);
    const flat = await calc(CPN.flat);
    const fd = flat.json?.data || {};
    check('B5 oversized flat coupon cannot make payable negative', flat.status === 200 && (fd.finalPayableAmount ?? -1) >= 0, `payable=${fd.finalPayableAmount} discount=${fd.couponDiscount} subtotal=${fd.subtotal}`);
    const validate = await call('POST', '/api/coupons/validate', { jar: B.jar, body: { code: CPN.pct, subtotal: price(mid) } });
    console.log(`INFO  coupons/validate status=${validate.status} body=${JSON.stringify(validate.json)?.slice(0, 160)}`);

    // Reviews
    const anon = await call('POST', '/api/reviews', { body: { productId: firstProduct.id, rating: 5, title: 'x', comment: 'y' } });
    check('B6 anonymous review rejected', anon.status === 401, `status ${anon.status}`);
    const r0 = await call('POST', '/api/reviews', { jar: B.jar, body: { productId: firstProduct.id, rating: 0, title: 'x', comment: 'y' } });
    check('B7 rating 0 rejected', r0.status === 422, `status ${r0.status}`);
    const r6 = await call('POST', '/api/reviews', { jar: B.jar, body: { productId: firstProduct.id, rating: 6, title: 'x', comment: 'y' } });
    check('B8 rating 6 rejected', r6.status === 422, `status ${r6.status}`);
    const rGhost = await call('POST', '/api/reviews', { jar: B.jar, body: { productId: 'does-not-exist', rating: 5, title: 'x', comment: 'y' } });
    check('B9 review for missing product rejected cleanly', rGhost.status >= 400 && rGhost.status < 500, `status ${rGhost.status}`);
    const xss = await call('POST', '/api/reviews', { jar: B.jar, body: { productId: firstProduct.id, rating: 5, title: '<script>alert(1)</script>', comment: '"><img src=x onerror=alert(1)>' } });
    check('B10 XSS review submission handled', xss.status === 201 || xss.status === 200, `status ${xss.status}`);
    const pdp = await call('GET', `/product/${firstProduct.slug}`);
    check('B11 PDP escapes review payload (no raw tag injection)', !pdp.text.includes('<script>alert(1)') && !pdp.text.includes('<img src=x onerror'), `pdp status ${pdp.status}`);
    await call('POST', '/api/reviews', { jar: B.jar, body: { productId: firstProduct.id, rating: 5, title: 'Good quality', comment: 'Packing and delivery were fine.' } });

    // Cancel rules
    const o1 = await call('POST', '/api/orders', { jar: B.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: addr('Rohit Nair', B.phone) } });
    const on = o1.json?.data?.orderNumber;
    const c1r = await call('POST', `/api/orders/${encodeURIComponent(on)}/cancel`, { jar: B.jar });
    const c2r = await call('POST', `/api/orders/${encodeURIComponent(on)}/cancel`, { jar: B.jar });
    check('B12 double cancel is idempotent (no 500, no double refund path)', c1r.status === 200 && c2r.status < 500, `first=${c1r.status} second=${c2r.status}`);
    const after = await call('GET', `/api/orders/${encodeURIComponent(on)}`, { jar: B.jar });
    check('B13 cancelled order stays CANCELLED', (after.json?.data?.status || after.json?.data?.orderStatus) === 'CANCELLED', `status=${after.json?.data?.status}`);
  });

  /* ================= C: Meena — adversarial ================= */
  await section('C Meena (adversarial)', async () => {
    await register('meena', 'Meena Iyer', ph(3));
    const C = personas.meena;
    const A = personas.asha;

    const idorApi = await call('GET', `/api/orders/${encodeURIComponent(ashaOrder.orderNumber)}`, { jar: C.jar });
    check('C1 IDOR: other customer order via API denied', idorApi.status >= 400 && idorApi.status < 500 && !JSON.stringify(idorApi.json || {}).includes('Lotus Enclave'), `status ${idorApi.status}`);
    const idorPage = await call('GET', `/orders/${encodeURIComponent(ashaOrder.orderNumber)}`, { jar: C.jar });
    check('C2 IDOR: tracking page leaks no address/name', !idorPage.text.includes('Lotus Enclave') && !idorPage.text.includes('Asha Verma'), `status ${idorPage.status}`);
    const idorConfirmId = await call('GET', `/order-confirmation?orderId=${encodeURIComponent(ashaOrder.id)}`, { jar: C.jar });
    check('C3 IDOR: confirmation by orderId leaks nothing', !idorConfirmId.text.includes('Lotus Enclave') && !idorConfirmId.text.includes('Asha Verma'), `status ${idorConfirmId.status}`);
    const idorCancel = await call('POST', `/api/orders/${encodeURIComponent(ashaOrder.orderNumber)}/cancel`, { jar: C.jar });
    check('C4 cannot cancel another customer order', idorCancel.status >= 400 && idorCancel.status < 500, `status ${idorCancel.status}`);

    const adminTargets = [
      ['GET', '/api/admin/orders'], ['GET', '/api/admin/users'], ['GET', '/api/admin/audit-logs'],
      ['POST', '/api/admin/coupons'], ['PUT', '/api/admin/settings'], ['POST', '/api/admin/inventory/adjust'],
      ['GET', '/api/admin/analytics'],
    ];
    let adminOk = true; const adminDetail = [];
    for (const [m, p] of adminTargets) {
      const r = await call(m, p, { jar: C.jar, body: m === 'GET' ? undefined : {} });
      adminDetail.push(`${p}:${r.status}`);
      if (![401, 403].includes(r.status)) adminOk = false;
    }
    check('C5 admin API surface denied to customers', adminOk, adminDetail.join(' '));
    const adminPage = await call('GET', '/admin', { jar: C.jar });
    check('C6 admin page not served to customer', adminPage.status !== 200 || !/Admin Dashboard|Total Revenue|Audit Logs/.test(adminPage.text), `status ${adminPage.status}`);

    const forged = new Jar();
    const tok = C.jar.get('shlokveda_session_token') || '';
    const flipped = tok.slice(0, 12) + (tok[12] === 'A' ? 'B' : 'A') + tok.slice(13);
    forged.set('shlokveda_session_token', flipped);
    const meForged = await call('GET', '/api/auth/me', { jar: forged });
    check('C7 tampered session token rejected', meForged.status === 401, `status ${meForged.status}`);

    const payFuzz = [
      ['create-order {}', await call('POST', '/api/payments/create-order', { jar: C.jar, body: {} })],
      ['create-order empty items', await call('POST', '/api/payments/create-order', { jar: C.jar, body: { customerName: 'Meena Iyer', customerEmail: C.email, customerPhone: C.phone, items: [], shippingAddress: addr('Meena Iyer', C.phone) } })],
      ['verify {}', await call('POST', '/api/payments/verify', { jar: C.jar, body: {} })],
      ['verify fake ids', await call('POST', '/api/payments/verify', { jar: C.jar, body: { orderId: 'x', razorpayOrderId: 'order_fake', razorpayPaymentId: 'pay_fake', razorpaySignature: 'deadbeef' } })],
      ['legacy order {}', await call('POST', '/api/payments/razorpay/order', { jar: C.jar, body: {} })],
      ['legacy verify fake', await call('POST', '/api/payments/razorpay/verify', { jar: C.jar, body: { razorpayOrderId: 'order_fake', razorpayPaymentId: 'pay_fake', razorpaySignature: 'deadbeef' } })],
    ];
    for (const [name, r] of payFuzz) {
      check(`C8 payment fuzz clean: ${name}`, r.status >= 400 && r.status < 500, `status ${r.status}`);
    }
    const createValid = await call('POST', '/api/payments/create-order', { jar: C.jar, body: { customerName: 'Meena Iyer', customerEmail: C.email, customerPhone: C.phone, items: [{ productVariantId: cheap.id, quantity: 1 }], shippingAddress: addr('Meena Iyer', C.phone) } });
    check('C9 unconfigured gateway fails closed with clean 4xx', createValid.status >= 400 && createValid.status < 500, `status ${createValid.status} msg=${createValid.json?.error?.message || ''}`);

    const wh1 = await call('POST', '/api/webhooks/razorpay', { rawBody: JSON.stringify({ event: 'payment.captured' }), headers: { 'content-type': 'application/json' } });
    check('C10 webhook without signature rejected', wh1.status === 400, `status ${wh1.status}`);
    const wh2 = await call('POST', '/api/webhooks/razorpay', { rawBody: '{broken json', headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'a'.repeat(64) } });
    check('C11 webhook malformed body never 500s', wh2.status < 500, `status ${wh2.status}`);

    const fuzzTargets = ['/api/orders', '/api/cart/calculate', '/api/reviews', '/api/newsletter', '/api/auth/login', '/api/payments/create-order'];
    let fuzzOk = true; const fuzzDetail = [];
    for (const p of fuzzTargets) {
      const r = await call('POST', p, { jar: C.jar, rawBody: '{oops', headers: { 'content-type': 'application/json' } });
      fuzzDetail.push(`${p}:${r.status}`);
      if (r.status >= 500) fuzzOk = false;
    }
    check('C12 malformed JSON never 500s', fuzzOk, fuzzDetail.join(' '));

    const settings = await call('GET', '/api/settings');
    const settingsStr = JSON.stringify(settings.json || {});
    check('C13 public settings expose no secrets', !/secret|password|private[_-]?key/i.test(settingsStr) && !(process.env.RETEST_WEBHOOK_SECRET && settingsStr.includes(process.env.RETEST_WEBHOOK_SECRET)), `keys=${Object.keys(settings.json?.data || {}).join(',').slice(0, 120)}`);
    const cronGet = await call('GET', '/api/cron/expire-orders');
    const cronPost = await call('POST', '/api/cron/expire-orders', { body: {} });
    check('C14 cron endpoint locked without secret', [401, 403, 405, 503].includes(cronGet.status) && [401, 403, 405, 503].includes(cronPost.status), `GET=${cronGet.status} POST=${cronPost.status}`);

    const nlBad = await call('POST', '/api/newsletter', { body: { email: 'nope' } });
    check('C15 newsletter rejects bad email', nlBad.status === 422, `status ${nlBad.status}`);
    const nlOk = await call('POST', '/api/newsletter', { body: { email: `p5.news.${TS}@example.com` } });
    const nlDup = await call('POST', '/api/newsletter', { body: { email: `p5.news.${TS}@example.com` } });
    check('C16 newsletter subscribe + duplicate safe', nlOk.status < 400 && nlDup.status < 500, `first=${nlOk.status} dup=${nlDup.status}`);
    const nlGet = await call('GET', '/api/newsletter');
    check('C17 subscriber list not exposed via GET', [404, 405].includes(nlGet.status), `status ${nlGet.status}`);
  });

  /* ================= D: Vikram — catalogue explorer ================= */
  await section('D Vikram (catalogue explorer)', async () => {
    const cats = await call('GET', '/api/catalog/categories');
    const catList = cats.json?.data || [];
    check('D1 categories API returns 8 categories', catList.length === 8, `count=${catList.length}`);
    let pagesOk = true; const pageDetail = [];
    for (const c of catList) {
      const prods = await call('GET', `/api/catalog/products?category=${c.slug}&limit=100`);
      const expected = prods.json?.data?.total ?? (prods.json?.data?.products || []).length;
      const page = await call('GET', `/category/${c.slug}`);
      const badge = new RegExp(`${expected} Classical Formulation`).test(page.text.replace(/<!-- -->/g, ''));
      pageDetail.push(`${c.slug}:${page.status}/${expected}${badge ? '' : '/BADGE?'}`);
      if (page.status !== 200 || !badge) pagesOk = false;
    }
    check('D2 every category page renders with correct live count', pagesOk, pageDetail.join(' '));

    const unknown = await call('GET', '/category/not-a-real-category');
    check('D3 unknown category slug gives 404 experience', (unknown.status === 404 || /could not be found/i.test(unknown.text)) && !unknown.text.includes('Add to Cart'), `status ${unknown.status}`);
    const cased = await call('GET', '/category/Personal-Care');
    console.log(`INFO  /category/Personal-Care status=${cased.status} (case sensitivity)`);

    const priceSeq = async (qs) => {
      const r = await call('GET', `/api/catalog/products?limit=100&${qs}`);
      return (r.json?.data?.products || []).map((p) => (p.variants?.find((v) => v.isDefault) || p.variants?.[0])?.sellingPrice ?? p.price ?? 0);
    };
    let lowSeq = await priceSeq('sort=price-low');
    let param = 'sort';
    if (lowSeq.length > 2 && lowSeq[0] > lowSeq[lowSeq.length - 1]) { lowSeq = await priceSeq('sortBy=price-low'); param = 'sortBy'; }
    const highSeq = await priceSeq(`${param}=price-high`);
    const mono = (arr, dir) => arr.every((v, i) => i === 0 || (dir === 'asc' ? v >= arr[i - 1] : v <= arr[i - 1]));
    check('D4 catalogue price-low sort is monotonic', lowSeq.length > 10 && mono(lowSeq, 'asc'), `param=${param} first=${lowSeq[0]} last=${lowSeq[lowSeq.length - 1]}`);
    check('D5 catalogue price-high sort is monotonic', highSeq.length > 10 && mono(highSeq, 'desc'), `first=${highSeq[0]} last=${highSeq[highSeq.length - 1]}`);

    const beyond = await call('GET', '/category/syrups-juices?page=99');
    check('D6 page beyond last does not 500', beyond.status < 500, `status ${beyond.status} showsEmpty=${beyond.text.includes('No products currently')}`);
    const pageAbc = await call('GET', '/category/syrups-juices?page=abc');
    check('D7 non-numeric page falls back safely', pageAbc.status === 200, `status ${pageAbc.status}`);

    const abuse = [
      '/api/catalog/products?limit=0', '/api/catalog/products?limit=-5', '/api/catalog/products?limit=10000',
      '/api/catalog/products?page=-1', '/api/catalog/products?search=' + encodeURIComponent('%_\\'),
      '/api/catalog/products?search=' + 'x'.repeat(5000), '/api/catalog/products?category=ghost',
      '/api/products?limit=abc',
    ];
    let abuseOk = true; const abuseDetail = [];
    for (const p of abuse) {
      const r = await call('GET', p);
      abuseDetail.push(`${r.status}`);
      if (r.status >= 500) abuseOk = false;
    }
    check('D8 catalogue query abuse never 500s', abuseOk, abuseDetail.join(' '));

    const legacy = await call('GET', '/api/products?limit=5');
    check('D9 public products API hides costPrice', !JSON.stringify(legacy.json || {}).includes('costPrice'), `status ${legacy.status}`);
    const pdpApi = await call('GET', `/api/catalog/products/${firstProduct.slug}`);
    check('D10 product detail API hides costPrice', !JSON.stringify(pdpApi.json || {}).includes('costPrice'), `status ${pdpApi.status}`);
    const ghostPdp = await call('GET', '/product/definitely-not-a-product');
    check('D11 unknown product slug gives 404 experience', (ghostPdp.status === 404 || /could not be found/i.test(ghostPdp.text)) && !ghostPdp.text.includes('Add to Cart'), `status ${ghostPdp.status}`);
  });

  /* ================= E: Sana — account lifecycle ================= */
  await section('E Sana (account lifecycle)', async () => {
    await register('sana', 'Sana Sheikh', ph(4));
    const E = personas.sana;
    const me0 = await call('GET', '/api/auth/me', { jar: E.jar });
    check('E1 fresh session valid', me0.status === 200, `status ${me0.status}`);
    const ord = await call('POST', '/api/orders', { jar: E.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: addr('Sana Sheikh', E.phone) } });
    check('E2 Sana places an order', ord.status === 201, `status ${ord.status}`);
    const sanaOrderNumber = ord.json?.data?.orderNumber;

    const search = await call('GET', `/api/admin/users?search=${encodeURIComponent(E.email)}`, { jar: admin });
    const found = (search.json?.data?.users || search.json?.data || [])[0] || (search.json?.data?.items || [])[0];
    const sanaId = E.userId || found?.id;
    check('E3 admin can locate Sana', !!sanaId, `id=${sanaId}`);
    const deact = await call('PATCH', `/api/admin/users/${sanaId}`, { jar: admin, body: { isActive: false } });
    check('E4 admin deactivates Sana', deact.status === 200, `status ${deact.status}`);
    const meMid = await call('GET', '/api/auth/me', { jar: E.jar });
    check('E5 deactivation revokes live session', [401, 403].includes(meMid.status), `status ${meMid.status}`);
    const orderMid = await call('POST', '/api/orders', { jar: E.jar, body: { items: [{ variantId: cheap.id, quantity: 1 }], shippingAddress: addr('Sana Sheikh', E.phone) } });
    check('E6 deactivated session cannot order', [401, 403].includes(orderMid.status), `status ${orderMid.status}`);
    const loginBlocked = await call('POST', '/api/auth/login', { body: { email: E.email, password: 'probe-password-5' } });
    check('E7 deactivated login blocked', loginBlocked.status === 403, `status ${loginBlocked.status}`);
    await call('PATCH', `/api/admin/users/${sanaId}`, { jar: admin, body: { isActive: true } });
    const jar2 = new Jar();
    const loginOk = await call('POST', '/api/auth/login', { jar: jar2, body: { email: E.email, password: 'probe-password-5' } });
    check('E8 reactivation restores login', loginOk.status === 200, `status ${loginOk.status}`);
    const herOrders = await call('GET', '/api/orders?limit=100', { jar: jar2 });
    const hers = herOrders.json?.data?.orders || [];
    check('E9 order history contains only her order', hers.length === 1 && hers[0].orderNumber === sanaOrderNumber, `count=${hers.length}`);

    await call('POST', '/api/auth/logout', { jar: jar2 });
    const afterLogout = await call('GET', '/api/auth/me', { jar: jar2 });
    check('E10 logout invalidates session', afterLogout.status === 401, `status ${afterLogout.status}`);
  });

  // Restore COD setting if we changed it
  if (codInitially === false) {
    await call('PUT', '/api/admin/settings', { jar: admin, body: { enableCod: false } });
    console.log('INFO  enableCod restored to false');
  }

  console.log(`\n===== RESULT: ${passed}/${passed + failures.length} passed =====`);
  if (serverErrors.length) {
    console.log('SERVER ERRORS (>=500):');
    for (const s of serverErrors) console.log(`  ${s}`);
  }
  if (failures.length) {
    console.log('FAILURES:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => { console.error('probe crashed:', err); process.exit(2); });
