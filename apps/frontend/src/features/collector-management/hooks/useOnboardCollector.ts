import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorManagementService } from '@/services';
import { collectorsManagementQueryKey } from '@/features/collector-management/hooks/useCollectorsManagement';
import { useToast } from '@/hooks/useToast';
import type { OnboardCollectorInput } from '@/types/collector-management';

export function useOnboardCollector() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (input: OnboardCollectorInput) => collectorManagementService.onboardCollector(input),
    onSuccess: (collector) => {
      void queryClient.invalidateQueries({ queryKey: collectorsManagementQueryKey });
      toast.success('Collector onboarded', { message: `${collector.displayName} added successfully.` });
    },
    onError: () => {
      toast.error('Unable to onboard collector', { message: 'Try again shortly.' });
    },
  });
}
