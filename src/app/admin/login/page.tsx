'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

export default function AdminLoginPage() {
  const router = useRouter(); const { login } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setError(''); setLoading(true); try { await login(email.trim(), password); router.push('/admin'); } catch { setError('Invalid email or password.'); } finally { setLoading(false); } };
  return <main className="min-h-screen flex items-center justify-center bg-[#F4F1EA] p-4"><form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl border border-[#F3EFE6]"><Image src="/logo.png" width={100} height={100} alt="Store logo" className="mx-auto h-24 w-24 object-contain" /><h1 className="text-center font-serif text-2xl font-bold text-gray-900">Secure Sign In</h1>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="block text-sm font-bold text-gray-700">Email<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Enter your email" /></label><label className="block text-sm font-bold text-gray-700">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3" placeholder="Enter your password" /></label><button disabled={loading} className="w-full rounded-xl bg-[#1B4332] py-3 font-bold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button></form></main>;
}
