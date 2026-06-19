import { useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerService } from '@/services';
import { myRegistrationsQueryKey } from '@/features/borrower-registration/hooks/useMyRegistrations';

export function useDeleteRegistration(officerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      borrowerService.deleteRegistration(registrationId, officerId!),
    onSuccess: () => {
      if (officerId) {
        queryClient.invalidateQueries({ queryKey: myRegistrationsQueryKey(officerId) });
      }
    },
  });
}
