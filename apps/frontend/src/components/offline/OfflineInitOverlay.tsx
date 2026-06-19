'use client';

import { WilmsSplashScreen } from '@/components/feedback/WilmsSplashScreen';
import { selectPendingQueueCount, useOfflineQueueStore } from '@/state/offlineQueueStore';

export function OfflineInitOverlay() {
  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);
  const pendingCount = selectPendingQueueCount(items);

  if (syncState !== 'syncing' || pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-sm">
      <WilmsSplashScreen message={`Syncing ${pendingCount} queued payment${pendingCount === 1 ? '' : 's'}...`} />
    </div>
  );
}
