import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled, runInTransaction } from '../../db/client.js';
import { offlineSyncConflicts, offlineSyncOperations } from '../../db/schema/offline-sync.js';
import { FINANCIAL_OPERATION_TYPES } from './constants.js';
import * as paymentService from '../payments/service.js';
import * as holidayRequestService from '../holiday-requests/service.js';

export interface OfflineSyncOperationInput {
  idempotencyKey: string;
  type: string;
  payload: Record<string, unknown>;
  clientCreatedAt: string;
}

export interface OfflineSyncOperationResult {
  idempotencyKey: string;
  status: 'DUPLICATE' | 'QUEUED_FOR_REVIEW' | 'APPLIED';
  operationId: string;
  conflictId?: string;
}

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_REQUIRED');
  }
}

export async function ingestOfflineBatch(
  actorUserId: string,
  operations: OfflineSyncOperationInput[],
): Promise<OfflineSyncOperationResult[]> {
  requireDatabase();
  const db = getDb();
  const results: OfflineSyncOperationResult[] = [];

  const sorted = [...operations].sort(
    (a, b) => new Date(a.clientCreatedAt).getTime() - new Date(b.clientCreatedAt).getTime(),
  );

  for (const op of sorted) {
    const existing = await db
      .select()
      .from(offlineSyncOperations)
      .where(
        and(
          eq(offlineSyncOperations.actorUserId, actorUserId),
          eq(offlineSyncOperations.idempotencyKey, op.idempotencyKey),
        ),
      )
      .limit(1);

    if (existing[0]) {
      results.push({
        idempotencyKey: op.idempotencyKey,
        status: 'DUPLICATE',
        operationId: existing[0].id,
        conflictId: undefined,
      });
      continue;
    }

    const operationId = uuidv7();

    if (FINANCIAL_OPERATION_TYPES.has(op.type)) {
      await runInTransaction(async (tx) => {
        await tx.insert(offlineSyncOperations).values({
          id: operationId,
          idempotencyKey: op.idempotencyKey,
          actorUserId,
          operationType: op.type,
          payload: op.payload,
          clientCreatedAt: new Date(op.clientCreatedAt),
          status: 'QUEUED_FOR_REVIEW',
          result: { message: 'Financial offline operation requires human review.' },
        });

        const conflictId = uuidv7();
        await tx.insert(offlineSyncConflicts).values({
          id: conflictId,
          operationId,
          conflictReason: 'Financial mutation from offline queue — manual review required.',
          status: 'PENDING_REVIEW',
        });
      });

      const conflict = await db
        .select({ id: offlineSyncConflicts.id })
        .from(offlineSyncConflicts)
        .where(eq(offlineSyncConflicts.operationId, operationId))
        .limit(1);

      results.push({
        idempotencyKey: op.idempotencyKey,
        status: 'QUEUED_FOR_REVIEW',
        operationId,
        conflictId: conflict[0]?.id,
      });

      try {
        const { listUsers } = await import('../../repositories/user.repository.js');
        const { createInAppNotification } = await import(
          '../../infrastructure/notifications/in-app-notify.js'
        );
        const { sendPushToUser } = await import('../notifications/push.service.js');
        const users = await listUsers();
        const recipients = users.filter(
          (user) =>
            (user.role === 'SUPER_ADMIN' || user.role === 'APPROVER') && user.status === 'ACTIVE',
        );
        await Promise.all(
          recipients.map(async (user) => {
            await createInAppNotification({
              userId: user.id,
              event: 'SUPERVISOR_ALERT',
              title: 'Offline sync conflict',
              body: 'A financial offline operation requires review.',
              href: '/approver/sync-conflicts',
            });
            await sendPushToUser(user.id, {
              title: 'Offline sync conflict',
              body: 'A financial offline operation requires review.',
              url: '/approver/sync-conflicts',
              category: 'offline-sync',
            });
          }),
        );
      } catch {
        // Best-effort alerts.
      }

      continue;
    }

    await db.insert(offlineSyncOperations).values({
      id: operationId,
      idempotencyKey: op.idempotencyKey,
      actorUserId,
      operationType: op.type,
      payload: op.payload,
      clientCreatedAt: new Date(op.clientCreatedAt),
      status: 'APPLIED',
      result: { message: 'Non-financial operation accepted.' },
    });

    if (op.type === 'HOLIDAY_REQUEST_CREATE') {
      const payload = op.payload as {
        name?: string;
        holidayDate?: string;
        endDate?: string | null;
        reason?: string | null;
        notes?: string | null;
        evidenceUrl?: string | null;
        community?: string | null;
        groupId?: string | null;
        borrowerId?: string | null;
        scope?: string;
        branch?: string | null;
        submit?: boolean;
      };

      const created = await holidayRequestService.createHolidayRequest({
        name: String(payload.name ?? ''),
        holidayDate: String(payload.holidayDate ?? ''),
        endDate: payload.endDate ?? null,
        reason: payload.reason ?? null,
        notes: payload.notes ?? null,
        evidenceUrl: payload.evidenceUrl ?? null,
        community: payload.community ?? null,
        groupId: payload.groupId ?? null,
        borrowerId: payload.borrowerId ?? null,
        scope: payload.scope,
        branch: payload.branch ?? null,
        requestedByUserId: actorUserId,
        submit: Boolean(payload.submit),
      });

      await db
        .update(offlineSyncOperations)
        .set({
          result: { holidayRequestId: created.id, status: created.status },
          updatedAt: new Date(),
        })
        .where(eq(offlineSyncOperations.id, operationId));
    }

    results.push({
      idempotencyKey: op.idempotencyKey,
      status: 'APPLIED',
      operationId,
    });
  }

  return results;
}

