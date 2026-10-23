import type { LucideIcon } from 'lucide-react';

const SIZES = {
  md: { ring: 'h-12 w-12', icon: 'h-5 w-5' },
  lg: { ring: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]', icon: 'h-7 w-7' },
} as const;

/**
 * Light-theme cinematic icon ring: fine gold outline on a pale sage-gold
 * disc with a soft breathing halo (transform/opacity only, staggered via
 * `delay`), brightening and scaling gently when its parent `.group` is
 * hovered. Fully stilled under prefers-reduced-motion. Decorative only —
 * parent content carries the meaning.
 */
export function GlowIcon({
  icon: Icon,
  delay = 0,
  size = 'md',
}: {
  icon: LucideIcon;
  delay?: number;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  return (
    <span className="relative shrink-0" aria-hidden="true">
      <span
        className="absolute -inset-2.5 rounded-full bg-[radial-gradient(circle,rgba(197,168,128,0.42),rgba(150,185,130,0.16)_55%,transparent_72%)] motion-safe:animate-[banner-breathe_5s_ease-in-out_infinite]"
        style={{ animationDelay: `${delay}s` }}
      />
      <span
        className={`relative flex ${s.ring} items-center justify-center overflow-hidden rounded-full border border-[#D9BE8C]/80 bg-[radial-gradient(circle_at_50%_30%,#FDF6E0,#F1F4E4_62%,#E6EDD6)] shadow-[0_0_22px_rgba(197,168,128,0.38),0_8px_20px_-10px_rgba(27,67,50,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all duration-500 group-hover:border-[#C5A880] group-hover:shadow-[0_0_34px_rgba(197,168,128,0.6),0_10px_24px_-10px_rgba(27,67,50,0.35),inset_0_1px_0_rgba(255,255,255,1)] motion-safe:group-hover:scale-105`}
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-[130%] bg-[linear-gradient(115deg,transparent_32%,rgba(255,255,255,0.55)_50%,transparent_68%)] transition-transform duration-700 ease-out motion-safe:group-hover:translate-x-[130%]" />
        <Icon
          className={`relative ${s.icon} text-[#A67C2E] transition-colors duration-500 [filter:drop-shadow(0_0_6px_rgba(197,168,128,0.5))] group-hover:text-[#8A6420]`}
          strokeWidth={1.6}
        />
      </span>
    </span>
  );
}
