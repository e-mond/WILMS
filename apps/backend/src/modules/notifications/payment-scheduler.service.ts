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
  emitAdminMissedPaymentSummary,
  emitPaymentDueSoonNotification,
  emitPaymentMissedNotification,
  loanInstallmentPesewas,
  resolveCollectorUserIdForBorrower,
} from '../../infrastructure/notifications/payment-notifications.js';
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
  missedNotificationsSent: number;
  skippedFullyPaid: number;
  skippedInactiveSchedule: number;
  errors: string[];
  durationMs: number;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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
    missedNotificationsSent: 0,
    skippedFullyPaid: 0,
    skippedInactiveSchedule: 0,
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
    const reminderLeadDays = settings.paymentReminderDaysBefore ?? 1;
    const reminderDueDate = addDays(ref, reminderLeadDays);

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

        for (const week of scheduleWeeks) {
          // Only PENDING obligations qualify for due-soon reminders.
          if (week.status !== 'PENDING') {
            continue;
          }
          if (week.dueDate === reminderDueDate) {
            await emitPaymentDueSoonNotification({
              borrowerId: borrower.id,
              borrowerName: borrower.fullName,
              borrowerPhone: borrower.phone,
              borrowerEmail: borrower.profile?.email,
              loanId: loanRow.id,
              loanDisplayId,
              amountPesewas: weeklyPesewas,
              dueDate: week.dueDate,
              correlationId,
            });
            result.remindersSent += 1;
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
        missedNotificationsSent: result.missedNotificationsSent,
        skippedFullyPaid: result.skippedFullyPaid,
        errorCount: result.errors.length,
      },
    });

    logger.info('scheduler.payment_notifications.complete', {
      correlationId,
      referenceDate: ref,
      durationMs: result.durationMs,
      remindersSent: result.remindersSent,
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
    logger.error('scheduler.payment_notifications.failed', {
      correlationId,
      error: message,
      durationMs: result.durationMs,
    });
    return result;
  }
}
