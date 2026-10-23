import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Authenticated account pages must never be indexed.
export const metadata: Metadata = {
  title: 'My Account | Shlokveda',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
