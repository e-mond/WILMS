import { z } from 'zod';
import { formatPaymentDisplayId } from '@wilms/shared-utils';
import { isDatabaseEnabled, runInTransaction } from '../../db/client.js';
import {
  applyPaymentToSchedule,
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
import { notifyLoanFullyPaid } from '../../infrastructure/notifications/event-dispatch.js';
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
  gps: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracyMeters: z.number().optional(),
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
      loanId: '',
      paymentDay: '',
      weeklyPaymentPesewas: 0,
      referenceDate: ref,
      isPaymentDay: false,
      requiredAmountPesewas: 0,
      obligationWeeks: [],
      totalOutstandingObligationsPesewas: 0,
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

  const obligationWeeks = scheduleWeeks
    .filter((week) => week.status !== 'PAID')
    .filter((week) => week.status === 'MISSED' || (week.status === 'PENDING' && week.dueDate <= ref))
    .map((week) => ({
      weekNumber: week.weekNumber,
      dueDate: week.dueDate,
      amountPesewas: week.amountPesewas,
      status: week.status,
    }));

  const blockReason = validatePaymentSubmission({
    amountPesewas: loan.weeklyPaymentPesewas,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    paymentDay: loan.paymentDay,
    referenceDate: ref,
    scheduleWeeks,
  });

  const isPaymentDay = !blockReason?.includes('assigned payment day');

  return {
    borrowerId,
    borrowerName: borrower.fullName,
    phone: borrower.phone,
    community: borrower.community,
    loanId: loan.id,
    paymentDay: loan.paymentDay,
    weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    referenceDate: ref,
    isPaymentDay,
    requiredAmountPesewas: loan.weeklyPaymentPesewas,
    oldestObligation: obligationWeeks[0],
    obligationWeeks,
    totalOutstandingObligationsPesewas: obligationWeeks.reduce(
      (sum, week) => sum + week.amountPesewas,
      0,
    ),
    canAcceptPayment: !blockReason,
    blockReason,
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

async function postPayment(
  input: z.infer<typeof recordPaymentSchema>,
  actorId: string,
) {
  if (
    !input.gps ||
    typeof input.gps.latitude !== 'number' ||
    typeof input.gps.longitude !== 'number' ||
    !Number.isFinite(input.gps.latitude) ||
    !Number.isFinite(input.gps.longitude)
  ) {
    throw new Error('VALIDATION:GPS coordinates are required to record a collection.');
  }

  const duplicate = await paymentRepo.findDuplicatePayment({
    borrowerId: input.borrowerId,
    paymentDate: input.paymentDate,
    amountPesewas: input.amountPesewas,
  });
  if (duplicate) {
    throw new Error('DUPLICATE');
  }

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
  });

  if (validationError) {
    throw new Error(`VALIDATION:${validationError}`);
  }

  const allocation = applyPaymentToSchedule(scheduleWeeks, input.paymentDate);
  const weekNumber = allocation.weekNumber;
  if (!weekNumber) {
    throw new Error('VALIDATION:No payable obligation found.');
  }

  const weekRow = scheduleRows.find((row) => row.weekNumber === weekNumber);
  if (!weekRow) {
    throw new Error('NOT_FOUND');
  }

  const newBalancePesewas = Math.max(loan.outstandingPesewas - input.amountPesewas, 0);
  const amountDecimal = pesewasToDecimal(input.amountPesewas);

  const result = await runInTransaction(async (tx) => {
    const payment = await paymentRepo.appendPayment(
      {
        id: paymentRepo.nextPaymentId(),
        borrowerId: input.borrowerId,
        collectorId: input.collectorId,
        amountPesewas: input.amountPesewas,
        paymentDate: input.paymentDate,
        recordedAt: new Date().toISOString(),
        gps: input.gps,
        loanId: loan.id,
        scheduleWeekNumber: weekNumber,
      },
      tx,
    );

    await scheduleRepo.markWeekPaid(
      {
        loanId: loan.id,
        weekNumber,
        expectedVersion: weekRow.version,
      },
      tx,
    );

    const lifecycleStatus =
      newBalancePesewas === 0 ? LOAN_LIFECYCLE.COMPLETED : LOAN_LIFECYCLE.ACTIVE;

    await loanRepo.updateLoanLifecycle(
      {
        loanId: loan.id,
        expectedVersion: activeLoan.version,
        lifecycleStatus,
        loanBalance: pesewasToDecimal(newBalancePesewas),
      },
      tx,
    );

    await ledgerRepo.appendLedgerEntry(
      {
        entryType: 'REPAYMENT',
        loanId: loan.id,
        borrowerId: input.borrowerId,
        paymentId: payment.id,
        amountDecimal,
        description: `Repayment week ${weekNumber}`,
        actorUserId: actorId,
        metadata: { weekNumber },
      },
      tx,
    );

    if (activeLoan.loanPoolId) {
      await poolRepo.appendAllocation(
        {
          poolId: activeLoan.loanPoolId,
          allocationType: 'REPAYMENT',
          amountPesewas: input.amountPesewas,
          loanId: loan.id,
          borrowerId: input.borrowerId,
          paymentId: payment.id,
          description: `Repayment week ${weekNumber}`,
          actorUserId: actorId,
        },
        tx,
      );
      await poolRepo.refreshPoolAggregates(activeLoan.loanPoolId, tx);
    }

    return payment;
  });

  appendAuditEntry({
    action: 'payment.recorded',
    actorId,
    targetEntityId: result.id,
    targetEntityType: 'payment',
  });

  const borrower = await borrowerRepo.getBorrower(input.borrowerId);
  if (borrower) {
    const nextDueDate = await resolveNextDueDate(loan.id);
    const weeksRemaining = await resolveWeeksRemaining(loan.id);
    void emitPaymentConfirmedNotification({
      paymentId: result.id,
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile?.email,
      amountPesewas: input.amountPesewas,
      paymentDate: input.paymentDate,
      loanDisplayId: loan.displayId ?? loan.id,
      loanId: loan.id,
      outstandingBalancePesewas: newBalancePesewas,
      weeksRemaining,
      nextDueDate,
      collectorUserId: input.collectorId,
    });

    if (newBalancePesewas === 0) {
      void notifyLoanFullyPaid({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        borrowerPhone: borrower.phone,
        borrowerEmail: borrower.profile?.email,
        loanId: loan.id,
        loanDisplayId: loan.displayId ?? loan.id,
        totalPaidPesewas: loan.amountPesewas,
        collectorUserId: input.collectorId,
      });
    }
  }

  return {
    id: result.id,
    displayId: formatPaymentDisplayId({ recordedAt: result.recordedAt }),
    borrowerId: result.borrowerId,
    collectorId: result.collectorId,
    loanId: loan.id,
    amountPesewas: result.amountPesewas,
    paymentDate: result.paymentDate,
    recordedAt: result.recordedAt,
    status: 'CONFIRMED',
    gps: result.gps,
    weekNumber,
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
