import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorDashboardQueryKey } from '@/features/payment-collection/hooks/useCollectorDashboard';
import { paymentEntryContextQueryKey } from '@/features/payment-collection/hooks/usePaymentEntryContext';
import { sameDayPaymentQueryKey } from '@/features/payment-collection/hooks/useSameDayPayment';
import { paymentService } from '@/services';
import type { EditPaymentInput } from '@/types/payment';
import {
  notifyMutationError,
  notifyMutationSuccess,
} from '@/utils/mutation-feedback';

export function useEditPayment(
  paymentId: string,
  borrowerId: string,
  collectorId: string,
  referenceDate?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EditPaymentInput) => paymentService.editPayment(paymentId, input),
    onSuccess: () => {
      notifyMutationSuccess('Payment corrected', 'The same-day edit has been saved.');
      queryClient.invalidateQueries({
        queryKey: sameDayPaymentQueryKey(borrowerId, collectorId, referenceDate),
      });
      queryClient.invalidateQueries({
        queryKey: paymentEntryContextQueryKey(borrowerId, referenceDate),
      });
      queryClient.invalidateQueries({
        queryKey: collectorDashboardQueryKey(collectorId, referenceDate),
      });
      void queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      void queryClient.invalidateQueries({ queryKey: ['collection-metrics'] });
    },
    onError: (error) => {
      notifyMutationError('Correction failed', error, 'Unable to save this payment correction.');
    },
  });
}
