'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/types';
import { ApiRequestError, parseApiResponse } from '@/lib/client-api';
import { scopeFromPathname } from '@/lib/session';
import type { SessionScope } from '@/lib/session';

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

interface AuthContextType {
  /** User for the current route scope: admin under /admin, customer elsewhere. */
  user: User | null;
  customerUser: User | null;
  adminUser: User | null;
  sessionScope: SessionScope;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  sessionError: string | null;
  login: (param1: string, param2?: string | User, scope?: SessionScope) => Promise<void> | void;
  register: (data: RegisterData) => Promise<void>;
  logout: (scope?: SessionScope) => void;
  updateUser: (user: Partial<User>) => void;
  refreshSession: (scope?: SessionScope) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SYNC_KEY = 'shlokveda_auth_sync_v2';
const LEGACY_STORAGE_KEYS = ['shlokveda_user', 'sholkveda_user', 'shlokveda_token'];
const SESSION_REFRESH_TIMEOUT_MS = 15_000;
const AUTH_REQUEST_TIMEOUT_MS = 20_000;

function clearLegacyPersistedSession() {
  try {
    for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
  } catch {
    // Private browsing/storage failures must never break authentication UI.
  }
}

function broadcastSessionChange(scope: SessionScope, action: string, userId?: string) {
  try {
    localStorage.setItem(
      AUTH_SYNC_KEY,
      JSON.stringify({ scope, action, userId, at: Date.now(), nonce: Math.random() })
    );
  } catch {
    // Cross-tab sync is an enhancement; focus revalidation remains as backup.
  }
}

function friendlyAuthError(error: unknown, fallback: string): Error {
  if (error instanceof ApiRequestError) return error;
  if (error instanceof Error && error.name === 'AbortError') return error;
  return new Error(fallback);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeScope = useMemo(() => scopeFromPathname(pathname), [pathname]);

  const [users, setUsers] = useState<Record<SessionScope, User | null>>({
    customer: null,
    admin: null,
  });
  const [loadedScopes, setLoadedScopes] = useState<Record<SessionScope, boolean>>({
    customer: false,
    admin: false,
  });
  const [loadingScopes, setLoadingScopes] = useState<Record<SessionScope, boolean>>({
    customer: false,
    admin: false,
  });
  const [directToken, setDirectToken] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const activeScopeRef = useRef(activeScope);
  const usersRef = useRef(users);
  const loadedRef = useRef(loadedScopes);
  const authVersionRef = useRef<Record<SessionScope, number>>({ customer: 0, admin: 0 });
  const refreshSeqRef = useRef<Record<SessionScope, number>>({ customer: 0, admin: 0 });
  const refreshAbortRef = useRef<Partial<Record<SessionScope, AbortController>>>({});
  const authOperationRef = useRef<Record<SessionScope, boolean>>({ customer: false, admin: false });
  const lastRefreshRef = useRef<Record<SessionScope, number>>({ customer: 0, admin: 0 });

  useEffect(() => {
    activeScopeRef.current = activeScope;
  }, [activeScope]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    loadedRef.current = loadedScopes;
  }, [loadedScopes]);

  const markLoaded = useCallback((scope: SessionScope, loaded: boolean) => {
    loadedRef.current = { ...loadedRef.current, [scope]: loaded };
    setLoadedScopes((previous) => ({ ...previous, [scope]: loaded }));
  }, []);

  const applyUser = useCallback(
    (scope: SessionScope, nextUser: User | null) => {
      usersRef.current = { ...usersRef.current, [scope]: nextUser };
      setUsers((previous) => ({ ...previous, [scope]: nextUser }));
      markLoaded(scope, true);
      setLoadingScopes((previous) => ({ ...previous, [scope]: false }));
      lastRefreshRef.current[scope] = Date.now();
      if (nextUser) setSessionError(null);
      clearLegacyPersistedSession();
    },
    [markLoaded]
  );

  const invalidateRefresh = useCallback((scope: SessionScope) => {
    refreshSeqRef.current[scope] += 1;
    refreshAbortRef.current[scope]?.abort();
    delete refreshAbortRef.current[scope];
  }, []);

