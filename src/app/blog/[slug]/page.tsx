import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Clock } from 'lucide-react';
import { CMSRepository } from '@/repositories/cms.repository';
import { blogCover, blogExcerpt, formatBlogDate } from '@/lib/blog-utils';
import { generateArticleJsonLd } from '@/lib/seo';

export const revalidate = 60;

interface BlogPostPageProps {
  params: { slug: string };
}

/** Renders admin-written plain text safely: blank lines split paragraphs,
 *  lines starting with "## " become section headings. No HTML is injected. */
function renderContent(content: string) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={index} className="mt-9 font-serif text-[22px] font-bold leading-snug text-[#123D2D] first:mt-0">
          {block.replace(/^##\s+/, '')}
        </h2>
      );
    }
    if (block.startsWith('# ')) {
      return (
        <h2 key={index} className="mt-9 font-serif text-[22px] font-bold leading-snug text-[#123D2D] first:mt-0">
          {block.replace(/^#\s+/, '')}
        </h2>
      );
    }
    return (
      <p key={index} className="mt-5 whitespace-pre-line text-[15.5px] leading-[1.85] text-[#33413A] first:mt-0">
        {block}
      </p>
    );
  });
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await CMSRepository.findBlogPostBySlug(params.slug);
  if (!post || !post.isPublished) return {};
  const description = post.metaDescription || post.summary || blogExcerpt(post, 160);
  const cover = blogCover(post);
  return {
    title: post.metaTitle || `${post.title} | Shlokveda Blog`,
    description: description || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle || post.title,
      description: description || undefined,
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await CMSRepository.findBlogPostBySlug(params.slug);
  if (!post || !post.isPublished) notFound();

  const allPublished = await CMSRepository.listBlogPosts(true);
  const related = allPublished.filter((item) => item.id !== post.id).slice(0, 3);
  const cover = blogCover(post);

  return (
    <div className="bg-[#FAF7F2]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateArticleJsonLd(post)) }}
      />

      {/* Article header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#123D2D] via-[#123D2D] to-[#0B5138]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-12 h-52 w-52 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:0%_0%] bg-no-repeat opacity-40 [mask-image:radial-gradient(ellipse_85%_85%_at_12%_10%,black_38%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:100%_0%] bg-no-repeat opacity-30 [mask-image:radial-gradient(ellipse_85%_85%_at_88%_10%,black_38%,transparent_72%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white/70">
            <Link href="/" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A] rounded">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href="/blog" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A] rounded">Blog</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span aria-current="page" className="max-w-[220px] truncate text-[#E9D9AE] sm:max-w-xs">{post.title}</span>
          </nav>

          <h1 className="mt-6 font-serif text-3xl font-bold leading-[1.2] text-white sm:text-[40px] sm:leading-[1.18]">
            {post.title}
          </h1>
          {(post.summary || post.excerpt) && (
            <p className="mt-4 text-[15px] leading-relaxed text-white/75">{post.summary || post.excerpt}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-white/80">
            <span>By {post.authorName}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-[#C9A46A]" aria-hidden="true" />
              {formatBlogDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C9A46A]" aria-hidden="true" />
              {post.readTimeMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Plain img: covers may be admin-pasted external URLs (optimizer is off). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt=""
          loading="eager"
          decoding="async"
          className="relative z-10 -mt-2 aspect-[16/8] w-full rounded-[1.75rem] object-cover shadow-[0_28px_50px_-28px_rgba(18,61,45,0.5)] ring-1 ring-[#F3EFE6] sm:aspect-[16/7]"
        />
        <div className="py-10 sm:py-12">{renderContent(post.content)}</div>

        <div className="border-t border-[#E7E2D2] pb-12 pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] font-bold text-[#1B4332] transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all articles
          </Link>
        </div>
      </article>

      {/* More from the journal */}
      {related.length > 0 && (
        <section aria-labelledby="more-articles" className="border-t border-[#F3EFE6] bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#A67C2E]">Keep reading</p>
                <h2 id="more-articles" className="mt-2 font-serif text-2xl font-bold text-[#123D2D] sm:text-3xl">
                  More from the journal
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1B4332] transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded"
              >
                View all articles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#F3EFE6] bg-white shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(18,61,45,0.35)]"
                >
                  <Link href={`/blog/${item.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-inset" aria-label={item.title}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={blogCover(item)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-luxe motion-safe:group-hover:scale-[1.04]"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A67C2E]">
                      {formatBlogDate(item.publishedAt || item.createdAt)}
                    </p>
                    <h3 className="mt-2.5 font-serif text-lg font-bold leading-snug text-[#123D2D]">
                      <Link href={`/blog/${item.slug}`} className="transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-2">
                      {blogExcerpt(item, 130)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
