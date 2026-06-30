import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as riskFlagService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Risk flag not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  throw error;
}

export const riskFlagsRouter = Router();

riskFlagsRouter.use(requireAuth);
riskFlagsRouter.use(requirePermission(PERMISSION.REVIEW_RISK_FLAGS));

riskFlagsRouter.get(
  '/risk-flags',
  asyncHandler(async (_req, res) => {
    sendData(res, await riskFlagService.listRiskFlags());
  }),
);

riskFlagsRouter.get(
  '/risk-flags/:id',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await riskFlagService.getRiskFlag(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);
