import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { AuthenticationError, NotFoundError, handleApiError } from '@/lib/errors';
import { resolveRequestSessionToken } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const token = resolveRequestSessionToken(req, 'customer')?.token;
    if (!token) throw new AuthenticationError();
    const user = await AuthService.getCurrentUser(token, { scope: 'customer' });
    const order = await OrderRepository.findByOrderNumber(params.orderNumber);
    if (!order || order.userId !== user.id) throw new NotFoundError('Order');

    return NextResponse.json({ success: true, data: order }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
