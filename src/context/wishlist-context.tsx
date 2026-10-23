'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistContextType {
  wishlist: string[]; // array of product IDs
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shlokveda_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Never trust stored JSON blindly — only accept a list of string IDs.
        if (Array.isArray(parsed)) {
          setWishlist(parsed.filter((id): id is string => typeof id === 'string'));
        }
      }
    } catch {
      localStorage.removeItem('shlokveda_wishlist');
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    // Functional update: rapid toggles must not act on a stale snapshot.
    setWishlist((previous) => {
      const updated = previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId];
      localStorage.setItem('shlokveda_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
