import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, IndianRupee, Leaf } from 'lucide-react';
import { GlowIcon } from './GlowIcon';

const METHODOLOGY = [
  {
    icon: FileText,
    lead: 'Brochure product rows are normalized into product pages.',
    rest: 'Multiple pack options stay under the same listing.',
  },
  {
    icon: IndianRupee,
    lead: 'Printed MRPs are used as listed prices.',
    rest: 'No unprinted sale discounts are added.',
  },
  {
    icon: ImageIcon,
    lead: 'Product-package images are extracted from the source brochure',
    rest: 'and shown without cropping the labels.',
  },
  {
    icon: Leaf,
    lead: 'When composition or directions are not transcribed,',
    rest: 'the listing directs you to the package label.',
  },
] as const;

/**
 * Cinematic product showcase: the actual catalogue pack photograph
 * (multiply-blended, uncropped) presented on a botanical wooden-slice
 * stage, beside the catalogue methodology. The pack image links to the
 * real product page; no packaging is fabricated or altered.
 */
export function CatalogueShowcase({
  productHref,
  imageSrc,
  imageAlt,
  customImageSrc,
}: {
  productHref: string;
  imageSrc: string;
  imageAlt: string;
  /** Admin-selected showcase image (Admin → Settings). When set it is shown
   * as a single full scene; when empty the built-in staged pack composite
   * below is used. */
  customImageSrc?: string;
}) {
  return (
    <section aria-labelledby="catalogue-methodology-heading" className="bg-[#FAF7F2] pb-16 pt-4 sm:pb-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <Link
          href={productHref}
          aria-label="View the Triphala Ras product page"
          className="group relative block aspect-[4/3] overflow-hidden rounded-[2rem] border border-[#EFE6D4] shadow-[0_30px_60px_-25px_rgba(27,67,50,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
        >
          {customImageSrc ? (
            <Image
              src={customImageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <>
          <Image
            src="/stages/stage-showcase.webp"
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {/* Soft contact shadow on the pedestal surface, under the pack base */}
          <span
            aria-hidden="true"
            className="absolute bottom-[23%] left-1/2 h-[2.5%] w-[21%] -translate-x-1/2 rounded-full bg-[#3A2A18]/25 blur-md"
          />
          {/* The pack stands ON the wooden slice: its base aligns with the
              pedestal surface (~76% of the stage height) at ~25% of the card
              width, so the real pack photo stays fully visible and never
              sinks into the pedestal or table. Multiply only melts the
              pack's thin white edges into the bright backdrop. */}
          <span className="absolute inset-x-0 bottom-[24%] flex justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={452}
              height={847}
              sizes="(max-width: 1024px) 25vw, 13vw"
              className="h-auto w-[25%] origin-bottom mix-blend-multiply transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
            />
          </span>
            </>
          )}
        </Link>

        <div>
          <h2
            id="catalogue-methodology-heading"
            className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl"
          >
            How this catalogue is put together
          </h2>

          <ul className="mt-7 space-y-5">
            {METHODOLOGY.map(({ icon, lead, rest }, index) => (
              <li key={lead} className="group flex items-start gap-4">
                <GlowIcon icon={icon} size="md" delay={index * 0.7} />
                <p className="pt-1 text-sm leading-relaxed text-gray-600">
                  <strong className="font-bold text-gray-900">{lead}</strong> {rest}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-xs leading-relaxed text-gray-500">
            Product listings are informational and are not medical advice. Please read the package and consult a qualified healthcare professional where appropriate.
          </p>

          <Link
            href="/shop"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_-10px_rgba(27,67,50,0.6)] transition-all duration-300 hover:bg-[#2D6A4F] hover:shadow-[0_16px_42px_-10px_rgba(197,168,128,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] motion-safe:hover:scale-[1.02]"
          >
            Browse catalogue
            <ArrowRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
