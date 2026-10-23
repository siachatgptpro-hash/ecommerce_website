import { NextResponse } from 'next/server';
import { getPolicyLinks } from '@/lib/policies';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/policies — ordered Trust & Policies links for the footer:
 * settings-backed policies plus admin-managed CMS static pages.
 */
export async function GET() {
  try {
    const links = await getPolicyLinks();
    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
