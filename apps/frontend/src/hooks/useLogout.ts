'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { csrfHeaders } from '@/lib/auth/csrf';
import { playLogoutSound } from '@/hooks/useNotificationSound';
import { useAuthStore } from '@/state/authStore';

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders(),
      });
    } catch {
      // Clear local session and redirect even if the logout request fails.
    } finally {
      playLogoutSound();
      clearSession();
      router.replace('/login');
      setIsLoggingOut(false);
    }
  }, [clearSession, isLoggingOut, router]);

  return {
    logout,
    isLoggingOut,
  };
}
