import { describe, expect, it } from 'vitest';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import {
  buildFinancialMutationHeaders,
  createFinancialMutationKey,
  financialMutation,
  mapFinancialMutationError,
} from '@/utils/financialMutation';

describe('financialMutation', () => {
  it('reuses an existing idempotency key', () => {
    const key = createFinancialMutationKey('fixed-key-123');
    expect(key).toBe('fixed-key-123');
    const built = buildFinancialMutationHeaders({ idempotencyKey: key });
    expect(built.headers['Idempotency-Key']).toBe('fixed-key-123');
  });

  it('generates a UUID key when none is provided', () => {
    const { key, headers } = buildFinancialMutationHeaders();
    expect(key.length).toBeGreaterThan(8);
    expect(headers['Idempotency-Key']).toBe(key);
  });

  it('passes Idempotency-Key to the executor and returns the result', async () => {
    const seen: string[] = [];
    const { result, key } = await financialMutation(async (headers) => {
      seen.push(headers['Idempotency-Key']);
      return { ok: true };
    });
    expect(result).toEqual({ ok: true });
    expect(seen[0]).toBe(key);
  });

  it('maps missing idempotency errors for reconciliation', () => {
    const mapped = mapFinancialMutationError(
      new ApiError('Idempotency-Key header is required', API_ERROR_CODE.VALIDATION, 400),
      'reconciliation',
    );
    expect(mapped.code).toBe(API_ERROR_CODE.IDEMPOTENCY_REQUIRED);
    expect(mapped.message).toContain('reconciliation');
    expect(mapped.message).not.toMatch(/Idempotency-Key/);
  });

  it('maps disbursement not-ready errors to a friendly message', () => {
    const mapped = mapFinancialMutationError(
      new ApiError(
        'Only approved loans pending disbursement can be disbursed.',
        API_ERROR_CODE.VALIDATION,
        422,
      ),
      'disbursement',
    );
    expect(mapped.code).toBe(API_ERROR_CODE.LOAN_NOT_READY_FOR_DISBURSEMENT);
    expect(mapped.message).toContain('not ready for disbursement');
  });
});
