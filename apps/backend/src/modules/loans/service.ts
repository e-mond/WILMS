import { isDatabaseEnabled, runInTransaction, getDb } from '../../db/client.js';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { and, eq, isNull } from 'drizzle-orm';
import {
  assertDivisibleLoanAmount,
  calculateWeeklyPaymentPesewas,
} from '../../domain/loan/calculations.js';
import {
  LOAN_LIFECYCLE,
  assertLifecycleTransition,
} from '../../domain/loan/lifecycle.js';
import {
  calculateLoanProgress,
  mapLoanRowToDetail,
  mapScheduleRow,
  sumRepaymentLedgerAmounts,
  type LoanDetailDto,
} from '../../domain/loan/mappers.js';
import { generateLoanScheduleWeeks } from '../../domain/loan/schedule.js';
import { isValidPaymentDay } from '../../domain/loan/payment-day.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { notifyLoanDisbursed, notifyLoanApproved, notifyLoanRejected } from '../../infrastructure/notifications/event-dispatch.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import * as disbursementRepo from '../../repositories/loan-disbursement.repository.js';
import * as ledgerRepo from '../../repositories/ledger.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';
import { groups } from '../../db/schema/groups.js';
import { getSettings } from '../settings/service.js';
import { decimalToPesewas } from '../../domain/money.js';

async function resolveCollectorUserIdForBorrower(borrowerId: string): Promise<string | undefined> {
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

async function resolveLoanPoolIdForBorrower(
  borrowerId: string,
  preferredPoolId?: string,
): Promise<string | undefined> {
  const borrower = await borrowerRepo.getBorrower(borrowerId);

  if (preferredPoolId) {
    const pool = await poolRepo.findPoolById(preferredPoolId);
    if (!pool) {
      throw new Error('VALIDATION:Selected loan pool was not found.');
    }

    if (borrower?.groupId) {
      const existingPoolId = await poolRepo.findPoolIdForGroup(borrower.groupId);
      if (existingPoolId && existingPoolId !== preferredPoolId) {
        throw new Error(
          "VALIDATION:This borrower's group is already assigned to a different loan pool.",
        );
      }
      if (!existingPoolId) {
        await poolRepo.insertMembership({
          poolId: preferredPoolId,
          groupId: borrower.groupId,
        });
      }
    }

    return preferredPoolId;
  }

  if (borrower?.groupId) {
    const fromMembership = await poolRepo.findPoolIdForGroup(borrower.groupId);
    if (fromMembership) {
      return fromMembership;
    }
  }

  const pools = await poolRepo.listPools();
  if (pools.length === 1) {
    const onlyPoolId = pools[0]!.id;
    if (borrower?.groupId) {
      await poolRepo.insertMembership({
        poolId: onlyPoolId,
        groupId: borrower.groupId,
      });
    }
    return onlyPoolId;
  }

  return undefined;
}

export interface CreateLoanBody {
  borrowerId: string;
  amountPesewas: number;
  durationWeeks: number;
  paymentDay: string;
  cycleBatch: string;
  startDate: string;
  loanPoolId?: string;
}

function mapServiceError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.startsWith('NOT_FOUND')) {
      throw new Error('NOT_FOUND');
    }
    if (error.message.startsWith('VALIDATION')) {
      // Preserve detailed validation copy for HTTP mapping.
      throw error;
    }
    if (error.message.startsWith('CONFLICT')) {
      throw new Error('CONFLICT');
    }
    if (error.message === 'IDEMPOTENCY_IN_PROGRESS') {
      throw new Error('IDEMPOTENCY_IN_PROGRESS');
    }
  }
  throw error;
}

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for loan operations.');
  }
}

async function getBorrowerName(borrowerId: string): Promise<string> {
  const borrower = await borrowerRepo.getBorrower(borrowerId);
  return borrower?.fullName ?? 'Unknown borrower';
}

