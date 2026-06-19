import { beforeEach, describe, expect, it } from 'vitest';
import notificationServiceMock, {
  getMockNotificationDeliveries,
  resetMockNotifications,
} from '@/services/mock/notificationService.mock';
import { NOTIFICATION_CHANNEL, NOTIFICATION_EVENT } from '@/types/notification';

describe('notificationService.mock', () => {
  beforeEach(() => {
    resetMockNotifications();
  });

  it('records SMS and email deliveries', async () => {
    await notificationServiceMock.sendNotification({
      event: NOTIFICATION_EVENT.REGISTRATION_APPROVED,
      channels: [NOTIFICATION_CHANNEL.SMS, NOTIFICATION_CHANNEL.EMAIL],
      recipientPhone: '+233241234567',
      recipientEmail: 'borrower@example.com',
      message: 'Registration approved.',
      borrowerId: 'borrower-001',
    });

    const deliveries = getMockNotificationDeliveries();

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.channels).toEqual([
      NOTIFICATION_CHANNEL.SMS,
      NOTIFICATION_CHANNEL.EMAIL,
    ]);
  });

  it('records supervisor alerts as notification deliveries', async () => {
    await notificationServiceMock.sendSupervisorAlert({
      message: 'Variance above threshold.',
      collectorId: 'user-collector',
      paymentId: 'payment-001',
    });

    expect(
      getMockNotificationDeliveries().some(
        (delivery) => delivery.event === NOTIFICATION_EVENT.SUPERVISOR_ALERT,
      ),
    ).toBe(true);
  });

  it('lists inbox items with unread count and marks items read', async () => {
    const inbox = await notificationServiceMock.listInbox();
    const unreadBefore = await notificationServiceMock.getUnreadCount();

    expect(inbox.length).toBeGreaterThan(0);
    expect(unreadBefore).toBeGreaterThan(0);

    const unreadItem = inbox.find((item) => !item.isRead);
    expect(unreadItem).toBeDefined();

    await notificationServiceMock.markAsRead(unreadItem!.id);

    const unreadAfter = await notificationServiceMock.getUnreadCount();
    expect(unreadAfter).toBe(unreadBefore - 1);
  });
});
