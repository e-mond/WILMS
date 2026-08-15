import { z } from 'zod';
import { formatPaymentDisplayId } from '@wilms/shared-utils';
import { isDatabaseEnabled, runInTransaction } from '../../db/client.js';
import {
  applyPaymentToSchedule,
  computeGraceAndEscalation,
  countConsecutiveMissedWeeks,
  getPayableWeeks,
  validatePaymentSubmission,
} from '../../domain/payment/allocation.js';
import {
  mapLoanRowToDetail,
  mapScheduleRow,
} from '../../domain/loan/mappers.js';
import { LOAN_LIFECYCLE } from '../../domain/loan/lifecycle.js';
import { pesewasToDecimal } from '../../domain/money.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import { notifyLoanFullyPaid, notifyGuarantorLoanFullyRepaid } from '../../infrastructure/notifications/event-dispatch.js';
import {
  emitPaymentConfirmedNotification,
  emitPaymentMissedNotification,
  resolveNextDueDate,
  resolveWeeksRemaining,
} from '../../infrastructure/notifications/payment-notifications.js';
import * as ledgerRepo from '../../repositories/ledger.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import { getSettings } from '../settings/service.js';

export const recordPaymentSchema = z.object({
  borrowerId: z.string().min(1),
  amountPesewas: z.number().int().positive(),
  paymentDate: z.string().min(1),
  collectorId: z.string().min(1),
  loanId: z.string().optional(),
  /** Number of oldest payable weeks to clear. Defaults to 1. */
  weeksCount: z.number().int().min(1).max(52).optional(),
  gps: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      accuracy: z.number().optional(),
      accuracyMeters: z.number().optional(),
      capturedAt: z.string().optional(),
      collectorId: z.string().optional(),
      device: z.record(z.unknown()).optional(),
      unavailable: z.boolean().optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

export async function getPaymentEntryContext(borrowerId: string, referenceDate?: string) {
  requireDatabase();
  const borrower = await borrowerRepo.getBorrower(borrowerId);
  if (!borrower) {
    throw new Error('NOT_FOUND');
  }

  const ref = referenceDate ?? new Date().toISOString().slice(0, 10);
  const loanRows = await loanRepo.listBorrowerLoans(borrowerId);
  const activeLoan = loanRows.find((row) => row.externalStatus === 'ACTIVE');

  if (!activeLoan) {
    return {
      borrowerId,
      borrowerName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupId: borrower.groupId,
      groupName: borrower.groupName,
      loanId: '',
      paymentDay: '',
      weeklyPaymentPesewas: 0,
      referenceDate: ref,
      isPaymentDay: false,
      requiredAmountPesewas: 0,
      obligationWeeks: [],
      missedWeeks: [],
      payableWeeks: [],
      totalPayableAmountPesewas: 0,
      totalOutstandingObligationsPesewas: 0,
      maxPayableWeeks: 0,
      consecutiveMissedWeeks: 0,
      escalationLevel: 'NONE' as const,
      canAcceptPayment: false,
      blockReason: 'No active loan for this borrower.',
    };
  }

  const loan = mapLoanRowToDetail(activeLoan);
  const settings = await getSettings();
  const newlyMissedWeeks = await scheduleRepo.applyMissedWeekMarking(
    loan.id,
    ref,
    settings.latePaymentGraceDays,
  );
  // Missed-payment notifications are dispatched by the payment notification scheduler.
  void newlyMissedWeeks;
  const scheduleRows = await scheduleRepo.listScheduleWeeks(loan.id);
  const scheduleWeeks = scheduleRows.map(mapScheduleRow);

  const obligationWeeks = getPayableWeeks(scheduleWeeks, ref).map((week) => ({
    weekNumber: week.weekNumber,
    dueDate: week.dueDate,
    amountPesewas: week.amountPesewas,
    status: week.status,
  }));

  const missedWeeks = obligationWeeks.filter((week) => week.status === 'MISSED');
  const totalPayableAmountPesewas = obligationWeeks.reduce(
    (sum, week) => sum + week.amountPesewas,
    0,
  );
  const consecutiveMissedWeeks = countConsecutiveMissedWeeks(scheduleWeeks, ref);
  const graceInfo = computeGraceAndEscalation({
    referenceDate: ref,
    oldestPayableDueDate: obligationWeeks[0]?.dueDate,
    graceDays: settings.latePaymentGraceDays,
  });

  const payments = await paymentRepo.listPayments({ borrowerIds: [borrowerId], limit: 50 });
  const lastPayment = payments
    .slice()
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))[0];

  let blockReason = validatePaymentSubmission({
    amountPesewas: loan.weeklyPaymentPesewas,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    paymentDay: loan.paymentDay,
    referenceDate: ref,
    scheduleWeeks,
    weeksCount: 1,
  });

  /** Once the oldest unpaid week is marked missed, payment actions are locked (same as group sheet). */
  const recordedMissed = obligationWeeks[0]?.status === 'MISSED';
  if (!blockReason && recordedMissed) {
    blockReason =
      'This borrower was marked missed. Payment buttons are disabled until the missed week is cleared by operations.';
  }

  const isPaymentDay = !blockReason?.includes('assigned payment day');
  const nextDue =
    scheduleWeeks.find((week) => week.status === 'PENDING' && week.dueDate > ref) ??
    obligationWeeks[0];

  return {
    borrowerId,
    borrowerName: borrower.fullName,
    phone: borrower.phone,
    community: borrower.community,
    groupId: borrower.groupId,
    groupName: borrower.groupName,
    loanId: loan.id,
    loanDisplayId: loan.displayId ?? loan.id,
    outstandingPesewas: loan.outstandingPesewas,
    paymentDay: loan.paymentDay,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    referenceDate: ref,
    isPaymentDay,
    requiredAmountPesewas: loan.weeklyPaymentPesewas,
    oldestObligation: obligationWeeks[0],
    obligationWeeks,
    missedWeeks,
    payableWeeks: obligationWeeks,
    totalPayableAmountPesewas,
    totalOutstandingObligationsPesewas: totalPayableAmountPesewas,
    nextDueDate: nextDue?.dueDate,
    gracePeriodEnd: graceInfo.gracePeriodEnd,
    graceDays: settings.latePaymentGraceDays,
    escalationLevel: graceInfo.escalationLevel,
    consecutiveMissedWeeks,
    lastPayment: lastPayment
      ? {
          id: lastPayment.id,
          paymentDate: lastPayment.paymentDate,
          amountPesewas: lastPayment.amountPesewas,
        }
      : undefined,
    maxPayableWeeks: obligationWeeks.length,
    canAcceptPayment: !blockReason && obligationWeeks.length > 0 && !recordedMissed,
    blockReason,
    recordedMissed,
  };
}

