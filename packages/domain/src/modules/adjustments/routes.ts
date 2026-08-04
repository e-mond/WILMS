/**
 * P14.3B Phase 2 — Financial adjustments HTTP routes.
 *
 * RBAC:
 * - Create: RECORD_COLLECTIONS (collector-initiated corrections)
 * - List / detail / approve / reject: ACCESS_ADMIN_PORTAL (super-admin review)
 */
import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { mapFinancialRouteError } from '../../http/map-financial-error.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as adjustmentService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Adjustment request not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  mapFinancialRouteError(error);
}

export const adjustmentsRouter = Router();

adjustmentsRouter.use(requireAuth);

adjustmentsRouter.get(
  '/adjustments/pending',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await adjustmentService.listPendingAdjustments());
    } catch (error) {
      mapError(error);
    }
  }),
);

adjustmentsRouter.get(
  '/adjustments',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await adjustmentService.listAdjustments());
    } catch (error) {
      mapError(error);
    }
  }),
);

adjustmentsRouter.get(
  '/adjustments/:id',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await adjustmentService.getAdjustment(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

adjustmentsRouter.post(
  '/adjustments',
  requirePermission(PERMISSION.RECORD_COLLECTIONS),
  validateBody(adjustmentService.createAdjustmentSchema),
  asyncHandler(async (req, res) => {
    try {
      const idempotencyKey = req.header('idempotency-key') ?? undefined;
      sendData(res, await adjustmentService.createAdjustment(req.body, idempotencyKey), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

adjustmentsRouter.post(
  '/adjustments/:id/approve',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  validateBody(adjustmentService.reviewActorSchema),
  asyncHandler(async (req, res) => {
    try {
      const idempotencyKey = req.header('idempotency-key') ?? undefined;
      const { actorId, actorDisplayName } = req.body;
      sendData(
        res,
        await adjustmentService.approveAdjustment(
          req.params.id!,
          actorId,
          actorDisplayName,
          idempotencyKey,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

adjustmentsRouter.post(
  '/adjustments/:id/reject',
  requirePermission(PERMISSION.ACCESS_ADMIN_PORTAL),
  validateBody(adjustmentService.rejectAdjustmentSchema),
  asyncHandler(async (req, res) => {
    try {
      const { reason, actorId, actorDisplayName } = req.body;
      sendData(
        res,
        await adjustmentService.rejectAdjustment(req.params.id!, reason, actorId, actorDisplayName),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
