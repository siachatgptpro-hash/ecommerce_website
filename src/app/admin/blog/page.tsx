'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BlogPost } from '@/types';
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputClasses =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332]';
const labelClasses = 'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [featuredImg, setFeaturedImg] = useState('');
  const [authorName, setAuthorName] = useState('Shlokveda Ayurvedic Expert');
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const slugTouched = useRef(false);
  const readTimeTouched = useRef(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      if (data.success && data.data) {
        setPosts(data.data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setContent('');
    setFeaturedImg('');
    setAuthorName('Shlokveda Ayurvedic Expert');
    setReadTimeMinutes(5);
    setIsPublished(false);
    setMetaTitle('');
    setMetaDescription('');
    slugTouched.current = false;
    readTimeTouched.current = false;
    setErrorMsg('');
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setSummary(post.summary || '');
    setContent(post.content);
    setFeaturedImg(post.featuredImg || '');
    setAuthorName(post.authorName || 'Shlokveda Ayurvedic Expert');
    setReadTimeMinutes(post.readTimeMinutes || 5);
    setIsPublished(post.isPublished);
    setMetaTitle(post.metaTitle || '');
    setMetaDescription(post.metaDescription || '');
    slugTouched.current = true;
    readTimeTouched.current = true;
    setErrorMsg('');
    setShowModal(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched.current) setSlug(slugify(value));
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (!readTimeTouched.current) setReadTimeMinutes(estimateReadTime(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return setErrorMsg('Title must be at least 3 characters.');
    if (!slug.trim()) return setErrorMsg('Slug is required.');
    if (content.trim().length < 20) return setErrorMsg('Content must be at least 20 characters.');

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim() || undefined,
      content: content.trim(),
      featuredImg: featuredImg.trim() || '',
      authorName: authorName.trim() || 'Shlokveda Ayurvedic Expert',
      readTimeMinutes: Number(readTimeMinutes) || estimateReadTime(content),
      isPublished,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };

    try {
      const res = await fetch(editingId ? `/api/admin/blog/${editingId}` : '/api/admin/blog', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not save the blog post. Please try again.');
      }
      setShowModal(false);
      setNotice(
        editingId
          ? `Blog post "${payload.title}" updated.`
          : payload.isPublished
            ? `Blog post "${payload.title}" is published — visible under the Blog tab.`
            : `Draft "${payload.title}" saved. Publish it when ready.`
      );
      await fetchPosts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save the blog post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublished = async (post: BlogPost) => {
    setNotice('');
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not update the post status.');
      }
      setNotice(
        post.isPublished
          ? `"${post.title}" moved back to drafts — hidden from the storefront.`
          : `"${post.title}" is now published on the Blog tab.`
      );
      await fetchPosts();
    } catch (err: any) {
      setNotice(err.message || 'Could not update the post status.');
    }
  };

  const handleDelete = async (post: BlogPost) => {
    setNotice('');
    if (!window.confirm(`Delete blog post "${post.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Could not delete the blog post.');
      }
      setNotice(`Blog post "${post.title}" deleted.`);
      await fetchPosts();
    } catch (err: any) {
      setNotice(err.message || 'Could not delete the blog post.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-[#1B4332]" aria-hidden="true" />
            Blog Posts
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
            Write and publish articles for the storefront&apos;s Blog tab. Drafts stay hidden until published;
            published posts appear instantly at /blog and in the sitemap.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Blog Post</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-[#FAF7F2] border border-[#E3DCCB] rounded-xl text-[#1B4332] text-xs flex items-center gap-2" role="status">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading blog posts...</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No blog posts yet. Click &ldquo;New Blog Post&rdquo; to publish your first article on the Blog tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Post</th>
                  <th className="py-3 px-4 hidden md:table-cell">Author</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Published</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-[320px]">
                      <div className="font-bold text-[13px] text-gray-900 line-clamp-1">{post.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-gray-400">/blog/{post.slug}</div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-gray-600">{post.authorName}</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-gray-600">{formatDate(post.publishedAt)}</td>
                    <td className="py-3 px-4">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          <FileText className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {post.isPublished && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg transition-colors"
                            title="View on storefront"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleTogglePublished(post)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg transition-colors"
                          title={post.isPublished ? 'Move back to drafts' : 'Publish now'}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(post)}
                          className="p-1.5 text-gray-400 hover:text-[#1B4332] rounded-lg transition-colors"
                          title="Edit post"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete post"
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-gray-900">
              {editingId ? 'Edit Blog Post' : 'New Blog Post'}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="blog-title" className={labelClasses}>Title *</label>
                <input
                  id="blog-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Triphala: the three-fruit classic of Ayurveda"
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="blog-slug" className={labelClasses}>URL Slug *</label>
                <input
                  id="blog-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="triphala-three-fruit-classic"
                  className={`${inputClasses} font-mono`}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Readers will find it at /blog/{slug || 'your-slug'} — lowercase letters, numbers and hyphens only.
                </p>
              </div>

              <div>
                <label htmlFor="blog-summary" className={labelClasses}>Summary</label>
                <textarea
                  id="blog-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="One or two lines shown on the Blog page cards"
                  rows={2}
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="blog-content" className={labelClasses}>Content *</label>
                <textarea
                  id="blog-content"
                  required
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={'Write the article here.\n\nLeave a blank line between paragraphs.\nStart a line with ## to make it a heading.'}
                  rows={10}
                  className={inputClasses}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Blank line = new paragraph. Lines starting with ## become headings.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="blog-author" className={labelClasses}>Author</label>
                  <input
                    id="blog-author"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="blog-readtime" className={labelClasses}>Read Time (minutes)</label>
                  <input
                    id="blog-readtime"
                    type="number"
                    min={1}
                    value={readTimeMinutes}
                    onChange={(e) => {
                      readTimeTouched.current = true;
                      setReadTimeMinutes(Number(e.target.value));
                    }}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="blog-image" className={labelClasses}>Featured Image URL</label>
                <input
                  id="blog-image"
                  type="text"
                  value={featuredImg}
                  onChange={(e) => setFeaturedImg(e.target.value)}
                  placeholder="/banners/your-image.webp or https://…"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="blog-meta-title" className={labelClasses}>SEO Title</label>
                  <input
                    id="blog-meta-title"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Optional"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="blog-meta-description" className={labelClasses}>SEO Description</label>
                  <input
                    id="blog-meta-description"
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Optional"
                    className={inputClasses}
                  />
                </div>
              </div>

              <label htmlFor="blog-published" className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                <input
                  id="blog-published"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#1B4332]"
                />
                <span><strong>Published</strong> — visible on the storefront Blog tab</span>
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
                  {submitting ? 'Saving…' : editingId ? 'Save Changes' : isPublished ? 'Publish Post' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
