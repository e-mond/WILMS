import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { idempotencyKeys } from '../db/schema/idempotency-keys.js';

type IdempotencyScope =
  | 'LOAN_DISBURSE'
  | 'PAYMENT_POST'
  | 'LOAN_CREATE'
  | 'ADJUSTMENT_CREATE'
  | 'ADJUSTMENT_APPROVE'
  | 'REVERSAL_EXECUTE'
  | 'RECONCILIATION_SUBMIT';

const RETENTION_MS = 24 * 60 * 60 * 1000;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}

async function resolveExistingIdempotency(
  input: {
    scope: IdempotencyScope;
    actorUserId: string;
    idempotencyKey: string;
  },
  tx: WilmsDb,
) {
  const [row] = await tx
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.scope, input.scope),
        eq(idempotencyKeys.actorUserId, input.actorUserId),
        eq(idempotencyKeys.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (!row) {
    throw new Error('IDEMPOTENCY_IN_PROGRESS');
  }

  if (row.state === 'COMPLETED' && row.responseBody) {
    return { kind: 'replay' as const, body: row.responseBody, status: row.responseStatus ?? 200 };
  }

  throw new Error('IDEMPOTENCY_IN_PROGRESS');
}

export async function beginIdempotency(
  input: {
    scope: IdempotencyScope;
    actorUserId: string;
    idempotencyKey: string;
    requestHash?: string;
  },
  tx: WilmsDb = getDb(),
) {
  const existing = await tx
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.scope, input.scope),
        eq(idempotencyKeys.actorUserId, input.actorUserId),
        eq(idempotencyKeys.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  const row = existing[0];

  if (row) {
    if (row.state === 'COMPLETED' && row.responseBody) {
      return { kind: 'replay' as const, body: row.responseBody, status: row.responseStatus ?? 200 };
    }

    if (row.state === 'IN_PROGRESS') {
      throw new Error('IDEMPOTENCY_IN_PROGRESS');
    }
  }

  const id = uuidv7();

  try {
    await tx.insert(idempotencyKeys).values({
      id,
      scope: input.scope,
      actorUserId: input.actorUserId,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash ?? null,
      state: 'IN_PROGRESS',
      expiresAt: new Date(Date.now() + RETENTION_MS),
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return resolveExistingIdempotency(input, tx);
    }
    throw error;
  }

  return { kind: 'new' as const, id };
}

export async function completeIdempotency(
  input: {
    id: string;
    responseStatus: number;
    responseBody: unknown;
  },
  tx: WilmsDb = getDb(),
) {
  await tx
    .update(idempotencyKeys)
    .set({
      state: 'COMPLETED',
      responseStatus: input.responseStatus,
      responseBody: input.responseBody as never,
      completedAt: new Date(),
    })
    .where(eq(idempotencyKeys.id, input.id));
}
