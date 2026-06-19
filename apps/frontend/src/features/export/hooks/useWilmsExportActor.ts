'use client';

import { useAuth } from '@/hooks/useAuth';

export function useWilmsExportActor(fallback = 'WILMS System'): string {
  const { user } = useAuth();
  return user?.displayName ?? user?.id ?? fallback;
}
