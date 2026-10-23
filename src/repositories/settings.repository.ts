// ==============================================================================
// BUSINESS SETTINGS REPOSITORY — SHLOKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';
import { BusinessSetting, BusinessSettings } from '@/types';

export class SettingsRepository {
  public static async get(key: string): Promise<string | null> {
    if (isPostgresConfigured()) {
      const result = await pgQuery('SELECT "value" FROM "BusinessSetting" WHERE "key"=$1 LIMIT 1', [key]);
      return result.rows[0]?.value ?? null;
    }
    const s = db.businessSettings.get(key);
    return s ? s.value : null;
  }

  public static async getAll(publicOnly = false): Promise<Record<string, string>> {
    if (isPostgresConfigured()) {
      const result = await pgQuery(`SELECT "key","value" FROM "BusinessSetting" ${publicOnly ? 'WHERE "isPublic"=TRUE' : ''}`);
      return Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
    }
    const res: Record<string, string> = {};
    for (const setting of db.businessSettings.values()) {
      if (!publicOnly || setting.isPublic) {
        res[setting.key] = setting.value;
      }
    }
    return res;
  }

  public static async getBusinessSettings(): Promise<BusinessSettings> {
    const all = await this.getAll();
    // Legacy aliases (BUSINESS_*, DEFAULT_SHIPPING_FEE, COD_ENABLED) are still
    // honoured so databases seeded before the key unification keep working.
    const value = (key: string, fallback: string, legacyKey?: string) =>
      all[key] !== undefined ? all[key] : legacyKey && all[legacyKey] !== undefined ? all[legacyKey] : fallback;
    return {
      storeName: value('STORE_NAME', 'Shlokveda', 'BUSINESS_NAME'),
      gstin: value('GSTIN', '09ANCPV6879P1ZP', 'BUSINESS_GSTIN'),
      phone: value('PHONE', '7017840020', 'BUSINESS_PHONE'),
      email: value('EMAIL', '', 'SUPPORT_EMAIL'),
      addressLine1: value('ADDRESS_LINE1', 'B.H Oil Meal Road, Next to Bank of Maharashtra', 'BUSINESS_ADDRESS_LINE1'),
      addressLine2: value('ADDRESS_LINE2', 'Dobra Bal Colony', 'BUSINESS_ADDRESS_LINE2'),
      city: value('CITY', 'Hathras', 'BUSINESS_CITY'),
      state: value('STATE', 'Uttar Pradesh', 'BUSINESS_STATE'),
      postalCode: value('POSTAL_CODE', '204101', 'BUSINESS_PINCODE'),
      freeShippingThreshold: Number(all['FREE_SHIPPING_THRESHOLD'] ?? 499),
      baseShippingFee: Number(all['BASE_SHIPPING_FEE'] ?? all['DEFAULT_SHIPPING_FEE'] ?? 50),
      taxIncluded: all['TAX_INCLUDED'] !== 'false',
      // Online-payment-only unless an admin explicitly enables COD.
      enableCod: (all['ENABLE_COD'] ?? all['COD_ENABLED']) === 'true',
      announcementText: value('ANNOUNCEMENT_TEXT', 'Authentic Ayurvedic Products | Free shipping on orders of ₹499 & above | Tradition for a Healthier Tomorrow'),
      logoUrl: value('LOGO_URL', '/logo.png'),
      aboutShowcaseImageUrl: value('ABOUT_SHOWCASE_IMAGE_URL', ''),
      privacyPolicy: value('POLICY_PRIVACY', 'Checkout may collect your name, email address, phone number and delivery address. Registration also collects account details.\n\nOnline payment processing is available only when a valid payment gateway is configured. This storefront does not store card or UPI credentials.'),
      termsPolicy: value('POLICY_TERMS', 'Product names, pack options and printed MRPs are transcribed from the supplied brochure. The checkout recalculates prices and availability from the current server catalogue before placing an order.\n\nCatalogue content is informational, may not include every package detail and is not medical advice. Read the product label and consult a qualified healthcare professional where appropriate.'),
      shippingPolicy: value('POLICY_SHIPPING', 'The current checkout applies a ₹{{baseShippingFee}} delivery fee below ₹{{freeShippingThreshold}} and waives that fee at or above the configured threshold. The final amount is calculated from the current cart and displayed before order submission.\n\nDelivery coverage and timelines have not been configured. Please confirm serviceability and delivery estimates before placing an order.'),
      refundPolicy: value('POLICY_REFUND', 'Please contact the store before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.\n\nFor assistance, contact the store at +{{phone}} and include your order reference.'),
    };
  }

