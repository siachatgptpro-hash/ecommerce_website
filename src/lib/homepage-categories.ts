import type { Category } from '@/types';
import { Droplets, Flower2, Leaf, Pill, type LucideIcon } from 'lucide-react';

/**
 * Homepage "Shop by Ayurvedic Category" — data shaping.
 *
 * Categories themselves live in the catalogue (Admin → Categories) and are
 * fetched server-side; this module only decides WHICH categories are
 * featured on the homepage and how they are presented (blurb, icon,
 * fallback pack photo, accent). To feature a different set later, change
 * FEATURED_CATEGORY_SLUGS — no markup changes needed.
 */
export const FEATURED_CATEGORY_SLUGS = [
  'syrups-juices',
  'arks-drops',
  'herbal-oils',
  'herbal-capsules',
] as const;

interface CategoryPresentation {
  blurb: string;
  icon: LucideIcon;
  /** Real pack photograph used when the category has no image of its own. */
  fallbackImage: string;
  imageAlt: string;
}

const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  'syrups-juices': {
    blurb: 'Explore herbal syrups, juices, and traditional liquid formulations.',
    icon: Leaf,
    fallbackImage: '/products/pdf-p6-i10.webp',
    imageAlt: 'Ayurvedic herbal syrup bottle from the SHLOKVEDA syrups and juices range',
  },
  'arks-drops': {
    blurb: 'Discover traditional herbal extracts and liquid preparations.',
    icon: Droplets,
    fallbackImage: '/products/pdf-p6-i3.webp',
    imageAlt: 'Ayurvedic ark and herbal drops bottle from the SHLOKVEDA catalogue',
  },
  'herbal-oils': {
    blurb: 'Browse traditional herbal oils for personal care and massage.',
    icon: Flower2,
    fallbackImage: '/products/pdf-p10-i1.webp',
    imageAlt: 'Ayurvedic herbal oil bottle from the SHLOKVEDA catalogue',
  },
  'herbal-capsules': {
    blurb: 'Explore capsule-based Ayurvedic formulations and wellness products.',
    icon: Pill,
    fallbackImage: '/products/pdf-p12-i2.webp',
    imageAlt: 'Ayurvedic herbal capsule bottle from the SHLOKVEDA catalogue',
  },
};

const GENERIC_PRESENTATION: Omit<CategoryPresentation, 'blurb' | 'imageAlt'> = {
  icon: Leaf,
  fallbackImage: '',
};

export interface CategoryCardView {
  id: string;
  name: string;
  slug: string;
  href: string;
  description: string;
  /** Null when neither the category nor the fallback provides a photo. */
  imageUrl: string | null;
  imageAlt: string;
  icon: LucideIcon;
  accent: 'green' | 'gold';
  ctaLabel: string;
}

/**
 * Build homepage category cards from live catalogue categories:
 * active only, featured slugs in display order, de-duplicated by slug.
 * Categories missing from the database are skipped (never fabricated).
 */
export function selectFeaturedCategories(categories: Category[]): CategoryCardView[] {
  const bySlug = new Map<string, Category>();
  for (const category of categories) {
    if (category.isActive && !bySlug.has(category.slug)) {
      bySlug.set(category.slug, category);
    }
  }

  const cards: CategoryCardView[] = [];
  FEATURED_CATEGORY_SLUGS.forEach((slug, index) => {
    const category = bySlug.get(slug);
    if (!category) return;
    const presentation = CATEGORY_PRESENTATION[slug] ?? {
      ...GENERIC_PRESENTATION,
      blurb: category.description || `Explore our ${category.name} range.`,
      imageAlt: `${category.name} products from the SHLOKVEDA catalogue`,
    };
    cards.push({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/category/${category.slug}`,
      description: presentation.blurb,
      imageUrl: category.imageUrl || presentation.fallbackImage || null,
      imageAlt: presentation.imageAlt,
      icon: presentation.icon,
      accent: index % 2 === 0 ? 'green' : 'gold',
      ctaLabel: `Explore ${category.name}`,
    });
  });
  return cards;
}
