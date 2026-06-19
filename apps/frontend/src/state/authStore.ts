import { create } from 'zustand';
import type { SessionUser } from '@/types/auth';

interface AuthState {
  user: SessionUser | null;
  expiresAt: number | null;
  isHydrated: boolean;
  isExpired: boolean;
  hydrate: (user: SessionUser | null, expiresAt: number | null) => void;
  setSession: (user: SessionUser, expiresAt: number) => void;
  markSessionExpired: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  expiresAt: null,
  isHydrated: false,
  isExpired: false,

  hydrate: (user, expiresAt) => {
    const isExpired = expiresAt !== null && expiresAt <= Date.now();
    set({
      user: isExpired ? null : user,
      expiresAt,
      isHydrated: true,
      isExpired,
    });
  },

  setSession: (user, expiresAt) => {
    set({
      user,
      expiresAt,
      isHydrated: true,
      isExpired: false,
    });
  },

  markSessionExpired: () => {
    set({
      user: null,
      expiresAt: null,
      isHydrated: true,
      isExpired: true,
    });
  },

  clearSession: () => {
    set({
      user: null,
      expiresAt: null,
      isHydrated: true,
      isExpired: false,
    });
  },
}));
