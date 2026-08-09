import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { permissionSetHasAny } from '../../infrastructure/permissions/resolve-user-permissions.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { getRequestPermissions } from '../../middleware/request-permissions.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as holidayRequestService from './service.js';
import type { HolidayRequestStatus } from '../../repositories/holiday-request.repository.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Holiday request not found.', ERROR_CODE.NOT_FOUND, 404);
  }
  if (error instanceof Error && error.message.startsWith('FORBIDDEN:')) {
    throw new AppError(error.message.slice('FORBIDDEN:'.length), ERROR_CODE.FORBIDDEN, 403);
  }
  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 400);
  }
  if (error instanceof Error && error.message.startsWith('SCHEMA_MISSING:')) {
    throw new AppError(error.message.slice('SCHEMA_MISSING:'.length), ERROR_CODE.SERVER, 503);
  }
  if (error instanceof Error && error.message === 'DATABASE_REQUIRED') {
    throw new AppError(
      'Holiday requests require a connected database. Try again shortly.',
      ERROR_CODE.SERVER,
      503,
    );
  }
  throw error;
}

export const holidayRequestsRouter = Router();

holidayRequestsRouter.use(requireAuth);

holidayRequestsRouter.get(
  '/holiday-requests',
  requirePermission(
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_APPROVER_PORTAL,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (req, res) => {
    const permissions = await getRequestPermissions(req);
    const canReview = permissionSetHasAny(permissions, [
      PERMISSION.ACCESS_APPROVER_PORTAL,
      PERMISSION.MANAGE_SYSTEM_SETTINGS,
    ]);
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
    const statuses = statusParam
      ? (statusParam.split(',').map((value) => value.trim()) as HolidayRequestStatus[])
      : undefined;

    sendData(res, {
      requests: await holidayRequestService.listHolidayRequests({
        actorUserId: req.session!.userId,
        scope: canReview && req.query.mine !== '1' ? 'all' : 'own',
        statuses,
      }),
    });
  }),
);

holidayRequestsRouter.get(
  '/holiday-requests/preview-impact',
  requirePermission(
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_APPROVER_PORTAL,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.previewHolidayImpact({
          holidayDate: String(req.query.holidayDate ?? ''),
          endDate: typeof req.query.endDate === 'string' ? req.query.endDate : null,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

holidayRequestsRouter.post(
  '/holiday-requests',
  requirePermission(
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
  ),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.createHolidayRequest({
          name: String(req.body?.name ?? ''),
          holidayDate: String(req.body?.holidayDate ?? ''),
          endDate: typeof req.body?.endDate === 'string' ? req.body.endDate : null,
          reason: typeof req.body?.reason === 'string' ? req.body.reason : null,
          notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
          evidenceUrl: typeof req.body?.evidenceUrl === 'string' ? req.body.evidenceUrl : null,
          community: typeof req.body?.community === 'string' ? req.body.community : null,
          groupId: typeof req.body?.groupId === 'string' ? req.body.groupId : null,
          borrowerId: typeof req.body?.borrowerId === 'string' ? req.body.borrowerId : null,
          scope: typeof req.body?.scope === 'string' ? req.body.scope : undefined,
          branch: typeof req.body?.branch === 'string' ? req.body.branch : null,
          requestedByUserId: req.session!.userId,
          submit: Boolean(req.body?.submit),
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

holidayRequestsRouter.patch(
  '/holiday-requests/:id',
  requirePermission(PERMISSION.ACCESS_COLLECTOR_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.updateHolidayRequestDraft(req.params.id!, req.session!.userId, {
          name: typeof req.body?.name === 'string' ? req.body.name : undefined,
          holidayDate: typeof req.body?.holidayDate === 'string' ? req.body.holidayDate : undefined,
          endDate:
            req.body?.endDate === null
              ? null
              : typeof req.body?.endDate === 'string'
                ? req.body.endDate
                : undefined,
          reason:
            req.body?.reason === null
              ? null
              : typeof req.body?.reason === 'string'
                ? req.body.reason
                : undefined,
          notes:
            req.body?.notes === null
              ? null
              : typeof req.body?.notes === 'string'
                ? req.body.notes
                : undefined,
          evidenceUrl:
            req.body?.evidenceUrl === null
              ? null
              : typeof req.body?.evidenceUrl === 'string'
                ? req.body.evidenceUrl
                : undefined,
          community:
            req.body?.community === null
              ? null
              : typeof req.body?.community === 'string'
                ? req.body.community
                : undefined,
          groupId:
            req.body?.groupId === null
              ? null
              : typeof req.body?.groupId === 'string'
                ? req.body.groupId
                : undefined,
          borrowerId:
            req.body?.borrowerId === null
              ? null
              : typeof req.body?.borrowerId === 'string'
                ? req.body.borrowerId
                : undefined,
          scope: typeof req.body?.scope === 'string' ? req.body.scope : undefined,
          branch:
            req.body?.branch === null
              ? null
              : typeof req.body?.branch === 'string'
                ? req.body.branch
                : undefined,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

holidayRequestsRouter.post(
  '/holiday-requests/:id/cancel',
  requirePermission(PERMISSION.ACCESS_COLLECTOR_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.cancelHolidayRequest(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

holidayRequestsRouter.post(
  '/holiday-requests/:id/submit',
  requirePermission(PERMISSION.ACCESS_COLLECTOR_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.submitHolidayRequest(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

holidayRequestsRouter.post(
  '/holiday-requests/:id/approve',
  requirePermission(PERMISSION.ACCESS_APPROVER_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.approveHolidayRequest(
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

holidayRequestsRouter.post(
  '/holiday-requests/:id/reject',
  requirePermission(PERMISSION.ACCESS_APPROVER_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.rejectHolidayRequest(
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

holidayRequestsRouter.post(
  '/holiday-requests/:id/apply',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayRequestService.applyHolidayRequest(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);
