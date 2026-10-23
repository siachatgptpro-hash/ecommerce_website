import React from 'react';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { productRepository } from '@/repositories/product.repository';
import { toPublicProduct } from '@/lib/public-dto';
import { ProductDetailClient } from './ProductDetailClient';
import { ProductCard } from '@/components/storefront/ProductCard';
import { generateProductJsonLd, generateBreadcrumbJsonLd, jsonLdScriptContent } from '@/lib/seo';
import { ChevronRight } from 'lucide-react';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Share the product query between metadata and the page render so one click does not
// trigger two identical database round trips.
const getProduct = cache((slug: string) => productRepository.findBySlug(slug));

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found | Shlokveda' };

  const desc = (product.shortDescription || product.fullDescription || '').slice(0, 160);

  return {
    title: `${product.name} | Shlokveda Product Catalogue`,
    description: desc,
    openGraph: {
      title: product.name,
      description: desc,
      images: product.images?.[0]?.imageUrl ? [product.images[0].imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const rawProduct = await getProduct(params.slug);

  if (!rawProduct) {
    notFound();
  }
  const product = toPublicProduct(rawProduct);

  // Get related products from same category
  const related = await productRepository.findMany({
    categorySlug: product.category?.slug,
    limit: 4,
  });

  const filteredRelated = related.products
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map(toPublicProduct);

  // SEO Schema
  const productJsonLd = generateProductJsonLd(product);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Catalog', url: '/shop' },
    { name: product.category?.name || 'Ayurveda', url: `/category/${product.category?.slug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <div className="relative">
      {/* Botanical page frame (decorative): masked photographic corner
          foliage behind the content, gentle automatic sway. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(217,190,140,0.25),transparent_70%)]" />
        <div className="absolute -left-10 -top-10 h-64 w-64 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-85 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" />
        <div className="absolute -right-10 -top-10 h-64 w-64 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-85 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.5s' }} />
        <div className="absolute -right-16 top-[38%] hidden h-56 w-56 origin-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:240%_auto] bg-[position:100%_45%] bg-no-repeat opacity-50 [mask-image:radial-gradient(ellipse_78%_78%_at_88%_50%,black_35%,transparent_72%)] motion-safe:animate-[leaf-sway_8.6s_ease-in-out_infinite_alternate] lg:block" style={{ animationDelay: '0.9s' }} />
        <div className="absolute -bottom-10 -left-10 h-64 w-64 origin-bottom-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_100%] bg-no-repeat opacity-85 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_42%,transparent_74%)] motion-safe:animate-[leaf-sway_9.5s_ease-in-out_infinite_alternate] sm:h-80 sm:w-80" style={{ animationDelay: '0.3s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[13px] text-gray-500">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        <Link href="/shop" className="hover:text-[#1B4332]">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-[#1B4332]">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
        <span className="truncate font-bold text-[#1B4332]">{product.name}</span>
      </nav>

      {/* Main Interactive Product Section */}
      <ProductDetailClient product={product} />

      {/* Related Ayurvedic Formulations */}
      {filteredRelated.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-[#F3EFE6]">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-[#0F281E]">
              Complementary Classical Remedies
            </h3>
            <Link href="/shop" className="text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]">
              Explore All Formulations
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredRelated.map((p, index) => (
              <ProductCard key={p.id} product={p} entranceDelay={Math.min(index, 6) * 45} />
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
