import { NextRequest } from 'next/server';
import { enforceRateLimit } from './src/lib/rate-limit';

async function main() {
  const original = process.env.NODE_ENV;
  (process.env as any).NODE_ENV = 'test';
  const request = () => new NextRequest('https://example.test/api/test', { headers: { 'x-real-ip': '198.51.100.10' } });
  const first = await enforceRateLimit(request(), 'test:limit', 2, 60);
  const second = await enforceRateLimit(request(), 'test:limit', 2, 60);
  const third = await enforceRateLimit(request(), 'test:limit', 2, 60);
  if (first || second || third?.status !== 429) throw new Error('local rate-limit behavior failed');
  console.log('Security checks: rate limiter returns 429 after the configured threshold.');
  if (original === undefined) delete (process.env as any).NODE_ENV; else (process.env as any).NODE_ENV = original;
}
main().catch((error) => { console.error(error); process.exit(1); });
