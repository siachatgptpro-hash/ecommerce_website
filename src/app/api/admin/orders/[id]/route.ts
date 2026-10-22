import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/admin-auth';
import { OrderRepository } from '@/repositories/order.repository';
import { OrderService } from '@/services/order.service';
import { OrderStatus, PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

const OrderPutSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  adminNotes: z.string().trim().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_ORDERS);
    const order = await OrderRepository.findById(params.id);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_ORDERS);
    const json = await req.json();
    // Only real order statuses are accepted, and "cancel" always goes through
    // the cancellation workflow (refund + restock) — never a bare status flip.
    const payload = OrderPutSchema.parse({ ...json, status: json.status ?? json.orderStatus });

    const order =
      payload.status === OrderStatus.CANCELLED
        ? await OrderService.cancelOrder(params.id, payload.adminNotes || 'Admin cancelled', admin.userId)
        : await OrderService.updateFulfillment(
            params.id,
            payload.status,
            payload.carrier,
            payload.trackingNumber,
            payload.adminNotes
          );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
