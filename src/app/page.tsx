import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/storefront/ProductCard';
import { HeroCarousel } from '@/components/storefront/HeroCarousel';
import { productRepository } from '@/repositories/product.repository';
import { cmsRepository } from '@/repositories/cms.repository';
import { toPublicProduct } from '@/lib/public-dto';
import {
  ShieldCheck,
  Leaf,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Award,
  BookOpen,
} from 'lucide-react';

export const revalidate = 60; // 1 minute ISR

export default async function HomePage() {
  const [featuredResult, banners, catalogueCount] = await Promise.all([
    productRepository.findMany({ isFeatured: true, limit: 8 }),
    cmsRepository.getActiveBanners(),
    productRepository.findMany({ limit: 1 }),
  ]);
  const featuredProducts = { ...featuredResult, products: featuredResult.products.map(toPublicProduct) };

  const primaryBanner = banners.find((b) => b.slot === 'HERO_PRIMARY') || {
    title: 'A thoughtful catalogue for everyday wellness',
    subtitle: 'Explore the herbal products, pack sizes and printed prices shown in the brochure—brought together in one clear, easy-to-use storefront.',
    ctaText: 'Explore the catalogue',
    ctaLink: '/shop',
    linkUrl: '/shop',
    buttonText: 'Explore the catalogue',
    imageUrl: '/products/pdf-p5-i3.webp',
  };

  const heroSlides = banners.length > 0
    ? banners.map((banner) => ({
        title: banner.title,
        subtitle: banner.subtitle || 'Explore our Ayurvedic wellness catalogue.',
        imageUrl: banner.imageUrl,
        ctaText: banner.ctaText || banner.buttonText || 'Explore the catalogue',
        ctaLink: banner.ctaLink || banner.linkUrl || '/shop',
      }))
    : [
        { title: primaryBanner.title, subtitle: primaryBanner.subtitle || 'Explore our Ayurvedic wellness catalogue.', imageUrl: primaryBanner.imageUrl || '/products/pdf-p5-i3.webp', ctaText: primaryBanner.ctaText || 'Explore the catalogue', ctaLink: primaryBanner.ctaLink || '/shop' },
        { title: 'Everyday herbal wellness, made simple', subtitle: 'Browse carefully organized Ayurvedic formulations, pack sizes and listed prices in one easy catalogue.', imageUrl: '/banners/herbal-oils.jpg', ctaText: 'Shop herbal oils', ctaLink: '/shop' },
        { title: 'Classical formulations for modern routines', subtitle: 'Discover juices, arks, capsules, churnas and wellness products from the Sholkveda collection.', imageUrl: '/banners/natural-care.jpg', ctaText: 'Browse all products', ctaLink: '/shop' },
        { title: 'Find your daily wellness essentials', subtitle: 'Explore product information, pack options and availability before adding items to your bag.', imageUrl: '/banners/daily-immunity.jpg', ctaText: 'View catalogue', ctaLink: '/shop' },
      ];

  const classicalCategories = [
    { title: 'Syrups & Juices', slug: 'syrups-juices', desc: 'Browse the liquid products listed in the source catalogue.', image: '/products/pdf-p6-i10.webp', tone: 'from-[#0c4a2b] via-[#176d3f] to-[#0b3024]', label: 'LIQUID WELLNESS' },
    { title: 'Arks & Drops', slug: 'arks-drops', desc: 'Small-format products and herbal drops from the brochure.', image: '/products/pdf-p6-i3.webp', tone: 'from-[#073b5c] via-[#08708a] to-[#092d49]', label: 'HERBAL EXTRACTS' },
    { title: 'Herbal Oils', slug: 'herbal-oils', desc: 'Oils and liniments with sizes and prices from the source list.', image: '/products/pdf-p10-i1.webp', tone: 'from-[#6a3310] via-[#9a5319] to-[#3f220d]', label: 'BOTANICAL OILS' },
    { title: 'Herbal Capsules', slug: 'herbal-capsules', desc: 'Capsule products with original pack imagery where available.', image: '/products/pdf-p12-i2.webp', tone: 'from-[#07544d] via-[#087e70] to-[#073e3b]', label: 'DAILY FORMULATIONS' }, 
  ];

  return (
    <div className="relative space-y-16 sm:space-y-24">
      {/* AUTO-SWIPING HERO BANNERS */}
      <HeroCarousel
        slides={heroSlides}
      />

      {/* VALUE PROPOSITIONS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Leaf className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">A clear product catalogue</h4>
              <p className="text-xs text-gray-600 mt-1">Names and pack options transcribed from the supplied brochure.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Printed prices shown</h4>
              <p className="text-xs text-gray-600 mt-1">The listed MRP is shown without invented sale discounts.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Award className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Original pack images</h4>
              <p className="text-xs text-gray-600 mt-1">Source photography is preserved from the provided product brochure.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6]">
            <div className="p-3 bg-[#1B4332] text-white rounded-xl shadow-xs shrink-0">
              <Truck className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Careful product information</h4>
              <p className="text-xs text-gray-600 mt-1">Always read the package label and ask a qualified professional before use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSICAL CATEGORIES EXPLORATION */}
      <section
        className="relative min-h-[620px] overflow-hidden bg-[#031c16] py-12 sm:py-16 space-y-8"
      >
        <div className="pointer-events-none absolute inset-0 hidden bg-[url('/banners/category-wellness-banner.png')] bg-cover bg-center sm:block" />
        
        <div className="relative z-20 w-full px-4 py-3 sm:py-4 text-center space-y-3 bg-[#031c16]/95">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
            Browse by product type
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Shop by Ayurvedic Category
          </h2>
          <p className="text-sm text-white/70">
            Categories follow the product groupings available in the source catalogue.
          </p>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {classicalCategories.map((cat) => (
            <Link
              key={cat.title}
              href={`/category/${cat.slug}`}
              className="group relative h-64 sm:h-80 rounded-2xl overflow-hidden border-0 bg-[#0b3024]/90 sm:bg-black/10 shadow-none hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end p-6"
            >

              <div className="absolute left-6 top-6 text-[10px] font-bold tracking-[0.24em] text-[#8A765D]">
                {cat.label}
              </div>
              <div className="relative z-10 w-full sm:w-[58%] space-y-1 text-white">
                <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#F3D99B] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-white/75 font-light line-clamp-2">{cat.desc}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-[#F3D99B] pt-2">
                  <span>Explore Formulation</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLING FORMULATIONS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B08968]">
              From the source brochure
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Catalogue highlights
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs sm:text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1.5 underline"
          >
            <span>View all {catalogueCount.total} listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* HATHRAS HERITAGE & AYURVEDIC PURITY */}
      <section className="bg-[#FAF7F2] py-16 sm:py-24 border-y border-[#F3EFE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Source-led product information</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
              Product details, brought together with care
            </h2>

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-light">
              Sholkveda brings the supplied product brochure into a modern storefront. Each listing keeps the printed product name, pack size and MRP together, with available package photos and a reference back to the source page.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  Product-page references point back to the relevant brochure page
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  Ingredients are shown only where transcribed from the source
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  No extra discounts or product claims have been invented here
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all shadow-md"
              >
                <span>How the catalogue is sourced</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-[#F3EFE6] shadow-xl">
            <Image
              src="/products/pdf-p5-i3.webp"
              alt="Triphala Ras package image from the supplied brochure"
              fill
              className="object-contain p-4 sm:p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="relative rounded-3xl bg-[#1B4332] text-white p-8 sm:p-12 overflow-hidden shadow-xl text-center space-y-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A880]">Want to see the original?</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Product details, from their source</h2>
          <p className="text-sm text-gray-200 max-w-xl mx-auto">Package photography and printed product details remain attributable to the supplied brochure.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/shop" className="inline-flex justify-center items-center rounded-full px-6 py-3 bg-[#C5A880] text-[#1B4332] font-bold text-sm">Browse products</Link>
            <Link href="/about" className="inline-flex justify-center items-center rounded-full px-6 py-3 border border-white/30 text-white font-bold text-sm">How this catalogue is sourced</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
