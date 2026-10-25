import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateAdmin } from '@/lib/admin-auth';
import { BlogPostSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ConflictError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const posts = await CMSRepository.listBlogPosts(false);
    return NextResponse.json({ success: true, data: { posts } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const json = await req.json();
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new ValidationError('Blog post payload must be a JSON object');
    }
    const payload = BlogPostSchema.parse(json);

    const existing = await CMSRepository.findBlogPostBySlug(payload.slug);
    if (existing) {
      throw new ConflictError(`A blog post with slug "${payload.slug}" already exists.`);
    }

    const post = await CMSRepository.createBlogPost({
      title: payload.title,
      slug: payload.slug,
      summary: payload.summary ?? null,
      content: payload.content,
      featuredImg: payload.featuredImg ? payload.featuredImg : null,
      authorName: payload.authorName,
      readTimeMinutes: payload.readTimeMinutes,
      isPublished: payload.isPublished,
      metaTitle: payload.metaTitle ?? null,
      metaDescription: payload.metaDescription ?? null,
    });

    await AuditRepository.log(
      'BLOG_POST_CREATED',
      'BlogPost',
      post.id,
      admin.userId,
      admin.email,
      null,
      { title: post.title, slug: post.slug, isPublished: post.isPublished }
    );

    // Public blog pages are ISR-cached — publish changes immediately.
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
