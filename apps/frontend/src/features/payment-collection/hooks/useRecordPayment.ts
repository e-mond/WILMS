'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import { invalidateAfterPayment } from '@/features/payment-collection/utils/invalidate-after-payment';
import type { GpsCoordinates } from '@/types/payment';

export interface RecordPaymentVariables {
  borrowerId: string;
  amountPesewas: number;
  paymentDate: string;
  gps: GpsCoordinates;
  loanId: string;
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ borrowerId, amountPesewas, paymentDate, gps }: RecordPaymentVariables) => {
      const collectorId = useAuthStore.getState().user?.id;

      if (!collectorId) {
        throw new Error('Collector session is required to record a payment.');
      }

      return paymentService.recordPayment({
        borrowerId,
        amountPesewas,
        paymentDate,
        collectorId,
        gps,
      });
    },
    onSuccess: async (_result, variables) => {
      await invalidateAfterPayment(queryClient, variables);
    },
  });
}
