import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { notifications } from '../../db/schema/notifications.js';
import { shouldSendChannel } from '../../modules/notifications/preferences.service.js';

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

function mapInAppCategory(
  event: InAppEvent,
):
  | 'marketing'
  | 'announcement'
  | 'reminder'
  | 'loan'
  | 'payment'
  | 'approval'
  | 'registration'
  | undefined {
  if (event.includes('PAYMENT') || event === 'MISSED_PAYMENT') return 'payment';
  if (event.includes('LOAN') || event === 'DEFAULTER_STATUS') return 'loan';
  if (event.includes('REGISTRATION')) return 'registration';
  if (event === 'PAYMENT_REMINDER') return 'reminder';
  if (event === 'COMMUNICATION') return 'announcement';
  if (event === 'SUPERVISOR_ALERT' || event.includes('APPROVED') || event.includes('REJECTED')) {
    return 'approval';
  }
  return undefined;
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

  const severity = resolveSeverity(input.event);
  const allowed = await shouldSendChannel(input.userId, 'IN_APP', mapInAppCategory(input.event), {
    critical: severity === 'CRITICAL',
  });
  if (!allowed) {
    return;
  }

  const id = uuidv7();
  const now = new Date();

  if (!isDatabaseEnabled()) {
    const items = memoryInbox.get(input.userId) ?? [];
    items.unshift({ id, event: input.event, title: input.title, body: input.body });
    memoryInbox.set(input.userId, items);
  } else {
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

  // Mirror every successful in-app write with Web Push (preference / quiet-hour gated).
  try {
    const { sendPushToUser } = await import('../../modules/notifications/push.service.js');
    await sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      url: input.href,
      category: mapInAppCategory(input.event),
      critical: severity === 'CRITICAL',
    });
  } catch (error) {
    console.error('[push] mirror of in-app notification failed:', error);
  }
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
