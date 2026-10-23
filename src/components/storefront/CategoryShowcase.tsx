import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, Package, ShieldCheck, Tag } from 'lucide-react';
import type { CategoryCardView } from '@/lib/homepage-categories';

const CATALOGUE_ASSURANCES = [
  {
    icon: Leaf,
    title: 'A Clear Product Catalogue',
    text: 'Easy to explore with detailed product information.',
  },
  {
    icon: Tag,
    title: 'Transparent Pricing',
    text: 'Printed MRP and selling price shown clearly.',
  },
  {
    icon: ShieldCheck,
    title: 'Original Pack Images',
    text: 'Authentic product packaging on every listing.',
  },
  {
    icon: Package,
    title: 'Careful Product Information',
    text: 'Always read the label and consult a qualified professional.',
  },
] as const;

const ACCENT_STYLES = {
  green: {
    badge: 'bg-[#1B4332]',
    cta: 'bg-[#1B4332] hover:bg-[#2D6A4F]',
  },
  gold: {
    badge: 'bg-[#8A5A2B]',
    cta: 'bg-[#8A5A2B] hover:bg-[#A06A33]',
  },
} as const;

/**
 * "Shop by Ayurvedic Category" — full-width botanical section.
 * Cards are built from live catalogue categories (see
 * src/lib/homepage-categories.ts); each card is one stretched,
 * descriptive link for clean keyboard + screen-reader navigation.
 */
export function CategoryShowcase({ categories }: { categories: CategoryCardView[] }) {
  if (categories.length === 0) return null;

  return (
    <section
      id="categories"
      aria-labelledby="shop-by-category-heading"
      className="relative scroll-mt-28 overflow-hidden bg-[linear-gradient(180deg,#FBF7EC_0%,#F5EEDF_55%,#FBF7EC_100%)]"
    >
      {/* Soft botanical atmosphere (decorative only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#2D6A4F]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-[#C5A880]/20 blur-3xl"
      />
      <Leaf
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 bottom-10 hidden h-48 w-48 rotate-[24deg] text-[#1B4332]/[0.05] lg:block"
      />
      <Leaf
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-40 hidden h-48 w-48 -scale-x-100 rotate-[24deg] text-[#1B4332]/[0.05] lg:block"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        {/* Catalogue assurances strip */}
        <ul className="grid grid-cols-1 gap-5 rounded-[2rem] border border-[#EFE6D4] bg-white/70 px-6 py-5 shadow-sm backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#EFE6D4]">
          {CATALOGUE_ASSURANCES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3.5 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#1B4332]/25 text-[#1B4332]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold leading-tight text-gray-900">{title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Section heading */}
        <div className="mt-12 text-center sm:mt-14">
          <p className="flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#9A6B3F]">
            <span aria-hidden="true" className="h-px w-10 bg-[#C5A880]" />
            <Leaf aria-hidden="true" className="h-4 w-4 text-[#1B4332]" />
            Explore Our Range
            <Leaf aria-hidden="true" className="h-4 w-4 -scale-x-100 text-[#1B4332]" />
            <span aria-hidden="true" className="h-px w-10 bg-[#C5A880]" />
          </p>
          <h2
            id="shop-by-category-heading"
            className="mt-3 font-serif text-3xl font-bold text-[#0F281E] sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
          >
            Shop by <span className="italic text-[#B08968]">Ayurvedic</span> Category
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#5B6B60] sm:text-base">
            Discover Ayurvedic products and traditional herbal formulations for your
            everyday wellness routine.
          </p>
        </div>

        {/* Category cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const accent = ACCENT_STYLES[category.accent];
            return (
              <article
                key={category.id}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-[#EFE6D4] bg-white shadow-[0_10px_30px_-12px_rgba(27,67,50,0.15)] transition-all duration-300 focus-within:ring-2 focus-within:ring-[#1B4332] focus-within:ring-offset-2 hover:border-[#C5A880]/60 hover:shadow-[0_24px_45px_-15px_rgba(27,67,50,0.3)] motion-safe:hover:-translate-y-1.5"
              >
                <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_50%_30%,#FFFDF8_0%,#F5EEDF_70%,#EFE3CB_100%)]">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-5 transition-transform duration-500 motion-safe:group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center" aria-hidden="true">
                      <Icon className="h-16 w-16 text-[#1B4332]/25" />
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${accent.badge}`}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-bold leading-snug text-[#0F281E]">
                        {category.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    <Link
                      href={category.href}
                      aria-label={`${category.ctaLabel} — ${category.description}`}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white transition-colors after:absolute after:inset-0 after:rounded-[1.75rem] focus:outline-none ${accent.cta}`}
                    >
                      {category.ctaLabel}
                      <ArrowRight
                        className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
