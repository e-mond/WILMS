/**
 * Payment-related notification orchestration with idempotent delivery.
 *
 * Decoupled from financial transactions — callers invoke after commit.
 */
import { and, eq, isNull } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { groups } from '../../db/schema/groups.js';
import { users } from '../../db/schema/users.js';
import { pesewasToDecimal, decimalToPesewas } from '../../domain/money.js';
import { getSettings } from '../../modules/settings/service.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import {
  markNotificationDeliveryStatus,
  tryAcquireNotificationDelivery,
} from './notification-dedupe.js';
import { recordNotificationMetric } from './notification-metrics.js';
import {
  buildLoanReminderEmail,
  buildLoanReminderSmsBody,
  buildMissedPaymentSmsBody,
  buildGracePeriodReminderSmsBody,
  buildEscalationNoticeSmsBody,
  buildWeeklyArrearsReminderSmsBody,
  buildMultiWeekPaymentSmsBody,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  formatGhsAmount,
} from './templates.js';
import { createInAppNotification } from './in-app-notify.js';
import { dispatchMail } from '../mail/dispatch.js';
import { getSmsProvider } from '../sms/index.js';
import { isValidGhanaMobile, normalizeGhanaPhone } from '../sms/normalize-phone.js';
import { logMessageDelivery } from './delivery-log.js';

export const DEDUPE = {
  paymentDueSoon: (loanId: string, dueDate: string) => `payment-due-soon:${loanId}:${dueDate}`,
  paymentDueToday: (loanId: string, dueDate: string) => `payment-due-today:${loanId}:${dueDate}`,
  paymentMissed: (loanId: string, dueDate: string) => `payment-missed:${loanId}:${dueDate}`,
  paymentConfirmed: (paymentId: string) => `payment-confirmed:${paymentId}`,
  paymentReversed: (paymentId: string) => `payment-reversed:${paymentId}`,
  adminMissedSummary: (date: string) => `admin-missed-summary:${date}`,
  weeklyArrearsReminder: (loanId: string, referenceDate: string) =>
    `weekly-arrears:${loanId}:${referenceDate}`,
  scheduleChanged: (loanId: string, version: string) => `schedule-changed:${loanId}:${version}`,
} as const;

const GHANA_TIME_ZONE = 'Africa/Accra';

/** Calendar date YYYY-MM-DD in Ghana time (UTC+0). */
export function calendarDateInTimeZone(
  now = new Date(),
  timeZone = GHANA_TIME_ZONE,
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fall through to UTC
  }
  return now.toISOString().slice(0, 10);
}

/** Normalise schedule / API dates such as `2026-08-18T00:00:00.000Z` to YYYY-MM-DD. */
export function toIsoDate(value: string | Date): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return calendarDateInTimeZone(value);
  }
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

