'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

const ADMIN_ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'CONTENT_MANAGER'];

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [nextPath, setNextPath] = useState('/admin');
  const [sessionChanged, setSessionChanged] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/admin') && !next.startsWith('//')) setNextPath(next);
    setSessionChanged(params.get('reason') === 'session-changed');
  }, []);

  const isAdmin = !!user?.roles?.some((role: string) => ADMIN_ROLE_NAMES.includes(role));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, 'admin');
      router.push(nextPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F4F1EA] p-4">
      <section className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl border border-[#F3EFE6]">
        <Image src="/logo-full.png" width={100} height={100} alt="Store logo" className="mx-auto h-24 w-24 object-contain" />
        <h1 className="text-center font-serif text-2xl font-bold text-gray-900">Secure Sign In</h1>

        {sessionChanged && !error && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Your admin session expired or changed. Please sign in again to continue.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {!authLoading && user && isAdmin && !switchingAccount ? (
          <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <p className="text-sm text-gray-700">
              You are already signed in to Admin as{' '}
              <strong className="text-gray-900">{user.fullName || user.name || 'Administrator'}</strong>
              {user.email ? <span className="block text-xs text-gray-500">{user.email}</span> : null}
            </p>
            <button
              type="button"
              onClick={() => router.push(nextPath)}
              className="w-full rounded-xl bg-[#1B4332] py-3 font-bold text-white"
            >
              Continue to Admin
            </button>
            <button
              type="button"
              onClick={() => {
                logout('admin');
                setSwitchingAccount(true);
                setError('');
              }}
              className="w-full rounded-xl bg-white border border-gray-200 py-3 font-bold text-gray-700"
            >
              Use a different admin account
            </button>
          </div>
        ) : (
          <>
            {!authLoading && user && !isAdmin && (
              <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                The account currently available here ({user.fullName || user.email}) does not have admin
                access. Sign in below with an administrator account. Your customer sign-in will stay separate.
              </p>
            )}

            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-bold text-gray-700">
                Email
                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                  placeholder="Enter your email"
                />
              </label>
              <label className="block text-sm font-bold text-gray-700">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3"
                  placeholder="Enter your password"
                />
              </label>
              <button
                disabled={loading}
                className="w-full rounded-xl bg-[#1B4332] py-3 font-bold text-white disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
