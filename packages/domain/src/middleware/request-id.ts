import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return storage.run({ requestId }, fn);
}

/**
 * Assigns/propagates X-Request-Id for correlation across logs and upstream BFF.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER)?.trim();
  const requestId =
    incoming && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();

  res.setHeader(REQUEST_ID_HEADER, requestId);
  (req as Request & { requestId?: string }).requestId = requestId;

  storage.run({ requestId }, () => next());
}
