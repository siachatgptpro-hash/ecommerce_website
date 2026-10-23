import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/storefront/ProductCard';
import { HeroCarousel } from '@/components/storefront/HeroCarousel';
import { productRepository } from '@/repositories/product.repository';
import { cmsRepository } from '@/repositories/cms.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { toPublicProduct } from '@/lib/public-dto';
import { toHeroSlides } from '@/lib/hero-slides';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { selectFeaturedCategories } from '@/lib/homepage-categories';
import { jsonLdScriptContent } from '@/lib/seo';
import {
  ShieldCheck,
  Leaf,
  Truck,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Headphones,
  Sparkles,
  Sprout,
} from 'lucide-react';

export const revalidate = 60; // 1 minute ISR

export const metadata: Metadata = {
  title: { absolute: 'SHLOKVEDA | Authentic Ayurvedic Products & Herbal Wellness' },
  description:
    "Explore SHLOKVEDA's Ayurvedic products, herbal oils, wellness essentials, and natural personal care products. Discover traditional formulations for everyday care.",
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'SHLOKVEDA',
    title: 'SHLOKVEDA | Authentic Ayurvedic Products & Herbal Wellness',
    description:
      "Explore SHLOKVEDA's Ayurvedic products, herbal oils, wellness essentials, and natural personal care products. Discover traditional formulations for everyday care.",
    images: [
      {
        url: '/banners/natural-care.jpg',
        alt: 'Ayurvedic personal care products with aloe vera, herbal jars and a mortar and pestle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SHLOKVEDA | Authentic Ayurvedic Products & Herbal Wellness',
    description:
      "Explore SHLOKVEDA's Ayurvedic products, herbal oils, wellness essentials, and natural personal care products. Discover traditional formulations for everyday care.",
    images: ['/banners/natural-care.jpg'],
  },
};

export default async function HomePage() {
  const [featuredResult, banners, catalogueCount, settings, allCategories] = await Promise.all([
    productRepository.findMany({ isFeatured: true, limit: 8 }),
    cmsRepository.getActiveBanners(),
    productRepository.findMany({ limit: 1 }),
    SettingsRepository.getBusinessSettings(),
    productRepository.listCategories(true),
  ]);
  const featuredProducts = { ...featuredResult, products: featuredResult.products.map(toPublicProduct) };

  // Admin-managed banners (Admin → CMS) drive the hero; built-in default
  // slides from src/lib/hero-slides.ts are used when none are active.
  const heroSlides = toHeroSlides(banners);

  // Homepage category cards from live catalogue data (active only).
  const featuredCategories = selectFeaturedCategories(allCategories);

  // The Free Shipping claim always reflects the live store setting.
  const freeShippingThreshold = settings.freeShippingThreshold;
  const benefits = [
    { icon: Leaf, title: 'Authentic Products', text: 'Sourced with care' },
    {
      icon: Truck,
      title: 'Free Shipping',
      text: freeShippingThreshold > 0 ? `On orders of ₹${freeShippingThreshold} & above` : 'On every order',
    },
    { icon: ShieldCheck, title: 'Secure Payments', text: 'Safe & encrypted checkout' },
    { icon: Headphones, title: 'Customer Support', text: 'Always here to help' },
    { icon: Sprout, title: 'Trusted by Families', text: 'For everyday wellness' },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName || 'SHLOKVEDA',
    url: siteUrl || '/',
    logo: `${siteUrl}/logo.png`,
  };
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.storeName || 'SHLOKVEDA',
    url: siteUrl || '/',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };


  return (
    <div className="relative space-y-16 sm:space-y-24">
      {/* HERO + OVERLAPPING BENEFITS STRIP (one block so page spacing
          never overrides the strip's negative overlap margin) */}
      <div>
        <HeroCarousel slides={heroSlides} />

        <section
          aria-label="Store benefits"
          className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <h2 className="sr-only">Why shop with SHLOKVEDA</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-[#F3EFE6] bg-white p-5 shadow-[0_18px_45px_-18px_rgba(27,67,50,0.35)] sm:p-6 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 lg:divide-x lg:divide-[#EFE9DA]">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 lg:justify-center lg:px-4">
                <Icon className="h-8 w-8 shrink-0 text-[#1B4332]" strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <h3 className="text-[13px] font-bold leading-tight text-gray-900">{title}</h3>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* SHOP BY AYURVEDIC CATEGORY */}
      <CategoryShowcase categories={featuredCategories} />

      {/* CATALOGUE HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" aria-labelledby="catalogue-highlights-heading">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9A6B3F]">
              <Leaf className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              From Our Ayurvedic Catalogue
            </span>
            <h2 id="catalogue-highlights-heading" className="mt-2 font-serif text-3xl font-bold text-[#0F281E] sm:text-4xl">
              Catalogue <span className="italic text-[#B08968]">Highlights</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Discover Ayurvedic products for your everyday wellness routine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <ul className="hidden items-center gap-7 md:flex" aria-label="Catalogue assurances">
              {[
                { icon: Leaf, title: 'Authentic Formulations', text: 'Rooted in classical Ayurveda' },
                { icon: ShieldCheck, title: 'Quality Checked', text: 'Verified pack information' },
                { icon: Sparkles, title: 'Wide Range', text: 'For your daily wellness needs' },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-center gap-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#1B4332]/20 bg-white text-[#1B4332]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold leading-tight text-gray-900">{title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full border border-[#1B4332]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#1B4332] shadow-sm transition-colors hover:border-[#1B4332] hover:bg-[#1B4332] hover:text-white"
            >
              View all {catalogueCount.total} listings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
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
              Shlokveda brings the supplied product brochure into a modern storefront. Each listing keeps the printed product name, pack size and MRP together, with available package photos and a reference back to the source page.
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

      {/* Structured data: brand entity + site search (no invented ratings) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(websiteJsonLd) }}
      />
    </div>
  );
}
