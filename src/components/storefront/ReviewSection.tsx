'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/types';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Star, CheckCircle2, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setReviews(Array.isArray(data.data) ? data.data : (data.data.reviews || []));
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please write your review feedback.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit review');
      }

      setSuccessMsg(data.message || 'Thank you. Your review was submitted for moderation.');
      setTitle('');
      setComment('');
      setShowForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#EFE7D8] bg-white p-6 shadow-[0_20px_44px_-28px_rgba(27,67,50,0.4)] sm:p-8 md:flex-row">
        <div className="flex items-center gap-6">
          <div className={avgRating ? 'text-center' : 'flex items-center gap-4 text-left'}>
            {!avgRating && (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#F6EBD2] text-[#A67C2E] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_18px_rgba(197,168,128,0.35)]" aria-hidden="true">
                <Star className="h-6 w-6" strokeWidth={1.5} />
              </span>
            )}
            <div>
              {avgRating ? (
                <>
                  <span className="text-5xl font-serif font-black text-[#1B4332]">{avgRating}</span>
                  <div className="flex text-[#C5A880] justify-center mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? 'fill-current text-[#C5A880]' : 'text-gray-300'}`} />)}
                  </div>
                </>
              ) : <span className="text-base font-bold text-gray-800">No rating yet</span>}
              <p className="mt-1 text-xs text-gray-500">{reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>
          </div>

          <div className="hidden h-16 w-px bg-[#EFE7D8] sm:block" />

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Reviews appear after moderation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Purchase verification is marked when available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Use the package label for product directions</span>
            </div>
          </div>
        </div>

        {user ? (
          <button onClick={() => setShowForm(!showForm)} className="shrink-0 rounded-xl bg-[#1B4332] px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2">
            {showForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        ) : (
          <Link href="/login" className="shrink-0 rounded-xl bg-[#1B4332] px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2">Sign in to review</Link>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-[#C5A880] shadow-sm space-y-4">
          <h4 className="font-serif text-lg font-bold text-gray-900">
            Share Your Experience with {productName}
          </h4>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-[#C5A880] text-[#C5A880]' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gray-600 ml-2">
                {rating === 5 && 'Outstanding (5/5)'}
                {rating === 4 && 'Very Good (4/5)'}
                {rating === 3 && 'Average (3/5)'}
                {rating === 2 && 'Below Expectation (2/5)'}
                {rating === 1 && 'Poor (1/5)'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Headline / Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Authentic Classical Taste & Highly Effective!"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Review Details *
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with the product information, packaging, or ordering process..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="space-y-2 rounded-2xl border border-[#EFE7D8] bg-[#FAF7F2] p-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-[#A67C2E]/60" />
            <p className="text-sm font-bold text-gray-700">No reviews yet for this formulation.</p>
            <p className="text-xs text-gray-500">Be the first to share an experience after purchasing this product.</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-[#F3EFE6] space-y-3 shadow-xs hover:border-[#C5A880]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs uppercase">
                      {rev.user?.name ? rev.user.name.charAt(0) : 'C'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-gray-900 block leading-tight">
                        {rev.user?.name || 'Customer'}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex text-[#C5A880] justify-end">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-current text-[#C5A880]' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {rev.title && (
                <h5 className="font-bold text-sm text-gray-900 pt-1">{rev.title}</h5>
              )}

              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
