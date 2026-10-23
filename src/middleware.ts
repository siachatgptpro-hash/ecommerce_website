import { NextRequest, NextResponse } from 'next/server';
import { hasSessionCookie } from '@/lib/session';

/**
 * Edge-level gate (defense in depth).
 *
 * Full token verification + authorization still happens in route handlers
 * (`authenticateAdmin`) and Server Components (`requireAdminPage`,
 * `AuthService.getCurrentUser`). This middleware only guarantees that
 * protected pages are never even rendered — so no server data can leak into
 * an RSC payload — when the relevant scoped session cookie is absent. The
 * legacy cookie remains an accepted presence signal during migration; the
 * server handlers still verify it and its database roles.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin suite (except its own sign-in page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasSessionCookie(req.cookies, 'admin')) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Authenticated storefront areas use the customer scope, not an admin-only
  // browser session.
  const customerProtected = ['/account', '/checkout', '/orders/', '/order-confirmation'];
  if (customerProtected.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    if (!hasSessionCookie(req.cookies, 'customer')) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(`${pathname}${req.nextUrl.search}`)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account', '/checkout', '/orders/:path*', '/order-confirmation'],
};
