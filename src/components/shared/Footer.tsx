'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Facebook,
  Instagram,
  Leaf,
  Link2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Youtube,
} from 'lucide-react';
import { NewsletterForm } from './NewsletterForm';

interface FooterCategory {
  slug: string;
  name: string;
}

const FALLBACK_CATEGORIES: FooterCategory[] = [
  { slug: 'syrups-juices', name: 'Syrups & Juices' },
  { slug: 'arks-drops', name: 'Arks & Drops' },
  { slug: 'herbal-oils', name: 'Herbal Oils' },
  { slug: 'herbal-capsules', name: 'Herbal Capsules' },
  { slug: 'tablets', name: 'Tablets' },
  { slug: 'daily-wellness', name: 'Daily Wellness' },
  { slug: 'immunity-rasayana', name: 'Immunity & Rasayana' },
  { slug: 'personal-care', name: 'Personal Care' },
];

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/#categories', label: 'Shop by Category' },
  { href: '/shop', label: 'Browse Catalogue' },
  { href: '/about', label: 'About Shlokveda' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/login', label: 'Customer Portal' },
  { href: '/account', label: 'My Account' },
] as const;

const POLICY_LINKS = [
  { href: '/policies/shipping-policy', label: 'Shipping & Delivery Policy' },
  { href: '/policies/refund-policy', label: 'Return & Refund Policy' },
  { href: '/policies/privacy-policy', label: 'Privacy Policy' },
  { href: '/policies/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/policies/disclaimer', label: 'Disclaimer' },
  { href: '/policies/faq', label: 'FAQ' },
] as const;

// Razorpay is the store's configured gateway; these are the methods it
// presents at checkout. Rendered as text badges (no fabricated logo art).
const PAYMENT_METHODS = ['Razorpay', 'UPI', 'VISA', 'Mastercard', 'RuPay', 'COD'] as const;

const headingClass =
  'flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#C5A880]';
const linkClass =
  'inline-block text-[13px] text-gray-300 transition-all hover:text-white motion-safe:hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A880] rounded-sm';

