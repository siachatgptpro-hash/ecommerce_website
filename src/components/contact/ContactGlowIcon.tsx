import { Leaf, type LucideIcon } from 'lucide-react';

/**
 * Dark-green cinematic medallion for the contact cards: deep forest-green
 * disc with a fine metallic-gold outline, gold icon stroke, a breathing
 * emerald-gold halo (transform/opacity only) and a gold light sweep on
 * card hover. Decorative — the card heading and text carry the meaning.
 */
export function ContactGlowIcon({
  icon: Icon,
  delay = 0,
}: {
  icon: LucideIcon;
  delay?: number;
}) {
  return (
    <span className="relative inline-block shrink-0" aria-hidden="true">
      <span
        className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(45,106,79,0.35),rgba(197,168,128,0.22)_52%,transparent_72%)] motion-safe:animate-[banner-breathe_5s_ease-in-out_infinite]"
        style={{ animationDelay: `${delay}s` }}
      />
      <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#C5A880]/90 bg-[radial-gradient(circle_at_50%_26%,#2D6A4F,#1B4332_56%,#0F281E)] shadow-[0_0_26px_rgba(197,168,128,0.4),0_12px_24px_-10px_rgba(15,40,30,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-500 group-hover:border-[#DDBF8E] group-hover:shadow-[0_0_38px_rgba(197,168,128,0.65),0_14px_28px_-10px_rgba(15,40,30,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] motion-safe:group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
        <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(115deg,transparent_32%,rgba(255,240,200,0.35)_50%,transparent_68%)] transition-transform duration-700 ease-out motion-safe:group-hover:translate-x-[130%]" />
        <Icon
          className="relative h-7 w-7 text-[#DDBF8E] transition-colors duration-500 [filter:drop-shadow(0_0_7px_rgba(221,191,142,0.65))] group-hover:text-[#F0DCA8] sm:h-8 sm:w-8"
          strokeWidth={1.7}
        />
      </span>
      {/* Small leaf sprig overlapping the medallion, as in the reference */}
      <Leaf className="absolute -bottom-1 -right-2 h-5 w-5 rotate-12 text-[#2D6A4F] [filter:drop-shadow(0_1px_2px_rgba(15,40,30,0.3))]" strokeWidth={1.8} />
    </span>
  );
}
