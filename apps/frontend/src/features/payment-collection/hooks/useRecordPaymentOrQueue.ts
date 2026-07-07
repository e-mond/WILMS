'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentEntryContextQueryKey } from '@/features/payment-collection/hooks/usePaymentEntryContext';
import { invalidateAfterPayment } from '@/features/payment-collection/utils/invalidate-after-payment';
import { paymentService } from '@/services';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { useAuthStore } from '@/state/authStore';
import type { GpsCoordinates } from '@/types/payment';
import { requestPaymentBackgroundSync } from '@/lib/pwa/background-sync';
import {
  notifyMutationError,
  notifyMutationInfo,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export interface RecordPaymentOrQueueVariables {
  borrowerId: string;
  amountPesewas: number;
  paymentDate: string;
  gps: GpsCoordinates;
  loanId: string;
  isOffline: boolean;
}

export interface RecordPaymentOrQueueResult {
  mode: 'online' | 'offline';
  queueItemId?: string;
}

export function useRecordPaymentOrQueue() {
  const queryClient = useQueryClient();
  const enqueuePayment = useOfflineQueueStore((state) => state.enqueuePayment);

  return useMutation({
    mutationFn: async ({
      borrowerId,
      amountPesewas,
      paymentDate,
      gps,
      isOffline,
    }: RecordPaymentOrQueueVariables): Promise<RecordPaymentOrQueueResult> => {
      const collectorId = useAuthStore.getState().user?.id;

      if (!collectorId) {
        throw new Error('Collector session is required to record a payment.');
      }

      if (isOffline) {
        const item = enqueuePayment({
          borrowerId,
          amountPesewas,
          paymentDate,
          gps,
          collectorId,
        });

        void requestPaymentBackgroundSync();

        return { mode: 'offline', queueItemId: item.id };
      }

      await paymentService.recordPayment({
        borrowerId,
        amountPesewas,
        paymentDate,
        collectorId,
        gps,
      });

      return { mode: 'online' };
    },
    onSuccess: async (result, variables) => {
      if (result.mode === 'offline') {
        notifyMutationInfo('Payment saved offline', 'It will sync when connection returns.');
        return;
      }

      notifyMutationSuccess('Payment recorded', 'The payment has been applied to the schedule.');

      await invalidateAfterPayment(queryClient, variables);
    },
    onError: (error) => {
      notifyMutationError('Payment failed', error, 'Unable to record this payment.');
    },
  });
}
