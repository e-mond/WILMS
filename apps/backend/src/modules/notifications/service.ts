import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { notifications } from '../../db/schema/notifications.js';
import { users } from '../../db/schema/users.js';

export interface NotificationInboxItem {
  id: string;
  title: string;
  body: string;
  event: string;
  href?: string;
  createdAt: string;
  isRead: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  subjectName?: string;
  subjectId?: string;
  subjectPhotoUrl?: string | null;
}

export interface SendNotificationInput {
  event: string;
  channels: Array<'SMS' | 'EMAIL'>;
  recipientPhone?: string;
  recipientEmail?: string;
  message: string;
  borrowerId?: string;
  loanId?: string;
}

export interface NotificationDelivery {
  id: string;
  event: string;
  channels: Array<'SMS' | 'EMAIL'>;
  recipientPhone?: string;
  recipientEmail?: string;
  message: string;
  borrowerId?: string;
  loanId?: string;
  sentAt: string;
}

export interface SupervisorAlertInput {
  message: string;
  collectorId: string;
  paymentId: string;
}

const memoryInbox = new Map<string, NotificationInboxItem[]>();

function mapRowToInboxItem(row: typeof notifications.$inferSelect): NotificationInboxItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    event: row.event,
    href: row.href ?? undefined,
    createdAt: row.createdAt.toISOString(),
    isRead: row.isRead,
    severity: row.severity,
    subjectId: row.borrowerId ?? undefined,
  };
}

function resolveSeverity(event: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  if (event === 'SUPERVISOR_ALERT' || event === 'DEFAULTER_STATUS') {
    return 'CRITICAL';
  }
  if (event === 'MISSED_PAYMENT' || event === 'GUARANTOR_ALERT') {
    return 'WARNING';
  }
  return 'INFO';
}

export async function listInbox(userId: string): Promise<NotificationInboxItem[]> {
  if (!isDatabaseEnabled()) {
    return [...(memoryInbox.get(userId) ?? [])].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.deletedAt)))
    .orderBy(sql`${notifications.createdAt} desc`);

  return rows.map(mapRowToInboxItem);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const inbox = await listInbox(userId);
  return inbox.filter((item) => !item.isRead).length;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    const items = memoryInbox.get(userId) ?? [];
    memoryInbox.set(
      userId,
      items.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    );
    return;
  }

  const db = getDb();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
        isNull(notifications.deletedAt),
      ),
    );
}

export async function sendNotification(
  userId: string,
  input: SendNotificationInput,
): Promise<NotificationDelivery> {
  const delivery: NotificationDelivery = {
    id: uuidv7(),
    event: input.event,
    channels: input.channels,
    recipientPhone: input.recipientPhone,
    recipientEmail: input.recipientEmail,
    message: input.message,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
    sentAt: new Date().toISOString(),
  };

  const inboxItem: NotificationInboxItem = {
    id: delivery.id,
    title: input.event.replace(/_/g, ' '),
    body: input.message,
    event: input.event,
    href: input.borrowerId ? `/borrowers/${input.borrowerId}` : undefined,
    createdAt: delivery.sentAt,
    isRead: false,
    severity: resolveSeverity(input.event),
    subjectId: input.borrowerId,
  };

  if (!isDatabaseEnabled()) {
    const items = memoryInbox.get(userId) ?? [];
    memoryInbox.set(userId, [inboxItem, ...items]);
    return delivery;
  }

  const db = getDb();
  await db.insert(notifications).values({
    id: delivery.id,
    userId,
    title: inboxItem.title,
    body: inboxItem.body,
    event: input.event as typeof notifications.$inferInsert.event,
    channel: input.channels[0] ?? null,
    severity: inboxItem.severity,
    href: inboxItem.href ?? null,
    borrowerId: input.borrowerId ?? null,
    loanId: input.loanId ?? null,
    isRead: false,
    sentAt: new Date(delivery.sentAt),
  });

  return delivery;
}

export async function sendSupervisorAlert(input: SupervisorAlertInput): Promise<void> {
  if (!isDatabaseEnabled()) {
    const supervisors = [{ id: 'user-super-admin' }];
    for (const supervisor of supervisors) {
      const items = memoryInbox.get(supervisor.id) ?? [];
      const item: NotificationInboxItem = {
        id: uuidv7(),
        title: 'Supervisor alert',
        body: input.message,
        event: 'SUPERVISOR_ALERT',
        href: `/payments/${input.paymentId}`,
        createdAt: new Date().toISOString(),
        isRead: false,
        severity: 'CRITICAL',
        subjectId: input.collectorId,
      };
      memoryInbox.set(supervisor.id, [item, ...items]);
    }
    return;
  }

  const db = getDb();
  const supervisorRows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, USER_ROLE.SUPER_ADMIN), isNull(users.deletedAt)));

  const now = new Date();
  for (const supervisor of supervisorRows) {
    await db.insert(notifications).values({
      id: uuidv7(),
      userId: supervisor.id,
      title: 'Supervisor alert',
      body: input.message,
      event: 'SUPERVISOR_ALERT',
      severity: 'CRITICAL',
      href: `/payments/${input.paymentId}`,
      isRead: false,
      sentAt: now,
    });
  }
}
