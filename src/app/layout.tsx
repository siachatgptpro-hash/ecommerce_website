import type { Metadata } from 'next';
import './global.css';
import { Providers } from '@/components/shared/Providers';

// Resolve relative canonical / Open Graph URLs against the deployed origin
// when one is configured. Left unset locally so Next.js uses its default.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: 'Shlokveda | Product Catalogue',
  description: 'Browse Shlokveda products with pack sizes, printed MRPs and product images transcribed from the supplied brochure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Brand webfonts declared in global.css / tailwind.config.ts.
            Loaded at runtime (not via next/font) so builds never depend
            on network access to the font CDN. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Dancing+Script:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased bg-[#FAF7F2] text-[#1F2937] selection:bg-[#1B4332] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
