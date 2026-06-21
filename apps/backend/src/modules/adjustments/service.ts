/**
 * P14.3B Phase 2 — Financial adjustments service.
 *
 * Transaction boundary: create / approve / reject each run inside runInTransaction.
 * Approve atomically: history + ledger + loan balance + pool allocation + adjustment row.
 * Audit entries are best-effort async (P14.3A pattern) after commit.
 */
import { z } from 'zod';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { isDatabaseEnabled, runInTransaction } from '../../db/client.js';
import { computeBalanceEffect } from '../../domain/adjustment/balance-effect.js';
import {
  buildAdjustmentListResponse,
  buildPendingListResponse,
  mapAdjustmentRowToDetail,
  mapAdjustmentRowToRequest,
} from '../../domain/adjustment/mappers.js';
import {
  ADJUSTMENT_STATUS,
  ADJUSTMENT_TYPE,
  type AdjustmentType,
} from '../../domain/adjustment/types.js';
import { LOAN_LIFECYCLE } from '../../domain/loan/lifecycle.js';
import { decimalToPesewas, pesewasToDecimal } from '../../domain/money.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as adjustmentHistoryRepo from '../../repositories/adjustment-history.repository.js';
import * as adjustmentRepo from '../../repositories/adjustment.repository.js';
import * as borrowerRepo from '../../repositories/borrower.repository.js';
import * as ledgerRepo from '../../repositories/ledger.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as poolRepo from '../../repositories/loan-pool.repository.js';

const AUDIT_ACTION = {
  ADJUSTMENT_REQUESTED: 'adjustment.requested',
  ADJUSTMENT_APPROVED: 'adjustment.approved',
  ADJUSTMENT_REJECTED: 'adjustment.rejected',
} as const;

export const createAdjustmentSchema = z.object({
  type: z.enum([
    ADJUSTMENT_TYPE.PAYMENT_CORRECTION,
    ADJUSTMENT_TYPE.DISBURSEMENT_CORRECTION,
    ADJUSTMENT_TYPE.WRITE_OFF,
    ADJUSTMENT_TYPE.BALANCE_ADJUSTMENT,
  ]),
  borrowerId: z.string().min(1),
  borrowerName: z.string().min(1),
  loanId: z.string().optional(),
  amountPesewas: z.number().int().positive(),
  reason: z.string().min(10),
  reasonCode: z.string().optional(),
  actorId: z.string().min(1),
  actorDisplayName: z.string().min(1),
});

export const rejectAdjustmentSchema = z.object({
  reason: z.string().min(1),
  actorId: z.string().min(1),
  actorDisplayName: z.string().min(1),
});

export const reviewActorSchema = z.object({
  actorId: z.string().min(1),
  actorDisplayName: z.string().min(1),
});

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for adjustment operations.');
  }
}

async function resolveLoanForAdjustment(
  borrowerId: string,
  loanId: string | undefined,
  type: AdjustmentType,
) {
  if (loanId) {
    const loan = await loanRepo.findLoanById(loanId);
    if (!loan || loan.borrowerId !== borrowerId) {
      throw new Error('VALIDATION:Loan does not belong to the specified borrower.');
    }
    return loan;
  }

  if (type === ADJUSTMENT_TYPE.WRITE_OFF || type === ADJUSTMENT_TYPE.BALANCE_ADJUSTMENT) {
    throw new Error('VALIDATION:A loan is required for this adjustment type.');
  }

  const loans = await loanRepo.listBorrowerLoans(borrowerId);
  return loans.find((row) => row.externalStatus === 'ACTIVE');
}

/**
 * Creates a pending adjustment request and records CREATED history + audit.
 */
