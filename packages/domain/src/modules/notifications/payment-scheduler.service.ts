/**
 * HTTP-triggered payment notification scheduler.
 *
 * Idempotent and safe to rerun — duplicate notifications are prevented by
 * notification_delivery_records unique constraints. Requires external cron
 * (or operator) to POST /notifications/scheduler/run; not a durable queue.
 */
import { formatLoanDisplayId } from '@wilms/shared-utils';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import { decimalToPesewas } from '../../domain/money.js';
import { logger } from '../../infrastructure/logging/logger.js';
import {
  addDays,
  calendarDateInTimeZone,
  emitAdminMissedPaymentSummary,
  emitPaymentDueSoonNotification,
  emitPaymentDueTodayNotification,
  emitPaymentMissedNotification,
  emitPaymentOverdueLadderNotification,
  emitWeeklyArrearsReminder,
  loanInstallmentPesewas,
  reminderLeadDays,
  resolveCollectorUserIdForBorrower,
  selectNextPendingWeek,
  toIsoDate,
} from '../../infrastructure/notifications/payment-notifications.js';
import { notifyGuarantorMissedPayments } from '../../infrastructure/notifications/event-dispatch.js';
import {
  emitSchedulerFailureAlert,
  processOperationalNotificationJobs,
} from '../../infrastructure/notifications/ops-notifications.js';
import { recordSchedulerRun } from '../../infrastructure/scheduler/scheduler-run-state.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import { getSettings } from '../settings/service.js';

export interface PaymentSchedulerResult {
  referenceDate: string;
  correlationId: string;
  activeLoansScanned: number;
  remindersSent: number;
  dueTodaySent: number;
  missedNotificationsSent: number;
  overdueLadderSent: number;
  weeklyArrearsRemindersSent: number;
  skippedFullyPaid: number;
  skippedInactiveSchedule: number;
  opsReconReminders: number;
  errors: string[];
  durationMs: number;
}

function todayIso(): string {
  return calendarDateInTimeZone();
}

function normalizePaymentDayForScheduler(day: string): string {
  return day.trim().toLowerCase();
}