export async function listLoans(status?: string): Promise<LoanDetailDto[]> {
  requireDatabase();
  const rows = await loanRepo.listLoans(status ? { externalStatus: status } : undefined);
  const batchCounters = new Map<string, number>();

  return rows.map((row) => {
    const nextSequence = (batchCounters.get(row.cycleBatch) ?? 0) + 1;
    batchCounters.set(row.cycleBatch, nextSequence);
    return mapLoanRowToDetail(row, nextSequence);
  });
}

export async function getLoan(id: string): Promise<LoanDetailDto> {
  requireDatabase();
  const row = await loanRepo.findLoanById(id);
  if (!row) {
    throw new Error('NOT_FOUND');
  }
  return mapLoanRowToDetail(row, 1);
}

export async function createLoan(input: CreateLoanBody, actorId: string): Promise<LoanDetailDto> {
  requireDatabase();
  assertDivisibleLoanAmount(input.amountPesewas, input.durationWeeks);

  const borrower = await borrowerRepo.getBorrower(input.borrowerId);
  if (!borrower) {
    throw new Error('NOT_FOUND');
  }
  if (borrower.status !== BORROWER_STATUS.APPROVED) {
    throw new Error('VALIDATION:Loans can only be created for approved borrowers.');
  }
  if (await loanRepo.borrowerHasOpenLoan(input.borrowerId)) {
    throw new Error('VALIDATION:This borrower already has an active or pending loan.');
  }

  if (!isValidPaymentDay(input.paymentDay)) {
    throw new Error('VALIDATION:Payment day must be a valid weekday (Sunday through Saturday).');
  }

  const weeklyPaymentPesewas = calculateWeeklyPaymentPesewas(
    input.amountPesewas,
    input.durationWeeks,
  );

  const { listHolidays } = await import('../organization-holidays/service.js');
  const holidays = await listHolidays();

  const scheduleWeeks = generateLoanScheduleWeeks({
    durationWeeks: input.durationWeeks,
    weeklyPaymentPesewas,
    startDate: input.startDate,
    paymentDay: input.paymentDay,
    holidayDates: holidays.map((holiday) => holiday.holidayDate),
  });

  try {
    const loanPoolId = await resolveLoanPoolIdForBorrower(input.borrowerId, input.loanPoolId);
    if (!loanPoolId) {
      const pools = await poolRepo.listPools();
      if (pools.length > 0) {
        throw new Error(
          'VALIDATION:Select a funding pool for this loan so pool utilisation can be tracked.',
        );
      }
    }

    const loan = await runInTransaction(async (tx) => {
      const row = await loanRepo.insertLoan(
        {
          borrowerId: input.borrowerId,
          amountPesewas: input.amountPesewas,
          durationWeeks: input.durationWeeks,
          weeklyPaymentPesewas,
          paymentDay: input.paymentDay,
          startDate: input.startDate,
          cycleBatch: input.cycleBatch,
          createdByUserId: actorId,
          loanPoolId,
        },
        tx,
      );

      await scheduleRepo.insertScheduleWeeks(row.id, scheduleWeeks, tx);
      await ledgerRepo.appendLedgerEntry(
        {
          entryType: 'INTEREST_CHARGE',
          loanId: row.id,
          borrowerId: input.borrowerId,
          amountDecimal: '0.00',
          description: 'Loan created pending disbursement',
          actorUserId: actorId,
        },
        tx,
      );

      return row;
    });

    appendAuditEntry({
      action: 'loan.created',
      actorId,
      targetEntityId: loan.id,
      targetEntityType: 'loan',
    });

    return mapLoanRowToDetail(loan);
  } catch (error) {
    mapServiceError(error);
  }
}

