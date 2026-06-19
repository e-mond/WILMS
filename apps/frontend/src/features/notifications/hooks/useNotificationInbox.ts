import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';

export const notificationInboxQueryKey = ['notification-inbox'] as const;
export const notificationUnreadCountQueryKey = ['notification-unread-count'] as const;

export function useNotificationInbox(enabled = true) {
  return useQuery({
    queryKey: notificationInboxQueryKey,
    queryFn: () => notificationService.listInbox(),
    enabled,
    staleTime: 30_000,
  });
}

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: notificationUnreadCountQueryKey,
    queryFn: () => notificationService.getUnreadCount(),
    enabled,
    staleTime: 30_000,
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
