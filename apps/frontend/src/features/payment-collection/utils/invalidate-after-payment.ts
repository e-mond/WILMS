import type { QueryClient } from '@tanstack/react-query';
import { loanPaymentLogQueryKey } from '@/features/loan-management/hooks/useLoanPaymentLog';
import { loanProgressQueryKey } from '@/features/loan-management/hooks/useLoanProgress';
import { paymentEntryContextQueryKey } from '@/features/payment-collection/hooks/usePaymentEntryContext';

export async function invalidateAfterPayment(
  queryClient: QueryClient,
  variables: { borrowerId: string; loanId: string },
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: paymentEntryContextQueryKey(variables.borrowerId),
    }),
    queryClient.invalidateQueries({ queryKey: ['collector'] }),
    queryClient.invalidateQueries({ queryKey: ['loans', variables.loanId] }),
    queryClient.invalidateQueries({ queryKey: loanProgressQueryKey(variables.loanId) }),
    queryClient.invalidateQueries({ queryKey: loanPaymentLogQueryKey(variables.loanId) }),
    queryClient.invalidateQueries({ queryKey: ['borrowers', variables.borrowerId, 'loans'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
    queryClient.invalidateQueries({ queryKey: ['collection-metrics'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-expense-summary'] }),
  ]);
}
