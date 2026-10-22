import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge-level gate (defense in depth).
 *
 * Full token verification + authorization still happens in route handlers
 * (`authenticateAdmin`) and Server Components (`requireAdminPage`,
 * `AuthService.getCurrentUser`). This middleware only guarantees that
 * protected pages are never even rendered — so no server data can leak into
 * an RSC payload — when the session cookie is absent.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get('shlokveda_session_token')?.value);

  // Admin suite (except its own sign-in page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Authenticated storefront areas
  const customerProtected = ['/account', '/checkout', '/orders/', '/order-confirmation'];
  if (customerProtected.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    if (!hasSession) {
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
