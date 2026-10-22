'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

type HeroSlide = {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const current = slides[active] || slides[0];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!current) return null;

  return (
    <section className="relative mx-0 sm:mx-4 lg:mx-8 mt-0 sm:mt-4 overflow-hidden bg-[#1B4332] shadow-xl min-h-[320px] sm:min-h-[430px] lg:min-h-[500px]">
      {slides.map((slide, index) => (
        <div key={`${slide.title}-${index}`} className={`absolute inset-0 transition-opacity duration-700 ${index === active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={index !== active}>
          <Image src={slide.imageUrl} alt={slide.title} fill priority={index === 0} className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
        </div>
      ))}

      <div className="relative z-10 flex min-h-[320px] sm:min-h-[430px] lg:min-h-[500px] items-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="max-w-xl text-white space-y-4 sm:space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#C5A880]" /> Sholkveda wellness collection
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-md">{current.title}</h1>
          <p className="max-w-lg text-sm sm:text-base text-gray-100 leading-relaxed">{current.subtitle}</p>
          <Link href={current.ctaLink} className="inline-flex items-center gap-2 rounded-full bg-[#C5A880] px-6 py-3.5 text-sm font-bold text-[#1B4332] shadow-lg hover:bg-[#e0c69c] transition-colors">
            {current.ctaText}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => setActive((active - 1 + slides.length) % slides.length)} aria-label="Previous banner" className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1B4332] shadow hover:bg-white"><ArrowLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="Next banner" className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[#1B4332] shadow hover:bg-white"><ArrowRight className="h-5 w-5" /></button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => <button key={`dot-${index}`} type="button" onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} className={`h-2 rounded-full transition-all ${index === active ? 'w-7 bg-white' : 'w-2 bg-white/60'}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
