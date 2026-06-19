'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustmentsQueryKey } from '@/features/adjustments/hooks/useAdjustments';
import { adjustmentService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import type { CreateAdjustmentInput } from '@/types/adjustment';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAdjustmentInput) => {
      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error('You must be signed in to request an adjustment.');
      }

      return adjustmentService.createAdjustment(
        input,
        user.id,
        user.displayName ?? 'WILMS User',
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adjustmentsQueryKey() });
      notifyMutationSuccess(
        'Adjustment requested',
        'Super Admin will review your request.',
      );
    },
    onError: (error) => {
      notifyMutationError(
        'Adjustment request failed',
        error,
        'Unable to submit this adjustment request.',
      );
    },
  });
}
