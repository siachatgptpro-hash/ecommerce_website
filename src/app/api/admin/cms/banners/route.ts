import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { BannerWriteSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const banners = await CMSRepository.listBanners(false);
    return NextResponse.json({
      success: true,
      data: { banners },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const json = await req.json();
    const input = BannerWriteSchema.parse(json);

    const banner = await CMSRepository.createBanner({
      title: input.title,
      subtitle: input.subtitle || null,
      imageUrl: input.imageUrl,
      mobileImgUrl: input.mobileImgUrl || null,
      linkUrl: input.ctaLink || input.linkUrl || '/shop',
      buttonText: input.ctaText || input.buttonText || 'Explore',
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
      slot: input.slot || 'HERO_PRIMARY',
      ctaText: input.ctaText,
      ctaLink: input.ctaLink,
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
