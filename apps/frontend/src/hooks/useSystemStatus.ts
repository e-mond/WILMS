import { useQuery } from '@tanstack/react-query';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { apiClient } from '@/utils/apiClient';

export type SystemStatusState = 'healthy' | 'degraded' | 'offline';

export interface HealthReport {
  status: 'ok' | 'degraded';
  environment: string;
}

const HEALTH_POLL_MS = 60_000;

export function systemStatusQueryKey() {
  return ['system-health'] as const;
}

export function useSystemStatus() {
  const { isOnline } = useOfflineStatus();

  const healthQuery = useQuery({
    queryKey: systemStatusQueryKey(),
    queryFn: () => apiClient.get<HealthReport>('/health'),
    refetchInterval: HEALTH_POLL_MS,
    retry: 1,
    enabled: isOnline,
    staleTime: 30_000,
  });

  const status: SystemStatusState = !isOnline
    ? 'offline'
    : healthQuery.isError || !healthQuery.data
      ? 'degraded'
      : healthQuery.data.status === 'ok'
        ? 'healthy'
        : 'degraded';

  const label =
    status === 'healthy' ? 'Healthy' : status === 'degraded' ? 'Degraded' : 'Offline';

  return {
    status,
    label,
    isOnline,
    environment: healthQuery.data?.environment,
    isLoading: healthQuery.isLoading,
    refetch: healthQuery.refetch,
  };
}
