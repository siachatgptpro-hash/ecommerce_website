import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { ReviewModerationSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_REVIEWS);
    const json = await req.json();
    const payload = ReviewModerationSchema.parse(json);

    const review = await CMSRepository.moderateReview(
      params.id,
      payload.isApproved,
      payload.adminReply
    );

    return NextResponse.json({
      success: true,
      data: review,
    });
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
    await requireAdminPermission(req, PermissionKey.MANAGE_REVIEWS);
    const success = await CMSRepository.deleteReview(params.id);

    return NextResponse.json({
      success,
      data: { id: params.id },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
