// Browser sessions are deliberately split by audience. A shopper sign-in must
// never replace the administrator sign-in in another tab (and vice versa).
// The legacy cookie is still read during migration so existing browsers are
// not signed out by this change.

export type SessionScope = 'customer' | 'admin';
export type SessionTokenScope = SessionScope | 'legacy';
export type SessionTokenSource = 'bearer' | 'scoped' | 'legacy';

export const CUSTOMER_SESSION_COOKIE = 'shlokveda_customer_session';
export const ADMIN_SESSION_COOKIE = 'shlokveda_admin_session';
export const LEGACY_SESSION_COOKIE = 'shlokveda_session_token';
export const LEGACY_MISSPELLED_SESSION_COOKIE = 'sholkveda_session_token';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

interface CookieReader {
  get(name: string): { value: string } | undefined;
}

interface RequestLike {
  headers: { get(name: string): string | null };
  cookies: CookieReader;
}

interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
}

export interface ResolvedSessionToken {
  token: string;
  source: SessionTokenSource;
  cookieName?: string;
}

export function parseSessionScope(value: string | null | undefined): SessionScope | null {
  return value === 'customer' || value === 'admin' ? value : null;
}

export function scopeFromPathname(pathname: string | null | undefined): SessionScope {
  return pathname?.startsWith('/admin') ? 'admin' : 'customer';
}

export function cookieNameForScope(scope: SessionScope): string {
  return scope === 'admin' ? ADMIN_SESSION_COOKIE : CUSTOMER_SESSION_COOKIE;
}

export function bearerToken(headers: RequestLike['headers']): string | undefined {
  const value = headers.get('authorization')?.trim();
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim() || undefined;
}

export function getCookieValue(cookies: CookieReader, name: string): string | undefined {
  const value = cookies.get(name)?.value?.trim();
  return value || undefined;
}

export function resolveCookieSessionToken(
  cookies: CookieReader,
  scope?: SessionScope | null
): ResolvedSessionToken | null {
  if (scope) {
    const cookieName = cookieNameForScope(scope);
    const scoped = getCookieValue(cookies, cookieName);
    if (scoped) return { token: scoped, source: 'scoped', cookieName };

    const legacy = getCookieValue(cookies, LEGACY_SESSION_COOKIE);
    if (legacy) return { token: legacy, source: 'legacy', cookieName: LEGACY_SESSION_COOKIE };
    return null;
  }

  // Ambiguous legacy callers get a deterministic order. The storefront and
  // admin user interfaces always request an explicit scope.
  for (const candidateScope of ['customer', 'admin'] as SessionScope[]) {
    const cookieName = cookieNameForScope(candidateScope);
    const token = getCookieValue(cookies, cookieName);
    if (token) return { token, source: 'scoped', cookieName };
  }

  const legacy = getCookieValue(cookies, LEGACY_SESSION_COOKIE);
  return legacy ? { token: legacy, source: 'legacy', cookieName: LEGACY_SESSION_COOKIE } : null;
}

export function resolveRequestSessionToken(
  req: RequestLike,
  scope?: SessionScope | null
): ResolvedSessionToken | null {
  const bearer = bearerToken(req.headers);
  if (bearer) return { token: bearer, source: 'bearer' };
  return resolveCookieSessionToken(req.cookies, scope);
}

export function hasSessionCookie(cookies: CookieReader, scope: SessionScope): boolean {
  return Boolean(resolveCookieSessionToken(cookies, scope));
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setSessionCookie(
  cookies: CookieWriter,
  scope: SessionScope,
  token: string
): void {
  cookies.set(cookieNameForScope(scope), token, sessionCookieOptions());
}

export function setLegacySessionCookie(cookies: CookieWriter, token: string): void {
  cookies.set(LEGACY_SESSION_COOKIE, token, sessionCookieOptions());
}

export function clearSessionCookie(cookies: CookieWriter, cookieName: string): void {
  cookies.set(cookieName, '', sessionCookieOptions(0));
}

export function clearScopedSessionCookie(
  cookies: CookieWriter,
  scope: SessionScope,
  requestCookies?: CookieReader
): void {
  const cookieName = cookieNameForScope(scope);
  clearSessionCookie(cookies, cookieName);

  // If this scope was still being served by the pre-migration cookie, clear
  // that cookie too; otherwise refresh would immediately resurrect the same
  // session. If a scoped cookie exists, leave legacy alone because it may
  // still be the not-yet-migrated session for the other scope.
  if (requestCookies && !getCookieValue(requestCookies, cookieName)) {
    clearSessionCookie(cookies, LEGACY_SESSION_COOKIE);
  }
  clearSessionCookie(cookies, LEGACY_MISSPELLED_SESSION_COOKIE);
}

export function clearAllSessionCookies(cookies: CookieWriter): void {
  clearSessionCookie(cookies, CUSTOMER_SESSION_COOKIE);
  clearSessionCookie(cookies, ADMIN_SESSION_COOKIE);
  clearSessionCookie(cookies, LEGACY_SESSION_COOKIE);
  clearSessionCookie(cookies, LEGACY_MISSPELLED_SESSION_COOKIE);
}
