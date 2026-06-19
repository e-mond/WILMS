import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorDashboardQueryKey } from '@/features/payment-collection/hooks/useCollectorDashboard';
import { reconciliationQueryKey } from '@/features/reconciliation/hooks/useReconciliation';
import { reconciliationService } from '@/services';
import type { SubmitReconciliationInput } from '@/types/reconciliation';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useSubmitReconciliation(collectorId: string, date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitReconciliationInput) => reconciliationService.submitReconciliation(input),
    onSuccess: () => {
      notifyMutationSuccess('Reconciliation submitted', 'Today\'s totals have been locked.');
      queryClient.invalidateQueries({ queryKey: reconciliationQueryKey(collectorId, date) });
      queryClient.invalidateQueries({ queryKey: collectorDashboardQueryKey(collectorId, date) });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
    onError: (error) => {
      notifyMutationError(
        'Reconciliation failed',
        error,
        'Unable to submit reconciliation.',
      );
    },
  });
}
