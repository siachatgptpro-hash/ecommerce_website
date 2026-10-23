/**
 * Scoped customer/admin browser-session regression test.
 *
 * Reproduces the owner workflow that previously broke:
 *   1. sign in to Admin;
 *   2. register/sign in as a customer in the same browser;
 *   3. return to Blog Posts and publish/edit/delete.
 *
 * The admin and customer identities must coexist in one cookie jar, scoped
 * logout must affect only its own audience, and a pre-upgrade legacy cookie
 * must migrate without later resurrecting the wrong account.
 *
 * Usage (throwaway DB/preview only):
 *   SESSION_ADMIN_EMAIL=admin@example.com \
 *   SESSION_ADMIN_PASSWORD='…' \
 *   node scripts/retest-session-scopes.mjs [baseUrl]
 */

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.SESSION_ADMIN_EMAIL || process.env.RETEST_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SESSION_ADMIN_PASSWORD || process.env.RETEST_ADMIN_PASSWORD || 'sandbox-admin-pass-123';
const TS = Date.now();
const CUSTOMER_EMAIL = `session.scope.${TS}@example.com`;
const CUSTOMER_PHONE = `98${String(TS).slice(-8)}`;
const CUSTOMER_PASSWORD = 'SessionScope#2026';

const CUSTOMER_COOKIE = 'shlokveda_customer_session';
const ADMIN_COOKIE = 'shlokveda_admin_session';
const LEGACY_COOKIE = 'shlokveda_session_token';

