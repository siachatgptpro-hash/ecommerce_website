import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { AuthService } from '@/services/auth.service';
import { OrderService } from '@/services/order.service';
import { CheckoutInitiateSchema } from '@/schemas';
import { AuthenticationError, handleApiError, ValidationError } from '@/lib/errors';
import { PaymentGateway } from '@/types';

export const dynamic = 'force-dynamic';

function getToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  return authHeader?.replace(/^Bearer\s+/i, '') || req.cookies.get('shlokveda_session_token')?.value;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) throw new AuthenticationError();

    const user = await AuthService.getCurrentUser(token);
    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const orders = await OrderRepository.listOrders({
      userId: user.id,
      page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
      limit: Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 20,
    });

    return NextResponse.json(
      { success: true, data: { orders: orders.orders, total: orders.total, page: orders.page, totalPages: orders.totalPages } },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, error: { message: 'Online payment is required. Cash on Delivery is not available.' } },
    { status: 400 }
  );
}
