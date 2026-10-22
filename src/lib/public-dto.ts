import { Product, Review } from '@/types';

/**
 * Public serialisation boundary.
 *
 * Internal product/review objects carry fields shoppers must never see —
 * variant `costPrice` (store margins) and reviewer identities (userId /
 * email). Everything returned by a public API route or passed from a Server
 * Component into client components (RSC payload) must go through here.
 */

export function toPublicProduct<T extends Product>(product: T): T {
  return {
    ...product,
    // Rating aggregates stay; individual reviewer identities do not.
    reviews: undefined,
    variants: product.variants?.map((variant) => {
      const { costPrice: _costPrice, ...publicVariant } = variant as typeof variant & { costPrice?: number };
      return publicVariant;
    }) as T['variants'],
  };
}

export function toPublicReview(review: Review) {
  return {
    id: review.id,
    productId: review.productId,
    rating: review.rating,
    title: review.title ?? null,
    comment: review.comment,
    userName: review.userName || review.user?.name || 'Verified Customer',
    isVerified: Boolean(review.isVerified),
    isVerifiedPurchase: Boolean(review.isVerifiedPurchase ?? review.isVerified),
    adminReply: review.adminReply ?? null,
    createdAt: review.createdAt,
  };
}
