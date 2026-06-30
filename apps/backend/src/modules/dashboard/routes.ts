import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as dashboardService from './service.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL));

dashboardRouter.get(
  '/dashboard/summary',
  asyncHandler(async (_req, res) => {
    sendData(res, await dashboardService.getDashboardSummary());
  }),
);
