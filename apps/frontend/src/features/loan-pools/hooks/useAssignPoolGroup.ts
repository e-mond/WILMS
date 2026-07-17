'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanPoolService } from '@/services';
import { loanPoolsQueryKey } from '@/features/loan-pools/hooks/useLoanPools';
import { unassignedPoolGroupsQueryKey } from '@/features/loan-pools/hooks/useUnassignedPoolGroups';
import type { AssignLoanPoolMembershipInput } from '@/types/loan-pool';
import { notifyMutationError, notifyMutationSuccess } from '@/utils/mutation-feedback';

export function useAssignPoolGroup(poolId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignLoanPoolMembershipInput) => {
      if (!poolId) {
        throw new Error('Select a loan pool first.');
      }
      return loanPoolService.assignGroupMembership(poolId, input);
    },
    onSuccess: () => {
      notifyMutationSuccess('Group assigned', 'Future disbursements will update this pool.');
      void queryClient.invalidateQueries({ queryKey: loanPoolsQueryKey });
      void queryClient.invalidateQueries({ queryKey: unassignedPoolGroupsQueryKey });
    },
    onError: (error) => {
      notifyMutationError('Unable to assign group', error, 'Group assignment failed.');
    },
  });
}
