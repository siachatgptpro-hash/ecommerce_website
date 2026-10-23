'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Banner, PolicySection, StaticPage } from '@/types';
import { POLICY_ICON_OPTIONS } from '@/lib/policy-icons';
import { ImageIcon, Plus, CheckCircle2, XCircle, Trash2, Edit2, AlertCircle, UploadCloud, X, FileText, ArrowUp, ArrowDown } from 'lucide-react';

const POLICY_LAYOUTS = [
  { value: 'prose', label: 'Plain text (paragraphs)' },
  { value: 'list', label: 'Icon list (e.g. Shipping, Privacy)' },
  { value: 'grid', label: 'Card grid (e.g. Terms, Disclaimer)' },
  { value: 'cards', label: 'Three cards + assistance panel (e.g. Returns)' },
  { value: 'accordion', label: 'Accordion (e.g. FAQ)' },
] as const;

/** Best-effort conversion of plain page text into structured sections. */
function parseContentToSections(text: string): PolicySection[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.length > 1 && lines[0].length <= 90) {
        return { icon: 'FileText', heading: lines[0], body: lines.slice(1).join('\n') };
      }
      return { icon: 'FileText', heading: `Section ${index + 1}`, body: lines.join('\n') };
    });
}

export default function AdminCmsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Explore Formulations');
  const [ctaLink, setCtaLink] = useState('/shop');
  const [secondaryCtaText, setSecondaryCtaText] = useState('');
  const [secondaryCtaLink, setSecondaryCtaLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [slot, setSlot] = useState('HERO_PRIMARY');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  // Policy & static pages state
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPageSlug, setEditingPageSlug] = useState<string | null>(null);
  const [pageSlug, setPageSlug] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageMetaTitle, setPageMetaTitle] = useState('');
  const [pageMetaDescription, setPageMetaDescription] = useState('');
  const [pageError, setPageError] = useState('');
  const [pageSubmitting, setPageSubmitting] = useState(false);
  const [pageLayout, setPageLayout] = useState<string>('prose');
  const [pageSections, setPageSections] = useState<PolicySection[]>([]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/cms/banners');
      const data = await res.json();
      if (data.success && data.data) {
        setBanners(data.data.banners || []);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/cms');
      const data = await res.json();
      if (data.success && data.data) {
        setPages(data.data.pages || []);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchPages();
  }, []);

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.imageUrl);
    setCtaText(banner.ctaText || banner.buttonText || 'Explore');
    setCtaLink(banner.ctaLink || banner.linkUrl || '/shop');
    setSecondaryCtaText(banner.secondaryCtaText || '');
    setSecondaryCtaLink(banner.secondaryCtaLink || '');
    setSlot(banner.slot || 'HERO_PRIMARY');
    setIsActive(banner.isActive);
    setSortOrder(banner.sortOrder || 0);
    setShowModal(true);
  };

  const handleBannerUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrorMsg('Banner must be a JPG, PNG, or WEBP image up to 5 MB.');
      return;
    }
    setImageUploading(true); setErrorMsg('');
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/admin/uploads', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Banner upload failed.');
      setImageUrl(result.data.url);
    } catch (error: any) { setErrorMsg(error.message || 'Banner upload failed.'); }
    finally { setImageUploading(false); }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErrorMsg('Banner title is required.');
    if (!imageUrl.trim()) return setErrorMsg('Please upload a banner image.');
    if (imageUploading) return setErrorMsg('Please wait for the banner upload to finish.');

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(editingId ? `/api/admin/cms/banners/${editingId}` : '/api/admin/cms/banners', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          ctaLink: ctaLink.trim() || '/shop',
          secondaryCtaText: secondaryCtaText.trim() || null,
          secondaryCtaLink: secondaryCtaLink.trim() || null,
          imageUrl: imageUrl.trim(),
          slot,
          isActive,
          sortOrder: Number(sortOrder),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create banner');
      }

      await fetchBanners();
      setShowModal(false);
      setEditingId(null);
      setTitle('');
      setSubtitle('');
      setSecondaryCtaText('');
      setSecondaryCtaLink('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving banner');
    } finally {
      setSubmitting(false);
    }
  };

  const openPageEdit = (page?: StaticPage) => {
    setEditingPageSlug(page?.slug || null);
    setPageSlug(page?.slug || '');
    setPageTitle(page?.title || '');
    setPageContent(page?.content || '');
    setPageMetaTitle(page?.metaTitle || '');
    setPageMetaDescription(page?.metaDescription || '');
    setPageLayout(page?.layout || 'prose');
    setPageSections(
      (page?.sections || []).map((section) => ({
        icon: section.icon || 'FileText',
        heading: section.heading || '',
        body: section.body || '',
      }))
    );
    setPageError('');
    setShowPageModal(true);
  };

  const handleLayoutChange = (value: string) => {
    setPageLayout(value);
    // First switch to a structured layout: pre-fill sections from the text.
    if (value !== 'prose' && pageSections.length === 0 && pageContent.trim()) {
      setPageSections(parseContentToSections(pageContent));
    }
  };

  const updateSection = (index: number, field: keyof PolicySection, value: string) => {
    setPageSections((prev) => prev.map((section, i) => (i === index ? { ...section, [field]: value } : section)));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setPageSections((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeSection = (index: number) => {
    setPageSections((prev) => prev.filter((_, i) => i !== index));
  };

  const addSection = () => {
    setPageSections((prev) => [...prev, { icon: 'Leaf', heading: '', body: '' }]);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = pageSlug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      return setPageError('Slug must use lowercase letters, numbers and hyphens (e.g. disclaimer).');
    }
    if (!pageTitle.trim()) return setPageError('Page title is required.');
    const structured = pageLayout !== 'prose';
    const cleanSections = pageSections.map((section) => ({
      icon: section.icon || 'FileText',
      heading: section.heading.trim(),
      body: section.body.trim(),
    }));
    if (structured) {
      if (cleanSections.length === 0) return setPageError('Add at least one section, or switch the layout to plain text.');
      if (cleanSections.some((section) => !section.heading || !section.body)) {
        return setPageError('Every section needs a heading and text.');
      }
    } else if (!pageContent.trim()) {
      return setPageError('Page content is required.');
    }
    // Plain-text mirror stays in sync with the structured sections.
    const derivedContent = structured
      ? cleanSections.map((section) => `${section.heading}\n${section.body}`).join('\n\n')
      : pageContent.trim();

    setPageSubmitting(true);
    setPageError('');
    try {
      const res = await fetch('/api/admin/cms?type=page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: cleanSlug,
          title: pageTitle.trim(),
          content: derivedContent,
          layout: pageLayout,
          sections: structured ? cleanSections : null,
          metaTitle: pageMetaTitle.trim() || null,
          metaDescription: pageMetaDescription.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save page');
      }
      await fetchPages();
      setShowPageModal(false);
      setEditingPageSlug(null);
    } catch (err: any) {
      setPageError(err.message || 'Error saving page');
    } finally {
      setPageSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/admin/cms/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Delete banner error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            CMS & Storefront Banners
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage homepage visual merchandising, hero banners, and promotional CTAs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl border border-[#F3EFE6] overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div className="relative aspect-video w-full bg-[#FAF7F2]">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
              <div className="absolute top-3 left-3 bg-[#1B4332]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Slot: {b.slot}
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">{b.title}</h3>
                {b.subtitle && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{b.subtitle}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-[#1B4332] font-bold">
                  <span>CTA: &ldquo;{b.ctaText || 'Shop'}&rdquo; → {b.ctaLink}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Active On Homepage
                </span>
                <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg"
                  title="Edit banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  title="Delete banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Policy & Static Pages */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1B4332]" /> Policy &amp; Static Pages
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
              Every store policy page — Shipping, Returns, Privacy, Terms, Disclaimer and FAQ — is designed and edited here.
              Pages open under /policies/ on the store and appear automatically in the footer Trust &amp; Policies list.
            </p>
          </div>
          <button
            onClick={() => openPageEdit()}
            className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Page</span>
          </button>
        </div>

        {pages.length === 0 ? (
          <p className="text-xs text-gray-500">No static pages yet. Add your first page to list it in the footer.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pages.map((page) => (
              <li key={page.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{page.title}</p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    /policies/{page.slug} · Updated {new Date(page.updatedAt).toLocaleDateString()}
                    {page.layout && page.layout !== 'prose' ? ` · ${page.layout} layout` : ''}
                    {page.sections?.length ? ` · ${page.sections.length} sections` : ''}
                  </p>
                </div>
                <button
                  onClick={() => openPageEdit(page)}
                  className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg"
                  title="Edit page"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CREATE BANNER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6]">
            <h3 className="font-serif text-lg font-bold text-gray-900">{editingId ? 'Edit Homepage Banner' : 'Add Homepage Banner'}</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBanner} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Main Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Classical Rasayana & Awaleha Season"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Subtitle Description
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 100% handcrafted in copper vessels according to Charaka Samhita."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Banner Image *</label>
                <div className="rounded-2xl border-2 border-dashed border-gray-300 p-4 text-center hover:border-[#1B4332]">
                  {imageUrl ? <div className="relative mb-3"><Image src={imageUrl} alt="Banner preview" width={640} height={260} className="h-32 w-full rounded-xl object-cover" /><button type="button" onClick={() => setImageUrl('')} className="absolute right-2 top-2 rounded-full bg-white p-1 text-red-600" aria-label="Remove banner image"><X className="h-4 w-4" /></button></div> : <UploadCloud className="mx-auto h-8 w-8 text-[#1B4332]" />}
                  <p className="text-xs text-gray-500">JPG, PNG or WEBP · maximum 5 MB</p>
                  <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-bold text-white">{imageUploading ? 'Uploading...' : imageUrl ? 'Replace Image' : 'Choose Image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={imageUploading} onChange={(e) => { if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]); }} /></label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Secondary Button Label
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaText}
                    onChange={(e) => setSecondaryCtaText(e.target.value)}
                    placeholder="e.g. Explore Categories"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={secondaryCtaLink}
                    onChange={(e) => setSecondaryCtaLink(e.target.value)}
                    placeholder="e.g. /#categories"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Banner Slot</label><select value={slot} onChange={(e) => setSlot(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs"><option value="HERO_PRIMARY">Hero Primary</option><option value="HERO_SECONDARY">Hero Secondary</option><option value="PROMOTION">Promotion</option></select></div>
                <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Sort Order</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs" /></div>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active on storefront</label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAGE EDITOR MODAL */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-gray-900">{editingPageSlug ? 'Edit Page' : 'Add Page'}</h3>

            {pageError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pageError}</span>
              </div>
            )}

            <form onSubmit={handleSavePage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Page Slug *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingPageSlug)}
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  placeholder="e.g. disclaimer"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">Opens at /policies/{pageSlug || 'your-slug'} and is listed in the footer. The slug cannot be changed after creation.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. Disclaimer"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Page Layout
                </label>
                <select
                  value={pageLayout}
                  onChange={(e) => handleLayoutChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none bg-white"
                >
                  {POLICY_LAYOUTS.map((layout) => (
                    <option key={layout.value} value={layout.value}>{layout.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Structured layouts show icon sections on the store. In the three-cards layout, sections after the first three appear as full-width assistance panels.
                </p>
              </div>

              {pageLayout !== 'prose' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Sections ({pageLayout === 'accordion' ? 'question = heading, answer = text' : 'icon, heading, text'})
                    </label>
                    <button
                      type="button"
                      onClick={addSection}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#2D6A4F]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Section
                    </button>
                  </div>
                  {pageSections.length === 0 && (
                    <p className="text-[11px] text-gray-500">No sections yet. Add one, or write plain text below and re-select the layout to convert it.</p>
                  )}
                  {pageSections.map((section, index) => (
                    <div key={index} className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500">#{index + 1}</span>
                        <select
                          value={section.icon || 'FileText'}
                          onChange={(e) => updateSection(index, 'icon', e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs"
                          aria-label={`Section ${index + 1} icon`}
                        >
                          {POLICY_ICON_OPTIONS.map((option) => (
                            <option key={option.name} value={option.name}>{option.label}</option>
                          ))}
                        </select>
                        <div className="ml-auto flex items-center gap-1">
                          <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-gray-400 hover:text-[#1B4332] disabled:opacity-30" title="Move up" aria-label={`Move section ${index + 1} up`}>
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => moveSection(index, 1)} disabled={index === pageSections.length - 1} className="rounded-lg p-1.5 text-gray-400 hover:text-[#1B4332] disabled:opacity-30" title="Move down" aria-label={`Move section ${index + 1} down`}>
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => removeSection(index)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600" title="Remove section" aria-label={`Remove section ${index + 1}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={section.heading}
                        onChange={(e) => updateSection(index, 'heading', e.target.value)}
                        placeholder={pageLayout === 'accordion' ? 'e.g. How do I place an order?' : 'e.g. Delivery Charges'}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none"
                        aria-label={`Section ${index + 1} heading`}
                      />
                      <textarea
                        rows={3}
                        value={section.body}
                        onChange={(e) => updateSection(index, 'body', e.target.value)}
                        placeholder="Section text shown on the store."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs focus:outline-none"
                        aria-label={`Section ${index + 1} text`}
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-500">
                    Placeholders {'{{baseShippingFee}}'}, {'{{freeShippingThreshold}}'} and {'{{phone}}'} in headings or text are replaced with live settings values on the store.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  {pageLayout === 'prose' ? 'Content *' : 'Plain-Text Mirror (regenerated from sections on save)'}
                </label>
                <textarea
                  rows={pageLayout === 'prose' ? 10 : 5}
                  required={pageLayout === 'prose'}
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                  placeholder="Write the page content. Separate paragraphs with a blank line."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {pageLayout === 'prose'
                    ? <>Separate paragraphs with a blank line. Placeholders {'{{baseShippingFee}}'}, {'{{freeShippingThreshold}}'} and {'{{phone}}'} are replaced with live settings values.</>
                    : 'Shown only if sections are emptied. Saving with sections rebuilds this text automatically.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Meta Title (SEO)
                </label>
                <input
                  type="text"
                  value={pageMetaTitle}
                  onChange={(e) => setPageMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Meta Description (SEO)
                </label>
                <textarea
                  rows={2}
                  value={pageMetaDescription}
                  onChange={(e) => setPageMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pageSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  {pageSubmitting ? 'Saving...' : 'Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
