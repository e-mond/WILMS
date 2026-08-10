import { useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerService } from '@/services';
import { myRegistrationsQueryKey } from '@/features/borrower-registration/hooks/useMyRegistrations';

export function useDeleteRegistration(officerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { registrationId: string; isDraft?: boolean }) => {
      if (input.isDraft) {
        await borrowerService.deleteRegistrationDraft(input.registrationId);
        return;
      }
      await borrowerService.deleteRegistration(input.registrationId, officerId!);
    },
    onSuccess: () => {
      if (officerId) {
        queryClient.invalidateQueries({ queryKey: myRegistrationsQueryKey(officerId) });
      }
    },
  });
}
