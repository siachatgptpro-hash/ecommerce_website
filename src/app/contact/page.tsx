import { Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { SettingsRepository } from '@/repositories/settings.repository';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactCard } from '@/components/contact/ContactCard';
import { CatalogueCta } from '@/components/contact/CatalogueCta';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await SettingsRepository.getBusinessSettings();

  const addressParts = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    `${settings.state} ${settings.postalCode}`.trim(),
    'India',
  ].filter(Boolean);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(', '))}`;

  const digits = (settings.phone || '').replace(/\D/g, '');
  const telHref = digits ? `tel:${digits.length === 10 ? '+91' : '+'}${digits}` : null;

  return (
    <main className="relative overflow-hidden bg-[#FAF7F2]">
      {/* Botanical photographic backdrop + ivory wash + ambient gold drift */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/banners/highlights-botanical-bg.webp')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,247,242,0.62),rgba(250,247,242,0.78)_45%,#FAF7F2_88%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_0%,rgba(217,190,140,0.22),transparent_70%)] motion-safe:animate-[banner-drift_18s_ease-in-out_infinite_alternate]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ContactHero storeName={settings.storeName} />

        <section aria-label="Contact details" className="mt-11 grid grid-cols-1 gap-5 sm:mt-12 md:grid-cols-2 sm:gap-6">
          <ContactCard icon={MapPin} title="Address" delay={0.12}>
            <address className="flex gap-2.5 not-italic text-sm leading-relaxed text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#B08968]" aria-hidden="true" />
              <span>
                {settings.addressLine1},<br />
                {settings.addressLine2 ? `${settings.addressLine2}, ` : ''}{settings.city},<br />
                {settings.state} {settings.postalCode}, India
              </span>
            </address>
            {settings.addressLine1 && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions to the store address (opens Google Maps)"
                className="mt-5 inline-flex items-center gap-1.5 rounded text-sm font-bold text-[#1B4332] underline decoration-[#C5A880] decoration-2 underline-offset-4 transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Get Directions
              </a>
            )}
          </ContactCard>

          <ContactCard icon={Phone} title="Phone" delay={0.24}>
            {telHref ? (
              <>
                <a
                  href={telHref}
                  className="inline-flex items-center gap-2 rounded text-base font-bold text-[#0F281E] underline decoration-[#C5A880] decoration-2 underline-offset-4 transition-colors hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Phone className="h-4 w-4 text-[#B08968]" aria-hidden="true" />
                  +91 {settings.phone}
                </a>
                <p className="mt-3.5 text-sm leading-relaxed text-gray-600">
                  For product and order enquiries, contact our support team.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Phone support is not currently configured.</p>
            )}
            <p className="mt-2 text-xs text-gray-500">No online inquiry form is active on this preview.</p>
          </ContactCard>

          {settings.email && (
            <ContactCard icon={Mail} title="Email" delay={0.3}>
              <a
                href={`mailto:${settings.email}`}
                className="break-all rounded text-sm font-semibold text-[#1B4332] underline decoration-[#C5A880] decoration-2 underline-offset-4 transition-colors hover:text-[#2D6A4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {settings.email}
              </a>
            </ContactCard>
          )}
        </section>

        <div className="mt-8 sm:mt-10">
          <CatalogueCta />
        </div>
      </div>
    </main>
  );
}
