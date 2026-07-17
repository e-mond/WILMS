/**
 * P14.3B Phase 4C.2 — Reconciliation service.
 *
 * Transaction boundary: submit runs inside runInTransaction with idempotency wrapper.
 * Audit entries are best-effort async after commit (P14.3A pattern).
 */
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, runInTransaction, getDb } from '../../db/client.js';
import { financialReconciliations } from '../../db/schema/financial-reconciliations.js';
import { users } from '../../db/schema/users.js';
import { buildReconciliationSnapshot } from '../../domain/reconciliation/snapshot.js';
import {
  mapReconciliationRowToSummary,
  mapSnapshotToSummary,
} from '../../domain/reconciliation/mappers.js';
import {
  DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
  type ReconciliationSummary,
} from '../../domain/reconciliation/types.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import { sendPushToUser } from '../notifications/push.service.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as reconciliationHistoryRepo from '../../repositories/reconciliation-history.repository.js';
import * as reconciliationRepo from '../../repositories/reconciliation.repository.js';

const AUDIT_ACTION = {
  RECONCILIATION_SUBMITTED: 'reconciliation.submitted',
} as const;

const MIN_FLAGGED_COMMENT_LENGTH = 10;

export const submitReconciliationSchema = z.object({
  collectorId: z.string().min(1),
  reconciliationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  physicalCashPesewas: z.number().int().nonnegative(),
  comment: z.string().optional(),
  actorId: z.string().min(1),
  actorDisplayName: z.string().optional(),
  thresholdPercent: z.number().int().positive().optional(),
});

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for reconciliation operations.');
  }
}

async function loadReconciliationInputs(
  collectorUserId: string,
  reconciliationDate: string,
) {
  const [dueLoans, paymentRows] = await Promise.all([
    loanRepo.listPortfolioLoansForCollector(collectorUserId),
    paymentRepo.listConfirmedPaymentsForCollectorOnDate(collectorUserId, reconciliationDate),
  ]);

  return {
    dueLoans: dueLoans.map((loan) => ({
      paymentDay: loan.paymentDay,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    })),
    payments: paymentRows.map((payment) => ({
      amountPesewas: payment.amountPesewas,
      status: payment.status,
    })),
  };
}

export async function getReconciliationSummary(
  collectorId: string,
  reconciliationDate: string,
): Promise<ReconciliationSummary> {
  requireDatabase();

  const existing = await reconciliationRepo.findSubmittedReconciliationByCollectorAndDate(
    collectorId,
    reconciliationDate,
  );

  if (existing) {
    return mapReconciliationRowToSummary(existing);
  }

  const { dueLoans, payments } = await loadReconciliationInputs(collectorId, reconciliationDate);
  const preview = buildReconciliationSnapshot({
    collectorUserId: collectorId,
    reconciliationDate,
    physicalCashPesewas: 0,
    dueLoans,
    payments,
    thresholdPercent: DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
    comment: null,
    submittedAt: new Date(),
  });

  return mapSnapshotToSummary(preview, false);
}

export async function getReconciliationById(id: string): Promise<ReconciliationSummary | null> {
  requireDatabase();

  const row = await reconciliationRepo.findReconciliationById(id);
  return row ? mapReconciliationRowToSummary(row) : null;
}

export async function listReconciliations(
  filter?: { collectorId?: string },
): Promise<ReconciliationSummary[]> {
  requireDatabase();

  const rows = await reconciliationRepo.listReconciliations(
    filter?.collectorId ? { collectorUserId: filter.collectorId } : undefined,
  );

  return rows.map((row) => mapReconciliationRowToSummary(row));
}

export async function getReconciliationHistory(reconciliationId: string) {
  requireDatabase();

  const reconciliation = await reconciliationRepo.findReconciliationById(reconciliationId);
  if (!reconciliation) {
    throw new Error('NOT_FOUND');
  }

  return reconciliationHistoryRepo.listHistoryForReconciliation(reconciliationId);
}

