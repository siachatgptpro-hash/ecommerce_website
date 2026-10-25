import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/repositories/product.repository';
import { handleApiError } from '@/lib/errors';

// The catalogue is admin-managed, so this list must be read from the
// database on every request. Without force-dynamic, Next.js prerenders
// GET route handlers at build time — categories added later in Admin
// then never reach the "Shop by Category" drawer until a redeploy.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const categories = await ProductRepository.listCategories(true);
    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
