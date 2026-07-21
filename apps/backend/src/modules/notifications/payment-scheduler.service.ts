/**
 * HTTP-triggered payment notification scheduler.
 *
 * Idempotent and safe to rerun — duplicate notifications are prevented by
 * notification_delivery_records unique constraints. Requires external cron
 * (or operator) to POST /notifications/scheduler/run; not a durable queue.
 */
import { formatLoanDisplayId } from '@wilms/shared-utils';
import { isDatabaseEnabled } from '../../db/client.js';
import { decimalToPesewas } from '../../domain/money.js';
import { getSettings } from '../settings/service.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import {
  addDays,
  emitAdminMissedPaymentSummary,
  emitPaymentDueSoonNotification,
  emitPaymentMissedNotification,
  loanInstallmentPesewas,
  resolveCollectorUserIdForBorrower,
} from '../../infrastructure/notifications/payment-notifications.js';
import { uuidv7 } from 'uuidv7';

export interface PaymentSchedulerResult {
  referenceDate: string;
  correlationId: string;
  activeLoansScanned: number;
  remindersSent: number;
  missedNotificationsSent: number;
  skippedFullyPaid: number;
  errors: string[];
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function processPaymentNotificationJobs(
  referenceDate?: string,
): Promise<PaymentSchedulerResult> {
  const ref = referenceDate ?? todayIso();
  const correlationId = uuidv7();
  const result: PaymentSchedulerResult = {
    referenceDate: ref,
    correlationId,
    activeLoansScanned: 0,
    remindersSent: 0,
    missedNotificationsSent: 0,
    skippedFullyPaid: 0,
    errors: [],
  };

  if (!isDatabaseEnabled()) {
    result.errors.push('DATABASE_URL not configured — scheduler requires PostgreSQL');
    return result;
  }

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

  return result;
}
