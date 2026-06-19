'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppLockStore } from '@/state/appLockStore';
import { useAuthStore } from '@/state/authStore';
import type { AuthSession } from '@/types/auth';

interface AuthHydratorProps {
  session: AuthSession | null;
  children: ReactNode;
}

export function AuthHydrator({ session, children }: AuthHydratorProps) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    if (session) {
      hydrate(session.user, session.expiresAt);
      useAppLockStore.getState().unlock();
      useAppLockStore.getState().recordActivity();
      return;
    }

    hydrate(null, null);
  }, [hydrate, session]);

  return children;
}