export function Footer() {
  const [settings, setSettings] = useState({
    storeName: 'Shlokveda', gstin: '09ANCPV6879P1ZP', phone: '7017840020',
    addressLine1: 'B.H Oil Meal Road, Next to Bank of Maharashtra', addressLine2: 'Dobra Bal Colony',
    city: 'Hathras', state: 'Uttar Pradesh', postalCode: '204101', email: '', logoUrl: '/logo.png',
    facebookUrl: '', instagramUrl: '', youtubeUrl: '',
  });
  const [categories, setCategories] = useState<FooterCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setSettings((current) => ({ ...current, ...data.data }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        const active = list
          .filter((c: any) => c?.slug && c?.name && c.isActive !== false)
          .map((c: any) => ({ slug: String(c.slug), name: String(c.name) }))
          .slice(0, 8);
        if (active.length > 0) setCategories(active);
      })
      .catch(() => {});
  }, []);

  const socialLinks = [
    { label: 'Instagram', href: settings.instagramUrl, Icon: Instagram },
    { label: 'Facebook', href: settings.facebookUrl, Icon: Facebook },
    { label: 'YouTube', href: settings.youtubeUrl, Icon: Youtube },
  ].filter((social) => Boolean(social.href));

  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-[#C5A880]/25 bg-[#0C2B1E] text-gray-300">
      {/* Botanical photographic backdrop (decorative) — leaves frame the edges, centre stays plain for text */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/banners/footer-botanical-bg.webp')] bg-cover bg-center" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#0C2B1E]/45" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {/* Column 1: Brand & Contact */}
          <div className="space-y-5 lg:col-span-2">
            <div className="flex items-center gap-3.5">
              <Image
                src={settings.logoUrl}
                alt={`${settings.storeName} logo`}
                width={96}
                height={96}
                className="h-14 w-14 shrink-0 object-contain"
              />
              <span>
                <span className="block font-serif text-[26px] font-bold leading-none tracking-tight text-white">
                  {settings.storeName.toUpperCase()}
                </span>
                <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C5A880]">
                  Tradition for a Healthier Tomorrow
                </span>
              </span>
            </div>

            <p className="max-w-sm text-[13px] leading-relaxed text-gray-400">
              A calm, easy-to-browse catalogue of Ayurvedic products. Product
              names, pack sizes, listed MRPs, and available package photography
              are presented using information from the supplied brochure.
            </p>

            <address className="space-y-2.5 text-[13px] not-italic text-gray-300">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C5A880]" aria-hidden="true" />
                <span>
                  {settings.addressLine1}, {settings.addressLine2}, {settings.city},{' '}
                  {settings.state} {settings.postalCode}
                </span>
              </p>
              {settings.phone && (
                <p className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[#C5A880]" aria-hidden="true" />
                  <a href={`tel:+91${settings.phone}`} className="transition-colors hover:text-white">
                    +91 {settings.phone}
                  </a>
                </p>
              )}
              {settings.email && (
                <p className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#C5A880]" aria-hidden="true" />
                  <a href={`mailto:${settings.email}`} className="break-all transition-colors hover:text-white">
                    {settings.email}
                  </a>
                </p>
              )}
            </address>

            {socialLinks.length > 0 && (
              <ul className="flex items-center gap-2.5" aria-label="Social media links">
                {socialLinks.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${settings.storeName} on ${label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-gray-300 transition-colors hover:border-[#C5A880] hover:text-[#C5A880] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880]"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {settings.gstin && (
              <p>
                <span className="inline-block rounded-full border border-[#C5A880]/60 px-4 py-1.5 font-mono text-[11px] tracking-wide text-[#C5A880]">
                  GSTIN / UIN:&nbsp;&nbsp;{settings.gstin}
                </span>
              </p>
            )}
          </div>

          {/* Column 2: Our Categories (live catalogue) */}
          <nav aria-label="Product categories" className="space-y-4">
            <h4 className={headingClass}>
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              Our Categories
            </h4>
            <ul className="space-y-2.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/category/${category.slug}`} className={linkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className={linkClass}>
                  All Products
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Quick Links */}
          <nav aria-label="Quick links" className="space-y-4">
            <h4 className={headingClass}>
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Trust & Policies */}
          <nav aria-label="Trust and policies" className="space-y-4">
            <h4 className={headingClass}>
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Trust &amp; Policies
            </h4>
            <ul className="space-y-2.5">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* NEWSLETTER + SECURE PAYMENTS */}
        <div className="mt-14 grid items-center gap-8 border-t border-white/10 pt-10 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="shrink-0">
                <h4 className="flex items-center gap-2 font-serif text-lg font-bold text-white">
                  <Leaf className="h-4 w-4 text-[#C5A880]" aria-hidden="true" />
                  Stay Updated
                </h4>
                <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-gray-400">
                  Get the latest updates, offers and Ayurvedic wellness tips.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5A880]/15 text-[#C5A880]" aria-hidden="true">
                <Lock className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-white">Secure Payments</span>
                <span className="block text-[11px] text-gray-400">
                  Payments are processed securely via Razorpay.
                </span>
              </span>
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
              {PAYMENT_METHODS.map((method) => (
                <li
                  key={method}
                  className="rounded-md bg-white px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide text-gray-700 shadow-sm"
                >
                  {method}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR (extra bottom padding clears the mobile navigation) */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pb-24 pt-5 text-center text-[11px] text-gray-400 md:pb-6 lg:flex-row lg:text-left">
          <p>
            © {year} SHLOKVEDA. All Rights Reserved. {settings.city}, {settings.state}, India.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/policies/terms-and-conditions" className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
            <span aria-hidden="true" className="text-white/20">|</span>
            <Link href="/policies/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-white/20">|</span>
            <Link href="/policies/shipping-policy" className="transition-colors hover:text-white">
              Shipping Policy
            </Link>
          </nav>
          <p className="flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-[#C5A880]" aria-hidden="true" />
            Product details sourced from the supplied brochure.
          </p>
        </div>
      </div>
    </footer>
  );
}
