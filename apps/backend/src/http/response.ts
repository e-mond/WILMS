import type { Response } from 'express';
import type { ApiErrorBody, ApiSuccessEnvelope } from '@wilms/shared-types';

export type { ApiErrorBody, ApiSuccessEnvelope } from '@wilms/shared-types';

export function sendData<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccessEnvelope<T> = { data };
  res.status(status).json(body);
}

export function sendError(res: Response, status: number, message: string, code: string): void {
  res.status(status).json({
    error: { message, code },
  } satisfies { error: ApiErrorBody });
}
