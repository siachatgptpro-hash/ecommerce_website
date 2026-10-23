'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { MobileNav } from '@/components/shared/MobileNav';
import dynamic from 'next/dynamic';

// Cart drawer as its own chunk: the admin suite never downloads it, and on
// the storefront it streams in parallel without blocking first paint. It is
// client-only state UI (renders null while closed), so ssr:false is safe.
const MiniCart = dynamic(
  () => import('@/components/storefront/MiniCart').then((m) => m.MiniCart),
  { ssr: false }
);
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {!isAdmin && <Header />}
          {!isAdmin && <MiniCart />}
          <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
          {!isAdmin && <Footer />}
          {!isAdmin && <MobileNav />}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
