import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { BannerSchema, BlogPostSchema, StaticPageSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const banners = await CMSRepository.listBanners(false);
    const sections = await CMSRepository.listHomepageSections();
    const testimonials = await CMSRepository.listTestimonials(false);
    const faqs = await CMSRepository.listFaqs(undefined, false);
    const blogs = await CMSRepository.listBlogPosts(false);
    const pages = await CMSRepository.listStaticPages();

    return NextResponse.json({
      success: true,
      data: { banners, sections, testimonials, faqs, blogs, pages },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'banner';
    const json = await req.json();

    let created: any;
    if (type === 'banner') {
      const payload = BannerSchema.parse(json);
      created = await CMSRepository.createBanner(payload);
    } else if (type === 'blog') {
      const payload = BlogPostSchema.parse(json);
      created = await CMSRepository.createBlogPost(payload);
    } else if (type === 'page') {
      // Static/policy pages: upsert by slug (creates or updates). Saved pages
      // are served at /policies/<slug> and listed in the footer automatically.
      const payload = StaticPageSchema.parse(json);
      if (!payload.content?.trim() && !(payload.sections && payload.sections.length)) {
        throw new ValidationError('Page content is required — add plain text or at least one section.');
      }
      created = await CMSRepository.updateStaticPage(payload.slug, {
        title: payload.title,
        content: payload.content,
        layout: payload.layout ?? null,
        sections: payload.sections ?? null,
        metaTitle: payload.metaTitle ?? null,
        metaDescription: payload.metaDescription ?? null,
      });
    } else {
      // Previously fell through and returned 201 with `data: undefined`.
      throw new ValidationError(`Unsupported CMS content type: ${type}`);
    }

    await AuditRepository.log(
      `CMS_${type.toUpperCase()}_CREATED`,
      type,
      created?.id || null,
      admin.userId,
      admin.email,
      null,
      created
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
