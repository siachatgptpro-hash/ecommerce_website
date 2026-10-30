import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/admin-auth';
import { ProductImageInputSchema, ProductVariantInputSchema } from '@/schemas';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ValidationError, handleApiError } from '@/lib/errors';

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
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new ValidationError('Product update payload must be a JSON object');
    }
    // Variant/image rows are validated so malformed numbers (NaN prices or
    // stock) can never be persisted. Product fields are allow-listed by the
    // repository in both data modes.
    const variants = json.variants !== undefined ? z.array(ProductVariantInputSchema).parse(json.variants) : undefined;
    const images = json.images !== undefined ? z.array(ProductImageInputSchema).parse(json.images) : undefined;
    const previousProduct = await ProductRepository.findProductById(params.id);
    if (!previousProduct) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const product = await ProductRepository.updateProduct(
      params.id,
      json,
      variants,
      images && images.length > 0 ? images : undefined
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

    // Refresh ISR-cached storefront pages that render this product.
    revalidatePath('/');
    if (product?.slug) revalidatePath(`/product/${product.slug}`);
    if (previousProduct?.slug && previousProduct.slug !== product?.slug) {
      revalidatePath(`/product/${previousProduct.slug}`);
    }

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
    // Default: soft delete (hide from store, restorable). With
    // ?permanent=true the product and its own records are removed for
    // good; the repository refuses when customer orders reference it.
    const permanent = req.nextUrl.searchParams.get('permanent') === 'true';
    const previousProduct = await ProductRepository.findProductById(params.id);

    if (permanent) {
      if (!previousProduct) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
          { status: 404 }
        );
      }
      const success = await ProductRepository.permanentlyDeleteProduct(params.id);
      if (success) {
        await AuditRepository.log(
          'PRODUCT_PERMANENTLY_DELETED',
          'Product',
          params.id,
          admin.userId,
          admin.email,
          { name: previousProduct.name, slug: previousProduct.slug },
          null
        );
        revalidatePath('/');
        revalidatePath(`/product/${previousProduct.slug}`);
      }
      return NextResponse.json({ success, data: { id: params.id } });
    }

    const success = await ProductRepository.deleteProduct(params.id);

    if (success) {
      await AuditRepository.log(
        'PRODUCT_DELETED',
        'Product',
        params.id,
        admin.userId,
        admin.email
      );
      revalidatePath('/');
      if (previousProduct?.slug) revalidatePath(`/product/${previousProduct.slug}`);
    }

    return NextResponse.json({ success, data: { id: params.id } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
