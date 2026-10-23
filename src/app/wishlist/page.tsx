import type { Metadata } from 'next';
import { Bell, Heart, Leaf, ShoppingCart } from 'lucide-react';
import { productRepository } from '@/repositories/product.repository';
import { GlowIcon } from '@/components/about/GlowIcon';
import { FallingLeaves } from '@/components/wishlist/FallingLeaves';
import { WishlistBotanicalBackdrop } from '@/components/wishlist/WishlistBotanicalBackdrop';
import { WishlistClient } from './WishlistClient';

export const dynamic = 'force-dynamic';

// Wishlist contents live in the visitor's browser — personal page, noindex.
export const metadata: Metadata = {
  title: 'My Wishlist | Shlokveda',
  description: 'Products you have saved in this browser on Shlokveda.',
  robots: { index: false, follow: true },
};

const BENEFITS = [
  { icon: Leaf, label: 'Keep your favourites', sub: 'Save products you love' },
  { icon: Bell, label: 'Easy to revisit', sub: 'Check anytime' },
  { icon: ShoppingCart, label: 'Shop faster', sub: 'Add to cart in one click' },
] as const;

export default async function WishlistPage() {
  const productsData = await productRepository.findMany({ page: 1, limit: 200 });

  return (
    <main className="relative isolate overflow-hidden bg-[#FAF7F2]">
      <WishlistBotanicalBackdrop />
      <FallingLeaves />

      <div className="relative z-10 mx-auto min-h-[70vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-9 border-b border-[#E4D3AC]/70 pb-8 motion-safe:animate-[rise-in_.65s_cubic-bezier(.22,1,.36,1)_both] sm:mb-11">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#17604A]">
                <Heart className="h-4 w-4 text-[#A67C2E]" aria-hidden="true" />
                Saved in this browser
              </p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.12] text-[#0F281E] sm:text-5xl sm:leading-[1.12] lg:text-6xl lg:leading-[1.12]">
                Your{' '}
                <span className="bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">
                  wishlist
                </span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                Products you save are stored on this device.
              </p>
            </div>

            <ul
              aria-label="Wishlist benefits"
              className="hidden shrink-0 grid-cols-3 gap-6 xl:grid xl:gap-8"
            >
              {BENEFITS.map(({ icon, label, sub }, index) => (
                <li
                  key={label}
                  className={`group flex items-center gap-3 ${index > 0 ? 'border-l border-[#D9BE8C]/60 pl-6 xl:pl-8' : ''}`}
                >
                  <GlowIcon icon={icon} delay={index * 0.7} />
                  <span>
                    <span className="block whitespace-nowrap text-sm font-bold text-[#102E22]">{label}</span>
                    <span className="mt-0.5 block whitespace-nowrap text-xs text-gray-500">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </header>

        <WishlistClient products={productsData.products} />
      </div>
    </main>
  );
}
