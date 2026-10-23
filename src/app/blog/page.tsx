import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, Leaf } from 'lucide-react';
import { CMSRepository } from '@/repositories/cms.repository';
import { blogCover, blogExcerpt, formatBlogDate } from '@/lib/blog-utils';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog | Shlokveda',
  description:
    'Notes on Ayurvedic herbs, classical formulations and everyday wellness from the Shlokveda journal.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog | Shlokveda',
    description:
      'Notes on Ayurvedic herbs, classical formulations and everyday wellness from the Shlokveda journal.',
    type: 'website',
  },
};

export default async function BlogIndexPage() {
  const posts = await CMSRepository.listBlogPosts(true);

  return (
    <div className="bg-[#FAF7F2]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#123D2D] via-[#123D2D] to-[#0B5138]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-12 h-56 w-56 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:0%_0%] bg-no-repeat opacity-45 [mask-image:radial-gradient(ellipse_85%_85%_at_12%_10%,black_38%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-14 h-56 w-56 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:100%_0%] bg-no-repeat opacity-35 [mask-image:radial-gradient(ellipse_85%_85%_at_88%_10%,black_38%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(201,164,106,0.16),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#C9A46A]">Shlokveda Journal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">The Ayurveda Blog</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Notes on herbs, classical formulations and everyday wellness — written to help you
            shop the catalogue with confidence.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-[2rem] border border-[#F3EFE6] bg-white px-6 py-14 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#F0F1E5] text-[#0B5138]"
            >
              <Leaf className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-serif text-2xl font-bold text-[#123D2D]">Articles are on the way</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              We are preparing notes on Ayurvedic herbs and daily wellness. Meanwhile, explore
              the catalogue of classical formulations.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1B4332] px-6 py-3 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2"
            >
              Browse Catalogue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-[#F3EFE6] bg-white shadow-sm transition-all duration-[var(--dur-ui)] ease-luxe hover:-translate-y-1 hover:shadow-[0_24px_44px_-24px_rgba(18,61,45,0.35)] motion-safe:animate-[rise-in_.5s_cubic-bezier(.22,1,.36,1)_both]"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <Link href={`/blog/${post.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-inset" aria-label={post.title}>
                  {/* Plain img: covers may be admin-pasted external URLs (optimizer is off). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={blogCover(post)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-luxe motion-safe:group-hover:scale-[1.04]"
                  />
                </Link>
                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase tracking-wider text-[#A67C2E]">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatBlogDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-gray-500">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {post.readTimeMinutes} min read
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-xl font-bold leading-snug text-[#123D2D]">
                    <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
                    {blogExcerpt(post)}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F3EFE6] pt-4">
                    <span className="truncate text-xs font-semibold text-gray-500">{post.authorName}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-[#1B4332] transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] rounded"
                      aria-label={`Read article: ${post.title}`}
                    >
                      Read article
                      <ArrowRight className="h-4 w-4 transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
