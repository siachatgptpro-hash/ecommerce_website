import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { CategorySchema } from '@/schemas';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ConflictError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, PermissionKey.MANAGE_PRODUCTS);
    const categories = await ProductRepository.listCategories(false);
    const withCounts = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        productCount: await ProductRepository.countProductsByCategory(category.id),
      }))
    );
    return NextResponse.json({ success: true, data: { categories: withCounts } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, PermissionKey.MANAGE_PRODUCTS);
    const json = await req.json();
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new ValidationError('Category payload must be a JSON object');
    }
    const payload = CategorySchema.parse(json);

    const existing = await ProductRepository.findCategoryBySlug(payload.slug);
    if (existing) {
      throw new ConflictError(`A category with slug "${payload.slug}" already exists.`);
    }
    if (payload.parentId) {
      const parent = await ProductRepository.findCategoryById(payload.parentId);
      if (!parent) {
        throw new ValidationError('Parent category was not found.');
      }
    }

    const category = await ProductRepository.createCategory({
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      imageUrl: payload.imageUrl ? payload.imageUrl : null,
      parentId: payload.parentId ?? null,
      displayOrder: payload.displayOrder,
      isActive: payload.isActive,
      metaTitle: payload.metaTitle ?? null,
      metaDescription: payload.metaDescription ?? null,
    });

    await AuditRepository.log(
      'CATEGORY_CREATED',
      'Category',
      category.id,
      admin.userId,
      admin.email,
      null,
      { name: category.name, slug: category.slug, isActive: category.isActive }
    );

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
