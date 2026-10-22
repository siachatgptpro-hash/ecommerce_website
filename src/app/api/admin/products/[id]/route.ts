import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const product = await ProductRepository.findProductById(params.id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
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
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const json = await req.json();
    const previousProduct = await ProductRepository.findProductById(params.id);

    const product = await ProductRepository.updateProduct(
      params.id,
      json,
      json.variants,
      Array.isArray(json.images) && json.images.length > 0 ? json.images : undefined
    );

    await AuditRepository.log(
      'PRODUCT_UPDATED',
      'Product',
      params.id,
      admin.userId,
      admin.email,
      previousProduct ? { variants: previousProduct.variants, isActive: previousProduct.isActive } : null,
      product ? { variants: product.variants, isActive: product.isActive } : json
    );

    return NextResponse.json({ success: true, data: product });
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
    const admin = await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const success = await ProductRepository.deleteProduct(params.id);

    if (success) {
      await AuditRepository.log(
        'PRODUCT_DELETED',
        'Product',
        params.id,
        admin.userId,
        admin.email
      );
    }

    return NextResponse.json({ success, data: { id: params.id } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
