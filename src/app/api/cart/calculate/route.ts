import { NextRequest, NextResponse } from 'next/server';
import { PricingService } from '@/services/pricing.service';
import { AuthService } from '@/services/auth.service';
import { CartSyncSchema } from '@/schemas';
import { handleApiError } from '@/lib/errors';
import { resolveRequestSessionToken } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    // Validate shape (integer quantities etc.) — raw JSON must never flow
    // straight into the pricing engine.
    const { items, couponCode } = CartSyncSchema.parse({ items: json.items || [], couponCode: json.couponCode });

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

    const calculation = await PricingService.calculateCart(items, couponCode, userId);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
