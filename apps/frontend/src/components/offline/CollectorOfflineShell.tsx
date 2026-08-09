'use client';

import type { ReactNode } from 'react';
import { AppOfflineShell } from '@/components/offline/AppOfflineShell';
import type {
  OfflineExpenseSyncHandler,
  OfflineHolidaySyncHandler,
  OfflinePaymentSyncHandler,
} from '@/types/offline-queue';

interface CollectorOfflineShellProps {
  children: ReactNode;
  paymentSyncHandler?: OfflinePaymentSyncHandler;
  expenseSyncHandler?: OfflineExpenseSyncHandler;
  holidaySyncHandler?: OfflineHolidaySyncHandler;
}

/** @deprecated Prefer AppOfflineShell; retained for collector layout compatibility. */
export function CollectorOfflineShell(props: CollectorOfflineShellProps) {
  return <AppOfflineShell {...props} showSyncPanel />;
}
