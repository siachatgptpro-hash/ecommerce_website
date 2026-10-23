import type { BlogPost } from '@/types';

/** Decorative botanical still-life used when a post has no featured image. */
export const BLOG_COVER_FALLBACK = '/banners/highlights-botanical-bg.webp';

export function blogCover(post: Pick<BlogPost, 'featuredImg' | 'coverImage'>): string {
  return post.featuredImg || post.coverImage || BLOG_COVER_FALLBACK;
}

export function blogExcerpt(post: Pick<BlogPost, 'summary' | 'excerpt' | 'content'>, maxLength = 170): string {
  const source = (post.summary || post.excerpt || post.content || '').replace(/^#+\s*/gm, '').trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trimEnd()}…`;
}

export function formatBlogDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
