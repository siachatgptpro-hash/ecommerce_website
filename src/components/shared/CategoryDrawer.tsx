'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Disc,
  Droplet,
  Flower2,
  HandHeart,
  LayoutGrid,
  Leaf,
  Milk,
  Pill,
  Pipette,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryDrawerItem {
  id?: string;
  name: string;
  slug: string;
  displayOrder?: number;
}

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryDrawerItem[];
}

/** Display order for the well-known catalogue categories (any additional
 *  admin-managed categories follow, alphabetically). */
const CATEGORY_ORDER = [
  'syrups-juices',
  'arks-drops',
  'herbal-oils',
  'herbal-capsules',
  'tablets',
  'daily-wellness',
  'immunity-rasayana',
  'personal-care',
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'syrups-juices': Milk,
  'arks-drops': Pipette,
  'herbal-oils': Droplet,
  'herbal-capsules': Pill,
  tablets: Disc,
  'daily-wellness': Flower2,
  'immunity-rasayana': ShieldCheck,
  'personal-care': HandHeart,
};

/** Shown until the live category list arrives (same fallback the old menu used). */
const FALLBACK_CATEGORIES: CategoryDrawerItem[] = [
  { slug: 'syrups-juices', name: 'Syrups & Juices' },
  { slug: 'arks-drops', name: 'Arks & Drops' },
  { slug: 'herbal-oils', name: 'Herbal Oils' },
  { slug: 'herbal-capsules', name: 'Herbal Capsules' },
  { slug: 'tablets', name: 'Tablets' },
  { slug: 'daily-wellness', name: 'Daily Wellness' },
  { slug: 'immunity-rasayana', name: 'Immunity & Rasayana' },
  { slug: 'personal-care', name: 'Personal Care' },
];

const EASE = 'cubic-bezier(0.22,1,0.36,1)';

/**
 * "Shop by Category" slide-out drawer (left).
 *
 * Behaviour mirrors the cart drawer's contract: dimmed + blurred overlay,
 * body scroll-lock with position preserved, Escape to close, focus moved
 * into the dialog, kept inside while open (Tab trap), and restored to the
 * trigger on close. Enter/exit are pure CSS transform/opacity animations
 * (motion-safe only); the exit phase keeps the node mounted briefly so the
 * slide-out can play before unmount.
 */