export async function approveLoan(loanId: string, actorId: string): Promise<LoanDetailDto> {
  requireDatabase();
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  if (loan.lifecycleStatus === LOAN_LIFECYCLE.PENDING_DISBURSEMENT) {
    return mapLoanRowToDetail(loan);
  }

  if (loan.lifecycleStatus === LOAN_LIFECYCLE.PENDING_APPROVAL) {
    assertLifecycleTransition(loan.lifecycleStatus, LOAN_LIFECYCLE.APPROVED);
  } else if (loan.lifecycleStatus === LOAN_LIFECYCLE.DRAFT) {
    assertLifecycleTransition(loan.lifecycleStatus, LOAN_LIFECYCLE.PENDING_APPROVAL);
    assertLifecycleTransition(LOAN_LIFECYCLE.PENDING_APPROVAL, LOAN_LIFECYCLE.APPROVED);
  } else {
    throw new Error(`VALIDATION:Loan cannot be approved from status ${loan.lifecycleStatus}.`);
  }

  const updated = await runInTransaction(async (tx) => {
    const approved = await loanRepo.updateLoanLifecycle(
      {
        loanId,
        expectedVersion: loan.version,
        lifecycleStatus: LOAN_LIFECYCLE.PENDING_DISBURSEMENT,
        approvedByUserId: actorId,
      },
      tx,
    );

    await ledgerRepo.appendLedgerEntry(
      {
        entryType: 'INTEREST_CHARGE',
        loanId,
        borrowerId: loan.borrowerId,
        amountDecimal: '0.00',
        description: 'Loan approved',
        actorUserId: actorId,
      },
      tx,
    );

    return approved;
  });

  appendAuditEntry({
    action: 'loan.approved',
    actorId,
    targetEntityId: loanId,
    targetEntityType: 'loan',
  });

  const dto = mapLoanRowToDetail(updated);
  const borrower = await borrowerRepo.getBorrower(loan.borrowerId);
  if (borrower) {
    void notifyLoanApproved({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile?.email,
      amountPesewas: Math.round(Number(loan.principalAmount) * 100),
      loanId,
      loanDisplayId: dto.displayId ?? loanId,
    });
  }

  return dto;
}

export async function rejectLoan(
  loanId: string,
  reason: string,
  actorId: string,
): Promise<LoanDetailDto> {
  requireDatabase();
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  assertLifecycleTransition(loan.lifecycleStatus as never, LOAN_LIFECYCLE.REJECTED);

  const updated = await loanRepo.updateLoanLifecycle({
    loanId,
    expectedVersion: loan.version,
    lifecycleStatus: LOAN_LIFECYCLE.REJECTED,
    rejectionReason: reason.trim(),
    approvedByUserId: actorId,
  });

  appendAuditEntry({
    action: 'loan.rejected',
    actorId,
    targetEntityId: loanId,
    targetEntityType: 'loan',
    reason: reason.trim(),
  });

  const dto = mapLoanRowToDetail(updated);
  const borrower = await borrowerRepo.getBorrower(loan.borrowerId);
  if (borrower) {
    void notifyLoanRejected({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile?.email,
      loanId,
      loanDisplayId: dto.displayId ?? loanId,
      reason: reason.trim(),
    });
  }

  return dto;
}

