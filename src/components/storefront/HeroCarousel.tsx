'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Heart,
  Leaf,
  Pause,
  Play,
  ShieldCheck,
} from 'lucide-react';
import type { HeroSlide } from '@/lib/hero-slides';

const AUTOPLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;

const TRUST_CHIPS = [
  { icon: Leaf, label: 'Natural Ingredients' },
  { icon: Award, label: 'Authentic Ayurveda' },
  { icon: ShieldCheck, label: 'Quality Checked' },
  { icon: Heart, label: 'Made for Daily Care' },
] as const;

function renderTitle(slide: HeroSlide) {
  const { title, titleHighlight } = slide;
  if (!titleHighlight || !title.includes(titleHighlight)) return title;
  const [before, after] = title.split(titleHighlight);
  return (
    <>
      {before}
      <span className="italic text-[#B08968]">{titleHighlight}</span>
      {after}
    </>
  );
}

/**
 * Light, editorial hero carousel.
 *
 * - Every slide is server-rendered with real HTML text (SEO-friendly);
 *   the first slide carries the page's single <h1>.
 * - Autoplay pauses on hover/focus, when the tab is hidden, when the
 *   user prefers reduced motion, or via the explicit pause button.
 * - Manual navigation (arrows, dots, swipe) resets the autoplay timer.
 * - Fixed heights reserve the hero's space up front: zero layout shift.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const autoplayPaused = interactionPaused || userPaused || documentHidden || reducedMotion;

  const goTo = useCallback(
    (index: number) => setActive(((index % count) + count) % count),
    [count],
  );
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);
  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);

  // Respect the OS "reduced motion" preference (autoplay + transition speed).
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Pause while the browser tab is not visible; resume on return.
  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Autoplay. `active` in the deps restarts the timer after manual navigation.
  useEffect(() => {
    if (count < 2 || autoplayPaused) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [active, autoplayPaused, count]);

  // Warm the browser cache for the next slide's photograph.
  useEffect(() => {
    if (count < 2) return;
    const next = slides[(active + 1) % count];
    const preloader = new window.Image();
    preloader.src = next.imageUrl;
  }, [active, count, slides]);

  if (count === 0) return null;

  const headingClassName =
    'font-serif text-[2rem] font-bold leading-[1.12] text-[#0F281E] sm:text-5xl sm:leading-[1.08] lg:text-[3.4rem]';
  const fadeClassName = reducedMotion ? 'transition-none' : 'transition-opacity duration-700 ease-out';

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured Ayurvedic collections"
      className="relative h-[560px] overflow-hidden bg-[#F3EFE6] sm:h-[540px] lg:h-[600px]"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocus={() => setInteractionPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
        if (delta < 0) goNext();
        else goPrev();
      }}
    >
      {slides.map((slide, index) => {
        const isActive = index === active;
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            aria-hidden={!isActive}
            className={`absolute inset-0 ${fadeClassName} ${
              isActive ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
            }`}
          >
            {/* Slide photograph (right-weighted composition on small screens) */}
            {slide.mobileImgUrl ? (
              <>
                <Image
                  src={slide.mobileImgUrl}
                  alt={slide.imageAlt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-[72%_center] sm:hidden"
                />
                <Image
                  src={slide.imageUrl}
                  alt={slide.imageAlt}
                  fill
                  sizes="100vw"
                  className="hidden object-cover object-center sm:block"
                />
              </>
            ) : (
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-[72%_center] lg:object-center"
              />
            )}

            {/* Ivory gradients keep the dark-green copy readable on photography */}
            <div className="absolute inset-0 bg-[#FAF7F2]/45 sm:bg-transparent" aria-hidden="true" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/85 to-transparent sm:via-[#FAF7F2]/70 lg:via-[#FAF7F2]/55"
              aria-hidden="true"
            />

            {/* Slide copy — real HTML text, never baked into the image */}
            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 pb-28 pt-6 sm:px-6 lg:px-8">
              <div className="max-w-xl space-y-4 sm:space-y-5">
                {slide.eyebrow && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#C5A880]/60 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1B4332] backdrop-blur-sm sm:text-[11px]">
                    <Leaf className="h-3.5 w-3.5 text-[#B08968]" aria-hidden="true" />
                    {slide.eyebrow}
                  </span>
                )}
                {index === 0 ? (
                  <h1 className={headingClassName}>{renderTitle(slide)}</h1>
                ) : (
                  <p className={headingClassName}>{renderTitle(slide)}</p>
                )}
                <p className="max-w-lg text-sm leading-relaxed text-[#3F4A42] sm:text-base">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
                  <Link
                    href={slide.ctaLink}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1B4332] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2D6A4F] sm:px-7"
                  >
                    {slide.ctaText}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {slide.secondaryCtaText && slide.secondaryCtaLink && (
                    <Link
                      href={slide.secondaryCtaLink}
                      tabIndex={isActive ? 0 : -1}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1B4332]/25 bg-white/85 px-6 py-3.5 text-sm font-bold text-[#1B4332] backdrop-blur-sm transition-colors hover:bg-white sm:px-7"
                    >
                      {slide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Previous / next arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#E7E0D0] bg-white/85 p-2.5 text-[#1B4332] shadow-md backdrop-blur-sm transition-colors hover:bg-white sm:left-5"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[#E7E0D0] bg-white/85 p-2.5 text-[#1B4332] shadow-md backdrop-blur-sm transition-colors hover:bg-white sm:right-5"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Bottom bar: trust chips (desktop) + dots + autoplay toggle.
          Sits at bottom-16 so the overlapping benefits strip (-mt-12) never covers it. */}
      <div className="absolute inset-x-0 bottom-16 z-20">
        <div className="mx-auto flex max-w-7xl items-end justify-center gap-6 px-4 sm:px-6 lg:justify-between lg:px-8">
          <ul className="hidden items-center gap-6 lg:flex" aria-label="Why shop with us">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1B4332]/20 bg-white/80 backdrop-blur-sm">
                  <Icon className="h-[18px] w-[18px] text-[#1B4332]" aria-hidden="true" />
                </span>
                <span className="max-w-[5.5rem] text-[11px] font-semibold leading-tight text-[#1B4332]">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          {count > 1 && (
            <div className="flex items-center gap-1">
              {slides.map((slide, index) => (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                  aria-current={index === active || undefined}
                  className="flex h-8 items-center px-1"
                >
                  <span
                    className={`block h-2 rounded-full transition-all ${
                      index === active ? 'w-7 bg-[#1B4332]' : 'w-2 bg-[#1B4332]/30 hover:bg-[#1B4332]/50'
                    } ${reducedMotion ? 'transition-none' : ''}`}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                aria-pressed={userPaused}
                aria-label={userPaused ? 'Play automatic slide rotation' : 'Pause automatic slide rotation'}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#1B4332]/20 bg-white/85 text-[#1B4332] backdrop-blur-sm transition-colors hover:bg-white"
              >
                {userPaused ? (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Screen-reader announcement of the visible slide */}
      <span className="sr-only" role="status" aria-live="polite">
        {count > 1 ? `Slide ${active + 1} of ${count}: ${slides[active]?.title ?? ''}` : ''}
      </span>
    </section>
  );
}
