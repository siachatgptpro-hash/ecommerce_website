// ==============================================================================
// PRICING & CART CALCULATION SERVICE — SHOLKVEDA
// Server-Side Pricing Engine (Never trusts browser prices)
// ==============================================================================

import { CouponRepository } from '@/repositories/coupon.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { CartCalculationResult, DiscountType } from '@/types';
import { ValidationError } from '@/lib/errors';

export interface CartItemRequest {
  variantId: string;
  quantity: number;
}

export interface CalculateCartOptions {
  /**
   * When true (checkout), a supplied-but-unusable coupon aborts with a clear
   * error instead of silently charging full price.
   */
  strictCoupon?: boolean;
}

/** Parses a money setting; "0" is a legitimate configured value, not "unset". */
function parseMoneySetting(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export class PricingService {
  public static async calculateCart(
    items: CartItemRequest[],
    couponCode?: string,
    userId?: string,
    options: CalculateCartOptions = {}
  ): Promise<CartCalculationResult> {
    // Shipping rules are needed even for the empty-cart response so the UI can
    // show accurate free-shipping progress (no hardcoded client thresholds).
    const freeShippingThreshold = parseMoneySetting(await SettingsRepository.get('FREE_SHIPPING_THRESHOLD'), 499);
    const defaultShippingFee = parseMoneySetting(
      (await SettingsRepository.get('BASE_SHIPPING_FEE')) || (await SettingsRepository.get('DEFAULT_SHIPPING_FEE')),
      50
    );

    if (!items || items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        mrpTotal: 0,
        discountSavings: 0,
        couponDiscount: 0,
        shippingFee: 0,
        isFreeShipping: false,
        freeShippingThreshold,
        amountNeededForFreeShipping: freeShippingThreshold,
        estimatedGst: 0,
        finalPayableAmount: 0,
      };
    }

    // Aggregate duplicate lines for the same variant BEFORE any stock check —
    // otherwise 20 + 20 slips past a stock of 25 (each line passes alone).
    const quantityByVariant = new Map<string, number>();
    for (const item of items) {
      if (!item || typeof item.variantId !== 'string' || !item.variantId) {
        throw new ValidationError('Each cart item must include a valid variantId');
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationError(`Quantity for item ${item.variantId} must be a positive whole number`);
      }
      quantityByVariant.set(item.variantId, (quantityByVariant.get(item.variantId) || 0) + item.quantity);
    }

    const calculatedItems: CartCalculationResult['items'] = [];
    let subtotal = 0;
    let mrpTotal = 0;

    for (const [variantId, quantity] of quantityByVariant) {
      const variant = await ProductRepository.findVariantById(variantId);
      if (!variant || !variant.isActive) {
        throw new ValidationError(`Product variant ${variantId} not found or is no longer active`);
      }

      const product = await ProductRepository.findProductById(variant.productId);
      if (!product || !product.isActive) {
        throw new ValidationError(`Product for variant ${variant.sku} is unavailable`);
      }

      // Units already reserved by pending checkouts are not sellable.
      const availableStock = Math.max(0, variant.stockQuantity - (variant.reservedQuantity || 0));
      if (quantity > availableStock) {
        throw new ValidationError(
          `${product.name} has only ${availableStock} unit${availableStock === 1 ? '' : 's'} available`
        );
      }

      const primaryImage = product.images?.find((img) => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '';
      const unitPrice = variant.sellingPrice;
      const mrp = variant.mrp;
      const lineTotal = Number((unitPrice * quantity).toFixed(2));

      calculatedItems.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        sizeLabel: variant.sizeLabel,
        sku: variant.sku,
        imageUrl: primaryImage,
        unitPrice,
        mrp,
        quantity,
        lineTotal,
        availableStock,
      });

      subtotal += lineTotal;
      mrpTotal += Number((mrp * quantity).toFixed(2));
    }

    subtotal = Number(subtotal.toFixed(2));
    mrpTotal = Number(mrpTotal.toFixed(2));
    const discountSavings = Number((mrpTotal - subtotal).toFixed(2));

    let isFreeShipping = subtotal >= freeShippingThreshold;
    let shippingFee = isFreeShipping ? 0 : defaultShippingFee;
    const amountNeededForFreeShipping = isFreeShipping ? 0 : Number((freeShippingThreshold - subtotal).toFixed(2));

    // Coupon calculation
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined = undefined;
    let couponError: string | undefined = undefined;

    if (couponCode && couponCode.trim()) {
      const coupon = await CouponRepository.findByCode(couponCode);
      if (!coupon || !coupon.isActive) {
        couponError = 'Invalid or expired coupon code';
      } else {
        const now = new Date();
        if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
          couponError = 'This coupon has expired';
        } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          couponError = 'Coupon usage limit has been reached';
        } else if (subtotal < coupon.minOrderValue) {
          couponError = `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`;
        } else if (userId && (await CouponRepository.getUserUsageCount(coupon.id, userId)) >= coupon.perUserLimit) {
          couponError = 'You have already utilized this coupon code';
        } else {
          appliedCouponCode = coupon.code;
          if (coupon.discountType === DiscountType.PERCENTAGE) {
            const rawDiscount = (subtotal * coupon.discountValue) / 100;
            couponDiscount = coupon.maxDiscountCap ? Math.min(rawDiscount, coupon.maxDiscountCap) : rawDiscount;
          } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
            couponDiscount = coupon.discountValue;
          } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
            // The benefit of a free-shipping coupon is the waived fee ONLY.
            // (Previously it also subtracted the fee from merchandise,
            // discounting every such order twice.)
            shippingFee = 0;
            isFreeShipping = true;
            couponDiscount = 0;
          }
          // A coupon can never discount more than the merchandise subtotal.
          couponDiscount = Number(Math.min(couponDiscount, subtotal).toFixed(2));
        }
      }

      if (couponError && options.strictCoupon) {
        throw new ValidationError(couponError);
      }
    }

    // Brochure prices are used as listed; tax composition is not inferred here.
    const taxableBase = Math.max(0, subtotal - couponDiscount);
    const estimatedGst = 0;
    const finalPayableAmount = Number((taxableBase + shippingFee).toFixed(2));

    return {
      items: calculatedItems,
      subtotal,
      mrpTotal,
      discountSavings,
      couponCode: appliedCouponCode,
      couponDiscount,
      ...(couponError ? { couponError } : {}),
      shippingFee,
      isFreeShipping,
      freeShippingThreshold,
      amountNeededForFreeShipping,
      estimatedGst,
      finalPayableAmount,
    };
  }

  public static async validateCoupon(
    couponCode: string,
    subtotal: number,
    userId?: string
  ): Promise<{ valid: boolean; discountAmount: number; message: string; coupon?: any }> {
    const coupon = await CouponRepository.findByCode(couponCode);
    if (!coupon || !coupon.isActive) {
      return { valid: false, discountAmount: 0, message: 'Invalid or expired coupon code' };
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return { valid: false, discountAmount: 0, message: 'This coupon has expired' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'Coupon usage limit has been reached' };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      };
    }

    if (userId) {
      const userCount = await CouponRepository.getUserUsageCount(coupon.id, userId);
      if (userCount >= coupon.perUserLimit) {
        return { valid: false, discountAmount: 0, message: 'You have already utilized this coupon code' };
      }
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      const raw = (subtotal * coupon.discountValue) / 100;
      discount = coupon.maxDiscountCap ? Math.min(raw, coupon.maxDiscountCap) : raw;
      discount = Math.min(discount, subtotal);
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.discountType === DiscountType.FREE_SHIPPING) {
      // Report the actual configured shipping fee that will be waived.
      discount = parseMoneySetting(
        (await SettingsRepository.get('BASE_SHIPPING_FEE')) || (await SettingsRepository.get('DEFAULT_SHIPPING_FEE')),
        50
      );
    }

    return {
      valid: true,
      discountAmount: Number(discount.toFixed(2)),
      message: `Coupon ${coupon.code} applied successfully!`,
      coupon,
    };
  }

  public calculateCart(items: any[], couponCode?: string, userId?: string, options?: CalculateCartOptions) {
    return PricingService.calculateCart(items, couponCode, userId, options);
  }
  public validateCoupon(couponCode: string, subtotal: number, userId?: string) {
    return PricingService.validateCoupon(couponCode, subtotal, userId);
  }
}

export const pricingService = new PricingService();
