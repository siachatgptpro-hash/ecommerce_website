import { BookOpen, Image as ImageIcon, IndianRupee, ShieldCheck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: BookOpen,
    filled: false,
    title: 'Brochure-Based Catalogue',
    text: 'Product names and pack options as per source brochure',
  },
  {
    icon: IndianRupee,
    filled: true,
    title: 'Printed MRPs',
    text: 'Prices transcribed from the source list',
  },
  {
    icon: ImageIcon,
    filled: false,
    title: 'Package Photography',
    text: 'Images matched to source pages',
  },
  {
    icon: ShieldCheck,
    filled: false,
    title: 'Product Information',
    text: 'Read package labels before use',
  },
] as const;

/**
 * Compact catalogue-assurance strip between the transparency banner and
 * the footer. Factual statements about sourcing only — no invented
 * certifications, guarantees, or delivery promises.
 */
export function CatalogueTrustStrip() {
  return (
    <section aria-label="Catalogue assurances" className="bg-[#FAF7F2] pb-16 pt-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-5 rounded-[2.5rem] border border-[#EFE6D4] bg-[#FDFBF6] px-6 py-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#EFE6D4]">
          {TRUST_ITEMS.map(({ icon: Icon, filled, title, text }) => (
            <li key={title} className="flex items-center gap-3.5 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <span
                className={
                  filled
                    ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1B4332] text-[#C5A880]'
                    : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#1B4332]/25 text-[#1B4332]'
                }
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" strokeWidth={filled ? 2.4 : 2} />
              </span>
              <span>
                <span className="block text-[11px] font-extrabold uppercase leading-tight tracking-wider text-gray-900">
                  {title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
