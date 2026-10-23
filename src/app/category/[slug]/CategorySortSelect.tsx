'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface CategorySortSelectProps {
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

/**
 * Sort control for the server-rendered category page. Updates the `sort`
 * query parameter (the page re-queries the repository server-side) and
 * resets pagination. The default sort keeps the URL clean.
 */
export function CategorySortSelect({ value, options }: CategorySortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams.toString());
    if (event.target.value === 'featured') {
      next.delete('sort');
    } else {
      next.set('sort', event.target.value);
    }
    next.delete('page');
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <select
      id="category-sort"
      value={value}
      onChange={handleChange}
      className="min-w-[180px] rounded-xl border border-[#D8CFBB] bg-white/90 px-3.5 py-2.5 text-[13px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] duration-[var(--dur-ui)] ease-luxe hover:border-[#D9BE8C] focus:outline-none focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/40"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
