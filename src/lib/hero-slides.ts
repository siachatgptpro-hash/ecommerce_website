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

export const DEFAULT_HERO_EYEBROW = 'Tradition for a Healthier Tomorrow';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-personal-care',
    eyebrow: 'Personal Care Collection',
    title: 'Natural Personal Care for a Healthier You',
    titleHighlight: 'Healthier You',
    subtitle:
      'Gentle herbal personal care essentials from our Ayurvedic catalogue, made to fit your everyday routine.',
    imageUrl: '/banners/natural-care.jpg',
    imageAlt:
      'Ayurvedic personal care still life with aloe vera, herbal jars, roses and a mortar and pestle',
    ctaText: 'Shop Personal Care',
    ctaLink: '/category/personal-care',
    secondaryCtaText: 'Explore Categories',
    secondaryCtaLink: '/#categories',
  },
  {
    id: 'hero-daily-wellness',
    eyebrow: 'Immunity & Daily Wellness',
    title: 'Everyday Wellness, Rooted in Ayurveda',
    titleHighlight: 'Ayurveda',
    subtitle:
      'Classical Ayurvedic formulations for daily balance — clear pack sizes and printed prices on every product.',
    imageUrl: '/banners/daily-immunity.jpg',
    imageAlt: 'Family sharing herbal tea with amla, honey and ginger on the table',
    ctaText: 'Explore Wellness',
    ctaLink: '/category/immunity-rasayana',
    secondaryCtaText: 'Shop Bestsellers',
    secondaryCtaLink: '/shop',
  },
  {
    id: 'hero-herbal-oils',
    eyebrow: 'Classical Herbal Oils',
    title: 'Ancient Wisdom. Everyday Care.',
    titleHighlight: 'Everyday Care.',
    subtitle:
      'Traditional herbal oils and liniments for massage and everyday self-care, prepared the classical way.',
    imageUrl: '/banners/herbal-oils.jpg',
    imageAlt: 'Amber bottles of herbal oil beside a lit brass diya and fresh herbs',
    ctaText: 'Shop Herbal Oils',
    ctaLink: '/category/herbal-oils',
    secondaryCtaText: 'Discover More',
    secondaryCtaLink: '/about',
  },
  {
    id: 'hero-complete-catalogue',
    eyebrow: 'The Complete Catalogue',
    title: 'Bring the Goodness of Ayurveda Home',
    titleHighlight: 'Ayurveda',
    subtitle:
      'Syrups, juices, arks, oils, capsules and more — our complete Ayurvedic catalogue in one place.',
    imageUrl: '/banners/ayurvedic-wellness.jpg',
    imageAlt: 'Ayurvedic wellness essentials with dropper bottles, turmeric and amla',
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
