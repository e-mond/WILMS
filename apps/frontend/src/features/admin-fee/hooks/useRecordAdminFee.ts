'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { awaitingAdminFeeQueryKey } from '@/features/admin-fee/hooks/useBorrowersAwaitingAdminFee';
import { adminFeeStatusQueryKey } from '@/features/admin-fee/hooks/useAdminFeeStatus';
import { transactionService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useRecordAdminFee(borrowerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const collectorId = useAuthStore.getState().user?.id;

      if (!collectorId) {
        throw new Error('Collector session is required to record an admin fee.');
      }

      return transactionService.recordAdminFee({ borrowerId, collectorId });
    },
    onSuccess: async () => {
      notifyMutationSuccess('Admin fee recorded', 'This borrower can now receive a loan.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: awaitingAdminFeeQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminFeeStatusQueryKey(borrowerId) }),
        queryClient.invalidateQueries({ queryKey: ['borrowers', borrowerId, 'disbursement-eligibility'] }),
      ]);
    },
    onError: (error) => {
      notifyMutationError('Admin fee failed', error, 'Unable to record the admin fee.');
    },
  });
}
