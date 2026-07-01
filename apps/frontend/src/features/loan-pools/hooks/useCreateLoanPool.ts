import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loanPoolService } from '@/services';
import { loanPoolsQueryKey } from '@/features/loan-pools/hooks/useLoanPools';
import { useToast } from '@/hooks/useToast';
import type { CreateLoanPoolInput } from '@/types/loan-pool';

export function useCreateLoanPool() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: CreateLoanPoolInput) => loanPoolService.createLoanPool(input),
    onSuccess: (pool) => {
      void queryClient.invalidateQueries({ queryKey: loanPoolsQueryKey });
      toast.success('Pool created', { message: `${pool.name} is ready for allocation.` });
    },
    onError: () => {
      toast.error('Unable to create pool', { message: 'Try again shortly.' });
    },
  });
}
