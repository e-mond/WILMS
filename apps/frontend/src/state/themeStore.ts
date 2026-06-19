import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { THEME_MODE, THEME_STORAGE_KEY, type ThemeMode } from '@/constants/theme';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  markHydrated: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: THEME_MODE.LIGHT,
      isHydrated: false,

      setMode: (mode) => {
        set({ mode });
      },

      toggleMode: () => {
        const next =
          get().mode === THEME_MODE.DARK ? THEME_MODE.LIGHT : THEME_MODE.DARK;
        set({ mode: next });
      },

      markHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
