import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/services/order.service';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * Cancels checkouts abandoned on the payment page (releasing their stock
 * reservations). Invoked by Vercel Cron (see vercel.json); protected by the
 * CRON_SECRET bearer token Vercel automatically sends. For manual/other
 * schedulers, pass `x-cron-secret: <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const provided = req.headers.get('authorization')?.replace('Bearer ', '') || req.headers.get('x-cron-secret');
      if (provided !== secret) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
          { status: 401 }
        );
      }
    }

    const expired = await OrderService.expireStalePendingOrders();
    return NextResponse.json({ success: true, data: { expired } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
