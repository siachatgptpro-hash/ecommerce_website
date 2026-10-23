import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Leaf, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Product-page references',
    text: 'Point back to the relevant brochure page.',
  },
  {
    icon: Leaf,
    title: 'Ingredients as shown in the source',
    text: 'Transcribed only from the supplied brochure.',
  },
  {
    icon: ShieldCheck,
    title: 'No extra discounts',
    text: 'No extra discounts or product claims have been invented here.',
  },
  {
    icon: FileText,
    title: 'Clear and consistent information',
    text: 'Product name, pack size, MRP and images as per the source.',
  },
] as const;

/**
 * "Product details, brought together with care" — explains how the
 * catalogue is transcribed from the supplied brochure. Copy is kept
 * strictly factual: no invented claims, discounts, or ingredients.
 */
export function ProductInfoHero() {
  return (
    <section
      aria-labelledby="product-information-heading"
      className="border-y border-[#F3EFE6] bg-[#FAF7F2] py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#1B4332]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1B4332]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Source-led product information
          </p>

          <h2
            id="product-information-heading"
            className="mt-5 font-serif text-4xl font-bold leading-[1.12] text-[#0F281E] sm:text-5xl"
          >
            Product details,
            <br />
            <span className="text-[#A67C2E]">brought together</span>
            <br />
            with care
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Shlokveda brings the supplied product brochure into a modern
            storefront. Each listing keeps the printed product name, pack size
            and MRP together, with available package photos and a reference
            back to the source page.
          </p>

          <ul className="mt-8 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3E4] text-[#1B4332]"
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-900">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-gray-500">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/about"
            className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2"
          >
            How the catalogue is sourced
            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-[#F3EFE6] shadow-xl">
          <Image
            src="/banners/product-info-scene.webp"
            alt="Ayurvedic product catalogue book with amber bottles, a bowl of herbal powder, mortar and pestle, and fresh tulsi leaves"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
