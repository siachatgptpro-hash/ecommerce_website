import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { OrderService } from '@/services/order.service';
import { AuthService } from '@/services/auth.service';
import { OrderStatus } from '@/types';
import { AuthenticationError, NotFoundError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Customer self-service cancellation. Only allowed before fulfilment picks
 * the order up (PENDING/CONFIRMED); the shared cancelOrder() handles the
 * refund-first ordering, stock restoration and coupon release, and is
 * idempotent so a double-click can't restock twice.
 */
export async function POST(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '') || req.cookies.get('shlokveda_session_token')?.value;
    if (!token) throw new AuthenticationError();
    const user = await AuthService.getCurrentUser(token);

    const order = await OrderRepository.findByOrderNumber(params.orderNumber);
    if (!order || order.userId !== user.id) throw new NotFoundError('Order');

    if (
      order.orderStatus !== OrderStatus.CANCELLED &&
      order.orderStatus !== OrderStatus.PENDING &&
      order.orderStatus !== OrderStatus.CONFIRMED
    ) {
      throw new ValidationError(
        'This order is already being prepared and can no longer be cancelled online. Please contact support.'
      );
    }

    const cancelled = await OrderService.cancelOrder(order.id, 'Cancelled by customer', user.id);
    return NextResponse.json(
      { success: true, data: cancelled },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
