'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '@/types';
import { Settings, Save, CheckCircle2, AlertCircle, Building, Phone, ShieldCheck, UploadCloud } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [storeName, setStoreName] = useState('Shlokveda');
  const [gstin, setGstin] = useState('09ANCPV6879P1ZP');
  const [phone, setPhone] = useState('7017840020');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('B.H Oil Meal Road, Next to Bank of Maharashtra');
  const [addressLine2, setAddressLine2] = useState('Dobra Bal Colony');
  const [city, setCity] = useState('Hathras');
  const [state, setState] = useState('Uttar Pradesh');
  const [postalCode, setPostalCode] = useState('204101');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [baseShippingFee, setBaseShippingFee] = useState(50);
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [enableCod, setEnableCod] = useState(true);
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [logoUploading, setLogoUploading] = useState(false);
  const [aboutShowcaseImageUrl, setAboutShowcaseImageUrl] = useState('');
  const [showcaseUploading, setShowcaseUploading] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    'Authentic Ayurvedic Products | Free shipping on orders of ₹499 & above | Tradition for a Healthier Tomorrow'
  );
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [termsPolicy, setTermsPolicy] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.data) {
          const s = data.data;
          setSettings(s);
          setStoreName(s.storeName);
          setGstin(s.gstin);
          setPhone(s.phone);
          setEmail(s.email);
          setAddressLine1(s.addressLine1);
          setAddressLine2(s.addressLine2 || '');
          setCity(s.city);
          setState(s.state);
          setPostalCode(s.postalCode);
          setFreeShippingThreshold(s.freeShippingThreshold);
          setBaseShippingFee(s.baseShippingFee);
          setTaxIncluded(s.taxIncluded !== false);
          setEnableCod(s.enableCod);
          setAnnouncementText(s.announcementText || '');
          setPrivacyPolicy(s.privacyPolicy || '');
          setTermsPolicy(s.termsPolicy || '');
          setShippingPolicy(s.shippingPolicy || '');
          setRefundPolicy(s.refundPolicy || '');
          setLogoUrl(s.logoUrl || '/logo.png');
          setAboutShowcaseImageUrl(s.aboutShowcaseImageUrl || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Logo must be a JPG, PNG, or WEBP image up to 5 MB.' }); return;
    }
    setLogoUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/admin/uploads', { method: 'POST', body }); const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Logo upload failed');
      setLogoUrl(result.data.url); setMsg({ type: 'success', text: 'Logo uploaded. Save settings to publish it.' });
    } catch (error: any) { setMsg({ type: 'error', text: error.message || 'Logo upload failed.' }); } finally { setLogoUploading(false); }
  };

  const handleShowcaseUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Showcase image must be a JPG, PNG, or WEBP image up to 5 MB.' }); return;
    }
    setShowcaseUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/admin/uploads', { method: 'POST', body }); const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Showcase image upload failed');
      setAboutShowcaseImageUrl(result.data.url); setMsg({ type: 'success', text: 'Showcase image uploaded. Save settings to publish it.' });
    } catch (error: any) { setMsg({ type: 'error', text: error.message || 'Showcase image upload failed.' }); } finally { setShowcaseUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          gstin: gstin.trim(),
          phone: phone.trim(),
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          freeShippingThreshold: Number(freeShippingThreshold),
          baseShippingFee: Number(baseShippingFee),
          taxIncluded,
          enableCod,
          announcementText: announcementText.trim() || undefined,
          privacyPolicy: privacyPolicy.trim() || undefined,
          termsPolicy: termsPolicy.trim() || undefined,
          shippingPolicy: shippingPolicy.trim() || undefined,
          refundPolicy: refundPolicy.trim() || undefined,
          logoUrl,
          // Always send (even empty) so clearing the field removes the custom image.
          aboutShowcaseImageUrl: aboutShowcaseImageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }

      setMsg({ type: 'success', text: 'Hathras business profile updated successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Hathras Business Profile & Commerce Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure enterprise legal details, Hathras location, and logistics parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#2D6A4F] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
          <h2 className="font-serif text-lg font-bold text-gray-900">Store Logo</h2>
          <p className="text-xs text-gray-500 mt-1">Upload a JPG, PNG, or WEBP logo. It will appear in the storefront header and footer.</p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <div className="h-28 w-28 rounded-xl border bg-[#FAF7F2] p-2"><img src={logoUrl} alt="Current store logo" className="h-full w-full object-contain" /></div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2D6A4F]">
              <UploadCloud className="h-4 w-4" /> {logoUploading ? 'Uploading...' : 'Choose Logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={logoUploading} onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
            </label>
          </div>
        </div>
        {/* ABOUT PAGE SHOWCASE IMAGE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
          <h2 className="font-serif text-lg font-bold text-gray-900">About Page Showcase Image</h2>
          <p className="text-xs text-gray-500 mt-1">This is the large image shown beside &ldquo;How this catalogue is put together&rdquo; on the About page. Upload your own image (a wide 4:3 landscape image works best), or paste an image URL. Leave it empty to use the built-in Triphala Ras scene.</p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <div className="relative aspect-[4/3] w-72 max-w-full overflow-hidden rounded-xl border bg-[#FAF7F2]">
              {aboutShowcaseImageUrl.trim() ? (
                <img src={aboutShowcaseImageUrl.trim()} alt="Custom About page showcase" className="h-full w-full object-cover" />
              ) : (
                <>
                  <img src="/stages/stage-showcase.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                  <img src="/products/pdf-p5-i3.webp" alt="Built-in showcase: Triphala Ras pack on the catalogue stage" className="absolute inset-0 h-full w-full object-contain p-4 mix-blend-multiply" />
                </>
              )}
            </div>
            <div className="min-w-64 flex-1 space-y-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2D6A4F]">
                <UploadCloud className="h-4 w-4" /> {showcaseUploading ? 'Uploading...' : 'Choose Image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={showcaseUploading} onChange={(e) => { if (e.target.files?.[0]) handleShowcaseUpload(e.target.files[0]); }} />
              </label>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Or paste image URL</label>
                <input
                  type="text"
                  value={aboutShowcaseImageUrl}
                  onChange={(e) => setAboutShowcaseImageUrl(e.target.value)}
                  placeholder="https://... or /stages/stage-showcase.webp"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
              {aboutShowcaseImageUrl.trim() && (
                <button type="button" onClick={() => setAboutShowcaseImageUrl('')} className="text-xs font-bold text-red-600 underline underline-offset-2 hover:text-red-700">
                  Remove custom image (use built-in scene)
                </button>
              )}
              <p className="text-[11px] text-gray-400">Changes appear on the About page after you click Save Settings.</p>
            </div>
          </div>
        </div>
        {/* BUSINESS LEGAL ENTITY */}
        <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1B4332]" />
            <span>Legal Business Entity</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Business / Enterprise Legal Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                GSTIN / UIN Identifier *
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Helpline Phone *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* HATHRAS ADDRESS */}
        <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1B4332]" />
            <span>Hathras Physical Facility Address</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Street / Facility Road *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Colony / Landmark
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* LOGISTICS & ANNOUNCEMENT BANNER */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">
            Logistics Parameters & Header Notice
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Base Courier Shipping Fee (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
              />
            </div>

            <label className="sm:col-span-3 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 cursor-pointer">
              <input type="checkbox" checked={taxIncluded} onChange={(e) => setTaxIncluded(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1B4332]" />
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-800">Taxes & GST included in listed prices</span>
                <span className="block mt-1 text-xs text-gray-600">When enabled, checkout shows GST as included and does not add an extra tax amount. Confirm this setting with the business tax owner.</span>
              </span>
            </label>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Top Announcement Bar Message
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* EDITABLE STORE POLICIES */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900">Store Policies</h2>
            <p className="text-xs text-gray-500 mt-1">Edit the policy text displayed on the public policy pages. Separate paragraphs with a blank line. Use {'{{baseShippingFee}}'}, {'{{freeShippingThreshold}}'}, and {'{{phone}}'} as dynamic placeholders where needed.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              ['Privacy Policy', privacyPolicy, setPrivacyPolicy],
              ['Terms & Conditions', termsPolicy, setTermsPolicy],
              ['Shipping & Delivery Policy', shippingPolicy, setShippingPolicy],
              ['Return & Refund Policy', refundPolicy, setRefundPolicy],
            ].map(([label, value, setter]) => (
              <div key={label as string}>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">{label as string}</label>
                <textarea rows={7} value={value as string} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
