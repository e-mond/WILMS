'use client';

import type { ReactNode } from 'react';
import { WilmsSplashScreen } from '@/components/feedback/WilmsSplashScreen';
import { useAppLockStore } from '@/state/appLockStore';
import { useAuthStore } from '@/state/authStore';
import { useThemeStore } from '@/state/themeStore';

interface AppBootstrapProps {
  children: ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const themeHydrated = useThemeStore((state) => state.isHydrated);
  const appLockHydrated = useAppLockStore((state) => state.isHydrated);
  const isReady = authHydrated && themeHydrated && appLockHydrated;

  if (!isReady) {
    return <WilmsSplashScreen message="Restoring your session..." />;
  }

  return children;
}
