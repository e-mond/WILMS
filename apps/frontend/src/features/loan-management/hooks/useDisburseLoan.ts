'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanService } from '@/services';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { notifyMutationError, notifyMutationSuccess } from '@/utils/mutation-feedback';

export function useDisburseLoan(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => loanService.disburseLoan(loanId),
    onSuccess: (loan) => {
      notifyMutationSuccess('Loan disbursed', `${resolveLoanDisplayId(loan)} is now active.`);
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loans', loanId] });
      void queryClient.invalidateQueries({ queryKey: ['loan-portfolio'] });
      void queryClient.invalidateQueries({ queryKey: ['loan-pools'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
    onError: (error) => {
      notifyMutationError('Unable to disburse loan', error, 'Loan disbursement failed.');
    },
  });
}
