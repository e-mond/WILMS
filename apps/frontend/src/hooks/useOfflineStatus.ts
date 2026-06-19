'use client';

import { useEffect, useState } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
}

function getInitialOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
