'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Category } from '@/types';
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Power,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type CategoryRow = Category & { productCount?: number };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const inputClasses =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332]';
const labelClasses = 'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const slugTouched = useRef(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success && data.data) {
        setCategories(data.data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setParentId('');
    setDisplayOrder(categories.length);
    setIsActive(true);
    setMetaTitle('');
    setMetaDescription('');
    slugTouched.current = false;
    setErrorMsg('');
    setShowModal(true);
  };

  const openEdit = (category: CategoryRow) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setImageUrl(category.imageUrl || '');
    setParentId(category.parentId || '');
    setDisplayOrder(category.displayOrder ?? 0);
    setIsActive(category.isActive);
    setMetaTitle(category.metaTitle || '');
    setMetaDescription(category.metaDescription || '');
    slugTouched.current = true;
    setErrorMsg('');
    setShowModal(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched.current) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErrorMsg('Category name is required.');
    if (!slug.trim()) return setErrorMsg('Slug is required.');

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || '',
      parentId: parentId || null,
      displayOrder: Number(displayOrder) || 0,
      isActive,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };

    try {
      const res = await fetch(editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not save the category. Please try again.');
      }
      setShowModal(false);
      setNotice(editingId ? `Category "${payload.name}" updated.` : `Category "${payload.name}" created. It is now live in the shop drawer and product forms.`);
      await fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save the category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category: CategoryRow) => {
    setNotice('');
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not update the category status.');
      }
      setNotice(`Category "${category.name}" ${category.isActive ? 'deactivated — hidden from the storefront.' : 'activated — visible on the storefront.'}`);
      await fetchCategories();
    } catch (err: any) {
      setNotice(err.message || 'Could not update the category status.');
    }
  };

  const handleDelete = async (category: CategoryRow) => {
    setNotice('');
    if ((category.productCount || 0) > 0) {
      setNotice(
        `"${category.name}" has ${category.productCount} product(s) and cannot be deleted. Reassign those products to another category first, or deactivate this category to hide it.`
      );
      return;
    }
    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not delete the category.');
      }
      setNotice(`Category "${category.name}" deleted.`);
      await fetchCategories();
    } catch (err: any) {
      setNotice(err.message || 'Could not delete the category.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-[#1B4332]" aria-hidden="true" />
            Categories
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
            Add, rename, reorder or hide catalogue categories. Every active category appears instantly in the
            storefront&apos;s Shop by Category drawer, shop filters and product forms. The homepage features a
            curated set of category cards.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-[#FAF7F2] border border-[#E3DCCB] rounded-xl text-[#1B4332] text-xs flex items-center gap-2" role="status">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No categories yet. Add your first one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Description</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[13px] text-gray-900">{category.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-gray-400">/category/{category.slug}</div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell max-w-[220px]">
                      <span className="line-clamp-2 text-gray-600">{category.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">{category.productCount ?? 0}</td>
                    <td className="py-3 px-4 text-gray-600">{category.displayOrder}</td>
                    <td className="py-3 px-4">
                      {category.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/category/${category.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg transition-colors"
                          title="View on storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg transition-colors"
                          title={category.isActive ? 'Deactivate (hide from storefront)' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(category)}
                          className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-gray-900">
              {editingId ? 'Edit Category' : 'Add Category'}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cat-name" className={labelClasses}>Category Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Chyawanprash & Avaleha"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="cat-slug" className={labelClasses}>URL Slug *</label>
                <input
                  id="cat-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="chyawanprash-avaleha"
                  className={`${inputClasses} font-mono`}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Storefront address: /category/{slug || 'your-slug'} — lowercase letters, numbers and hyphens only.
                </p>
              </div>

              <div>
                <label htmlFor="cat-description" className={labelClasses}>Description</label>
                <textarea
                  id="cat-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shown on the category page and shop filters"
                  rows={3}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cat-order" className={labelClasses}>Display Order</label>
                  <input
                    id="cat-order"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="cat-parent" className={labelClasses}>Parent Category</label>
                  <select
                    id="cat-parent"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">None (top level)</option>
                    {categories
                      .filter((c) => c.id !== editingId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cat-image" className={labelClasses}>Image URL</label>
                <input
                  id="cat-image"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/categories/your-image.webp or https://…"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cat-meta-title" className={labelClasses}>SEO Title</label>
                  <input
                    id="cat-meta-title"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Optional"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="cat-meta-description" className={labelClasses}>SEO Description</label>
                  <input
                    id="cat-meta-description"
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Optional"
                    className={inputClasses}
                  />
                </div>
              </div>

              <label htmlFor="cat-active" className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                <input
                  id="cat-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#1B4332]"
                />
                <span><strong>Active</strong> — visible on the storefront</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
