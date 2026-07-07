import { Router } from 'express';
import { z } from 'zod';
import { PERMISSION } from '@wilms/shared-rbac';
import { asyncHandler } from '../../http/async-handler.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as communicationsService from './service.js';

export const communicationsRouter = Router();

const channelSchema = z.enum(['EMAIL', 'SMS', 'IN_APP']);
const audienceSchema = z.enum([
  'ALL_USERS',
  'ALL_BORROWERS',
  'ALL_COLLECTORS',
  'ALL_OFFICERS',
  'ALL_APPROVERS',
  'ALL_ADMINS',
  'SPECIFIC_USER',
  'SPECIFIC_GROUP',
  'CUSTOM',
]);

const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  channels: z.array(channelSchema).min(1),
});

const createMessageSchema = z.object({
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  channels: z.array(channelSchema).min(1),
  audienceType: audienceSchema,
  audienceFilter: z.record(z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional(),
  templateId: z.string().optional(),
});

communicationsRouter.get(
  '/communications/templates',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (_req, res) => {
    sendData(res, await communicationsService.listTemplates());
  }),
);

communicationsRouter.post(
  '/communications/templates',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(createTemplateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createTemplateSchema>;
    sendData(
      res,
      await communicationsService.createTemplate({
        ...body,
        createdByUserId: req.session!.userId,
      }),
      201,
    );
  }),
);

communicationsRouter.get(
  '/communications/messages',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    const status = req.query.status as communicationsService.MessageStatus | undefined;
    sendData(res, await communicationsService.listMessages({ status }));
  }),
);

communicationsRouter.post(
  '/communications/messages',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(createMessageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createMessageSchema>;
    sendData(
      res,
      await communicationsService.createMessage({
        ...body,
        createdByUserId: req.session!.userId,
      }),
      201,
    );
  }),
);

communicationsRouter.post(
  '/communications/messages/:id/send',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await communicationsService.sendMessage(req.params.id!, req.session!.userId),
    );
  }),
);

communicationsRouter.get(
  '/communications/analytics',
  requireAuth,
  requirePermission(PERMISSION.VIEW_COMMUNICATION_ANALYTICS),
  asyncHandler(async (_req, res) => {
    sendData(res, await communicationsService.getDeliveryAnalytics());
  }),
);

communicationsRouter.get(
  '/communications/delivery-logs',
  requireAuth,
  requirePermission(PERMISSION.VIEW_COMMUNICATION_ANALYTICS),
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const rows = await communicationsService.searchDeliveryLogs(query);
    sendData(res, rows);
  }),
);

communicationsRouter.get(
  '/communications/failed',
  requireAuth,
  requirePermission(PERMISSION.VIEW_COMMUNICATION_ANALYTICS),
  asyncHandler(async (_req, res) => {
    sendData(res, await communicationsService.listFailedDeliveries());
  }),
);

communicationsRouter.post(
  '/communications/scheduler/run',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATION_SCHEDULER),
  asyncHandler(async (_req, res) => {
    sendData(res, { processed: await communicationsService.processScheduledMessages() });
  }),
);
