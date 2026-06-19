'use client';

import { useAuthStore } from '@/state/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isExpired = useAuthStore((state) => state.isExpired);
  const clearSession = useAuthStore((state) => state.clearSession);

  return {
    user,
    expiresAt,
    isHydrated,
    isExpired,
    isAuthenticated: Boolean(user) && !isExpired,
    clearSession,
  };
}
