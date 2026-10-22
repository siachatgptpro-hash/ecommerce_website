'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  login: (param1: string, param2?: string | User) => Promise<void> | void;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'shlokveda_user';
// Pre-fix builds wrote the profile under this misspelling; clear it too so no
// stale account data survives logout.
const LEGACY_USER_STORAGE_KEY = 'sholkveda_user';

function persistSession(user: User) {
  // Keep only non-sensitive display data locally. The session token remains HttpOnly server-side.
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
}

function clearPersistedSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  localStorage.removeItem('shlokveda_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Revalidate the HttpOnly cookie on every page load; never trust localStorage as authentication.
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('No active session');
        const data = await res.json();
        if (data.success && data.data) setUser(data.data);
        else throw new Error('No active session');
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        clearPersistedSession();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (param1: string, param2?: string | User) => {
    if (typeof param2 === 'object' && param2 !== null) {
      // Direct (token, user) call
      setToken(param1);
      setUser(param2 as User);
      persistSession(param2 as User);
      return;
    }

    if (typeof param2 === 'string') {
      // (email, password) credentials call
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: param1, password: param2 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Invalid email or password');
      }

      setToken(data.data.token || null);
      setUser(data.data.user);
      persistSession(data.data.user);
      return;
    }
  };

  const register = async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, fullName: data.name }),
    });

    const resData = await res.json();
    if (!res.ok || !resData.success) {
      throw new Error(resData.error?.message || 'Failed to create account');
    }

    setToken(resData.data.token);
    setUser(resData.data.user);
    persistSession(resData.data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearPersistedSession();
    // keepalive: the request must reach the server (to clear the HttpOnly
    // cookie) even if the caller navigates away immediately.
    fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated as User);
    persistSession(updated as User);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
