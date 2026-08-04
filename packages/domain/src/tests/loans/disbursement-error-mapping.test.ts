import { describe, expect, it } from 'vitest';
import { mapFinancialRouteError } from '../../http/map-financial-error.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';

describe('mapFinancialRouteError disbursement codes', () => {
  it('maps LOAN_NOT_READY_FOR_DISBURSEMENT to a stable 422 code', () => {
    try {
      mapFinancialRouteError(new Error('VALIDATION:LOAN_NOT_READY_FOR_DISBURSEMENT'));
      expect.unreachable('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      const appError = error as AppError;
      expect(appError.status).toBe(422);
      expect(appError.code).toBe(ERROR_CODE.LOAN_NOT_READY_FOR_DISBURSEMENT);
      expect(appError.message).toContain('pending disbursement');
    }
  });
});