export async function recordPayment(
  input: z.infer<typeof recordPaymentSchema>,
  actorId: string,
  idempotencyKey?: string,
) {
  requireDatabase();

  return runWithIdempotency({
    scope: 'PAYMENT_POST',
    actorUserId: actorId,
    idempotencyKey,
    requestPayload: input,
    responseStatus: 201,
    execute: async () => postPayment(input, actorId),
  });
}

function assertCollectionGps(gps: z.infer<typeof recordPaymentSchema>['gps']) {
  if (!gps) {
    throw new Error('VALIDATION:GPS coordinates are required to record a collection.');
  }

  if (gps.unavailable) {
    if (!gps.reason?.trim()) {
      throw new Error('VALIDATION:A reason is required when GPS is unavailable.');
    }
    return;
  }

  if (
    typeof gps.latitude !== 'number' ||
    typeof gps.longitude !== 'number' ||
    !Number.isFinite(gps.latitude) ||
    !Number.isFinite(gps.longitude)
  ) {
    throw new Error('VALIDATION:GPS coordinates are required to record a collection.');
  }
}

async function postPayment(
  input: z.infer<typeof recordPaymentSchema>,
  actorId: string,
) {
  assertCollectionGps(input.gps);

  const weeksCount = input.weeksCount ?? 1;

  const loanRows = await loanRepo.listBorrowerLoans(input.borrowerId);
  const activeLoan = loanRows.find((row) => row.externalStatus === 'ACTIVE');
  if (!activeLoan) {
    throw new Error('NOT_FOUND');
  }

  const loan = mapLoanRowToDetail(activeLoan);
  const settings = await getSettings();
  await scheduleRepo.applyMissedWeekMarking(
    loan.id,
    input.paymentDate,
    settings.latePaymentGraceDays,
  );
  const scheduleRows = await scheduleRepo.listScheduleWeeks(loan.id);
  const scheduleWeeks = scheduleRows.map(mapScheduleRow);

  const validationError = validatePaymentSubmission({
    amountPesewas: input.amountPesewas,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    paymentDay: loan.paymentDay,
    referenceDate: input.paymentDate,
    scheduleWeeks,
    weeksCount,
  });

  if (validationError) {
    throw new Error(`VALIDATION:${validationError}`);
  }

  const payableWeeks = getPayableWeeks(scheduleWeeks, input.paymentDate);
  if (payableWeeks[0]?.status === 'MISSED') {
    throw new Error(
      'VALIDATION:This borrower was marked missed. Payment cannot be recorded for a missed week from the payment entry screen.',
    );
  }

  const allocation = applyPaymentToSchedule(scheduleWeeks, input.paymentDate, weeksCount);
  const weekNumbers = allocation.weekNumbers;
  if (weekNumbers.length !== weeksCount) {
    throw new Error('VALIDATION:No payable obligation found.');
  }

  const weeklyAmount = loan.weeklyPaymentPesewas;
  const amountDecimal = pesewasToDecimal(weeklyAmount);

  for (const weekNumber of weekNumbers) {
    const weekRow = scheduleRows.find((row) => row.weekNumber === weekNumber);
    if (!weekRow || weekRow.status === 'PAID') {
      throw new Error('DUPLICATE');
    }
  }

  if (weeksCount === 1) {
    const duplicate = await paymentRepo.findDuplicatePayment({
      borrowerId: input.borrowerId,
      paymentDate: input.paymentDate,
      amountPesewas: input.amountPesewas,
    });
    if (duplicate) {
      throw new Error('DUPLICATE');
    }
  }

  const result = await runInTransaction(async (tx) => {
    const createdPayments = [];
    let loanVersion = activeLoan.version;
    let runningBalance = loan.outstandingPesewas;

    for (const weekNumber of weekNumbers) {
      const weekRow = scheduleRows.find((row) => row.weekNumber === weekNumber);
      if (!weekRow) {
        throw new Error('NOT_FOUND');
      }

      runningBalance = Math.max(runningBalance - weeklyAmount, 0);

      const payment = await paymentRepo.appendPayment(
        {
          id: paymentRepo.nextPaymentId(),
          borrowerId: input.borrowerId,
          collectorId: input.collectorId,
          amountPesewas: weeklyAmount,
          paymentDate: input.paymentDate,
          recordedAt: new Date().toISOString(),
          gps: input.gps,
          loanId: loan.id,
          scheduleWeekNumber: weekNumber,
        },
        tx,
      );
      createdPayments.push(payment);

      await scheduleRepo.markWeekPaid(
        {
          loanId: loan.id,
          weekNumber,
          expectedVersion: weekRow.version,
        },
        tx,
      );

      const lifecycleStatus =
        runningBalance === 0 ? LOAN_LIFECYCLE.COMPLETED : LOAN_LIFECYCLE.ACTIVE;

      await loanRepo.updateLoanLifecycle(
        {
          loanId: loan.id,
          expectedVersion: loanVersion,
          lifecycleStatus,
          loanBalance: pesewasToDecimal(runningBalance),
        },
        tx,
      );
      loanVersion += 1;

      await ledgerRepo.appendLedgerEntry(
        {
          entryType: 'REPAYMENT',
          loanId: loan.id,
          borrowerId: input.borrowerId,
          paymentId: payment.id,
          amountDecimal,
          description: `Repayment week ${weekNumber}`,
          actorUserId: actorId,
          metadata: { weekNumber, weeksCount },
        },
        tx,
      );

      if (activeLoan.loanPoolId) {
        await poolRepo.appendAllocation(
          {
            poolId: activeLoan.loanPoolId,
            allocationType: 'REPAYMENT',
            amountPesewas: weeklyAmount,
            loanId: loan.id,
            borrowerId: input.borrowerId,
            paymentId: payment.id,
            description: `Repayment week ${weekNumber}`,
            actorUserId: actorId,
          },
          tx,
        );
      }
    }

    if (activeLoan.loanPoolId) {
      await poolRepo.refreshPoolAggregates(activeLoan.loanPoolId, tx);
    }

    return { payments: createdPayments, finalBalance: runningBalance };
  });

  for (const payment of result.payments) {
    appendAuditEntry({
      action: 'payment.recorded',
      actorId,
      targetEntityId: payment.id,
      targetEntityType: 'payment',
      reason: weeksCount > 1 ? `Multi-week allocation (${weeksCount} weeks)` : undefined,
    });
    if (input.gps?.unavailable) {
      appendAuditEntry({
        action: 'collection.gps-exception',
        actorId,
        targetEntityId: payment.id,
        targetEntityType: 'payment',
        reason: input.gps.reason?.trim() || 'GPS unavailable',
      });
    }
  }

  const borrower = await borrowerRepo.getBorrower(input.borrowerId);
  if (borrower) {
    const nextDueDate = await resolveNextDueDate(loan.id);
    const weeksRemaining = await resolveWeeksRemaining(loan.id);
    if (weeksCount > 1) {
      const primaryPayment = result.payments[0]!;
      void emitPaymentConfirmedNotification({
        paymentId: primaryPayment.id,
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        borrowerPhone: borrower.phone,
        borrowerEmail: borrower.profile?.email,
        amountPesewas: input.amountPesewas,
        paymentDate: input.paymentDate,
        loanDisplayId: loan.displayId ?? loan.id,
        loanId: loan.id,
        outstandingBalancePesewas: result.finalBalance,
        weeksRemaining,
        nextDueDate,
        collectorUserId: input.collectorId,
        weeksPaid: weeksCount,
      });
    } else {
      for (const payment of result.payments) {
        void emitPaymentConfirmedNotification({
          paymentId: payment.id,
          borrowerId: borrower.id,
          borrowerName: borrower.fullName,
          borrowerPhone: borrower.phone,
          borrowerEmail: borrower.profile?.email,
          amountPesewas: weeklyAmount,
          paymentDate: input.paymentDate,
          loanDisplayId: loan.displayId ?? loan.id,
          loanId: loan.id,
          outstandingBalancePesewas: result.finalBalance,
          weeksRemaining,
          nextDueDate,
          collectorUserId: input.collectorId,
        });
      }
    }

    if (result.finalBalance === 0) {
      void notifyLoanFullyPaid({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        borrowerPhone: borrower.phone,
        borrowerEmail: borrower.profile?.email,
        loanId: loan.id,
        loanDisplayId: loan.displayId ?? loan.id,
        totalPaidPesewas: loan.amountPesewas,
        finalPaymentPesewas: input.amountPesewas,
        collectorUserId: input.collectorId,
      });
      void notifyGuarantorLoanFullyRepaid({
        guarantorName: borrower.profile?.guarantorName ?? 'Guarantor',
        guarantorPhone: borrower.profile?.guarantorPhone,
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
      });
    }
  }

  const primary = result.payments[0]!;
  return {
    id: primary.id,
    displayId: formatPaymentDisplayId({ recordedAt: primary.recordedAt }),
    borrowerId: primary.borrowerId,
    collectorId: primary.collectorId,
    loanId: loan.id,
    amountPesewas: input.amountPesewas,
    paymentDate: primary.paymentDate,
    recordedAt: primary.recordedAt,
    status: 'CONFIRMED',
    gps: primary.gps,
    weekNumber: weekNumbers[0],
    weekNumbers,
    weeksCount,
    paymentIds: result.payments.map((payment) => payment.id),
  };
}

