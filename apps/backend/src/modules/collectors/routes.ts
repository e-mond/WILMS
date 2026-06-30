import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as collectorService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Collector not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  throw error;
}

export const collectorsRouter = Router();

collectorsRouter.use(requireAuth);
collectorsRouter.use(requirePermission(PERMISSION.VIEW_ALL_COLLECTORS));

collectorsRouter.get(
  '/collectors',
  asyncHandler(async (_req, res) => {
    sendData(res, await collectorService.listCollectors());
  }),
);

collectorsRouter.get(
  '/collectors/:id',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await collectorService.getCollector(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);
