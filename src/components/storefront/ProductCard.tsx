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
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.25rem] border border-[#EFE7D8] bg-white shadow-[0_6px_20px_-8px_rgba(27,67,50,0.12)] transition-all duration-300 hover:border-[#C5A880]/60 hover:shadow-[0_20px_40px_-16px_rgba(27,67,50,0.28)] motion-safe:hover:-translate-y-1">
      {/* MEDIA CONTAINER */}
      <div className="relative aspect-square w-full overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#FFFDF8_0%,#F6F0E2_75%,#F1E7D2_100%)]">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-[#C62828] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#EFE7D8] bg-white/95 text-gray-700 shadow-sm transition-all hover:bg-white motion-safe:hover:scale-110"
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={inWishlist}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-600 text-red-600' : 'text-gray-500'}`} aria-hidden="true" />
        </button>

        {/* Product Image Link */}
        <Link href={`/product/${product.slug}`} className="block w-full h-full" aria-label={`View ${product.name}`}>
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={primaryImageAlt}
              fill
              className="object-contain p-4 sm:p-5 transition-transform duration-300 motion-safe:group-hover:scale-105"
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
          {/* Formulation Badge */}
          <div className="mb-2 flex items-center justify-between gap-2">
            {formulationLabel ? (
              <span className="inline-flex rounded-full bg-[#FBEEE6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9A6B3F]">
                {formulationLabel}
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            {product.isBestseller && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-700">
                ★ BESTSELLER
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#1B4332]">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating — rendered only when real approved reviews exist */}
          {(product.ratingCount ?? 0) > 0 ? (
            <div className="flex items-center space-x-1.5 mt-1.5" aria-label={`${product.ratingAverage ?? 0} out of 5 from ${product.ratingCount ?? 0} reviews`}>
              <div className="flex items-center text-[#C5A880]" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.ratingAverage ?? 0) ? 'fill-current text-[#C5A880]' : 'text-gray-300'}`} />
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
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
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
              <span className="text-lg font-extrabold text-[#1B4332] sm:text-xl">₹{sellingPrice}</span>
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
            className={`flex shrink-0 items-center space-x-1.5 rounded-full px-4 py-2.5 text-xs font-bold shadow-sm transition-all ${
              isOutOfStock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] hover:shadow-md'
            }`}
            aria-label={isOutOfStock ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
          >
            {isOutOfStock ? (
              <span className="text-[11px]">Out of Stock</span>
            ) : justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
