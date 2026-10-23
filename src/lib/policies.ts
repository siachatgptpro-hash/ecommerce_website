import { CMSRepository } from '@/repositories/cms.repository';

export interface PolicyLink {
  slug: string;
  title: string;
}

/**
 * Policies whose text lives in Business Settings (Admin -> Settings) and is
 * rendered by /policies/[slug]. Always present, in footer display order.
 */
export const BUILT_IN_POLICY_LINKS: PolicyLink[] = [
  { slug: 'shipping-policy', title: 'Shipping & Delivery Policy' },
  { slug: 'refund-policy', title: 'Return & Refund Policy' },
  { slug: 'privacy-policy', title: 'Privacy Policy' },
  { slug: 'terms-and-conditions', title: 'Terms & Conditions' },
];

/** Slugs already handled by the built-in policies page (never duplicated). */
const BUILT_IN_SLUGS = new Set([
  ...BUILT_IN_POLICY_LINKS.map((policy) => policy.slug),
  'ayush-compliance',
]);

/** Preferred order for well-known admin-managed pages in the footer list. */
const PREFERRED_ORDER = ['disclaimer', 'faq'];

/**
 * Footer "Trust & Policies" list: the settings-backed policies first, then
 * every CMS static page managed in Admin -> CMS (each is served at
 * /policies/<slug>). Adding/renaming a page in the admin panel updates the
 * footer automatically — no code change needed.
 */
export async function getPolicyLinks(): Promise<PolicyLink[]> {
  const pages = await CMSRepository.listStaticPages();
  const extras = pages
    .filter((page) => page.slug && page.title && !BUILT_IN_SLUGS.has(page.slug.toLowerCase()))
    .map((page) => ({ slug: page.slug.toLowerCase(), title: page.title }))
    .sort((a, b) => {
      const aIndex = PREFERRED_ORDER.indexOf(a.slug);
      const bIndex = PREFERRED_ORDER.indexOf(b.slug);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      }
      return a.title.localeCompare(b.title);
    });
  return [...BUILT_IN_POLICY_LINKS, ...extras];
}
