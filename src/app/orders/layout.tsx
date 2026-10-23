import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Private order pages — never indexed.
export const metadata: Metadata = {
  title: 'Order Details | Shlokveda',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