  const beginAuthOperation = useCallback(
    (scope: SessionScope) => {
      authVersionRef.current[scope] += 1;
      authOperationRef.current[scope] = true;
      invalidateRefresh(scope);
      return authVersionRef.current[scope];
    },
    [invalidateRefresh]
  );

  const refreshSession = useCallback(
    async (scope: SessionScope = activeScopeRef.current): Promise<User | null> => {
      if (authOperationRef.current[scope]) return usersRef.current[scope];

      const authVersion = authVersionRef.current[scope];
      const refreshSeq = ++refreshSeqRef.current[scope];
      refreshAbortRef.current[scope]?.abort();
      const controller = new AbortController();
      refreshAbortRef.current[scope] = controller;
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, SESSION_REFRESH_TIMEOUT_MS);

      if (!loadedRef.current[scope]) {
        setLoadingScopes((previous) => ({ ...previous, [scope]: true }));
      }

      const isStale = () =>
        refreshSeq !== refreshSeqRef.current[scope] ||
        authVersion !== authVersionRef.current[scope];

      try {
        const response = await fetch(`/api/auth/me?scope=${scope}`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await parseApiResponse(response, 'No active session.');
        if (isStale()) return usersRef.current[scope];
        if (!data?.data) throw new ApiRequestError('No active session.', 401);

        const nextUser = data.data as User;
        applyUser(scope, nextUser);
        return nextUser;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          if (timedOut && !isStale()) {
            setSessionError('We could not confirm your sign-in right now. Please check your connection.');
            markLoaded(scope, true);
            lastRefreshRef.current[scope] = Date.now();
          }
          return usersRef.current[scope];
        }
        if (isStale()) return usersRef.current[scope];

        if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
          applyUser(scope, null);
          if (scope === 'customer') setDirectToken(null);
          return null;
        }

        // A transient 5xx/network failure should not erase an already
        // verified in-memory identity. Protected APIs still re-check the
        // cookie and database roles on every action.
        setSessionError('We could not confirm your sign-in right now. Please check your connection.');
        markLoaded(scope, true);
        lastRefreshRef.current[scope] = Date.now();
        return usersRef.current[scope];
      } finally {
        clearTimeout(timeoutId);
        if (!isStale()) {
          setLoadingScopes((previous) => ({ ...previous, [scope]: false }));
        }
        if (refreshAbortRef.current[scope] === controller) {
          delete refreshAbortRef.current[scope];
        }
      }
    },
    [applyUser, markLoaded]
  );

  useEffect(() => {
    clearLegacyPersistedSession();
    if (!loadedRef.current[activeScope]) {
      void refreshSession(activeScope);
    } else if (
      activeScope === 'admin' &&
      Date.now() - lastRefreshRef.current.admin > 15_000
    ) {
      // Admin pages revalidate on navigation (throttled) so a changed or
      // revoked admin session cannot leave a convincing stale console open.
      void refreshSession('admin');
    }
  }, [activeScope, pathname, refreshSession]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState === 'hidden') return;
      const scope = activeScopeRef.current;
      if (Date.now() - lastRefreshRef.current[scope] > 2_000) {
        void refreshSession(scope);
      }
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [refreshSession]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_SYNC_KEY || !event.newValue) return;
      let payload: { scope?: SessionScope; action?: string } | null = null;
      try {
        payload = JSON.parse(event.newValue);
      } catch {
        return;
      }
      if (payload?.scope !== 'customer' && payload?.scope !== 'admin') return;

      const scope = payload.scope;
      authVersionRef.current[scope] += 1;
      invalidateRefresh(scope);

      if (scope === activeScopeRef.current) {
        void refreshSession(scope);
      } else if (payload.action === 'logout') {
        applyUser(scope, null);
        if (scope === 'customer') setDirectToken(null);
      } else {
        // Do not show the previous account for the other scope after another
        // tab changed it; force a fresh /me check when that scope is opened.
        usersRef.current = { ...usersRef.current, [scope]: null };
        setUsers((previous) => ({ ...previous, [scope]: null }));
        markLoaded(scope, false);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyUser, invalidateRefresh, markLoaded, refreshSession]);

  useEffect(
    () => () => {
      for (const controller of Object.values(refreshAbortRef.current)) controller?.abort();
    },
    []
  );

  const login = useCallback(
    async (param1: string, param2?: string | User, requestedScope?: SessionScope) => {
      const scope = requestedScope || activeScopeRef.current;

      if (typeof param2 === 'object' && param2 !== null) {
        // Backwards-compatible direct (token, user) call. Normal sign-in
        // never receives a token in JavaScript; it stays HttpOnly.
        beginAuthOperation(scope);
        authOperationRef.current[scope] = false;
        if (scope === 'customer') setDirectToken(param1);
        applyUser(scope, param2 as User);
        broadcastSessionChange(scope, 'login', (param2 as User).id);
        return;
      }

      if (typeof param2 !== 'string') return;

      const authVersion = beginAuthOperation(scope);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
      let needsSessionRefresh = false;
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
          body: JSON.stringify({ email: param1, password: param2, scope }),
        });
        const data = await parseApiResponse(
          response,
          scope === 'admin' ? 'Could not sign in to the admin panel.' : 'Invalid email or password.'
        );
        const nextUser = data.data?.user as User | undefined;
        if (!nextUser) {
          throw new ApiRequestError('Sign-in returned an invalid response. Please try again.', response.status);
        }
        if (authVersion !== authVersionRef.current[scope]) {
          needsSessionRefresh = true;
          return;
        }

        if (scope === 'customer') setDirectToken(null);
        applyUser(scope, nextUser);
        broadcastSessionChange(scope, 'login', nextUser.id);
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error('Sign-in took too long. Please check your connection and try again.');
        }
        throw friendlyAuthError(error, 'We could not reach the sign-in service. Please try again.');
      } finally {
        clearTimeout(timeoutId);
        authOperationRef.current[scope] = false;
        if (needsSessionRefresh) void refreshSession(scope);
      }
    },
    [applyUser, beginAuthOperation, refreshSession]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const scope: SessionScope = 'customer';
      const authVersion = beginAuthOperation(scope);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
      let needsSessionRefresh = false;
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
          body: JSON.stringify({ ...data, fullName: data.name }),
        });
        const responseData = await parseApiResponse(response, 'Failed to create account.');
        const nextUser = responseData.data?.user as User | undefined;
        if (!nextUser) {
          throw new ApiRequestError('Registration returned an invalid response. Please try again.', response.status);
        }
        if (authVersion !== authVersionRef.current[scope]) {
          needsSessionRefresh = true;
          return;
        }

        setDirectToken(null);
        applyUser(scope, nextUser);
        broadcastSessionChange(scope, 'login', nextUser.id);
      } catch (error) {
        if (controller.signal.aborted) {
          throw new Error('Registration took too long. Please check your connection and try again.');
        }
        throw friendlyAuthError(error, 'We could not reach the registration service. Please try again.');
      } finally {
        clearTimeout(timeoutId);
        authOperationRef.current[scope] = false;
        if (needsSessionRefresh) void refreshSession(scope);
      }
    },
    [applyUser, beginAuthOperation, refreshSession]
  );

  const logout = useCallback(
    (requestedScope?: SessionScope) => {
      const scope = requestedScope || activeScopeRef.current;
      beginAuthOperation(scope);
      authOperationRef.current[scope] = false;
      if (scope === 'customer') setDirectToken(null);
      applyUser(scope, null);
      broadcastSessionChange(scope, 'logout');

      // keepalive: the request must reach the server (to clear only this
      // scope's HttpOnly cookie) even if the caller navigates immediately.
      fetch(`/api/auth/logout?scope=${scope}`, {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
      }).catch(() => {});
    },
    [applyUser, beginAuthOperation]
  );

  const updateUser = useCallback(
    (updates: Partial<User>) => {
      const scope = activeScopeRef.current;
      const current = usersRef.current[scope];
      if (!current) return;
      const updated = { ...current, ...updates } as User;
      applyUser(scope, updated);
      broadcastSessionChange(scope, 'updated', updated.id);
    },
    [applyUser]
  );

  const user = users[activeScope];
  const isLoading = !loadedScopes[activeScope] || loadingScopes[activeScope];

  return (
    <AuthContext.Provider
      value={{
        user,
        customerUser: users.customer,
        adminUser: users.admin,
        sessionScope: activeScope,
        token: activeScope === 'customer' ? directToken : null,
        isLoading,
        loading: isLoading,
        sessionError,
        login,
        register,
        logout,
        updateUser,
        refreshSession,
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
