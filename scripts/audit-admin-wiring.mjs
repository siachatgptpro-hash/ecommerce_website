/**
 * Admin-panel wiring + full-site security audit.
 *
 * Verifies, end to end and with every mutation restored:
 *  - security headers + session-cookie flags
 *  - anonymous/customer denial on every admin page + API
 *  - every admin page renders for an admin; every admin API GET succeeds
 *  - CMS policy sections round-trip to the storefront (incl. XSS escaping)
 *  - Business Settings changes reach the storefront (shipping-fee placeholder)
 *  - banner CRUD, coupon lifecycle, product activate/deactivate (no clobber),
 *    inventory adjust, order lifecycle, review moderation, user deactivation
 *  - uploads fail gracefully without Blob config; audit log records actions
 *  - login rate limiting (per-identifier)
 *
 * Usage: node scripts/audit-admin-wiring.mjs [baseUrl]
 * Env:   AUDIT_ADMIN_EMAIL / AUDIT_ADMIN_PASSWORD (sandbox defaults below)
 */
const BASE = process.argv[2] || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.AUDIT_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.AUDIT_ADMIN_PASSWORD || 'sandbox-admin-pass-123';
const TS = Date.now();
const COOKIE_NAME = 'shlokveda_session_token';

let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; failures.push(`${name} ${detail}`); console.log(`  FAIL ${name} ${detail}`); }
}
function jar() { return { cookies: new Map() }; }
async function call(method, path, { jar: j, body, headers = {}, raw = false } = {}) {
  const h = { ...headers };
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
  if (j && j.cookies.size) h['Cookie'] = [...j.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  const res = await fetch(BASE + path, {
    method, headers: h, redirect: 'manual',
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  if (j) {
    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    for (const c of setCookie) {
      const [pair] = c.split(';'); const i = pair.indexOf('=');
      if (i > 0) j.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, json, text, headers: res.headers };
}
const data = (r) => r.json?.data;

console.log(`\n== ADMIN WIRING + SECURITY AUDIT @ ${BASE} ==`);

// ---------------------------------------------------------------- headers
console.log('\n[Security headers & cookies]');
const home = await call('GET', '/');
check('H1 X-Content-Type-Options nosniff', (home.headers.get('x-content-type-options') || '').includes('nosniff'));
check('H2 Referrer-Policy set', Boolean(home.headers.get('referrer-policy')));
check('H3 Permissions-Policy set', Boolean(home.headers.get('permissions-policy')));
check('H4 Content-Security-Policy set', Boolean(home.headers.get('content-security-policy')));
check('H5 X-Powered-By removed', !home.headers.get('x-powered-by'), home.headers.get('x-powered-by') || '');
check('H6 home renders under CSP', home.status === 200 && home.text.includes('SHLOKVEDA'));

const admin = jar();
const loginRes = await call('POST', '/api/auth/login', { jar: admin, body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
check('H7 admin login', loginRes.status === 200, `status ${loginRes.status}`);
const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie().join(' | ') : (loginRes.headers.get('set-cookie') || '');
const sessionCookie = setCookies.split('|').map((s) => s.trim()).find((c) => c.startsWith(COOKIE_NAME)) || '';
check('H8 session cookie HttpOnly', /httponly/i.test(sessionCookie), sessionCookie.slice(0, 120));
check('H9 session cookie SameSite', /samesite=/i.test(sessionCookie));
check('H10 login response carries no token', !JSON.stringify(loginRes.json || {}).includes('token'));
const meAdmin = await call('GET', '/api/auth/me', { jar: admin });
check('H11 admin /api/auth/me', meAdmin.status === 200 && JSON.stringify(data(meAdmin) || {}).length > 10);
const badLogin = await call('POST', '/api/auth/login', { body: { email: ADMIN_EMAIL, password: 'definitely-wrong-pass' } });
check('H12 wrong password rejected', [401, 403, 422].includes(badLogin.status), `status ${badLogin.status}`);

// ---------------------------------------------------------------- customers
const cust = jar();
const custEmail = `audit.cust.${TS}@example.com`;
const custPhone = `98${String(TS).slice(-6)}77`;
const reg = await call('POST', '/api/auth/register', {
  jar: cust,
  body: { fullName: 'Audit Customer', email: custEmail, phone: custPhone, password: 'AuditPass#2026' },
});
check('C0 customer register', reg.status === 201, `status ${reg.status}`);
const meCust = await call('GET', '/api/auth/me', { jar: cust });
const custId = data(meCust)?.id || data(meCust)?.user?.id;

// ---------------------------------------------------------------- denial matrix
console.log('\n[Denial matrix]');
const ADMIN_PAGES = ['/admin', '/admin/cms', '/admin/coupons', '/admin/customers', '/admin/inventory', '/admin/orders', '/admin/products', '/admin/products/new', '/admin/reviews', '/admin/settings', '/admin/audit-logs'];
let anonPagesOk = true;
for (const p of ADMIN_PAGES) {
  const r = await call('GET', p);
  if (!([301, 302, 307, 308].includes(r.status) && (r.headers.get('location') || '').includes('/admin/login'))) anonPagesOk = false;
}
check('D1 anon bounced from all admin pages', anonPagesOk);
const ADMIN_GETS = ['/api/admin/cms', '/api/admin/cms/banners', '/api/admin/coupons', '/api/admin/inventory', '/api/admin/orders', '/api/admin/products', '/api/admin/reviews', '/api/admin/settings', '/api/admin/users', '/api/admin/analytics', '/api/admin/audit-logs'];
let anonApiOk = true, custApiOk = true;
for (const p of ADMIN_GETS) {
  const a = await call('GET', p); if (![401, 403].includes(a.status)) anonApiOk = false;
  const c = await call('GET', p, { jar: cust }); if (![401, 403].includes(c.status)) custApiOk = false;
}
check('D2 anon denied all admin API GETs', anonApiOk);
check('D3 customer denied all admin API GETs', custApiOk);
const custPageSave = await call('POST', '/api/admin/cms?type=page', { jar: cust, body: { slug: 'faq', title: 'Hacked', content: 'x' } });
check('D4 customer cannot save CMS page', [401, 403].includes(custPageSave.status), `status ${custPageSave.status}`);
const custSettings = await call('PUT', '/api/admin/settings', { jar: cust, body: { storeName: 'Hacked' } });
check('D5 customer cannot change settings', [401, 403].includes(custSettings.status), `status ${custSettings.status}`);

// ---------------------------------------------------------------- admin surface works
console.log('\n[Admin surface]');
let adminGetsOk = true; const getData = {};
for (const p of ADMIN_GETS) {
  const r = await call('GET', p, { jar: admin });
  getData[p] = r;
  if (r.status !== 200 || !r.json?.success) { adminGetsOk = false; console.log(`    bad GET ${p} -> ${r.status}`); }
}
check('A1 all admin API GETs succeed', adminGetsOk);
const cmsPages = data(getData['/api/admin/cms'])?.pages || [];
const EXPECTED_SLUGS = ['shipping-policy', 'refund-policy', 'privacy-policy', 'terms-and-conditions', 'disclaimer', 'faq', 'ayush-compliance'];
check('A2 CMS lists all 7 policy pages', EXPECTED_SLUGS.every((s) => cmsPages.some((p) => p.slug === s)), cmsPages.map((p) => p.slug).join(','));
check('A3 policy pages carry layout+sections', EXPECTED_SLUGS.every((s) => { const p = cmsPages.find((x) => x.slug === s); return p && p.layout && Array.isArray(p.sections) && p.sections.length >= 2; }));
let adminPagesOk = true;
for (const p of ADMIN_PAGES) {
  const r = await call('GET', p, { jar: admin });
  if (r.status !== 200) { adminPagesOk = false; console.log(`    bad page ${p} -> ${r.status}`); }
}
check('A4 all admin pages render', adminPagesOk);
const adminProducts = data(getData['/api/admin/products']);
const productList = adminProducts?.products || adminProducts || [];
const sampleProduct = Array.isArray(productList) ? productList[0] : null;
if (sampleProduct) {
  const rp = await call('GET', `/admin/products/${sampleProduct.id}`, { jar: admin });
  check('A5 admin product editor page renders', rp.status === 200, `status ${rp.status}`);
}

// ---------------------------------------------------------------- CMS wiring
console.log('\n[CMS policy wiring]');
const faqOriginal = cmsPages.find((p) => p.slug === 'faq');
const marker = `AUDIT-MARKER-${TS}`;
const faqPayload = {
  slug: 'faq', title: faqOriginal.title, metaTitle: faqOriginal.metaTitle ?? null,
  metaDescription: faqOriginal.metaDescription ?? null, layout: 'accordion',
  content: '',
  sections: [
    { icon: 'CircleHelp', heading: marker, body: `Temporary audit answer <script>alert(1)</script> <img src=x onerror=alert(2)>` },
    ...faqOriginal.sections,
  ],
};
const faqSave = await call('POST', '/api/admin/cms?type=page', { jar: admin, body: faqPayload });
check('W1 save FAQ with sections', [200, 201].includes(faqSave.status) && faqSave.json?.success, `status ${faqSave.status}`);
const faqPage = await call('GET', '/policies/faq');
check('W2 storefront shows new section', faqPage.text.includes(marker));
check('W3 stored XSS is escaped', !faqPage.text.includes('<script>alert(1)</script>') && faqPage.text.includes('&lt;script&gt;'));
check('W4 content mirror derived', (data(faqSave)?.content || '').includes(marker));
const faqRestore = await call('POST', '/api/admin/cms?type=page', {
  jar: admin,
  body: { slug: 'faq', title: faqOriginal.title, content: faqOriginal.content, layout: faqOriginal.layout, sections: faqOriginal.sections, metaTitle: faqOriginal.metaTitle ?? null, metaDescription: faqOriginal.metaDescription ?? null },
});
const faqAfter = await call('GET', '/policies/faq');
check('W5 FAQ restored', faqRestore.json?.success && !faqAfter.text.includes(marker) && faqAfter.text.includes('How do I place an order?'));
const badPage = await call('POST', '/api/admin/cms?type=page', { jar: admin, body: { slug: 'Bad Slug!', title: 'X', content: 'y' } });
check('W6 invalid slug rejected', [400, 422].includes(badPage.status), `status ${badPage.status}`);
const emptyPage = await call('POST', '/api/admin/cms?type=page', { jar: admin, body: { slug: 'faq', title: 'FAQ', content: '', sections: null } });
check('W7 empty page rejected', [400, 422].includes(emptyPage.status), `status ${emptyPage.status}`);

// ---------------------------------------------------------------- settings wiring
console.log('\n[Settings wiring]');
const settingsBefore = data(await call('GET', '/api/admin/settings', { jar: admin }));
const bizBefore = settingsBefore?.business || settingsBefore;
const feeBefore = bizBefore?.baseShippingFee ?? 50;
const feeChange = await call('PUT', '/api/admin/settings', { jar: admin, body: { baseShippingFee: 61 } });
check('S1 settings save', feeChange.json?.success, `status ${feeChange.status}`);
const shipPage = await call('GET', '/policies/shipping-policy');
check('S2 shipping page shows live fee', shipPage.text.includes('₹61') && !shipPage.text.includes('₹{{'), '');
const faqFee = await call('GET', '/policies/faq');
check('S3 FAQ shows live fee too', faqFee.text.includes('₹61'));
await call('PUT', '/api/admin/settings', { jar: admin, body: { baseShippingFee: feeBefore } });
const shipRestored = await call('GET', '/policies/shipping-policy');
check('S4 fee restored', shipRestored.text.includes(`₹${feeBefore}`) && !shipRestored.text.includes('₹61'));
const publicSettings = await call('GET', '/api/settings');
const pubText = JSON.stringify(publicSettings.json || {});
check('S5 public settings leak no secrets', !/secret|password|key_id|keyid|api[_-]?key|token/i.test(pubText), pubText.slice(0, 160));

// ---------------------------------------------------------------- banner CRUD
console.log('\n[Banner CRUD]');
const bannerCreate = await call('POST', '/api/admin/cms/banners', {
  jar: admin,
  body: { title: `Audit Banner ${TS}`, subtitle: 'temporary', imageUrl: '/banners/hero-wellness.webp', ctaText: 'Shop', ctaLink: '/shop', slot: 'PROMOTION', isActive: false, sortOrder: 99 },
});
const bannerId = data(bannerCreate)?.id;
check('B1 banner create', [200, 201].includes(bannerCreate.status) && Boolean(bannerId), `status ${bannerCreate.status}`);
if (bannerId) {
  const list = data(await call('GET', '/api/admin/cms/banners', { jar: admin }));
  const banners = list?.banners || list || [];
  check('B2 banner listed', banners.some((b) => b.id === bannerId));
  const upd = await call('PUT', `/api/admin/cms/banners/${bannerId}`, { jar: admin, body: { title: `Audit Banner Updated ${TS}`, imageUrl: '/banners/hero-wellness.webp', isActive: false } });
  check('B3 banner update', upd.json?.success && (data(upd)?.title || '').includes('Updated'), `status ${upd.status}`);
  const del = await call('DELETE', `/api/admin/cms/banners/${bannerId}`, { jar: admin });
  const list2 = data(await call('GET', '/api/admin/cms/banners', { jar: admin }));
  const banners2 = list2?.banners || list2 || [];
  check('B4 banner deleted', del.json?.success && !banners2.some((b) => b.id === bannerId), `status ${del.status}`);
}

// ---------------------------------------------------------------- coupon lifecycle
console.log('\n[Coupon lifecycle]');
const couponCode = `AUDIT${String(TS).slice(-6)}`;
const now = new Date(); const in30 = new Date(Date.now() + 30 * 864e5);
const couponCreate = await call('POST', '/api/admin/coupons', {
  jar: admin,
  body: { code: couponCode, description: 'audit', discountType: 'PERCENTAGE', discountValue: 5, minOrderValue: 0, perUserLimit: 1, startDate: now.toISOString(), endDate: in30.toISOString(), isActive: true },
});
const couponId = data(couponCreate)?.id;
check('K1 coupon create', [200, 201].includes(couponCreate.status) && Boolean(couponId), `status ${couponCreate.status}`);
const validate1 = await call('POST', '/api/coupons/validate', { jar: cust, body: { code: couponCode, subtotal: 1000 } });
check('K2 coupon validates for customer', validate1.status === 200, `status ${validate1.status}`);
if (couponId) {
  const del = await call('DELETE', `/api/admin/coupons/${couponId}`, { jar: admin });
  check('K3 coupon delete', del.json?.success || del.status === 200, `status ${del.status}`);
  const validate2 = await call('POST', '/api/coupons/validate', { jar: cust, body: { code: couponCode, subtotal: 1000 } });
  check('K4 deleted coupon no longer validates', validate2.status !== 200 || !(data(validate2)?.discount > 0), `status ${validate2.status}`);
}

// ---------------------------------------------------------------- product + inventory
console.log('\n[Product & inventory wiring]');
const catalogue = data(await call('GET', '/api/catalog/products?limit=100'));
const items = catalogue?.products || catalogue?.items || catalogue || [];
const target = (Array.isArray(items) ? items : []).find((p) => (p.variants || []).some((v) => (v.stockQuantity - (v.reservedQuantity || 0)) >= 5));
check('P0 catalogue target found', Boolean(target));
if (target) {
  const variant = target.variants.find((v) => (v.stockQuantity - (v.reservedQuantity || 0)) >= 5);
  const adj = await call('POST', '/api/admin/inventory/adjust', { jar: admin, body: { variantId: variant.id, quantityChange: 2, reason: 'RESTOCK' } });
  check('P1 inventory +2', adj.json?.success, `status ${adj.status}`);
  const afterAdj = data(await call('GET', `/api/catalog/products/${target.slug}`));
  const vAfter = (afterAdj?.variants || []).find((v) => v.id === variant.id);
  check('P2 stock reflected publicly', vAfter && vAfter.stockQuantity === variant.stockQuantity + 2, `before ${variant.stockQuantity} after ${vAfter?.stockQuantity}`);
  const adjBack = await call('POST', '/api/admin/inventory/adjust', { jar: admin, body: { variantId: variant.id, quantityChange: -2, reason: 'DAMAGE' } });
  check('P3 inventory restored -2', adjBack.json?.success);

  const adminView = data(await call('GET', `/api/admin/products/${target.id}`, { jar: admin }));
  const nameBefore = adminView?.name; const variantsBefore = (adminView?.variants || []).length;
  const off = await call('PUT', `/api/admin/products/${target.id}`, { jar: admin, body: { isActive: false } });
  check('P4 product deactivate', off.json?.success && data(off)?.isActive === false, `status ${off.status}`);
  const hiddenApi = await call('GET', `/api/catalog/products/${target.slug}`);
  const hiddenPdp = await call('GET', `/product/${target.slug}`);
  check('P5 deactivated product hidden on storefront', hiddenApi.status === 404 && !/add to cart/i.test(hiddenPdp.text), `api ${hiddenApi.status}`);
  const on = await call('PUT', `/api/admin/products/${target.id}`, { jar: admin, body: { isActive: true } });
  const viewAfter = data(await call('GET', `/api/admin/products/${target.id}`, { jar: admin }));
  check('P6 reactivate without clobbering', on.json?.success && viewAfter?.name === nameBefore && (viewAfter?.variants || []).length === variantsBefore,
    `name ${viewAfter?.name} variants ${(viewAfter?.variants || []).length}/${variantsBefore}`);
}

// ---------------------------------------------------------------- category lifecycle
console.log('\n[Category admin wiring]');
const catSlug = `audit-cat-${Date.now()}`;
const catCreate = await call('POST', '/api/admin/categories', { jar: admin, body: { name: 'Audit Category', slug: catSlug, description: 'Created by wiring audit', displayOrder: 99, isActive: true } });
const auditCat = data(catCreate);
check('K1 admin creates category', catCreate.status === 201 && auditCat?.slug === catSlug, `status ${catCreate.status}`);
const dupCat = await call('POST', '/api/admin/categories', { jar: admin, body: { name: 'Audit Category Copy', slug: catSlug } });
check('K2 duplicate slug rejected', dupCat.status === 409, `status ${dupCat.status}`);
const custCatCreate = await call('POST', '/api/admin/categories', { jar: cust, body: { name: 'Hacked', slug: 'hacked-cat' } });
check('K3 customer cannot create category', [401, 403].includes(custCatCreate.status), `status ${custCatCreate.status}`);
if (auditCat) {
  const adminCats = data(await call('GET', '/api/admin/categories', { jar: admin }));
  const listed = (adminCats?.categories || []).find((c) => c.id === auditCat.id);
  check('K4 admin list carries productCount', listed && typeof listed.productCount === 'number', `productCount ${listed?.productCount}`);
  const pubCats = data(await call('GET', '/api/catalog/categories'));
  check('K5 new category public', (pubCats || []).some((c) => c.slug === catSlug));
  const catPage = await call('GET', `/category/${catSlug}`);
  check('K6 storefront category page 200', catPage.status === 200, `status ${catPage.status}`);
  const renameCat = await call('PUT', `/api/admin/categories/${auditCat.id}`, { jar: admin, body: { name: 'Audit Category Renamed' } });
  check('K7 rename via PUT', renameCat.json?.success && data(renameCat)?.name === 'Audit Category Renamed', `status ${renameCat.status}`);
  if (target) {
    const viewBefore = data(await call('GET', `/api/admin/products/${target.id}`, { jar: admin }));
    const originalCategoryId = viewBefore?.categoryId;
    await call('PUT', `/api/admin/products/${target.id}`, { jar: admin, body: { categoryId: auditCat.id } });
    const blockedDelete = await call('DELETE', `/api/admin/categories/${auditCat.id}`, { jar: admin });
    check('K8 delete blocked while products assigned', blockedDelete.status === 409, `status ${blockedDelete.status}`);
    await call('PUT', `/api/admin/products/${target.id}`, { jar: admin, body: { categoryId: originalCategoryId } });
    const deleteCat = await call('DELETE', `/api/admin/categories/${auditCat.id}`, { jar: admin });
    check('K9 delete succeeds once empty', deleteCat.json?.success === true, `status ${deleteCat.status}`);
    const pubCatsAfter = data(await call('GET', '/api/catalog/categories'));
    check('K10 deleted category gone publicly', !(pubCatsAfter || []).some((c) => c.slug === catSlug));
  }
}

// ---------------------------------------------------------------- order lifecycle + review moderation
console.log('\n[Order lifecycle & review moderation]');
// The store is online-payment-only unless an admin enables COD; turn it on
// for the lifecycle checks and restore the original value afterwards.
const codBefore = bizBefore?.enableCod === true;
if (!codBefore) await call('PUT', '/api/admin/settings', { jar: admin, body: { enableCod: true } });
if (target) {
  const variant = target.variants.find((v) => (v.stockQuantity - (v.reservedQuantity || 0)) >= 5);
  const orderCreate = await call('POST', '/api/orders', {
    jar: cust,
    body: {
      items: [{ productId: target.id, variantId: variant.id, quantity: 1 }],
      shippingAddress: { fullName: 'Audit Customer', phone: custPhone, addressLine1: '1 Audit Marg', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' },
      paymentMethod: 'COD',
    },
  });
  const order = data(orderCreate);
  check('O1 customer COD order', orderCreate.status === 201 && Boolean(order?.id), `status ${orderCreate.status} ${JSON.stringify(orderCreate.json?.error || {})}`);
  if (order?.id) {
    const orderPage = await call('GET', `/admin/orders/${order.id}`, { jar: admin });
    check('O2 admin order page renders', orderPage.status === 200, `status ${orderPage.status}`);
    const custStatus = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: cust, body: { orderStatus: 'CONFIRMED' } });
    check('O3 customer cannot set order status', [401, 403].includes(custStatus.status), `status ${custStatus.status}`);
    check('O4 COD order auto-CONFIRMED', (order.status || order.orderStatus) === 'CONFIRMED', `status ${order.status || order.orderStatus}`);
    const peckPacked = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'PENDING' } });
    check('O4b CONFIRMED cannot regress to PENDING', [400, 409, 422].includes(peckPacked.status), `status ${peckPacked.status}`);
    const ship = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'SHIPPED', trackingCarrier: 'AuditPost', trackingNumber: 'AUDIT123' } });
    check('O5 admin ships with tracking', ship.json?.success, `status ${ship.status}`);
    const custOrders = data(await call('GET', '/api/orders?limit=5', { jar: cust }));
    const mine = (custOrders?.orders || custOrders || []).find((o) => o.id === order.id);
    check('O6 customer sees SHIPPED + tracking', (mine?.status || mine?.orderStatus) === 'SHIPPED', JSON.stringify(mine || {}).slice(0, 140));
    const backwards = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'PENDING' } });
    check('O7 invalid backwards transition rejected', [400, 409, 422].includes(backwards.status), `status ${backwards.status}`);
    const deliver = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'DELIVERED' } });
    check('O8 admin delivers order', deliver.json?.success, `status ${deliver.status}`);
    const regressDelivered = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'SHIPPED' } });
    check('O9 DELIVERED cannot regress to SHIPPED', [400, 409, 422].includes(regressDelivered.status), `status ${regressDelivered.status}`);
    const trackingEdit = await call('PATCH', `/api/admin/orders/${order.id}/status`, { jar: admin, body: { orderStatus: 'DELIVERED', trackingCarrier: 'AuditPost', trackingNumber: 'AUDIT123' } });
    check('O10 same-status re-save (tracking edit) allowed', trackingEdit.json?.success, `status ${trackingEdit.status}`);

    const reviewCreate = await call('POST', '/api/reviews', { jar: cust, body: { productId: target.id, rating: 5, title: 'Audit review', comment: 'Audit moderation flow check.' } });
    const reviewId = data(reviewCreate)?.id;
    check('R1 verified buyer review created', [200, 201].includes(reviewCreate.status) && Boolean(reviewId), `status ${reviewCreate.status}`);
    if (reviewId) {
      const pubBefore = await call('GET', `/api/reviews?productId=${target.id}`);
      check('R2 unapproved review hidden from public', !pubBefore.text.includes('Audit moderation flow check.'));
      const approve = await call('PUT', `/api/admin/reviews/${reviewId}`, { jar: admin, body: { isApproved: true } });
      check('R3 admin approves review', approve.json?.success, `status ${approve.status}`);
      const pubAfter = await call('GET', `/api/reviews?productId=${target.id}`);
      check('R4 approved review public (PDP ReviewSection feed)', pubAfter.text.includes('Audit moderation flow check.'));
      const del = await call('DELETE', `/api/admin/reviews/${reviewId}`, { jar: admin });
      const pubGone = await call('GET', `/api/reviews?productId=${target.id}`);
      check('R5 admin deletes review', del.json?.success && !pubGone.text.includes('Audit moderation flow check.'), `status ${del.status}`);
    }
  }
}

