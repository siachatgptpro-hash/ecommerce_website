import { NextRequest, NextResponse } from 'next/server';
import {
  clearAllSessionCookies,
  clearScopedSessionCookie,
  parseSessionScope,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let requestedScope = parseSessionScope(req.nextUrl.searchParams.get('scope'));

  if (!requestedScope && req.headers.get('content-type')?.includes('application/json')) {
    try {
      const body = await req.clone().json();
      requestedScope = parseSessionScope(typeof body?.scope === 'string' ? body.scope : null);
    } catch {
      // Logout must remain reliable even with an empty/malformed best-effort
      // keepalive body. Fall through to clearing every session cookie.
    }
  }

  const response = NextResponse.json({
    success: true,
    data: { scope: requestedScope || 'all' },
  });
  response.headers.set('Cache-Control', 'no-store');

  if (requestedScope) {
    clearScopedSessionCookie(response.cookies, requestedScope, req.cookies);
  } else {
    // Legacy/no-scope logout retains its original "sign out everywhere"
    // behaviour for older clients and audit scripts.
    clearAllSessionCookies(response.cookies);
  }

  return response;
}
