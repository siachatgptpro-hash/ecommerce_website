import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { ValidationError, handleApiError } from '@/lib/errors';
import { hasAdminRole } from '@/lib/admin-roles';
import {
  clearSessionCookie,
  cookieNameForScope,
  getCookieValue,
  LEGACY_SESSION_COOKIE,
  parseSessionScope,
  resolveRequestSessionToken,
  setSessionCookie,
} from '@/lib/session';
import type { ResolvedSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let resolved: ResolvedSessionToken | null = null;

  try {
    const rawScope = req.nextUrl.searchParams.get('scope');
    const requestedScope = parseSessionScope(rawScope);
    if (rawScope && !requestedScope) {
      throw new ValidationError('Session scope must be either "customer" or "admin".');
    }

    resolved = resolveRequestSessionToken(req, requestedScope);
    if (!resolved) {
      const response = NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No active session' } },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    const user = await AuthService.getCurrentUser(
      resolved.token,
      requestedScope ? { scope: requestedScope } : {}
    );

    const response = NextResponse.json({ success: true, data: user });
    response.headers.set('Cache-Control', 'no-store');

    // One-time migration for browsers signed in before scoped cookies were
    // introduced. The already-verified legacy identity is copied only into
    // scopes it was already allowed to use, then the shared cookie is
    // removed so future customer/admin sign-ins can diverge safely.
    if (requestedScope && resolved.source === 'legacy') {
      const canMigrateRequestedScope =
        requestedScope === 'customer' || hasAdminRole(user.roles);

      if (canMigrateRequestedScope) {
        setSessionCookie(
          response.cookies,
          requestedScope,
          AuthService.generateToken(user, requestedScope)
        );

        const otherScope = requestedScope === 'customer' ? 'admin' : 'customer';
        const otherCookieName = cookieNameForScope(otherScope);
        if (!getCookieValue(req.cookies, otherCookieName)) {
          if (otherScope === 'customer' || hasAdminRole(user.roles)) {
            setSessionCookie(
              response.cookies,
              otherScope,
              AuthService.generateToken(user, otherScope)
            );
          }
        }

        clearSessionCookie(response.cookies, LEGACY_SESSION_COOKIE);
      }
    }

    return response;
  } catch (error) {
    const err = handleApiError(error);
    const response = NextResponse.json(err.body, { status: err.status });
    response.headers.set('Cache-Control', 'no-store');

    // Do not leave a forged/expired cookie in place to fail on every refresh.
    if (err.status === 401 && resolved?.cookieName) {
      clearSessionCookie(response.cookies, resolved.cookieName);
    }

    return response;
  }
}
