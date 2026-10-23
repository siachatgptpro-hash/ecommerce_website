import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { OrderRepository } from '@/repositories/order.repository';
import { OrderService } from '@/services/order.service';
import { OrderStatus, PaymentStatus, PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_ORDERS);
    // Best-effort lazy cleanup so abandoned checkouts don't pile up even if
    // the cron job isn't configured. Never block the listing on failure.
    await OrderService.expireStalePendingOrders().catch(() => {});
    const { searchParams } = new URL(req.url);
    const orderStatus = (searchParams.get('status') as OrderStatus) || undefined;
    const paymentStatus = (searchParams.get('paymentStatus') as PaymentStatus) || undefined;
    const searchQuery = searchParams.get('q') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 25;

    const data = await OrderRepository.listOrders({
      orderStatus,
      paymentStatus,
      searchQuery,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
