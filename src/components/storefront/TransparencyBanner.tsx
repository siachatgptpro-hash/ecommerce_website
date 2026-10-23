import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Leaf, Package, ShieldCheck, ShoppingCart } from 'lucide-react';

const INFO_BLOCKS = [
  {
    icon: Package,
    title: 'Original Pack Images',
    text: 'Product images as shown in the brochure.',
  },
  {
    icon: FileText,
    title: 'Printed Details',
    text: 'Product name, pack size and MRP as per source.',
  },
  {
    icon: BookOpen,
    title: 'Authentic Information',
    text: 'Ingredients and usage information from the supplied brochure.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted Catalogue',
    text: 'No invented claims or fake discounts.',
  },
] as const;

/**
 * Deep-green transparency banner with a cinematic botanical glow: a
 * photographic leaf backdrop, a slow emerald light drift, and gold icon
 * rings with a gentle breathing glow. All motion is transform/opacity
 * based and fully disabled under prefers-reduced-motion. Copy remains
 * strictly factual sourcing information.
 */
export function TransparencyBanner() {
  return (
    <section aria-labelledby="transparency-banner-heading" className="bg-[#FAF7F2] pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#C5A880]/50 bg-[#0B2E20] px-6 py-12 text-center shadow-xl sm:px-12 sm:py-14">
          {/* Photographic botanical backdrop + readability wash + ambient drift */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url('/banners/footer-botanical-bg.webp')] bg-cover bg-center"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_78%_92%_at_50%_45%,rgba(9,38,26,0.8),rgba(9,38,26,0.45)_75%,rgba(9,38,26,0.3))]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgba(72,187,130,0.16),transparent_70%)] motion-safe:animate-[banner-drift_16s_ease-in-out_infinite_alternate]"
          />

          <div className="relative">
            <p className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#DDBF8E]">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              Want to see the original?
              <Leaf className="h-3.5 w-3.5 -scale-x-100" aria-hidden="true" />
            </p>

            <h2
              id="transparency-banner-heading"
              className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl"
            >
              Product details, <span className="text-[#DDBF8E]">from their source</span>
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-green-100/90">
              Package photography and printed product details remain attributable
              to the supplied brochure.
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/10">
              {INFO_BLOCKS.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="group flex flex-col items-center gap-2 px-5">
                  <span className="relative" aria-hidden="true">
                    {/* Ambient breathing glow (transform/opacity only, staggered per icon) */}
                    <span
                      className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(217,190,140,0.35),rgba(72,187,130,0.12)_55%,transparent_72%)] motion-safe:animate-[banner-breathe_5s_ease-in-out_infinite]"
                      style={{ animationDelay: `${index * 0.7}s` }}
                    />
                    <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#C5A880]/60 bg-[radial-gradient(circle_at_50%_32%,rgba(217,190,140,0.24),rgba(18,64,42,0.35)_62%,rgba(10,36,24,0.55))] shadow-[0_0_26px_rgba(197,168,128,0.28),0_0_64px_rgba(64,192,128,0.12),inset_0_1px_0_rgba(255,244,214,0.35),inset_0_-10px_18px_rgba(0,0,0,0.35)] transition-all duration-500 group-hover:border-[#E3C98F] group-hover:shadow-[0_0_38px_rgba(217,190,140,0.5),0_0_90px_rgba(64,192,128,0.2),inset_0_1px_0_rgba(255,244,214,0.5),inset_0_-10px_18px_rgba(0,0,0,0.3)] motion-safe:group-hover:scale-[1.07] sm:h-[4.5rem] sm:w-[4.5rem]">
                      {/* Delicate gold highlight sweeping across on hover */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(115deg,transparent_32%,rgba(255,240,200,0.38)_50%,transparent_68%)] transition-transform duration-700 ease-out motion-safe:group-hover:translate-x-[130%]" />
                      <Icon
                        className="relative h-7 w-7 text-[#DDBF8E] transition-colors duration-500 [filter:drop-shadow(0_0_7px_rgba(221,191,142,0.55))] group-hover:text-[#F2E0B0]"
                        strokeWidth={1.55}
                      />
                    </span>
                  </span>
                  <span className="mt-2 text-sm font-bold text-white">{title}</span>
                  <span className="max-w-[220px] text-xs leading-relaxed text-green-100/75">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C5A880] px-7 py-3.5 text-sm font-bold text-[#0F281E] shadow-[0_10px_34px_-8px_rgba(197,168,128,0.65)] transition-all duration-300 hover:bg-[#D6BC94] hover:shadow-[0_14px_44px_-6px_rgba(217,190,140,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2E20] motion-safe:hover:scale-[1.02] sm:w-auto"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Browse products
                <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/about"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white hover:bg-white/5 hover:shadow-[0_0_28px_rgba(255,255,255,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2E20] motion-safe:hover:scale-[1.02] sm:w-auto"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                How this catalogue is sourced
                <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
