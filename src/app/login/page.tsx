'use client';

import { getPublicSettings } from '@/lib/client-data';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [logoUrl, setLogoUrl] = useState('/logo-emblem.png');
  const [storeName, setStoreName] = useState('SHLOKVEDA');
  const [nextPath, setNextPath] = useState('/account');

  useEffect(() => {
    // Return the shopper to where they were headed (checkout, an order page…)
    // instead of always dumping them on /account. Only same-site paths are
    // honoured (open-redirect guard).
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      setNextPath(next);
    }

    getPublicSettings().then((settings) => {
      if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
      if (settings?.storeName) setStoreName(settings.storeName.toUpperCase());
    });
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push(nextPath);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#F3EFE6] shadow-xl">
        <div className="text-center space-y-2">
          <Image src={logoUrl} alt={`${storeName} logo`} width={128} height={128} className="h-28 w-28 object-contain mx-auto" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#1B4332] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#2D6A4F] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center space-y-3">
          <p className="text-xs text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-bold text-[#1B4332] underline hover:text-[#2D6A4F]">
              Create an Account
            </Link>
          </p>

          <div className="p-3 bg-[#FAF7F2] rounded-xl text-[11px] text-gray-600 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Secure account access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
