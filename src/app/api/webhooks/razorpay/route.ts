import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/repositories/order.repository';
import { RazorpayService } from '@/services/razorpay.service';
import { OrderService } from '@/services/order.service';
import { PaymentStatus } from '@/types';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Razorpay webhook: raw body is verified before JSON parsing or side effects. */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });

    const valid = await RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });

    const event = JSON.parse(rawBody) as any;
    const eventId = typeof event.id === 'string' && event.id.length > 0
      ? event.id
      : `body_${crypto.createHash('sha256').update(rawBody).digest('hex')}`;
    if (isPostgresConfigured()) {
      const inserted = await pgQuery(
        'INSERT INTO "RazorpayWebhookEvent" ("id","event","status") VALUES ($1,$2,$3) ON CONFLICT ("id") DO NOTHING RETURNING "id"',
        [eventId, String(event.event || 'unknown'), 'PROCESSING']
      );
      if (inserted.rows.length === 0) {
        const existing = await pgQuery('SELECT "status" FROM "RazorpayWebhookEvent" WHERE "id"=$1', [eventId]);
        if (existing.rows[0]?.status === 'PROCESSED') return NextResponse.json({ received: true, duplicate: true });
      }
    }
    const payment = event?.payload?.payment?.entity;
    if (!payment || !['payment.captured', 'payment.failed'].includes(event.event)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;
    if (typeof razorpayOrderId !== 'string' || typeof razorpayPaymentId !== 'string') {
      return NextResponse.json({ error: 'Malformed payment event' }, { status: 400 });
    }

    const order = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!order) return NextResponse.json({ received: true, ignored: true });

    if (event.event === 'payment.failed') {
      if (order.paymentStatus !== PaymentStatus.PAID) {
        await OrderRepository.updatePayment(order.id, {
          razorpayPaymentId,
          status: PaymentStatus.FAILED,
          gatewayResponse: event,
        });
      }
    } else {
      await OrderService.completePaymentFromWebhook(
        order.id,
        razorpayOrderId,
        razorpayPaymentId,
        Number(payment.amount),
        payment.currency
      );
    }

    if (isPostgresConfigured()) {
      await pgQuery('UPDATE "RazorpayWebhookEvent" SET "status"=$2,"processedAt"=CURRENT_TIMESTAMP,"error"=NULL WHERE "id"=$1', [eventId, 'PROCESSED']);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Razorpay Webhook Error]', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
