'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Order } from '@/types';
import {
  Package,
  MapPin,
  LogOut,
  Shield,
  ArrowRight,
  Mail,
  Phone,
  ChevronRight,
  Leaf,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { FallingLeaves } from '@/components/botanical/FallingLeaves';
import { Reveal } from '@/components/botanical/Reveal';
import { BROCHURE_PRODUCTS } from '@/lib/brochure-data';

// Pack-photo lookup for order line items (order items are price/name
// snapshots without images). Unresolved variants use a leaf tile.
const VARIANT_IMAGE = new Map<string, string>();
for (const product of BROCHURE_PRODUCTS) {
  const url = product.images?.[0]?.url;
  if (!url) continue;
  for (const variant of product.variants) VARIANT_IMAGE.set(variant.id, url);
}

function statusLabel(ord: Order): string {
  if (ord.paymentStatus === 'PAID' && ord.status === 'PENDING') return 'AWAITING APPROVAL';
  if (ord.status === 'CONFIRMED') return 'APPROVED';
  if (ord.status === 'SHIPPED') return 'SHIPPED';
  return ord.status || '';
}

function statusBadgeClass(ord: Order): string {
  if (ord.paymentStatus === 'FAILED') return 'bg-red-100 text-red-800';
  switch (ord.status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800';
    case 'CONFIRMED':
    case 'PACKED':
      return 'bg-sky-100 text-sky-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  async function cancelOrder(orderNumber: string) {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(orderNumber);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: 'POST' });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error?.message || 'Could not cancel this order. Please contact support.');
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNumber === orderNumber
            ? { ...o, orderStatus: 'CANCELLED' as Order['orderStatus'], status: 'CANCELLED' }
            : o
        )
      );
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel this order. Please contact support.');
    } finally {
      setCancellingId(null);
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  async function fetchUserOrders() {
    if (!user) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data.orders || []);
        setTotalOrders(data.data.total ?? (data.data.orders || []).length);
      } else {
        setOrdersError(data.error?.message || 'We could not load your order history right now. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching user orders:', err);
      setOrdersError('We could not load your order history right now. Please try again.');
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-[3px] border-[#1B4332] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Role names must match the backend SystemRole enum.
  const ADMIN_ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'];
  const isAdminUser =
    user.roles?.some((role: string) => ADMIN_ROLE_NAMES.includes(role)) ||
    (user.role ? ADMIN_ROLE_NAMES.includes(user.role) : false);

  const displayName = user.fullName || user.name || 'Ayurvedic Member';
  const initials = (user.fullName || user.name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="relative overflow-x-clip">
      {/* Botanical atmosphere (decorative): sunlight, corner foliage and
          sparse drifting leaves behind the z-10 account content. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_30%_at_50%_0%,rgba(217,190,140,0.2),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-64 sm:w-64" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_11s_ease-in-out_infinite_alternate] sm:h-64 sm:w-64" style={{ animationDelay: '0.7s' }} />
      <FallingLeaves preset="catalogue" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Home</Link>
          <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
          <Link href="/account" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Account</Link>
          <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
          <span aria-current="page" className="font-bold text-[#1B4332]">My Orders</span>
        </nav>

        {/* Account Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#E9E0CC]/90 shadow-[0_24px_50px_-28px_rgba(27,67,50,0.45)] motion-safe:animate-[fade-in_.6s_ease-out_both]">
          <div aria-hidden="true" className="absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-[position:72%_center] sm:bg-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,247,242,0.95)_0%,rgba(250,247,242,0.85)_42%,rgba(250,247,242,0.3)_72%,rgba(250,247,242,0.04)_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[#FAF7F2]/35 sm:hidden" />
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(217,190,140,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_7s_ease-in-out_infinite]" />
          <div className="relative max-w-2xl space-y-2.5 p-8 sm:p-10 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]">
            <h1 className="font-serif text-4xl font-bold leading-[1.12] text-[#0F281E] sm:text-5xl sm:leading-[1.12]">
              My Account
            </h1>
            <p className="text-sm leading-relaxed text-gray-600">
              View your orders, delivery details and account information.
            </p>
          </div>
        </section>

        {/* Profile Card */}
        <section aria-label="Profile" className="group flex flex-col gap-5 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_20px_44px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] sm:flex-row sm:items-center sm:justify-between sm:p-7" style={{ animationDelay: '90ms' }}>
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#2D6A4F] to-[#0F281E] font-serif text-2xl font-black text-white shadow-[0_12px_26px_-10px_rgba(15,40,30,0.65)] ring-1 ring-[#C5A880] transition-shadow duration-[var(--dur-ui)] ease-luxe group-hover:shadow-[0_12px_30px_-8px_rgba(45,106,79,0.75),0_0_20px_rgba(197,168,128,0.45)]">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-serif text-xl font-bold text-[#0F281E] sm:text-2xl">{displayName}</p>
                {isAdminUser ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    {user.role || user.roles?.[0]}
                  </span>
                ) : (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Ayurvedic Circle Member
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#A67C2E]" aria-hidden="true" />
                  {user.email}
                </span>
                {user.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#A67C2E]" aria-hidden="true" />
                    +91 {user.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isAdminUser && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2"
              >
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Admin Suite</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#D8CFBB] bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:bg-[#FBF3E2] hover:shadow-[0_10px_22px_-10px_rgba(197,168,128,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-[1.03]"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <Link
            href="#order-history"
            className="group flex items-center gap-4 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#D9BE8C] hover:shadow-[0_24px_44px_-24px_rgba(197,168,128,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] motion-safe:hover:-translate-y-1"
            style={{ animationDelay: '150ms' }}
          >
            <span className="relative grid h-14 w-14 shrink-0 place-items-center">
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" />
              <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_16px_rgba(197,168,128,0.4)] transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:scale-105">
                <Package className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Orders Placed</span>
              <span className="mt-0.5 block font-serif text-2xl font-black leading-none text-[#0F281E]">{totalOrders}</span>
              <span className="mt-1 block text-[11px] text-gray-500">Total orders with Shlokveda</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[#C5A880] transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-4 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '220ms' }}>
            <span className="relative grid h-14 w-14 shrink-0 place-items-center">
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: '0.7s' }} />
              <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_16px_rgba(197,168,128,0.4)]">
                <FileText className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Account Storage</span>
              <span className="mt-0.5 block font-serif text-[17px] font-bold leading-snug text-[#0F281E]">Persistent order history</span>
              <span className="mt-1 block text-[11px] text-gray-500">Your orders are saved for easy access</span>
            </span>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] sm:col-span-2 lg:col-span-1" style={{ animationDelay: '290ms' }}>
            <span className="relative grid h-14 w-14 shrink-0 place-items-center">
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: '1.4s' }} />
              <span className="relative grid h-12 w-12 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_16px_rgba(197,168,128,0.4)]">
                <MapPin className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Addresses</span>
              <span className="mt-0.5 block font-serif text-[17px] font-bold leading-snug text-[#0F281E]">Enter at checkout</span>
              <span className="mt-1 block text-[11px] text-gray-500">Delivery details are added with each order</span>
            </span>
          </div>
        </div>

        {/* RECENT ORDERS LIST */}
        <section id="order-history" className="scroll-mt-32 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-bold leading-[1.15] text-[#0F281E] sm:text-[28px] sm:leading-[1.15]">
                Your Order History
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">Track, view and manage all your orders.</p>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full border border-[#D9BE8C] bg-white/90 px-4 py-2.5 text-xs font-bold text-[#1B4332] shadow-sm backdrop-blur-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:shadow-[0_12px_26px_-12px_rgba(197,168,128,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-[1.02]"
            >
              <Leaf className="h-4 w-4 fill-[#1B4332] text-[#1B4332]" aria-hidden="true" />
              Explore More Formulations
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          {cancelError && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700" role="alert">{cancelError}</p>
          )}

          {loadingOrders ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading orders">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-3xl border border-[#E9E0CC]/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="h-4 w-44 animate-pulse rounded bg-[#EFE7D8]" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-[#EFE7D8]" />
                  </div>
                  <div className="mt-5 flex items-center gap-4">
                    <div className="h-14 w-14 animate-pulse rounded-2xl bg-[#EFE7D8]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-[#EFE7D8]" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-[#EFE7D8]" />
                    </div>
                    <div className="hidden h-10 w-36 animate-pulse rounded-full bg-[#EFE7D8] sm:block" />
                  </div>
                </div>
              ))}
            </div>
          ) : ordersError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50/85 p-8 text-center backdrop-blur-sm" role="alert">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-red-800">Order history could not be loaded</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-red-700">{ordersError}</p>
              <button
                type="button"
                onClick={fetchUserOrders}
                className="mt-4 rounded-full bg-[#1B4332] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="space-y-3 rounded-3xl border border-[#E9E0CC]/90 bg-white/85 p-12 text-center shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm">
              <Package className="mx-auto h-10 w-10 text-[#C5A880]" aria-hidden="true" />
              <p className="text-sm font-bold text-gray-800">You haven&apos;t placed any orders yet.</p>
              <p className="text-xs font-light text-gray-500">
                Order authentic classical formulations from Hathras and track them here.
              </p>
              <Link
                href="/shop"
                className="inline-block rounded-full bg-[#1B4332] px-6 py-2.5 text-xs font-bold text-white shadow-[0_14px_30px_-12px_rgba(27,67,50,0.7)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 motion-safe:hover:scale-[1.02]"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord, index) => (
                <Reveal key={ord.id} delay={Math.min(index, 5) * 70}>
                  <article className="space-y-4 rounded-3xl border border-[#E9E0CC]/90 bg-white/90 p-6 shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe hover:border-[#D9BE8C] hover:shadow-[0_24px_46px_-24px_rgba(197,168,128,0.6)]">
                    <div className="flex flex-col justify-between gap-2 border-b border-[#F3EFE6] pb-3.5 sm:flex-row sm:items-center">
                      <div>
                        <span className="text-xs font-medium text-gray-400">Order Reference:</span>
                        <span className="ml-1.5 text-sm font-bold text-[#1B4332]">
                          #{ord.orderNumber}
                        </span>
                        <span className="ml-3 text-xs text-gray-400">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(ord)}`}>
                          {statusLabel(ord)}
                        </span>
                        <span className="font-serif text-lg font-black text-gray-900">
                          ₹{ord.totalAmount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ord.items.map((item) => {
                        const imageUrl = VARIANT_IMAGE.get(item.variantId);
                        return (
                          <div key={item.id} className="flex items-center gap-4 text-xs sm:text-sm">
                            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E9E0CC] bg-white">
                              {imageUrl ? (
                                <Image src={imageUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                              ) : (
                                <span className="grid h-full w-full place-items-center text-[#1B4332]/30">
                                  <Leaf className="h-5 w-5" aria-hidden="true" />
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-bold text-gray-900">{item.productName}</span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                Qty: {item.quantity} × {item.variantLabel}
                              </span>
                            </span>
                            <span className="shrink-0 font-bold text-gray-900">₹{item.totalPrice}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EFE6] pt-4 text-xs">
                      <span className="text-gray-500">
                        Payment Method: <strong className="text-gray-800">{ord.paymentMethod}</strong> ({ord.paymentStatus})
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        {(ord.status === 'PENDING' || ord.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => cancelOrder(ord.orderNumber)}
                            disabled={cancellingId === ord.orderNumber}
                            className="rounded font-bold text-red-700 transition-colors hover:text-red-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
                          >
                            {cancellingId === ord.orderNumber ? 'Cancelling…' : 'Cancel Order'}
                          </button>
                        )}
                        <Link
                          href={`/orders/${ord.orderNumber}`}
                          className="group inline-flex items-center gap-2 rounded-full border border-[#C5A880]/60 bg-[#1B4332] px-5 py-2.5 text-xs font-bold text-white shadow-[0_12px_26px_-10px_rgba(27,67,50,0.7),0_0_18px_rgba(197,168,128,0.3)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_16px_32px_-10px_rgba(197,168,128,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 motion-safe:hover:scale-[1.02]"
                        >
                          <span>View Details & Status</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
