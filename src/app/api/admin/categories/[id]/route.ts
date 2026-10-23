import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { CategorySchema } from '@/schemas';
import { ProductRepository } from '@/repositories/product.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { ConflictError, ValidationError, handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function notFound() {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
    { status: 404 }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);
    const category = await ProductRepository.findCategoryById(params.id);
    if (!category) return notFound();
    const productCount = await ProductRepository.countProductsByCategory(category.id);
    return NextResponse.json({ success: true, data: { ...category, productCount } });
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
      throw new ValidationError('Category update payload must be a JSON object');
    }

    const previous = await ProductRepository.findCategoryById(params.id);
    if (!previous) return notFound();

    const parsed = CategorySchema.partial().parse(json);
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) updates[key] = value;
    }
    if (updates.imageUrl === '') updates.imageUrl = null;
    if (!Object.keys(updates).length) {
      throw new ValidationError('No category fields to update.');
    }

    if (typeof updates.slug === 'string' && updates.slug !== previous.slug) {
      const clash = await ProductRepository.findCategoryBySlug(updates.slug);
      if (clash && clash.id !== params.id) {
        throw new ConflictError(`A category with slug "${updates.slug}" already exists.`);
      }
    }
    if (updates.parentId !== undefined && updates.parentId !== null) {
      if (updates.parentId === params.id) {
        throw new ValidationError('A category cannot be its own parent.');
      }
      const parent = await ProductRepository.findCategoryById(updates.parentId as string);
      if (!parent) {
        throw new ValidationError('Parent category was not found.');
      }
    }

    const category = await ProductRepository.updateCategory(params.id, updates);
    if (!category) return notFound();

    await AuditRepository.log(
      'CATEGORY_UPDATED',
      'Category',
      params.id,
      admin.userId,
      admin.email,
      { name: previous.name, slug: previous.slug, isActive: previous.isActive, displayOrder: previous.displayOrder },
      { name: category.name, slug: category.slug, isActive: category.isActive, displayOrder: category.displayOrder }
    );

    return NextResponse.json({ success: true, data: category });
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
    const previous = await ProductRepository.findCategoryById(params.id);
    if (!previous) return notFound();

    // Products reference their category with a restrictive foreign key, so a
    // category that still holds products must never be hard-deleted.
    const productCount = await ProductRepository.countProductsByCategory(params.id);
    if (productCount > 0) {
      throw new ConflictError(
        `"${previous.name}" still has ${productCount} product(s). Reassign them to another category first, or deactivate this category instead.`
      );
    }

    const success = await ProductRepository.deleteCategory(params.id);

    await AuditRepository.log(
      'CATEGORY_DELETED',
      'Category',
      params.id,
      admin.userId,
      admin.email,
      { name: previous.name, slug: previous.slug },
      null
    );

    return NextResponse.json({ success, data: { id: params.id } });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