export async function listPendingConflicts() {
  requireDatabase();
  const db = getDb();
  return db
    .select()
    .from(offlineSyncConflicts)
    .where(eq(offlineSyncConflicts.status, 'PENDING_REVIEW'));
}

export async function approveConflict(conflictId: string, resolverUserId: string, note?: string) {
  requireDatabase();
  const db = getDb();

  return runInTransaction(async (tx) => {
    const [conflict] = await tx
      .select()
      .from(offlineSyncConflicts)
      .where(eq(offlineSyncConflicts.id, conflictId))
      .limit(1);

    if (!conflict || conflict.status !== 'PENDING_REVIEW') {
      throw new Error('NOT_FOUND');
    }

    const [operation] = await tx
      .select()
      .from(offlineSyncOperations)
      .where(eq(offlineSyncOperations.id, conflict.operationId))
      .limit(1);

    if (!operation) {
      throw new Error('NOT_FOUND');
    }

    if (operation.actorUserId === resolverUserId) {
      throw new Error(
        'FORBIDDEN:You cannot approve a sync conflict from your own offline operation.',
      );
    }

    let paymentResult: unknown = null;

    if (operation.operationType === 'RECORD_PAYMENT') {
      const payload = operation.payload as {
        borrowerId: string;
        amountPesewas: number;
        paymentDate: string;
        collectorId: string;
        gps?: { latitude: number; longitude: number; accuracyMeters?: number };
      };

      paymentResult = await paymentService.recordPayment(
        {
          borrowerId: payload.borrowerId,
          amountPesewas: payload.amountPesewas,
          paymentDate: payload.paymentDate,
          collectorId: payload.collectorId,
          gps: payload.gps,
        },
        resolverUserId,
        operation.idempotencyKey,
      );
    }

    await tx
      .update(offlineSyncConflicts)
      .set({
        status: 'RESOLVED',
        resolutionNote: note ?? 'Approved',
        resolvedByUserId: resolverUserId,
        resolvedAt: new Date(),
      })
      .where(eq(offlineSyncConflicts.id, conflictId));

    await tx
      .update(offlineSyncOperations)
      .set({
        status: 'APPLIED',
        result: { payment: paymentResult },
        updatedAt: new Date(),
      })
      .where(eq(offlineSyncOperations.id, operation.id));

    return { conflictId, operationId: operation.id, paymentResult };
  });
}

export async function rejectConflict(conflictId: string, resolverUserId: string, note?: string) {
  requireDatabase();
  const db = getDb();

  return runInTransaction(async (tx) => {
    const [conflict] = await tx
      .select()
      .from(offlineSyncConflicts)
      .where(eq(offlineSyncConflicts.id, conflictId))
      .limit(1);

    if (!conflict || conflict.status !== 'PENDING_REVIEW') {
      throw new Error('NOT_FOUND');
    }

    await tx
      .update(offlineSyncConflicts)
      .set({
        status: 'REJECTED',
        resolutionNote: note ?? 'Rejected',
        resolvedByUserId: resolverUserId,
        resolvedAt: new Date(),
      })
      .where(eq(offlineSyncConflicts.id, conflictId));

    await tx
      .update(offlineSyncOperations)
      .set({
        status: 'REJECTED',
        updatedAt: new Date(),
      })
      .where(eq(offlineSyncOperations.id, conflict.operationId));

    return { conflictId, status: 'REJECTED' };
  });
}
