import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { assertCollectorAccess } from './access.js';
import * as collectorPortalService from './service.js';

export const collectorPortalRouter = Router();

collectorPortalRouter.use(requireAuth);

collectorPortalRouter.get(
  '/collector/:id/dashboard',
  asyncHandler(async (req, res) => {
    assertCollectorAccess(req.session!, req.params.id!);
    const date = req.query.date ? String(req.query.date) : undefined;
    sendData(res, await collectorPortalService.getCollectorDashboard(req.params.id!, date));
  }),
);

collectorPortalRouter.get(
  '/collector/:id/borrowers',
  asyncHandler(async (req, res) => {
    assertCollectorAccess(req.session!, req.params.id!);
    const date = req.query.date ? String(req.query.date) : undefined;
    sendData(res, await collectorPortalService.listAssignedBorrowers(req.params.id!, date));
  }),
);
