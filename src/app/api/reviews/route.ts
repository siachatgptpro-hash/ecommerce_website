import { NextRequest, NextResponse } from 'next/server';
import { ReviewCreateSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { OrderRepository } from '@/repositories/order.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { AuthService } from '@/services/auth.service';
import { AuthenticationError, ConflictError, NotFoundError, handleApiError } from '@/lib/errors';
import { toPublicReview } from '@/lib/public-dto';
import sanitizeHtml from 'sanitize-html';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    const reviews = await CMSRepository.listReviews(productId, true);
    return NextResponse.json({
      success: true,
      // Never expose reviewer userIds or email addresses publicly.
      data: reviews.map(toPublicReview),
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('shlokveda_session_token')?.value;

    if (!token) {
      throw new AuthenticationError('Please log in to submit a verified product review.');
    }

    const user = await AuthService.getCurrentUser(token);
    const json = await req.json();
    const payload = ReviewCreateSchema.parse(json);

    const product = await ProductRepository.findProductById(payload.productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const isVerified = await OrderRepository.hasUserPurchasedProduct(user.id, payload.productId);
    const cleanComment = sanitizeHtml(payload.comment, { allowedTags: [], allowedAttributes: {} });
    const cleanTitle = payload.title ? sanitizeHtml(payload.title, { allowedTags: [], allowedAttributes: {} }) : null;

    // One review per customer per product: a repeat submission UPDATES the
    // existing review (back through moderation) instead of erroring.
    const existingReviews = await CMSRepository.listReviews(payload.productId, false);
    const mine = existingReviews.find((review) => review.userId === user.id);
    if (mine) {
      const updated = await CMSRepository.updateReviewByUser(mine.id, {
        rating: payload.rating,
        title: cleanTitle,
        comment: cleanComment,
        isVerified,
      });
      return NextResponse.json({
        success: true,
        message: 'Your review has been updated and will appear after moderation.',
        data: updated ? toPublicReview(updated) : null,
      });
    }

    const review = await CMSRepository.createReview({
      productId: payload.productId,
      userId: user.id,
      userName: user.fullName,
      rating: payload.rating,
      title: cleanTitle,
      comment: cleanComment,
      isVerified,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! Your review has been submitted and will appear after moderation.',
        data: toPublicReview(review),
      },
      { status: 201 }
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
