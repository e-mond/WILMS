/**
 * Shared HTTP error mapping for financial routes.
 */
import { AppError, ERROR_CODE } from '../http/errors.js';

export function mapFinancialRouteError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message === 'DUPLICATE' || error.message.startsWith('DUPLICATE:')) {
      const message =
        error.message === 'DUPLICATE'
          ? 'This payment was already recorded for this borrower, date, and amount.'
          : error.message.replace(/^DUPLICATE:?/, '') ||
            'Duplicate transaction — request already processed.';
      throw new AppError(message, ERROR_CODE.DUPLICATE_TRANSACTION, 409);
    }
    if (error.message === 'REVERSAL_DUPLICATE') {
      throw new AppError(
        'This payment has already been reversed.',
        ERROR_CODE.DUPLICATE_TRANSACTION,
        409,
      );
    }
    if (error.message.startsWith('VALIDATION')) {
      throw new AppError(
        error.message.replace(/^VALIDATION:?/, '') || 'Validation failed.',
        ERROR_CODE.VALIDATION,
        422,
      );
    }
    if (error.message.startsWith('CONFLICT')) {
      throw new AppError('Resource was modified concurrently.', ERROR_CODE.CONFLICT, 409);
    }
    if (error.message === 'IDEMPOTENCY_IN_PROGRESS') {
      throw new AppError('Request is already in progress.', ERROR_CODE.CONFLICT, 409);
    }
  }
  throw error;
}
