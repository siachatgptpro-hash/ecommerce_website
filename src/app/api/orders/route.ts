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

/**
 * Places a Cash-on-Delivery order. Online orders go through
 * /api/payments/create-order so a gateway order id exists before payment;
 * both paths share OrderService.initiateCheckout (server-side pricing,
 * stock reservation, the ENABLE_COD setting gate). This endpoint used to be
 * a hardcoded "COD is not available" stub even when an admin had enabled COD.
 */
export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) throw new AuthenticationError('Please log in before placing an order.');
    const user = await AuthService.getCurrentUser(token);

    const json = await req.json();
    const rawAddress = json?.shippingAddress || {};
    const normalized = {
      ...json,
      items: Array.isArray(json?.items)
        ? json.items.map((item: { productVariantId?: string; variantId?: string; quantity?: number }) => ({
            variantId: item.variantId || item.productVariantId,
            quantity: item.quantity,
          }))
        : json?.items,
      customerName: json?.customerName || rawAddress.fullName || user.fullName,
      customerEmail: json?.customerEmail || json?.email || user.email,
      customerPhone: json?.customerPhone || rawAddress.phone || user.phone,
      shippingAddress: {
        ...rawAddress,
        pincode: rawAddress.pincode || rawAddress.postalCode,
      },
      paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
    };

    const parsed = CheckoutInitiateSchema.safeParse(normalized);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const detail = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid order details';
      throw new ValidationError(`Please check your details — ${detail}`, parsed.error.flatten());
    }

    const now = new Date().toISOString();
    const parsedAddress = parsed.data.shippingAddress;
    const result = await OrderService.initiateCheckout({
      items: parsed.data.items,
      couponCode: parsed.data.couponCode,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      shippingAddress: {
        ...parsedAddress,
        id: `checkout_${Date.now()}`,
        userId: user.id,
        postalCode: parsedAddress.pincode,
        createdAt: now,
        updatedAt: now,
      },
      paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: result.order }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
