import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PricingService } from '@/services/pricing.service';
import { AuthService } from '@/services/auth.service';
import { handleApiError } from '@/lib/errors';
import { resolveRequestSessionToken } from '@/lib/session';

const ValidateInput = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { code, subtotal } = ValidateInput.parse(json);

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

    const result = await PricingService.validateCoupon(code, subtotal, userId);
    return NextResponse.json({
      success: result.valid,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
