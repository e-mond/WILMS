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
import { calculateExpectedDuePesewas } from '../../domain/reconciliation/expected-cash.js';
import {
  mapReconciliationRowToSummary,
  mapSnapshotToSummary,
} from '../../domain/reconciliation/mappers.js';
import {
  DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
  type ReconciliationSummary,
} from '../../domain/reconciliation/types.js';
import { isLoanDueOnDate } from '../../domain/reconciliation/weekday.js';
import { decimalToPesewas } from '../../domain/money.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import { getMailProvider } from '../../infrastructure/mail/index.js';
import {
  buildEmailTemplate,
  emailParagraph,
  emailReceipt,
} from '../../infrastructure/notifications/email-layout.js';
import { formatGhsAmount } from '../../infrastructure/notifications/templates.js';
import { runWithIdempotency } from '../../infrastructure/idempotency/run-with-idempotency.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import * as reconciliationHistoryRepo from '../../repositories/reconciliation-history.repository.js';
import * as reconciliationRepo from '../../repositories/reconciliation.repository.js';
import { listAdminFeesForCollectorOnDate } from '../../db/persistence.js';
import * as userRepo from '../../repositories/user.repository.js';
import { formatCollectorStaffLabel, formatGpsDisplaySummary } from '@wilms/shared-utils';

const AUDIT_ACTION = {
  RECONCILIATION_SUBMITTED: 'reconciliation.submitted',
  RECONCILIATION_REVIEWED: 'reconciliation.reviewed',
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
  const [dueLoans, paymentRows, adminFees] = await Promise.all([
    loanRepo.listPortfolioLoansForCollector(collectorUserId),
    paymentRepo.listConfirmedPaymentsForCollectorOnDate(collectorUserId, reconciliationDate),
    listAdminFeesForCollectorOnDate(collectorUserId, reconciliationDate),
  ]);

  const scheduleWeeks = await scheduleRepo.listScheduleWeeksForLoansOnDate(
    dueLoans.map((loan) => loan.id),
    reconciliationDate,
  );

  return {
    dueLoans: dueLoans.map((loan) => ({
      id: loan.id,
      paymentDay: loan.paymentDay,
      weeklyPaymentPesewas: loan.weeklyPaymentPesewas,
    })),
    scheduleDues: scheduleWeeks.map((week) => ({
      loanId: week.loanId,
      installmentPesewas: decimalToPesewas(week.installmentAmount),
    })),
    payments: paymentRows.map((payment) => ({
      loanId: payment.loanId,
      amountPesewas: payment.amountPesewas,
      status: payment.status,
    })),
    adminFeePesewas: adminFees.reduce((sum, fee) => sum + fee.amountPesewas, 0),
  };
}

/**
 * When collectors record payments on a non-due day (holiday shift / early),
 * include those loans' weekly installments so Expected matches daily collection.
 */
function paidOutsideDueExpectedPesewas(
  loans: Array<{ id?: string; paymentDay: string; weeklyPaymentPesewas: number }>,
  scheduleDues: Array<{ loanId: string }>,
  reconciliationDate: string,
  payments: Array<{ loanId: string | null; status: string }>,
): number {
  const scheduledLoanIds = new Set(scheduleDues.map((week) => week.loanId));
  const alreadyExpectedLoanIds = new Set<string>(scheduledLoanIds);
  for (const loan of loans) {
    if (!loan.id || alreadyExpectedLoanIds.has(loan.id)) {
      continue;
    }
    if (isLoanDueOnDate(loan.paymentDay, reconciliationDate)) {
      alreadyExpectedLoanIds.add(loan.id);
    }
  }

  const weeklyByLoanId = new Map(
    loans
      .filter((loan): loan is { id: string; paymentDay: string; weeklyPaymentPesewas: number } =>
        Boolean(loan.id),
      )
      .map((loan) => [loan.id, loan.weeklyPaymentPesewas] as const),
  );

  let paidOutside = 0;
  const counted = new Set<string>();
  for (const payment of payments) {
    if (payment.status === 'REVERSED' || !payment.loanId) {
      continue;
    }
    if (alreadyExpectedLoanIds.has(payment.loanId) || counted.has(payment.loanId)) {
      continue;
    }
    const weekly = weeklyByLoanId.get(payment.loanId);
    if (!weekly) {
      continue;
    }
    counted.add(payment.loanId);
    paidOutside += weekly;
  }

  return paidOutside;
}

