import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { notifications } from '../../db/schema/notifications.js';

export type InAppEvent =
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'LOAN_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REMINDER'
  | 'MISSED_PAYMENT'
  | 'DEFAULTER_STATUS'
  | 'LOAN_COMPLETED'
  | 'GUARANTOR_ALERT'
  | 'SUPERVISOR_ALERT'
  | 'USER_INVITED'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'BORROWER_BLACKLISTED'
  | 'PAYMENT_REVERSAL'
  | 'USER_ACTIVATED'
  | 'USER_DISABLED'
  | 'ROLE_CHANGED'
  | 'GROUP_CREATED'
  | 'COLLECTOR_ASSIGNED'
  | 'COMMUNICATION'
  | 'PASSWORD_CHANGED'
  | 'INVITATION_ACCEPTED'
  | 'LOGIN_ALERT';

function resolveSeverity(event: InAppEvent): 'INFO' | 'WARNING' | 'CRITICAL' {
  if (
    event === 'SUPERVISOR_ALERT' ||
    event === 'DEFAULTER_STATUS' ||
    event === 'BORROWER_BLACKLISTED' ||
    event === 'USER_DISABLED'
  ) {
    return 'CRITICAL';
  }
  if (
    event === 'MISSED_PAYMENT' ||
    event === 'GUARANTOR_ALERT' ||
    event === 'LOAN_REJECTED' ||
    event === 'REGISTRATION_REJECTED' ||
    event === 'PAYMENT_REVERSAL'
  ) {
    return 'WARNING';
  }
  return 'INFO';
}

const memoryInbox = new Map<string, Array<{ id: string; event: InAppEvent; title: string; body: string }>>();

export async function createInAppNotification(input: {
  userId: string;
  event: InAppEvent;
  title: string;
  body: string;
  href?: string;
  borrowerId?: string;
  loanId?: string;
  dedupeKey?: string;
  correlationId?: string;
}): Promise<void> {
  if (!input.userId.trim()) {
    return;
  }

  const id = uuidv7();
  const severity = resolveSeverity(input.event);
  const now = new Date();

  if (!isDatabaseEnabled()) {
    const items = memoryInbox.get(input.userId) ?? [];
    items.unshift({ id, event: input.event, title: input.title, body: input.body });
    memoryInbox.set(input.userId, items);
    return;
  }

  const db = getDb();
  await db.insert(notifications).values({
    id,
    userId: input.userId,
    title: input.title,
    body: input.body,
    event: input.event as typeof notifications.$inferInsert.event,
    channel: 'IN_APP' as typeof notifications.$inferInsert.channel,
    severity,
    href: input.href ?? null,
    borrowerId: input.borrowerId ?? null,
    loanId: input.loanId ?? null,
    isRead: false,
    sentAt: now,
    dedupeKey: input.dedupeKey ?? null,
    correlationId: input.correlationId ?? null,
  });
}

export async function createInAppNotificationsForUsers(
  userIds: string[],
  input: Omit<Parameters<typeof createInAppNotification>[0], 'userId'>,
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.all(
    unique.map((userId) => createInAppNotification({ ...input, userId })),
  );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), isNull(notifications.deletedAt)));
}

export async function archiveNotification(notificationId: string, userId: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  await db
    .update(notifications)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    );
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  return archiveNotification(notificationId, userId);
}

export async function searchNotifications(
  userId: string,
  query?: string,
): Promise<number> {
  if (!isDatabaseEnabled()) {
    const items = memoryInbox.get(userId) ?? [];
    if (!query?.trim()) {
      return items.length;
    }
    const q = query.toLowerCase();
    return items.filter(
      (item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q),
    ).length;
  }

  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNull(notifications.deletedAt),
        query?.trim()
          ? sql`(${notifications.title} ILIKE ${`%${query.trim()}%`} OR ${notifications.body} ILIKE ${`%${query.trim()}%`})`
          : sql`true`,
      ),
    );

  return rows[0]?.count ?? 0;
}
