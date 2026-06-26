import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors.js';
import { sendError } from './response.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    sendError(res, error.status, error.message, error.code);
    return;
  }

  if (error instanceof Error) {
    sendError(res, 500, 'An unexpected error occurred.', 'SERVER');
    return;
  }

  sendError(res, 500, 'Unexpected server error.', 'SERVER');
}
