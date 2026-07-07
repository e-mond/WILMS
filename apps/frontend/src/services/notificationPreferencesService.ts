import type { NotificationPreferences } from '@/types/notification-preferences';
import { apiClient } from '@/utils/apiClient';

const notificationPreferencesService = {
  getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/notifications/preferences');
  },

  updatePreferences(input: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return apiClient.patch<NotificationPreferences>('/notifications/preferences', input);
  },

  getVapidPublicKey(): Promise<{ publicKey: string | null }> {
    return apiClient.get<{ publicKey: string | null }>('/notifications/push/vapid-public-key');
  },

  subscribePush(subscription: PushSubscriptionJSON): Promise<{ ok: true }> {
    return apiClient.post('/notifications/push/subscribe', subscription);
  },

  unsubscribePush(endpoint: string): Promise<{ ok: true }> {
    return apiClient.post('/notifications/push/unsubscribe', { endpoint });
  },
};

export default notificationPreferencesService;
