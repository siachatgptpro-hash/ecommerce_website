import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
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
    const banner = await CMSRepository.updateBanner(params.id, {
      title: json.title,
      subtitle: json.subtitle || null,
      imageUrl: json.imageUrl,
      linkUrl: json.ctaLink || json.linkUrl || '/shop',
      buttonText: json.ctaText || json.buttonText || 'Explore',
      sortOrder: Number(json.sortOrder ?? 0),
      isActive: json.isActive !== undefined ? Boolean(json.isActive) : true,
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