const results = [];
function check(name, condition, detail = '') {
  const pass = Boolean(condition);
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

class Jar {
  constructor() {
    this.cookies = new Map();
  }

  absorb(response) {
    const values = response.headers.getSetCookie
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean);
    for (const cookie of values) {
      const [pair, ...attrs] = cookie.split(';');
      const index = pair.indexOf('=');
      if (index < 1) continue;
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      const expired = !value || attrs.some((attr) => /max-age=0(?!\d)/i.test(attr));
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    return values;
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  get(name) {
    return this.cookies.get(name);
  }

  has(name) {
    return Boolean(this.cookies.get(name));
  }

  set(name, value) {
    this.cookies.set(name, value);
  }
}

async function call(method, path, { jar, body, headers = {} } = {}) {
  const startedAt = Date.now();
  const response = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(jar?.header() ? { Cookie: jar.header() } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const setCookies = jar ? jar.absorb(response) : [];
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML or empty */ }
  return {
    status: response.status,
    headers: response.headers,
    setCookies,
    json,
    text,
    durationMs: Date.now() - startedAt,
  };
}

const data = (response) => response.json?.data;
const errorCode = (response) => response.json?.error?.code;

let createdBlogId = null;
const browser = new Jar();

try {
  console.log(`\nScoped session retest @ ${BASE}\n`);

  const adminLogin = await call('POST', '/api/auth/login', {
    jar: browser,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, scope: 'admin' },
  });
  check('S1 admin login succeeds', adminLogin.status === 200, `status ${adminLogin.status}, ${adminLogin.durationMs}ms`);
  check(
    'S2 admin login sets only the admin cookie',
    browser.has(ADMIN_COOKIE) && !browser.has(CUSTOMER_COOKIE) && !browser.has(LEGACY_COOKIE),
    [...browser.cookies.keys()].join(', ')
  );

  const adminMe = await call('GET', '/api/auth/me?scope=admin', { jar: browser });
  const customerMeBefore = await call('GET', '/api/auth/me?scope=customer', { jar: browser });
  check('S3 admin scope returns the administrator', adminMe.status === 200 && data(adminMe)?.email === ADMIN_EMAIL.toLowerCase());
  check('S4 customer scope is empty before customer sign-in', customerMeBefore.status === 401, `status ${customerMeBefore.status}`);

  const register = await call('POST', '/api/auth/register', {
    jar: browser,
    body: {
      fullName: 'Session Scope Customer',
      email: CUSTOMER_EMAIL,
      phone: CUSTOMER_PHONE,
      password: CUSTOMER_PASSWORD,
    },
  });
  check('S5 customer registration succeeds in same browser', register.status === 201, `status ${register.status}, ${register.durationMs}ms`);
  check(
    'S6 registration adds customer cookie without replacing admin cookie',
    browser.has(CUSTOMER_COOKIE) && browser.has(ADMIN_COOKIE),
    [...browser.cookies.keys()].join(', ')
  );

  const customerMe = await call('GET', '/api/auth/me?scope=customer', { jar: browser });
  const adminMeAfter = await call('GET', '/api/auth/me?scope=admin', { jar: browser });
  check('S7 customer scope now returns the customer', customerMe.status === 200 && data(customerMe)?.email === CUSTOMER_EMAIL);
  check('S8 admin scope still returns the administrator', adminMeAfter.status === 200 && data(adminMeAfter)?.email === ADMIN_EMAIL.toLowerCase());
  check('S9 the two simultaneous identities are different users', data(customerMe)?.id && data(adminMeAfter)?.id && data(customerMe).id !== data(adminMeAfter).id);

  const slug = `session-scope-${TS}`;
  const createBlog = await call('POST', '/api/admin/blog', {
    jar: browser,
    body: {
      title: 'Session scope regression post',
      slug,
      summary: 'Temporary scoped-session regression content.',
      content: 'This temporary post proves the admin session remains usable after customer registration in the same browser.',
      authorName: 'Session Scope Test',
      readTimeMinutes: 1,
      isPublished: false,
    },
  });
  createdBlogId = data(createBlog)?.id || null;
  check('S10 admin can create a blog after customer registration', createBlog.status === 201 && Boolean(createdBlogId), `status ${createBlog.status}`);

  if (createdBlogId) {
    const publish = await call('PUT', `/api/admin/blog/${createdBlogId}`, {
      jar: browser,
      body: { isPublished: true },
    });
    check('S11 admin can publish the blog in the dual-session browser', publish.status === 200 && data(publish)?.isPublished === true, `status ${publish.status}`);

    const unpublish = await call('PUT', `/api/admin/blog/${createdBlogId}`, {
      jar: browser,
      body: { isPublished: false },
    });
    check('S12 admin can unpublish the blog in the dual-session browser', unpublish.status === 200 && data(unpublish)?.isPublished === false, `status ${unpublish.status}`);

    const remove = await call('DELETE', `/api/admin/blog/${createdBlogId}`, { jar: browser });
    check('S13 admin can delete the temporary blog', remove.status === 200 && remove.json?.success === true, `status ${remove.status}`);
    if (remove.status === 200) createdBlogId = null;
  }

  const customerOnly = new Jar();
  const customerLogin = await call('POST', '/api/auth/login', {
    jar: customerOnly,
    body: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, scope: 'customer' },
  });
  check('S14 customer-only login succeeds', customerLogin.status === 200 && customerOnly.has(CUSTOMER_COOKIE), `status ${customerLogin.status}, ${customerLogin.durationMs}ms`);

  const customerBlog = await call('GET', '/api/admin/blog', { jar: customerOnly });
  check(
    'S15 customer-only session is denied blog admin with a clear code',
    customerBlog.status === 401 && errorCode(customerBlog) === 'ADMIN_SESSION_REQUIRED',
    `status ${customerBlog.status}, code ${errorCode(customerBlog)}`
  );

  const customerAdminLoginJar = new Jar();
  const customerAdminLogin = await call('POST', '/api/auth/login', {
    jar: customerAdminLoginJar,
    body: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, scope: 'admin' },
  });
  check(
    'S16 a customer password cannot create an admin session',
    customerAdminLogin.status === 403 && errorCode(customerAdminLogin) === 'ADMIN_ROLE_REQUIRED' && !customerAdminLoginJar.has(ADMIN_COOKIE),
    `status ${customerAdminLogin.status}, code ${errorCode(customerAdminLogin)}`
  );

  const mismatched = new Jar();
  mismatched.set(ADMIN_COOKIE, customerOnly.get(CUSTOMER_COOKIE) || '');
  const mismatchMe = await call('GET', '/api/auth/me?scope=admin', { jar: mismatched });
  check(
    'S17 a customer token placed in the admin cookie is rejected',
    mismatchMe.status === 401 && errorCode(mismatchMe) === 'SESSION_SCOPE_MISMATCH',
    `status ${mismatchMe.status}, code ${errorCode(mismatchMe)}`
  );

  const adminLogout = await call('POST', '/api/auth/logout?scope=admin', { jar: browser });
  const adminAfterLogout = await call('GET', '/api/auth/me?scope=admin', { jar: browser });
  const customerAfterAdminLogout = await call('GET', '/api/auth/me?scope=customer', { jar: browser });
  check('S18 admin logout clears only the admin session', adminLogout.status === 200 && adminAfterLogout.status === 401 && !browser.has(ADMIN_COOKIE));
  check('S19 customer remains signed in after admin logout', customerAfterAdminLogout.status === 200 && data(customerAfterAdminLogout)?.email === CUSTOMER_EMAIL);

  const customerLogout = await call('POST', '/api/auth/logout?scope=customer', { jar: browser });
  const customerAfterLogout = await call('GET', '/api/auth/me?scope=customer', { jar: browser });
  const anyAfterLogout = await call('GET', '/api/auth/me', { jar: browser });
  check(
    'S20 customer logout ends the remaining customer session',
    customerLogout.status === 200 && customerAfterLogout.status === 401 && anyAfterLogout.status === 401 && !browser.has(CUSTOMER_COOKIE)
  );

  const legacyBrowser = new Jar();
  const legacyLogin = await call('POST', '/api/auth/login', {
    jar: legacyBrowser,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  check(
    'S21 unscoped legacy login still returns the legacy cookie',
    legacyLogin.status === 200 && legacyBrowser.has(LEGACY_COOKIE) && !legacyBrowser.has(ADMIN_COOKIE),
    `status ${legacyLogin.status}`
  );

  const migratedCustomerMe = await call('GET', '/api/auth/me?scope=customer', { jar: legacyBrowser });
  check(
    'S22 scoped /me migrates a qualified legacy admin into both scoped cookies',
    migratedCustomerMe.status === 200 && legacyBrowser.has(CUSTOMER_COOKIE) && legacyBrowser.has(ADMIN_COOKIE) && !legacyBrowser.has(LEGACY_COOKIE),
    [...legacyBrowser.cookies.keys()].join(', ')
  );

  const replaceCustomer = await call('POST', '/api/auth/login', {
    jar: legacyBrowser,
    body: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, scope: 'customer' },
  });
  const migratedCustomerAfter = await call('GET', '/api/auth/me?scope=customer', { jar: legacyBrowser });
  const migratedAdminAfter = await call('GET', '/api/auth/me?scope=admin', { jar: legacyBrowser });
  const migratedBlogList = await call('GET', '/api/admin/blog', { jar: legacyBrowser });
  check(
    'S23 after migration, customer login no longer replaces admin',
    replaceCustomer.status === 200 && data(migratedCustomerAfter)?.email === CUSTOMER_EMAIL && data(migratedAdminAfter)?.email === ADMIN_EMAIL.toLowerCase()
  );
  check('S24 migrated admin can still load Blog Posts', migratedBlogList.status === 200, `status ${migratedBlogList.status}`);

  const wrongPassword = await call('POST', '/api/auth/login', {
    body: { email: ADMIN_EMAIL, password: 'definitely-not-the-admin-password', scope: 'admin' },
  });
  check(
    'S25 wrong password returns JSON, never an HTML parser trap',
    wrongPassword.status === 401 && Boolean(wrongPassword.json?.error?.message) && !/<!doctype|<html/i.test(wrongPassword.text),
    `status ${wrongPassword.status}, ${wrongPassword.durationMs}ms`
  );

  const invalidScope = await call('GET', '/api/auth/me?scope=owner', { jar: legacyBrowser });
  check(
    'S26 invalid session scope is a clean JSON validation error',
    invalidScope.status === 422 && Boolean(invalidScope.json?.error?.message),
    `status ${invalidScope.status}`
  );
} finally {
  if (createdBlogId) {
    try { await call('DELETE', `/api/admin/blog/${createdBlogId}`, { jar: browser }); } catch {}
  }
}

const failed = results.filter((result) => !result.pass);
console.log(`\n===== RESULT: ${results.length - failed.length}/${results.length} passed =====`);
if (failed.length) failed.forEach((result) => console.log(`FAILED: ${result.name} — ${result.detail}`));
process.exitCode = failed.length ? 1 : 0;
