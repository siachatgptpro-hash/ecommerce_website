// ==============================================================================
// ZOD VALIDATION SCHEMAS — SHLOKVEDA
// ==============================================================================

import { z } from 'zod';
import {
  AyurvedicFormulation,
  DiscountType,
  InventoryChangeReason,
  OrderStatus,
  PaymentGateway,
  SystemRole,
} from '@/types';

// ------------------------------------------------------------------------------
// AUTH SCHEMAS
// ------------------------------------------------------------------------------

/**
 * Normalises Indian mobile numbers to bare 10 digits, so inputs users
 * actually type ("+91 98765 43210", "09876543210", "98765 43210") validate
 * identically in the browser and on the server instead of failing with a
 * generic checkout error.
 */
/** Absolute http(s) URL or site-relative path (catalogue images are local files).
 * Protocol-relative "//host/..." (and "/\host") must NOT pass as site-relative:
 * browsers resolve them to a foreign origin. */
export const imageReference = (message = 'Valid image URL required') =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => /^\/(?![/\\])/.test(value) || /^https?:\/\//i.test(value), message);

export function normalizeIndianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

const indianPhone = (message = 'Valid 10-digit mobile number required') =>
  z
    .string()
    .trim()
    .transform((value) => normalizeIndianPhone(value))
    .refine((value) => /^[6-9]\d{9}$/.test(value), message);

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: indianPhone('Invalid 10-digit Indian phone number').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
  emailOrPhone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => !!(data.emailOrPhone || data.email || data.phone), {
  message: 'Email or phone number is required',
  path: ['emailOrPhone'],
});

export const AddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Recipient name is required'),
  phone: indianPhone(),
  addressLine1: z.string().trim().min(5, 'Street address is required'),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Valid 6-digit Indian PIN code required'),
  isDefault: z.boolean().optional().default(false),
});

// ------------------------------------------------------------------------------
// CATALOG SCHEMAS
// ------------------------------------------------------------------------------

export const CategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  slug: z.string().trim().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().optional(),
  imageUrl: imageReference().optional().or(z.literal('')),
  parentId: z.string().min(3).optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export const ProductVariantInputSchema = z.object({
  id: z.string().min(3).optional(),
  sku: z.string().trim().min(3, 'SKU is required'),
  sizeLabel: z.string().trim().min(1, 'Size/Weight label is required'), // e.g. "100g", "250g"
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().nonnegative('Cost price cannot be negative').default(0),
  stockQuantity: z.number().int().nonnegative('Stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  weightInGrams: z.number().int().nonnegative().default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const ProductImageInputSchema = z.object({
  imageUrl: imageReference(),
  altText: z.string().trim().optional(),
  sortOrder: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

export const ProductMutationSchema = z.object({
  categoryId: z.string().trim().min(3, 'Category ID is required'),
  name: z.string().trim().min(2, 'Product name is required'),
  slug: z.string().trim().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  skuPrefix: z.string().trim().min(2, 'SKU prefix is required'),
  shortDescription: z.string().trim().optional(),
  fullDescription: z.string().trim().optional().default(''),
  ingredients: z.string().trim().optional().default(''),
  benefits: z.string().trim().optional().default(''),
  usageInstructions: z.string().trim().optional().default(''),
  precautions: z.string().trim().optional(),
  ayurvedicFormulation: z.nativeEnum(AyurvedicFormulation).default(AyurvedicFormulation.WELLNESS),
  ayushLicenseNo: z.string().trim().optional(),
  fssaiLicenseNo: z.string().trim().optional(),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  metaKeywords: z.string().trim().optional(),
  variants: z.array(ProductVariantInputSchema).min(1, 'At least one product variant is required'),
  images: z.array(ProductImageInputSchema).min(1, 'At least one product image is required'),
});

// ------------------------------------------------------------------------------
// CART & PRICING SCHEMAS
// ------------------------------------------------------------------------------

export const CartItemInputSchema = z.object({
  variantId: z.string().trim().min(3, 'Valid variant ID required'),
  quantity: z.number().int().positive('Quantity must be at least 1').max(50, 'Max 50 units per item'),
});

export const CartSyncSchema = z.object({
  items: z.array(CartItemInputSchema),
  couponCode: z.string().trim().optional(),
});

// ------------------------------------------------------------------------------
// CHECKOUT & PAYMENT SCHEMAS
// ------------------------------------------------------------------------------

export const CheckoutInitiateSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'Cart cannot be empty'),
  couponCode: z.string().trim().optional(),
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerEmail: z.string().trim().email('Valid email required'),
  customerPhone: indianPhone(),
  shippingAddress: AddressSchema,
  paymentGateway: z.nativeEnum(PaymentGateway).default(PaymentGateway.RAZORPAY),
});

export const RazorpayVerifySchema = z.object({
  orderId: z.string().trim().min(3, 'Valid internal order ID required'),
  razorpayOrderId: z.string().min(5, 'Razorpay order ID required'),
  razorpayPaymentId: z.string().min(5, 'Razorpay payment ID required'),
  razorpaySignature: z.string().min(10, 'Razorpay signature required'),
});

