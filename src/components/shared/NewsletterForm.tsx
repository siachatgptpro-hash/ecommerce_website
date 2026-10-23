'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

/**
 * Footer "Stay Updated" form. Posts to the real /api/newsletter endpoint
 * and only reports success after the server confirms the subscription —
 * never a fake success message.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const isLoading = status.kind === 'loading';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setStatus({ kind: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setStatus({ kind: 'loading' });
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setStatus({
          kind: 'success',
          message: data.data?.alreadySubscribed
            ? "You're already subscribed with this email."
            : "Thank you — you're subscribed.",
        });
        setEmail('');
      } else {
        const fieldMessage = data?.error?.details?.fieldErrors?.email?.[0];
        const apiMessage =
          typeof data?.error === 'string' ? data.error : data?.error?.message;
        setStatus({
          kind: 'error',
          message:
            fieldMessage || apiMessage || data?.message || 'Something went wrong. Please try again.',
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2.5 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address for newsletter updates
        </label>
        <div className="relative flex-1">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status.kind === 'error') setStatus({ kind: 'idle' });
            }}
            disabled={isLoading}
            aria-invalid={status.kind === 'error'}
            aria-describedby="newsletter-status"
            className="w-full rounded-full bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-[#C5A880] disabled:opacity-70"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#C5A880] px-6 py-3 text-sm font-bold text-[#0F281E] transition-colors hover:bg-[#D6BC94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A880] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F281E] disabled:cursor-wait disabled:opacity-80"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {isLoading ? 'Subscribing…' : 'Subscribe'}
        </button>
      </form>

      <div id="newsletter-status" role="status" aria-live="polite" className="min-h-[1.25rem]">
        {status.kind === 'success' && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {status.message}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}
