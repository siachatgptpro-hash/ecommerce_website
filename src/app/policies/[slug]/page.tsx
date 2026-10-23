import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { settingsRepository } from '@/repositories/settings.repository';
import { CMSRepository } from '@/repositories/cms.repository';
import { getPolicyIcon } from '@/lib/policy-icons';
import { Reveal } from '@/components/botanical/Reveal';
import type { BusinessSettings, PolicyLayout, PolicySection } from '@/types';

interface PolicyPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

interface ResolvedPolicy {
  title: string;
  subtitle: string;
  layout: PolicyLayout;
  sections: PolicySection[] | null;
  prose: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt?: string | null;
}

/**
 * Legacy fallback: before the policy pages moved into Admin -> CMS, these
 * four texts lived in Admin -> Settings. If the matching CMS page does not
 * exist yet (e.g. production before the seed migration runs), the settings
 * text is rendered so the page never breaks.
 */
const SETTINGS_FALLBACK: Record<
  string,
  { title: string; subtitle: string; field: 'privacyPolicy' | 'termsPolicy' | 'shippingPolicy' | 'refundPolicy' }
> = {
  'privacy-policy': { title: 'Privacy Policy', subtitle: 'Information handled by this Shlokveda storefront.', field: 'privacyPolicy' },
  'terms-and-conditions': { title: 'Terms & Conditions', subtitle: 'Please review product and order information before proceeding.', field: 'termsPolicy' },
  'shipping-policy': { title: 'Shipping & Delivery', subtitle: 'Delivery charges are calculated at checkout.', field: 'shippingPolicy' },
  'refund-policy': { title: 'Returns, Cancellations & Refunds', subtitle: 'Please review the store terms before making a purchase.', field: 'refundPolicy' },
};

const AYUSH_FALLBACK: ResolvedPolicy = {
  title: 'Product Information Notice',
  subtitle: 'Product detail shown on this site is based on the supplied brochure.',
  layout: 'prose',
  sections: null,
  prose:
    'Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.\n\nThis catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.',
};

async function resolvePolicy(slug: string, business?: BusinessSettings): Promise<ResolvedPolicy | null> {
  const page = await CMSRepository.findStaticPageBySlug(slug).catch(() => null);
  if (page) {
    const layout = (['prose', 'list', 'grid', 'cards', 'accordion'].includes(String(page.layout))
      ? page.layout
      : 'prose') as PolicyLayout;
    return {
      title: page.title,
      subtitle: page.metaDescription || '',
      layout,
      sections: page.sections && page.sections.length ? page.sections : null,
      prose: page.content || '',
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      updatedAt: page.updatedAt,
    };
  }
  const fallback = SETTINGS_FALLBACK[slug];
  if (fallback) {
    const settings = business ?? (await settingsRepository.getBusinessSettings());
    return {
      title: fallback.title,
      subtitle: fallback.subtitle,
      layout: 'prose',
      sections: null,
      prose: settings[fallback.field] || '',
    };
  }
  if (slug === 'ayush-compliance') return AYUSH_FALLBACK;
  return null;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const policy = await resolvePolicy(params.slug);
  if (!policy) {
    return { title: 'Page Not Found | Shlokveda', robots: { index: false, follow: false } };
  }
  const title = policy.metaTitle || `${policy.title} | Shlokveda`;
  const description = policy.metaDescription || policy.subtitle || undefined;
  return {
    title,
    description,
    alternates: { canonical: `/policies/${params.slug}` },
    openGraph: { title, description, url: `/policies/${params.slug}`, siteName: 'Shlokveda', type: 'website' },
  };
}

/** Hero eyebrow icon per well-known slug (decorative). */
const HERO_ICONS: Record<string, string> = {
  'shipping-policy': 'Truck',
  'refund-policy': 'RotateCcw',
  'privacy-policy': 'ShieldCheck',
  'terms-and-conditions': 'Scale',
  disclaimer: 'BookOpen',
  faq: 'CircleHelp',
  'ayush-compliance': 'Leaf',
};

/** Botanical still-life shown beside list-layout sections (decorative). */
const LIST_VISUALS: Record<string, string> = {
  'shipping-policy': '/banners/hero-wellness.webp',
  'privacy-policy': '/banners/product-info-scene.webp',
  'ayush-compliance': '/banners/category-botanical-bg.webp',
};

const BG_PHOTO = "bg-[url('/banners/highlights-botanical-bg.webp')]";

/**
 * Restrained photographic foliage at the page corners — legal copy stays on
 * clean ivory, leaves never sit under text. Decorative only.
 */
