'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustmentsQueryKey } from '@/features/adjustments/hooks/useAdjustments';
import { adjustmentService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import type { RejectAdjustmentInput } from '@/types/adjustment';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useAdjustmentActions() {
  const queryClient = useQueryClient();

  const invalidateAdjustments = async () => {
    await queryClient.invalidateQueries({ queryKey: adjustmentsQueryKey() });
  };

  const approveMutation = useMutation({
    mutationFn: (adjustmentId: string) => {
      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error('You must be signed in to approve adjustments.');
      }

      return adjustmentService.approveAdjustment(
        adjustmentId,
        user.id,
        user.displayName ?? 'Super Admin',
      );
    },
    onSuccess: async () => {
      await invalidateAdjustments();
      notifyMutationSuccess('Adjustment approved', 'The ledger has been updated.');
    },
    onError: (error) => {
      notifyMutationError('Approval failed', error, 'Unable to approve this adjustment.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ adjustmentId, input }: { adjustmentId: string; input: RejectAdjustmentInput }) => {
      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error('You must be signed in to reject adjustments.');
      }

      return adjustmentService.rejectAdjustment(
        adjustmentId,
        input,
        user.id,
        user.displayName ?? 'Super Admin',
      );
    },
    onSuccess: async () => {
      await invalidateAdjustments();
      notifyMutationSuccess('Adjustment rejected', 'The request has been closed.');
    },
    onError: (error) => {
      notifyMutationError('Rejection failed', error, 'Unable to reject this adjustment.');
    },
  });

  return {
    approveMutation,
    rejectMutation,
    isSubmitting: approveMutation.isPending || rejectMutation.isPending,
  };
}
