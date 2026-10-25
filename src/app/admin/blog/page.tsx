'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BlogPost } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { fetchJson, isAdminSessionError } from '@/lib/client-api';
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
  UploadCloud,
  X,
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
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [featuredImg, setFeaturedImg] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [authorName, setAuthorName] = useState('Shlokveda Ayurvedic Expert');
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const slugTouched = useRef(false);
  const readTimeTouched = useRef(false);

  const redirectIfAdminSessionError = async (error: unknown): Promise<boolean> => {
    if (!isAdminSessionError(error)) return false;
    // Re-read the admin-scoped cookie before leaving, so AuthProvider state
    // matches the server and AdminLayout does not render a stale identity.
    await refreshSession('admin');
    router.replace('/admin/login?next=%2Fadmin%2Fblog&reason=session-changed');
    return true;
  };

  const messageFromError = (error: unknown, fallback: string) =>
    error instanceof Error && error.message ? error.message : fallback;

  const fetchPosts = async () => {
    try {
      const data = await fetchJson('/api/admin/blog', { cache: 'no-store' }, 'Could not load blog posts.');
      setPosts(data.data?.posts || []);
    } catch (err) {
      if (await redirectIfAdminSessionError(err)) return;
      setNoticeIsError(true);
      setNotice(messageFromError(err, 'Could not load blog posts.'));
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
    setImageUploading(false);
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
    setImageUploading(false);
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

  const handleFeaturedImageUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setErrorMsg('Featured photo must be a JPG, PNG, or WEBP image up to 5 MB.');
      return;
    }
    setImageUploading(true);
    setErrorMsg('');
    try {
      const body = new FormData();
      body.append('file', file);
      const result = await fetchJson('/api/admin/uploads', { method: 'POST', body }, 'Photo upload failed.');
      setFeaturedImg(result.data.url);
    } catch (error: any) {
      if (await redirectIfAdminSessionError(error)) return;
      setErrorMsg(messageFromError(error, 'Photo upload failed.'));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUploading) return setErrorMsg('Please wait for the photo upload to finish.');
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
      await fetchJson(
        editingId ? `/api/admin/blog/${editingId}` : '/api/admin/blog',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        'Could not save the blog post. Please try again.'
      );
      setShowModal(false);
      setNoticeIsError(false);
      setNotice(
        editingId
          ? `Blog post "${payload.title}" updated.`
          : payload.isPublished
            ? `Blog post "${payload.title}" is published — visible under the Blog tab.`
            : `Draft "${payload.title}" saved. Publish it when ready.`
      );
      await fetchPosts();
    } catch (err: any) {
      if (await redirectIfAdminSessionError(err)) return;
      setErrorMsg(messageFromError(err, 'Could not save the blog post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublished = async (post: BlogPost) => {
    setNotice('');
    setNoticeIsError(false);
    try {
      await fetchJson(
        `/api/admin/blog/${post.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: !post.isPublished }),
        },
        'Could not update the post status.'
      );
      setNotice(
        post.isPublished
          ? `"${post.title}" moved back to drafts — hidden from the storefront.`
          : `"${post.title}" is now published on the Blog tab.`
      );
      await fetchPosts();
    } catch (err: any) {
      if (await redirectIfAdminSessionError(err)) return;
      setNoticeIsError(true);
      setNotice(messageFromError(err, 'Could not update the post status.'));
    }
  };

  const handleDelete = async (post: BlogPost) => {
    setNotice('');
    setNoticeIsError(false);
    if (!window.confirm(`Delete blog post "${post.title}"? This cannot be undone.`)) return;
    try {
      await fetchJson(
        `/api/admin/blog/${post.id}`,
        { method: 'DELETE' },
        'Could not delete the blog post.'
      );
      setNoticeIsError(false);
      setNotice(`Blog post "${post.title}" deleted.`);
      await fetchPosts();
    } catch (err: any) {
      if (await redirectIfAdminSessionError(err)) return;
      setNoticeIsError(true);
      setNotice(messageFromError(err, 'Could not delete the blog post.'));
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
        <div className={`p-3 border rounded-xl text-xs flex items-center gap-2 ${noticeIsError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-[#FAF7F2] border-[#E3DCCB] text-[#1B4332]'}`} role={noticeIsError ? 'alert' : 'status'}>
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
            <table className="w-full min-w-[680px] text-left text-xs">
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
                <span id="blog-image-label" className={labelClasses}>Featured Photo</span>
                <div className="rounded-2xl border border-[#E3DCCB] bg-[#FAF7F2] p-3" aria-labelledby="blog-image-label">
                  {featuredImg ? (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="h-28 w-44 max-w-full overflow-hidden rounded-xl border border-white bg-white shadow-sm">
                        <img src={featuredImg} alt="Blog featured" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-52 flex-1 space-y-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-[#1B4332]">
                          <CheckCircle2 className="h-4 w-4" /> Photo ready
                        </p>
                        <p className="text-[11px] leading-relaxed text-gray-500">
                          This photo will show on the blog card and article page. Uploads are saved in Neon.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <label className={`inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F] ${imageUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                            <UploadCloud className="h-4 w-4" />
                            {imageUploading ? 'Uploading…' : 'Change Photo'}
                            <input
                              id="blog-image-upload-change"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              disabled={imageUploading}
                              onChange={(e) => {
                                const chosen = e.target.files?.[0];
                                e.target.value = '';
                                if (chosen) handleFeaturedImageUpload(chosen);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setFeaturedImg('')}
                            disabled={imageUploading}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
                          >
                            <X className="h-4 w-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="blog-image-upload"
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9BFA8] bg-white px-4 py-7 text-center transition-colors hover:border-[#1B4332] hover:bg-[#F7F3EA] ${imageUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
                      >
                        <UploadCloud className="h-7 w-7 text-[#1B4332]" />
                        <span className="text-sm font-bold text-gray-900">{imageUploading ? 'Uploading photo…' : 'Upload Photo'}</span>
                        <span className="text-[11px] text-gray-500">Choose a JPG, PNG, or WEBP image (max 5 MB). It will be saved in Neon.</span>
                      </label>
                      <input
                        id="blog-image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={imageUploading}
                        onChange={(e) => {
                          const chosen = e.target.files?.[0];
                          e.target.value = '';
                          if (chosen) handleFeaturedImageUpload(chosen);
                        }}
                      />
                    </>
                  )}
                  {imageUploading && (
                    <p className="mt-2 text-[11px] font-semibold text-[#1B4332]" role="status">Uploading photo, please wait…</p>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Optional. Without a photo, the blog uses the default botanical image.</p>
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
                  disabled={submitting || imageUploading}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all disabled:opacity-60"
                >
                  {imageUploading ? 'Uploading Photo…' : submitting ? 'Saving…' : editingId ? 'Save Changes' : isPublished ? 'Publish Post' : 'Save Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