export async function disburseLoan(
  loanId: string,
  actorId: string,
  idempotencyKey?: string,
): Promise<LoanDetailDto> {
  requireDatabase();

  return runWithIdempotency({
    scope: 'LOAN_DISBURSE',
    actorUserId: actorId,
    idempotencyKey,
    responseStatus: 200,
    execute: async () => {
      const loan = await loanRepo.findLoanById(loanId);
      if (!loan) {
        throw new Error('NOT_FOUND');
      }
      if (loan.externalStatus !== 'PENDING_DISBURSEMENT') {
        throw new Error('VALIDATION:Only loans pending disbursement can be disbursed.');
      }

      const amountDecimal = loan.principalAmount;

      const updated = await runInTransaction(async (tx) => {
        const resolvedPoolId =
          loan.loanPoolId ?? (await resolveLoanPoolIdForBorrower(loan.borrowerId));

        if (!resolvedPoolId) {
          const pools = await poolRepo.listPools(tx);
          if (pools.length > 0) {
            throw new Error(
              'VALIDATION:This loan is not linked to a funding pool. Assign the borrower group to a pool, then disburse again.',
            );
          }
        }

        const disbursed = await loanRepo.updateLoanLifecycle(
          {
            loanId,
            expectedVersion: loan.version,
            lifecycleStatus: LOAN_LIFECYCLE.DISBURSED,
            disbursedAmount: amountDecimal,
            disbursedByUserId: actorId,
            loanPoolId: resolvedPoolId ?? undefined,
          },
          tx,
        );

        const active = await loanRepo.updateLoanLifecycle(
          {
            loanId,
            expectedVersion: disbursed.version,
            lifecycleStatus: LOAN_LIFECYCLE.ACTIVE,
          },
          tx,
        );

        await disbursementRepo.insertDisbursement(
          {
            loanId,
            amountDecimal,
            disbursedByUserId: actorId,
          },
          tx,
        );

        await ledgerRepo.appendLedgerEntry(
          {
            entryType: 'LOAN_DISBURSEMENT',
            loanId,
            borrowerId: loan.borrowerId,
            amountDecimal,
            description: 'Loan disbursed',
            actorUserId: actorId,
          },
          tx,
        );

        if (resolvedPoolId) {
          const amountPesewas = decimalToPesewas(amountDecimal);
          const hasAllocation = await poolRepo.hasAllocationForLoan(
            resolvedPoolId,
            loanId,
            'DISBURSEMENT',
            tx,
          );

          if (!hasAllocation) {
            await poolRepo.appendAllocation(
              {
                poolId: resolvedPoolId,
                allocationType: 'DISBURSEMENT',
                amountPesewas,
                loanId,
                borrowerId: loan.borrowerId,
                description: `Loan disbursement for ${loanId.slice(-8)}`,
                actorUserId: actorId,
              },
              tx,
            );
          }

          await poolRepo.refreshPoolAggregates(resolvedPoolId, tx);
        }

        return active;
      });

      const dto = mapLoanRowToDetail(updated);

      appendAuditEntry({
        action: 'loan.disbursed',
        actorId,
        targetEntityId: loanId,
        targetEntityType: 'loan',
      });

      const borrower = await borrowerRepo.getBorrower(loan.borrowerId);
      if (borrower) {
        const amountPesewas = Math.round(Number(amountDecimal) * 100);
        const collectorUserId = await resolveCollectorUserIdForBorrower(loan.borrowerId);
        void notifyLoanDisbursed({
          borrowerId: borrower.id,
          borrowerName: borrower.fullName,
          borrowerPhone: borrower.phone,
          borrowerEmail: borrower.profile?.email,
          loanId,
          loanDisplayId: dto.displayId ?? loanId,
          amountPesewas,
          collectorUserId,
        });
      }

      return dto;
    },
  });
}

export async function getLoanSchedule(loanId: string, referenceDate?: string) {
  requireDatabase();
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const ref = referenceDate ?? new Date().toISOString().slice(0, 10);
  const settings = await getSettings();
  await scheduleRepo.applyMissedWeekMarking(loanId, ref, settings.latePaymentGraceDays);
  const weeks = await scheduleRepo.listScheduleWeeks(loanId);

  if (!weeks.length) {
    throw new Error('NOT_FOUND');
  }

  return {
    loanId,
    weeks: weeks.map(mapScheduleRow),
  };
}

export async function getLoanProgress(loanId: string, referenceDate?: string) {
  requireDatabase();
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const schedule = await getLoanSchedule(loanId, referenceDate);
  const ledger = await ledgerRepo.listLedgerForLoan(loanId);
  const totalPaidPesewas = sumRepaymentLedgerAmounts(ledger);

  return calculateLoanProgress({
    loanId,
    amountPesewas: mapLoanRowToDetail(loan).amountPesewas,
    scheduleWeeks: schedule.weeks,
    totalPaidPesewas,
    referenceDate,
  });
}

