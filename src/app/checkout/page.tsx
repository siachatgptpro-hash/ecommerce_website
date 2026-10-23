'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Mail,
  House,
  Building2,
  Map,
  Hash,
  Zap,
  Sprout,
  Flower2,
  ChevronRight,
  Leaf,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/** Normalises to bare 10 digits — mirrors the server-side rule exactly. */
function normalizeIndianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { items, calculation, appliedCoupon, clearCart, loading } = useCart();

  const paymentMethod = 'RAZORPAY' as const;
  const [submitting, setSubmitting] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldValue = (field: string, value: string, setter: (value: string) => void) => {
    setter(value);
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setErrorMsg('');
  };

  const validateCheckout = () => {
    const errors: Record<string, string> = {};
    const normalizedPhone = normalizeIndianPhone(phone);
    const normalizedPin = postalCode.replace(/\D/g, '');
    if (!fullName.trim()) errors.fullName = 'Enter your full name.';
    else if (fullName.trim().length < 2) errors.fullName = 'Name must contain at least 2 characters.';
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) errors.phone = 'Enter a valid 10-digit Indian mobile number (starting with 6–9).';
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!addressLine1.trim()) errors.addressLine1 = 'Enter your house number and street address.';
    if (!city.trim()) errors.city = 'Enter your city or district.';
    if (!state.trim()) errors.state = 'Select your state.';
    if (!/^\\d{6}$/.test(normalizedPin)) errors.postalCode = 'Enter a valid 6-digit PIN code.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Shipping Form State
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent('/checkout')}`);
    }
  }, [authLoading, user, router]);

  // Next.js loads Razorpay through the page script below. This guard handles a fast click.
  const ensureRazorpayLoaded = async () => {
    if (window.Razorpay) return true;
    await new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const poll = window.setInterval(() => {
        if (window.Razorpay) {
          window.clearInterval(poll);
          resolve();
        } else if (Date.now() - started > 10000) {
          window.clearInterval(poll);
          reject(new Error('Razorpay payment window could not load. Please disable content blockers and retry.'));
        }
      }, 100);
    });
    return Boolean(window.Razorpay);
  };

  // Update default user info
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.fullName || user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, fullName, email, phone]);

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-sm text-gray-600">Please add items to your cart before proceeding to checkout.</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-3 rounded-full bg-[#1B4332] text-white text-xs font-bold"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // duplicate-submission guard (double-click / Enter)
    setErrorMsg('');

    if (!validateCheckout()) {
      setErrorMsg('Please correct the highlighted fields before continuing.');
      return;
    }

    setSubmitting(true);

    try {
      // Confirm the checkout window is ready before creating a server-side pending order.
      await ensureRazorpayLoaded();

      const shippingAddress = {
        fullName: fullName.trim(),
        phone: normalizeIndianPhone(phone),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: 'India',
      };

      // ONLINE RAZORPAY PAYMENT FLOW
        const initRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: fullName.trim(),
            customerEmail: email.trim(),
            customerPhone: normalizeIndianPhone(phone),
            items: items.map((i) => ({
              productVariantId: i.productVariantId,
              quantity: i.quantity,
            })),
            shippingAddress,
            couponCode: appliedCoupon?.code,
          }),
        });

        const initData = await initRes.json();
        if (!initRes.ok || !initData.success) {
          throw new Error(initData.error?.message || 'Failed to initialize payment gateway');
        }

        const { razorpayOrderId, amount, currency, orderId, keyId } = initData.data;

        // Wait for the external checkout script even if the customer submits quickly.
        await ensureRazorpayLoaded();
        if (typeof window !== 'undefined' && window.Razorpay) {
          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'Shlokveda',
            description: 'Product catalogue order',
            order_id: razorpayOrderId,
            prefill: {
              name: fullName,
              email: email,
              contact: phone,
            },
            theme: {
              color: '#1B4332',
            },
            handler: async function (response: any) {
              try {
                // Verify signature on backend
                const verifyRes = await fetch('/api/payments/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: orderId,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  }),
                });

                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData.success) {
                  throw new Error(verifyData.error?.message || 'Payment verification failed');
                }

                await clearCart();
                router.push(`/order-confirmation?orderId=${orderId}`);
              } catch (verifyErr: any) {
                setErrorMsg(verifyErr.message || 'Payment verification error.');
                setSubmitting(false);
              }
            },
            modal: {
              ondismiss: function () {
                setSubmitting(false);
              },
            },
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
        } else {
          throw new Error('Online checkout did not load. Please retry.');
        }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong during checkout.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(Boolean(window.Razorpay))}
        onError={() => setErrorMsg('Razorpay payment window could not load. Please disable content blockers and retry.')}
      />
      <div className="relative overflow-x-clip">
        {/* Botanical frame (decorative): warm sunlight and masked corner
            foliage behind the z-10 checkout content. No falling leaves on
            checkout — transactional pages stay clear and focused. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_36%_at_50%_0%,rgba(217,190,140,0.22),transparent_70%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-70 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-70 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.5s' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -left-10 h-64 w-64 origin-bottom-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_100%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_9.5s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '1s' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 origin-bottom-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_100%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10.5s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.3s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/cart" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Cart</Link>
            <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
            <span aria-current="page" className="text-gray-900 font-bold">Checkout</span>
          </nav>

          {/* Hero: heading, live progress steps, trust medallion */}
          <div className="flex flex-col gap-5 border-b border-[#E9E0CC]/80 pb-6 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#0F281E] sm:text-4xl">
                Checkout
              </h1>
              <p className="mt-1.5 text-sm text-gray-600">
                Complete your order in a few simple steps
              </p>
            </div>

            <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
              {[
                { step: 1, label: 'Details' },
                { step: 2, label: 'Payment' },
                { step: 3, label: 'Review' },
              ].map(({ step, label }, index, arr) => {
                const isActive = step === (submitting ? 2 : 1);
                return (
                  <li key={step} className="flex items-center gap-2 sm:gap-3">
                    <span
                      aria-current={isActive ? 'step' : undefined}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all duration-[var(--dur-ui)] ease-luxe ${
                        isActive
                          ? 'bg-[#1B4332] text-white shadow-[0_0_18px_rgba(197,168,128,0.55)] ring-2 ring-[#C5A880]'
                          : 'border border-[#D8CFBB] bg-white/80 text-gray-500'
                      }`}
                    >
                      {step}
                    </span>
                    <span className={`text-xs font-bold sm:text-[13px] ${isActive ? 'text-[#0F281E]' : 'text-gray-500'}`}>{label}</span>
                    {index < arr.length - 1 && (
                      <span aria-hidden="true" className="h-px w-6 bg-gradient-to-r from-[#D9BE8C] to-[#D8CFBB] sm:w-10" />
                    )}
                  </li>
                );
              })}
            </ol>

            <div className="hidden items-center gap-3 md:flex">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center">
                <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.55),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" />
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_16px_rgba(197,168,128,0.45)]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
              </span>
              <span>
                <span className="block text-[13px] font-bold leading-tight text-gray-900">Safe & Secure Checkout</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">Your information is protected.</span>
              </span>
            </div>
          </div>

          <div role="note" className="rounded-2xl border border-emerald-200 bg-emerald-50/85 p-4 text-xs leading-relaxed text-emerald-950 backdrop-blur-sm">
            Online payment is required. Your payment is verified securely before the order is approved for fulfillment.
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: CONTACT & SHIPPING DETAILS */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Details */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_20px_44px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '60ms' }}>
                <h2 className="flex items-center gap-3 font-serif text-lg font-bold text-[#0F281E] sm:text-xl">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" />
                    <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_14px_rgba(197,168,128,0.4)]">
                      <User className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                  </span>
                  <span>1. Contact & Customer Details</span>
                  <Sprout className="ml-auto h-5 w-5 shrink-0 text-[#C5A880]/80" aria-hidden="true" />
                </h2>
                <p className="-mt-2 text-xs leading-relaxed text-gray-500">We’ll use this information to keep you updated about your order.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-full-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                      <input
                        id="checkout-full-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFieldValue('fullName', e.target.value, setFullName)}
                        placeholder="e.g. Ramesh Chandra Sharma"
                        aria-invalid={Boolean(fieldErrors.fullName)}
                        aria-describedby={fieldErrors.fullName ? 'checkout-full-name-error' : undefined}
                        className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                      />
                    </div>
                    {fieldErrors.fullName && <p id="checkout-full-name-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.fullName}</p>}
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      10-Digit Mobile Phone *
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setFieldValue('phone', e.target.value, setPhone)}
                        placeholder="e.g. 9876543210"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={fieldErrors.phone ? 'checkout-phone-error' : undefined}
                        className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                      />
                    </div>
                    {fieldErrors.phone && <p id="checkout-phone-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.phone}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="checkout-email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                      <input
                        id="checkout-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setFieldValue('email', e.target.value, setEmail)}
                        placeholder="e.g. ramesh@example.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                        className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                      />
                    </div>
                    {fieldErrors.email && <p id="checkout-email-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_20px_44px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '140ms' }}>
                <h2 className="flex items-center gap-3 font-serif text-lg font-bold text-[#0F281E] sm:text-xl">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: '0.8s' }} />
                    <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_14px_rgba(197,168,128,0.4)]">
                      <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                  </span>
                  <span>2. Delivery Address</span>
                  <Flower2 className="ml-auto h-5 w-5 shrink-0 text-[#C5A880]/80" aria-hidden="true" />
                </h2>
                <p className="-mt-2 text-xs leading-relaxed text-gray-500">Your order will be delivered to this address.</p>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="checkout-address-line-1" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Flat, House No., Building, Street *
                    </label>
                    <div className="relative">
                      <House className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                      <input
                        id="checkout-address-line-1"
                        type="text"
                        required
                        autoComplete="address-line1"
                        value={addressLine1}
                        onChange={(e) => setFieldValue('addressLine1', e.target.value, setAddressLine1)}
                        placeholder="e.g. House No. 42, Civil Lines Road"
                        aria-invalid={Boolean(fieldErrors.addressLine1)}
                        aria-describedby={fieldErrors.addressLine1 ? 'checkout-address-line-1-error' : undefined}
                        className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.addressLine1 ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                      />
                    </div>
                    {fieldErrors.addressLine1 && <p id="checkout-address-line-1-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.addressLine1}</p>}
                  </div>

                  <div>
                    <label htmlFor="checkout-address-line-2" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Landmark / Colony (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                      <input
                        id="checkout-address-line-2"
                        type="text"
                        autoComplete="address-line2"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        placeholder="e.g. Near Shiv Temple, Hathras"
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe hover:border-[#D9BE8C] focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="checkout-city" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        City / District *
                      </label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                        <input
                          id="checkout-city"
                          type="text"
                          required
                          autoComplete="address-level2"
                          value={city}
                          onChange={(e) => setFieldValue('city', e.target.value, setCity)}
                          placeholder="e.g. Hathras"
                          aria-invalid={Boolean(fieldErrors.city)}
                          aria-describedby={fieldErrors.city ? 'checkout-city-error' : undefined}
                          className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                        />
                      </div>
                      {fieldErrors.city && <p id="checkout-city-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.city}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-state" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        State *
                      </label>
                      <div className="relative">
                        <Map className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                        <select
                          id="checkout-state"
                          autoComplete="address-level1"
                          value={state}
                          onChange={(e) => setFieldValue('state', e.target.value, setState)}
                          aria-invalid={Boolean(fieldErrors.state)}
                          aria-describedby={fieldErrors.state ? 'checkout-state-error' : undefined}
                          className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 bg-white ${fieldErrors.state ? 'border-red-500' : 'border-gray-300 hover:border-[#D9BE8C]'}`}
                        >
                          {INDIAN_STATES.map((stateName) => (
                            <option key={stateName} value={stateName}>
                              {stateName}
                            </option>
                          ))}
                        </select>
                      </div>
                      {fieldErrors.state && <p id="checkout-state-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.state}</p>}
                    </div>

                    <div>
                      <label htmlFor="checkout-postal-code" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        6-Digit PIN Code *
                      </label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A67C2E]" aria-hidden="true" />
                        <input
                          id="checkout-postal-code"
                          type="text"
                          required
                          autoComplete="postal-code"
                          maxLength={6}
                          value={postalCode}
                          onChange={(e) => setFieldValue('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6), setPostalCode)}
                          placeholder="e.g. 204101"
                          inputMode="numeric"
                          aria-invalid={Boolean(fieldErrors.postalCode)}
                          aria-describedby={fieldErrors.postalCode ? 'checkout-postal-code-error' : undefined}
                          className={`w-full rounded-xl border py-2.5 pl-11 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(27,67,50,0.04)] transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40 ${fieldErrors.postalCode ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white hover:border-[#D9BE8C]'}`}
                        />
                      </div>
                      {fieldErrors.postalCode && <p id="checkout-postal-code-error" className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_20px_44px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '220ms' }}>
                <h2 className="flex items-center gap-3 font-serif text-lg font-bold text-[#0F281E] sm:text-xl">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: '1.6s' }} />
                    <span className="relative grid h-9 w-9 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_14px_rgba(197,168,128,0.4)]">
                      <CreditCard className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                  </span>
                  <span>3. Select Payment Mode</span>
                </h2>
                <p className="-mt-2 text-xs leading-relaxed text-gray-500">Choose a secure payment method to complete your order.</p>

                {/* Razorpay Option */}
                <label
                  className="flex cursor-default items-start gap-3 rounded-2xl border-2 border-[#1B4332] bg-[#1B4332]/5 p-4 shadow-[0_0_24px_rgba(197,168,128,0.3)] ring-1 ring-[#C5A880]/50 sm:items-center"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'RAZORPAY'}
                    readOnly
                    className="mt-1 shrink-0 text-[#1B4332] focus:ring-[#1B4332]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900">
                      Online Payment (UPI, Cards, NetBanking)
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose an available payment method in Razorpay checkout.
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      <Zap className="h-3 w-3 fill-current" aria-hidden="true" />
                      Fastest Dispatch
                    </span>
                  </div>
                  <div className="ml-auto hidden shrink-0 items-center gap-1.5 md:flex" aria-hidden="true">
                    {['UPI', 'Cards', 'NetBanking'].map((method) => (
                      <span key={method} className="rounded-md border border-[#E3DCCB] bg-white px-2 py-1 text-[9px] font-extrabold tracking-wide text-gray-600 shadow-sm">
                        {method}
                      </span>
                    ))}
                  </div>
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER REVIEW & PAY BUTTON */}
            <div className="space-y-6 xl:sticky xl:top-36 xl:self-start">
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_20px_44px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm space-y-4 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '120ms' }}>
                <h3 className="flex items-center gap-2 border-b border-[#EFE7D8] pb-3 font-serif text-lg font-bold text-[#0F281E]">
                  <Leaf className="h-5 w-5 fill-[#1B4332] text-[#1B4332]" aria-hidden="true" />
                  Order Summary ({items.length} items)
                </h3>

                {/* Item list preview */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-[#E9E0CC]">
                        {item.productVariant?.product?.images?.[0]?.imageUrl ? (
                          <Image
                            src={item.productVariant.product.images[0].imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#1B4332]/30">
                            <Leaf className="h-5 w-5" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {item.productVariant?.product?.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Qty: {item.quantity} × {item.productVariant?.sizeLabel}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-900">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                {/* Free-shipping progress (server-held threshold) */}
                {calculation && !calculation.isFreeShipping && calculation.amountNeededForFreeShipping > 0 && (
                  <div className="rounded-2xl border border-[#E9E0CC] bg-[#FAF7F2] px-4 py-3">
                    <p className="text-xs text-gray-700">
                      Add <strong className="text-[#1B4332]">₹{calculation.amountNeededForFreeShipping}</strong> more to get <strong>FREE Delivery!</strong>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7DFC8]"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={calculation.freeShippingThreshold || 499}
                        aria-valuenow={calculation.subtotal || 0}
                        aria-label="Progress to free delivery"
                      >
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#2D6A4F,#C5A880)] shadow-[0_0_10px_rgba(197,168,128,0.5)] transition-all duration-500 ease-luxe"
                          style={{ width: `${Math.min(100, ((calculation.subtotal || 0) / (calculation.freeShippingThreshold || 499)) * 100)}%` }}
                        />
                      </div>
                      <Truck className="h-4 w-4 shrink-0 text-[#1B4332]" aria-hidden="true" />
                      <span className="shrink-0 text-[11px] font-semibold text-gray-600">₹{calculation.amountNeededForFreeShipping} to go</span>
                    </div>
                  </div>
                )}

                {/* Calculation summary */}
                <div className="border-t border-gray-200 pt-3 space-y-2 text-xs sm:text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{calculation?.subtotal || 0}</span>
                  </div>

                  {calculation && calculation.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span>- ₹{calculation.discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span>
                      {calculation?.shippingFee === 0 ? (
                        <span className="text-emerald-700 font-bold uppercase text-xs">FREE</span>
                      ) : (
                        `₹${calculation?.shippingFee || 50}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Taxes & GST (Included)</span>
                    <span>₹{calculation?.taxAmount || 0}</span>
                  </div>

                  <div className="flex items-baseline justify-between rounded-2xl bg-[#EAF3EC] px-4 py-3.5">
                    <span className="text-base font-bold text-gray-900">Net Payable</span>
                    <span className="font-serif text-[28px] font-black leading-none text-[#1B4332]">
                      ₹{calculation?.finalTotal || 0}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C5A880]/60 bg-[#1B4332] py-4 text-sm font-bold uppercase tracking-wider text-white shadow-[0_18px_38px_-14px_rgba(27,67,50,0.75),0_0_24px_rgba(197,168,128,0.4)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_22px_44px_-14px_rgba(197,168,128,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:hover:scale-[1.01]"
                >
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Processing Order...'
                      : paymentMethod === 'RAZORPAY'
                      ? `Pay ₹${calculation?.finalTotal || 0} Online`
                      : 'Pay Online Securely'}
                  </span>
                  {!submitting && (
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                  )}
                </button>

                <div className="space-y-2 pt-2 text-[11px] text-gray-500">
                  <p>Delivery serviceability and timelines are not configured for this preview. Confirm them before a live purchase.</p>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-3 gap-2 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 px-3 py-4 shadow-[0_16px_36px_-24px_rgba(27,67,50,0.4)] backdrop-blur-sm">
                {[
                  { icon: ShieldCheck, title: 'Secure Payments', text: 'Processed via Razorpay' },
                  { icon: Truck, title: 'Free Shipping', text: `On orders ₹${calculation?.freeShippingThreshold || 499}+` },
                  { icon: RotateCcw, title: 'Returns & Refunds', text: 'As per our return policy' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex flex-col items-center gap-1 px-1 text-center">
                    <Icon className="h-5 w-5 text-[#A67C2E] [filter:drop-shadow(0_0_6px_rgba(197,168,128,0.55))]" strokeWidth={1.7} aria-hidden="true" />
                    <span className="text-[11px] font-bold leading-tight text-gray-900">{title}</span>
                    <span className="text-[10px] leading-snug text-gray-500">{text}</span>
                  </div>
                ))}
              </div>

              {/* Reassurance card */}
              <div className="rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-5 shadow-[0_16px_36px_-24px_rgba(27,67,50,0.4)] backdrop-blur-sm">
                <h3 className="flex items-center gap-2.5 font-serif text-base font-bold text-[#0F281E]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_14px_rgba(197,168,128,0.4)]">
                    <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  Your Order is Safe with Us
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600">
                  {[
                    'Secure checkout connection.',
                    'Personal information handled according to the privacy policy.',
                    'Order details available for review before payment.',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
