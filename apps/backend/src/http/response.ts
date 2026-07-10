import type { Response } from 'express';
import type { ApiErrorBody, ApiSuccessEnvelope, PaginatedResponse } from '@wilms/shared-types';
import type { PaginatedListResult } from './list-pagination.js';

export type { ApiErrorBody, ApiSuccessEnvelope } from '@wilms/shared-types';

export function sendData<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccessEnvelope<T> = { data };
  res.status(status).json(body);
}

export function sendPaginatedData<T>(
  res: Response,
  result: PaginatedListResult<T>,
  status = 200,
): void {
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const payload: PaginatedResponse<T> = {
    items: result.items,
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages,
    },
  };
  sendData(res, payload, status);
}

export function sendError(res: Response, status: number, message: string, code: string): void {
  res.status(status).json({
    error: { message, code },
  } satisfies { error: ApiErrorBody });
}
