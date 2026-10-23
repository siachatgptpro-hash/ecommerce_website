import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { resolveRequestSessionToken } from '@/lib/session';
import { AuthenticationError, NotFoundError, handleApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, 'payment:verify', 15, 300);
    if (limited) return limited;
    const json = await req.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = json;
    const token = resolveRequestSessionToken(req, 'customer')?.token;
    if (!token) throw new AuthenticationError('Please log in to confirm this payment.');
    const user = await AuthService.getCurrentUser(token, { scope: 'customer' });
    const pendingOrder = await OrderRepository.findById(orderId);
    if (!pendingOrder || pendingOrder.userId !== user.id) throw new NotFoundError('Order');

    const order = await OrderService.verifyAndCompletePayment(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    return NextResponse.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
