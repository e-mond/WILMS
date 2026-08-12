import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as locationService from './service.js';

export const locationsRouter = Router();
const communitySuggestionSchema = z.object({
  districtId: z.string().uuid().optional(),
  electoralAreaId: z.string().uuid().optional(),
  proposedName: z.string().trim().min(2).max(120),
});

/** Static Ghana reference data — no auth required (same dataset as registration offline fallback). */
locationsRouter.get(
  '/locations/regions',
  asyncHandler(async (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listRegions());
  }),
);

locationsRouter.get(
  '/locations/regions/:id/districts',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listDistricts(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/districts/:id/communities',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listCommunities(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/districts/:id/cities',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listCommunities(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/districts/:id/sub-district-units',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listSubDistrictUnits(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/districts/:id/electoral-areas',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listElectoralAreas({ districtId: req.params.id! }));
  }),
);

locationsRouter.get(
  '/locations/sub-district-units/:id/electoral-areas',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listElectoralAreas({ subDistrictUnitId: req.params.id! }));
  }),
);

locationsRouter.get(
  '/locations/electoral-areas/:id/communities',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    sendData(res, await locationService.listCommunitiesByElectoralArea(req.params.id!));
  }),
);

locationsRouter.get(
  '/locations/search',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    sendData(res, await locationService.searchLocations(String(req.query.q ?? '')));
  }),
);

locationsRouter.get(
  '/locations/autocomplete',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    const limit = Number(req.query.limit ?? 12);
    sendData(
      res,
      await locationService.autocompleteLocations(
        String(req.query.q ?? ''),
        Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 40) : 12,
      ),
    );
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

locationsRouter.post(
  '/locations/community-suggestions',
  validateBody(communitySuggestionSchema),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await locationService.suggestCommunity({
        districtId: req.body.districtId,
        electoralAreaId: req.body.electoralAreaId,
        proposedName: req.body.proposedName,
        proposedByUserId: req.session?.userId,
      }),
      201,
    );
  }),
);

locationsRouter.get(
  '/locations/sync/status',
  requirePermission(
    PERMISSION.VIEW_REPORTS,
    PERMISSION.ACCESS_ADMIN_PORTAL,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    sendData(res, await locationService.getSyncStatus());
  }),
);
