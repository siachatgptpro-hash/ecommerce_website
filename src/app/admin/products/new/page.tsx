import React from 'react';
import { requireAdminPage } from '@/lib/admin-page-auth';
import { productRepository } from '@/repositories/product.repository';
import { ProductForm } from '@/components/admin/ProductForm';

export const revalidate = 0;

export default async function NewProductPage() {
  await requireAdminPage();

  const categories = await productRepository.getAllCategories();
  return <ProductForm categories={categories} />;
}
