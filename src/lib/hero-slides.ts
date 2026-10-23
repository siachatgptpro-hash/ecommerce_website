import type { Banner } from '@/types';

/**
 * Homepage hero slide model.
 *
 * Slides are managed in Admin → CMS → Banners (title, subtitle, image,
 * primary + secondary CTAs, sort order, active flag). When no active
 * banners exist (e.g. a fresh database before seeding), the homepage
 * falls back to DEFAULT_HERO_SLIDES below so the hero is never empty.
 *
 * `eyebrow` and `titleHighlight` are code-level presentation details for
 * the default slides; admin-managed banners always render with the brand
 * tagline eyebrow and a plain (unhighlighted) serif headline.
 */
export interface HeroSlide {
  id: string;
  /** Small pill label above the headline. */
  eyebrow?: string;
  title: string;
  /** Substring of `title` rendered in gold italic serif. */
  titleHighlight?: string;
  subtitle: string;
  imageUrl: string;
  mobileImgUrl?: string | null;
  /** Descriptive alt text for the slide photograph (SEO + a11y). */
  imageAlt: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export const DEFAULT_HERO_EYEBROW = 'Pure Ayurveda · Natural Wellness · Trusted by Families';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-personal-care',
    eyebrow: 'Pure Ayurveda · Natural Wellness · Trusted by Families',
    title: 'Natural Personal Care for a Healthier You',
    titleHighlight: 'for a Healthier You',
    subtitle:
      'Explore authentic Ayurvedic products crafted with traditional herbs for your everyday wellness routine.',
    imageUrl: '/banners/hero-personal-care.webp',
    imageAlt:
      'Ayurvedic personal care scene with herbal jars, dropper bottles, aloe vera and botanical leaves',
    ctaText: 'Shop Personal Care',
    ctaLink: '/category/personal-care',
    secondaryCtaText: 'Explore Categories',
    secondaryCtaLink: '/#categories',
  },
  {
    id: 'hero-daily-wellness',
    eyebrow: 'Pure Ayurveda · Natural Wellness · Trusted by Families',
    title: 'Everyday Wellness, Rooted in Ayurveda',
    titleHighlight: 'Rooted in Ayurveda',
    subtitle:
      'Discover traditional Ayurvedic formulations for your daily wellness routine.',
    imageUrl: '/banners/hero-wellness.webp',
    imageAlt: 'Ayurvedic wellness scene with a herbal jar, amla, tulsi leaves and honey',
    ctaText: 'Explore Wellness',
    ctaLink: '/category/immunity-rasayana',
    secondaryCtaText: 'Shop Bestsellers',
    secondaryCtaLink: '/shop',
  },
  {
    id: 'hero-herbal-oils',
    eyebrow: 'Pure Ayurveda · Natural Wellness · Trusted by Families',
    title: 'Ancient Wisdom. Everyday Care.',
    titleHighlight: 'Everyday Care.',
    subtitle:
      'Explore traditional herbal oils and Ayurvedic preparations for your daily care rituals.',
    imageUrl: '/banners/hero-herbal-oils.webp',
    imageAlt: 'Ayurvedic herbal oil bottles with medicinal leaves and a lit brass diya',
    ctaText: 'Shop Herbal Oils',
    ctaLink: '/category/herbal-oils',
    secondaryCtaText: 'Discover More',
    secondaryCtaLink: '/about',
  },
  {
    id: 'hero-complete-catalogue',
    eyebrow: 'Pure Ayurveda · Natural Wellness · Trusted by Families',
    title: 'Bring the Goodness of Ayurveda Home',
    titleHighlight: 'Ayurveda Home',
    subtitle:
      "Find Ayurvedic essentials for your family's everyday wellness needs.",
    imageUrl: '/banners/hero-essentials.webp',
    imageAlt: 'Collection of Ayurvedic wellness essentials with jars, bottles, herbs and powders',
    ctaText: 'Shop All Products',
    ctaLink: '/shop',
    secondaryCtaText: 'Browse Categories',
    secondaryCtaLink: '/#categories',
  },
];

/** Map an admin-managed Banner record to a hero slide. */
export function bannerToHeroSlide(banner: Banner): HeroSlide {
  // The seeded default banners reuse the presentation details (eyebrow,
  // gold headline highlight, descriptive photo alt) of their built-in
  // counterparts — matched by photograph so admin copy edits keep working.
  const builtIn = DEFAULT_HERO_SLIDES.find((slide) => slide.imageUrl === banner.imageUrl);
  return {
    id: banner.id,
    eyebrow: builtIn?.eyebrow ?? DEFAULT_HERO_EYEBROW,
    title: banner.title,
    titleHighlight: builtIn?.titleHighlight,
    subtitle: banner.subtitle || 'Explore our Ayurvedic wellness catalogue.',
    imageUrl: banner.imageUrl,
    mobileImgUrl: banner.mobileImgUrl,
    imageAlt: builtIn?.imageAlt ?? `${banner.title} — Ayurvedic collection`,
    ctaText: banner.ctaText || banner.buttonText || 'Shop Now',
    ctaLink: banner.ctaLink || banner.linkUrl || '/shop',
    secondaryCtaText: banner.secondaryCtaText || undefined,
    secondaryCtaLink: banner.secondaryCtaLink || undefined,
  };
}

/** Active banners win; otherwise fall back to the built-in default slides. */
export function toHeroSlides(banners: Banner[]): HeroSlide[] {
  return banners.length > 0 ? banners.map(bannerToHeroSlide) : DEFAULT_HERO_SLIDES;
}
