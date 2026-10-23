import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = LoginSchema.parse(json);
    const identifier = (payload.emailOrPhone || payload.email || payload.phone || '').trim();
    // Limit per IP *and* per account identifier, so rotating IPs cannot be
    // used to credential-stuff a single account.
    const limited = await enforceRateLimit(req, 'auth:login', 10, 300, true, identifier);
    if (limited) return limited;
    const result = await AuthService.login(identifier, payload.password);

    // The JWT is delivered only via the HttpOnly cookie below — never in a
    // response body, where any script (or log) could read it.
    const response = NextResponse.json({
      success: true,
      data: { user: result.user },
    });

    // Set secure HttpOnly cookie for session token
    response.cookies.set('shlokveda_session_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
