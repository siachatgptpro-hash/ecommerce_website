import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const localBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 20_000;

function clientIp(req: NextRequest): string {
  // Vercel (and most managed proxies) set x-real-ip to the true client IP.
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  // x-forwarded-for is client-spoofable at the front of the chain; the LAST
  // hop is the one our nearest trusted proxy observed, so prefer it over the
  // first (attacker-controlled) entry.
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return 'unknown';
}

/** Removes expired buckets so the map can't grow without bound. */
function pruneBuckets(now: number): void {
  if (localBuckets.size < 1_000) return;
  for (const [key, bucket] of localBuckets) {
    if (bucket.resetAt <= now) localBuckets.delete(key);
  }
  // Hard cap: shed the oldest buckets rather than leaking memory forever.
  if (localBuckets.size > MAX_BUCKETS) {
    const excess = localBuckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of localBuckets.keys()) {
      if (removed >= excess) break;
      localBuckets.delete(key);
      removed++;
    }
  }
}

function hitBucket(key: string, limit: number, windowSeconds: number, now: number): NextResponse | null {
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

/**
 * Process-local rate limiter. This avoids an external Upstash dependency, but is
 * not shared across Vercel/serverless instances and therefore is only a best-effort
 * abuse-control measure in production.
 *
 * When `identity` is supplied (e.g. the account being logged into), a second
 * per-identity bucket is enforced alongside the per-IP one — rotating or
 * spoofing IPs can no longer reset the limit for credential-stuffing a
 * single account.
 */
export async function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowSeconds: number,
  failClosed = true,
  identity?: string
): Promise<NextResponse | null> {
  void failClosed;
  const now = Date.now();
  pruneBuckets(now);

  const ipLimited = hitBucket(`${scope}:ip:${clientIp(req)}`, limit, windowSeconds, now);
  if (ipLimited) return ipLimited;

  if (identity) {
    const identityKey = crypto.createHash('sha256').update(identity.trim().toLowerCase()).digest('hex').slice(0, 32);
    const identityLimited = hitBucket(`${scope}:id:${identityKey}`, limit, windowSeconds, now);
    if (identityLimited) return identityLimited;
  }

  return null;
}
