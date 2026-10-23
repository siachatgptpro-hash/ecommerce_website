import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ContactGlowIcon } from './ContactGlowIcon';

/**
 * Premium ivory contact card: fine gold border, soft shadow, a low-opacity
 * botanical motif in the corner, the dark-green glowing medallion and an
 * H2. The entrance animation lives on the outer wrapper so the card's own
 * hover lift (transform) never conflicts with it. Cards are informational
 * (links inside carry the interactions), so no pointer cursor is used.
 */
export function ContactCard({
  icon,
  title,
  delay = 0,
  children,
}: {
  icon: LucideIcon;
  title: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="h-full motion-safe:animate-[rise-in_0.7s_ease-out_both]"
      style={{ animationDelay: `${delay}s` }}
    >
      <article className="group relative h-full overflow-hidden rounded-[1.75rem] border border-[#E3D5B5] bg-white/85 p-7 shadow-[0_20px_44px_-22px_rgba(27,67,50,0.4)] backdrop-blur transition-all duration-500 hover:border-[#C5A880] hover:shadow-[0_28px_54px_-22px_rgba(197,168,128,0.65)] motion-safe:hover:-translate-y-1 sm:p-8">
        {/* Photographic botanical corner sprays (same scene as the page
            backdrop), softly masked so they fade into the ivory card and
            never sit under the text at readable strength. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-8 h-36 w-44 bg-[url('/banners/contact-botanical-bg.webp')] bg-cover bg-[position:88%_8%] opacity-[0.13] [mask-image:radial-gradient(ellipse_70%_70%_at_78%_22%,black_30%,transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -right-6 h-40 w-48 bg-[url('/banners/contact-botanical-bg.webp')] bg-cover bg-[position:90%_30%] opacity-[0.16] [mask-image:radial-gradient(ellipse_72%_72%_at_80%_80%,black_28%,transparent_72%)]"
        />
        <div className="relative">
          <ContactGlowIcon icon={icon} delay={delay} />
          <h2 className="mt-5 font-serif text-2xl font-bold text-[#0F281E]">{title}</h2>
          <div className="mt-3.5">{children}</div>
        </div>
      </article>
    </div>
  );
}
