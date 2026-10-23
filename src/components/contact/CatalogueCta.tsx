import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

/**
 * Deep-forest-green catalogue CTA panel, proportioned like the reference:
 * noticeably narrower than the cards row and centred, with photographic
 * leaf sprigs flanking the heading, a centre-weighted green wash over a
 * botanical photo (foliage ghosts through at the edges), a slow gold
 * drift, and a gold pill button to the real catalogue route (/shop).
 */
export function CatalogueCta() {
  return (
    <section
      aria-labelledby="contact-catalogue-heading"
      className="mx-auto max-w-2xl motion-safe:animate-[rise-in_0.7s_ease-out_both]"
      style={{ animationDelay: '0.36s' }}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D9BE8C]/60 bg-[#0C2B1E] px-6 py-9 text-center shadow-[0_30px_60px_-25px_rgba(15,40,30,0.65),0_0_44px_-12px_rgba(197,168,128,0.45)] sm:px-12 sm:py-10">
        {/* Botanical photo + centre-weighted deep-green wash + gold drift */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_78%_95%_at_50%_45%,rgba(11,46,32,0.9),rgba(12,43,30,0.8)_68%,rgba(12,43,30,0.7))]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgba(217,190,140,0.2),transparent_70%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
        />

        {/* Photographic leaf sprigs flanking the heading (same scene as the
            page backdrop), masked to fade into the panel — as in the reference. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 hidden h-40 w-32 -translate-y-1/2 bg-[url('/banners/contact-botanical-bg.webp')] bg-cover bg-[position:4%_10%] opacity-[0.55] [mask-image:radial-gradient(ellipse_75%_70%_at_18%_50%,black_25%,transparent_72%)] sm:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 hidden h-40 w-32 -translate-y-1/2 bg-[url('/banners/contact-botanical-bg.webp')] bg-cover bg-[position:96%_4%] opacity-[0.55] [mask-image:radial-gradient(ellipse_75%_70%_at_82%_50%,black_25%,transparent_72%)] sm:block"
        />

        <div className="relative">
          <BookOpen
            className="mx-auto h-7 w-7 text-[#DDBF8E] [filter:drop-shadow(0_0_10px_rgba(221,191,142,0.6))]"
            aria-hidden="true"
            strokeWidth={1.5}
          />
          <h2
            id="contact-catalogue-heading"
            className="mt-3.5 font-serif text-[1.65rem] font-bold leading-snug text-white sm:text-[1.9rem]"
          >
            Looking for{' '}
            <span className="bg-[linear-gradient(180deg,#E9CF8F,#C5A880)] bg-clip-text text-transparent">
              a product?
            </span>
          </h2>
          <p className="mt-2.5 text-sm text-[#E9E2D0]/85">
            Browse the brochure-based catalogue.
          </p>
          <Link
            href="/shop"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,#EBD195,#C5A880)] px-6 py-2.5 text-sm font-bold text-[#0F281E] shadow-[0_12px_32px_-8px_rgba(197,168,128,0.85)] transition-all duration-300 hover:shadow-[0_16px_42px_-8px_rgba(221,191,142,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DDBF8E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C2B1E] motion-safe:hover:scale-[1.02]"
          >
            Go to Catalogue
            <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
