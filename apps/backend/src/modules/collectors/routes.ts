import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as collectorService from './service.js';

const onboardCollectorSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
  zone: z.string().min(1),
  phone: z.string().optional(),
  assignedRegion: z.string().optional(),
});

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Collector not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.replace(/^VALIDATION:/, ''), ERROR_CODE.VALIDATION, 422);
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

collectorsRouter.post(
  '/collectors',
  requirePermission(PERMISSION.MANAGE_USERS),
  validateBody(onboardCollectorSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await collectorService.onboardCollector(
          req.body,
          req.session!.userId,
          req.session!.displayName,
        ),
        201,
      );
    } catch (error) {
      mapError(error);
    }
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
