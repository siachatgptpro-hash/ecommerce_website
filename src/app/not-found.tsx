import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found | Shlokveda',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_40%_at_50%_0%,rgba(217,190,140,0.22),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 origin-top-left bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:0%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_42%,transparent_74%)] sm:h-64 sm:w-64" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 origin-top-right bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:175%_auto] bg-[position:100%_0%] bg-no-repeat opacity-60 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_42%,transparent_74%)] sm:h-64 sm:w-64" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-20 text-center sm:py-28">
        <span className="relative mx-auto grid h-20 w-20 place-items-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.5),transparent_70%)]" />
          <span className="relative grid h-16 w-16 place-items-center rounded-full border border-[#D9BE8C]/80 bg-[#FBF3E2] text-[#1B4332] shadow-[0_0_20px_rgba(197,168,128,0.45)]">
            <Leaf className="h-7 w-7 fill-[#1B4332]" aria-hidden="true" />
          </span>
        </span>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#A67C2E]">404</p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-[1.15] text-[#0F281E] sm:text-4xl sm:leading-[1.15]">
          This page could not be found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          The page you are looking for may have moved, or the link may be incorrect.
          Explore the catalogue to find authentic Ayurvedic formulations.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full border border-[#C5A880]/60 bg-[#1B4332] px-7 py-3 text-[13px] font-bold text-white shadow-[0_16px_34px_-14px_rgba(27,67,50,0.75),0_0_22px_rgba(197,168,128,0.35)] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 motion-safe:hover:scale-[1.02]"
          >
            Browse Catalogue
            <ArrowRight className="h-4 w-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#D9BE8C] bg-white/90 px-7 py-3 text-[13px] font-bold text-[#1B4332] shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:border-[#C5A880] hover:shadow-[0_12px_26px_-12px_rgba(197,168,128,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
