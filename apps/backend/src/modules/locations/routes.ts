import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import {
  getGhanaCities,
  getGhanaDistricts,
  getGhanaRegions,
} from '../../lib/ghana-locations.js';

export const locationsRouter = Router();

locationsRouter.use(requireAuth);

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
  '/locations/current',
  asyncHandler(async (_req, res) => {
    sendData(res, { latitude: 0, longitude: 0 });
  }),
);
