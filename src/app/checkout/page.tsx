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
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
    const normalizedPhone = phone.replace(/\\D/g, '');
    const normalizedPin = postalCode.replace(/\\D/g, '');
    if (!fullName.trim()) errors.fullName = 'Enter your full name.';
    else if (fullName.trim().length < 2) errors.fullName = 'Name must contain at least 2 characters.';
    if (!/^\\d{10}$/.test(normalizedPhone)) errors.phone = 'Enter a valid 10-digit mobile number.';
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
        phone: phone.trim(),
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
            customerPhone: phone.trim(),
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
            name: 'Sholkveda',
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/cart" className="hover:text-[#1B4332]">Cart</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold">Checkout</span>
      </div>

      <div className="flex items-center justify-between border-b border-[#F3EFE6] pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Complete Your Ayurvedic Order
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure checkout</span>
        </div>
      </div>

      <div role="note" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-950">
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
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#1B4332]" />
              <span>1. Contact & Customer Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFieldValue('fullName', e.target.value, setFullName)}
                  placeholder="e.g. Ramesh Chandra Sharma"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  10-Digit Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setFieldValue('phone', e.target.value, setPhone)}
                  placeholder="e.g. 9876543210"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setFieldValue('email', e.target.value, setEmail)}
                  placeholder="e.g. ramesh@example.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.email}</p>}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1B4332]" />
              <span>2. Delivery Address</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Flat, House No., Building, Street *
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setFieldValue('addressLine1', e.target.value, setAddressLine1)}
                  placeholder="e.g. House No. 42, Civil Lines Road"
                  aria-invalid={Boolean(fieldErrors.addressLine1)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.addressLine1 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.addressLine1 && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.addressLine1}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Landmark / Colony (Optional)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Near Shiv Temple, Hathras"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                  onChange={(e) => setFieldValue('city', e.target.value, setCity)}
                  placeholder="e.g. Hathras"
                  aria-invalid={Boolean(fieldErrors.city)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setFieldValue('state', e.target.value, setState)}
                    aria-invalid={Boolean(fieldErrors.state)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white ${fieldErrors.state ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Punjab">Punjab</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Other">Other State / UT</option>
                  </select>
                  {fieldErrors.state && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    6-Digit PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => setFieldValue('postalCode', e.target.value.replace(/\\D/g, '').slice(0, 6), setPostalCode)}
                    placeholder="e.g. 204101"
                    inputMode="numeric"
                    aria-invalid={Boolean(fieldErrors.postalCode)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] ${fieldErrors.postalCode ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {fieldErrors.postalCode && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.postalCode}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#1B4332]" />
              <span>3. Select Payment Mode</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Razorpay Option */}
              <label
                className="p-4 rounded-2xl border-2 border-[#1B4332] bg-[#1B4332]/5 cursor-default flex items-start gap-3"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'RAZORPAY'}
                  readOnly
                  className="mt-1 text-[#1B4332] focus:ring-[#1B4332]"
                />
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Online Payment (UPI, Cards, NetBanking)
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose an available payment method in Razorpay checkout.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ⚡ Fastest Dispatch
                  </span>
                </div>
              </label>


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER REVIEW & PAY BUTTON */}
        <div className="space-y-6">
          <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#F3EFE6] space-y-4 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
              Order Summary ({items.length} items)
            </h3>

            {/* Item list preview */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-gray-200">
                    {item.productVariant?.product?.images?.[0]?.imageUrl ? (
                      <Image
                        src={item.productVariant.product.images[0].imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">🌿</div>
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

              <div className="border-t border-gray-300 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">Net Payable</span>
                <span className="text-2xl font-serif font-black text-[#1B4332]">
                  ₹{calculation?.finalTotal || 0}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-[#1B4332] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#2D6A4F] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing Order...'
                  : paymentMethod === 'RAZORPAY'
                  ? `Pay ₹${calculation?.finalTotal || 0} Online`
                  : 'Pay Online Securely'}
              </span>
            </button>

            <div className="space-y-2 pt-2 text-[11px] text-gray-500">
              <p>Delivery serviceability and timelines are not configured for this preview. Confirm them before a live purchase.</p>
            </div>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
