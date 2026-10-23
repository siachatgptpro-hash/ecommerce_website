import { BookOpen, Boxes, Leaf, Package, ReceiptText } from 'lucide-react';
import { GlowIcon } from './GlowIcon';

/**
 * Cinematic catalogue hero: botanical photo edges under a warm ivory wash,
 * a slow gold light drift, the source-led catalogue heading, and three
 * glowing statistics cards. All copy and numbers come from the existing
 * About page / brochure data — presentation only.
 */
export function CatalogueHero({
  entries,
  listings,
  variants,
}: {
  entries: number;
  listings: number;
  variants: number;
}) {
  const stats = [
    { icon: ReceiptText, value: entries, label: 'printed price-list entries' },
    { icon: Package, value: listings, label: 'unique product listings' },
    { icon: Boxes, value: variants, label: 'pack-size variants' },
  ];

  return (
    <section aria-labelledby="catalogue-hero-heading" className="relative overflow-hidden bg-[#FAF7F2]">
      {/* Botanical photographic backdrop + ivory wash + ambient gold drift */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,242,0.6),rgba(250,247,242,0.76)_55%,#FAF7F2_96%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgba(217,190,140,0.22),transparent_70%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#1B4332]/15 bg-[#1B4332]/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]">
            <BookOpen className="h-4 w-4" aria-hidden="true" /> Source-led catalogue
          </p>
          <h1
            id="catalogue-hero-heading"
            className="mt-6 font-serif text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl"
          >
            Shlokveda, with product details{' '}
            <span className="text-[#1B4332]">from the supplied brochure</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            This storefront organizes the product names, pack sizes and printed MRPs from the provided 16-page “Only Ayurveda” brochure. Shlokveda is the storefront brand; the original packaging and brochure artwork remain as printed in the source.
          </p>
        </header>

        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5" aria-label="Catalogue summary">
          {stats.map(({ icon, value, label }, index) => (
            <li
              key={label}
              className="group relative flex items-center gap-4 overflow-hidden rounded-[1.75rem] border border-[#E3D5B5] bg-white/85 px-6 py-5 shadow-[0_14px_36px_-18px_rgba(27,67,50,0.35)] backdrop-blur transition-shadow duration-500 hover:shadow-[0_22px_46px_-18px_rgba(197,168,128,0.6)]"
            >
              <GlowIcon icon={icon} size="lg" delay={index * 0.7} />
              <span>
                <strong className="block font-serif text-4xl font-bold leading-none text-[#0F281E] sm:text-[2.75rem]">
                  {value}
                </strong>
                <span className="mt-1.5 block text-xs leading-snug text-gray-600">{label}</span>
              </span>
              <Leaf
                aria-hidden="true"
                className="pointer-events-none absolute -right-1 bottom-3 h-7 w-7 rotate-12 text-[#C5A880]/50"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
