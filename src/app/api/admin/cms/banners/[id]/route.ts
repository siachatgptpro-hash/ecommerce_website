import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { BannerWriteSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const json = await req.json();
    const input = BannerWriteSchema.parse(json);
    const banner = await CMSRepository.updateBanner(params.id, {
      title: input.title,
      subtitle: input.subtitle || null,
      imageUrl: input.imageUrl,
      linkUrl: input.ctaLink || input.linkUrl || '/shop',
      buttonText: input.ctaText || input.buttonText || 'Explore',
      secondaryCtaText: input.secondaryCtaText || null,
      secondaryCtaLink: input.secondaryCtaLink || null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
    });
    return NextResponse.json({ success: Boolean(banner), data: banner });
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
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const success = await CMSRepository.deleteBanner(params.id);

    return NextResponse.json({
      success,
      data: { id: params.id },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
