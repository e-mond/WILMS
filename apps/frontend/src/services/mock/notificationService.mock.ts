import type { INotificationService, SupervisorAlertInput } from '@/types/services';

import {

  NOTIFICATION_CHANNEL,

  NOTIFICATION_EVENT,

  NOTIFICATION_INBOX_SEVERITY,

  type NotificationDelivery,

  type NotificationInboxItem,

  type SendNotificationInput,

} from '@/types/notification';

import { resolveMockPhotoUrl } from '@/services/mock/photo-url.resolver';
import { resetPaymentReminderState } from '@/services/mock/payment-reminder.sync';
import { simulateDelay } from '@/services/mock/delay';



const readNotificationIds = new Set<string>();

const supervisorAlerts: SupervisorAlertInput[] = [];

const deliveries: NotificationDelivery[] = [];



const SEED_INBOX_ITEMS: NotificationInboxItem[] = [

  {

    id: 'inbox-seed-variance',

    title: 'Variance review required',

    body: 'Collector reconciliation variance exceeds threshold for Zone East.',

    event: NOTIFICATION_EVENT.SUPERVISOR_ALERT,

    href: '/reports/daily-collection',

    createdAt: new Date(Date.now() - 3_600_000).toISOString(),

    isRead: false,

    severity: NOTIFICATION_INBOX_SEVERITY.WARNING,
    subjectName: 'Field Collector',
    subjectId: 'user-collector',
    subjectPhotoUrl: resolveMockPhotoUrl({ name: 'Field Collector', id: 'user-collector' }),
  },

  {

    id: 'inbox-seed-pending',

    title: 'Pending applications queue',

    body: '4 borrower applications are awaiting approver review.',

    event: NOTIFICATION_EVENT.REGISTRATION_APPROVED,

    href: '/borrowers?status=PENDING',

    createdAt: new Date(Date.now() - 7_200_000).toISOString(),

    isRead: false,

    severity: NOTIFICATION_INBOX_SEVERITY.INFO,
    subjectName: 'Registration Officer',
    subjectId: 'user-officer',
    subjectPhotoUrl: resolveMockPhotoUrl({ name: 'Registration Officer', id: 'user-officer' }),
  },

  {

    id: 'inbox-seed-default',

    title: 'Defaulter escalation',

    body: 'Yaa Serwaa Oduro moved to Defaulted status. Guarantor alert queued.',

    event: NOTIFICATION_EVENT.DEFAULTER_STATUS,

    href: '/risk-flags',

    createdAt: new Date(Date.now() - 86_400_000).toISOString(),

    isRead: true,

    severity: NOTIFICATION_INBOX_SEVERITY.CRITICAL,

  },

];



function deliveryToInboxItem(delivery: NotificationDelivery): NotificationInboxItem {

  const isRead = readNotificationIds.has(delivery.id);



  return {

    id: delivery.id,

    title: delivery.event.replace(/_/g, ' '),

    body: delivery.message,

    event: delivery.event,

    href: delivery.borrowerId ? `/borrowers/${delivery.borrowerId}` : undefined,

    createdAt: delivery.sentAt,

    isRead,

    severity:

      delivery.event === NOTIFICATION_EVENT.SUPERVISOR_ALERT ||

      delivery.event === NOTIFICATION_EVENT.DEFAULTER_STATUS

        ? NOTIFICATION_INBOX_SEVERITY.CRITICAL

        : NOTIFICATION_INBOX_SEVERITY.INFO,

  };

}



function buildInboxItems(): NotificationInboxItem[] {

  const deliveryItems = deliveries.map(deliveryToInboxItem);

  const seedItems = SEED_INBOX_ITEMS.map((item) => ({

    ...item,

    isRead: readNotificationIds.has(item.id) ? true : item.isRead,

  }));



  return [...deliveryItems, ...seedItems].sort(

    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),

  );

}



const notificationServiceMock: INotificationService = {

  async listInbox(): Promise<NotificationInboxItem[]> {

    await simulateDelay();

    return buildInboxItems();

  },



  async getUnreadCount(): Promise<number> {

    await simulateDelay();

    return buildInboxItems().filter((item) => !item.isRead).length;

  },



  async markAsRead(notificationId: string): Promise<void> {

    await simulateDelay();

    readNotificationIds.add(notificationId);

  },



  async sendNotification(input: SendNotificationInput): Promise<NotificationDelivery> {

    await simulateDelay();



    const record: NotificationDelivery = {

      id: crypto.randomUUID(),

      ...input,

      sentAt: new Date().toISOString(),

    };



    deliveries.push(record);

    return record;

  },



  async sendSupervisorAlert(input: SupervisorAlertInput): Promise<void> {

    await simulateDelay();

    supervisorAlerts.push(input);



    await notificationServiceMock.sendNotification({

      event: NOTIFICATION_EVENT.SUPERVISOR_ALERT,

      channels: [NOTIFICATION_CHANNEL.SMS],

      message: input.message,

    });

  },

};



export function getMockSupervisorAlerts(): readonly SupervisorAlertInput[] {

  return supervisorAlerts;

}



export function getMockNotificationDeliveries(): readonly NotificationDelivery[] {

  return deliveries;

}



export function resetMockSupervisorAlerts(): void {

  supervisorAlerts.length = 0;

}



export function resetMockNotificationDeliveries(): void {

  deliveries.length = 0;

}



export function isMockNotificationRead(notificationId: string): boolean {

  return readNotificationIds.has(notificationId);

}



export function resetMockNotifications(): void {

  readNotificationIds.clear();

  resetMockSupervisorAlerts();

  resetMockNotificationDeliveries();

  resetPaymentReminderState();

}



export default notificationServiceMock;

