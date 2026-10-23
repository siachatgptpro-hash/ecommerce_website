'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { CartCalculationResult, ProductVariant, Product, AyurvedicFormulation } from '@/types';
import { useAuth } from './auth-context';

export interface RichCartItem {
  id: string;
  productVariantId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productVariant?: ProductVariant & {
    product?: Product;
  };
}

interface CartContextType {
  items: RichCartItem[];
  rawItems: Array<{ variantId: string; quantity: number }>;
  calculation: (CartCalculationResult & {
    discountAmount: number;
    finalTotal: number;
    taxAmount: number;
  }) | null;
  isLoading: boolean;
  loading: boolean;
  isCartOpen: boolean;
  couponCode: string;
  appliedCoupon: { code: string } | null;
  /** Last server-side coupon problem (expired, limit reached…) for display. */
  couponError: string | null;
  /** Last cart-calculation failure (e.g. an item went out of stock). */
  cartError: string | null;
  openCart: () => void;
  openMiniCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantIdOrItemId: string, quantity: number) => Promise<void>;
  removeItem: (variantIdOrItemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => Promise<void>;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user, isLoading: authLoading } = useAuth();
  const [itemsList, setItemsList] = useState<Array<{ variantId: string; quantity: number }>>([]);
  const [couponCode, setCouponCode] = useState<string>('');
  const [calculation, setCalculation] = useState<CartCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  const cartStorageKey = user ? `shlokveda_cart_${user.id}` : null;
  const couponStorageKey = user ? `shlokveda_coupon_${user.id}` : null;

  // Carts are private to a logged-in customer. Legacy guest-cart data is discarded.
  useEffect(() => {
    if (authLoading) return;
    try {
      localStorage.removeItem('shlokveda_cart');
      localStorage.removeItem('shlokveda_coupon');
      setItemsList([]);
      setCouponCode('');
      if (!cartStorageKey) return;
      const savedItems = localStorage.getItem(cartStorageKey);
      const savedCoupon = couponStorageKey ? localStorage.getItem(couponStorageKey) : null;
      if (savedItems) setItemsList(JSON.parse(savedItems));
      if (savedCoupon) setCouponCode(savedCoupon);
    } catch {
      if (cartStorageKey) localStorage.removeItem(cartStorageKey);
    }
  }, [authLoading, cartStorageKey, couponStorageKey]);

  // Sync and recalculate cart with server whenever items, coupon or token changes.
  // Rapid quantity taps fire several recalculations: abort the superseded
  // request and ignore any late response, so an earlier request landing
  // after a newer one can never resurrect stale totals.
  const calcSeqRef = useRef(0);
  const calcAbortRef = useRef<AbortController | null>(null);
  const refreshCart = useCallback(
    async (currentItems: Array<{ variantId: string; quantity: number }>, code: string) => {
      // Even an empty cart is calculated by the server now: it returns the
      // real free-shipping threshold from settings instead of the client
      // guessing (it previously hardcoded ₹999 vs the server's ₹499).
      const seq = ++calcSeqRef.current;
      calcAbortRef.current?.abort();
      const controller = new AbortController();
      calcAbortRef.current = controller;
      const isStale = () => seq !== calcSeqRef.current;
      setIsLoading(true);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/cart/calculate', {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            items: currentItems.map((i) => ({
              variantId: i.variantId,
              quantity: i.quantity,
            })),
            couponCode: code || undefined,
          }),
        });

        const data = await res.json();
        if (isStale()) return;
        if (data.success && data.data) {
          setCalculation(data.data);
          setCartError(null);
          if (code && data.data.couponError) {
            // The stored coupon no longer applies — drop it and tell the
            // shopper why, instead of silently charging full price later.
            setCouponError(data.data.couponError);
            setCouponCode('');
            if (couponStorageKey) localStorage.removeItem(couponStorageKey);
          } else if (data.data.couponCode) {
            setCouponError(null);
          }
        } else {
          // Surface calculation failures (out of stock, removed product…)
          // instead of leaving stale/zero totals on screen.
          setCartError(data.error?.message || 'We could not update your cart totals. Please review your items.');
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || isStale()) return;
        console.error('[Cart Sync Error]:', err);
        setCartError('We could not update your cart totals. Please check your connection.');
      } finally {
        if (!isStale()) setIsLoading(false);
      }
    },
    [token, couponStorageKey]
  );

  useEffect(() => {
    refreshCart(itemsList, couponCode);
  }, [itemsList, couponCode, refreshCart]);

  const saveItems = (newItems: Array<{ variantId: string; quantity: number }>) => {
    setItemsList(newItems);
    if (cartStorageKey) localStorage.setItem(cartStorageKey, JSON.stringify(newItems));
  };

  const openCart = () => setIsCartOpen(true);
  const openMiniCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addItem = async (variantId: string, quantity = 1) => {
    if (authLoading || !user) return;
    const existingIndex = itemsList.findIndex((i) => i.variantId === variantId);
    let updated;
    if (existingIndex > -1) {
      updated = [...itemsList];
      // Cap at the server's per-line maximum so the cart never enters a
      // state the pricing API rejects outright.
      updated[existingIndex].quantity = Math.min(50, updated[existingIndex].quantity + quantity);
    } else {
      updated = [...itemsList, { variantId, quantity: Math.min(50, Math.max(1, quantity)) }];
    }
    saveItems(updated);
    setIsCartOpen(true);
  };

  const updateQuantity = async (variantIdOrItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(variantIdOrItemId);
      return;
    }
    quantity = Math.min(50, Math.floor(quantity));
    const matches = (variantId: string) => variantId === variantIdOrItemId || `item_${variantId}` === variantIdOrItemId;
    const updated = itemsList.map((i) => (matches(i.variantId) ? { ...i, quantity } : i));
    // Update the drawer immediately; server recalculation continues in the background.
    setCalculation((previous) => previous ? {
      ...previous,
      items: previous.items.map((item) => matches(item.variantId)
        ? { ...item, quantity, lineTotal: item.unitPrice * quantity }
        : item),
    } : previous);
    saveItems(updated);
  };

  const removeItem = async (variantIdOrItemId: string) => {
    const matches = (variantId: string) => variantId !== variantIdOrItemId && `item_${variantId}` !== variantIdOrItemId;
    const updated = itemsList.filter((i) => matches(i.variantId));
    // Remove it from the visible cart before the network request finishes.
    setCalculation((previous) => previous ? {
      ...previous,
      items: previous.items.filter((item) => matches(item.variantId)),
    } : previous);
    saveItems(updated);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false, message: 'Please enter a coupon code' };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: cleanCode, subtotal: calculation?.subtotal || 0 }),
      });
      const data = await res.json();

      if (data.success && data.data?.valid) {
        setCouponCode(cleanCode);
        setCouponError(null);
        if (couponStorageKey) localStorage.setItem(couponStorageKey, cleanCode);
        return { success: true, message: data.data.message || 'Coupon applied successfully!' };
      } else {
        // The API returns the specific reason (expired, minimum order…)
        // in data.data.message — show it instead of a generic failure.
        return { success: false, message: data.data?.message || data.error?.message || 'Invalid coupon code' };
      }
    } catch {
      return { success: false, message: 'Failed to validate coupon' };
    }
  };

  const removeCoupon = async () => {
    setCouponCode('');
    setCouponError(null);
    if (couponStorageKey) localStorage.removeItem(couponStorageKey);
  };

  const clearCart = () => {
    setItemsList([]);
    setCouponCode('');
    setCouponError(null);
    setCartError(null);
    if (cartStorageKey) localStorage.removeItem(cartStorageKey);
    if (couponStorageKey) localStorage.removeItem(couponStorageKey);
    localStorage.removeItem('shlokveda_cart');
    localStorage.removeItem('shlokveda_coupon');
    setCalculation(null);
    setIsCartOpen(false);
  };

  // Convert raw items into rich cart items using calculation response
  const richItems: RichCartItem[] = itemsList.map((raw) => {
    const calcItem = calculation?.items?.find((ci) => ci.variantId === raw.variantId);
    const unitPrice = calcItem?.unitPrice || 0;
    const totalPrice = calcItem?.lineTotal || unitPrice * raw.quantity;

    return {
      id: `item_${raw.variantId}`,
      productVariantId: raw.variantId,
      variantId: raw.variantId,
      quantity: raw.quantity,
      unitPrice,
      totalPrice,
      productVariant: {
        id: raw.variantId,
        productId: calcItem?.productId || '',
        sku: calcItem?.sku || '',
        sizeLabel: calcItem?.sizeLabel || '',
        mrp: calcItem?.mrp || unitPrice,
        sellingPrice: unitPrice,
        costPrice: 0,
        stockQuantity: calcItem?.availableStock ?? 0,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        weightInGrams: 100,
        isDefault: true,
        isActive: true,
        createdAt: '',
        updatedAt: '',
        product: {
          id: calcItem?.productId || '',
          categoryId: '',
          name: calcItem?.productName || 'Ayurvedic Herb',
          slug: '',
          skuPrefix: '',
          fullDescription: '',
          ingredients: '',
          benefits: '',
          usageInstructions: '',
          ayurvedicFormulation: AyurvedicFormulation.CHURNA,
          isFeatured: false,
          isBestseller: false,
          isNewArrival: false,
          isActive: true,
          createdAt: '',
          updatedAt: '',
          images: calcItem?.imageUrl ? [{ id: '1', productId: '', imageUrl: calcItem.imageUrl, sortOrder: 0, isPrimary: true, createdAt: '' }] : [],
        },
      },
    };
  });

  const itemCount = itemsList.reduce((acc, curr) => acc + curr.quantity, 0);

  const enhancedCalculation = calculation
    ? {
        ...calculation,
        discountAmount: calculation.couponDiscount,
        finalTotal: calculation.finalPayableAmount,
        taxAmount: calculation.estimatedGst,
      }
    : null;

  return (
    <CartContext.Provider
      value={{
        items: richItems,
        rawItems: itemsList,
        calculation: enhancedCalculation,
        isLoading,
        loading: isLoading,
        isCartOpen,
        couponCode,
        appliedCoupon: couponCode ? { code: couponCode } : null,
        couponError,
        cartError,
        openCart,
        openMiniCart,
        closeCart,
        addItem,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
