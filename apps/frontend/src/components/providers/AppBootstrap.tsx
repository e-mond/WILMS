'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  PremiumSplashScreen,
  SPLASH_FADE_MS,
  SPLASH_LOGO_MS,
  type SplashPhase,
} from '@/components/feedback/PremiumSplashScreen';
import { WilmsSplashScreen } from '@/components/feedback/WilmsSplashScreen';
import { clearChunkRecoveryAttempt } from '@/lib/chunk-recovery';
import { useAppLockStore } from '@/state/appLockStore';
import { useAuthStore } from '@/state/authStore';
import { useThemeStore } from '@/state/themeStore';

interface AppBootstrapProps {
  children: ReactNode;
}

const SPLASH_LOADER_HOLD_MS = 450;

export function AppBootstrap({ children }: AppBootstrapProps) {
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const themeHydrated = useThemeStore((state) => state.isHydrated);
  const appLockHydrated = useAppLockStore((state) => state.isHydrated);
  const reduceMotion = useReducedMotion();
  const storesReady = authHydrated && themeHydrated && appLockHydrated;

  const [splashPhase, setSplashPhase] = useState<SplashPhase>('launch');
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (splashDone) {
      return;
    }

    if (reduceMotion) {
      setSplashPhase('complete');
      setSplashDone(true);
      return;
    }

    const launchTimer = window.setTimeout(() => setSplashPhase('logo'), 80);
    const loaderTimer = window.setTimeout(() => setSplashPhase('loader'), SPLASH_LOGO_MS);
    const fadeTimer = window.setTimeout(
      () => setSplashPhase('fade'),
      SPLASH_LOGO_MS + SPLASH_LOADER_HOLD_MS,
    );

    return () => {
      window.clearTimeout(launchTimer);
      window.clearTimeout(loaderTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [splashDone, reduceMotion]);

  useEffect(() => {
    if (storesReady) {
      clearChunkRecoveryAttempt();
    }
  }, [storesReady]);

  useEffect(() => {
    if (!storesReady || splashDone) {
      return;
    }

    const completeTimer = window.setTimeout(() => {
      setSplashPhase('complete');
    }, SPLASH_LOGO_MS + SPLASH_LOADER_HOLD_MS + SPLASH_FADE_MS);

    return () => window.clearTimeout(completeTimer);
  }, [storesReady, splashDone]);

  if (!splashDone) {
    return (
      <PremiumSplashScreen
        phase={splashPhase}
        loaderMessage={storesReady ? 'Opening WILMS…' : 'Restoring your session…'}
        onComplete={() => setSplashDone(true)}
      />
    );
  }

  if (!storesReady) {
    return <WilmsSplashScreen message="Restoring your session…" />;
  }

  return children;
}