/**
 * Open reconciliations may carry a stale expected snapshot (e.g. submitted
 * before schedule-aware dues). Recompute live expected for display.
 */
async function withLiveExpected(summary: ReconciliationSummary): Promise<ReconciliationSummary> {
  try {
    const { dueLoans, scheduleDues, payments, adminFeePesewas } = await loadReconciliationInputs(
      summary.collectorId,
      summary.date,
    );
    const scheduleAndPaymentDayExpected = calculateExpectedDuePesewas(
      dueLoans,
      summary.date,
      scheduleDues,
    );
    const liveExpectedPesewas =
      scheduleAndPaymentDayExpected +
      paidOutsideDueExpectedPesewas(dueLoans, scheduleDues, summary.date, payments) +
      adminFeePesewas;
    const keepSnapshotOnly = summary.status === 'APPROVED';

    return {
      ...summary,
      liveExpectedPesewas,
      expectedPesewas: keepSnapshotOnly
        ? summary.expectedPesewas
        : Math.max(summary.expectedPesewas, liveExpectedPesewas),
    };
  } catch {
    return summary;
  }
}

async function withCollectionMetadata(
  summary: ReconciliationSummary,
): Promise<ReconciliationSummary> {
  const withExpected = await withLiveExpected(summary);

  try {
    const collectors = await userRepo.listCollectors();
    const match = collectors.find(({ user }) => user.id === summary.collectorId);
    const collectorLabel = match
      ? formatCollectorStaffLabel({
          fullName: match.user.displayName,
          collectorCode: match.collector?.collectorCode,
          staffId: match.user.staffId,
        })
      : formatCollectorStaffLabel({
          fullName: (await userRepo.getUserById(summary.collectorId))?.displayName ?? 'Collector',
          sequence: 0,
        });

    const payments = await paymentRepo.listPaymentsForDate(summary.date, {
      collectorId: summary.collectorId,
    });
    const collectionGps = payments.map((payment) => {
      const gps = payment.gps ?? {};
      return {
        summary: formatGpsDisplaySummary({
          ...gps,
          source: gps.unavailable ? 'exception' : 'device',
        }),
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy ?? gps.accuracyMeters,
        capturedAt: gps.capturedAt,
        source: gps.unavailable ? 'exception' : 'device',
        exceptionReason: gps.unavailable ? gps.reason : undefined,
      };
    });

    return {
      ...withExpected,
      collectorLabel,
      collectionGps,
    };
  } catch {
    return withExpected;
  }
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
    return withCollectionMetadata(mapReconciliationRowToSummary(existing));
  }

  const { dueLoans, payments, scheduleDues, adminFeePesewas } = await loadReconciliationInputs(
    collectorId,
    reconciliationDate,
  );
  const preview = buildReconciliationSnapshot({
    collectorUserId: collectorId,
    reconciliationDate,
    physicalCashPesewas: 0,
    dueLoans,
    payments,
    scheduleDues,
    adminFeePesewas,
    thresholdPercent: DEFAULT_RECONCILIATION_THRESHOLD_PERCENT,
    comment: null,
    submittedAt: new Date(),
  });

  return withCollectionMetadata(mapSnapshotToSummary(preview, false));
}

export async function getReconciliationById(id: string): Promise<ReconciliationSummary | null> {
  requireDatabase();

  const row = await reconciliationRepo.findReconciliationById(id);
  if (!row) {
    return null;
  }
  return withCollectionMetadata(mapReconciliationRowToSummary(row));
}

