import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/admin-auth';
import { BlogPostSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ConflictError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function notFound() {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Blog post not found' } },
    { status: 404 }
  );
}

async function findById(id: string) {
  return CMSRepository.findBlogPostById(id);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const post = await findById(params.id);
    if (!post) return notFound();
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const json = await req.json();
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new ValidationError('Blog post update payload must be a JSON object');
    }

    const previous = await findById(params.id);
    if (!previous) return notFound();

    const parsed = BlogPostSchema.partial().parse(json);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined && key !== 'categoryIds') updates[key] = value;
    }
    if (updates.featuredImg === '') updates.featuredImg = null;
    if (!Object.keys(updates).length) {
      throw new ValidationError('No blog post fields to update.');
    }

    if (typeof updates.slug === 'string' && updates.slug !== previous.slug) {
      const clash = await CMSRepository.findBlogPostBySlug(updates.slug);
      if (clash && clash.id !== params.id) {
        throw new ConflictError(`A blog post with slug "${updates.slug}" already exists.`);
      }
    }

    const post = await CMSRepository.updateBlogPost(params.id, updates);
    if (!post) return notFound();

    await AuditRepository.log(
      'BLOG_POST_UPDATED',
      'BlogPost',
      params.id,
      admin.userId,
      admin.email,
      { title: previous.title, slug: previous.slug, isPublished: previous.isPublished },
      { title: post.title, slug: post.slug, isPublished: post.isPublished }
    );

    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);
    if (previous.slug !== post.slug) revalidatePath(`/blog/${previous.slug}`);

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const previous = await findById(params.id);
    if (!previous) return notFound();

    const success = await CMSRepository.deleteBlogPost(params.id);

    await AuditRepository.log(
      'BLOG_POST_DELETED',
      'BlogPost',
      params.id,
      admin.userId,
      admin.email,
      { title: previous.title, slug: previous.slug },
      null
    );

    if (success) {
      revalidatePath('/blog');
      revalidatePath(`/blog/${previous.slug}`);
    }

    return NextResponse.json({ success, data: { id: params.id } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