export async function processPaymentNotificationJobs(
  referenceDate?: string,
): Promise<PaymentSchedulerResult> {
  const startedAt = new Date();
  const ref = referenceDate ?? todayIso();
  const correlationId = uuidv7();
  const result: PaymentSchedulerResult = {
    referenceDate: ref,
    correlationId,
    activeLoansScanned: 0,
    remindersSent: 0,
    dueTodaySent: 0,
    missedNotificationsSent: 0,
    overdueLadderSent: 0,
    weeklyArrearsRemindersSent: 0,
    skippedFullyPaid: 0,
    skippedInactiveSchedule: 0,
    opsReconReminders: 0,
    errors: [],
    durationMs: 0,
  };

  logger.info('scheduler.payment_notifications.start', {
    correlationId,
    referenceDate: ref,
  });

  if (!isDatabaseEnabled()) {
    result.errors.push('DATABASE_URL not configured — scheduler requires PostgreSQL');
    result.durationMs = Date.now() - startedAt.getTime();
    recordSchedulerRun({
      kind: 'payment_notifications',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      success: false,
      correlationId,
      error: result.errors[0],
    });
    logger.warn('scheduler.payment_notifications.blocked', {
      correlationId,
      reason: result.errors[0],
    });
    return result;
  }

  try {
    const settings = await getSettings();
    const leadDays = reminderLeadDays(settings.paymentReminderDaysBefore);
    const reminderDueDate = addDays(ref, leadDays);

    const activeLoans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
    result.activeLoansScanned = activeLoans.length;

    const missedGroupIds = new Set<string>();
    let totalMissedEvents = 0;

    for (const loanRow of activeLoans) {
      try {
        const balancePesewas = decimalToPesewas(loanRow.loanBalance);
        if (balancePesewas <= 0) {
          result.skippedFullyPaid += 1;
          continue;
        }

        const borrower = await borrowerRepo.getBorrower(loanRow.borrowerId);
        if (!borrower) {
          result.skippedInactiveSchedule += 1;
          continue;
        }

        const loanDisplayId = formatLoanDisplayId({
          cycleBatch: loanRow.cycleBatch,
          startDate: loanRow.startDate,
        });
        const weeklyPesewas = loanInstallmentPesewas(loanRow.installmentAmount);
        const collectorUserId = await resolveCollectorUserIdForBorrower(loanRow.borrowerId);

        const scheduleWeeks = await scheduleRepo.listScheduleWeeks(loanRow.id);
        const nextPending = selectNextPendingWeek(scheduleWeeks);
        const nextDue = nextPending ? toIsoDate(nextPending.dueDate) : '';

        if (nextPending && nextDue === reminderDueDate) {
          const sent = await emitPaymentDueSoonNotification({
            borrowerId: borrower.id,
            borrowerName: borrower.fullName,
            borrowerPhone: borrower.phone,
            borrowerEmail: borrower.profile?.email,
            loanId: loanRow.id,
            loanDisplayId,
            amountPesewas: weeklyPesewas,
            dueDate: nextDue,
            correlationId,
          });
          if (sent) {
            result.remindersSent += 1;
          }
        }

        if (nextPending && nextDue === ref) {
          const sent = await emitPaymentDueTodayNotification({
            borrowerId: borrower.id,
            borrowerName: borrower.fullName,
            borrowerPhone: borrower.phone,
            borrowerEmail: borrower.profile?.email,
            loanId: loanRow.id,
            loanDisplayId,
            amountPesewas: weeklyPesewas,
            dueDate: nextDue,
            correlationId,
          });
          if (sent) {
            result.dueTodaySent += 1;
          }
        }

        const newlyMissed = await scheduleRepo.applyMissedWeekMarking(
          loanRow.id,
          ref,
          settings.latePaymentGraceDays,
        );

        for (const missed of newlyMissed) {
          await emitPaymentMissedNotification({
            borrowerId: borrower.id,
            borrowerName: borrower.fullName,
            borrowerPhone: borrower.phone,
            borrowerEmail: borrower.profile?.email,
            loanId: loanRow.id,
            loanDisplayId,
            dueDate: missed.dueDate,
            amountPesewas: weeklyPesewas,
            collectorUserId,
            correlationId,
          });
          result.missedNotificationsSent += 1;
          totalMissedEvents += 1;
          if (borrower.groupId) {
            missedGroupIds.add(borrower.groupId);
          }
        }

        const delinquentWeekCount = scheduleWeeks.filter(
          (week) =>
            week.status === 'MISSED' ||
            (week.status === 'PENDING' && toIsoDate(week.dueDate) < ref),
        ).length;
        if (delinquentWeekCount > 2) {
          await notifyGuarantorMissedPayments({
            guarantorName: borrower.profile?.guarantorName ?? 'Guarantor',
            guarantorPhone: borrower.profile?.guarantorPhone,
            borrowerId: borrower.id,
            borrowerName: borrower.fullName,
          });
        }

        const refreshedSchedule = await scheduleRepo.listScheduleWeeks(loanRow.id);
        const missedWeekRows = refreshedSchedule.filter((week) => week.status === 'MISSED');
        const missedWeekCount = missedWeekRows.length;
        if (
          missedWeekCount > 0 &&
          normalizePaymentDayForScheduler(loanRow.paymentDay) ===
            normalizePaymentDayForScheduler(
              new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                timeZone: 'UTC',
              }).format(new Date(`${ref}T00:00:00.000Z`)),
            )
        ) {
          const sent = await emitWeeklyArrearsReminder({
            borrowerId: borrower.id,
            borrowerName: borrower.fullName,
            borrowerPhone: borrower.phone,
            borrowerEmail: borrower.profile?.email,
            loanId: loanRow.id,
            loanDisplayId,
            missedWeekCount,
            totalArrearsPesewas: missedWeekCount * weeklyPesewas,
            paymentDay: loanRow.paymentDay,
            referenceDate: ref,
            collectorUserId,
            correlationId,
          });
          if (sent) {
            result.weeklyArrearsRemindersSent += 1;
          }
        }

        for (const week of refreshedSchedule) {
          if (week.status !== 'MISSED' && !(week.status === 'PENDING' && toIsoDate(week.dueDate) < ref)) {
            continue;
          }
          const daysPast = Math.floor(
            (Date.parse(`${ref}T00:00:00Z`) - Date.parse(`${toIsoDate(week.dueDate)}T00:00:00Z`)) /
              86400000,
          );
          if (
            daysPast === 1 ||
            daysPast === settings.latePaymentGraceDays ||
            daysPast === settings.latePaymentGraceDays + 1 ||
            daysPast === settings.latePaymentGraceDays + 2 ||
            (daysPast >= 7 && daysPast % 7 === 0)
          ) {
            await emitPaymentOverdueLadderNotification({
              borrowerId: borrower.id,
              borrowerName: borrower.fullName,
              borrowerPhone: borrower.phone,
              borrowerEmail: borrower.profile?.email,
              loanId: loanRow.id,
              loanDisplayId,
              dueDate: week.dueDate,
              amountPesewas: weeklyPesewas,
              daysOverdue: daysPast,
              graceDays: settings.latePaymentGraceDays,
              collectorUserId,
              correlationId,
            });
            result.overdueLadderSent += 1;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown scheduler error';
        result.errors.push(`loan ${loanRow.id}: ${message}`);
      }
    }

    if (totalMissedEvents > 0) {
      await emitAdminMissedPaymentSummary({
        referenceDate: ref,
        missedCount: totalMissedEvents,
        groupCount: missedGroupIds.size || 1,
        correlationId,
      });
    }

    try {
      const ops = await processOperationalNotificationJobs(ref);
      result.opsReconReminders = ops.reconReminders;
    } catch (opsError) {
      const message = opsError instanceof Error ? opsError.message : 'Ops scheduler failed';
      result.errors.push(message);
      await emitSchedulerFailureAlert({
        kind: 'operational_notifications',
        error: message,
        referenceDate: ref,
      });
    }

    result.durationMs = Date.now() - startedAt.getTime();
    recordSchedulerRun({
      kind: 'payment_notifications',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      success: result.errors.length === 0,
      correlationId,
      summary: {
        activeLoansScanned: result.activeLoansScanned,
        remindersSent: result.remindersSent,
        dueTodaySent: result.dueTodaySent,
        missedNotificationsSent: result.missedNotificationsSent,
        opsReconReminders: result.opsReconReminders,
        skippedFullyPaid: result.skippedFullyPaid,
        errorCount: result.errors.length,
      },
    });

    logger.info('scheduler.payment_notifications.complete', {
      correlationId,
      referenceDate: ref,
      durationMs: result.durationMs,
      remindersSent: result.remindersSent,
      dueTodaySent: result.dueTodaySent,
      missedNotificationsSent: result.missedNotificationsSent,
      errorCount: result.errors.length,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scheduler failed';
    result.errors.push(message);
    result.durationMs = Date.now() - startedAt.getTime();
    recordSchedulerRun({
      kind: 'payment_notifications',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      success: false,
      correlationId,
      error: message,
    });
    void emitSchedulerFailureAlert({
      kind: 'payment_notifications',
      error: message,
      referenceDate: ref,
    });
    logger.error('scheduler.payment_notifications.failed', {
      correlationId,
      error: message,
      durationMs: result.durationMs,
    });
    return result;
  }
}