export function addDays(isoDate: string, days: number): string {
  const normalised = toIsoDate(isoDate);
  const [year, month, day] = normalised.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Invalid, missing, or non-positive lead times fall back to 1 day (T-1). */
export function reminderLeadDays(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(14, Math.trunc(parsed));
}

/** Earliest PENDING week by calendar due date — the next payable instalment. */
export function selectNextPendingWeek<T extends { status: string; dueDate: string | Date }>(
  weeks: T[],
): T | undefined {
  const pending = weeks
    .filter((week) => week.status === 'PENDING')
    .map((week) => ({ week, due: toIsoDate(week.dueDate) }))
    .filter((entry) => entry.due.length === 10)
    .sort((a, b) => a.due.localeCompare(b.due));
  return pending[0]?.week;
}

export async function resolveCollectorUserIdForBorrower(
  borrowerId: string,
): Promise<string | undefined> {
  const borrower = await borrowerRepo.getBorrower(borrowerId);
  if (!borrower?.groupId || !isDatabaseEnabled()) {
    return undefined;
  }

  const db = getDb();
  const [row] = await db
    .select({ collectorUserId: groups.collectorUserId })
    .from(groups)
    .where(and(eq(groups.id, borrower.groupId), isNull(groups.deletedAt)))
    .limit(1);

  return row?.collectorUserId ?? undefined;
}

async function resolveBorrowerCollectionContext(borrowerId: string): Promise<{
  groupName?: string;
  collectorName?: string;
}> {
  const borrower = await borrowerRepo.getBorrower(borrowerId);
  if (!borrower?.groupId || !isDatabaseEnabled()) {
    return { groupName: borrower?.groupName || undefined };
  }

  const db = getDb();
  const [row] = await db
    .select({
      groupName: groups.displayName,
      groupFallbackName: groups.name,
      collectorUserId: groups.collectorUserId,
    })
    .from(groups)
    .where(and(eq(groups.id, borrower.groupId), isNull(groups.deletedAt)))
    .limit(1);

  let collectorName: string | undefined;
  if (row?.collectorUserId) {
    const [collector] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(and(eq(users.id, row.collectorUserId), isNull(users.deletedAt)))
      .limit(1);
    collectorName = collector?.displayName || undefined;
  }

  return {
    groupName: row?.groupName || row?.groupFallbackName || borrower.groupName || undefined,
    collectorName,
  };
}

function weekdayLabel(isoDate: string): string {
  const normalised = toIsoDate(isoDate);
  const [year, month, day] = normalised.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
}

async function dispatchBorrowerSms(input: {
  dedupeKey: string;
  notificationType: string;
  event: string;
  to: string;
  body: string;
  enabled: boolean;
  borrowerId: string;
  loanId?: string;
  correlationId?: string;
}): Promise<boolean> {
  if (!input.enabled || !input.to.trim()) {
    return false;
  }

  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey: input.dedupeKey,
    recipient: input.to,
    channel: 'SMS',
    notificationType: input.notificationType,
    correlationId: input.correlationId,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
  });
  if (!acquired) {
    return false;
  }

  const settings = await getSettings();
  if (!settings.smsNotificationsEnabled) {
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'SMS',
      status: 'FAILED',
      failureReason: 'SMS disabled in system settings',
    });
    return false;
  }

  const provider = getSmsProvider();
  if (!provider.isConfigured()) {
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'SMS',
      status: 'FAILED',
      failureReason: 'SMS provider not configured',
    });
    return false;
  }

  try {
    const result = await provider.send({
      to: normalizeGhanaPhone(input.to),
      body: input.body,
    });
    await logMessageDelivery({
      event: input.event,
      channel: 'SMS',
      recipient: input.to,
      provider: result.provider,
      providerMessageId: result.id,
      bodyPreview: input.body,
      success: true,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'SMS',
      status: 'SENT',
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMS delivery failed';
    await logMessageDelivery({
      event: input.event,
      channel: 'SMS',
      recipient: input.to,
      provider: provider.name,
      bodyPreview: input.body,
      success: false,
      failureReason: message,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'SMS',
      status: 'FAILED',
      failureReason: message,
    });
    return false;
  }
}

async function dispatchBorrowerEmail(input: {
  dedupeKey: string;
  notificationType: string;
  event: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  borrowerId: string;
  loanId?: string;
  correlationId?: string;
}): Promise<boolean> {
  if (!input.to.trim()) {
    return false;
  }

  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey: input.dedupeKey,
    recipient: input.to,
    channel: 'EMAIL',
    notificationType: input.notificationType,
    correlationId: input.correlationId,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
  });
  if (!acquired) {
    return false;
  }

  const settings = await getSettings();
  if (!settings.emailNotificationsEnabled) {
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'EMAIL',
      status: 'FAILED',
      failureReason: 'Email disabled in system settings',
    });
    return false;
  }

  try {
    await dispatchMail({
      event: input.event,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'EMAIL',
      status: 'SENT',
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email delivery failed';
    await markNotificationDeliveryStatus({
      dedupeKey: input.dedupeKey,
      recipient: input.to,
      channel: 'EMAIL',
      status: 'FAILED',
      failureReason: message,
    });
    return false;
  }
}

async function dispatchStaffInApp(input: {
  dedupeKey: string;
  notificationType: string;
  userId: string;
  event: 'PAYMENT_REMINDER' | 'MISSED_PAYMENT' | 'PAYMENT_RECEIVED' | 'SUPERVISOR_ALERT';
  title: string;
  body: string;
  href?: string;
  borrowerId?: string;
  loanId?: string;
  correlationId?: string;
}): Promise<boolean> {
  const acquired = await tryAcquireNotificationDelivery({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    notificationType: input.notificationType,
    correlationId: input.correlationId,
    userId: input.userId,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
  });
  if (!acquired) {
    return false;
  }

  await createInAppNotification({
    userId: input.userId,
    event: input.event,
    title: input.title,
    body: input.body,
    href: input.href,
    borrowerId: input.borrowerId,
    loanId: input.loanId,
    dedupeKey: input.dedupeKey,
    correlationId: input.correlationId,
  });

  await markNotificationDeliveryStatus({
    dedupeKey: input.dedupeKey,
    recipient: input.userId,
    channel: 'IN_APP',
    status: 'SENT',
  });
  return true;
}

/** Notify borrower one day (configurable) before a scheduled payment due date. */
export async function emitPaymentDueSoonNotification(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  amountPesewas: number;
  dueDate: string;
  correlationId?: string;
}): Promise<boolean> {
  const dueDate = toIsoDate(input.dueDate);
  const dedupeKey = DEDUPE.paymentDueSoon(input.loanId, dueDate);
  const settings = await getSettings();
  const context = await resolveBorrowerCollectionContext(input.borrowerId);

  const smsBody = buildLoanReminderSmsBody({
    borrowerName: input.borrowerName,
    weeklyAmountPesewas: input.amountPesewas,
    paymentDate: dueDate,
    paymentDay: weekdayLabel(dueDate),
    groupName: context.groupName,
    collectorName: context.collectorName,
    dueTomorrow: true,
  });

  let smsSent = false;
  if (input.borrowerPhone && isValidGhanaMobile(input.borrowerPhone)) {
    smsSent = await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_DUE_SOON',
      event: 'PAYMENT_REMINDER',
      to: input.borrowerPhone,
      body: smsBody,
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildLoanReminderEmail({
      borrowerName: input.borrowerName,
      loanDisplayId: input.loanDisplayId,
      amountPesewas: input.amountPesewas,
      dueDate,
    });
    await dispatchBorrowerEmail({
      dedupeKey,
      notificationType: 'PAYMENT_DUE_SOON',
      event: 'PAYMENT_REMINDER',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  recordNotificationMetric('payment_due_soon');
  return smsSent;
}

/** Notify borrower on the morning of a scheduled payment due date. */
export async function emitPaymentDueTodayNotification(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  amountPesewas: number;
  dueDate: string;
  correlationId?: string;
}): Promise<boolean> {
  const dueDate = toIsoDate(input.dueDate);
  const dedupeKey = DEDUPE.paymentDueToday(input.loanId, dueDate);
  const settings = await getSettings();
  const context = await resolveBorrowerCollectionContext(input.borrowerId);

  const smsBody = buildLoanReminderSmsBody({
    borrowerName: input.borrowerName,
    weeklyAmountPesewas: input.amountPesewas,
    paymentDate: dueDate,
    collectorName: context.collectorName,
    dueTomorrow: false,
  });

  let smsSent = false;
  if (input.borrowerPhone && isValidGhanaMobile(input.borrowerPhone)) {
    smsSent = await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_DUE_TODAY',
      event: 'PAYMENT_REMINDER',
      to: input.borrowerPhone,
      body: smsBody,
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  // Channel matrix: due-today is SMS / in-app / push only (no email).

  recordNotificationMetric('payment_due_today');
  return smsSent;
}

/** Escalating overdue / grace reminders (schedule-aware ladder). */
export async function emitPaymentOverdueLadderNotification(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  dueDate: string;
  amountPesewas: number;
  daysOverdue: number;
  graceDays?: number;
  collectorUserId?: string;
  correlationId?: string;
}): Promise<void> {
  const graceDays = input.graceDays ?? 3;
  const dedupeKey = `payment-overdue-${input.daysOverdue}d:${input.loanId}:${input.dueDate}`;
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const context = await resolveBorrowerCollectionContext(input.borrowerId);
  const graceEndDate = addDays(input.dueDate, graceDays);

  let title = `${input.daysOverdue}-day overdue payment`;
  let smsBody = buildMissedPaymentSmsBody({
    borrowerName: input.borrowerName,
    amountPesewas: input.amountPesewas,
    dueDate: input.dueDate,
    collectorName: context.collectorName,
  });
  let collectorBody = `${input.borrowerName} is ${input.daysOverdue} day(s) overdue (GHS ${amountGhs}).`;
  let sendBorrowerSms = input.daysOverdue !== graceDays + 2;

  if (input.daysOverdue === graceDays) {
    title = 'Grace period ending';
    smsBody = buildGracePeriodReminderSmsBody({
      borrowerName: input.borrowerName,
      weeklyAmountPesewas: input.amountPesewas,
      graceEndDate,
      collectorName: context.collectorName,
    });
    collectorBody = `Grace ending for ${input.borrowerName} (GHS ${amountGhs}).`;
  } else if (input.daysOverdue === graceDays + 1) {
    title = 'Collector overdue alert';
    smsBody = buildEscalationNoticeSmsBody({ collectorName: context.collectorName });
    collectorBody = `${input.borrowerName} is past grace (${input.daysOverdue} day(s), GHS ${amountGhs}). Follow up required.`;
  } else if (input.daysOverdue === graceDays + 2) {
    title = 'Super Admin delinquency alert';
    sendBorrowerSms = false;
  } else if (input.daysOverdue >= 7 && input.daysOverdue % 7 === 0) {
    title = 'Weekly arrears reminder';
    smsBody = buildWeeklyArrearsReminderSmsBody({
      borrowerName: input.borrowerName,
      missedWeekCount: 1,
      totalArrearsPesewas: input.amountPesewas,
      collectorName: context.collectorName,
    });
    collectorBody = `${input.borrowerName} is ${input.daysOverdue} day(s) overdue (GHS ${amountGhs}). Follow up for catch-up payment.`;
  }

  if (input.borrowerPhone && sendBorrowerSms) {
    await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_OVERDUE',
      event: 'MISSED_PAYMENT',
      to: input.borrowerPhone,
      body: smsBody,
      enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  const collectorId =
    input.collectorUserId ?? (await resolveCollectorUserIdForBorrower(input.borrowerId));
  if (collectorId && input.daysOverdue !== graceDays + 2) {
    await dispatchStaffInApp({
      dedupeKey,
      notificationType: 'PAYMENT_OVERDUE',
      userId: collectorId,
      event: 'MISSED_PAYMENT',
      title,
      body: collectorBody,
      href: `/collector/payment/${input.borrowerId}`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  if (input.daysOverdue === graceDays + 2 || input.daysOverdue >= 7) {
    if (isDatabaseEnabled()) {
      const db = getDb();
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, USER_ROLE.SUPER_ADMIN), isNull(users.deletedAt)));
      for (const admin of admins) {
        await dispatchStaffInApp({
          dedupeKey: `${dedupeKey}:admin`,
          notificationType: 'SUPERVISOR_ALERT',
          userId: admin.id,
          event: 'MISSED_PAYMENT',
          title,
          body: `${input.borrowerName} delinquency day ${input.daysOverdue} (GHS ${amountGhs}, loan ${input.loanDisplayId}).`,
          href: '/reports/missed-payments',
          borrowerId: input.borrowerId,
          loanId: input.loanId,
          correlationId: input.correlationId,
        });
      }
    }
  }

  recordNotificationMetric('payment_missed');
}

/** Weekly reminder while MISSED arrears remain outstanding (fires on payment day). */
export async function emitWeeklyArrearsReminder(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  missedWeekCount: number;
  totalArrearsPesewas: number;
  paymentDay: string;
  referenceDate: string;
  collectorUserId?: string;
  correlationId?: string;
}): Promise<boolean> {
  const dedupeKey = DEDUPE.weeklyArrearsReminder(input.loanId, input.referenceDate);
  const settings = await getSettings();
  const context = await resolveBorrowerCollectionContext(input.borrowerId);
  const smsBody = buildWeeklyArrearsReminderSmsBody({
    borrowerName: input.borrowerName,
    missedWeekCount: input.missedWeekCount,
    totalArrearsPesewas: input.totalArrearsPesewas,
    collectorName: context.collectorName,
  });

  let sent = false;
  if (input.borrowerPhone) {
    sent = await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'WEEKLY_ARREARS_REMINDER',
      event: 'MISSED_PAYMENT',
      to: input.borrowerPhone,
      body: smsBody,
      enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  const collectorId =
    input.collectorUserId ?? (await resolveCollectorUserIdForBorrower(input.borrowerId));
  if (collectorId) {
    await dispatchStaffInApp({
      dedupeKey,
      notificationType: 'WEEKLY_ARREARS_REMINDER',
      userId: collectorId,
      event: 'MISSED_PAYMENT',
      title: 'Weekly arrears reminder',
      body: `${input.borrowerName} has ${input.missedWeekCount} missed week(s) (GHS ${formatGhsAmount(input.totalArrearsPesewas)}). Record catch-up payment when collected.`,
      href: `/collector/payment/${input.borrowerId}`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  return sent;
}

/** Notify borrower, assigned collector, and admins when a payment is missed. */
export async function emitPaymentMissedNotification(input: {
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  loanId: string;
  loanDisplayId: string;
  dueDate: string;
  amountPesewas: number;
  remainingBalancePesewas?: number;
  weeksRemaining?: number;
  collectorUserId?: string;
  correlationId?: string;
}): Promise<void> {
  const dedupeKey = DEDUPE.paymentMissed(input.loanId, input.dueDate);
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const context = await resolveBorrowerCollectionContext(input.borrowerId);

  if (input.borrowerPhone) {
    await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_MISSED',
      event: 'MISSED_PAYMENT',
      to: input.borrowerPhone,
      body: buildMissedPaymentSmsBody({
        borrowerName: input.borrowerName,
        amountPesewas: input.amountPesewas,
        dueDate: input.dueDate,
        remainingBalancePesewas: input.remainingBalancePesewas,
        weeksRemaining: input.weeksRemaining,
        collectorName: context.collectorName,
      }),
      enabled: settings.smsNotificationsEnabled && settings.missedPaymentSmsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  const collectorId =
    input.collectorUserId ?? (await resolveCollectorUserIdForBorrower(input.borrowerId));
  if (collectorId) {
    await dispatchStaffInApp({
      dedupeKey,
      notificationType: 'PAYMENT_MISSED',
      userId: collectorId,
      event: 'MISSED_PAYMENT',
      title: 'Missed payment',
      body: `A scheduled payment of GHS ${amountGhs} for ${input.borrowerName} was not recorded for ${input.dueDate}.`,
      href: `/collector/payment/${input.borrowerId}`,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  recordNotificationMetric('payment_missed');
}

/** Notify borrower and collector after a payment is committed. */
export async function emitPaymentConfirmedNotification(input: {
  paymentId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  amountPesewas: number;
  paymentDate: string;
  loanDisplayId: string;
  loanId: string;
  outstandingBalancePesewas?: number;
  weeksRemaining?: number;
  nextDueDate?: string;
  collectorUserId?: string;
  weeksPaid?: number;
  correlationId?: string;
}): Promise<void> {
  const dedupeKey = DEDUPE.paymentConfirmed(input.paymentId);
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);
  const weeksPaid = input.weeksPaid ?? 1;

  if (input.borrowerPhone) {
    const smsBody =
      weeksPaid > 1
        ? buildMultiWeekPaymentSmsBody({
            borrowerName: input.borrowerName,
            amountPesewas: input.amountPesewas,
            weeksPaid,
            remainingBalancePesewas: input.outstandingBalancePesewas,
            weeksRemaining: input.weeksRemaining,
          })
        : buildPaymentConfirmationSmsBody({
            borrowerName: input.borrowerName,
            amountPesewas: input.amountPesewas,
            paymentDate: input.paymentDate,
            remainingBalancePesewas: input.outstandingBalancePesewas,
            weeksRemaining: input.weeksRemaining,
          });
    await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_CONFIRMED',
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerPhone,
      body: smsBody,
      enabled: settings.smsNotificationsEnabled,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  if (input.borrowerEmail) {
    const template = buildPaymentConfirmationEmail({
      borrowerName: input.borrowerName,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      loanDisplayId: input.loanDisplayId,
      outstandingBalancePesewas: input.outstandingBalancePesewas,
    });
    await dispatchBorrowerEmail({
      dedupeKey,
      notificationType: 'PAYMENT_CONFIRMED',
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  if (input.collectorUserId) {
    await dispatchStaffInApp({
      dedupeKey,
      notificationType: 'PAYMENT_CONFIRMED',
      userId: input.collectorUserId,
      event: 'PAYMENT_RECEIVED',
      title: 'Payment confirmed',
      body: `GHS ${amountGhs} received from ${input.borrowerName}.`,
      href: '/collector/reconciliation',
      borrowerId: input.borrowerId,
      loanId: input.loanId,
      correlationId: input.correlationId,
    });
  }

  recordNotificationMetric('payment_confirmed');
}

/** Daily grouped summary for super administrators when missed payments occur. */
export async function emitAdminMissedPaymentSummary(input: {
  referenceDate: string;
  missedCount: number;
  groupCount: number;
  correlationId?: string;
}): Promise<void> {
  if (input.missedCount <= 0 || !isDatabaseEnabled()) {
    return;
  }

  const dedupeKey = DEDUPE.adminMissedSummary(input.referenceDate);
  const db = getDb();
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, USER_ROLE.SUPER_ADMIN), isNull(users.deletedAt)));

  const body = `${input.missedCount} scheduled payment${input.missedCount === 1 ? '' : 's'} were missed on ${input.referenceDate} across ${input.groupCount} group${input.groupCount === 1 ? '' : 's'}.`;

  for (const admin of admins) {
    await dispatchStaffInApp({
      dedupeKey,
      notificationType: 'ADMIN_MISSED_SUMMARY',
      userId: admin.id,
      event: 'SUPERVISOR_ALERT',
      title: 'Missed payments summary',
      body,
      href: '/reports/missed-payments',
      correlationId: input.correlationId,
    });
  }
}

export async function resolveNextDueDate(loanId: string): Promise<string | undefined> {
  const weeks = await scheduleRepo.listScheduleWeeks(loanId);
  const next = weeks.find((week) => week.status === 'PENDING' || week.status === 'MISSED');
  return next?.dueDate;
}

/** Count unpaid schedule weeks (pending + missed). */
export async function resolveWeeksRemaining(loanId: string): Promise<number> {
  const weeks = await scheduleRepo.listScheduleWeeks(loanId);
  return weeks.filter((week) => week.status === 'PENDING' || week.status === 'MISSED').length;
}

/** Weekly installment in pesewas from loan row. */
export function loanInstallmentPesewas(installmentAmount: string): number {
  return decimalToPesewas(installmentAmount);
}

export function loanBalancePesewas(loanBalance: string): number {
  return decimalToPesewas(loanBalance);
}

export { pesewasToDecimal };