export async function createAdjustment(
  input: z.infer<typeof createAdjustmentSchema>,
  idempotencyKey?: string,
) {
  requireDatabase();

  return runWithIdempotency({
    scope: 'ADJUSTMENT_CREATE',
    actorUserId: input.actorId,
    idempotencyKey,
    responseStatus: 201,
    execute: async () => {
      const borrower = await borrowerRepo.getBorrower(input.borrowerId);
      if (!borrower) {
        throw new Error('NOT_FOUND');
      }

      await resolveLoanForAdjustment(input.borrowerId, input.loanId, input.type);

      const requestedAt = new Date();
      const row = await runInTransaction(async (tx) => {
        const created = await adjustmentRepo.insertAdjustment(
          {
            type: input.type,
            borrowerId: input.borrowerId,
            borrowerName: input.borrowerName.trim(),
            loanId: input.loanId,
            amountPesewas: input.amountPesewas,
            reason: input.reason.trim(),
            reasonCode: input.reasonCode,
            requestedByUserId: input.actorId,
            requestedByDisplayName: input.actorDisplayName.trim(),
            requestedAt,
          },
          tx,
        );

        await adjustmentHistoryRepo.appendAdjustmentHistory(
          {
            adjustmentId: created.id,
            eventType: 'CREATED',
            actorUserId: input.actorId,
            actorDisplayName: input.actorDisplayName.trim(),
            reason: input.reason.trim(),
            recordedAt: requestedAt,
          },
          tx,
        );

        return created;
      });

      appendAuditEntry({
        action: AUDIT_ACTION.ADJUSTMENT_REQUESTED,
        actorId: input.actorId,
        actorDisplayName: input.actorDisplayName,
        targetEntityId: row.id,
        targetEntityType: 'adjustment',
        reason: input.reason.trim(),
      });

      return mapAdjustmentRowToRequest(row);
    },
  });
}

export async function listPendingAdjustments() {
  requireDatabase();
  const rows = await adjustmentRepo.listAdjustmentsByStatus(ADJUSTMENT_STATUS.PENDING);
  return buildPendingListResponse(rows);
}

export async function listAdjustments() {
  requireDatabase();
  const rows = await adjustmentRepo.listAllAdjustments();
  return buildAdjustmentListResponse(rows);
}

export async function getAdjustment(id: string) {
  requireDatabase();
  const row = await adjustmentRepo.findAdjustmentById(id);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  return mapAdjustmentRowToDetail(row);
}

/**
 * Approves a pending adjustment inside a single transaction:
 * ledger entry, loan balance update, optional write-off side effects, pool allocation, history.
 */
