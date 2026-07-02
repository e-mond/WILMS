import { describe, expect, it } from 'vitest';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';

describe('resolveQueryErrorPresentation', () => {
  it('maps network errors to offline messaging', () => {
    const result = resolveQueryErrorPresentation(
      new ApiError('Unable to reach the server. Check your connection.', API_ERROR_CODE.NETWORK),
    );

    expect(result.variant).toBe('offline');
    expect(result.title).toContain('Unable to reach');
    expect(result.canRetry).toBe(true);
  });

  it('maps forbidden errors without generic connection copy', () => {
    const result = resolveQueryErrorPresentation(
      new ApiError('You do not have permission to perform this action.', API_ERROR_CODE.FORBIDDEN, 403),
    );

    expect(result.variant).toBe('forbidden');
    expect(result.title).toBe('Access denied');
    expect(result.canRetry).toBe(false);
  });

  it('maps empty unknown errors to a generic retryable state', () => {
    const result = resolveQueryErrorPresentation(new Error('boom'));

    expect(result.title).toBe('Unable to load this data');
    expect(result.canRetry).toBe(true);
  });
});
