import type { Category } from '@/types';
import { Droplet, Flower2, Leaf, Pill, type LucideIcon } from 'lucide-react';

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
  /** Homepage scene photograph for the card (category pages/admin keep the catalogue image). */
  fallbackImage: string;
  imageAlt: string;
}

const CATEGORY_PRESENTATION: Record<string, CategoryPresentation> = {
  'syrups-juices': {
    blurb: 'Explore herbal syrups, juices, and traditional liquid formulations.',
    icon: Leaf,
    fallbackImage: '/categories/syrups-juices.webp',
    imageAlt: 'Ayurvedic herbal syrup bottle with tulsi leaves, honey and ginger',
  },
  'arks-drops': {
    blurb: 'Discover traditional herbal extracts and liquid preparations.',
    icon: Droplet,
    fallbackImage: '/categories/arks-drops.webp',
    imageAlt: 'Amber glass dropper bottle with medicinal herbs and a stone mortar',
  },
  'herbal-oils': {
    blurb: 'Browse traditional herbal oils for personal care and massage.',
    icon: Flower2,
    fallbackImage: '/categories/herbal-oils.webp',
    imageAlt: 'Ayurvedic herbal oil bottle with leaves, cinnamon and natural ingredients',
  },
  'herbal-capsules': {
    blurb: 'Explore capsule-based Ayurvedic formulations and wellness products.',
    icon: Pill,
    fallbackImage: '/categories/herbal-capsules.webp',
    imageAlt: 'Ayurvedic capsule bottle with amla fruits and botanical leaves',
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
  /** 'cover' for scene photographs, 'contain' for white-background pack shots. */
  imageFit: 'cover' | 'contain';
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
      imageUrl: presentation.fallbackImage || category.imageUrl || null,
      imageFit: presentation.fallbackImage ? 'cover' : 'contain',
      imageAlt: presentation.imageAlt,
      icon: presentation.icon,
      accent: index % 2 === 0 ? 'green' : 'gold',
      ctaLabel: `Explore ${category.name}`,
    });
  });
  return cards;
}
