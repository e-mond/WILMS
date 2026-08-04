import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as syncService from './service.js';

const offlineOperationSchema = z.object({
  idempotencyKey: z.string().min(1),
  type: z.enum(['RECORD_PAYMENT']),
  payload: z.record(z.unknown()),
  clientCreatedAt: z.string().min(1),
});

const batchBodySchema = z.object({
  operations: z.array(offlineOperationSchema).min(1).max(50),
});

const resolveBodySchema = z.object({
  note: z.string().optional(),
});

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'DATABASE_REQUIRED') {
    throw new AppError('Database is required for offline sync.', ERROR_CODE.SERVER, 503);
  }
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Sync conflict not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('FORBIDDEN:')) {
    throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
  }
  throw error;
}

export const syncRouter = Router();

syncRouter.use(requireAuth);

syncRouter.post(
  '/sync/offline/batch',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  validateBody(batchBodySchema),
  asyncHandler(async (req, res) => {
    try {
      const results = await syncService.ingestOfflineBatch(
        req.session!.userId,
        req.body.operations,
      );
      sendData(res, { results });
    } catch (error) {
      mapError(error);
    }
  }),
);

syncRouter.get(
  '/sync/conflicts',
  requirePermission(PERMISSION.APPROVE_LOANS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, { conflicts: await syncService.listPendingConflicts() });
    } catch (error) {
      mapError(error);
    }
  }),
);

syncRouter.post(
  '/sync/conflicts/:id/approve',
  requirePermission(PERMISSION.APPROVE_LOANS),
  validateBody(resolveBodySchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await syncService.approveConflict(req.params.id!, req.session!.userId, req.body.note),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

syncRouter.post(
  '/sync/conflicts/:id/reject',
  requirePermission(PERMISSION.APPROVE_LOANS),
  validateBody(resolveBodySchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await syncService.rejectConflict(req.params.id!, req.session!.userId, req.body.note),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
