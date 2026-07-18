import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { WilmsDb } from '../../db/client.js';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { idempotencyKeys } from '../../db/schema/idempotency-keys.js';
import { getFeatureFlags } from '../../config/feature-flags.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { beginIdempotency, completeIdempotency } from '../../repositories/idempotency.repository.js';
import { withSpan } from '../observability/tracing.js';

export type IdempotencyScope =
  | 'LOAN_DISBURSE'
  | 'PAYMENT_POST'
  | 'LOAN_CREATE'
  | 'ADJUSTMENT_CREATE'
  | 'ADJUSTMENT_APPROVE'
  | 'REVERSAL_EXECUTE'
  | 'RECONCILIATION_SUBMIT';

export function hashIdempotencyPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload ?? null)).digest('hex');
}

export function readIdempotencyKey(headers: {
  header(name: string): string | undefined;
}): string | undefined {
  const raw = headers.header('Idempotency-Key') ?? headers.header('idempotency-key');
  const key = raw?.trim();
  if (!key) {
    return undefined;
  }
  if (key.length > 256) {
    throw new AppError(
      'Idempotency-Key must be at most 256 characters.',
      ERROR_CODE.VALIDATION,
      400,
    );
  }
  return key;
}

export function requireIdempotencyKey(key: string | undefined): string {
  const flags = getFeatureFlags();
  if (!key) {
    if (flags.requireIdempotency) {
      throw new AppError(
        'Idempotency-Key header is required for this financial operation.',
        ERROR_CODE.IDEMPOTENCY_REQUIRED,
        400,
      );
    }
    return '';
  }
  return key;
}

export async function runWithIdempotency<T>(
  input: {
    scope: IdempotencyScope;
    actorUserId: string;
    idempotencyKey?: string;
    requestHash?: string;
    requestPayload?: unknown;
    responseStatus: number;
    execute: () => Promise<T>;
  },
  tx: WilmsDb = getDb(),
): Promise<T> {
  const flags = getFeatureFlags();
  const key = input.idempotencyKey?.trim();

  if (!key) {
    if (flags.requireIdempotency && isDatabaseEnabled()) {
      throw new AppError(
        'Idempotency-Key header is required for this financial operation.',
        ERROR_CODE.IDEMPOTENCY_REQUIRED,
        400,
      );
    }
    return input.execute();
  }

  if (!isDatabaseEnabled()) {
    return input.execute();
  }

  const requestHash =
    input.requestHash ??
    (input.requestPayload !== undefined
      ? hashIdempotencyPayload(input.requestPayload)
      : undefined);

  return withSpan(
    'idempotency.run',
    { scope: input.scope, hasKey: true },
    async () => {
      let begin: Awaited<ReturnType<typeof beginIdempotency>>;
      try {
        begin = await beginIdempotency(
          {
            scope: input.scope,
            actorUserId: input.actorUserId,
            idempotencyKey: key,
            requestHash,
          },
          tx,
        );
      } catch (error) {
        if (error instanceof Error && error.message === 'IDEMPOTENCY_KEY_REUSED') {
          throw new AppError(
            'Idempotency-Key was already used with a different request payload.',
            ERROR_CODE.IDEMPOTENCY_KEY_REUSED,
            409,
          );
        }
        if (error instanceof Error && error.message === 'IDEMPOTENCY_IN_PROGRESS') {
          throw new AppError(
            'A request with this Idempotency-Key is already in progress.',
            ERROR_CODE.IDEMPOTENCY_IN_PROGRESS,
            409,
          );
        }
        throw error;
      }

      if (begin.kind === 'replay') {
        if (
          requestHash &&
          begin.requestHash &&
          begin.requestHash !== requestHash
        ) {
          throw new AppError(
            'Idempotency-Key was already used with a different request payload.',
            ERROR_CODE.IDEMPOTENCY_KEY_REUSED,
            409,
          );
        }
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
    },
  );
}
