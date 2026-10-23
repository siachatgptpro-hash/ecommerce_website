import { NextRequest, NextResponse } from 'next/server';
import { NewsletterSubscribeSchema } from '@/schemas';
import { NewsletterRepository } from '@/repositories/newsletter.repository';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/newsletter — footer "Stay Updated" subscription.
 * 201 on first subscription; 200 with alreadySubscribed=true on repeats.
 * There is deliberately no GET: subscriber emails are never exposed publicly.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email } = NewsletterSubscribeSchema.parse(json);
    const { created } = await NewsletterRepository.subscribe(email);
    return NextResponse.json(
      { success: true, data: { subscribed: true, alreadySubscribed: !created } },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