export async function listLoanPaymentLog(loanId: string) {
  requireDatabase();
  const loan = await loanRepo.findLoanById(loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const disbursement = await disbursementRepo.findDisbursementByLoan(loanId);
  const ledger = await ledgerRepo.listLedgerForLoan(loanId);
  const payments = ledger.filter((row) => row.entryType === 'REPAYMENT');

  const entries = [];

  if (disbursement) {
    entries.push({
      id: disbursement.id,
      displayId: disbursement.displayId,
      type: 'DISBURSEMENT' as const,
      amountPesewas: Math.round(Number(disbursement.disbursedAmount) * 100),
      recordedAt: disbursement.disbursedAt.toISOString(),
      collectorId: disbursement.disbursedByUserId,
      paymentStatus: 'CONFIRMED' as const,
    });
  }

  for (const payment of payments) {
    entries.push({
      id: payment.id,
      type: 'REPAYMENT' as const,
      amountPesewas: Math.round(Number(payment.amount) * 100),
      recordedAt: payment.recordedAt.toISOString(),
      collectorId: payment.actorUserId ?? '',
      weekNumber: (payment.metadata as { weekNumber?: number } | null)?.weekNumber,
      paymentStatus: 'CONFIRMED' as const,
      gpsVerified: true,
    });
  }

  return entries.sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

export async function listPortfolioEntries() {
  requireDatabase();
  const rows = await loanRepo.listLoans();
  const borrowerIds = [...new Set(rows.map((row) => row.borrowerId))];
  const borrowerRecords = await borrowerRepo.getBorrowersByIds(borrowerIds);
  const borrowerById = new Map(
    borrowerRecords
      .filter((record): record is NonNullable<typeof record> => Boolean(record))
      .map((record) => [record.id, record]),
  );

  const batchCounters = new Map<string, number>();
  const entries = rows.map((row) => {
    const nextSequence = (batchCounters.get(row.cycleBatch) ?? 0) + 1;
    batchCounters.set(row.cycleBatch, nextSequence);
    const detail = mapLoanRowToDetail(row, nextSequence);
    const borrower = borrowerById.get(row.borrowerId);
    return {
      id: detail.id,
      displayId: detail.displayId,
      borrowerId: detail.borrowerId,
      borrowerName: borrower?.fullName ?? 'Unknown borrower',
      community: borrower?.community ?? '—',
      groupName: borrower?.groupName ?? '—',
      amountPesewas: detail.amountPesewas,
      outstandingPesewas: detail.outstandingPesewas,
      weeklyPaymentPesewas: detail.weeklyPaymentPesewas,
      durationWeeks: detail.durationWeeks,
      status: detail.status,
      cycleBatch: detail.cycleBatch,
      paymentDay: detail.paymentDay,
      startDate: detail.startDate,
    };
  });

  return entries.sort((left, right) => left.borrowerName.localeCompare(right.borrowerName));
}

export async function listBorrowerLoans(borrowerId: string) {
  requireDatabase();
  const rows = await loanRepo.listBorrowerLoans(borrowerId);
  return rows.map((row) => {
    const detail = mapLoanRowToDetail(row);
    return {
      id: detail.id,
      displayId: detail.displayId,
      amountPesewas: detail.amountPesewas,
      outstandingPesewas: detail.outstandingPesewas,
      weeklyPaymentPesewas: detail.weeklyPaymentPesewas,
      durationWeeks: detail.durationWeeks,
      status: detail.status,
      cycleBatch: detail.cycleBatch,
      startDate: detail.startDate,
    };
  });
}

export async function listEligibleBorrowers() {
  requireDatabase();
  const borrowers = await borrowerRepo.listBorrowers();
  const eligible = [];

  for (const borrower of borrowers) {
    if (borrower.status !== BORROWER_STATUS.APPROVED) {
      continue;
    }
    if (await loanRepo.borrowerHasOpenLoan(borrower.id)) {
      continue;
    }
    eligible.push({
      id: borrower.id,
      fullName: borrower.fullName,
      phone: borrower.phone,
      community: borrower.community,
      groupName: borrower.groupName,
    });
  }

  return eligible.sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export async function getDisbursementEligibility(borrowerId: string) {
  requireDatabase();
  const borrower = await borrowerRepo.getBorrower(borrowerId);
  if (!borrower) {
    return { borrowerId, canDisburse: false, reason: 'Borrower not found.' };
  }

  const pendingLoan = (await loanRepo.listBorrowerLoans(borrowerId)).find(
    (row) => row.externalStatus === 'PENDING_DISBURSEMENT',
  );

  if (!pendingLoan) {
    return {
      borrowerId,
      canDisburse: false,
      reason: 'No loan pending disbursement for this borrower.',
    };
  }

  return { borrowerId, canDisburse: true };
}
