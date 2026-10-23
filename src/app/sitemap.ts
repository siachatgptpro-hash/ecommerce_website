import { MetadataRoute } from 'next';
import { ProductRepository } from '@/repositories/product.repository';
import { getPolicyLinks } from '@/lib/policies';
import { CMSRepository } from '@/repositories/cms.repository';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (!baseUrl) return [];
  const siteUrl = baseUrl.replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  // Every Trust & Policies page (built-ins + admin-managed CMS pages such
  // as Disclaimer and FAQ) from the same source the footer renders.
  const policyLinks = await getPolicyLinks();
  const policyRoutes: MetadataRoute.Sitemap = policyLinks.map((policy) => ({
    url: `${siteUrl}/policies/${policy.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const categories = await ProductRepository.listCategories(true);
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: new Date(cat.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const products = await ProductRepository.listProducts({ limit: 500 });
  const productRoutes: MetadataRoute.Sitemap = products.products.map((prod) => ({
    url: `${siteUrl}/product/${prod.slug}`,
    lastModified: new Date(prod.updatedAt),
    changeFrequency: 'daily',
    priority: 0.95,
  }));

  // Published journal articles (drafts stay out — their pages 404 publicly).
  const posts = await CMSRepository.listBlogPosts(true);
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...policyRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
