import { Router } from 'express';
import { z } from 'zod';
import { PERMISSION } from '@wilms/shared-rbac';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as notificationService from './service.js';
import * as pushService from './push.service.js';
import * as preferencesService from './preferences.service.js';
import * as paymentSchedulerService from './payment-scheduler.service.js';

export const notificationsRouter = Router();

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  marketingEnabled: z.boolean().optional(),
  announcementsEnabled: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  loanNotifications: z.boolean().optional(),
  paymentNotifications: z.boolean().optional(),
  approvalNotifications: z.boolean().optional(),
  registrationNotifications: z.boolean().optional(),
  digestFrequency: z.enum(['INSTANT', 'DAILY', 'WEEKLY']).optional(),
});

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/notifications/inbox',
  asyncHandler(async (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const offset = typeof req.query.offset === 'string' ? Number(req.query.offset) : undefined;
    sendData(
      res,
      await notificationService.listInbox(req.session!.userId, {
        limit: Number.isFinite(limit) ? limit : undefined,
        offset: Number.isFinite(offset) ? offset : undefined,
      }),
    );
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
  '/notifications/mark-all-read',
  asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.session!.userId);
    sendData(res, { ok: true });
  }),
);

notificationsRouter.delete(
  '/notifications/:id',
  asyncHandler(async (req, res) => {
    await notificationService.archiveNotification(req.params.id!, req.session!.userId);
    sendData(res, { ok: true });
  }),
);

notificationsRouter.post(
  '/notifications',
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS, PERMISSION.MANAGE_USERS),
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

notificationsRouter.get(
  '/notifications/preferences',
  asyncHandler(async (req, res) => {
    sendData(res, await preferencesService.getNotificationPreferences(req.session!.userId));
  }),
);

notificationsRouter.patch(
  '/notifications/preferences',
  validateBody(preferencesSchema),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await preferencesService.updateNotificationPreferences(
        req.session!.userId,
        req.body as z.infer<typeof preferencesSchema>,
      ),
    );
  }),
);

notificationsRouter.post(
  '/notifications/push/subscribe',
  validateBody(pushSubscriptionSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof pushSubscriptionSchema>;
    await pushService.savePushSubscription(req.session!.userId, {
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: req.get('user-agent'),
    });
    sendData(res, { ok: true });
  }),
);

notificationsRouter.post(
  '/notifications/push/unsubscribe',
  asyncHandler(async (req, res) => {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
    if (endpoint) {
      await pushService.removePushSubscription(req.session!.userId, endpoint);
    }
    sendData(res, { ok: true });
  }),
);

notificationsRouter.get(
  '/notifications/push/vapid-public-key',
  asyncHandler(async (_req, res) => {
    sendData(res, { publicKey: process.env.VAPID_PUBLIC_KEY?.trim() ?? null });
  }),
);

notificationsRouter.post(
  '/notifications/scheduler/run',
  requirePermission(PERMISSION.MANAGE_COMMUNICATION_SCHEDULER),
  asyncHandler(async (req, res) => {
    const referenceDate =
      typeof req.body?.referenceDate === 'string' ? req.body.referenceDate : undefined;
    sendData(res, await paymentSchedulerService.processPaymentNotificationJobs(referenceDate));
  }),
);
