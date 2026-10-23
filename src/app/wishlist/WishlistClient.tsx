'use client';

import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { GlowIcon } from '@/components/about/GlowIcon';
import { useWishlist } from '@/context/wishlist-context';

export function WishlistClient({ products }: { products: Product[] }) {
  const { wishlist } = useWishlist();
  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  if (savedProducts.length === 0) {
    return (
      <section
        className="relative overflow-hidden rounded-[2rem] border border-[#E3D5B5] bg-white/85 px-5 py-14 text-center shadow-[0_24px_50px_-28px_rgba(27,67,50,0.45)] backdrop-blur motion-safe:animate-[rise-in_.65s_cubic-bezier(.22,1,.36,1)_both]"
        style={{ animationDelay: '120ms' }}
      >
        <div className="group mx-auto w-fit">
          <GlowIcon icon={Heart} size="lg" />
        </div>
        <h2 className="mt-5 font-serif text-2xl font-bold text-gray-900">No saved products yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
          Browse the catalogue and tap the heart on a product to save it here.
        </p>
        <Link
          href="/shop"
          className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-12px_rgba(27,67,50,0.7)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_18px_38px_-12px_rgba(197,168,128,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] motion-safe:hover:scale-[1.02]"
        >
          Browse products
          <ArrowRight className="h-4 w-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Saved products" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
      {savedProducts.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          entranceDelay={Math.min(index, 6) * 45}
        />
      ))}
    </section>
  );
}
