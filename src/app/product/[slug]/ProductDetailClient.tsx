'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/types';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { useWishlist } from '@/context/wishlist-context';
import dynamic from 'next/dynamic';

// Below-the-fold reviews load as their own chunk instead of PDP's critical JS.
const ReviewSection = dynamic(
  () => import('@/components/storefront/ReviewSection').then((m) => m.ReviewSection)
);
import {
  Heart,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Star,
  BookOpen,
  Leaf,
  Sprout,
  FileText,
  FlaskConical,
  Compass,
  Minus,
  Plus,
} from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, openMiniCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(() => {
    const defaultIndex = (product.variants || []).findIndex((v) => v.isDefault);
    return defaultIndex >= 0 ? defaultIndex : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'dosage' | 'safety'>('desc');
  const [isAdding, setIsAdding] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const images = product.images || [];
  const activeImage = images[selectedImageIndex]?.imageUrl || images[0]?.imageUrl || '';
  const variants = product.variants || [];
  const selectedVariant: ProductVariant = variants[selectedVariantIndex] || variants[0];

  const inWishlist = isInWishlist(product.id);
  const sellingPrice = selectedVariant?.sellingPrice || 0;
  const mrp = selectedVariant?.mrp || 0;
  const discountPercent = mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const stock = selectedVariant?.stockQuantity || 0;
  const isOutOfStock = stock <= 0;

  const requireLogin = () => {
    if (authLoading) return true;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`);
      return true;
    }
    return false;
  };

  const handleAddToCart = async () => {
    if (requireLogin() || isOutOfStock || !selectedVariant) return;
    // Open the cart instantly; server price validation continues in the background.
    setIsAdding(true);
    openMiniCart();
    void addItem(selectedVariant.id, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    if (requireLogin() || isOutOfStock || !selectedVariant) return;
    setIsBuyingNow(true);
    // Cart state is local and updates immediately, so checkout does not wait for pricing.
    void addItem(selectedVariant.id, quantity);
    router.push('/checkout');
  };

  return (
    <div className="space-y-12">
      {/* TOP SECTION: MEDIA & DETAILS */}
      <div className="grid grid-cols-1 gap-8 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both] lg:grid-cols-2 lg:gap-12">
        {/* MEDIA GALLERY — thumbnail rail + staged botanical panel */}
        <div className="flex flex-col-reverse gap-3 sm:gap-4 lg:flex-row">
          {/* Thumbnail rail (real product images, staged) */}
          {images.length > 0 && (
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-1 lg:max-h-[36rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:pr-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                  aria-pressed={selectedImageIndex === idx}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] sm:h-24 sm:w-20 ${
                    selectedImageIndex === idx
                      ? 'border-[#C5A880] shadow-[0_0_16px_rgba(197,168,128,0.45)]'
                      : 'border-[#EFE7D8] opacity-80 hover:border-[#D9BE8C] hover:opacity-100'
                  }`}
                >
                  <Image src="/stages/pdp-stage.webp" alt="" fill className="object-cover" sizes="80px" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-[24%] flex h-[58%] items-end justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-auto max-w-[86%] object-contain [mask-image:radial-gradient(ellipse_92%_90%_at_50%_50%,black_84%,transparent_99%)]" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Main staged panel: empty botanical stage scene + the real pack
              photo standing on the log slice (feather-melted photo edges,
              spotlight pool blends white photo margins, contact shadow
              grounds the pack). */}
          <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-3xl border border-[#EFE7D8] shadow-[0_24px_50px_-30px_rgba(27,67,50,0.45)]">
            <Image
              src="/stages/pdp-stage.webp"
              alt=""
              fill
              loading="eager"
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              aria-hidden="true"
            />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[41%] h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(255,255,255,0.88),rgba(255,255,255,0.5)_54%,transparent_78%)]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[65.5%] h-[5%] w-[36%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(43,28,12,0.55),transparent_70%)] blur-[5px]" />

            {activeImage ? (
              <div key={activeImage} className="absolute inset-x-0 bottom-[30%] flex h-[54%] items-end justify-center motion-safe:animate-[fade-in_.4s_ease-out_both]">
                {/* Plain img: h-full/w-auto keeps the element box at the true
                    photo aspect so the feather mask aligns with photo edges. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt={product.name}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-auto max-w-[76%] object-contain [mask-image:radial-gradient(ellipse_92%_90%_at_50%_50%,black_84%,transparent_99%)]"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/85 shadow-md">
                  <Leaf className="h-8 w-8 text-[#1B4332]/50" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#1B4332]">Classical Formulation</span>
              </div>
            )}

            {discountPercent > 0 && (
              <div className="absolute left-4 top-4 z-10 rounded-full bg-[#C62828] px-3 py-1 text-xs font-extrabold text-white shadow-md">
                SAVE {discountPercent}%
              </div>
            )}

            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-[#D9BE8C]/70 bg-white/95 shadow-[0_0_16px_rgba(197,168,128,0.35)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-white hover:shadow-[0_0_22px_rgba(197,168,128,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-105"
              aria-label="Wishlist toggle"
              aria-pressed={inWishlist}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-600 text-red-600' : 'text-[#A67C2E]'}`} />
            </button>
          </div>
        </div>

        {/* PRODUCT DETAILS & BUY BOX */}
        <div className="space-y-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#D9BE8C]/80 bg-[linear-gradient(180deg,#FBF3E2,#F1E2C4)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7C4A21] shadow-[0_0_12px_rgba(197,168,128,0.3)]">
                {product.ayurvedicFormulation?.replace('_', ' ')}
              </span>
              {product.isBestseller && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  ★ Bestseller
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl font-bold leading-[1.14] text-[#0F281E] sm:text-4xl sm:leading-[1.14] lg:text-[44px] lg:leading-[1.14]">
              {product.name}
            </h1>

            {(product.ratingCount ?? 0) > 0 ? (
              <div className="flex items-center gap-2 pt-1" aria-label={`${product.ratingAverage ?? 0} out of 5 from ${product.ratingCount ?? 0} reviews`}>
                <div className="flex text-[#C5A880]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.ratingAverage ?? 0) ? 'fill-current text-[#C5A880]' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800">{product.ratingAverage ?? 0} / 5</span>
                <span className="text-xs text-gray-400">({product.ratingCount ?? 0} reviews)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex text-[#D9BE8C]" aria-hidden="true">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4" strokeWidth={1.6} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">No reviews yet</span>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="space-y-1.5 rounded-2xl border border-[#EFE7D8] bg-white p-5 shadow-[0_18px_40px_-24px_rgba(27,67,50,0.35)]">
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-extrabold leading-none tracking-tight text-[#0F281E]">
                ₹{sellingPrice}
              </span>
              {mrp > sellingPrice && (
                <span className="text-lg text-gray-400 line-through">₹{mrp}</span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-extrabold text-[#C62828] bg-red-100 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Listed MRP. Shipping options and charges are shown at checkout.
            </p>
          </div>

          {/* VARIANT PICKER */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800">
                Select packaging size / weight:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariantIndex(idx);
                      setQuantity(1);
                    }}
                    aria-pressed={idx === selectedVariantIndex}
                    className={`flex items-start justify-between gap-2 rounded-2xl border p-3.5 text-left transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] ${
                      idx === selectedVariantIndex
                        ? 'border-[#C5A880] bg-[#FBF3E2]/70 shadow-[0_0_18px_rgba(197,168,128,0.35)] ring-1 ring-[#C5A880]'
                        : 'border-[#E7DFC8] bg-white hover:border-[#D9BE8C]'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-bold text-gray-900">{v.sizeLabel}</span>
                      <span className="mt-0.5 block text-xs font-bold text-[#1B4332]">₹{v.sellingPrice}</span>
                      {v.stockQuantity <= 5 && v.stockQuantity > 0 && (
                        <span className="block text-[10px] font-medium text-amber-600">Preview stock: {v.stockQuantity}</span>
                      )}
                      {v.stockQuantity <= 0 && (
                        <span className="block text-[10px] font-bold text-red-600">Out of stock</span>
                      )}
                    </span>
                    {idx === selectedVariantIndex && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 fill-[#1B4332] text-white" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STOCK STATUS */}
          <div className="flex items-center gap-2 text-xs">
            {isOutOfStock ? (
              <span className="flex items-center gap-1.5 text-red-600 font-bold">
                <AlertTriangle className="w-4 h-4" /> Not available in this preview
              </span>
            ) : stock <= 5 ? (
              <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                <AlertTriangle className="w-4 h-4" /> Availability is checked again at checkout
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Availability is checked again at checkout
              </span>
            )}
          </div>

          {/* QUANTITY AND ACTIONS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center rounded-xl border border-[#E3DCCB] bg-white p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-900" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  disabled={quantity >= stock || isOutOfStock}
                  aria-label="Increase quantity"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_-12px_rgba(27,67,50,0.65),0_0_20px_rgba(197,168,128,0.35)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_18px_38px_-12px_rgba(197,168,128,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:hover:scale-[1.01]"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span>{isAdding ? 'Adding...' : 'Add to Bag'}</span>
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBuyingNow}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#F5E7C6,#E4CD9E)] px-6 py-3.5 text-sm font-black uppercase tracking-wider text-[#4A3520] shadow-[0_14px_30px_-14px_rgba(180,137,104,0.8)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[linear-gradient(90deg,#F8EED3,#EDD9AE)] hover:shadow-[0_18px_36px_-14px_rgba(197,168,128,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 disabled:opacity-50 motion-safe:hover:scale-[1.01]"
            >
              <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{isBuyingNow ? 'Proceeding...' : 'Buy Now with 1-Click Checkout'}</span>
            </button>
          </div>

          {/* TRUST PILLARS */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-[#EFE7D8] pt-5">
            {[
              { icon: FileText, label: 'Printed MRP and pack sizes' },
              { icon: Sprout, label: 'Source-linked product details' },
              { icon: Truck, label: 'Check delivery at checkout' },
              { icon: BookOpen, label: 'Read the package label' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F6EBD2] text-[#A67C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" aria-hidden="true">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span className="text-xs font-medium leading-snug text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILS TABS (DESCRIPTION, INGREDIENTS, DOSAGE, SAFETY) */}
      <div className="relative overflow-hidden rounded-3xl border border-[#EFE7D8] bg-white shadow-[0_20px_44px_-28px_rgba(27,67,50,0.4)]">
        <div className="scrollbar-hide flex overflow-x-auto border-b border-[#EFE7D8] bg-[#FAF7F2]" role="tablist" aria-label="Product details">
          {[
            { id: 'desc', label: 'Product Information', icon: Leaf },
            { id: 'ingredients', label: 'Ingredients', icon: FlaskConical },
            { id: 'dosage', label: 'Directions', icon: Compass },
            { id: 'safety', label: 'Safety', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`flex shrink-0 items-center gap-2 px-5 py-4 text-xs font-bold uppercase tracking-wider transition-colors duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C5A880] sm:px-6 sm:text-[13px] ${
                activeTab === tab.id
                  ? 'border-b-2 border-[#C5A880] bg-white text-[#1B4332]'
                  : 'text-gray-500 hover:text-[#1B4332]'
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-5 -right-5 h-28 w-28 origin-bottom-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:100%_100%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_85%_85%_at_90%_90%,black_38%,transparent_72%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate]" />

        <div key={activeTab} className="relative p-6 motion-safe:animate-[fade-in_.3s_ease-out_both] sm:p-8">
          {activeTab === 'desc' && (
            <div className="space-y-4 text-sm font-light leading-relaxed text-gray-700">
              <p>{product.fullDescription || product.shortDescription || 'Product information will be updated soon.'}</p>
              {product.benefits && (
                <div className="flex gap-3.5 rounded-2xl border border-emerald-900/10 bg-[#F1F7EC] p-4 sm:p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-[#A67C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" aria-hidden="true">
                    <Leaf className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B4332]">Benefits</h4>
                    <p className="text-[13px] leading-relaxed text-emerald-950/80">{product.benefits}</p>
                  </div>
                </div>
              )}
              {product.shortDescription && product.fullDescription && (
                <div className="flex gap-3.5 rounded-2xl border border-[#E9E0CC] bg-[#FAF7F2] p-4 sm:p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F6EBD2] text-[#A67C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" aria-hidden="true">
                    <BookOpen className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B4332]">
                      Source note
                    </h4>
                    <p className="text-[13px] leading-relaxed text-gray-700">
                      {product.shortDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#1B4332]">
                Product composition
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.ingredients || 'Please refer to the product package for composition.'}
              </p>
              <div className="text-xs text-gray-500 italic">
                Information is shown only where transcribed from the source. Check the package for the complete list.
              </div>
            </div>
          )}

          {activeTab === 'dosage' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#1B4332]">
                Directions for use
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.usageInstructions || 'Follow the directions printed on the product package.'}
              </p>
              <p className="text-xs text-gray-500">
                If directions are not shown on this page, follow the package label or seek advice from a qualified healthcare professional.
              </p>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#1B4332]">
                Storage & Precautions:
              </h4>
              {product.precautions && (
                <p className="text-sm text-gray-700 leading-relaxed">{product.precautions}</p>
              )}
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5 font-light">
                <li>Store in a cool, dry place away from direct sunlight.</li>
                <li>Keep jar/bottle tightly closed after each use to prevent moisture absorption.</li>
                <li>Keep out of reach of children.</li>
                <li>Pregnant or lactating women should consult a physician before use.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMER REVIEWS */}
      <section className="space-y-6">
        <h3 className="flex items-center gap-2.5 font-serif text-2xl font-bold text-[#0F281E] sm:text-[28px]">
          <Leaf className="h-6 w-6 text-[#A67C2E]" aria-hidden="true" />
          Customer Reviews
        </h3>
        <ReviewSection productId={product.id} productName={product.name} />
      </section>
    </div>
  );
}
