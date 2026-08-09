import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';
import { ApiError } from '@/types/api';
import {
  OFFLINE_CACHE_KEYS,
  readOfflineSnapshot,
  writeOfflineSnapshot,
} from '@/lib/offline/offlineSnapshotStore';

export const notificationInboxQueryKey = ['notification-inbox'] as const;
export const notificationUnreadCountQueryKey = ['notification-unread-count'] as const;

function shouldRetryNotificationQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status === 403) {
    return false;
  }

  return failureCount < 1;
}

export function useNotificationInbox(enabled = true, refetchInterval?: number) {
  return useQuery({
    queryKey: notificationInboxQueryKey,
    queryFn: async () => {
      try {
        const data = await notificationService.listInbox();
        void writeOfflineSnapshot(OFFLINE_CACHE_KEYS.notificationsList, data);
        return data;
      } catch (error) {
        const cached = await readOfflineSnapshot<Awaited<
          ReturnType<typeof notificationService.listInbox>
        >>(OFFLINE_CACHE_KEYS.notificationsList);
        if (cached) {
          return cached.value;
        }
        throw error;
      }
    },
    enabled,
    staleTime: 30_000,
    refetchInterval,
    retry: shouldRetryNotificationQuery,
  });
}

export function useNotificationUnreadCount(enabled = true, refetchInterval?: number) {
  return useQuery({
    queryKey: notificationUnreadCountQueryKey,
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 30_000,
    refetchInterval,
    retry: shouldRetryNotificationQuery,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationInboxQueryKey }),
        queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }),
      ]);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationInboxQueryKey }),
        queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }),
      ]);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationInboxQueryKey }),
        queryClient.invalidateQueries({ queryKey: notificationUnreadCountQueryKey }),
      ]);
    },
  });
}
