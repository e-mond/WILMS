import { apiClient } from '@/utils/apiClient';
import type { NotificationDelivery, NotificationInboxItem, SendNotificationInput } from '@/types/notification';
import type { INotificationService, SupervisorAlertInput } from '@/types/services';

const notificationService: INotificationService = {
  listInbox(): Promise<NotificationInboxItem[]> {
    return apiClient.get<NotificationInboxItem[]>('/notifications/inbox');
  },

  getUnreadCount(): Promise<number> {
    return apiClient.get<number>('/notifications/inbox/unread-count');
  },

  markAsRead(notificationId: string): Promise<void> {
    return apiClient.patch<void>(`/notifications/${notificationId}/read`, {});
  },

  sendNotification(input: SendNotificationInput): Promise<NotificationDelivery> {
    return apiClient.post<NotificationDelivery>('/notifications', input);
  },

  sendSupervisorAlert(input: SupervisorAlertInput): Promise<void> {
    return apiClient.post<void>('/notifications/supervisor-alert', input);
  },
};

export default notificationService;
