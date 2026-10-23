import { NextRequest, NextResponse } from 'next/server';
import { CheckoutInitiateSchema } from '@/schemas';
import { OrderService } from '@/services/order.service';
import { AuthService } from '@/services/auth.service';
import { resolveRequestSessionToken } from '@/lib/session';
import { AuthenticationError, handleApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, 'payment:create', 10, 300);
    if (limited) return limited;
    const json = await req.json();
    const payload = CheckoutInitiateSchema.parse(json);

    let userId: string | undefined = undefined;
    const token = resolveRequestSessionToken(req, 'customer')?.token;
    if (token) {
      try {
        const decoded = AuthService.verifyToken(token, { scope: 'customer' });
        userId = decoded.userId;
      } catch {
        throw new AuthenticationError('Please log in before starting payment.');
      }
    }
    if (!userId) throw new AuthenticationError('Please log in before starting payment.');

    const result = await OrderService.initiateCheckout({
      items: payload.items,
      couponCode: payload.couponCode,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress as any,
      paymentGateway: payload.paymentGateway,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
