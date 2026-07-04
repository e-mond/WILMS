import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  APP_LOCK_MAX_ATTEMPTS,
  APP_LOCK_POST_LOGIN_GRACE_MS,
  APP_LOCK_STORAGE_KEY,
} from '@/constants/app-lock';
import { hashPinSync, verifyPinSync } from '@/lib/security/pin-hash';

interface AppLockState {
  isEnabled: boolean;
  pinConfigured: boolean;
  pinHash: string | null;
  pinUserId: string | null;
  isHydrated: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lastActivityAt: number;
  sessionStartedAt: number;
  setPin: (pin: string, userId: string) => void;
  clearPin: () => void;
  lock: () => void;
  unlock: () => void;
  verifyAndUnlock: (pin: string, userId: string) => { success: boolean; attemptsRemaining: number };
  recordActivity: () => void;
  syncUser: (userId: string | null) => void;
  markHydrated: () => void;
}

export const useAppLockStore = create<AppLockState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      pinConfigured: false,
      pinHash: null,
      pinUserId: null,
      isHydrated: false,
      isLocked: false,
      failedAttempts: 0,
      lastActivityAt: Date.now(),
      sessionStartedAt: Date.now(),

      setPin: (pin, userId) => {
        const now = Date.now();
        set({
          isEnabled: true,
          pinConfigured: true,
          pinHash: hashPinSync(pin, userId),
          pinUserId: userId,
          isLocked: false,
          failedAttempts: 0,
          lastActivityAt: now,
          sessionStartedAt: now,
        });
      },

      clearPin: () => {
        const now = Date.now();
        set({
          isEnabled: false,
          pinConfigured: false,
          pinHash: null,
          pinUserId: null,
          isLocked: false,
          failedAttempts: 0,
          lastActivityAt: now,
          sessionStartedAt: now,
        });
      },

      lock: () => {
        const { isEnabled, sessionStartedAt } = get();

        if (!isEnabled) {
          return;
        }

        if (Date.now() - sessionStartedAt < APP_LOCK_POST_LOGIN_GRACE_MS) {
          return;
        }

        set({ isLocked: true });
      },

      unlock: () => {
        const now = Date.now();
        set({
          isLocked: false,
          failedAttempts: 0,
          lastActivityAt: now,
          sessionStartedAt: now,
        });
      },

      verifyAndUnlock: (pin, userId) => {
        const { pinHash, pinUserId, failedAttempts } = get();

        if (!pinHash || pinUserId !== userId) {
          return { success: false, attemptsRemaining: 0 };
        }

        if (verifyPinSync(pin, userId, pinHash)) {
          get().unlock();
          return { success: true, attemptsRemaining: APP_LOCK_MAX_ATTEMPTS };
        }

        const nextAttempts = failedAttempts + 1;
        set({ failedAttempts: nextAttempts });

        return {
          success: false,
          attemptsRemaining: Math.max(APP_LOCK_MAX_ATTEMPTS - nextAttempts, 0),
        };
      },

      recordActivity: () => {
        set({ lastActivityAt: Date.now() });
      },

      syncUser: (userId) => {
        const { pinUserId, isEnabled } = get();

        if (!isEnabled || !userId || pinUserId === userId) {
          return;
        }

        get().clearPin();
      },

      markHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: APP_LOCK_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        pinConfigured: state.pinConfigured,
        pinHash: state.pinHash,
        pinUserId: state.pinUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        if (state?.isEnabled) {
          state.pinConfigured = true;
          state.unlock();
        }
      },
    },
  ),
);
