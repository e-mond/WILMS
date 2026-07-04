import { useQuery } from '@tanstack/react-query';
import settingsService from '@/services/settingsService';
import type { IntegrationStatusReport } from '@/types/settings';

export function useIntegrationStatus(fallback?: IntegrationStatusReport) {
  return useQuery({
    queryKey: ['settings', 'integrations', 'status'],
    queryFn: () => settingsService.getIntegrationsStatus(),
    enabled: !fallback,
    retry: false,
    staleTime: 60_000,
    initialData: fallback,
  });
}
