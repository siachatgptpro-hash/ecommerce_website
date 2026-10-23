import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Authentication page — never indexed.
export const metadata: Metadata = {
  title: 'Create Account | Shlokveda',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
