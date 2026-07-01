'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineQueueStore } from '@/state/offlineQueueStore';
import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';
import { apiClient } from '@/utils/apiClient';

export type SystemStatusState =
  | 'online'
  | 'offline'
  | 'reconnecting'
  | 'degraded'
  | 'syncPending';

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
  const wasOfflineRef = useRef(false);
  const [reconnecting, setReconnecting] = useState(false);

  const pendingSyncCount = useOfflineQueueStore((state) =>
    state.items.filter(
      (item) =>
        item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
        item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
    ).length,
  );

  const healthQuery = useQuery({
    queryKey: systemStatusQueryKey(),
    queryFn: () => apiClient.get<HealthReport>('/health'),
    refetchInterval: HEALTH_POLL_MS,
    retry: 1,
    enabled: isOnline,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setReconnecting(false);
      return;
    }

    if (wasOfflineRef.current) {
      setReconnecting(true);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!reconnecting) {
      return;
    }
    if (!healthQuery.isFetching) {
      setReconnecting(false);
      wasOfflineRef.current = false;
    }
  }, [reconnecting, healthQuery.isFetching]);

  let status: SystemStatusState;
  if (!isOnline) {
    status = 'offline';
  } else if (reconnecting) {
    status = 'reconnecting';
  } else if (pendingSyncCount > 0) {
    status = 'syncPending';
  } else if (healthQuery.isError || !healthQuery.data || healthQuery.data.status !== 'ok') {
    status = 'degraded';
  } else {
    status = 'online';
  }

  const label =
    status === 'online'
      ? 'Online'
      : status === 'offline'
        ? 'Offline'
        : status === 'reconnecting'
          ? 'Reconnecting'
          : status === 'syncPending'
            ? `Sync pending (${pendingSyncCount})`
            : 'Degraded';

  return {
    status,
    label,
    isOnline,
    pendingSyncCount,
    environment: healthQuery.data?.environment,
    isLoading: healthQuery.isLoading,
    refetch: healthQuery.refetch,
  };
}
