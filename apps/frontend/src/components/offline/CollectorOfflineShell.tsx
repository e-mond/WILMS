'use client';

import { useEffect, type ReactNode } from 'react';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { OfflineInitOverlay } from '@/components/offline/OfflineInitOverlay';
import { PWA_SW_MESSAGE_TYPE } from '@/constants/pwa';
import { useOfflineQueueSync } from '@/hooks/useOfflineQueueSync';
import { useOfflineQueueToasts } from '@/hooks/useOfflineQueueToasts';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { replayQueuedExpense } from '@/lib/offline-queue/expenseSyncHandler';
import { replayQueuedPayment } from '@/lib/offline-queue/paymentSyncHandler';
import {
  selectHasQueueWarning,
  selectPendingExpenseCount,
  selectPendingPaymentCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';
import type {
  OfflineExpenseSyncHandler,
  OfflinePaymentSyncHandler,
} from '@/types/offline-queue';

interface CollectorOfflineShellProps {
  children: ReactNode;
  paymentSyncHandler?: OfflinePaymentSyncHandler;
  expenseSyncHandler?: OfflineExpenseSyncHandler;
}

export function CollectorOfflineShell({
  children,
  paymentSyncHandler = replayQueuedPayment,
  expenseSyncHandler = replayQueuedExpense,
}: CollectorOfflineShellProps) {
  const { isOffline } = useOfflineStatus();
  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);

  const { runSync } = useOfflineQueueSync({ paymentSyncHandler, expenseSyncHandler });
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

  const pendingPayments = selectPendingPaymentCount(items);
  const pendingExpenses = selectPendingExpenseCount(items);
  const reviewPayments = selectQueuedForReviewPaymentCount(items);
  const hasQueueWarning = selectHasQueueWarning(items);
  const showBanner =
    isOffline ||
    pendingPayments > 0 ||
    pendingExpenses > 0 ||
    reviewPayments > 0 ||
    hasQueueWarning;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <OfflineInitOverlay />
      {showBanner ? (
        <OfflineBanner
          isOffline={isOffline}
          pendingPayments={pendingPayments}
          pendingExpenses={pendingExpenses}
          reviewPayments={reviewPayments}
          isSyncing={syncState === 'syncing'}
          hasQueueWarning={hasQueueWarning}
        />
      ) : null}
      {children}
    </div>
  );
}
