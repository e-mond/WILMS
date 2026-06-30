import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as collectorPortalService from './service.js';

export const collectorPortalRouter = Router();

collectorPortalRouter.use(requireAuth);
collectorPortalRouter.use(requirePermission(PERMISSION.ACCESS_COLLECTOR_PORTAL));

collectorPortalRouter.get(
  '/collector/:id/dashboard',
  asyncHandler(async (req, res) => {
    const date = req.query.date ? String(req.query.date) : undefined;
    sendData(res, await collectorPortalService.getCollectorDashboard(req.params.id!, date));
  }),
);

collectorPortalRouter.get(
  '/collector/:id/borrowers',
  asyncHandler(async (req, res) => {
    const date = req.query.date ? String(req.query.date) : undefined;
    sendData(res, await collectorPortalService.listAssignedBorrowers(req.params.id!, date));
  }),
);