export async function approveAdjustment(
  id: string,
  actorId: string,
  actorDisplayName: string,
  idempotencyKey?: string,
) {
  requireDatabase();

  return runWithIdempotency({
    scope: 'ADJUSTMENT_APPROVE',
    actorUserId: actorId,
    idempotencyKey,
    responseStatus: 200,
    execute: async () => {
      const pending = await adjustmentRepo.findAdjustmentById(id);
      if (!pending) {
        throw new Error('NOT_FOUND');
      }
      if (pending.status !== ADJUSTMENT_STATUS.PENDING) {
        throw new Error('VALIDATION:Only pending adjustments can be reviewed.');
      }

      const loan = await resolveLoanForAdjustment(
        pending.borrowerId,
        pending.loanId ?? undefined,
        pending.type,
      );

      if (!loan && pending.type !== ADJUSTMENT_TYPE.WRITE_OFF) {
        throw new Error('VALIDATION:No eligible loan found for adjustment.');
      }

      const currentBalancePesewas = loan ? decimalToPesewas(loan.loanBalance) : 0;
      const effect = computeBalanceEffect(pending.type, pending.amountPesewas, currentBalancePesewas);

      const updated = await runInTransaction(async (tx) => {
        const approved = await adjustmentRepo.approveAdjustmentRow(
          {
            adjustmentId: id,
            expectedVersion: pending.version,
            reviewedByUserId: actorId,
            beforeBalancePesewas: effect.beforeBalancePesewas,
            afterBalancePesewas: effect.afterBalancePesewas,
            deltaPesewas: effect.deltaPesewas,
          },
          tx,
        );

        if (loan) {
          const lifecycleStatus =
            pending.type === ADJUSTMENT_TYPE.WRITE_OFF
              ? LOAN_LIFECYCLE.WRITTEN_OFF
              : effect.afterBalancePesewas === 0
                ? LOAN_LIFECYCLE.COMPLETED
                : LOAN_LIFECYCLE.ACTIVE;

          await loanRepo.updateLoanLifecycle(
            {
              loanId: loan.id,
              expectedVersion: loan.version,
              lifecycleStatus,
              loanBalance: pesewasToDecimal(effect.afterBalancePesewas),
            },
            tx,
          );

          const ledgerAmount =
            pending.type === ADJUSTMENT_TYPE.WRITE_OFF
              ? pesewasToDecimal(effect.beforeBalancePesewas)
              : pesewasToDecimal(Math.abs(effect.deltaPesewas));

          await ledgerRepo.appendLedgerEntry(
            {
              entryType: 'ADJUSTMENT',
              loanId: loan.id,
              borrowerId: pending.borrowerId,
              amountDecimal: ledgerAmount,
              description: `Adjustment approved: ${pending.type}`,
              actorUserId: actorId,
              metadata: {
                adjustmentId: id,
                adjustmentType: pending.type,
                beforeBalancePesewas: effect.beforeBalancePesewas,
                afterBalancePesewas: effect.afterBalancePesewas,
                deltaPesewas: effect.deltaPesewas,
              },
            },
            tx,
          );

          if (loan.loanPoolId && effect.deltaPesewas !== 0) {
            await poolRepo.appendAllocation(
              {
                poolId: loan.loanPoolId,
                allocationType: 'ADJUSTMENT',
                amountPesewas: Math.abs(effect.deltaPesewas),
                loanId: loan.id,
                borrowerId: pending.borrowerId,
                description: `Pool adjustment: ${pending.type}`,
                actorUserId: actorId,
              },
              tx,
            );
          }
        }

        if (pending.type === ADJUSTMENT_TYPE.WRITE_OFF) {
          const borrower = await borrowerRepo.getBorrower(pending.borrowerId);
          if (borrower) {
            borrower.status = BORROWER_STATUS.BLACKLISTED;
            borrower.rejectionReason = pending.reason;
            await borrowerRepo.saveBorrower(borrower, tx);
          }
        }

        await adjustmentHistoryRepo.appendAdjustmentHistory(
          {
            adjustmentId: id,
            eventType: 'APPROVED',
            actorUserId: actorId,
            actorDisplayName: actorDisplayName.trim(),
            reason: pending.reason,
            beforeValuePesewas: effect.beforeBalancePesewas,
            afterValuePesewas: effect.afterBalancePesewas,
            deltaPesewas: effect.deltaPesewas,
          },
          tx,
        );

        await adjustmentHistoryRepo.appendAdjustmentHistory(
          {
            adjustmentId: id,
            eventType: 'LEDGER_POSTED',
            actorUserId: actorId,
            actorDisplayName: actorDisplayName.trim(),
            beforeValuePesewas: effect.beforeBalancePesewas,
            afterValuePesewas: effect.afterBalancePesewas,
            deltaPesewas: effect.deltaPesewas,
            metadata: { adjustmentType: pending.type },
          },
          tx,
        );

        return approved;
      });

      appendAuditEntry({
        action: AUDIT_ACTION.ADJUSTMENT_APPROVED,
        actorId,
        actorDisplayName,
        targetEntityId: id,
        targetEntityType: 'adjustment',
        reason: pending.reason,
      });

      return mapAdjustmentRowToRequest(updated);
    },
  });
}

export async function rejectAdjustment(
  id: string,
  reason: string,
  actorId: string,
  actorDisplayName: string,
) {
  requireDatabase();

  const pending = await adjustmentRepo.findAdjustmentById(id);
  if (!pending) {
    throw new Error('NOT_FOUND');
  }
  if (pending.status !== ADJUSTMENT_STATUS.PENDING) {
    throw new Error('VALIDATION:Only pending adjustments can be reviewed.');
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error('VALIDATION:A reason is required to reject this adjustment.');
  }

  const updated = await runInTransaction(async (tx) => {
    const rejected = await adjustmentRepo.rejectAdjustmentRow(
      {
        adjustmentId: id,
        expectedVersion: pending.version,
        reviewedByUserId: actorId,
        rejectionReason: trimmedReason,
      },
      tx,
    );

    await adjustmentHistoryRepo.appendAdjustmentHistory(
      {
        adjustmentId: id,
        eventType: 'REJECTED',
        actorUserId: actorId,
        actorDisplayName: actorDisplayName.trim(),
        reason: trimmedReason,
      },
      tx,
    );

    return rejected;
  });

  appendAuditEntry({
    action: AUDIT_ACTION.ADJUSTMENT_REJECTED,
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'adjustment',
    reason: trimmedReason,
  });

  return mapAdjustmentRowToRequest(updated);
}
