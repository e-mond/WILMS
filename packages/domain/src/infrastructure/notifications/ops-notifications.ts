/**
 * Operational notification emitters for collectors and Super Admins.
 * Complements payment-notifications.ts without touching financial math.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { financialReconciliations } from '../../db/schema/financial-reconciliations.js';
import { groups } from '../../db/schema/groups.js';
import { messageDeliveries } from '../../db/schema/message-deliveries.js';
import { users } from '../../db/schema/users.js';
import { createInAppNotification } from './in-app-notify.js';
import {
  tryAcquireNotificationDelivery,
  markNotificationDeliveryStatus,
} from './notification-dedupe.js';
import { getMailProvider } from '../mail/index.js';
import { buildEmailTemplate, emailParagraph } from './email-layout.js';
import { sendPushToUser } from '../../modules/notifications/push.service.js';

export const OPS_DEDUPE = {
  reconReminder: (collectorId: string, date: string) => `recon-reminder:${collectorId}:${date}`,
  highVariance: (reconciliationId: string) => `recon-high-variance:${reconciliationId}`,
  failedDeliveries: (date: string) => `failed-deliveries-digest:${date}`,
  schedulerFailure: (kind: string, date: string) => `scheduler-failure:${kind}:${date}`,
  groupOverdue: (collectorId: string, date: string) => `group-overdue:${collectorId}:${date}`,
  scheduleChanged: (loanId: string, dueDate: string) => `schedule-changed:${loanId}:${dueDate}`,
} as const;

async function listActiveSuperAdmins(): Promise<Array<{ id: string; email: string; displayName: string }>> {
  if (!isDatabaseEnabled()) {
    return [];
  }
  const db = getDb();
  return db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(
      and(
        isNull(users.deletedAt),
        eq(users.status, 'ACTIVE'),
        eq(users.role, USER_ROLE.SUPER_ADMIN),
      ),
    );
}

async function notifyUserChannels(input: {
  userId: string;
  email?: string;
  displayName?: string;
  dedupeKey: string;
  notificationType: string;
  title: string;
  body: string;
  href?: string;
  emailSubject?: string;
}): Promise<void> {
  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    notificationType: input.notificationType,
    userId: input.userId,
  });
  if (!acquired) {
    return;
  }

  await createInAppNotification({
    userId: input.userId,
    event: 'COMMUNICATION',
    title: input.title,
    body: input.body,
    href: input.href,
    dedupeKey: input.dedupeKey,
  });
  await markNotificationDeliveryStatus({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    status: 'SENT',
  });

  void sendPushToUser(input.userId, {
    title: input.title,
    body: input.body.slice(0, 180),
    url: input.href,
    category: 'OPERATIONS',
  });

  if (input.email) {
    const mail = getMailProvider();
    if (mail.isConfigured()) {
      const template = buildEmailTemplate({
        subject: input.emailSubject ?? input.title,
        greeting: input.displayName || 'WILMS user',
        preheader: input.body.slice(0, 120),
        theme: 'info',
        textLines: [input.body, '', '— WILMS'],
        htmlBody: emailParagraph(input.body),
      });
      await mail.send({
        to: input.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    }
  }
}

export async function emitReconciliationReminder(input: {
  collectorUserId: string;
  reconciliationDate: string;
  correlationId?: string;
}): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  const [collector] = await db
    .select({ id: users.id, email: users.email, displayName: users.displayName })
    .from(users)
    .where(and(eq(users.id, input.collectorUserId), isNull(users.deletedAt)))
    .limit(1);
  if (!collector) {
    return;
  }

  await notifyUserChannels({
    userId: collector.id,
    email: collector.email,
    displayName: collector.displayName,
    dedupeKey: OPS_DEDUPE.reconReminder(collector.id, input.reconciliationDate),
    notificationType: 'RECONCILIATION_REMINDER',
    title: 'Reconciliation reminder',
    body: `Please submit reconciliation for ${input.reconciliationDate}.`,
    href: '/collector/reconciliation',
    emailSubject: `WILMS reconciliation due — ${input.reconciliationDate}`,
  });
}

export async function emitHighVarianceAlert(input: {
  reconciliationId: string;
  collectorUserId: string;
  date: string;
  variancePesewas: number;
}): Promise<void> {
  const admins = await listActiveSuperAdmins();
  const varianceGhs = (input.variancePesewas / 100).toFixed(2);
  for (const admin of admins) {
    await notifyUserChannels({
      userId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      dedupeKey: `${OPS_DEDUPE.highVariance(input.reconciliationId)}:${admin.id}`,
      notificationType: 'RECONCILIATION_HIGH_VARIANCE',
      title: 'High variance reconciliation',
      body: `Reconciliation for ${input.date} has variance GHS ${varianceGhs}.`,
      href: '/reports/daily-collection',
      emailSubject: `WILMS high variance — ${input.date}`,
    });
  }
}

export async function emitFailedDeliveryDigest(input: {
  referenceDate: string;
  failedCount: number;
}): Promise<void> {
  if (input.failedCount <= 0) {
    return;
  }
  const admins = await listActiveSuperAdmins();
  for (const admin of admins) {
    await notifyUserChannels({
      userId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      dedupeKey: `${OPS_DEDUPE.failedDeliveries(input.referenceDate)}:${admin.id}`,
      notificationType: 'FAILED_NOTIFICATION_DIGEST',
      title: 'Failed notification deliveries',
      body: `${input.failedCount} notification delivery failure(s) recorded for ${input.referenceDate}.`,
      href: '/communication-center',
    });
  }
}

export async function emitSchedulerFailureAlert(input: {
  kind: string;
  error: string;
  referenceDate: string;
}): Promise<void> {
  const admins = await listActiveSuperAdmins();
  for (const admin of admins) {
    await notifyUserChannels({
      userId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      dedupeKey: `${OPS_DEDUPE.schedulerFailure(input.kind, input.referenceDate)}:${admin.id}`,
      notificationType: 'SCHEDULER_FAILURE',
      title: 'Scheduler failure',
      body: `${input.kind} failed on ${input.referenceDate}: ${input.error}`,
      href: '/settings',
    });
  }
}

export async function emitScheduleChangedNotification(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  dueDate: string;
  note?: string;
}): Promise<void> {
  const body = `WILMS: Hi ${input.borrowerName}, your payment schedule changed. Next due date: ${input.dueDate}.${input.note ? ` ${input.note}` : ''}`;
  const { getSmsProvider } = await import('../sms/index.js');
  const { getSettings } = await import('../../modules/settings/service.js');
  const settings = await getSettings();
  const dedupeKey = OPS_DEDUPE.scheduleChanged(input.loanId, input.dueDate);

  if (settings.smsNotificationsEnabled && input.borrowerPhone) {
    const acquired = await tryAcquireNotificationDelivery({
      dedupeKey,
      recipient: input.borrowerPhone,
      channel: 'SMS',
      notificationType: 'SCHEDULE_CHANGED',
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
    if (acquired) {
      const provider = getSmsProvider();
      if (provider.isConfigured()) {
        await provider.send({ to: input.borrowerPhone, body: body.slice(0, 160) });
        await markNotificationDeliveryStatus({
          dedupeKey,
          recipient: input.borrowerPhone,
          channel: 'SMS',
          status: 'SENT',
        });
      }
    }
  }

  if (input.borrowerEmail) {
    const acquired = await tryAcquireNotificationDelivery({
      dedupeKey,
      recipient: input.borrowerEmail,
      channel: 'EMAIL',
      notificationType: 'SCHEDULE_CHANGED',
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
    if (acquired) {
      const mail = getMailProvider();
      if (mail.isConfigured()) {
        const template = buildEmailTemplate({
          subject: `WILMS schedule update — ${input.dueDate}`,
          greeting: input.borrowerName,
          preheader: body,
          theme: 'info',
          textLines: [body, '', '— WILMS'],
          htmlBody: emailParagraph(body),
        });
        await mail.send({
          to: input.borrowerEmail,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
        await markNotificationDeliveryStatus({
          dedupeKey,
          recipient: input.borrowerEmail,
          channel: 'EMAIL',
          status: 'SENT',
        });
      }
    }
  }
}

export async function processOperationalNotificationJobs(referenceDate: string): Promise<{
  reconReminders: number;
  failedDeliveryDigests: number;
  overdueAlerts: number;
}> {
  const result = { reconReminders: 0, failedDeliveryDigests: 0, overdueAlerts: 0 };
  if (!isDatabaseEnabled()) {
    return result;
  }

  const db = getDb();

  const activeCollectors = await db
    .selectDistinct({ collectorUserId: groups.collectorUserId })
    .from(groups)
    .where(and(isNull(groups.deletedAt), sql`${groups.collectorUserId} IS NOT NULL`));

  for (const row of activeCollectors) {
    if (!row.collectorUserId) continue;
    const [existing] = await db
      .select({ id: financialReconciliations.id })
      .from(financialReconciliations)
      .where(
        and(
          eq(financialReconciliations.collectorUserId, row.collectorUserId),
          eq(financialReconciliations.reconciliationDate, referenceDate),
        ),
      )
      .limit(1);
    if (!existing) {
      await emitReconciliationReminder({
        collectorUserId: row.collectorUserId,
        reconciliationDate: referenceDate,
      });
      result.reconReminders += 1;
    }
  }

  const failedRows = await db
    .select({ id: messageDeliveries.id })
    .from(messageDeliveries)
    .where(
      and(
        eq(messageDeliveries.success, false),
        sql`${messageDeliveries.createdAt}::date = ${referenceDate}::date`,
      ),
    );
  if (failedRows.length > 0) {
    await emitFailedDeliveryDigest({
      referenceDate,
      failedCount: failedRows.length,
    });
    result.failedDeliveryDigests = 1;
  }

  return result;
}