export function CategoryDrawer({ open, onClose, categories }: CategoryDrawerProps) {
  const pathname = usePathname();
  const [render, setRender] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Mount/unmount with an exit-animation window.
  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
      return;
    }
    if (!render) return;
    setClosing(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(
      () => {
        setRender(false);
        setClosing(false);
      },
      reduced ? 0 : 340
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll-lock, Escape, focus-in, Tab trap, focus restore.
  useEffect(() => {
    if (!render) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [render]);

  if (!render) return null;

  const source = categories.length ? categories : FALLBACK_CATEGORIES;
  const ordered = [...source].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.slug);
    const bi = CATEGORY_ORDER.indexOf(b.slug);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    const byOrder = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    return byOrder !== 0 ? byOrder : a.name.localeCompare(b.name);
  });

  const rowLinkClasses =
    'group flex items-center gap-3.5 rounded-2xl px-3 py-3 outline-none transition-colors duration-[var(--dur-ui)] ease-luxe hover:bg-[#EEF3E4] focus-visible:ring-2 focus-visible:ring-[#0B5138] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FAF7F0] sm:gap-4 sm:px-3.5';
  const iconDiscClasses =
    'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F0F1E5] text-[#17573B] transition-all duration-[var(--dur-ui)] ease-luxe group-hover:text-[#A67C2E] motion-safe:group-hover:scale-[1.04]';
  const chevronClasses =
    'h-[18px] w-[18px] shrink-0 text-[#8A9484] transition-all duration-[var(--dur-ui)] ease-luxe group-hover:text-[#0B5138] motion-safe:group-hover:translate-x-1';

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shop by category" id="category-drawer">
      {/* Dimmed, softly blurred backdrop */}
      <button
        type="button"
        aria-label="Close category menu"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-[#0B1F16]/55 backdrop-blur-[3px] ${
          closing
            ? 'motion-safe:animate-[fade-out_.3s_ease-in_both]'
            : 'motion-safe:animate-[fade-in_.32s_ease-out_both]'
        }`}
      />

      {/* Drawer panel */}
      <aside
        ref={panelRef}
        className={`absolute inset-y-0 left-0 flex w-[min(460px,92vw)] flex-col overflow-hidden bg-[#123D2D] shadow-[24px_0_60px_-24px_rgba(11,31,22,0.55)] sm:rounded-r-[2rem] ${
          closing
            ? `motion-safe:animate-[drawer-slide-out_.34s_${EASE}_both]`
            : `motion-safe:animate-[drawer-slide-in_.42s_${EASE}_both]`
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#123D2D] via-[#123D2D] to-[#0B5138] px-6 pb-14 pt-7 sm:px-8">
          {/* Botanical photo corners (decorative) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:0%_0%] bg-no-repeat opacity-45 [mask-image:radial-gradient(ellipse_85%_85%_at_12%_10%,black_38%,transparent_72%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 bg-[url('/banners/highlights-botanical-bg.webp')] bg-[size:220%_auto] bg-[position:100%_0%] bg-no-repeat opacity-35 [mask-image:radial-gradient(ellipse_85%_85%_at_88%_10%,black_38%,transparent_72%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_0%,rgba(201,164,106,0.16),transparent_70%)]"
          />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close category menu"
            className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/35 text-white transition-all duration-[var(--dur-ui)] ease-luxe hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#123D2D] motion-safe:hover:scale-105"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="relative flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-white/25 bg-white/5 text-[#E9D9AE]"
            >
              <LayoutGrid className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#C9A46A]">Explore</p>
              <h2 className="mt-1 font-serif text-[28px] font-bold leading-tight text-white">All Categories</h2>
              <p className="mt-1 text-[13px] leading-snug text-white/75">Pure Ayurveda for a Healthier Tomorrow</p>
            </div>
          </div>
        </div>

        {/* Mortar medallion straddling the header/sheet seam (decorative) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-[7.5rem] z-20 hidden h-[4.5rem] w-[4.5rem] rounded-full shadow-[0_14px_28px_-12px_rgba(11,31,22,0.6)] ring-4 ring-[#FAF7F0] bg-[url('/stages/pdp-stage.webp')] bg-[size:320%_auto] bg-[position:10%_84%] bg-no-repeat sm:block"
        />

        {/* Ivory sheet */}
        <div className="relative z-10 -mt-7 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.75rem] bg-[#FAF7F0]">
          {/* Faint leaf silhouettes (decorative) */}
          <Leaf aria-hidden="true" className="pointer-events-none absolute -right-9 bottom-28 h-44 w-44 rotate-12 text-[#0B5138]/[0.05]" />
          <Leaf aria-hidden="true" className="pointer-events-none absolute -left-11 bottom-4 h-40 w-40 -rotate-[24deg] text-[#0B5138]/[0.045]" />

          <nav aria-label="Product categories" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 pt-4 sm:px-4">
            {/* All Categories — highlighted */}
            <div
              className={closing ? undefined : 'motion-safe:animate-[rise-in_.45s_cubic-bezier(.22,1,.36,1)_both]'}
              style={{ animationDelay: '50ms' }}
            >
              <Link
                href="/shop"
                onClick={onClose}
                aria-current={pathname === '/shop' ? 'page' : undefined}
                className={`${rowLinkClasses} bg-[#E7F0DE] hover:bg-[#DFEBCF]`}
              >
                <span aria-hidden="true" className={`${iconDiscClasses} bg-white/70`}>
                  <LayoutGrid className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#123D2D]">All Categories</span>
                <ChevronRight aria-hidden="true" className={chevronClasses} />
              </Link>
            </div>

            <ul className="mt-1 divide-y divide-[#E7E2D2]/90">
              {ordered.map((category, index) => {
                const Icon = CATEGORY_ICONS[category.slug] || Leaf;
                const isCurrent = pathname === `/category/${category.slug}`;
                return (
                  <li
                    key={category.id || category.slug}
                    className={closing ? undefined : 'motion-safe:animate-[rise-in_.45s_cubic-bezier(.22,1,.36,1)_both]'}
                    style={{ animationDelay: `${95 + index * 45}ms` }}
                  >
                    <Link
                      href={`/category/${category.slug}`}
                      onClick={onClose}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={rowLinkClasses}
                    >
                      <span aria-hidden="true" className={iconDiscClasses}>
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[15px] ${
                          isCurrent ? 'font-bold text-[#0B5138]' : 'font-medium text-[#18251F]'
                        }`}
                      >
                        {category.name}
                      </span>
                      <ChevronRight aria-hidden="true" className={chevronClasses} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer card */}
          <div className="relative px-5 pb-6 pt-3 sm:px-6">
            <Link
              href="/about"
              onClick={onClose}
              className="group flex items-center gap-3.5 rounded-3xl bg-[#F0F1E5] px-4 py-3.5 outline-none transition-colors duration-[var(--dur-ui)] ease-luxe hover:bg-[#E8EDD8] focus-visible:ring-2 focus-visible:ring-[#0B5138] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FAF7F0]"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80 text-[#0B5138] transition-all duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:scale-[1.04]"
              >
                <Leaf className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[13px] text-[#5A6B5E]">Tradition for a</span>
                <span className="block text-[15px] font-bold text-[#123D2D]">Healthier Tomorrow</span>
              </span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#0B5138] shadow-sm transition-transform duration-[var(--dur-ui)] ease-luxe motion-safe:group-hover:translate-x-0.5"
              >
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
