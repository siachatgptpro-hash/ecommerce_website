/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy, tuned for this storefront:
 * - Razorpay hosted checkout (script + iframe + telemetry endpoints)
 * - Google Fonts (stylesheet + font files)
 * - 'unsafe-inline' for Next.js inline runtime scripts/styles (no nonce setup)
 * - dev-only 'unsafe-eval' + ws: for the Next.js HMR client
 * Clickjacking protection (frame-ancestors / X-Frame-Options) and HSTS are
 * production-only so embedded development previews keep working; on the
 * real deployment the full set applies.
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com${isProduction ? '' : ' ws: wss:'}`,
  'frame-src https://api.razorpay.com https://checkout.razorpay.com',
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProduction ? ["frame-ancestors 'self'"] : []),
];

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  ...(isProduction
    ? [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