function PolicyBackdrop() {
  const corner =
    'pointer-events-none absolute h-72 w-72 bg-[size:155%_auto] bg-no-repeat sm:h-96 sm:w-96';
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_30%_at_50%_0%,rgba(217,190,140,0.2),transparent_72%)]" />
      <div aria-hidden="true" className={`${corner} -left-16 -top-16 origin-top-left ${BG_PHOTO} bg-[position:0%_0%] opacity-40 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_8%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_12s_ease-in-out_infinite_alternate]`} />
      <div aria-hidden="true" className={`${corner} -right-16 -top-16 origin-top-right ${BG_PHOTO} bg-[position:100%_0%] opacity-40 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_8%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_11s_ease-in-out_infinite_alternate]`} style={{ animationDelay: '0.8s' }} />
      <div aria-hidden="true" className={`${corner} -bottom-16 -left-16 hidden origin-bottom-left ${BG_PHOTO} bg-[position:0%_100%] opacity-35 [mask-image:radial-gradient(ellipse_88%_88%_at_8%_92%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_12s_ease-in-out_infinite_alternate] sm:block`} style={{ animationDelay: '1.3s' }} />
      <div aria-hidden="true" className={`${corner} -bottom-16 -right-16 hidden origin-bottom-right ${BG_PHOTO} bg-[position:100%_100%] opacity-35 [mask-image:radial-gradient(ellipse_88%_88%_at_92%_92%,black_40%,transparent_74%)] motion-safe:animate-[leaf-sway_11.5s_ease-in-out_infinite_alternate] sm:block`} style={{ animationDelay: '0.4s' }} />
    </>
  );
}

/** Two-tone serif title: final word in gold ("Shipping & Delivery" -> Delivery gold). */
function TwoToneTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return <>{title}</>;
  const last = words[words.length - 1];
  const head = words.slice(0, -1).join(' ');
  return (
    <>
      {head} <span className="text-[#A67C2E]">{last}</span>
    </>
  );
}

