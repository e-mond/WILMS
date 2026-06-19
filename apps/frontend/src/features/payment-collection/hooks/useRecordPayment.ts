'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentEntryContextQueryKey } from '@/features/payment-collection/hooks/usePaymentEntryContext';
import { loanProgressQueryKey } from '@/features/loan-management/hooks/useLoanProgress';
import { loanPaymentLogQueryKey } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { paymentService } from '@/services';
import { useAuthStore } from '@/state/authStore';
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: paymentEntryContextQueryKey(variables.borrowerId),
        }),
        queryClient.invalidateQueries({ queryKey: ['collector'] }),
        queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] }),
        queryClient.invalidateQueries({ queryKey: loanProgressQueryKey(variables.loanId) }),
        queryClient.invalidateQueries({ queryKey: loanPaymentLogQueryKey(variables.loanId) }),
        queryClient.invalidateQueries({ queryKey: ['borrowers', variables.borrowerId, 'loans'] }),
      ]);
    },
  });
}
