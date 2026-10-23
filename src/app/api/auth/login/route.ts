import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/rate-limit';
import { setLegacySessionCookie, setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let scopeForLog = 'legacy';

  try {
    const json = await req.json();
    const payload = LoginSchema.parse(json);
    scopeForLog = payload.scope || 'legacy';
    const identifier = (payload.emailOrPhone || payload.email || payload.phone || '').trim();

    // Limit per IP *and* per account identifier, so rotating IPs cannot be
    // used to credential-stuff a single account.
    const limited = await enforceRateLimit(req, 'auth:login', 10, 300, true, identifier);
    if (limited) return limited;

    const result = await AuthService.login(identifier, payload.password, payload.scope || 'legacy');

    // The JWT is delivered only via the HttpOnly cookie below — never in a
    // response body, where any script (or log) could read it.
    const response = NextResponse.json({
      success: true,
      data: { user: result.user, scope: result.scope },
    });
    response.headers.set('Cache-Control', 'no-store');

    if (payload.scope) {
      // Explicit storefront/admin page sign-ins touch only their own cookie.
      // This is the core fix for a customer sign-in silently replacing the
      // administrator session (and the reverse) in the same browser.
      setSessionCookie(response.cookies, payload.scope, result.token);
    } else {
      // Backwards-compatible path for older API clients/scripts.
      setLegacySessionCookie(response.cookies, result.token);
    }

    const durationMs = Date.now() - startedAt;
    if (durationMs >= 1500) {
      console.warn(`[auth] Slow successful login scope=${scopeForLog} durationMs=${durationMs}`);
    }

    return response;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    if (durationMs >= 1500) {
      console.warn(`[auth] Slow failed login scope=${scopeForLog} durationMs=${durationMs}`);
    }
    const err = handleApiError(error);
    const response = NextResponse.json(err.body, { status: err.status });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
