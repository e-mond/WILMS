import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError, ERROR_CODE } from '../http/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body.';
      next(new AppError(message, ERROR_CODE.VALIDATION, 422));
      return;
    }

    req.body = parsed.data;
    next();
  };
}
