import { BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from '@/lib/brochure-data';
import { CatalogueHero } from '@/components/about/CatalogueHero';
import { CatalogueShowcase } from '@/components/about/CatalogueShowcase';
import { settingsRepository } from '@/repositories/settings.repository';
import { Reveal } from '@/components/botanical/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Our Catalogue | Shlokveda',
  description:
    'How the Shlokveda storefront organises product names, pack sizes, printed MRPs and package photos from the supplied Ayurvedic product brochure.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Our Catalogue | Shlokveda',
    description:
      'How the Shlokveda storefront organises product names, pack sizes, printed MRPs and package photos from the supplied Ayurvedic product brochure.',
    url: '/about',
    siteName: 'Shlokveda',
    type: 'website',
  },
};

// The showcase image is admin-editable (Admin → Settings), so this page
// renders dynamically to reflect changes immediately.
export const dynamic = 'force-dynamic';

const variantCount = BROCHURE_PRODUCTS.reduce((total, product) => total + product.variants.length, 0);

export default async function AboutPage() {
  // Optional store-selected showcase image. Only same-site paths and
  // absolute http(s) URLs are honoured; anything else falls back to the
  // built-in staged pack scene so a bad value can never break the page.
  let customShowcaseImage: string | undefined;
  try {
    const settings = await settingsRepository.getBusinessSettings();
    const candidate = (settings.aboutShowcaseImageUrl || '').trim();
    if (/^\/|https?:\/\//i.test(candidate)) customShowcaseImage = candidate;
  } catch {
    // Settings unavailable — the built-in default scene is used.
  }
  return (
    <>
      <CatalogueHero
        entries={PDF_CATALOG_ENTRY_COUNT}
        listings={BROCHURE_PRODUCTS.length}
        variants={variantCount}
      />
      <Reveal>
        <CatalogueShowcase
          productHref="/product/triphala-ras"
          imageSrc="/products/triphala-ras-pack.webp"
          imageAlt={customShowcaseImage ? 'Catalogue showcase image selected by the store' : 'Triphala Ras package image from the supplied product brochure'}
          customImageSrc={customShowcaseImage}
        />
      </Reveal>
    </>
  );
}
