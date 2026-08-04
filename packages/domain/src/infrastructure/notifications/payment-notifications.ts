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
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSmsBody,
  formatGhsAmount,
} from './templates.js';
import { createInAppNotification } from './in-app-notify.js';
import { dispatchMail } from '../mail/dispatch.js';
import { getSmsProvider } from '../sms/index.js';
import { normalizeGhanaPhone } from '../sms/normalize-phone.js';
import { logMessageDelivery } from './delivery-log.js';

export const DEDUPE = {
  paymentDueSoon: (loanId: string, dueDate: string) => `payment-due-soon:${loanId}:${dueDate}`,
  paymentMissed: (loanId: string, dueDate: string) => `payment-missed:${loanId}:${dueDate}`,
  paymentConfirmed: (paymentId: string) => `payment-confirmed:${paymentId}`,
  paymentReversed: (paymentId: string) => `payment-reversed:${paymentId}`,
  adminMissedSummary: (date: string) => `admin-missed-summary:${date}`,
} as const;

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
}): Promise<void> {
  const dedupeKey = DEDUPE.paymentDueSoon(input.loanId, input.dueDate);
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);

  const smsBody = buildLoanReminderSmsBody({
    borrowerName: input.borrowerName,
    loanDisplayId: input.loanDisplayId,
    amountPesewas: input.amountPesewas,
    dueDate: input.dueDate,
    dueTomorrow: true,
  });

  if (input.borrowerPhone) {
    await dispatchBorrowerSms({
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
      dueDate: input.dueDate,
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
  collectorUserId?: string;
  correlationId?: string;
}): Promise<void> {
  const dedupeKey = DEDUPE.paymentMissed(input.loanId, input.dueDate);
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);

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
  nextDueDate?: string;
  collectorUserId?: string;
  correlationId?: string;
}): Promise<void> {
  const dedupeKey = DEDUPE.paymentConfirmed(input.paymentId);
  const settings = await getSettings();
  const amountGhs = formatGhsAmount(input.amountPesewas);

  if (input.borrowerPhone) {
    await dispatchBorrowerSms({
      dedupeKey,
      notificationType: 'PAYMENT_CONFIRMED',
      event: 'PAYMENT_RECEIVED',
      to: input.borrowerPhone,
      body: buildPaymentConfirmationSmsBody({
        amountPesewas: input.amountPesewas,
        paymentDate: input.paymentDate,
      }),
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
      href: '/reports/defaulters',
      correlationId: input.correlationId,
    });
  }
}

export { addDays };

/** Resolve the next pending schedule due date for a loan, if any. */
export async function resolveNextDueDate(loanId: string): Promise<string | undefined> {
  const weeks = await scheduleRepo.listScheduleWeeks(loanId);
  const next = weeks.find((week) => week.status === 'PENDING' || week.status === 'MISSED');
  return next?.dueDate;
}

/** Weekly installment in pesewas from loan row. */
export function loanInstallmentPesewas(installmentAmount: string): number {
  return decimalToPesewas(installmentAmount);
}

export function loanBalancePesewas(loanBalance: string): number {
  return decimalToPesewas(loanBalance);
}

export { pesewasToDecimal };
