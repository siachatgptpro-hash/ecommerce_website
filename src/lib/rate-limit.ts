import { NextRequest, NextResponse } from 'next/server';

const localBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest, scope: string) {
  // Vercel supplies x-real-ip; use forwarded headers only as a fallback.
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `${scope}:${ip}`;
}

/**
 * Process-local rate limiter. This avoids an external Upstash dependency, but is
 * not shared across Vercel/serverless instances and therefore is only a best-effort
 * abuse-control measure in production.
 */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
  failClosed = true
): Promise<NextResponse | null> {
  const key = clientKey(req, scope);
  const now = Date.now();
  const bucket = localBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    localBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please retry later.' } },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)), 'Cache-Control': 'no-store' } }
    );
  }
  return null;
}
