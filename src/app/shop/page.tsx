import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { productRepository } from '@/repositories/product.repository';
import { AyurvedicFormulation } from '@/types';
import { BROCHURE_PRODUCTS } from '@/lib/brochure-data';
import { toPublicProduct } from '@/lib/public-dto';
import { BookOpen, ChevronRight, Image as ImageIcon, IndianRupee, Leaf, SlidersHorizontal } from 'lucide-react';
import { ContactGlowIcon } from '@/components/contact/ContactGlowIcon';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

interface ShopPageProps {
  searchParams: {
    category?: string;
    formulation?: string;
    search?: string;
    sort?: string;
    page?: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const categorySlug = searchParams.category;
  const formulation = searchParams.formulation as AyurvedicFormulation | undefined;
  const search = searchParams.search;
  const sort = searchParams.sort || 'featured';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 12;

  const sortBy = (SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'featured') as
    | 'featured'
    | 'price-low'
    | 'price-high'
    | 'rating'
    | 'newest';

  const [categories, productsResult] = await Promise.all([
    productRepository.getAllCategories(),
    productRepository.findMany({
      categorySlug,
      formulation,
      search,
      sortBy,
      page,
      limit,
    }),
  ]);
  const productsData = { ...productsResult, products: productsResult.products.map(toPublicProduct) };

  // Builds a /shop URL preserving every active filter (pagination previously
  // dropped `search` and `sort`, silently changing the result set).
  const shopHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: categorySlug,
      formulation,
      search,
      sort: sortBy !== 'featured' ? sortBy : undefined,
      page: String(page),
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  };

  // Only show formulation filters represented by products in the supplied brochure.
  const formulations = Array.from(new Set(BROCHURE_PRODUCTS.map((product) => product.ayurvedicFormulation)));

  // Real per-category / per-formulation counts from the brochure data.
  const countBy = (key: (typeof BROCHURE_PRODUCTS)[number]['categoryId'] extends never ? never : (product: (typeof BROCHURE_PRODUCTS)[number]) => string) => {
    const counts: Record<string, number> = {};
    for (const product of BROCHURE_PRODUCTS) counts[key(product)] = (counts[key(product)] || 0) + 1;
    return counts;
  };
  const categoryCounts = countBy((product) => product.categoryId);
  const formulationCounts = countBy((product) => product.ayurvedicFormulation);

  const total = productsData.total;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  // Factual trust indicators — the same brochure-sourcing claims used
  // across the storefront (About methodology, catalogue trust strip).
  const trustItems = [
    { icon: ImageIcon, label: 'Original Pack Images', sub: 'As per brochure' },
    { icon: IndianRupee, label: 'Printed MRPs', sub: 'Used as listed' },
    { icon: BookOpen, label: 'Authentic Information', sub: 'From source brochure' },
  ];

