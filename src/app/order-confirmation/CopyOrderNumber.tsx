'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Copies the order reference number to the clipboard. Only shows the
 * confirmation state after the clipboard write actually succeeds.
 */
export function CopyOrderNumber({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copyOrderNumber}
      aria-label={copied ? 'Order reference copied' : 'Copy order reference'}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#A67C2E] transition-all duration-[var(--dur-ui)] ease-luxe hover:bg-[#FBF3E2] hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] motion-safe:hover:scale-105"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
