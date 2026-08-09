'use client';

import { useEffect, type ReactNode } from 'react';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { OfflineInitOverlay } from '@/components/offline/OfflineInitOverlay';
import { OfflineSyncStatusPanel } from '@/components/offline/OfflineSyncStatusPanel';
import { PWA_SW_MESSAGE_TYPE } from '@/constants/pwa';
import { useOfflineQueueSync } from '@/hooks/useOfflineQueueSync';
import { useOfflineQueueToasts } from '@/hooks/useOfflineQueueToasts';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { replayQueuedExpense } from '@/lib/offline-queue/expenseSyncHandler';
import { replayQueuedHolidayRequest } from '@/lib/offline-queue/holidaySyncHandler';
import { replayQueuedPayment } from '@/lib/offline-queue/paymentSyncHandler';
import {
  selectHasQueueWarning,
  selectPendingExpenseCount,
  selectPendingHolidayCount,
  selectPendingPaymentCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';
import type {
  OfflineExpenseSyncHandler,
  OfflineHolidaySyncHandler,
  OfflinePaymentSyncHandler,
} from '@/types/offline-queue';

interface AppOfflineShellProps {
  children: ReactNode;
  paymentSyncHandler?: OfflinePaymentSyncHandler;
  expenseSyncHandler?: OfflineExpenseSyncHandler;
  holidaySyncHandler?: OfflineHolidaySyncHandler;
  showSyncPanel?: boolean;
}

export function AppOfflineShell({
  children,
  paymentSyncHandler = replayQueuedPayment,
  expenseSyncHandler = replayQueuedExpense,
  holidaySyncHandler = replayQueuedHolidayRequest,
  showSyncPanel = true,
}: AppOfflineShellProps) {
  const { isOffline } = useOfflineStatus();
  const items = useOfflineQueueStore((state) => state.items);
  const syncState = useOfflineQueueStore((state) => state.syncState);

  const { runSync } = useOfflineQueueSync({
    paymentSyncHandler,
    expenseSyncHandler,
    holidaySyncHandler,
  });
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
  const pendingHolidays = selectPendingHolidayCount(items);
  const reviewPayments = selectQueuedForReviewPaymentCount(items);
  const hasQueueWarning = selectHasQueueWarning(items);
  const showBanner =
    isOffline ||
    pendingPayments > 0 ||
    pendingExpenses > 0 ||
    pendingHolidays > 0 ||
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
          pendingHolidays={pendingHolidays}
          reviewPayments={reviewPayments}
          isSyncing={syncState === 'syncing'}
          hasQueueWarning={hasQueueWarning}
          onRetrySync={() => void runSync()}
        />
      ) : null}
      {showSyncPanel ? (
        <OfflineSyncStatusPanel
          pendingPayments={pendingPayments}
          pendingExpenses={pendingExpenses}
          pendingHolidays={pendingHolidays}
          reviewPayments={reviewPayments}
          isSyncing={syncState === 'syncing'}
          onRetrySync={() => void runSync()}
        />
      ) : null}
      {children}
    </div>
  );
}
