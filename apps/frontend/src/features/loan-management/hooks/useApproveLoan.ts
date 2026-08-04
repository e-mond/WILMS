'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanService } from '@/services';
import { resolveLoanDisplayId } from '@/utils/entity-display-id';
import { notifyMutationError, notifyMutationSuccess } from '@/utils/mutation-feedback';

export function useApproveLoan(loanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => loanService.approveLoan(loanId),
    onSuccess: (loan) => {
      notifyMutationSuccess(
        'Loan approved',
        `${resolveLoanDisplayId(loan)} is pending disbursement.`,
      );
      void queryClient.invalidateQueries({ queryKey: ['loans'] });
      void queryClient.invalidateQueries({ queryKey: ['loans', loanId] });
      void queryClient.invalidateQueries({ queryKey: ['loan-portfolio'] });
      void queryClient.invalidateQueries({ queryKey: ['audit-log'] });
      if (loan.borrowerId) {
        void queryClient.invalidateQueries({
          queryKey: ['disbursement-eligibility', loan.borrowerId],
        });
      }
    },
    onError: (error) => {
      notifyMutationError(
        'Unable to approve loan',
        error,
        'This loan cannot be approved yet. Complete admin-fee requirements first.',
      );
    },
  });
}
