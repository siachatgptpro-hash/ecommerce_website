// ==============================================================================
// ENTERPRISE DATA ACCESS LAYER & PERSISTENCE ENGINE — SHLOKVEDA
// Portable Relational Data Store (PostgreSQL / MySQL / In-Memory Seeded Engine)
// ==============================================================================

import {
  Address,
  AuditLog,
  AyurvedicFormulation,
  Banner,
  BlogCategory,
  BlogPost,
  BusinessSetting,
  Cart,
  CartItem,
  Category,
  Coupon,
  CouponUsage,
  DiscountType,
  FaqItem,
  HomepageSection,
  InventoryChangeReason,
  InventoryLedger,
  NewsletterSubscriber,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentGateway,
  PaymentStatus,
  PermissionKey,
  Product,
  ProductImage,
  ProductVariant,
  Review,
  Shipment,
  ShipmentStatus,
  StaticPage,
  SystemRole,
  Testimonial,
  User,
} from '@/types';
import bcrypt from 'bcryptjs';
import { assertDatabaseConfiguredForProduction, isPostgresConfigured } from '@/lib/postgres';
import { BROCHURE_CATEGORIES, BROCHURE_PRODUCTS } from './brochure-data';

// Global Singleton Store for Persistent Runtime Execution
class DatabaseStore {
  public users: Map<string, User> = new Map();
  public userRoles: Map<string, { userId: string; roleId: string; role: SystemRole }> = new Map();
  public addresses: Map<string, Address> = new Map();
  public categories: Map<string, Category> = new Map();
  public products: Map<string, Product> = new Map();
  public productVariants: Map<string, ProductVariant> = new Map();
  public productImages: Map<string, ProductImage> = new Map();
  public inventoryLedgers: Map<string, InventoryLedger> = new Map();
  public carts: Map<string, Cart> = new Map();
  public cartItems: Map<string, CartItem> = new Map();
  public orders: Map<string, Order> = new Map();
  public orderItems: Map<string, OrderItem> = new Map();
  public payments: Map<string, Payment> = new Map();
  public newsletterSubscribers: Map<string, NewsletterSubscriber> = new Map();
  public shipments: Map<string, Shipment> = new Map();
  public coupons: Map<string, Coupon> = new Map();
  public couponUsages: Map<string, CouponUsage> = new Map();
  public reviews: Map<string, Review> = new Map();
  public banners: Map<string, Banner> = new Map();
  public homepageSections: Map<string, HomepageSection> = new Map();
  public testimonials: Map<string, Testimonial> = new Map();
  public faqItems: Map<string, FaqItem> = new Map();
  public blogPosts: Map<string, BlogPost> = new Map();
  public blogCategories: Map<string, BlogCategory> = new Map();
  public staticPages: Map<string, StaticPage> = new Map();
  public businessSettings: Map<string, BusinessSetting> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();

  private isInitialized = false;

  constructor() {
    assertDatabaseConfiguredForProduction();
    if (!isPostgresConfigured()) this.seedInitialData();
  }

  public seedInitialData() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. BUSINESS SETTINGS SEED (As per PRD specification)
    // Keys must match the canonical names read by SettingsRepository
    // (STORE_NAME, BASE_SHIPPING_FEE, ENABLE_COD, …) — the previous
    // BUSINESS_*/DEFAULT_* names were never read anywhere.
    const settingsList: Array<{ key: string; value: string; isPublic: boolean; description: string }> = [
      { key: 'STORE_NAME', value: 'Shlokveda', isPublic: true, description: 'Official legal business name' },
      { key: 'ADDRESS_LINE1', value: 'B.H Oil Meal Road', isPublic: true, description: 'Premises address' },
      { key: 'ADDRESS_LINE2', value: 'Next to Bank of Maharashtra, Dobra Bal Colony', isPublic: true, description: 'Landmark / Area' },
      { key: 'CITY', value: 'Hathras', isPublic: true, description: 'City' },
      { key: 'STATE', value: 'Uttar Pradesh', isPublic: true, description: 'State' },
      { key: 'POSTAL_CODE', value: '204101', isPublic: true, description: 'Postal PIN code' },
      { key: 'PHONE', value: '7017840020', isPublic: true, description: 'Primary customer support phone' },
      { key: 'GSTIN', value: '09ANCPV6879P1ZP', isPublic: true, description: 'Registered GSTIN / UIN' },
      { key: 'EMAIL', value: '', isPublic: true, description: 'Official email' },
      { key: 'FREE_SHIPPING_THRESHOLD', value: '499', isPublic: true, description: 'Free shipping minimum order value (INR)' },
      { key: 'BASE_SHIPPING_FEE', value: '50', isPublic: true, description: 'Standard delivery charge below threshold' },
      { key: 'ENABLE_COD', value: 'false', isPublic: true, description: 'Allow Cash on Delivery' },
      { key: 'RAZORPAY_KEY_ID', value: process.env.RAZORPAY_KEY_ID || '', isPublic: true, description: 'Razorpay Key ID' },
      { key: 'RAZORPAY_KEY_SECRET', value: process.env.RAZORPAY_KEY_SECRET || '', isPublic: false, description: 'Razorpay Secret' },
    ];

