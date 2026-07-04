import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
  searchGhanaLocations,
} from '../../lib/ghana-locations.js';

export const locationsRouter = Router();

/** Static Ghana reference data — no auth required (same dataset as registration offline fallback). */
locationsRouter.get(
  '/locations/regions',
  asyncHandler(async (_req, res) => {
    sendData(res, getGhanaRegions());
  }),
);

locationsRouter.get(
  '/locations/regions/:id/districts',
  asyncHandler(async (req, res) => {
    sendData(res, getGhanaDistricts(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/districts/:id/cities',
  asyncHandler(async (req, res) => {
    sendData(res, getGhanaCities(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/search',
  asyncHandler(async (req, res) => {
    sendData(res, searchGhanaLocations(String(req.query.q ?? '')));
  }),
);

locationsRouter.use(requireAuth);
locationsRouter.use(
  requirePermission(
    PERMISSION.ACCESS_REGISTRATION_PORTAL,
    PERMISSION.REGISTER_BORROWERS,
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_APPROVER_PORTAL,
    PERMISSION.ACCESS_AUDITOR_PORTAL,
    PERMISSION.VIEW_REPORTS,
    PERMISSION.GPS_VERIFICATION,
  ),
);

locationsRouter.get(
  '/locations/current',
  asyncHandler(async (_req, res) => {
    sendData(res, { latitude: 0, longitude: 0 });
  }),
);
