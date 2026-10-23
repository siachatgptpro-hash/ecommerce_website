import { NextRequest, NextResponse } from 'next/server';
import { CartSyncSchema } from '@/schemas';
import { PricingService } from '@/services/pricing.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { resolveRequestSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const payload = CartSyncSchema.parse(json);

    // Optional user token
    let userId: string | undefined = undefined;
    const token = resolveRequestSessionToken(req, 'customer')?.token;
    if (token) {
      try {
        const decoded = AuthService.verifyToken(token, { scope: 'customer' });
        userId = decoded.userId;
      } catch {
        // Guest mode fallback
      }
    }

    const calculation = await PricingService.calculateCart(payload.items, payload.couponCode, userId);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