    for (const s of settingsList) {
      this.businessSettings.set(s.key, {
        id: `set_${s.key.toLowerCase()}`,
        key: s.key,
        value: s.value,
        description: s.description,
        isPublic: s.isPublic,
        updatedAt: new Date().toISOString(),
      });
    }

    // Never ship a shared default administrator password. Configure both values in the deployment environment to bootstrap an admin.
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const adminId = 'usr_superadmin_01';
      const passwordSalt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync(adminPassword, passwordSalt);
      const adminUser: User = {
        id: adminId,
        email: adminEmail,
        passwordHash: adminHash,
        fullName: 'Shlokveda Administrator',
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: [SystemRole.SUPER_ADMIN, SystemRole.ADMIN],
        permissions: Object.values(PermissionKey),
      };
      this.users.set(adminId, adminUser);
      this.userRoles.set('ur_sa_01', { userId: adminId, roleId: 'role_super_admin', role: SystemRole.SUPER_ADMIN });
    }

    // 3. AYURVEDIC CATEGORIES SEED
    for (const cat of BROCHURE_CATEGORIES) {
      const categoryImage = BROCHURE_PRODUCTS.find((product) => product.categoryId === cat.id)?.images[0]?.url || null;
      this.categories.set(cat.id, {
        ...cat,
        isActive: true,
        imageUrl: categoryImage,
        metaTitle: `${cat.name} | Shlokveda Product Catalogue`,
        metaDescription: cat.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Seed every brochure catalogue row; the printed MRP is kept as the listed price.
    const combinedProducts = BROCHURE_PRODUCTS;

    for (const p of combinedProducts) {
      const prodRecord: Product = {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        skuPrefix: p.skuPrefix,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        ingredients: p.ingredients,
        benefits: p.benefits,
        usageInstructions: p.usageInstructions,
        precautions: p.precautions,
        ayurvedicFormulation: p.ayurvedicFormulation,
        ayushLicenseNo: p.ayushLicenseNo,
        fssaiLicenseNo: p.fssaiLicenseNo,
        isFeatured: p.isFeatured,
        isBestseller: p.isBestseller,
        isNewArrival: p.isNewArrival,
        isActive: true,
        metaTitle: `${p.name} | Buy Authentic Ayurveda | SHLOKVEDA`,
        metaDescription: p.shortDescription,
        metaKeywords: `ayurvedic medicine, hathras ayurveda, ${p.name}, classical remedies, natural herbs`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.products.set(p.id, prodRecord);

      for (const v of p.variants) {
        const variantRecord: ProductVariant = {
          id: v.id,
          productId: p.id,
          sku: v.sku,
          sizeLabel: v.sizeLabel,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
          costPrice: v.costPrice,
          stockQuantity: v.stock,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          weightInGrams: 250,
          isDefault: v.isDefault,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.productVariants.set(v.id, variantRecord);

        // Initial Inventory Ledger entry
        this.inventoryLedgers.set(`inv_${v.id}_init`, {
          id: `inv_${v.id}_init`,
          variantId: v.id,
          changeQty: v.stock,
          resultingQty: v.stock,
          reason: InventoryChangeReason.MANUAL_RESTOCK,
          referenceId: 'INITIAL_SEED',
          notes: 'In-memory preview stock fixture; replace with verified inventory before live sales',
          createdAt: new Date().toISOString(),
        });
      }

      for (const img of p.images) {
        this.productImages.set(img.id, {
          id: img.id,
          productId: p.id,
          imageUrl: img.url,
          altText: `${p.name} - Shlokveda`,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          createdAt: new Date().toISOString(),
        });
      }


    }

    // No coupon codes are active until configured and approved in the admin tools.

    // 6. CMS BANNERS & HOMEPAGE SECTIONS SEED
    // Default homepage hero slides (mirrors DEFAULT_HERO_SLIDES in
    // src/lib/hero-slides.ts); editable later in Admin -> CMS -> Banners.
    if (this.banners.size === 0) {
      const heroNow = new Date().toISOString();
      const heroBanners: Banner[] = [
        {
          id: 'ban_hero_personal_care',
          title: 'Natural Personal Care for a Healthier You',
          subtitle: 'Explore authentic Ayurvedic products crafted with traditional herbs for your everyday wellness routine.',
          imageUrl: '/banners/hero-personal-care.webp',
          mobileImgUrl: null,
          linkUrl: '/category/personal-care',
          buttonText: 'Shop Personal Care',
          secondaryCtaText: 'Explore Categories',
          secondaryCtaLink: '/#categories',
          sortOrder: 1,
          isActive: true,
          createdAt: heroNow,
          updatedAt: heroNow,
          slot: 'HERO_PRIMARY',
          ctaText: 'Shop Personal Care',
          ctaLink: '/category/personal-care',
        },
        {
          id: 'ban_hero_daily_wellness',
          title: 'Everyday Wellness, Rooted in Ayurveda',
          subtitle: 'Discover traditional Ayurvedic formulations for your daily wellness routine.',
          imageUrl: '/banners/hero-wellness.webp',
          mobileImgUrl: null,
          linkUrl: '/category/immunity-rasayana',
          buttonText: 'Explore Wellness',
          secondaryCtaText: 'Shop Bestsellers',
          secondaryCtaLink: '/shop',
          sortOrder: 2,
          isActive: true,
          createdAt: heroNow,
          updatedAt: heroNow,
          slot: 'HERO_PRIMARY',
          ctaText: 'Explore Wellness',
          ctaLink: '/category/immunity-rasayana',
        },
        {
          id: 'ban_hero_herbal_oils',
          title: 'Ancient Wisdom. Everyday Care.',
          subtitle: 'Explore traditional herbal oils and Ayurvedic preparations for your daily care rituals.',
          imageUrl: '/banners/hero-herbal-oils.webp',
          mobileImgUrl: null,
          linkUrl: '/category/herbal-oils',
          buttonText: 'Shop Herbal Oils',
          secondaryCtaText: 'Discover More',
          secondaryCtaLink: '/about',
          sortOrder: 3,
          isActive: true,
          createdAt: heroNow,
          updatedAt: heroNow,
          slot: 'HERO_PRIMARY',
          ctaText: 'Shop Herbal Oils',
          ctaLink: '/category/herbal-oils',
        },
        {
          id: 'ban_hero_catalogue',
          title: 'Bring the Goodness of Ayurveda Home',
          subtitle: "Find Ayurvedic essentials for your family's everyday wellness needs.",
          imageUrl: '/banners/hero-essentials.webp',
          mobileImgUrl: null,
          linkUrl: '/shop',
          buttonText: 'Shop All Products',
          secondaryCtaText: 'Browse Categories',
          secondaryCtaLink: '/#categories',
          sortOrder: 4,
          isActive: true,
          createdAt: heroNow,
          updatedAt: heroNow,
          slot: 'HERO_PRIMARY',
          ctaText: 'Shop All Products',
          ctaLink: '/shop',
        },
      ];
      for (const heroBanner of heroBanners) this.banners.set(heroBanner.id, heroBanner);
    }

    // Policy & static pages seed (editable in Admin -> CMS; auto-listed in
    // the footer Trust & Policies column). All six store policy pages plus
    // the product-information notice live here as structured sections;
    // `content` is the plain-text mirror. Copy is transcribed from this
    // storefront's own published notices and settings — no new legal copy.
    // The /policies/<slug> page falls back to the Admin -> Settings policy
    // texts only when the matching CMS page is missing.
    const pageNow = new Date().toISOString();
    const policyPages: StaticPage[] = [
      {
        id: 'page_shipping-policy',
        slug: 'shipping-policy',
        title: 'Shipping & Delivery',
        content: 'The current checkout applies a ₹{{baseShippingFee}} delivery fee below ₹{{freeShippingThreshold}} and waives that fee at or above the configured threshold. The final amount is calculated from the current cart and displayed before order submission.\n\nDelivery coverage and timelines have not been configured. Please confirm serviceability and delivery estimates before placing an order.',
        metaTitle: null,
        metaDescription: 'Delivery charges are calculated at checkout.',
        layout: 'list',
        sections: [
          { icon: 'Truck', heading: 'Delivery Charges', body: 'The current checkout applies a ₹{{baseShippingFee}} delivery fee below ₹{{freeShippingThreshold}} and waives that fee at or above the configured threshold.' },
          { icon: 'MapPin', heading: 'Delivery Coverage', body: 'Delivery coverage and timelines have not been configured. Please confirm serviceability and delivery estimates before placing an order.' },
          { icon: 'ShoppingCart', heading: 'Final Amount', body: 'The final amount is calculated from the current cart and displayed before order submission.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_refund-policy',
        slug: 'refund-policy',
        title: 'Returns, Cancellations & Refunds',
        content: 'Please contact the store before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.\n\nFor assistance, contact the store at +{{phone}} and include your order reference.',
        metaTitle: null,
        metaDescription: 'Please review the store terms before making a purchase.',
        layout: 'cards',
        sections: [
          { icon: 'Package', heading: 'Returns', body: 'Please contact the store before requesting a return. Any applicable resolution will depend on the order status and the condition of the delivered product.' },
          { icon: 'CircleX', heading: 'Cancellations', body: 'Please contact the store before requesting a cancellation. Any applicable resolution will depend on the order status and the condition of the delivered product.' },
          { icon: 'RotateCcw', heading: 'Refunds', body: 'Please contact the store before requesting a refund. Any applicable resolution will depend on the order status and the condition of the delivered product.' },
          { icon: 'Info', heading: 'For Assistance', body: 'For assistance, contact the store at +{{phone}} and include your order reference.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_privacy-policy',
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: 'Checkout may collect your name, email address, phone number and delivery address. Registration also collects account details.\n\nOnline payment processing is available only when a valid payment gateway is configured. This storefront does not store card or UPI credentials.',
        metaTitle: null,
        metaDescription: 'Information handled by this Shlokveda storefront.',
        layout: 'list',
        sections: [
          { icon: 'User', heading: 'Information We Collect', body: 'Checkout may collect your name, email address, phone number and delivery address.' },
          { icon: 'ShieldCheck', heading: 'Account Details', body: 'Registration also collects account details.' },
          { icon: 'Cog', heading: 'Payment Processing', body: 'Online payment processing is available only when a valid payment gateway is configured.' },
          { icon: 'Leaf', heading: 'No Stored Credentials', body: 'This storefront does not store card or UPI credentials.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_terms-and-conditions',
        slug: 'terms-and-conditions',
        title: 'Terms & Conditions',
        content: 'Product names, pack options and printed MRPs are transcribed from the supplied brochure. The checkout recalculates prices and availability from the current server catalogue before placing an order.\n\nCatalogue content is informational, may not include every package detail and is not medical advice. Read the product label and consult a qualified healthcare professional where appropriate.',
        metaTitle: null,
        metaDescription: 'Please review product and order information before proceeding.',
        layout: 'grid',
        sections: [
          { icon: 'Package', heading: 'Catalogue Accuracy', body: 'Product names, pack options and printed MRPs are transcribed from the supplied brochure.' },
          { icon: 'ShoppingCart', heading: 'Checkout Verification', body: 'The checkout recalculates prices and availability from the current server catalogue before placing an order.' },
          { icon: 'FileText', heading: 'Informational Content', body: 'Catalogue content is informational, may not include every package detail and is not medical advice.' },
          { icon: 'ShieldCheck', heading: 'Health Guidance', body: 'Read the product label and consult a qualified healthcare professional where appropriate.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_disclaimer',
        slug: 'disclaimer',
        title: 'Disclaimer',
        content: 'Product names, descriptions and ingredient notes on this store are transcribed from the supplied brochure where available. When a detail is not listed here, please refer to the product package for complete composition, directions, cautions and regulatory information.\n\nThis catalogue is for general information only and is not medical advice. It does not claim that any product diagnoses, treats, cures or prevents any health condition. Please read the package label carefully and consult a qualified healthcare professional before use.\n\nWe work to keep catalogue information accurate and consistent with the source brochure. If you notice an error, please contact the store so it can be reviewed.',
        metaTitle: null,
        metaDescription: 'Information about the catalogue, product details and your responsibilities.',
        layout: 'grid',
        sections: [
          { icon: 'BookOpen', heading: 'Product Information', body: 'Product names, descriptions and ingredient notes on this store are transcribed from the supplied brochure where available. When a detail is not listed here, please refer to the product package for complete composition, directions, cautions and regulatory information.' },
          { icon: 'Leaf', heading: 'General Information', body: 'This catalogue is for general information only and is not medical advice. It does not claim that any product diagnoses, treats, cures or prevents any health condition.' },
          { icon: 'ShieldCheck', heading: 'Health & Safety', body: 'Please read the package label carefully and consult a qualified healthcare professional before use.' },
          { icon: 'Users', heading: 'Accuracy & Corrections', body: 'We work to keep catalogue information accurate and consistent with the source brochure. If you notice an error, please contact the store so it can be reviewed.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_faq',
        slug: 'faq',
        title: 'Frequently Asked Questions',
        content: 'How do I place an order?\nBrowse the catalogue, add products to your cart and proceed to checkout. You will be asked to log in or create an account so that your order can be tracked.\n\nWhat are the delivery charges?\nA delivery fee of ₹{{baseShippingFee}} applies on orders below ₹{{freeShippingThreshold}} and is waived at or above that amount. The final amount is calculated from your cart and shown before you place the order.\n\nHow can I pay?\nThe payment options available to you are shown at checkout. Online payments are processed through the configured payment gateway; this store does not store your card or UPI credentials.\n\nWhere does the product information come from?\nProduct names, pack sizes, printed MRPs and package photos are transcribed from the supplied product brochure. For complete composition, directions and cautions, please refer to the product package.\n\nHow do I request a return or refund?\nPlease contact the store with your order reference before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.',
        metaTitle: null,
        metaDescription: 'Find answers to common questions about ordering, delivery, payments and product information.',
        layout: 'accordion',
        sections: [
          { icon: 'ShoppingCart', heading: 'How do I place an order?', body: 'Browse the catalogue, add products to your cart and proceed to checkout. You will be asked to log in or create an account so that your order can be tracked.' },
          { icon: 'Truck', heading: 'What are the delivery charges?', body: 'A delivery fee of ₹{{baseShippingFee}} applies on orders below ₹{{freeShippingThreshold}} and is waived at or above that amount. The final amount is calculated from your cart and shown before you place the order.' },
          { icon: 'CreditCard', heading: 'How can I pay?', body: 'The payment options available to you are shown at checkout. Online payments are processed through the configured payment gateway; this store does not store your card or UPI credentials.' },
          { icon: 'Leaf', heading: 'Where does the product information come from?', body: 'Product names, pack sizes, printed MRPs and package photos are transcribed from the supplied product brochure. For complete composition, directions and cautions, please refer to the product package.' },
          { icon: 'RotateCcw', heading: 'How do I request a return or refund?', body: 'Please contact the store with your order reference before requesting a return, cancellation or refund. Any applicable resolution will depend on the order status and the condition of the delivered product.' },
        ],
        updatedAt: pageNow,
      },
      {
        id: 'page_ayush-compliance',
        slug: 'ayush-compliance',
        title: 'Product Information Notice',
        content: 'Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.\n\nThis catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.',
        metaTitle: null,
        metaDescription: 'Product detail shown on this site is based on the supplied brochure.',
        layout: 'list',
        sections: [
          { icon: 'BookOpen', heading: 'Product Descriptions', body: 'Descriptions and ingredient notes are transcribed where available. When a detail is not listed here, refer to the product package for complete composition, directions, cautions and regulatory information.' },
          { icon: 'ShieldCheck', heading: 'Not Medical Advice', body: 'This catalogue is not medical advice and does not claim that any product diagnoses, treats, cures or prevents a health condition. Consult a qualified healthcare professional before use.' },
        ],
        updatedAt: pageNow,
      },
    ];
    for (const page of policyPages) this.staticPages.set(page.slug, page);

    // Testimonials Seed
    // No testimonials or health/compliance claims are seeded without verified source material.

    // Blog posts and legal content are not seeded from unverified sample copy.

    // Orders, payments and shipments begin empty; checkout writes actual preview test orders.

  }
}

// Share one store across Next.js route bundles within the same Node process.
// This improves preview consistency but does not provide durable persistence.
const globalForDb = globalThis as typeof globalThis & { shlokvedaRuntimeDb?: DatabaseStore };
export const db = globalForDb.shlokvedaRuntimeDb ?? new DatabaseStore();
globalForDb.shlokvedaRuntimeDb = db;
