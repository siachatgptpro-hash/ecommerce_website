'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ShoppingCart, Truck, Leaf } from 'lucide-react';

const DRAWER_LEAVES = [
  { left: '12%', size: 15, duration: '13s', delay: '-3s', flutter: '3.4s', drift: '2rem', opacity: 0.55, color: '#2D6A4F' },
  { left: '38%', size: 12, duration: '16s', delay: '-10s', flutter: '4.1s', drift: '-1.75rem', opacity: 0.42, color: '#81975A' },
  { left: '63%', size: 17, duration: '12s', delay: '-6s', flutter: '3.1s', drift: '1.5rem', opacity: 0.5, color: '#4C8055' },
  { left: '86%', size: 13, duration: '15s', delay: '-12s', flutter: '3.8s', drift: '-2rem', opacity: 0.48, color: '#97A05A' },
] as const;

export function MiniCart() {
  const {
    isCartOpen,
    closeCart,
    calculation,
    rawItems,
    updateQuantity,
    removeItem,
    couponCode,
    applyCoupon,
    removeCoupon,
    isLoading,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [gstin, setGstin] = useState('09ANCPV6879P1ZP');
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [couponFeedback, setCouponFeedback] = useState<{ msg: string; isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.gstin) setGstin(data.data.gstin);
        if (data.success && data.data?.logoUrl) setLogoUrl(data.data.logoUrl);
      })
      .catch(() => {});
  }, []);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setIsApplying(true);
    setCouponFeedback(null);
    const res = await applyCoupon(inputCoupon);
    setIsApplying(false);
    setCouponFeedback({ msg: res.message, isError: !res.success });
    if (res.success) {
      setInputCoupon('');
    }
  };

  const items = calculation?.items || [];
  const subtotal = calculation?.subtotal || 0;
  const discountSavings = calculation?.discountSavings || 0;
  const couponDiscount = calculation?.couponDiscount || 0;
  const shippingFee = calculation?.shippingFee || 0;
  const isFreeShipping = calculation?.isFreeShipping || false;
  const amountNeeded = calculation?.amountNeededForFreeShipping || 0;
  const finalTotal = calculation?.finalPayableAmount || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity motion-safe:animate-[fade-in_.3s_ease-out_both]"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="relative w-screen max-w-md overflow-hidden bg-[#FDFBF6] shadow-2xl flex flex-col justify-between motion-safe:animate-[cart-slide-in_.38s_cubic-bezier(.22,1,.36,1)_both]">
          {/* Botanical frame inside the drawer (decorative): masked corner
              foliage crops of the storefront botanical photo, gently
              swaying behind the z-10 content sections. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_44%_at_50%_36%,rgba(217,190,140,0.22),transparent_72%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-8 -top-8 h-44 w-44 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:0%_0%] bg-no-repeat opacity-80 [mask-image:radial-gradient(ellipse_85%_85%_at_10%_10%,black_40%,transparent_72%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 origin-bottom-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:0%_100%] bg-no-repeat opacity-75 [mask-image:radial-gradient(ellipse_85%_85%_at_10%_90%,black_40%,transparent_72%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.8s' }} />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 origin-bottom-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:100%_100%] bg-no-repeat opacity-75 [mask-image:radial-gradient(ellipse_85%_85%_at_90%_90%,black_40%,transparent_72%)] motion-safe:animate-[leaf-sway_8.6s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.4s' }} />
          {/* HEADER */}
          <div className="relative z-10 p-4 sm:p-5 border-b border-[#E9E0CC]/80 flex items-center justify-between bg-[#FAF7F2]/85 backdrop-blur-sm">
            <div className="flex items-center space-x-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[#D9BE8C]/70 bg-white/90 shadow-[0_0_14px_rgba(197,168,128,0.35)]" aria-hidden="true">
                <Image src={logoUrl} alt="" width={40} height={40} className="h-8 w-8 object-contain" />
              </span>
              <span className="font-serif text-lg font-bold text-[#1B4332] sm:text-xl">
                Your{' '}
                <span className="bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">Healing</span>{' '}
                Basket
              </span>
              <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#1B4332] text-xs font-bold rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#C5A880]/80 bg-white/90 text-[#7C4A21] shadow-[0_0_14px_rgba(197,168,128,0.4)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-white hover:shadow-[0_0_20px_rgba(197,168,128,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-105"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FREE SHIPPING PROGRESS BAR */}
          <div className="relative z-10 bg-[#FAF7F2]/85 backdrop-blur-sm px-4 sm:px-5 py-3 border-b border-[#E9E0CC]/80">
            {isFreeShipping ? (
              <div className="flex items-center text-xs font-semibold text-emerald-800 space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Free delivery threshold reached.</span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-700 mb-2">
                  Add <strong className="text-[#1B4332]">₹{amountNeeded}</strong> more to get <strong>FREE Delivery!</strong>
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7DFC8]"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={calculation?.freeShippingThreshold || 499}
                    aria-valuenow={subtotal}
                    aria-label="Progress to free delivery"
                  >
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#2D6A4F,#C5A880)] shadow-[0_0_10px_rgba(197,168,128,0.5)] transition-all duration-500 ease-luxe"
                      style={{ width: `${Math.min(100, (subtotal / (calculation?.freeShippingThreshold || 499)) * 100)}%` }}
                    />
                  </div>
                  <Truck className="h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden="true" />
                  <span className="shrink-0 text-[11px] font-semibold text-gray-600">₹{amountNeeded} to go</span>
                </div>
              </div>
            )}
          </div>

          {/* CART ITEMS LIST */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#EFE7D8]">
            {items.length === 0 && rawItems.length > 0 && isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#1B4332]/20 border-t-[#1B4332] animate-spin" />
                <p className="text-sm font-semibold text-[#1B4332]">Adding to your basket…</p>
                <p className="text-xs text-gray-500">Updating price and availability.</p>
              </div>
            ) : items.length === 0 ? (
              <div className="relative flex h-full flex-col overflow-hidden">
                {/* Sparse leaves drifting inside the empty basket */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  {DRAWER_LEAVES.map((leaf, index) => (
                    <span
                      key={`${leaf.left}-${index}`}
                      className="absolute top-0 opacity-0 motion-safe:animate-[leaf-fall_linear_infinite]"
                      style={{
                        left: leaf.left,
                        animationDuration: leaf.duration,
                        animationDelay: leaf.delay,
                        '--leaf-drift': leaf.drift,
                        '--leaf-opacity': leaf.opacity,
                      } as React.CSSProperties}
                    >
                      <span
                        className="block motion-safe:animate-[leaf-flutter_ease-in-out_infinite_alternate]"
                        style={{ animationDuration: leaf.flutter, animationDelay: `${index * 0.3}s` }}
                      >
                        <Leaf aria-hidden="true" fill="currentColor" strokeWidth={0.7} style={{ width: leaf.size, height: leaf.size, color: leaf.color }} />
                      </span>
                    </span>
                  ))}
                </div>

                <div className="relative flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="relative">
                    <span aria-hidden="true" className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.4),transparent_70%)] motion-safe:animate-[banner-breathe_5s_ease-in-out_infinite]" />
                    <span className="relative grid h-28 w-28 place-items-center rounded-full border border-[#D9BE8C]/70 bg-[radial-gradient(circle_at_50%_30%,#FFFDF6,#F7EFDA_70%)] shadow-[0_0_36px_rgba(197,168,128,0.45),0_16px_32px_-16px_rgba(27,67,50,0.4)]">
                      <ShoppingCart className="h-11 w-11 text-[#A67C2E] [filter:drop-shadow(0_0_8px_rgba(197,168,128,0.55))]" strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    <span aria-hidden="true" className="absolute -left-5 bottom-0 -rotate-[24deg]">
                      <Leaf fill="currentColor" className="block h-6 w-6 origin-bottom-left text-[#2D6A4F] motion-safe:animate-[leaf-sway_7s_ease-in-out_infinite_alternate]" />
                    </span>
                    <span aria-hidden="true" className="absolute -right-5 bottom-1 rotate-[20deg]">
                      <Leaf fill="currentColor" className="block h-5 w-5 origin-bottom-right text-[#81975A] motion-safe:animate-[leaf-sway_8.5s_ease-in-out_infinite_alternate]" style={{ animationDelay: '0.7s' }} />
                    </span>
                  </div>
                  <h3 className="mt-7 font-serif text-[26px] font-bold leading-snug text-[#0F281E]">
                    Your basket is{' '}
                    <span className="bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">empty</span>
                  </h3>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500 sm:text-[13px]">
                    Browse products listed in the supplied brochure.
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-7 py-3 text-sm font-bold text-white shadow-[0_14px_34px_-10px_rgba(27,67,50,0.65),0_0_22px_rgba(197,168,128,0.45)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_18px_40px_-10px_rgba(197,168,128,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF6] motion-safe:hover:scale-[1.02]"
                  >
                    Browse catalogue
                    <ArrowRight className="h-4 w-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>

                {/* Trust strip */}
                <div className="relative mx-1 mb-1 grid grid-cols-3 divide-x divide-[#E9E0CC] rounded-2xl border border-[#E3D5B5]/80 bg-white/85 px-2 py-4 shadow-[0_16px_36px_-24px_rgba(27,67,50,0.5)] backdrop-blur-sm">
                  {[
                    { icon: Leaf, label: 'Authentic Ayurvedic Products' },
                    { icon: Truck, label: `Free shipping on orders ₹${calculation?.freeShippingThreshold || 499}+` },
                    { icon: ShieldCheck, label: 'Tradition for a Healthier Tomorrow' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 px-2 text-center">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#F6EBD2] text-[#A67C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" aria-hidden="true">
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <span className="text-[10px] font-semibold leading-snug text-[#334155]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex space-x-3.5 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 relative bg-gray-50 rounded-xl overflow-hidden border border-[#E9E0CC] flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#1B4332]/30"><Leaf className="h-6 w-6" aria-hidden="true" /></div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{item.productName}</h4>
                      <p className="text-[11px] text-gray-500">{item.sizeLabel}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E3DCCB] rounded-full bg-white overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C5A880]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C5A880]"
                          disabled={item.quantity >= item.availableStock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1B4332]">₹{item.lineTotal}</span>
                        {item.mrp > item.unitPrice && (
                          <span className="text-[10px] text-gray-400 line-through ml-1.5">
                            ₹{item.mrp * item.quantity}
                          </span>
                        )}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER & CHECKOUT SUMMARY */}
          {items.length > 0 && (
            <div className="relative z-10 p-4 sm:p-5 pb-24 md:pb-5 border-t border-[#E9E0CC]/90 bg-[#FAF7F2]/90 backdrop-blur-sm space-y-4">
              {/* Promo Code Form */}
              <div>
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
                    <span className="flex items-center font-bold">
                      <Tag className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Coupon: {couponCode} (-₹{couponDiscount})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-red-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs uppercase transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#C5A880]"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !inputCoupon.trim()}
                      className="px-3.5 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50"
                    >
                      {isApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponFeedback && (
                  <p
                    className={`text-[11px] mt-1 font-medium ${
                      couponFeedback.isError ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {couponFeedback.msg}
                  </p>
                )}
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {discountSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Retail Savings</span>
                    <span>-₹{discountSavings}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Savings</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? 'text-emerald-700 font-semibold' : 'text-gray-900'}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Total Payable</span>
                  <span className="text-[#1B4332] text-base">₹{finalTotal}</span>
                </div>
                <p className="text-[10px] text-gray-400 text-right">Inclusive of all taxes (GSTIN: {gstin})</p>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={closeCart}
                className="group w-full flex items-center justify-center space-x-2 py-3 bg-[#1B4332] text-white text-sm font-bold rounded-xl shadow-[0_14px_30px_-12px_rgba(27,67,50,0.65)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_18px_38px_-12px_rgba(197,168,128,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] motion-safe:hover:scale-[1.01]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
