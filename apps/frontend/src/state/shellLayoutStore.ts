import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SHELL_LAYOUT_STORAGE_KEY } from '@/constants/shell-layout';

interface ShellLayoutState {
  isSidebarCollapsed: boolean;
  isHydrated: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useShellLayoutStore = create<ShellLayoutState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isHydrated: false,

      setSidebarCollapsed: (collapsed) => {
        set({ isSidebarCollapsed: collapsed });
      },

      toggleSidebarCollapsed: () => {
        set({ isSidebarCollapsed: !get().isSidebarCollapsed });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: SHELL_LAYOUT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
