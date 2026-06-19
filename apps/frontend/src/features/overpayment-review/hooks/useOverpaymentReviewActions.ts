'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overpaymentReviewsQueryKey } from '@/features/overpayment-review/hooks/useOverpaymentReviews';
import { overpaymentReviewService } from '@/services';
import { useAuthStore } from '@/state/authStore';
import type { ResolveOverpaymentReviewInput } from '@/types/overpayment-review';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useOverpaymentReviewActions() {
  const queryClient = useQueryClient();

  const invalidateReviews = async () => {
    await queryClient.invalidateQueries({ queryKey: overpaymentReviewsQueryKey() });
  };

  const resolveMutation = useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: ResolveOverpaymentReviewInput;
    }) => {
      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error('You must be signed in to resolve overpayment reviews.');
      }

      return overpaymentReviewService.resolveReview(
        reviewId,
        input,
        user.id,
        user.displayName ?? 'Super Admin',
      );
    },
    onSuccess: async (_result, variables) => {
      await invalidateReviews();
      const actionLabel =
        variables.input.action === 'DISMISSED'
          ? 'Overpayment dismissed'
          : 'Overpayment resolved';
      notifyMutationSuccess(actionLabel, 'The review queue has been updated.');
    },
    onError: (error) => {
      notifyMutationError(
        'Review update failed',
        error,
        'Unable to update this overpayment review.',
      );
    },
  });

  return {
    resolveMutation,
    isSubmitting: resolveMutation.isPending,
  };
}
