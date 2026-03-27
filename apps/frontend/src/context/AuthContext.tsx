'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  useEffect(() => {
    if (!loading) {
      if (!user && !PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login');
      } else if (user && PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password }) as { user: User };
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.register({ name, email, password }) as { user: User };
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