export async function submitReconciliation(
  input: z.infer<typeof submitReconciliationSchema>,
  idempotencyKey?: string,
): Promise<ReconciliationSummary> {
  requireDatabase();

  const thresholdPercent = input.thresholdPercent ?? DEFAULT_RECONCILIATION_THRESHOLD_PERCENT;

  return runWithIdempotency({
    scope: 'RECONCILIATION_SUBMIT',
    actorUserId: input.actorId,
    idempotencyKey,
    responseStatus: 201,
    execute: async () => {
      const existing = await reconciliationRepo.findSubmittedReconciliationByCollectorAndDate(
        input.collectorId,
        input.reconciliationDate,
      );

      const canResubmit =
        existing &&
        (existing.status === 'REJECTED' || existing.status === 'REOPENED');

      if (existing && !canResubmit) {
        throw new Error('VALIDATION:Reconciliation already submitted for this date.');
      }

      const { dueLoans, payments } = await loadReconciliationInputs(
        input.collectorId,
        input.reconciliationDate,
      );

      const submittedAt = new Date();
      const snapshot = buildReconciliationSnapshot({
        collectorUserId: input.collectorId,
        reconciliationDate: input.reconciliationDate,
        physicalCashPesewas: input.physicalCashPesewas,
        dueLoans,
        payments,
        thresholdPercent,
        comment: input.comment?.trim() ?? null,
        submittedAt,
      });

      if (snapshot.varianceFlagged) {
        const comment = snapshot.comment?.trim() ?? '';
        if (comment.length < MIN_FLAGGED_COMMENT_LENGTH) {
          throw new Error(
            'VALIDATION:A comment of at least 10 characters is required when variance is flagged.',
          );
        }
      }

      const summary = await runInTransaction(async (tx) => {
        const beforeSnapshot = existing
          ? ({
              status: existing.status,
              physicalCashPesewas: existing.physicalCashPesewas,
              primaryVariancePesewas: existing.primaryVariancePesewas,
              resolutionNotes: existing.resolutionNotes,
            } as Record<string, unknown>)
          : null;

        const row = existing
          ? await reconciliationRepo.supersedeReconciliation(existing.id, snapshot, tx)
          : await reconciliationRepo.insertReconciliation(snapshot, tx);

        await reconciliationHistoryRepo.appendReconciliationHistory(
          {
            reconciliationId: row.id,
            eventType: 'SUBMITTED',
            actorUserId: input.actorId,
            beforeSnapshot,
            afterSnapshot: snapshot as unknown as Record<string, unknown>,
            reason: existing
              ? `Resubmit after ${existing.status}${snapshot.varianceFlagged && snapshot.comment ? `: ${snapshot.comment}` : ''}`
              : snapshot.varianceFlagged
                ? snapshot.comment ?? undefined
                : undefined,
            createdAt: submittedAt,
          },
          tx,
        );

        return mapReconciliationRowToSummary(row);
      });

      appendAuditEntry({
        action: AUDIT_ACTION.RECONCILIATION_SUBMITTED,
        actorId: input.actorId,
        actorDisplayName: input.actorDisplayName,
        targetEntityId: `${input.collectorId}:${input.reconciliationDate}`,
        targetEntityType: 'reconciliation',
        reason: snapshot.varianceFlagged
          ? `Variance ${snapshot.primaryVariancePesewas} pesewas exceeds threshold`
          : undefined,
      });

      if (summary.varianceFlagged) {
        void notifySuperAdminsOfReconciliation(summary, input.actorDisplayName);
      }

      return summary;
    },
  });
}

async function notifySuperAdminsOfReconciliation(
  summary: ReconciliationSummary,
  actorDisplayName?: string,
): Promise<void> {
  const title = 'Reconciliation pending';
  const body = `${actorDisplayName ?? 'Collector'} submitted reconciliation for ${summary.date} — variance exceeds threshold and needs approval.`;

  if (!isDatabaseEnabled()) {
    return;
  }

  try {
    const db = getDb();
    const supervisors = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, USER_ROLE.SUPER_ADMIN), isNull(users.deletedAt)));

    await Promise.all(
      supervisors.map(async (supervisor) => {
        await createInAppNotification({
          userId: supervisor.id,
          event: 'SUPERVISOR_ALERT',
          title,
          body,
          href: '/reports/daily-collection',
        });
        await sendPushToUser(supervisor.id, {
          title,
          body,
          url: '/reports/daily-collection',
          category: 'RECONCILIATION',
        });
      }),
    );
  } catch {
    // Notification delivery is best-effort when persistence is unavailable.
  }
}

export const reviewReconciliationSchema = z.object({
  status: z.enum([
    'PENDING_REVIEW',
    'UNDER_INVESTIGATION',
    'APPROVED',
    'REJECTED',
    'REOPENED',
  ]),
  resolutionNotes: z.string().optional(),
  reviewerUserId: z.string().min(1),
});

export async function reviewReconciliation(
  reconciliationId: string,
  input: z.infer<typeof reviewReconciliationSchema>,
): Promise<ReconciliationSummary> {
  requireDatabase();

  const row = await reconciliationRepo.findReconciliationById(reconciliationId);
  if (!row) {
    throw new Error('NOT_FOUND');
  }

  const db = getDb();
  const reviewedAt = new Date();

  await db
    .update(financialReconciliations)
    .set({
      status: input.status,
      reviewedByUserId: input.reviewerUserId,
      reviewedAt,
      resolutionNotes: input.resolutionNotes?.trim() ?? null,
    })
    .where(eq(financialReconciliations.id, reconciliationId));

  await reconciliationHistoryRepo.appendReconciliationHistory({
    reconciliationId,
    eventType: 'COMMENT_ADDED',
    actorUserId: input.reviewerUserId,
    beforeSnapshot: {
      status: row.status,
      reviewedByUserId: row.reviewedByUserId,
      resolutionNotes: row.resolutionNotes,
    },
    afterSnapshot: {
      status: input.status,
      reviewedByUserId: input.reviewerUserId,
      resolutionNotes: input.resolutionNotes?.trim() ?? null,
    },
    reason: input.resolutionNotes?.trim(),
    createdAt: reviewedAt,
  });

  const [updated] = await db
    .select()
    .from(financialReconciliations)
    .where(eq(financialReconciliations.id, reconciliationId))
    .limit(1);

  return mapReconciliationRowToSummary(updated!);
}