  public static async updateBusinessSettings(data: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const map: Record<string, string> = {};
    if (data.storeName !== undefined) map['STORE_NAME'] = data.storeName;
    if (data.gstin !== undefined) map['GSTIN'] = data.gstin;
    if (data.phone !== undefined) map['PHONE'] = data.phone;
    if (data.email !== undefined) map['EMAIL'] = data.email;
    if (data.addressLine1 !== undefined) map['ADDRESS_LINE1'] = data.addressLine1;
    if (data.addressLine2 !== undefined) map['ADDRESS_LINE2'] = data.addressLine2;
    if (data.city !== undefined) map['CITY'] = data.city;
    if (data.state !== undefined) map['STATE'] = data.state;
    if (data.postalCode !== undefined) map['POSTAL_CODE'] = data.postalCode;
    if (data.freeShippingThreshold !== undefined) map['FREE_SHIPPING_THRESHOLD'] = String(data.freeShippingThreshold);
    if (data.baseShippingFee !== undefined) map['BASE_SHIPPING_FEE'] = String(data.baseShippingFee);
    if (data.taxIncluded !== undefined) map['TAX_INCLUDED'] = String(data.taxIncluded);
    if (data.enableCod !== undefined) map['ENABLE_COD'] = String(data.enableCod);
    if (data.announcementText !== undefined) map['ANNOUNCEMENT_TEXT'] = data.announcementText;
    if (data.logoUrl !== undefined) map['LOGO_URL'] = data.logoUrl;
    if (data.aboutShowcaseImageUrl !== undefined) map['ABOUT_SHOWCASE_IMAGE_URL'] = data.aboutShowcaseImageUrl;
    if (data.privacyPolicy !== undefined) map['POLICY_PRIVACY'] = data.privacyPolicy;
    if (data.termsPolicy !== undefined) map['POLICY_TERMS'] = data.termsPolicy;
    if (data.shippingPolicy !== undefined) map['POLICY_SHIPPING'] = data.shippingPolicy;
    if (data.refundPolicy !== undefined) map['POLICY_REFUND'] = data.refundPolicy;

    await this.setMany(map);
    return this.getBusinessSettings();
  }

  public static async set(key: string, value: string, isPublic?: boolean, description?: string): Promise<BusinessSetting> {
    // Secret-looking settings can NEVER be public, and an unspecified
    // `isPublic` preserves the stored visibility instead of silently
    // flipping private settings (e.g. RAZORPAY_KEY_SECRET) into the payload
    // served publicly by /api/cms.
    const looksSecret = /SECRET|TOKEN|PASSWORD|PRIVATE|_KEY$/i.test(key) && !/KEY_ID$/i.test(key);
    if (isPostgresConfigured()) {
      const existing = await pgQuery('SELECT "isPublic" FROM "BusinessSetting" WHERE "key"=$1 LIMIT 1', [key]);
      const resolvedPublic = looksSecret ? false : isPublic ?? existing.rows[0]?.isPublic ?? true;
      const result = await pgQuery('INSERT INTO "BusinessSetting" ("id","key","value","description","isPublic","updatedAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) ON CONFLICT ("key") DO UPDATE SET "value"=EXCLUDED."value","description"=COALESCE(EXCLUDED."description","BusinessSetting"."description"),"isPublic"=EXCLUDED."isPublic","updatedAt"=CURRENT_TIMESTAMP RETURNING *', [`set_${crypto.randomUUID()}`,key,value,description ?? null,resolvedPublic]);
      const row=result.rows[0];
      return { id:row.id,key:row.key,value:row.value,description:row.description ?? null,isPublic:row.isPublic,updatedAt:new Date(row.updatedAt).toISOString() };
    }
    const existing = db.businessSettings.get(key);
    const updated: BusinessSetting = {
      id: existing ? existing.id : `set_${key.toLowerCase()}`,
      key,
      value,
      description: description || existing?.description || null,
      isPublic: looksSecret ? false : isPublic ?? existing?.isPublic ?? true,
      updatedAt: new Date().toISOString(),
    };
    db.businessSettings.set(key, updated);
    return { ...updated };
  }

  public static async setMany(settings: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key, value);
    }
  }

  // Instance methods
  public get(key: string) { return SettingsRepository.get(key); }
  public getAll(publicOnly?: boolean) { return SettingsRepository.getAll(publicOnly); }
  public getBusinessSettings() { return SettingsRepository.getBusinessSettings(); }
  public updateBusinessSettings(data: Partial<BusinessSettings>) { return SettingsRepository.updateBusinessSettings(data); }
  public set(key: string, value: string, isPublic?: boolean, description?: string) { return SettingsRepository.set(key, value, isPublic, description); }
  public setMany(settings: Record<string, string>) { return SettingsRepository.setMany(settings); }
}

export const settingsRepository = new SettingsRepository();
