import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AuthService } from '@/services/auth.service';
import { resolveCookieSessionToken } from '@/lib/session';
import { orderRepository } from '@/repositories/order.repository';
import { settingsRepository } from '@/repositories/settings.repository';
import Image from 'next/image';
import {
  Package,
  Phone,
  CreditCard,
  Truck,
  MapPin,
  ReceiptText,
  ShoppingCart,
  Headphones,
  ShoppingBag,
  ArrowRight,
  Clock,
  X,
  Leaf,
  Sprout,
} from 'lucide-react';
import { FallingLeaves } from '@/components/botanical/FallingLeaves';
import { BROCHURE_PRODUCTS } from '@/lib/brochure-data';
import { CopyOrderNumber } from './CopyOrderNumber';

interface OrderConfirmationPageProps {
  searchParams: {
    orderId?: string;
    orderNumber?: string;
  };
}

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Pack-photo lookup for order line items (order items are price/name
// snapshots without images). Resolves against the seeded catalogue;
// unresolved variants fall back to a neutral leaf tile.
const VARIANT_IMAGE = new Map<string, string>();
for (const product of BROCHURE_PRODUCTS) {
  const url = product.images?.[0]?.url;
  if (!url) continue;
  for (const variant of product.variants) VARIANT_IMAGE.set(variant.id, url);
}

function GlowMedallion({ children, delay = '0s' }: { children: React.ReactNode; delay?: string }) {
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center">
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(45,106,79,0.32),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: delay }} />
      <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[#D9BE8C] bg-gradient-to-br from-[#2D6A4F] to-[#0F281E] text-[#F3E7CF] shadow-[0_8px_18px_-8px_rgba(15,40,30,0.7),0_0_16px_rgba(197,168,128,0.35)]">
        {children}
      </span>
    </span>
  );
}

