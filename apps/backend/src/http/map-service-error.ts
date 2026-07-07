import { AppError, ERROR_CODE } from './errors.js';
import { mapDatabaseError } from '../lib/db-errors.js';

export function mapServiceError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    if (error.message === 'SERVER') {
      throw new AppError(
        'Unable to complete the request. Please try again.',
        ERROR_CODE.SERVER,
        500,
      );
    }

    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(
        error.message.slice('VALIDATION:'.length),
        ERROR_CODE.VALIDATION,
        422,
      );
    }

    if (error.message.startsWith('CONFLICT:')) {
      throw new AppError(
        error.message.slice('CONFLICT:'.length),
        ERROR_CODE.CONFLICT,
        409,
      );
    }

    if (error.message.startsWith('FORBIDDEN:')) {
      throw new AppError(
        error.message.slice('FORBIDDEN:'.length),
        ERROR_CODE.UNAUTHORIZED,
        403,
      );
    }
  }

  const mapped = mapDatabaseError(error);
  if (mapped) {
    mapServiceError(mapped);
  }

  throw error;
}