/** Admin-entered text rendered as plain paragraphs — never raw HTML. */
function Paragraphs({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-gray-600">
          {paragraph.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

function IconDisc({ icon, size = 'md' }: { icon?: string; size?: 'md' | 'lg' }) {
  const Icon = getPolicyIcon(icon);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#EAF3EC] text-[#1B4332] ring-1 ring-[#2D6A4F]/15 transition-transform duration-300 motion-safe:group-hover:scale-105 ${
        size === 'lg' ? 'h-14 w-14' : 'h-12 w-12'
      }`}
    >
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </span>
  );
}

type FormatFn = (text: string) => string;

function ListLayout({ sections, slug, format }: { sections: PolicySection[]; slug: string; format: FormatFn }) {
  const visual = LIST_VISUALS[slug] || '/banners/contact-botanical-bg.webp';
  return (
    <section aria-label="Policy details" className="overflow-hidden rounded-[2rem] border border-[#EFE7D8] bg-white shadow-[0_24px_60px_-32px_rgba(27,67,50,0.35)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="divide-y divide-[#F3EFE6] p-6 sm:p-10">
          {sections.map((section, index) => (
            <Reveal key={index} delay={index * 90}>
              <div className={`group flex gap-4 sm:gap-5 ${index === 0 ? 'pb-7' : index === sections.length - 1 ? 'pt-7' : 'py-7'}`}>
                <IconDisc icon={section.icon} />
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-bold text-[#1B4332] sm:text-xl">{format(section.heading)}</h2>
                  <Paragraphs text={format(section.body)} className="mt-2" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div aria-hidden="true" className="relative hidden min-h-[320px] lg:block">
          <Image src={visual} alt="" fill sizes="320px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}

function GridLayout({ sections, format }: { sections: PolicySection[]; format: FormatFn }) {
  return (
    <section aria-label="Policy details" className="grid gap-5 sm:grid-cols-2 sm:gap-6">
      {sections.map((section, index) => (
        <Reveal key={index} delay={index * 90}>
          <article className="group h-full rounded-[1.75rem] border border-[#EFE7D8] bg-white p-6 shadow-[0_20px_45px_-30px_rgba(27,67,50,0.35)] transition-shadow duration-300 hover:shadow-[0_28px_55px_-30px_rgba(27,67,50,0.45)] sm:p-8">
            <IconDisc icon={section.icon} />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#1B4332] sm:text-xl">{format(section.heading)}</h2>
            <Paragraphs text={format(section.body)} className="mt-2" />
          </article>
        </Reveal>
      ))}
    </section>
  );
}

function CardsLayout({ sections, format }: { sections: PolicySection[]; format: FormatFn }) {
  // First three sections form the card row; any further sections render as
  // full-width assistance panels (e.g. "For Assistance" on the refund page).
  const cards = sections.slice(0, 3);
  const panels = sections.slice(3);
  return (
    <section aria-label="Policy details" className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3 md:gap-6">
        {cards.map((section, index) => (
          <Reveal key={index} delay={index * 100}>
            <article className="group flex h-full flex-col items-center rounded-[1.75rem] border border-[#EFE7D8] bg-white p-6 text-center shadow-[0_20px_45px_-30px_rgba(27,67,50,0.35)] transition-shadow duration-300 hover:shadow-[0_28px_55px_-30px_rgba(27,67,50,0.45)] sm:p-8">
              <IconDisc icon={section.icon} size="lg" />
              <h2 className="mt-4 font-serif text-lg font-bold text-[#1B4332] sm:text-xl">{format(section.heading)}</h2>
              <Paragraphs text={format(section.body)} className="mt-2" />
            </article>
          </Reveal>
        ))}
      </div>
      {panels.map((section, index) => {
        const Icon = getPolicyIcon(section.icon);
        return (
          <Reveal key={cards.length + index} delay={120}>
            <article className="flex flex-col gap-4 rounded-[1.75rem] border border-[#EFE7D8] bg-white p-6 shadow-[0_20px_45px_-30px_rgba(27,67,50,0.35)] sm:flex-row sm:items-center sm:gap-6 sm:p-8">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1B4332] text-[#D9BE8C]">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg font-bold text-[#1B4332] sm:text-xl">{format(section.heading)}</h2>
                <Paragraphs text={format(section.body)} className="mt-1" />
              </div>
            </article>
          </Reveal>
        );
      })}
    </section>
  );
}

function AccordionLayout({ sections, format }: { sections: PolicySection[]; format: FormatFn }) {
  return (
    <section aria-label="Questions and answers" className="space-y-4">
      {sections.map((section, index) => (
        <Reveal key={index} delay={index * 80}>
          <details
            open={index === 0}
            className="group rounded-[1.5rem] border border-[#EFE7D8] bg-white shadow-[0_18px_40px_-30px_rgba(27,67,50,0.35)] transition-shadow duration-300 open:shadow-[0_26px_50px_-30px_rgba(27,67,50,0.45)]"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 rounded-[1.5rem] p-5 outline-none transition-colors hover:bg-[#FAF7F2] focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 sm:p-6 [&::-webkit-details-marker]:hidden">
              <IconDisc icon={section.icon} />
              <h2 className="min-w-0 flex-1 font-serif text-base font-bold text-[#1B4332] sm:text-lg">{format(section.heading)}</h2>
              <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-[#A67C2E] transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="border-t border-[#F3EFE6] px-5 pb-6 pt-4 sm:px-6 sm:pl-[5.5rem]">
              <Paragraphs text={format(section.body)} />
            </div>
          </details>
        </Reveal>
      ))}
    </section>
  );
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = params;
  const business = await settingsRepository.getBusinessSettings();
  const policy = await resolvePolicy(slug, business);
  if (!policy) notFound();

  const format: FormatFn = (text) => text
    .replaceAll('{{baseShippingFee}}', String(business.baseShippingFee))
    .replaceAll('{{freeShippingThreshold}}', String(business.freeShippingThreshold))
    .replaceAll('{{phone}}', business.phone);

  const HeroIcon = getPolicyIcon(HERO_ICONS[slug] || 'BookOpen');
  const updatedLabel = policy.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="relative overflow-hidden bg-[#FAF7F2]">
      <PolicyBackdrop />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="rounded transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]">Home</Link>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-[#C5A880]" />
          <span aria-current="page" className="font-bold text-[#1B4332]">{policy.title}</span>
        </nav>

        <Reveal>
          <header className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#EFE7D8] shadow-[0_30px_70px_-35px_rgba(27,67,50,0.45)]">
            <div aria-hidden="true" className={`absolute inset-0 ${BG_PHOTO} bg-cover bg-[position:70%_center]`} />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/92 to-[#FAF7F2]/35" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2]/70 via-transparent to-transparent" />
            <div className="relative px-6 py-10 sm:px-12 sm:py-14">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#A67C2E]">
                <HeroIcon aria-hidden="true" className="h-4 w-4" /> Store Policy
              </p>
              <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[1.08] text-[#1B4332] sm:text-5xl sm:leading-[1.08]">
                <TwoToneTitle title={policy.title} />
              </h1>
              <div aria-hidden="true" className="mt-5 flex items-center gap-2">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C5A880]" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[#C5A880]" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#C5A880]" />
              </div>
              {policy.subtitle && (
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">{format(policy.subtitle)}</p>
              )}
              {updatedLabel && (
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Last updated {updatedLabel}</p>
              )}
            </div>
          </header>
        </Reveal>

        <div className="mt-8 sm:mt-10">
          {policy.sections ? (
            policy.layout === 'grid' ? (
              <GridLayout sections={policy.sections} format={format} />
            ) : policy.layout === 'cards' ? (
              <CardsLayout sections={policy.sections} format={format} />
            ) : policy.layout === 'accordion' ? (
              <AccordionLayout sections={policy.sections} format={format} />
            ) : (
              <ListLayout sections={policy.sections} slug={slug} format={format} />
            )
          ) : (
            <Reveal>
              <section aria-label="Policy details" className="rounded-[2rem] border border-[#EFE7D8] bg-white p-6 shadow-[0_24px_60px_-32px_rgba(27,67,50,0.35)] sm:p-10">
                <Paragraphs text={format(policy.prose)} />
              </section>
            </Reveal>
          )}
        </div>

        <Reveal delay={100}>
          <div className="pt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full text-xs font-bold text-[#1B4332] underline decoration-[#C5A880] decoration-2 underline-offset-4 transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Return to storefront
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
