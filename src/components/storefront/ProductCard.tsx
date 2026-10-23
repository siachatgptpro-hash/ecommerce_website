'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/wishlist-context';
import { Heart, ShoppingCart, Star, Check, Leaf } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  /** Optional staggered entrance delay in ms (catalogue grid). Other call
   * sites omit it and the card renders without an entrance animation. */
  entranceDelay?: number;
}

export function ProductCard({ product, entranceDelay }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIndex] || variants[0];
  const primaryImageObj = product.images?.find((i) => i.isPrimary) || product.images?.[0];
  const primaryImage = primaryImageObj?.imageUrl || '';
  const primaryImageAlt = primaryImageObj?.altText || product.name;
  const secondaryImage = product.images?.[1]?.imageUrl || primaryImage;
  void secondaryImage;

  const sellingPrice = selectedVariant?.sellingPrice || 0;
  const mrp = selectedVariant?.mrp || 0;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const inWishlist = isInWishlist(product.id);
  const isOutOfStock = !selectedVariant || selectedVariant.stockQuantity <= 0;
  const formulationLabel = product.ayurvedicFormulation?.replace(/_/g, ' ').trim();
  const formulationKey = (product.ayurvedicFormulation || '').toUpperCase();
  const stageImage =
    formulationKey.includes('SYRUP') || formulationKey.includes('JUICE')
      ? '/stages/stage-syrup.webp'
      : formulationKey.includes('CAPSULE') || formulationKey.includes('TABLET')
        ? '/stages/stage-capsule.webp'
        : formulationKey.includes('OIL')
          ? '/stages/stage-oil.webp'
          : '/stages/stage-herbal.webp';

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
    // Confirm the completed toggle with a one-shot pulse.
    setHeartPulse(true);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent('/shop')}`);
      return;
    }
    if (isOutOfStock || !selectedVariant) return;

    // Update the local cart immediately. The price recalculation runs in the background.
    setIsAdding(true);
    void addItem(selectedVariant.id, 1);
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div
      className={entranceDelay !== undefined ? 'h-full motion-safe:animate-[rise-in_.5s_cubic-bezier(.22,1,.36,1)_both]' : 'h-full'}
      style={entranceDelay !== undefined ? { animationDelay: `${entranceDelay}ms` } : undefined}
    >
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.25rem] border border-[#EFE7D8] bg-white shadow-[0_6px_20px_-8px_rgba(27,67,50,0.12)] transition-all duration-[var(--dur-card)] ease-luxe hover:border-[#C5A880]/70 hover:shadow-[0_22px_44px_-16px_rgba(27,67,50,0.28),0_0_0_1px_rgba(197,168,128,0.25)] motion-safe:hover:-translate-y-[5px]">
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F3E7]">
        {/* Botanical display stage (decorative) — the real pack photo blends over its bright centre */}
        <Image
          src={stageImage}
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute bottom-[12%] left-1/2 h-3 w-2/5 -translate-x-1/2 rounded-full bg-[#3A2A18]/15 blur-[6px] transition-all duration-[var(--dur-card)] ease-luxe group-hover:bg-[#3A2A18]/20 motion-safe:group-hover:w-[44%]" />
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-[#C62828] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#EFE7D8] bg-white/95 text-gray-700 shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:bg-white hover:shadow-[0_0_16px_rgba(197,168,128,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-1 motion-safe:hover:scale-105"
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={inWishlist}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-[var(--dur-ui)] ${inWishlist ? 'fill-red-600 text-red-600' : 'text-gray-500'} ${heartPulse ? 'motion-safe:animate-[pop_.35s_ease-out]' : ''}`}
            onAnimationEnd={() => setHeartPulse(false)}
            aria-hidden="true"
          />
        </button>

        {/* Formulation tag overlapping the scene, as in the design reference */}
        {formulationLabel && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex rounded-full bg-[#FBD9C2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7C4A21] shadow-sm">
            {formulationLabel}
          </span>
        )}

        {/* Product Image Link */}
        <Link href={`/product/${product.slug}`} className="block w-full h-full" aria-label={`View ${product.name}`}>
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={primaryImageAlt}
              fill
              className="object-contain p-3 mix-blend-multiply transition-transform duration-[var(--dur-card)] ease-luxe motion-safe:group-hover:scale-[1.03] sm:p-4"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <span className="flex w-full h-full items-center justify-center" aria-hidden="true">
              <Leaf className="h-10 w-10 text-[#1B4332]/25" />
            </span>
          )}
        </Link>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Bestseller Badge (the formulation tag sits on the image) */}
          {product.isBestseller && (
            <div className="mb-2 flex items-center justify-end gap-2">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-700">
                ★ BESTSELLER
              </span>
            </div>
          )}

          {/* Product Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#1B4332]">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating — rendered only when real approved reviews exist */}
          {(product.ratingCount ?? 0) > 0 ? (
            <div className="flex items-center space-x-1.5 mt-1.5" aria-label={`${product.ratingAverage ?? 0} out of 5 from ${product.ratingCount ?? 0} reviews`}>
              <div className="flex items-center text-[#F59E0B]" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.ratingAverage ?? 0) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-[11px] font-bold text-gray-700">{(product.ratingAverage ?? 0).toFixed(1)}</span>
              <span className="text-[10px] text-gray-400">({product.ratingCount ?? 0})</span>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1.5">No reviews yet</p>
          )}

          {/* Variant Selector Pills (If multiple) */}
          {variants.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {variants.map((v, idx) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariantIndex(idx);
                  }}
                  aria-pressed={idx === selectedVariantIndex}
                  aria-label={`Select size ${v.sizeLabel} for ${product.name}`}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-[var(--dur-micro)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:active:scale-95 ${
                    idx === selectedVariantIndex
                      ? 'border-transparent bg-[#1B4332] font-bold text-white'
                      : 'border-[#E3DCCB] bg-white text-gray-600 hover:border-[#1B4332]/40 hover:text-[#1B4332]'
                  }`}
                >
                  {v.sizeLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRICING & ADD TO CART ACTION */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-extrabold text-[#0F281E] sm:text-xl">₹{sellingPrice}</span>
              {mrp > sellingPrice && (
                <span className="text-xs text-gray-400 line-through">₹{mrp}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 block -mt-0.5">Incl. GST</span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`group/cart flex shrink-0 items-center space-x-1.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm sm:px-5 transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-1 ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] hover:shadow-[0_10px_24px_-8px_rgba(27,67,50,0.55)] motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.99]'
            }`}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            {isOutOfStock ? (
              <span className="text-[11px]">Out of Stock</span>
            ) : justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 motion-safe:animate-[pop_.3s_ease-out]" aria-hidden="true" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover/cart:translate-x-0.5" aria-hidden="true" />
                <span className="hidden sm:inline">Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