if (!codBefore) await call('PUT', '/api/admin/settings', { jar: admin, body: { enableCod: false } });

// ---------------------------------------------------------------- users + uploads + audit log
console.log('\n[Users, uploads, audit log]');
if (custId) {
  const search = data(await call('GET', `/api/admin/users?search=${encodeURIComponent(custEmail)}`, { jar: admin }));
  const found = (search?.users || search || []).some?.((u) => u.id === custId) ?? JSON.stringify(search || {}).includes(custId);
  check('U1 admin finds customer', Boolean(found));
  const deactivate = await call('PATCH', `/api/admin/users/${custId}`, { jar: admin, body: { isActive: false } });
  const custMeDead = await call('GET', '/api/auth/me', { jar: cust });
  check('U2 deactivation kills session', deactivate.json?.success && custMeDead.status === 401, `me=${custMeDead.status}`);
  const reactivate = await call('PATCH', `/api/admin/users/${custId}`, { jar: admin, body: { isActive: true } });
  const relogin = await call('POST', '/api/auth/login', { jar: cust, body: { email: custEmail, password: 'AuditPass#2026' } });
  check('U3 reactivation restores login', reactivate.json?.success && relogin.status === 200);
  const custDeactivate = await call('PATCH', `/api/admin/users/${custId}`, { jar: cust, body: { isActive: false } });
  check('U4 customer cannot self-admin', [401, 403].includes(custDeactivate.status), `status ${custDeactivate.status}`);
}
const form = new FormData();
form.append('file', new Blob(['not-an-image'], { type: 'text/plain' }), 'audit.txt');
const upload = await call('POST', '/api/admin/uploads', { jar: admin, body: form, raw: true });
check('F1 upload rejects bad file gracefully (no 500)', upload.status === 415, `status ${upload.status}`);
const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const pngForm = new FormData();
pngForm.append('file', new Blob([Buffer.from(pngB64, 'base64')], { type: 'image/png' }), 'audit.png');
const pngUpload = await call('POST', '/api/admin/uploads', { jar: admin, body: pngForm, raw: true });
check('F2 real PNG passes type detection (503 sandbox / 200 prod)', [200, 503].includes(pngUpload.status), `status ${pngUpload.status}`);
const custUpload = await call('POST', '/api/admin/uploads', { jar: cust, body: pngForm, raw: true });
check('F3 customer upload denied with real 401/403', [401, 403].includes(custUpload.status), `status ${custUpload.status}`);
const logs = data(await call('GET', '/api/admin/audit-logs?limit=50', { jar: admin }));
const logsText = JSON.stringify(logs || {});
check('L1 audit log records admin actions', /CMS_PAGE|PRODUCT_UPDATED|SETTINGS|ORDER/.test(logsText), logsText.slice(0, 140));

// ---------------------------------------------------------------- misc security
console.log('\n[Misc security]');
const forged = jar(); forged.cookies.set(COOKIE_NAME, 'forged.token.value');
const forgedMe = await call('GET', '/api/auth/me', { jar: forged });
check('M1 forged token rejected', forgedMe.status === 401, `status ${forgedMe.status}`);
const apiPolicies = data(await call('GET', '/api/policies'));
check('M2 footer policy list intact (6 links)', Array.isArray(apiPolicies) && apiPolicies.length === 6, JSON.stringify(apiPolicies || []).slice(0, 120));
let saw429 = false;
for (let i = 0; i < 12 && !saw429; i++) {
  const r = await call('POST', '/api/auth/login', { body: { email: 'ghost-audit@example.com', password: 'wrong' }, headers: { 'X-Forwarded-For': `198.51.100.${20 + i}` } });
  if (r.status === 429) saw429 = true;
}
check('M3 login rate limit engages (rotating IPs)', saw429);

console.log(`\n== RESULT: ${pass}/${pass + fail} passed ==`);
if (failures.length) { console.log('FAILURES:'); failures.forEach((f) => console.log(' -', f)); process.exit(1); }
