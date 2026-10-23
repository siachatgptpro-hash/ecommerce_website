import Link from 'next/link';
import { ArrowRight, BookOpen, Leaf } from 'lucide-react';

/**
 * Deep-forest-green catalogue CTA panel: botanical photo under a green
 * wash with a slow gold drift, open-book icon, two-tone heading and a
 * gold pill button to the real catalogue route (/shop).
 */
export function CatalogueCta() {
  return (
    <section
      aria-labelledby="contact-catalogue-heading"
      className="motion-safe:animate-[rise-in_0.7s_ease-out_both]"
      style={{ animationDelay: '0.36s' }}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#C5A880]/50 bg-[#0C2B1E] px-6 py-11 text-center shadow-[0_30px_60px_-25px_rgba(15,40,30,0.65)] sm:px-10 sm:py-12">
        {/* Botanical photographic backdrop + deep-green wash + gold drift */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(12,43,30,0.93),rgba(15,40,30,0.97)_60%,rgba(11,46,32,0.95))]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(217,190,140,0.18),transparent_70%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
        />
        <Leaf
          aria-hidden="true"
          className="pointer-events-none absolute -left-3 bottom-6 h-20 w-20 -rotate-[20deg] text-[#C5A880]/15"
          strokeWidth={0.9}
        />
        <Leaf
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 bottom-6 h-20 w-20 rotate-[20deg] -scale-x-100 text-[#C5A880]/15"
          strokeWidth={0.9}
        />

        <div className="relative">
          <BookOpen
            className="mx-auto h-8 w-8 text-[#DDBF8E] [filter:drop-shadow(0_0_10px_rgba(221,191,142,0.6))]"
            aria-hidden="true"
            strokeWidth={1.5}
          />
          <h2
            id="contact-catalogue-heading"
            className="mt-4 font-serif text-[1.7rem] font-bold text-white sm:text-[2rem]"
          >
            Looking for{' '}
            <span className="bg-[linear-gradient(180deg,#E9CF8F,#C5A880)] bg-clip-text text-transparent">
              a product?
            </span>
          </h2>
          <p className="mt-3 text-sm text-[#E9E2D0]/85 sm:text-base">
            Browse the brochure-based catalogue.
          </p>
          <Link
            href="/shop"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,#EBD195,#C5A880)] px-8 py-3.5 text-sm font-bold text-[#0F281E] shadow-[0_12px_32px_-8px_rgba(197,168,128,0.8)] transition-all duration-300 hover:shadow-[0_16px_42px_-8px_rgba(221,191,142,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDBF8E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C2B1E] motion-safe:hover:scale-[1.02]"
          >
            Go to Catalogue
            <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
