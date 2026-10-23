'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useAuth } from '@/context/auth-context';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Leaf,
  LayoutGrid,
  BadgePercent,
  Package,
  CircleHelp,
  Gift,
} from 'lucide-react';
import { Category } from '@/types';

export function Header() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, logout } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // Initial value mirrors the server-side default so the bar never flashes a
  // wrong offer (the configured free-shipping threshold is ₹499 by default).
  const [announcementText, setAnnouncementText] = useState('Authentic Ayurvedic Products | Free shipping on orders of ₹499 & above | Tradition for a Healthier Tomorrow');
  const [storeName, setStoreName] = useState('SHLOKVEDA');
  const [logoUrl, setLogoUrl] = useState('/logo.png');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.announcementText) setAnnouncementText(data.data.announcementText);
          if (data.data.storeName) setStoreName(data.data.storeName.toUpperCase());
          if (data.data.logoUrl) setLogoUrl(data.data.logoUrl);
        }
      })
      .catch(() => {});

    fetch('/api/catalog/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategories(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const searchFields = (
    <>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B4332]/60"
        aria-hidden="true"
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search herbs, chyawanprash, oils, tablets, wellness..."
        aria-label="Search products"
        className="w-full rounded-full border border-[#E3DCCB] bg-white py-2.5 pl-11 pr-28 text-sm shadow-sm focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
      />
      <button
        type="submit"
        className="absolute bottom-1 right-1 top-1 rounded-full bg-[#1B4332] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2D6A4F]"
      >
        Search
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2] border-b border-[#F3EFE6] shadow-sm">
      {/* 1. ANNOUNCEMENT BAR */}
      <div className="bg-[#0F281E] text-[11px] text-[#F3EFE6] sm:text-xs" role="status" aria-label="Store announcement">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-2 sm:px-6 md:justify-between lg:px-8">
          <p className="flex min-w-0 items-center gap-2">
            <Leaf className="h-3.5 w-3.5 shrink-0 text-[#C5A880]" aria-hidden="true" />
            <span className="truncate font-medium tracking-wide">{announcementText}</span>
          </p>
          <nav className="hidden shrink-0 items-center gap-5 font-medium md:flex" aria-label="Quick links">
            <Link href="/account" className="flex items-center gap-1.5 transition-colors hover:text-[#C5A880]">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              Track Order
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 transition-colors hover:text-[#C5A880]">
              <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
              Help
            </Link>
            <Link href="/shop" className="flex items-center gap-1.5 transition-colors hover:text-[#C5A880]">
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              Offers
            </Link>
          </nav>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#1B4332]"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex flex-shrink-0 items-center gap-2.5 sm:gap-3" aria-label={`${storeName} home`}>
            <Image
              src={logoUrl}
              alt=""
              width={210}
              height={100}
              priority
              className="h-11 w-auto object-contain sm:h-14"
            />
            <span className="flex flex-col">
              <span className="font-serif text-lg font-extrabold leading-none tracking-tight text-[#1B4332] sm:text-2xl">
                {storeName}
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B08968] sm:block">
                Tradition for a Healthier Tomorrow
              </span>
            </span>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:text-[#1B4332]"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#1B4332] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <Link href={user ? "/account" : "/login"} className="p-2 text-gray-700 hover:text-[#1B4332]" aria-label={user ? "My account" : "Login"}>
              <UserIcon className="w-5 h-5" />
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} role="search" className="relative mx-6 hidden max-w-xl flex-1 md:block">
            {searchFields}
          </form>

          {/* Header Action Icons */}
          <div className="hidden items-center gap-5 md:flex sm:gap-6">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="flex flex-col items-center gap-0.5 text-gray-700 transition-colors hover:text-[#1B4332]"
              aria-label="Wishlist"
            >
              <span className="relative">
                <Heart className="h-5 w-5" aria-hidden="true" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C62828] text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">Wishlist</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={openCart}
              className="flex flex-col items-center gap-0.5 text-gray-700 transition-colors hover:text-[#1B4332]"
              aria-label="View shopping bag"
            >
              <span className="relative">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span key={itemCount} className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1B4332] text-[10px] font-bold text-white motion-safe:animate-[pop_.3s_ease-out]">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">Cart</span>
            </button>

            {/* User Account / Profile Dropdown */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex flex-col items-center gap-0.5 text-gray-700 transition-colors hover:text-[#1B4332]"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                  >
                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="flex max-w-[90px] items-center gap-0.5 text-[11px] font-medium">
                      <span className="truncate">{user.fullName.split(' ')[0]}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 text-gray-500" aria-hidden="true" />
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#F3EFE6] py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF7F2] hover:text-[#1B4332]"
                      >
                        My Orders & Invoices
                      </Link>
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-xs text-gray-700 hover:bg-[#FAF7F2] hover:text-[#1B4332]"
                      >
                        Saved Addresses
                      </Link>
                      {user.roles?.some((r) => ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'].includes(r)) && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                        >
                          ⚙️ Admin Control Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-col items-center gap-0.5 text-gray-700 transition-colors hover:text-[#1B4332]"
                >
                  <UserIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] font-medium">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar (Mobile) — always visible below the brand row */}
        <form onSubmit={handleSearchSubmit} role="search" className="relative pb-3 md:hidden">
          {searchFields}
        </form>

        {/* 3. NAVIGATION MENU (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 py-3 border-t border-[#F3EFE6] text-[13px] font-medium text-gray-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            type="button"
            onClick={() => setIsCategoryMenuOpen((open) => !open)}
            className="flex items-center gap-2 font-bold text-[#1B4332] transition-colors hover:text-[#2D6A4F]"
            aria-expanded={isCategoryMenuOpen}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            <span>Shop by Category</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#B08968]" aria-hidden="true" />
          </button>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="hover:text-[#1B4332] transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/shop" className="hover:text-[#1B4332] transition-colors">
            Browse Catalogue
          </Link>
          <Link href="/about" className="hover:text-[#1B4332] transition-colors">
            About Shlokveda
          </Link>
          <Link href="/contact" className="hover:text-[#1B4332] transition-colors">
            Contact
          </Link>
          <Link
            href="/shop"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#C5A880]/25 px-3.5 py-1.5 text-[12px] font-bold text-[#8A6D3B] transition-colors hover:bg-[#C5A880]/40"
          >
            <BadgePercent className="h-4 w-4" aria-hidden="true" />
            Deals & Offers
          </Link>
        </nav>

        {isCategoryMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close category menu"
              onClick={() => setIsCategoryMenuOpen(false)}
              className="fixed inset-0 top-0 z-40 bg-black/60 cursor-default"
            />
            <aside className="absolute left-0 top-full z-50 max-h-[calc(100vh-8rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-b-2xl border border-[#F3EFE6] bg-white shadow-2xl">
              <div className="flex items-center gap-2 bg-[#1B4332] px-5 py-4 text-sm font-bold text-white">
                <LayoutGrid className="h-4 w-4 text-[#C5A880]" aria-hidden="true" />
                All Categories
              </div>
              <div className="divide-y divide-[#F3EFE6]">
                {(categories.length ? categories : [
                  { id: 'syrups-juices', name: 'Syrups & Juices', slug: 'syrups-juices' },
                  { id: 'arks-drops', name: 'Arks & Drops', slug: 'arks-drops' },
                  { id: 'herbal-oils', name: 'Herbal Oils', slug: 'herbal-oils' },
                  { id: 'herbal-capsules', name: 'Herbal Capsules', slug: 'herbal-capsules' },
                  { id: 'tablets', name: 'Tablets', slug: 'tablets' },
                  { id: 'daily-wellness', name: 'Daily Wellness', slug: 'daily-wellness' },
                  { id: 'immunity-rasayana', name: 'Immunity & Rasayana', slug: 'immunity-rasayana' },
                  { id: 'personal-care', name: 'Personal Care', slug: 'personal-care' },
                ]).map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={() => setIsCategoryMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-[#FAF7F2] hover:text-[#1B4332] transition-colors"
                  >
                    <span>{category.name}</span><span className="text-gray-400 text-lg">›</span>
                  </Link>
                ))}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* 4. MOBILE SLIDING DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#F3EFE6] px-4 pt-3 pb-6 space-y-4 shadow-lg max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
          <div className="flex flex-col space-y-2.5 text-sm font-medium text-gray-700">
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1.5 border-b border-gray-100 text-[#1B4332] font-bold"
            >
              All Ayurvedic Remedies
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 border-b border-gray-50"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/shop" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              Browse Catalogue
            </Link>
            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              My Wishlist
            </Link>
            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              Track Order
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              About Shlokveda
            </Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="py-1">
              Contact & Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
