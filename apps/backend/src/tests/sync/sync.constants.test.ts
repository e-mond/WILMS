import { describe, expect, it } from 'vitest';
import { FINANCIAL_OPERATION_TYPES } from '../../modules/sync/constants.js';

describe('offline sync constants', () => {
  it('treats RECORD_PAYMENT as financial (conflict queue path)', () => {
    expect(FINANCIAL_OPERATION_TYPES.has('RECORD_PAYMENT')).toBe(true);
    expect(FINANCIAL_OPERATION_TYPES.has('DRAFT_NOTE')).toBe(false);
  });
});