  return (
    <div className="relative overflow-hidden bg-[#FAF7F2]">
      {/* Reference-style botanical frame: photographic foliage belongs at
          the corners and extreme edges only, while the catalogue itself
          stays on clean ivory. Each accent is a corner crop of the same
          botanical photo, radially masked so it melts into the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-10 h-72 w-72 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-90 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_8s_ease-in-out_infinite_alternate] sm:h-96 sm:w-96 xl:h-[27rem] xl:w-[27rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-90 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_9.5s_ease-in-out_infinite_alternate] sm:h-96 sm:w-96 xl:h-[27rem] xl:w-[27rem]"
        style={{ animationDelay: '0.6s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-[42%] hidden h-60 w-60 origin-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:240%_auto] bg-[position:0%_55%] bg-no-repeat opacity-[0.55] [mask-image:radial-gradient(ellipse_78%_78%_at_12%_50%,black_35%,transparent_72%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate] lg:block"
        style={{ animationDelay: '1.4s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-[55%] hidden h-60 w-60 origin-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:240%_auto] bg-[position:100%_45%] bg-no-repeat opacity-[0.55] [mask-image:radial-gradient(ellipse_78%_78%_at_88%_50%,black_35%,transparent_72%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] lg:block"
        style={{ animationDelay: '0.3s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 h-72 w-72 origin-bottom-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_100%] bg-no-repeat opacity-90 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_8.6s_ease-in-out_infinite_alternate] sm:h-96 sm:w-96 xl:h-[27rem] xl:w-[27rem]"
        style={{ animationDelay: '1.1s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 origin-bottom-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_100%] bg-no-repeat opacity-90 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-96 sm:w-96 xl:h-[27rem] xl:w-[27rem]"
        style={{ animationDelay: '0.9s' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_32%_at_50%_0%,rgba(217,190,140,0.2),transparent_70%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
      />
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb & Header */}
      <div className="space-y-5 border-b border-[#E9E0CC]/80 pb-6 motion-safe:animate-[rise-in_.6s_cubic-bezier(.22,1,.36,1)_both]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Home</Link>
          <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
          <span aria-current="page" className="text-gray-900 font-bold">Ayurvedic Catalogue</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">
              <span className="text-[#0F281E]">Shlokveda</span>{' '}
              <span className="bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">Product Catalogue</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
              Showing {rangeStart}–{rangeEnd} of {total} brochure-listed products
            </p>
          </div>
          <ul className="hidden items-start gap-6 lg:flex" aria-label="Catalogue sourcing">
            {trustItems.map(({ icon, label, sub }, index) => (
              <li key={label} className="flex flex-col items-center gap-1.5 text-center">
                <span className="group block scale-[0.82]"><ContactGlowIcon icon={icon} delay={index * 0.7} /></span>
                <span className="-mt-1 block text-[11px] font-bold leading-tight text-[#0F281E]">{label}</span>
                <span className="block text-[10px] leading-tight text-gray-500">{sub}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Sort by:</span>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={shopHref({ sort: option.value === 'featured' ? undefined : option.value, page: '1' })}
              aria-current={sortBy === option.value ? 'true' : undefined}
              className={`text-[11px] px-3 py-1.5 rounded-full transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98] ${
                sortBy === option.value
                  ? 'bg-[#1B4332] text-white font-bold shadow-[0_8px_20px_-8px_rgba(27,67,50,0.6)]'
                  : 'bg-white/85 text-gray-700 border border-[#E9E0CC] hover:border-[#C5A880] hover:text-[#1B4332]'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR FILTERS */}
        <aside className="space-y-6 motion-safe:animate-[rise-in_.6s_cubic-bezier(.22,1,.36,1)_both]" style={{ animationDelay: '120ms' }}>
          <div className="bg-white/80 backdrop-blur p-5 rounded-3xl border border-[#EDE4CF] shadow-[0_16px_36px_-22px_rgba(27,67,50,0.35)] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <SlidersHorizontal className="w-4 h-4 text-[#1B4332]" />
                <span>Filters</span>
              </div>
              {(categorySlug || formulation || search) && (
                <Link
                  href="/shop"
                  className="rounded text-xs font-bold text-[#A67C2E] transition-colors hover:text-[#1B4332] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]"
                >
                  Clear All
                </Link>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Categories
              </h3>
              <div className="space-y-1">
                <Link
                  href="/shop"
                  aria-current={!categorySlug ? 'true' : undefined}
                  className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:translate-x-0.5 ${
                    !categorySlug
                      ? 'bg-[#1B4332] text-white font-bold shadow-[0_8px_18px_-8px_rgba(27,67,50,0.6)]'
                      : 'text-gray-700 hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>All Categories</span>
                  <span className={!categorySlug ? 'text-[#DDBF8E]' : 'text-gray-400'}>({BROCHURE_PRODUCTS.length})</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    aria-current={categorySlug === cat.slug ? 'true' : undefined}
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:translate-x-0.5 ${
                      categorySlug === cat.slug
                        ? 'bg-[#1B4332] text-white font-bold shadow-[0_8px_18px_-8px_rgba(27,67,50,0.6)]'
                        : 'text-gray-700 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={categorySlug === cat.slug ? 'text-[#DDBF8E]' : 'text-gray-400'}>({categoryCounts[cat.id] || 0})</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ayurvedic Formulation Types */}
            <div className="space-y-2.5 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Formulation Type
              </h3>
              <div className="space-y-1">
                {formulations.map((f) => (
                  <Link
                    key={f}
                    href={`/shop?${categorySlug ? `category=${categorySlug}&` : ''}formulation=${f}`}
                    aria-current={formulation === f ? 'true' : undefined}
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:translate-x-0.5 ${
                      formulation === f
                        ? 'bg-[#1B4332] text-white font-bold shadow-[0_8px_18px_-8px_rgba(27,67,50,0.6)]'
                        : 'text-gray-700 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span>{f.replace(/_/g, ' ')}</span>
                    <span className={formulation === f ? 'text-[#DDBF8E]' : 'text-gray-400'}>({formulationCounts[f] || 0})</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Source note */}
            <div className="p-4 rounded-2xl bg-white border border-[#C5A880]/40 space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#A67C2E]" aria-hidden="true" /> Catalogue note
              </h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Product names, pack sizes, printed MRPs and available pack images are transcribed from the supplied brochure.
              </p>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID & PAGINATION */}
        <main className="lg:col-span-3 space-y-8">
          {productsData.products.length === 0 ? (
            <div className="py-20 text-center bg-white/80 rounded-3xl border border-[#EDE4CF] space-y-4 motion-safe:animate-[fade-in_.35s_ease-out_both]">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                <Leaf className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-serif font-bold text-gray-900">No formulations found</h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                No classical Ayurvedic products matched your selected filters. Try clearing filters to view all products.
              </p>
              <Link
                href="/shop"
                className="inline-block px-6 py-2.5 rounded-full bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F]"
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            <div
              key={`${categorySlug || 'all'}-${formulation || 'all'}-${search || ''}-${sortBy}-${page}`}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 motion-safe:animate-[fade-in_.3s_ease-out_both]"
            >
              {productsData.products.map((product, index) => (
                <ProductCard key={product.id} product={product} entranceDelay={Math.min(index, 11) * 35} />
              ))}
            </div>
          )}

          {/* Pagination if multiple pages */}
          {productsData.totalPages > 1 && (
            <nav aria-label="Catalogue pages" className="flex items-center justify-center gap-2 pt-6">
              {Array.from({ length: productsData.totalPages }).map((_, i) => {
                const pNum = i + 1;
                return (
                  <Link
                    key={pNum}
                    href={shopHref({ page: String(pNum) })}
                    aria-label={`Go to page ${pNum}`}
                    aria-current={pNum === page ? 'page' : undefined}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-105 motion-safe:active:scale-95 ${
                      pNum === page
                        ? 'bg-[#1B4332] text-white shadow-[0_10px_22px_-8px_rgba(27,67,50,0.65)]'
                        : 'bg-white/85 text-gray-700 border border-[#E9E0CC] hover:border-[#C5A880] hover:text-[#1B4332]'
                    }`}
                  >
                    {pNum}
                  </Link>
                );
              })}
              {page < productsData.totalPages && (
                <Link
                  href={shopHref({ page: String(page + 1) })}
                  aria-label="Go to next page"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/85 text-gray-700 border border-[#E9E0CC] transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-105 motion-safe:active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
    </div>
  );
}