// ------------------------------------------------------------------------------
// INVENTORY & COUPON SCHEMAS
// ------------------------------------------------------------------------------

export const StockAdjustmentSchema = z.object({
  variantId: z.string().trim().min(3, 'Valid variant ID required'),
  changeQty: z.number().int().refine((val) => val !== 0, 'Change quantity cannot be zero'),
  reason: z.nativeEnum(InventoryChangeReason),
  notes: z.string().trim().optional(),
});

/** Payload accepted by the admin inventory quick-adjust endpoint used by the UI. */
export const InventoryAdjustSchema = z.object({
  variantId: z.string().trim().min(3, 'Valid variant ID required'),
  quantityChange: z.coerce
    .number({ invalid_type_error: 'Quantity change must be a number' })
    .int('Quantity change must be a whole number')
    .refine((val) => val !== 0, 'Quantity change cannot be zero'),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const CouponSchema = z
  .object({
    code: z.string().trim().min(3).toUpperCase(),
    description: z.string().trim().optional(),
    discountType: z.nativeEnum(DiscountType),
    // A FREE_SHIPPING coupon waives the delivery fee, so its value is 0;
    // every other type needs a positive amount/percentage (refined below).
    discountValue: z.number().nonnegative('Discount value cannot be negative'),
    minOrderValue: z.number().nonnegative().default(0),
    maxDiscountCap: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    perUserLimit: z.number().int().positive().default(1),
    startDate: z.string().datetime().or(z.string().min(10)),
    endDate: z.string().datetime().or(z.string().min(10)),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.discountType === DiscountType.FREE_SHIPPING || data.discountValue > 0, {
    message: 'Discount value must be positive',
    path: ['discountValue'],
  })
  .refine((data) => data.discountType !== DiscountType.PERCENTAGE || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'Coupon end date must be after its start date',
    path: ['endDate'],
  });

// ------------------------------------------------------------------------------
// REVIEWS & CMS SCHEMAS
// ------------------------------------------------------------------------------

export const ReviewCreateSchema = z.object({
  productId: z.string().trim().min(3, 'Valid product ID required'),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().optional(),
  comment: z.string().trim().min(5, 'Review must be at least 5 characters'),
});

export const ReviewModerationSchema = z.object({
  isApproved: z.boolean(),
  adminReply: z.string().trim().optional(),
});

/** Payload sent by the admin CMS banner form (supports ctaLink/ctaText aliases). */
export const BannerWriteSchema = z.object({
  title: z.string().trim().min(2, 'Banner title is required'),
  subtitle: z.string().trim().optional().nullable(),
  imageUrl: imageReference(),
  mobileImgUrl: imageReference().optional().nullable().or(z.literal('')),
  linkUrl: z.string().trim().optional(),
  ctaLink: z.string().trim().optional(),
  buttonText: z.string().trim().optional(),
  ctaText: z.string().trim().optional(),
  // Nullable so the admin form can clear an existing secondary button.
  secondaryCtaText: z.string().trim().optional().nullable(),
  secondaryCtaLink: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
  slot: z.string().trim().optional(),
});

export const BannerSchema = z.object({
  title: z.string().trim().min(2),
  subtitle: z.string().trim().optional(),
  imageUrl: imageReference(),
  mobileImgUrl: imageReference().optional().or(z.literal('')),
  linkUrl: z.string().trim().optional(),
  buttonText: z.string().trim().optional(),
  secondaryCtaText: z.string().trim().optional().nullable(),
  secondaryCtaLink: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const BlogPostSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/),
  summary: z.string().trim().optional(),
  content: z.string().trim().min(20),
  featuredImg: z.string().url().optional().or(z.literal('')),
  authorName: z.string().trim().default('Shlokveda Ayurvedic Expert'),
  readTimeMinutes: z.number().int().positive().default(5),
  isPublished: z.boolean().default(false),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  categoryIds: z.array(z.string().min(3)).optional(),
});

export const BusinessSettingsUpdateSchema = z.record(z.string(), z.string());

export const OrderStatusUpdateSchema = z.object({
  orderStatus: z.nativeEnum(OrderStatus),
  trackingCarrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().trim().url('Tracking URL must be a valid URL').optional().or(z.literal('')),
  adminNotes: z.string().trim().optional(),
});

export const NewsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
});

export const PolicySectionSchema = z.object({
  icon: z.string().trim().max(40).optional(),
  heading: z.string().trim().min(1, 'Section heading is required').max(160),
  body: z.string().trim().min(1, 'Section text is required').max(4000),
});

export const StaticPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase letters, numbers and hyphens')
    .max(80),
  title: z.string().trim().min(1, 'Title is required').max(160),
  // Plain-text mirror; the route requires content OR at least one section.
  content: z.string().trim().max(20000).optional().default(''),
  layout: z.enum(['prose', 'list', 'grid', 'cards', 'accordion']).optional().nullable(),
  sections: z.array(PolicySectionSchema).max(24).optional().nullable(),
  metaTitle: z.string().trim().max(160).optional().nullable(),
  metaDescription: z.string().trim().max(320).optional().nullable(),
});
