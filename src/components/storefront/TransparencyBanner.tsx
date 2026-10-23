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
 * Deep-green transparency banner: states plainly that catalogue details
 * remain attributable to the supplied brochure, with routes into the
 * shop and the sourcing methodology page.
 */
export function TransparencyBanner() {
  return (
    <section aria-labelledby="transparency-banner-heading" className="bg-[#FAF7F2] pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[#C5A880]/50 bg-[linear-gradient(135deg,#0E3B29_0%,#14532D_60%,#1B4332_100%)] px-6 py-12 text-center shadow-xl sm:px-12 sm:py-14">
          {/* Botanical corner decorations */}
          <Leaf aria-hidden="true" className="pointer-events-none absolute -left-7 -top-7 h-32 w-32 -rotate-12 text-[#C5A880]/15" />
          <Leaf aria-hidden="true" className="pointer-events-none absolute -right-7 -top-7 h-32 w-32 rotate-12 -scale-x-100 text-[#C5A880]/15" />
          <Leaf aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rotate-[140deg] text-[#C5A880]/10" />
          <Leaf aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 -rotate-[140deg] -scale-x-100 text-[#C5A880]/10" />

          <div className="relative">
            <p className="flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#C5A880]">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              Want to see the original?
              <Leaf className="h-3.5 w-3.5 -scale-x-100" aria-hidden="true" />
            </p>

            <h2
              id="transparency-banner-heading"
              className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl"
            >
              Product details, <span className="text-[#C5A880]">from their source</span>
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-green-100/85">
              Package photography and printed product details remain attributable
              to the supplied brochure.
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/10">
              {INFO_BLOCKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex flex-col items-center gap-2 px-5">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C5A880]/50 text-[#C5A880]"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="mt-1 text-sm font-bold text-white">{title}</span>
                  <span className="max-w-[220px] text-xs leading-relaxed text-green-100/70">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C5A880] px-7 py-3.5 text-sm font-bold text-[#0F281E] shadow-md transition-colors hover:bg-[#D6BC94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E3B29] sm:w-auto"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                Browse products
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/about"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E3B29] sm:w-auto"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                How this catalogue is sourced
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
