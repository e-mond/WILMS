import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as holidayService from './service.js';

function mapError(error: unknown): never {
  if (error instanceof Error && error.message === 'NOT_FOUND') {
    throw new AppError('Holiday not found.', ERROR_CODE.NOT_FOUND, 404);
  }

  if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
    throw new AppError(error.message.replace('VALIDATION:', ''), ERROR_CODE.VALIDATION, 400);
  }

  throw error;
}

export const organizationHolidaysRouter = Router();

organizationHolidaysRouter.use(requireAuth);

organizationHolidaysRouter.get(
  '/organization-holidays',
  requirePermission(
    PERMISSION.MANAGE_SYSTEM_SETTINGS,
    PERMISSION.ACCESS_COLLECTOR_PORTAL,
    PERMISSION.ACCESS_APPROVER_PORTAL,
    PERMISSION.VIEW_REPORTS,
  ),
  asyncHandler(async (req, res) => {
    const includeDisabled = req.query.includeDisabled === '1';
    await holidayService.ensureCurrentYearGhanaHolidays();
    sendData(res, {
      holidays: await holidayService.listHolidays({ includeDisabled }),
    });
  }),
);

organizationHolidaysRouter.post(
  '/organization-holidays/sync-ghana',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    const year =
      typeof req.body?.year === 'number'
        ? req.body.year
        : Number.parseInt(String(req.body?.year ?? new Date().getUTCFullYear()), 10);
    sendData(res, await holidayService.syncGhanaPublicHolidays(year));
  }),
);

organizationHolidaysRouter.post(
  '/organization-holidays',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayService.createHoliday({
          name: String(req.body?.name ?? ''),
          holidayDate: String(req.body?.holidayDate ?? ''),
          scope: typeof req.body?.scope === 'string' ? req.body.scope : undefined,
          branch: typeof req.body?.branch === 'string' ? req.body.branch : undefined,
        }),
        201,
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

organizationHolidaysRouter.patch(
  '/organization-holidays/:id',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await holidayService.updateHoliday(req.params.id!, {
          name: typeof req.body?.name === 'string' ? req.body.name : undefined,
          holidayDate:
            typeof req.body?.holidayDate === 'string' ? req.body.holidayDate : undefined,
          scope: typeof req.body?.scope === 'string' ? req.body.scope : undefined,
          branch:
            req.body?.branch === null
              ? null
              : typeof req.body?.branch === 'string'
                ? req.body.branch
                : undefined,
          enabled: typeof req.body?.enabled === 'boolean' ? req.body.enabled : undefined,
        }),
      );
    } catch (error) {
      mapError(error);
    }
  }),
);

organizationHolidaysRouter.delete(
  '/organization-holidays/:id',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      await holidayService.removeHoliday(req.params.id!);
      sendData(res, { id: req.params.id, deleted: true });
    } catch (error) {
      mapError(error);
    }
  }),
);
