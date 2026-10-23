import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Transactional page — never indexed.
export const metadata: Metadata = {
  title: 'Checkout | Shlokveda',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
