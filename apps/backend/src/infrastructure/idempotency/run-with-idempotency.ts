import { eq } from 'drizzle-orm';
import type { WilmsDb } from '../../db/client.js';
import { getDb } from '../../db/client.js';
import { idempotencyKeys } from '../../db/schema/idempotency-keys.js';
import { beginIdempotency, completeIdempotency } from '../../repositories/idempotency.repository.js';

export type IdempotencyScope =
  | 'LOAN_DISBURSE'
  | 'PAYMENT_POST'
  | 'LOAN_CREATE'
  | 'ADJUSTMENT_CREATE'
  | 'ADJUSTMENT_APPROVE'
  | 'REVERSAL_EXECUTE'
  | 'RECONCILIATION_SUBMIT';

export async function runWithIdempotency<T>(
  input: {
    scope: IdempotencyScope;
    actorUserId: string;
    idempotencyKey?: string;
    responseStatus: number;
    execute: () => Promise<T>;
  },
  tx: WilmsDb = getDb(),
): Promise<T> {
  if (!input.idempotencyKey) {
    return input.execute();
  }

  const begin = await beginIdempotency(
    {
      scope: input.scope,
      actorUserId: input.actorUserId,
      idempotencyKey: input.idempotencyKey,
    },
    tx,
  );

  if (begin.kind === 'replay') {
    return begin.body as T;
  }

  try {
    const result = await input.execute();
    await completeIdempotency(
      {
        id: begin.id,
        responseStatus: input.responseStatus,
        responseBody: result,
      },
      tx,
    );
    return result;
  } catch (error) {
    await tx.delete(idempotencyKeys).where(eq(idempotencyKeys.id, begin.id));
    throw error;
  }
}
