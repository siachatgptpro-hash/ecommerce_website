import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/schemas';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/rate-limit';
import { setSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = RegisterSchema.parse(json);
    const limited = await enforceRateLimit(req, 'auth:register', 5, 900, true, payload.email);
    if (limited) return limited;

    const result = await AuthService.register(payload);
    const response = NextResponse.json(
      { success: true, data: { user: result.user, scope: result.scope } },
      { status: 201 }
    );
    response.headers.set('Cache-Control', 'no-store');

    // Registration always creates a customer. Setting only the customer
    // cookie means opening a test customer account cannot sign the owner
    // out of the admin panel in another tab.
    setSessionCookie(response.cookies, 'customer', result.token);
    return response;
  } catch (error) {
    const err = handleApiError(error);
    const response = NextResponse.json(err.body, { status: err.status });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
