import { Leaf } from 'lucide-react';

/**
 * Cinematic contact hero: centred eyebrow with leaf ornaments, a
 * two-tone serif H1 (deep green + metallic gold) and the supporting
 * line. Presentation only — the copy is the page's existing copy.
 */
export function ContactHero({ storeName }: { storeName: string }) {
  return (
    <header className="mx-auto max-w-3xl text-center motion-safe:animate-[rise-in_0.7s_ease-out_both]">
      <p className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#A67C2E]">
        <span aria-hidden="true" className="hidden h-px w-8 bg-gradient-to-r from-transparent to-[#C5A880] sm:block" />
        <Leaf className="h-4 w-4 -scale-x-100 text-[#B08968]" aria-hidden="true" />
        {storeName}
        <Leaf className="h-4 w-4 text-[#B08968]" aria-hidden="true" />
        <span aria-hidden="true" className="hidden h-px w-8 bg-gradient-to-l from-transparent to-[#C5A880] sm:block" />
      </p>
      <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-[#0F281E] sm:text-5xl">
        Contact{' '}
        <span className="bg-[linear-gradient(180deg,#D9B45B,#A67C2E)] bg-clip-text text-transparent">
          Information
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
        For questions about an order or a product listing, use the contact details below. For ingredients and directions, please refer to the package label.
      </p>
    </header>
  );
}
