import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { permissionSetHasAny } from '../../infrastructure/permissions/resolve-user-permissions.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { getRequestPermissions } from '../../middleware/request-permissions.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as borrowerUpdateService from './service.js';
import type { BorrowerUpdateStatus } from '../../repositories/borrower-update-request.repository.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Borrower update request not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('FORBIDDEN:')) {
    throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 400);
  }
  throw error;
}

export const borrowerUpdatesRouter = Router();

borrowerUpdatesRouter.use(requireAuth);

borrowerUpdatesRouter.get(
  '/borrower-update-requests',
  requirePermission(
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_REGISTRATION_PORTAL,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (req, res) => {
    const permissions = await getRequestPermissions(req);
    const canReview = permissionSetHasAny(permissions, [
      PERMISSION.ACCESS_REGISTRATION_PORTAL,
      PERMISSION.MANAGE_SYSTEM_SETTINGS,
    ]);
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const statuses = statusParam
      ? (statusParam.split(',').map((value) => value.trim()) as BorrowerUpdateStatus[])
      : undefined;

    sendData(res, {
      requests: await borrowerUpdateService.listBorrowerUpdateRequests({
        actorUserId: req.session!.userId,
        scope: canReview && req.query.mine !== '1' ? 'all' : 'own',
        statuses,
      }),
    });
  }),
);

borrowerUpdatesRouter.post(
  '/borrower-update-requests',
  requirePermission(PERMISSION.ACCESS_COLLECTOR_PORTAL, PERMISSION.VIEW_ASSIGNED_BORROWERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerUpdateService.createBorrowerUpdateRequest({
          borrowerId: String(req.body?.borrowerId ?? ''),
          field: String(req.body?.field ?? ''),
          afterValue: String(req.body?.afterValue ?? ''),
          reason: String(req.body?.reason ?? ''),
          requestedByUserId: req.session!.userId,
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowerUpdatesRouter.post(
  '/borrower-update-requests/:id/approve',
  requirePermission(PERMISSION.ACCESS_REGISTRATION_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerUpdateService.approveBorrowerUpdateRequest(
          req.params.id!,
          req.session!.userId,
          typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : null,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

borrowerUpdatesRouter.post(
  '/borrower-update-requests/:id/reject',
  requirePermission(PERMISSION.ACCESS_REGISTRATION_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await borrowerUpdateService.rejectBorrowerUpdateRequest(
          req.params.id!,
          req.session!.userId,
          typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : null,
        ),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
