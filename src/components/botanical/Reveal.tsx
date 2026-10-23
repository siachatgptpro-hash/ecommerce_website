'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms, applied when the reveal plays. */
  delay?: number;
}

/**
 * Subtle scroll-triggered reveal (≈600ms fade + small rise, once only).
 *
 * Safety contract: content renders fully visible on the server and stays
 * visible when JavaScript or IntersectionObserver is unavailable, or when
 * the visitor prefers reduced motion. Only elements that start below the
 * fold are momentarily armed, so shoppers never see content flash or get
 * stuck hidden.
 */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'armed' | 'shown'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already in view — never hide

    setPhase('armed');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPhase('shown');
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        phase === 'armed'
          ? { opacity: 0, transform: 'translateY(16px)' }
          : phase === 'shown'
            ? {
                opacity: 1,
                transform: 'none',
                transition: `opacity .6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms`,
              }
            : undefined
      }
    >
      {children}
    </div>
  );
}
