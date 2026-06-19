'use client';

import { useEffect, type ReactNode } from 'react';
import { THEME_MODE } from '@/constants/theme';
import { useThemeStore } from '@/state/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

function applyThemeMode(mode: string): void {
  const root = document.documentElement;
  root.classList.toggle(THEME_MODE.DARK, mode === THEME_MODE.DARK);
  root.dataset.theme = mode === THEME_MODE.DARK ? THEME_MODE.DARK : THEME_MODE.LIGHT;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode);
  const isHydrated = useThemeStore((state) => state.isHydrated);

  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isHydrated) {
      applyThemeMode(mode);
      document.documentElement.dataset.themeStoreReady = 'true';
    }
  }, [isHydrated, mode]);

  return children;
}
