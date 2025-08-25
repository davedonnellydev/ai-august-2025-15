'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';

type AppStateContextValue = {
  currentUrl: string | null;
  setCurrentUrl: (url: string | null) => void;
  setUrlAndSync: (url: string | null) => void;
  remainingRequests: number;
  refreshRemainingRequests: () => void;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
);

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number>(0);

  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    setCurrentUrl(urlParam ? urlParam : null);
  }, [searchParams]);

  const setUrlAndSync = (url: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (url && url.length > 0) {
      params.set('url', url);
    } else {
      params.delete('url');
    }
    router.push(
      `${pathname}${params.toString() ? `?${params.toString()}` : ''}`
    );
  };

  const refreshRemainingRequests = () => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  };

  const value = useMemo(
    () => ({
      currentUrl,
      setCurrentUrl,
      setUrlAndSync,
      remainingRequests,
      refreshRemainingRequests,
    }),
    [currentUrl, remainingRequests]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