function CreamMedallion({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center">
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" />
      <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_14px_rgba(197,168,128,0.4)]">
        {children}
      </span>
    </span>
  );
}

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
  const { orderId, orderNumber } = searchParams;

  // Order details contain personal data (name, address, phone) and order
  // numbers are sequential — this page must only ever show an order to the
  // customer who placed it.
  const suffix = orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
  const resolved = resolveCookieSessionToken(cookies(), 'customer');
  if (!resolved) redirect(`/login?next=${encodeURIComponent(`/order-confirmation${suffix}`)}`);
  let user: Awaited<ReturnType<typeof AuthService.getCurrentUser>> | null = null;
  try { user = await AuthService.getCurrentUser(resolved.token, { scope: 'customer' }); } catch { user = null; }
  if (!user) redirect(`/login?next=${encodeURIComponent(`/order-confirmation${suffix}`)}`);

  let order = null;
  if (orderId) {
    order = await orderRepository.findById(orderId);
  } else if (orderNumber) {
    order = await orderRepository.findByOrderNumber(orderNumber);
  }

  // Never reveal whether someone else's order exists.
  if (order && order.userId !== user.id) {
    notFound();
  }

  const business = await settingsRepository.getBusinessSettings();
  const isPaid = order?.paymentStatus === 'PAID';
  const isCancelled = (order?.orderStatus || order?.status) === 'CANCELLED';

  return (
    <div className="relative overflow-x-clip">
      {/* Botanical frame (decorative): sunlight, swaying corner foliage and
          sparse drifting leaves behind the z-10 confirmation content. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_38%_at_50%_0%,rgba(217,190,140,0.26),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-72 w-72 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-75 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-75 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_11s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.6s' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 origin-bottom-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_100%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10.5s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '1s' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 origin-bottom-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_100%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_11.5s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.3s' }} />
      <FallingLeaves preset="catalogue" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {/* SUCCESS HERO */}
        <div className="relative px-2 py-6 text-center sm:py-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_45%,rgba(250,247,242,0.88),transparent_72%)]" />

          <div className="relative space-y-5">
            {/* State medallion: animated drawing check only when the server
                reports PAID; clock while payment is pending. */}
            <div className="relative mx-auto grid h-24 w-24 place-items-center motion-safe:animate-[check-pop_.55s_cubic-bezier(.22,1,.36,1)_both]">
              <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" />
              {isPaid && (
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,rgba(255,241,205,0.75)_300deg,transparent_340deg)] [mask-image:radial-gradient(closest-side,transparent_80%,black_88%,transparent_97%)] motion-safe:animate-[ring-sweep_1.6s_ease-in-out_.35s_both]" />
              )}
              <span className={`relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br text-white shadow-[0_18px_38px_-14px_rgba(15,40,30,0.65),0_0_28px_rgba(197,168,128,0.45)] ring-2 ring-[#C5A880] ${
                isPaid
                  ? 'from-[#2D6A4F] to-[#0F281E]'
                  : isCancelled || !order
                  ? 'from-[#78716C] to-[#44403C]'
                  : 'from-[#B08968] to-[#A67C2E]'
              }`}>
                {isPaid ? (
                  <svg viewBox="0 0 52 52" className="h-12 w-12" fill="none" aria-hidden="true">
                    <path d="M14 27l8 8 16-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="[stroke-dasharray:40] motion-safe:animate-[check-draw_.45s_ease-out_.4s_both]" />
                  </svg>
                ) : isCancelled ? (
                  <X className="h-10 w-10" aria-hidden="true" />
                ) : !order ? (
                  <Package className="h-10 w-10" aria-hidden="true" />
                ) : (
                  <Clock className="h-10 w-10" aria-hidden="true" />
                )}
              </span>
            </div>

            <div className="space-y-2 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '150ms' }}>
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#A67C2E]">
                {!order
                  ? 'Order details unavailable'
                  : isCancelled
                  ? 'Order cancelled'
                  : isPaid
                  ? 'Payment confirmed'
                  : 'Payment pending'}
              </span>
              <h1 className="mx-auto max-w-2xl font-serif text-3xl font-bold leading-[1.15] text-[#0F281E] sm:text-[40px] sm:leading-[1.15]">
                {!order
                  ? 'We could not retrieve this order from the current server session'
                  : isCancelled
                  ? 'This order has been cancelled'
                  : isPaid
                  ? 'Thank you! Your order has been placed.'
                  : 'We are still waiting for your payment'}
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-gray-600">
                {!order
                  ? 'Please open your account to view your order history, or contact support with your order reference.'
                  : isCancelled
                  ? 'If a payment was captured for this order, the refund is processed to the original payment method. Please contact support if you need help.'
                  : isPaid
                  ? 'Your payment has been verified. The order will move through Approved, Shipped, and Delivered stages as it is fulfilled.'
                  : 'This order is not confirmed until payment succeeds. If you already paid, please wait a few minutes and refresh — bank confirmations can be delayed.'}
              </p>
            </div>

            {order && (
              <div className="motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '260ms' }}>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#D9BE8C]/80 bg-white/85 py-1.5 pl-4 pr-1.5 text-xs font-bold text-[#1B4332] shadow-[0_10px_24px_-12px_rgba(27,67,50,0.35)] backdrop-blur-sm">
                  <Package className="h-4 w-4 text-[#A67C2E]" aria-hidden="true" />
                  <span>Order Reference: #{order.orderNumber}</span>
                  <CopyOrderNumber orderNumber={order.orderNumber} />
                </div>
              </div>
            )}
          </div>
        </div>

        {order ? (
          <div className="space-y-6">
            {/* ORDER METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-5 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '180ms' }}>
                <GlowMedallion>
                  <Package className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </GlowMedallion>
                <div className="min-w-0">
                  <span className="text-xs text-gray-400 font-medium">Order Status</span>
                  <p className="mt-0.5 font-serif text-[17px] font-bold leading-snug text-[#0F281E]">
                    {order.paymentStatus === 'PAID' && order.status === 'PENDING' ? 'Awaiting Admin Approval' : order.status === 'CONFIRMED' ? 'Approved' : order.status === 'SHIPPED' ? 'Shipped' : order.status === 'DELIVERED' ? 'Delivered' : order.status === 'CANCELLED' ? 'Cancelled' : order.status}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">
                    {order.paymentStatus === 'PAID' && order.status === 'PENDING' ? 'Your order is awaiting confirmation from our team.' : order.status === 'CONFIRMED' ? 'Your order has been confirmed and is being processed.' : order.status === 'SHIPPED' ? 'Your order has been dispatched.' : order.status === 'DELIVERED' ? 'Your order has been delivered.' : 'Current status of your order.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-5 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '250ms' }}>
                <GlowMedallion delay="0.7s">
                  <CreditCard className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </GlowMedallion>
                <div className="min-w-0">
                  <span className="text-xs text-gray-400 font-medium">Payment Method & Status</span>
                  <p className="mt-0.5 font-serif text-[17px] font-bold leading-snug text-[#0F281E]">
                    Online payment ({order.paymentStatus})
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">
                    {isPaid ? 'Your payment has been successfully processed via Razorpay.' : 'Payment is not yet confirmed for this order.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-5 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '320ms' }}>
                <GlowMedallion delay="1.4s">
                  <Truck className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </GlowMedallion>
                <div className="min-w-0">
                  <span className="text-xs text-gray-400 font-medium">Delivery Estimate</span>
                  <p className="mt-0.5 font-serif text-[17px] font-bold leading-snug text-[#0F281E]">Not configured in this preview</p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-500">A delivery estimate is not available yet for this order.</p>
                </div>
              </div>
            </div>

            {/* SHIPPING & SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Details */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '360ms' }}>
                <h3 className="flex items-center gap-3 font-serif text-base font-bold text-[#0F281E] sm:text-lg">
                  <CreamMedallion>
                    <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                  </CreamMedallion>
                  <span>Shipping Information</span>
                  <Sprout className="ml-auto h-5 w-5 shrink-0 text-[#C5A880]/80" aria-hidden="true" />
                </h3>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1 leading-relaxed">
                  <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode || order.shippingAddress.pincode}
                  </p>
                  <p>Phone: +91 {order.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '420ms' }}>
                <h3 className="flex items-center gap-3 font-serif text-base font-bold text-[#0F281E] sm:text-lg">
                  <CreamMedallion>
                    <ReceiptText className="h-[18px] w-[18px]" aria-hidden="true" />
                  </CreamMedallion>
                  <span>Payment Breakdown</span>
                  <Sprout className="ml-auto h-5 w-5 shrink-0 text-[#C5A880]/80" aria-hidden="true" />
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>{order.discountAmount > 0 ? 'Item Total (MRP)' : 'Subtotal'}</span>
                    <span>₹{(order.subtotal ?? order.subtotalAmount) + (order.discountAmount || 0)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>MRP Discount</span>
                      <span>- ₹{order.discountAmount}</span>
                    </div>
                  )}
                  {order.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                      <span>- ₹{order.couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>GST (Included)</span>
                    <span>₹{order.taxAmount}</span>
                  </div>
                  <div className="flex items-baseline justify-between rounded-2xl bg-[#EAF3EC] px-4 py-3.5">
                    <span className="font-serif text-base font-bold text-gray-900">Total Amount</span>
                    <span className="font-serif text-2xl font-black leading-none text-[#1B4332]">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ITEM LIST */}
            <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '480ms' }}>
              <h3 className="flex items-center gap-3 font-serif text-base font-bold text-[#0F281E] sm:text-lg">
                <CreamMedallion>
                  <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
                </CreamMedallion>
                <span>Items Ordered ({order.items.length} item{order.items.length !== 1 ? 's' : ''})</span>
                <Sprout className="ml-auto h-5 w-5 shrink-0 text-[#C5A880]/80" aria-hidden="true" />
              </h3>
              <div className="divide-y divide-[#F3EFE6]">
                {order.items.map((item) => {
                  const imageUrl = VARIANT_IMAGE.get(item.variantId);
                  return (
                    <div key={item.id} className="flex items-center gap-4 py-3.5 text-xs sm:text-sm">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E9E0CC] bg-white">
                        {imageUrl ? (
                          <Image src={imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[#1B4332]/30">
                            <Leaf className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-gray-900">{item.productName}</span>
                        <span className="text-gray-500 block text-xs mt-0.5">
                          Variant: {item.variantLabel} | Quantity: {item.quantity}
                        </span>
                      </div>
                      <span className="shrink-0 font-bold text-gray-900">₹{item.totalPrice}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-8 text-center shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm">
            <p className="text-xs text-gray-500">Order details are temporarily unavailable. Please open your account to view persistent order history or contact support with your order reference.</p>
          </div>
        )}

        {/* SUPPORT CARD & ACTIONS */}
        <div className="flex flex-col gap-5 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] sm:p-7 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: '540ms' }}>
          <div className="flex items-start gap-3.5">
            <GlowMedallion delay="0.4s">
              <Headphones className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </GlowMedallion>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Need Assistance with your Order?</h4>
              <p className="mt-0.5 text-[11px] text-gray-600">We are here to help you.</p>
              <a
                href={`tel:+${business.phone}`}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D9BE8C] bg-white px-4 py-2 text-[13px] font-bold text-[#1B4332] shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:shadow-[0_10px_22px_-10px_rgba(197,168,128,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-[1.02]"
              >
                <Phone className="h-4 w-4 text-[#A67C2E]" aria-hidden="true" />
                Call +{business.phone}
              </a>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <Link
              href="/shop"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-[#C5A880]/60 bg-[#1B4332] px-8 py-3.5 text-[13px] font-bold text-white shadow-[0_16px_34px_-14px_rgba(27,67,50,0.75),0_0_22px_rgba(197,168,128,0.35)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_20px_40px_-14px_rgba(197,168,128,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 motion-safe:hover:scale-[1.02]"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
              Continue Shopping
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {order && (
              <Link
                href={`/orders/${order.orderNumber}`}
                className="inline-flex items-center justify-center gap-1.5 rounded text-[13px] font-bold text-[#1B4332] underline decoration-[#C5A880] decoration-2 underline-offset-4 transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] sm:justify-end"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                Track Your Order
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
