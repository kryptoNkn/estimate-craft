'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  changePassword as changePasswordRequest,
  fetchCurrentUser,
  loginUser,
  logoutAllUser,
  logoutUser,
  registerUser,
  resetPassword as resetPasswordRequest,
  ApiError,
} from '@/lib/api';
import { clearToken, getToken, setTokens } from '@/lib/auth-storage';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearToken();
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      const response = await loginUser(email, password);
      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      router.push(redirectTo ?? '/profile');
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await registerUser(email, password);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    void logoutUser().finally(() => {
      clearToken();
      setUser(null);
      router.push('/');
    });
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllUser();
    } finally {
      clearToken();
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const resetPassword = useCallback(
    async (token: string, password: string) => {
      const response = await resetPasswordRequest(token, password);
      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
      router.push('/profile');
    },
    [router],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const response = await changePasswordRequest(currentPassword, newPassword);
      setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      logoutAll,
      refreshUser,
      changePassword,
      resetPassword,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      logoutAll,
      refreshUser,
      changePassword,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
