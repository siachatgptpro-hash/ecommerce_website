'use client';

import { getPublicSettings } from '@/lib/client-data';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  TicketPercent,
  LayoutGrid,
  Newspaper,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  History,
  Store,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [storeName, setStoreName] = useState('SHLOKVEDA');

  useEffect(() => {
    getPublicSettings().then((settings) => {
      if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
      if (settings?.storeName) setStoreName(settings.storeName.toUpperCase());
    });
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products & SKUs', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
    { label: 'Inventory Ledger', href: '/admin/inventory', icon: Boxes },
    { label: 'Orders & Fulfillment', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Customer Directory', href: '/admin/customers', icon: Users },
    { label: 'Coupons & Promos', href: '/admin/coupons', icon: TicketPercent },
    { label: 'Review Moderation', href: '/admin/reviews', icon: MessageSquare },
    { label: 'CMS & Banners', href: '/admin/cms', icon: ImageIcon },
    { label: 'Blog Posts', href: '/admin/blog', icon: Newspaper },
    { label: 'Hathras Settings', href: '/admin/settings', icon: Settings },
    { label: 'Audit Trail', href: '/admin/audit-logs', icon: History },
  ];

  // The sign-in page must stay reachable for logged-out visitors — it lives
  // inside this layout, so render it bare (no sidebar, no gate).
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#1B4332] border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user is not admin, show permission gate.
  // Role names must match the backend SystemRole enum (src/types).
  const ADMIN_ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'];
  const isAdmin = user && (
    user.roles?.some((role: string) => ADMIN_ROLE_NAMES.includes(role)) ||
    (user.role ? ADMIN_ROLE_NAMES.includes(user.role) : false)
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-gray-900">Restricted Admin Suite</h2>
          <p className="text-xs text-gray-600">
            You must be signed in with an administrative role (using an authorized admin account) to access the Hathras management console.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/admin/login"
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col md:flex-row">
      {/* ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#1B4332] text-white shrink-0 flex flex-col justify-between border-r border-[#2D6A4F]">
        <div className="p-5 space-y-6">
          {/* Brand Logo */}
          <div className="space-y-1">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image src={logoUrl} alt={`${storeName} logo`} width={42} height={42} className="h-10 w-10 rounded-xl object-contain bg-white/95 p-0.5" />
              <div>
                <span className="font-serif text-sm font-black tracking-wider block text-white">
                  {storeName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#C5A880] block">
                  Admin Control Suite
                </span>
              </div>
            </Link>
            <div className="text-[10px] text-emerald-300 font-medium pl-1">
              📍 Hathras Unit (U.P. 204101)
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#C5A880] text-[#1B4332] shadow-sm'
                      : 'text-gray-200 hover:bg-[#2D6A4F] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Storefront Link */}
        <div className="p-4 border-t border-[#2D6A4F] bg-[#143427] space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{user.fullName || user.name || 'Admin'}</span>
              <span className="text-[10px] text-amber-300 font-mono block uppercase">
                {user.role || user.roles?.[0]}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-white/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>View Public Store</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
