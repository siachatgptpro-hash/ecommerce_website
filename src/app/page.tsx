import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductCard } from '@/components/storefront/ProductCard';
import { HeroCarousel } from '@/components/storefront/HeroCarousel';
import { productRepository } from '@/repositories/product.repository';
import { cmsRepository } from '@/repositories/cms.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { toPublicProduct } from '@/lib/public-dto';
import { toHeroSlides } from '@/lib/hero-slides';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';
import { ProductInfoHero } from '@/components/storefront/ProductInfoHero';
import { TransparencyBanner } from '@/components/storefront/TransparencyBanner';
import { CatalogueTrustStrip } from '@/components/storefront/CatalogueTrustStrip';
import { FallingLeaves } from '@/components/botanical/FallingLeaves';
import { Reveal } from '@/components/botanical/Reveal';
import { selectFeaturedCategories } from '@/lib/homepage-categories';
import { jsonLdScriptContent } from '@/lib/seo';
import {
  ShieldCheck,
  Leaf,
  Truck,
  ArrowRight,
  Headphones,
  Soup,
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
      <section className="relative overflow-hidden" aria-labelledby="catalogue-highlights-heading">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,242,0.12)_0%,rgba(250,247,242,0.04)_45%,rgba(250,247,242,0.16)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_48%_40%_at_80%_10%,rgba(250,247,242,0.82),transparent_72%),radial-gradient(ellipse_44%_42%_at_13%_13%,rgba(250,247,242,0.6),transparent_70%)]" />
        {/* Midground foliage: masked corner crops swaying over the static
            backdrop for depth; sparse leaves drift down above them. */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-8 -top-8 h-44 w-44 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:0%_0%] bg-no-repeat opacity-70 [mask-image:radial-gradient(ellipse_85%_85%_at_10%_10%,black_40%,transparent_72%)] motion-safe:animate-[leaf-sway_9s_ease-in-out_infinite_alternate] sm:h-56 sm:w-56" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:230%_auto] bg-[position:100%_0%] bg-no-repeat opacity-70 [mask-image:radial-gradient(ellipse_85%_85%_at_90%_10%,black_40%,transparent_72%)] motion-safe:animate-[leaf-sway_10s_ease-in-out_infinite_alternate] sm:h-56 sm:w-56" style={{ animationDelay: '0.7s' }} />
        <FallingLeaves preset="catalogue" contained />
        <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <Reveal>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1B4332]">
              <Leaf className="h-4 w-4 text-[#1B4332]" aria-hidden="true" />
              From Our Ayurvedic Catalogue
            </span>
            <h2 id="catalogue-highlights-heading" className="mt-3 font-serif text-[40px] font-bold leading-[1.14] text-[#0F281E] sm:text-6xl sm:leading-[1.14]">
              Catalogue
              <span className="block bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">Highlights</span>
            </h2>
            <p className="mt-5 max-w-[19rem] text-sm leading-relaxed text-gray-600 sm:mt-6 sm:text-base">
              Discover Ayurvedic products for your everyday wellness routine.
            </p>
          </Reveal>

          <Reveal delay={120} className="flex flex-col items-start gap-6 lg:items-center lg:pt-3">
            <ul className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-3 md:flex xl:gap-x-7" aria-label="Catalogue assurances">
              {[
                { icon: Leaf, filled: true, title: 'Authentic Formulations', text: 'Rooted in classical Ayurveda' },
                { icon: ShieldCheck, filled: false, title: 'Quality Checked', text: 'Verified pack information' },
                { icon: Soup, filled: false, title: 'Wide Range', text: 'For your daily wellness needs' },
              ].map(({ icon: Icon, filled, title, text }, index) => (
                <li key={title} className="flex shrink-0 items-center gap-2">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center">
                    <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.55),transparent_70%)] motion-safe:animate-[banner-breathe_5.5s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.8}s` }} />
                    <span className="relative grid h-10 w-10 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] shadow-[0_0_16px_rgba(197,168,128,0.45)]">
                      <Icon className={filled ? 'h-5 w-5 fill-[#1B4332] text-[#1B4332]' : 'h-5 w-5 text-[#A67C2E]'} strokeWidth={filled ? 1.5 : 1.9} aria-hidden="true" />
                    </span>
                  </span>
                  <span>
                    <span className="block whitespace-nowrap text-[13px] font-bold leading-tight text-gray-900">{title}</span>
                    <span className="mt-0.5 block whitespace-nowrap text-[11px] leading-snug text-gray-600">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#1B4332] px-7 py-3.5 text-sm font-bold text-[#F3E5C3] shadow-[0_16px_36px_-12px_rgba(27,67,50,0.7),0_0_24px_rgba(197,168,128,0.45)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] hover:shadow-[0_20px_42px_-12px_rgba(197,168,128,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 motion-safe:hover:scale-[1.03]"
            >
              View all {catalogueCount.total} listings
              <ArrowRight className="h-4 w-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.products.map((product, index) => (
            <ProductCard key={product.id} product={product} entranceDelay={Math.min(index, 7) * 60} />
          ))}
        </div>
        </div>
      </section>

{/* PRODUCT INFORMATION + TRANSPARENCY BANNER + TRUST STRIP */}
      <ProductInfoHero />
      <TransparencyBanner />
      <CatalogueTrustStrip />

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
