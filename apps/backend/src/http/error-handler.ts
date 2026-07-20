import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { sendError } from './response.js';
import { mapDatabaseError } from '../lib/db-errors.js';

const GENERIC_SERVER_ERROR = 'An unexpected error occurred. Please try again.';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    sendError(res, error.status, error.message, error.code);
    return;
  }

  const mapped = mapDatabaseError(error);
  if (mapped) {
    const message = mapped.message.startsWith('VALIDATION:')
      ? mapped.message.slice('VALIDATION:'.length)
      : mapped.message;
    sendError(res, 422, message, 'VALIDATION');
    return;
  }

  if (error instanceof Error) {
    console.error('[api] unhandled error:', error.message, error.stack);
    // Never echo raw Error.message to clients — may contain SQL, paths, or secrets.
    sendError(res, 500, GENERIC_SERVER_ERROR, 'SERVER');
    return;
  }

  sendError(res, 500, GENERIC_SERVER_ERROR, 'SERVER');
}
