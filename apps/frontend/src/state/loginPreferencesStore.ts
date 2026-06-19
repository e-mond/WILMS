import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LOGIN_PREFERENCES_STORAGE_KEY } from '@/constants/login-preferences';

interface LoginPreferencesState {
  rememberEmail: boolean;
  rememberedEmail: string;
  isHydrated: boolean;
  setRememberEmail: (remember: boolean) => void;
  setRememberedEmail: (email: string) => void;
  clearRememberedEmail: () => void;
  markHydrated: () => void;
}

export const useLoginPreferencesStore = create<LoginPreferencesState>()(
  persist(
    (set) => ({
      rememberEmail: false,
      rememberedEmail: '',
      isHydrated: false,

      setRememberEmail: (remember) => {
        set({ rememberEmail: remember });

        if (!remember) {
          set({ rememberedEmail: '' });
        }
      },

      setRememberedEmail: (email) => {
        set({ rememberedEmail: email.trim() });
      },

      clearRememberedEmail: () => {
        set({ rememberedEmail: '', rememberEmail: false });
      },

      markHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: LOGIN_PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rememberEmail: state.rememberEmail,
        rememberedEmail: state.rememberedEmail,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