export const markMissedPaymentSchema = z.object({
  borrowerId: z.string().min(1),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  loanId: z.string().optional(),
  collectorId: z.string().min(1),
});

/**
 * Collector marks today's payable week as MISSED and notifies the borrower.
 */
export async function markMissedPayment(
  input: z.infer<typeof markMissedPaymentSchema>,
  actorId: string,
  idempotencyKey?: string,
) {
  requireDatabase();

  return runWithIdempotency({
    scope: 'PAYMENT_MISSED_MARK',
    actorUserId: actorId,
    idempotencyKey,
    requestPayload: input,
    responseStatus: 200,
    execute: async () => {
      const loanRows = await loanRepo.listBorrowerLoans(input.borrowerId);
      const activeLoan = loanRows.find((row) => row.externalStatus === 'ACTIVE');
      if (!activeLoan) {
        throw new Error('NOT_FOUND');
      }
      if (input.loanId && input.loanId !== activeLoan.id) {
        throw new Error('VALIDATION:Loan does not match the borrower active loan.');
      }

      const loan = mapLoanRowToDetail(activeLoan);
      const scheduleRows = await scheduleRepo.listScheduleWeeks(loan.id);
      const payable =
        scheduleRows.find(
          (week) =>
            (week.status === 'PENDING' || week.status === 'MISSED') &&
            week.dueDate === input.paymentDate,
        ) ??
        scheduleRows.find((week) => week.status === 'PENDING' || week.status === 'MISSED');

      if (!payable) {
        throw new Error('VALIDATION:No unpaid schedule week to mark as missed.');
      }

      if (payable.status === 'MISSED') {
        const weeksRemaining = scheduleRows.filter(
          (week) => week.status === 'PENDING' || week.status === 'MISSED',
        ).length;
        return {
          loanId: loan.id,
          borrowerId: input.borrowerId,
          weekNumber: payable.weekNumber,
          dueDate: payable.dueDate,
          status: 'MISSED' as const,
          amountPesewas: Math.round(Number(payable.installmentAmount) * 100),
          remainingBalancePesewas: loan.outstandingPesewas,
          weeksRemaining,
        };
      }

      await scheduleRepo.markWeekMissed({
        loanId: loan.id,
        weekNumber: payable.weekNumber,
        expectedVersion: payable.version,
      });

      appendAuditEntry({
        action: 'payment.missed_marked',
        actorId,
        targetEntityId: loan.id,
        targetEntityType: 'loan',
      });

      const weeksAfter = await scheduleRepo.listScheduleWeeks(loan.id);
      const weeksRemaining = weeksAfter.filter(
        (week) => week.status === 'PENDING' || week.status === 'MISSED',
      ).length;
      const amountPesewas = Math.round(Number(payable.installmentAmount) * 100);

      const borrower = await borrowerRepo.getBorrower(input.borrowerId);
      if (borrower) {
        void emitPaymentMissedNotification({
          borrowerId: borrower.id,
          borrowerName: borrower.fullName,
          borrowerPhone: borrower.phone,
          borrowerEmail: borrower.profile?.email,
          loanId: loan.id,
          loanDisplayId: loan.displayId ?? loan.id,
          dueDate: payable.dueDate,
          amountPesewas,
          remainingBalancePesewas: loan.outstandingPesewas,
          weeksRemaining,
          collectorUserId: input.collectorId,
        });
      }

      return {
        loanId: loan.id,
        borrowerId: input.borrowerId,
        weekNumber: payable.weekNumber,
        dueDate: payable.dueDate,
        status: 'MISSED' as const,
        amountPesewas,
        remainingBalancePesewas: loan.outstandingPesewas,
        weeksRemaining,
      };
    },
  });
}

export async function getPaymentById(paymentId: string) {
  requireDatabase();
  const payment = await paymentRepo.findPaymentById(paymentId);
  if (!payment || payment.status === 'REVERSED') {
    throw new Error('NOT_FOUND');
  }

  const recordedAt = payment.recordedAt.toISOString();
  const gpsRaw = (payment.gps ?? null) as
    | { latitude?: number; longitude?: number; lat?: number; lng?: number; accuracyMeters?: number }
    | null;

  return {
    id: payment.id,
    displayId: formatPaymentDisplayId({ recordedAt }),
    borrowerId: payment.borrowerId,
    collectorId: payment.collectorUserId,
    amountPesewas: payment.amountPesewas,
    paymentDate: payment.paymentDate,
    recordedAt,
    status: payment.status,
    gps:
      gpsRaw && (gpsRaw.latitude != null || gpsRaw.lat != null)
        ? {
            latitude: Number(gpsRaw.latitude ?? gpsRaw.lat),
            longitude: Number(gpsRaw.longitude ?? gpsRaw.lng),
            accuracyMeters:
              gpsRaw.accuracyMeters != null ? Number(gpsRaw.accuracyMeters) : undefined,
          }
        : undefined,
  };
}

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for payment operations.');
  }
}
