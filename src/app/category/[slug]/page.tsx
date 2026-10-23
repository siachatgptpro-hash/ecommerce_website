import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/storefront/ProductCard';
import { productRepository } from '@/repositories/product.repository';
import { toPublicProduct } from '@/lib/public-dto';
import { ArrowLeft, ChevronRight, Leaf } from 'lucide-react';
import { FallingLeaves } from '@/components/botanical/FallingLeaves';
import { CategorySortSelect } from './CategorySortSelect';

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
    sort?: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

type CategorySort = (typeof SORT_OPTIONS)[number]['value'];

// Existing photographic scene assets (blank, unbranded still lifes) used as
// decorative category hero backdrops; all heading text stays real HTML.
const CATEGORY_HERO_IMAGES: Record<string, string> = {
  'personal-care': '/banners/hero-personal-care.webp',
  'herbal-oils': '/banners/hero-herbal-oils.webp',
  'daily-wellness': '/banners/hero-wellness.webp',
  'immunity-rasayana': '/banners/hero-wellness.webp',
};

export async function generateMetadata({ params }: Pick<CategoryPageProps, 'params'>): Promise<Metadata> {
  const categories = await productRepository.getAllCategories();
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return {};
  return {
    title: category.metaTitle || `${category.name} | Shlokveda Product Catalogue`,
    description: category.metaDescription || category.description || undefined,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = params;
  const categories = await productRepository.getAllCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const parsedPage = parseInt(searchParams.page || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const sortBy: CategorySort = SORT_OPTIONS.some((option) => option.value === searchParams.sort)
    ? (searchParams.sort as CategorySort)
    : 'featured';

  const heroImage = CATEGORY_HERO_IMAGES[slug] || '/banners/highlights-botanical-bg.webp';
  const nameWords = category.name.trim().split(/\s+/);
  const titleLead = nameWords.length > 1 ? `${nameWords.slice(0, -1).join(' ')} ` : '';
  const titleAccent = nameWords.length > 1 ? nameWords[nameWords.length - 1] : '';

  const { products: rawProducts, total, totalPages } = await productRepository.findMany({
    categorySlug: slug,
    sortBy,
    page,
    limit: PAGE_SIZE,
  });
  const products = rawProducts.map(toPublicProduct);

  return (
    <div className="relative overflow-x-clip">
      {/* Botanical atmosphere (decorative): sunlight, gentle corner foliage
          and sparse drifting leaves behind the z-10 catalogue content. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_32%_at_50%_0%,rgba(217,190,140,0.2),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-64 sm:w-64" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_11s_ease-in-out_infinite_alternate] sm:h-64 sm:w-64" style={{ animationDelay: '0.7s' }} />
      <FallingLeaves preset="catalogue" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Home</Link>
          <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
          <Link href="/shop" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]">Catalog</Link>
          <ChevronRight className="h-3 w-3 text-[#B08968]" aria-hidden="true" />
          <span aria-current="page" className="font-bold text-[#1B4332]">{category.name}</span>
        </nav>

        {/* Category Header Hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#E9E0CC]/90 shadow-[0_24px_50px_-28px_rgba(27,67,50,0.45)] motion-safe:animate-[fade-in_.6s_ease-out_both]">
          <div aria-hidden="true" className="absolute inset-0 bg-cover bg-[position:74%_center] sm:bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,247,242,0.95)_0%,rgba(250,247,242,0.84)_40%,rgba(250,247,242,0.28)_70%,rgba(250,247,242,0.02)_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[#FAF7F2]/35 sm:hidden" />
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(217,190,140,0.5),transparent_70%)] motion-safe:animate-[banner-breathe_7s_ease-in-out_infinite]" />

          <div className="relative max-w-2xl space-y-3.5 p-8 sm:p-12 motion-safe:animate-[rise-in_.55s_cubic-bezier(.22,1,.36,1)_both]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#A67C2E]">
              <Leaf className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              Classical Ayurvedic Category
            </span>
            <h1 className="font-serif text-4xl font-bold leading-[1.12] text-[#0F281E] sm:text-5xl sm:leading-[1.12]">
              {titleAccent ? (
                <>
                  {titleLead}
                  <span className="text-[#A67C2E]">{titleAccent}</span>
                </>
              ) : (
                category.name
              )}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-600">
              {category.description || 'Explore authentic Shastriya preparations crafted in Hathras.'}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CFE3D4] bg-[#EAF3EC]/95 px-3.5 py-1.5 text-xs font-bold text-[#1B4332] shadow-sm">
                <Leaf className="h-3.5 w-3.5 fill-[#1B4332] text-[#1B4332]" aria-hidden="true" />
                {total} Classical Formulation{total === 1 ? '' : 's'} Available
              </span>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="space-y-4 rounded-3xl border border-[#E9E0CC]/90 bg-white/85 py-20 text-center shadow-[0_18px_38px_-26px_rgba(27,67,50,0.4)] backdrop-blur-sm">
            <p className="text-base text-gray-600">No products currently in this category.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-6 py-2.5 text-xs font-bold text-white transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Products</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Catalogue toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE7D8] pb-4">
              <p className="text-sm text-gray-600" role="status">
                <span className="font-bold text-gray-900">{total}</span> product{total === 1 ? '' : 's'} found
              </p>
              <div className="flex items-center gap-2.5">
                <label htmlFor="category-sort" className="text-xs font-semibold text-gray-600">
                  Sort by:
                </label>
                <CategorySortSelect value={sortBy} options={SORT_OPTIONS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 motion-safe:animate-[fade-in_.5s_ease-out_both] sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <Link
                      key={pNum}
                      href={`/category/${slug}?page=${pNum}${sortBy !== 'featured' ? `&sort=${sortBy}` : ''}`}
                      aria-current={pNum === page ? 'page' : undefined}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all duration-[var(--dur-ui)] ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] ${
                        pNum === page
                          ? 'bg-[#1B4332] text-white shadow-md ring-1 ring-[#C5A880]'
                          : 'border border-[#E9E0CC] bg-white/80 text-gray-700 backdrop-blur-sm hover:border-[#D9BE8C] hover:bg-white'
                      }`}
                    >
                      {pNum}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
