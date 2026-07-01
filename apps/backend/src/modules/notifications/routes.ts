import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import * as notificationService from './service.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/notifications/inbox',
  asyncHandler(async (req, res) => {
    sendData(res, await notificationService.listInbox(req.session!.userId));
  }),
);

notificationsRouter.get(
  '/notifications/inbox/unread-count',
  asyncHandler(async (req, res) => {
    sendData(res, await notificationService.getUnreadCount(req.session!.userId));
  }),
);

notificationsRouter.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id!, req.session!.userId);
    sendData(res, { ok: true });
  }),
);

notificationsRouter.post(
  '/notifications',
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await notificationService.sendNotification(req.session!.userId, req.body),
      201,
    );
  }),
);

notificationsRouter.post(
  '/notifications/supervisor-alert',
  requirePermission(PERMISSION.RECORD_COLLECTIONS, PERMISSION.MANAGE_USERS),
  asyncHandler(async (req, res) => {
    await notificationService.sendSupervisorAlert(req.body);
    sendData(res, { ok: true });
  }),
);
