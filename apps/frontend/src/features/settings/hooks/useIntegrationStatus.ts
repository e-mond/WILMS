import { useQuery } from '@tanstack/react-query';
import settingsService from '@/services/settingsService';

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ['settings', 'integrations', 'status'],
    queryFn: () => settingsService.getIntegrationsStatus(),
    staleTime: 60_000,
  });
}
