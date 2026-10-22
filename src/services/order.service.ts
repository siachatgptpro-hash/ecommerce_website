// ==============================================================================
// ORDER & FULFILLMENT SERVICE — SHOLKVEDA
// Complete Checkout, Payment Verification & Fulfillment State Machine
// ==============================================================================

import { AuditRepository } from '@/repositories/audit.repository';
import { CouponRepository } from '@/repositories/coupon.repository';
import { InventoryRepository } from '@/repositories/inventory.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { PricingService } from '@/services/pricing.service';
import { RazorpayService } from '@/services/razorpay.service';
import {
  Address,
  InventoryChangeReason,
  Order,
  OrderItem,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  ShipmentStatus,
} from '@/types';
import { NotFoundError, PaymentError, ValidationError } from '@/lib/errors';
import { isPostgresConfigured } from '@/lib/postgres';

export interface InitiateCheckoutInput {
  items: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  paymentGateway?: PaymentGateway;
  userId?: string;
}

export class OrderService {
  /**
   * 1. Initiate Checkout & Create Pending Order with Razorpay Order ID
   */
  public static async initiateCheckout(input: InitiateCheckoutInput): Promise<{
    order: Order;
    razorpayOrderId?: string;
    amountInPaise?: number;
    keyId?: string;
  }> {
    // 1. Recompute cart pricing and validate real-time stock on the server.
    // strictCoupon: an unusable coupon fails the checkout loudly instead of
    // silently charging full price.
    const pricing = await PricingService.calculateCart(input.items, input.couponCode, input.userId, { strictCoupon: true });
    if (pricing.items.length === 0) {
      throw new ValidationError('Your cart contains no valid items');
    }

    const paymentGateway = input.paymentGateway || PaymentGateway.RAZORPAY;
    if (paymentGateway === PaymentGateway.CASH_ON_DELIVERY) {
      // Controlled by the ENABLE_COD business setting (online-only by default).
      const business = await SettingsRepository.getBusinessSettings();
      if (!business.enableCod) {
        throw new ValidationError('Online payment is required. Cash on Delivery is not available.');
      }
    }
    if (paymentGateway === PaymentGateway.RAZORPAY) {
      await RazorpayService.assertConfigured();
    }

    // 3. Prepare Order Item Snapshots
    const orderItemsSnapshot: Array<Omit<OrderItem, 'id' | 'orderId'>> = pricing.items.map((item) => ({
      variantId: item.variantId,
      productNameSnapshot: item.productName,
      variantSizeSnapshot: item.sizeLabel,
      skuSnapshot: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    }));

    // 4. Create Pending Order Record
    const order = await OrderRepository.createOrder(
      {
        userId: input.userId || null,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        shippingAddress: input.shippingAddress,
        billingAddress: input.shippingAddress,
        subtotalAmount: pricing.subtotal,
        discountAmount: pricing.discountSavings,
        couponCode: pricing.couponCode || null,
        couponDiscount: pricing.couponDiscount,
        shippingFee: pricing.shippingFee,
        taxAmount: pricing.estimatedGst,
        totalPayableAmount: pricing.finalPayableAmount,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentGateway,
        adminNotes: null,
      },
      orderItemsSnapshot
    );

    // 4b. Reserve the stock while the customer completes payment, so the same
    // units cannot be promised to two checkouts. The reservation is converted
    // to a sale on payment success and released on failure/cancel/expiry.
    const reservationItems = pricing.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, sku: i.sku }));
    try {
      await InventoryRepository.reserveForOrder(reservationItems, order.orderNumber);
    } catch (error) {
      await OrderRepository.updateOrderStatus(order.id, OrderStatus.CANCELLED, 'Stock became unavailable during checkout');
      throw error;
    }

    // 5. If Prepaid (Razorpay), create Razorpay Order
    if (paymentGateway === PaymentGateway.RAZORPAY) {
      try {
        const rzpOrder = await RazorpayService.createOrder(pricing.finalPayableAmount, order.orderNumber, {
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone,
          order_id: order.id,
        });

        await OrderRepository.updatePayment(order.id, {
          razorpayOrderId: rzpOrder.razorpayOrderId,
          amount: pricing.finalPayableAmount,
          status: PaymentStatus.PENDING,
        });

        return {
          order,
          razorpayOrderId: rzpOrder.razorpayOrderId,
          amountInPaise: rzpOrder.amount,
          keyId: rzpOrder.keyId,
        };
      } catch (error) {
        await InventoryRepository.releaseReservation(reservationItems).catch(() => {});
        await OrderRepository.updateOrderStatus(order.id, OrderStatus.CANCELLED, 'Online payment initialization failed');
        throw error;
      }
    }

    // Cash on Delivery flow
    if (paymentGateway === PaymentGateway.CASH_ON_DELIVERY) {
      // For COD, confirm order immediately and convert the reservation to a sale
      await InventoryRepository.commitReservationForOrder(reservationItems, order.orderNumber);

      if (pricing.couponCode) {
        const coupon = await CouponRepository.findByCode(pricing.couponCode);
        if (coupon) {
          if (input.userId) await CouponRepository.recordUsage(coupon.id, input.userId, order.id);
          else await CouponRepository.recordGuestUsage(coupon.id);
        }
      }

      await OrderRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 'Cash on Delivery order placed');
    }

    return { order };
  }

  /**
   * Records coupon usage after a payment has been captured. A usage-limit
   * failure here must NEVER fail the order — the customer's money is already
   * taken and the discount was already granted in the charged amount — so
   * errors are audited for reconciliation instead of thrown.
   */
  private static async recordCouponUsageSafely(order: Order): Promise<void> {
    if (!order.couponCode) return;
    try {
      const coupon = await CouponRepository.findByCode(order.couponCode);
      if (!coupon) return;
      if (order.userId) await CouponRepository.recordUsage(coupon.id, order.userId, order.id);
      else await CouponRepository.recordGuestUsage(coupon.id);
    } catch (error) {
      console.error(`Coupon usage recording failed for order ${order.orderNumber}:`, error);
      await AuditRepository.log(
        'COUPON_USAGE_RECORD_FAILED',
        'Order',
        order.id,
        order.userId || null,
        order.customerEmail,
        null,
        { couponCode: order.couponCode, error: error instanceof Error ? error.message : String(error) }
      ).catch(() => {});
    }
  }

  /**
   * 2. Verify Razorpay Payment Signature and Atomically Complete Order
   */
  public static async verifyAndCompletePayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.paymentGateway !== PaymentGateway.RAZORPAY || order.payment?.razorpayOrderId !== razorpayOrderId) {
      throw new PaymentError('Payment does not match this order.');
    }

    // Idempotent check: If already paid, return early
    if (order.paymentStatus === PaymentStatus.PAID) {
      return order;
    }

    // Cryptographic signature verification
    await RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (isPostgresConfigured()) {
      const completed=await OrderRepository.completePaymentAtomically(order.id,razorpayOrderId,razorpayPaymentId,razorpaySignature);
      if(!completed.order)throw new NotFoundError('Order');
      if(!completed.alreadyPaid){
        await this.recordCouponUsageSafely(order);
        await AuditRepository.log('ORDER_PAYMENT_CAPTURED','Order',order.id,order.userId||null,order.customerEmail,{paymentStatus:'PENDING'},{paymentStatus:'PAID',razorpayPaymentId});
      }
      return completed.order;
    }

    // Convert the checkout reservation into a sale (stock + reserved decrease)
    const items = order.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      sku: item.skuSnapshot,
    }));
    await InventoryRepository.commitReservationForOrder(items, order.orderNumber);

    // Record Coupon Usage if applicable
    await this.recordCouponUsageSafely(order);

    // Update Payment & Order Statuses
    await OrderRepository.updatePayment(order.id, {
      razorpayPaymentId,
      razorpaySignature,
      status: PaymentStatus.PAID,
    });

    const confirmedOrder = await OrderRepository.updateOrderStatus(
      order.id,
      OrderStatus.CONFIRMED,
      'Prepaid order verified successfully via Razorpay'
    );

    await AuditRepository.log(
      'ORDER_PAYMENT_CAPTURED',
      'Order',
      order.id,
      order.userId || null,
      order.customerEmail,
      { paymentStatus: 'PENDING' },
      { paymentStatus: 'PAID', razorpayPaymentId }
    );

    return confirmedOrder!;
  }

  /** Complete a payment from a verified Razorpay webhook event. */
  public static async completePaymentFromWebhook(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    amountInPaise: number,
    currency: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order');
    if (currency !== 'INR' || Math.round(order.totalPayableAmount * 100) !== amountInPaise) {
      throw new PaymentError('Webhook amount or currency does not match the internal order.');
    }
    if (order.payment?.razorpayOrderId !== razorpayOrderId) {
      throw new PaymentError('Webhook order does not match the internal payment record.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) return order;

    if (isPostgresConfigured()) {
      const completed = await OrderRepository.completePaymentAtomically(order.id, razorpayOrderId, razorpayPaymentId, 'webhook-verified', true);
      if (!completed.order) throw new NotFoundError('Order');
      if (!completed.alreadyPaid) {
        await this.recordCouponUsageSafely(order);
      }
      return completed.order;
    }

    await InventoryRepository.commitReservationForOrder(order.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, sku: item.skuSnapshot })), order.orderNumber);
    await this.recordCouponUsageSafely(order);
    await OrderRepository.updatePayment(order.id, { razorpayPaymentId, status: PaymentStatus.PAID, gatewayResponse: { source: 'razorpay_webhook', razorpayPaymentId } });
    return (await OrderRepository.updateOrderStatus(order.id, OrderStatus.CONFIRMED, 'Payment confirmed by Razorpay webhook'))!;
  }

  /**
   * 3. Admin: Update Fulfillment Status (PACKED, SHIPPED, DELIVERED)
   */
  public static async updateFulfillment(
    orderId: string,
    status: OrderStatus,
    trackingCarrier?: string,
    trackingNumber?: string,
    adminNotes?: string,
    trackingUrl?: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Enforce the business fulfillment sequence server-side, not only in the admin UI.
    if (status === OrderStatus.CONFIRMED) {
      if (order.paymentStatus !== PaymentStatus.PAID) {
        throw new ValidationError('Approve is available only after online payment is confirmed.');
      }
    } else if (status === OrderStatus.SHIPPED) {
      if (order.orderStatus !== OrderStatus.CONFIRMED && order.orderStatus !== OrderStatus.PACKED) {
        throw new ValidationError('Approve the paid order before marking it Shifted.');
      }
    } else if (status === OrderStatus.DELIVERED) {
      if (order.orderStatus !== OrderStatus.SHIPPED) {
        throw new ValidationError('Mark the order Shifted before marking it Delivered.');
      }
    }

    if (trackingCarrier && trackingNumber) {
      await OrderRepository.updateShipment(
        order.id,
        trackingCarrier,
        trackingNumber,
        status === OrderStatus.DELIVERED ? ShipmentStatus.DELIVERED : ShipmentStatus.IN_TRANSIT,
        trackingUrl || null
      );
    }

    const updated = await OrderRepository.updateOrderStatus(orderId, status, adminNotes);
    return updated!;
  }

  /**
   * 4. Cancellation & Refund Workflow
   *
   * Ordering matters and every step is safe to retry:
   * 1. Refund FIRST (if it fails, nothing else has changed).
   * 2. Return stock to the pool (restore sold units, or release the
   *    reservation of an unpaid order).
   * 3. Give the coupon back.
   * 4. Mark the order cancelled. Re-cancelling is a no-op.
   */
  public static async cancelOrder(
    orderId: string,
    reason: string,
    actorUserId?: string
  ): Promise<Order> {
    const order = await OrderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      return order; // Idempotent — never restock or refund twice
    }

    if (order.orderStatus === OrderStatus.SHIPPED || order.orderStatus === OrderStatus.DELIVERED) {
      throw new ValidationError('Order has already been shipped and cannot be cancelled directly.');
    }

    const wasPaid = order.paymentStatus === PaymentStatus.PAID;

    // 1. Refund first. Skipped if a previous partial attempt already refunded.
    if (wasPaid && order.payment?.status !== PaymentStatus.REFUNDED && order.payment?.razorpayPaymentId) {
      const refund = await RazorpayService.processRefund(
        order.payment.razorpayPaymentId,
        order.totalPayableAmount,
        { order_number: order.orderNumber, reason }
      );

      await OrderRepository.updatePayment(order.id, {
        status: PaymentStatus.REFUNDED,
        refundId: refund.refundId,
        refundAmount: order.totalPayableAmount,
      });
    }

    // 2. Stock: paid orders sold units (restore them); unpaid orders only
    // hold a reservation (release it).
    const items = order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
    if (wasPaid) {
      await InventoryRepository.restoreForOrder(items, order.orderNumber, InventoryChangeReason.ORDER_CANCELLATION);
    } else {
      await InventoryRepository.releaseReservation(items);
    }

    // 3. Return the coupon to the customer (usage is only recorded once paid).
    if (wasPaid && order.couponCode) {
      const coupon = await CouponRepository.findByCode(order.couponCode).catch(() => null);
      if (coupon) {
        await CouponRepository.releaseUsage(coupon.id, order.id, !order.userId).catch((error) => {
          console.error(`Coupon release failed for order ${order.orderNumber}:`, error);
        });
      }
    }

    // 4. Mark cancelled
    const cancelledOrder = await OrderRepository.updateOrderStatus(
      order.id,
      OrderStatus.CANCELLED,
      `Cancelled: ${reason}`
    );

    await AuditRepository.log(
      'ORDER_CANCELLED',
      'Order',
      order.id,
      actorUserId || null,
      null,
      { status: order.orderStatus },
      { status: OrderStatus.CANCELLED, reason }
    );

    return cancelledOrder!;
  }

  /**
   * 5. Expire checkouts that were abandoned on the payment page so their
   * stock reservations don't lock inventory forever. Safe to call often
   * (cron + lazy invocation); each expired order is cancelled without refund
   * because no payment was captured.
   */
  public static async expireStalePendingOrders(maxAgeMs = 2 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    const { orders } = await OrderRepository.findMany({
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      limit: 500,
    });

    let expired = 0;
    for (const order of orders) {
      if (new Date(order.createdAt).getTime() > cutoff) continue;
      try {
        await this.cancelOrder(order.id, 'Checkout abandoned — payment not completed in time');
        expired++;
      } catch (error) {
        console.error(`Failed to expire stale order ${order.orderNumber}:`, error);
      }
    }
    return expired;
  }

  public initiateCheckout(input: any) { return OrderService.initiateCheckout(input); }
  public verifyAndCompletePayment(orderId: string, rzpOrderId: string, rzpPaymentId: string, sig: string) {
    return OrderService.verifyAndCompletePayment(orderId, rzpOrderId, rzpPaymentId, sig);
  }
  public updateFulfillment(orderId: string, status: any, carrier?: string, trackingNumber?: string, adminNotes?: string, trackingUrl?: string) {
    return OrderService.updateFulfillment(orderId, status, carrier, trackingNumber, adminNotes, trackingUrl);
  }
  public cancelOrder(orderId: string, reason: string, actorId?: string) {
    return OrderService.cancelOrder(orderId, reason, actorId);
  }
}

export const orderService = new OrderService();

