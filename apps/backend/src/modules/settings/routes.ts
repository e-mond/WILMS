import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { mapServiceError } from '../../http/map-service-error.js';
import * as settingsService from './service.js';

export const settingsRouter = Router();

function mapError(error: unknown): never {
  mapServiceError(error);
}

settingsRouter.use(requireAuth);

settingsRouter.get(
  '/settings',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    sendData(res, await settingsService.getSettings());
  }),
);

settingsRouter.patch(
  '/settings',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.updateSettings(req.body ?? {}, req.session!.userId));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.get(
  '/settings/me',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.getSettingsMe(req.session!.userId));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.patch(
  '/settings/me',
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.updateSettingsMe(req.session!.userId, req.body ?? {}));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/sms/test',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
      sendData(res, await settingsService.sendTestSms(req.session!.userId, phone));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.get(
  '/settings/integrations/status',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    sendData(res, settingsService.getIntegrationsStatus());
  }),
);

settingsRouter.get(
  '/settings/delivery-logs',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await settingsService.getDeliveryLogs({
        event: typeof req.query.event === 'string' ? req.query.event : undefined,
        recipient: typeof req.query.recipient === 'string' ? req.query.recipient : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    );
  }),
);

settingsRouter.get(
  '/settings/sms/balance',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    try {
      sendData(res, await settingsService.getSmsBalance());
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/email/test',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (req, res) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email : '';
      sendData(res, await settingsService.sendTestEmail(req.session!.userId, email));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.get(
  '/settings/users',
  requirePermission(PERMISSION.VIEW_ALL_USERS),
  asyncHandler(async (req, res) => {
    sendData(res, await settingsService.listUsers(req.session!.userId));
  }),
);

settingsRouter.get(
  '/settings/users/:id/profile',
  requirePermission(PERMISSION.VIEW_ALL_USERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.getUserProfile(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.get(
  '/settings/activity',
  requirePermission(PERMISSION.MANAGE_SYSTEM_SETTINGS),
  asyncHandler(async (_req, res) => {
    sendData(res, await settingsService.getSettingsActivity());
  }),
);

settingsRouter.get(
  '/settings/permissions',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (_req, res) => {
    sendData(res, await settingsService.listPermissions());
  }),
);

settingsRouter.get(
  '/settings/roles',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (_req, res) => {
    sendData(res, await settingsService.listRoles());
  }),
);

settingsRouter.post(
  '/settings/roles',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.createRole(req.body), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.patch(
  '/settings/roles/:id',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.updateRole(req.params.id!, req.body ?? {}));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/roles/:id/delete',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    try {
      await settingsService.deleteRole(req.params.id!);
      sendData(res, { ok: true });
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/roles/:id/clone',
  requirePermission(PERMISSION.MANAGE_ROLES),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.cloneRole(req.params.id!), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/users',
  requirePermission(PERMISSION.MANAGE_USERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.createUser(req.body, req.session!.userId), 201);
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.patch(
  '/settings/users/:id',
  requirePermission(PERMISSION.EDIT_USERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.updateUser(req.params.id!, req.body ?? {}));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/users/:id/disable',
  requirePermission(PERMISSION.SUSPEND_USERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.disableUser(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/users/:id/activate',
  requirePermission(PERMISSION.ACTIVATE_USERS),
  asyncHandler(async (req, res) => {
    try {
      sendData(res, await settingsService.activateUser(req.params.id!));
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.post(
  '/settings/users/:id/delete',
  requirePermission(PERMISSION.MANAGE_USERS),
  asyncHandler(async (req, res) => {
    try {
      await settingsService.deleteUser(req.params.id!, req.session!.userId);
      sendData(res, { ok: true });
    } catch (error) {
      mapError(error);
    }
  }),
);

settingsRouter.get(
  '/settings/registration-legal',
  asyncHandler(async (_req, res) => {
    sendData(res, settingsService.getRegistrationLegalConfig());
  }),
);
