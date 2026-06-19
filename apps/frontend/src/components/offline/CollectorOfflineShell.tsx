'use client';

import { useEffect, type ReactNode } from 'react';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { OfflineInitOverlay } from '@/components/offline/OfflineInitOverlay';
import { PWA_SW_MESSAGE_TYPE } from '@/constants/pwa';
import { useOfflineQueueSync } from '@/hooks/useOfflineQueueSync';
import { useOfflineQueueToasts } from '@/hooks/useOfflineQueueToasts';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { replayQueuedPayment } from '@/lib/offline-queue/paymentSyncHandler';
import {
  selectHasQueueWarning,
  selectPendingQueueCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';
import type { OfflinePaymentSyncHandler } from '@/types/offline-queue';

interface CollectorOfflineShellProps {
  children: ReactNode;
  /** Override for tests; defaults to paymentService replay. */
  syncHandler?: OfflinePaymentSyncHandler;
}

export function CollectorOfflineShell({
  children,
  syncHandler = replayQueuedPayment,
}: CollectorOfflineShellProps) {
  const { isOffline } = useOfflineStatus();
  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);

  const { runSync } = useOfflineQueueSync({ syncHandler });
  useOfflineQueueToasts();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === PWA_SW_MESSAGE_TYPE) {
        void runSync();
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, [runSync]);

  const pendingCount = selectPendingQueueCount(items);
  const hasQueueWarning = selectHasQueueWarning(items);
  const showBanner = isOffline || pendingCount > 0 || hasQueueWarning;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <OfflineInitOverlay />
      {showBanner ? (
        <OfflineBanner
          isOffline={isOffline}
          pendingCount={pendingCount}
          isSyncing={syncState === 'syncing'}
          hasQueueWarning={hasQueueWarning}
        />
      ) : null}
      {children}
    </div>
  );
}