export async function listReconciliations(
  filter?: { collectorId?: string },
): Promise<ReconciliationSummary[]> {
  requireDatabase();

  const rows = await reconciliationRepo.listReconciliations(
    filter?.collectorId ? { collectorUserId: filter.collectorId } : undefined,
  );

  const summaries = rows.map((row) => mapReconciliationRowToSummary(row));
  return Promise.all(summaries.map((summary) => withCollectionMetadata(summary)));
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

      const { dueLoans, payments, scheduleDues, adminFeePesewas } = await loadReconciliationInputs(
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
        scheduleDues,
        adminFeePesewas,
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
        void import('../../infrastructure/notifications/ops-notifications.js').then(
          ({ emitHighVarianceAlert }) =>
            emitHighVarianceAlert({
              reconciliationId: summary.id ?? `${summary.collectorId}:${summary.date}`,
              collectorUserId: summary.collectorId,
              date: summary.date,
              variancePesewas: summary.variancePesewas ?? 0,
            }),
        );
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

  if (row.collectorUserId === input.reviewerUserId) {
    throw new Error(
      'FORBIDDEN:You cannot review your own reconciliation submission. Ask another authorised reviewer.',
    );
  }

  const db = getDb();
  const reviewedAt = new Date();
  const resolutionNotes = input.resolutionNotes?.trim() ?? null;

  await db
    .update(financialReconciliations)
    .set({
      status: input.status,
      reviewedByUserId: input.reviewerUserId,
      reviewedAt,
      resolutionNotes,
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
      resolutionNotes,
    },
    reason: resolutionNotes ?? undefined,
    createdAt: reviewedAt,
  });

  const [updated] = await db
    .select()
    .from(financialReconciliations)
    .where(eq(financialReconciliations.id, reconciliationId))
    .limit(1);

  const summary = mapReconciliationRowToSummary(updated!);

  appendAuditEntry({
    action: AUDIT_ACTION.RECONCILIATION_REVIEWED,
    actorId: input.reviewerUserId,
    targetEntityId: reconciliationId,
    targetEntityType: 'reconciliation',
    reason: `Status set to ${input.status}${resolutionNotes ? `: ${resolutionNotes}` : ''}`,
  });

  void notifyCollectorOfReconciliationReview({
    collectorUserId: row.collectorUserId,
    summary,
    previousStatus: row.status,
    nextStatus: input.status,
    resolutionNotes,
  });

  return summary;
}

function formatReviewStatusLabel(status: string): string {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'UNDER_INVESTIGATION':
      return 'marked under investigation';
    case 'REOPENED':
      return 'reopened';
    case 'PENDING_REVIEW':
      return 'returned to pending review';
    default:
      return `updated to ${status}`;
  }
}

async function notifyCollectorOfReconciliationReview(input: {
  collectorUserId: string;
  summary: ReconciliationSummary;
  previousStatus: string;
  nextStatus: string;
  resolutionNotes: string | null;
}): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const statusLabel = formatReviewStatusLabel(input.nextStatus);
  const title = `Reconciliation ${statusLabel}`;
  const expectedGhs = formatGhsAmount(input.summary.expectedPesewas);
  const varianceGhs = formatGhsAmount(input.summary.variancePesewas ?? 0);
  const notes = input.resolutionNotes?.trim();
  const body = [
    `Your reconciliation for ${input.summary.date} was ${statusLabel}.`,
    `Expected GHS ${expectedGhs}; variance GHS ${varianceGhs}.`,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const db = getDb();
    const [collector] = await db
      .select({ id: users.id, email: users.email, displayName: users.displayName })
      .from(users)
      .where(and(eq(users.id, input.collectorUserId), isNull(users.deletedAt)))
      .limit(1);

    if (!collector) {
      return;
    }

    await createInAppNotification({
      userId: collector.id,
      event: 'COMMUNICATION',
      title,
      body,
      href: '/collector/reconciliation',
    });

    if (collector.email?.trim()) {
      const template = buildEmailTemplate({
        subject: `WILMS reconciliation ${statusLabel} — ${input.summary.date}`,
        greeting: collector.displayName || 'Collector',
        preheader: `Reconciliation for ${input.summary.date} was ${statusLabel}`,
        theme:
          input.nextStatus === 'APPROVED'
            ? 'success'
            : input.nextStatus === 'REJECTED'
              ? 'critical'
              : 'info',
        textLines: [
          `Dear ${collector.displayName || 'Collector'},`,
          '',
          body,
          '',
          'Open WILMS to review the reconciliation details.',
          '',
          '— WILMS',
        ],
        htmlBody: [
          emailParagraph(body),
          emailReceipt([
            { label: 'Date', value: input.summary.date },
            { label: 'Status', value: input.nextStatus.replaceAll('_', ' ') },
            { label: 'Expected', value: `GHS ${expectedGhs}` },
            { label: 'Variance', value: `GHS ${varianceGhs}` },
            ...(notes ? [{ label: 'Notes', value: notes }] : []),
          ]),
        ].join(''),
      });

      const mail = getMailProvider();
      if (mail.isConfigured()) {
        await mail.send({
          to: collector.email,
          subject: template.subject,
          text: template.text,
          html: template.html,
        });
      }
    }
  } catch {
    // Notification delivery is best-effort.
  }
}
