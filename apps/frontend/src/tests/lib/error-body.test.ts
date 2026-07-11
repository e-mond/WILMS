import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage, unwrapApiSuccessData } from '@/lib/api/error-body';

describe('extractApiErrorMessage', () => {
  it('reads top-level message', () => {
    expect(extractApiErrorMessage({ message: 'Invalid email.' })).toBe('Invalid email.');
  });

  it('reads nested error.message from backend envelope', () => {
    expect(
      extractApiErrorMessage({ error: { message: 'Too many reset requests.', code: 'VALIDATION' } }),
    ).toBe('Too many reset requests.');
  });
});

describe('unwrapApiSuccessData', () => {
  it('unwraps data envelope', () => {
    expect(unwrapApiSuccessData({ data: { ok: true } })).toEqual({ ok: true });
  });

  it('returns payload when no envelope exists', () => {
    expect(unwrapApiSuccessData({ ok: true })).toEqual({ ok: true });
  });
});
