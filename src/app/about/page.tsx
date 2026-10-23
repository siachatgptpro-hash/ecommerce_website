import { BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from '@/lib/brochure-data';
import { CatalogueHero } from '@/components/about/CatalogueHero';
import { CatalogueShowcase } from '@/components/about/CatalogueShowcase';

const variantCount = BROCHURE_PRODUCTS.reduce((total, product) => total + product.variants.length, 0);

export default function AboutPage() {
  return (
    <>
      <CatalogueHero
        entries={PDF_CATALOG_ENTRY_COUNT}
        listings={BROCHURE_PRODUCTS.length}
        variants={variantCount}
      />
      <CatalogueShowcase
        productHref="/product/triphala-ras"
        imageSrc="/products/pdf-p5-i3.webp"
        imageAlt="Triphala Ras package image from the supplied product brochure"
      />
    </>
  );
}
