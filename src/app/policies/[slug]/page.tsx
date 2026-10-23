import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { settingsRepository } from '@/repositories/settings.repository';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface PolicyPageProps {
  params: { slug: string };
}

export const dynamic = 'force-dynamic';

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = params;
  const business = await settingsRepository.getBusinessSettings();
  const freeShippingThreshold = business.freeShippingThreshold;
  const baseShippingFee = business.baseShippingFee;

  const formatPolicy = (text: string) => text
    .replaceAll('{{baseShippingFee}}', String(baseShippingFee))
    .replaceAll('{{freeShippingThreshold}}', String(freeShippingThreshold))
    .replaceAll('{{phone}}', business.phone);

  const policyBody = (text: string) => (
    <div className="space-y-4 text-sm leading-relaxed text-gray-700">
      {formatPolicy(text).split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
  );

  const policies: Record<string, { title: string; subtitle: string; content: React.ReactNode }> = {
    'privacy-policy': {
      title: 'Privacy Policy',
      subtitle: 'Information handled by this Shlokveda storefront.',
      content: policyBody(business.privacyPolicy || ''),
    },
    'terms-and-conditions': {
      title: 'Terms & Conditions',
      subtitle: 'Please review product and order information before proceeding.',
      content: policyBody(business.termsPolicy || ''),
    },
    'shipping-policy': {
      title: 'Shipping & Delivery',
      subtitle: 'Delivery charges are calculated at checkout.',
      content: policyBody(business.shippingPolicy || ''),
    },
    'refund-policy': {
      title: 'Returns, Cancellations & Refunds',
      subtitle: 'Please review the store terms before making a purchase.',
      content: policyBody(business.refundPolicy || ''),
    },
    'ayush-compliance': {
      title: 'Product Information Notice',
      subtitle: 'Product detail shown on this site is based on the supplied brochure.',
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <p>Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.</p>
          <p>This catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.</p>
        </div>
      ),
    },
  };

  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#1B4332]">Home</Link><span>/</span>
        <span className="font-bold text-gray-900">{policy.title}</span>
      </div>
      <header className="space-y-3 rounded-3xl border border-[#F3EFE6] bg-[#FAF7F2] p-6 sm:p-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B08968]"><BookOpen className="h-4 w-4" /> Store policy</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900">{policy.title}</h1>
        <p className="text-sm text-gray-600">{policy.subtitle}</p>
      </header>
      <section className="rounded-3xl border border-[#F3EFE6] bg-white p-6 sm:p-10">{policy.content}</section>
      <div className="text-center pt-2">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#1B4332] underline hover:text-[#2D6A4F]"><ArrowLeft className="h-3.5 w-3.5" /> Return to storefront</Link>
      </div>
    </div>
  );
}
