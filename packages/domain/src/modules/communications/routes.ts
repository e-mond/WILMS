import { Router } from 'express';
import { z } from 'zod';
import { PERMISSION } from '@wilms/shared-rbac';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as communicationsService from './service.js';
import * as attachmentsService from './attachments.service.js';

export const communicationsRouter = Router();

function mapServiceError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      throw new AppError('Resource not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    if (error.message.startsWith('VALIDATION:')) {
      throw new AppError(error.message.slice('VALIDATION:'.length), ERROR_CODE.VALIDATION, 422);
    }
  }
  throw error;
}

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

const updateTemplateSchema = createTemplateSchema.partial();

const previewTemplateSchema = z.object({
  subject: z.string().optional().default(''),
  bodyHtml: z.string().optional().default(''),
  bodyText: z.string().optional(),
  sampleVariables: z.record(z.string()).optional(),
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
  recurrenceRule: z.string().optional(),
  recurrenceTimezone: z.string().optional(),
  attachmentIds: z.array(z.string()).optional(),
});

const attachmentSchema = z.object({
  messageId: z.string().optional(),
  uploadId: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  url: z.string().url().optional(),
});

const replaceAttachmentSchema = attachmentSchema.omit({ messageId: true });

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

communicationsRouter.patch(
  '/communications/templates/:id',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(updateTemplateSchema),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await communicationsService.updateTemplate(req.params.id!, {
          ...(req.body as z.infer<typeof updateTemplateSchema>),
          createdByUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapServiceError(error);
    }
  }),
);

communicationsRouter.post(
  '/communications/templates/:id/duplicate',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    try {
      sendData(
        res,
        await communicationsService.duplicateTemplate(req.params.id!, req.session!.userId),
        201,
      );
    } catch (error) {
      mapServiceError(error);
    }
  }),
);

communicationsRouter.get(
  '/communications/templates/:id/versions',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    sendData(res, await communicationsService.listTemplateVersions(req.params.id!));
  }),
);

communicationsRouter.post(
  '/communications/templates/preview',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(previewTemplateSchema),
  asyncHandler(async (req, res) => {
    sendData(
      res,
      await communicationsService.previewCommunicationTemplate(
        req.body as z.infer<typeof previewTemplateSchema>,
      ),
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
    try {
      sendData(
        res,
        await communicationsService.sendMessage(req.params.id!, req.session!.userId),
      );
    } catch (error) {
      mapServiceError(error);
    }
  }),
);

communicationsRouter.get(
  '/communications/messages/:id/attachments',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    sendData(res, await attachmentsService.listMessageAttachments(req.params.id!));
  }),
);

communicationsRouter.post(
  '/communications/attachments',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(attachmentSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof attachmentSchema>;
    try {
      sendData(
        res,
        await attachmentsService.createMessageAttachment({
          ...body,
          url: body.url ?? '',
          createdByUserId: req.session!.userId,
        }),
        201,
      );
    } catch (error) {
      mapServiceError(error);
    }
  }),
);

communicationsRouter.delete(
  '/communications/attachments/:id',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  asyncHandler(async (req, res) => {
    try {
      await attachmentsService.deleteMessageAttachment(req.params.id!, req.session!.userId);
      sendData(res, { ok: true });
    } catch (error) {
      mapServiceError(error);
    }
  }),
);

communicationsRouter.patch(
  '/communications/attachments/:id',
  requireAuth,
  requirePermission(PERMISSION.MANAGE_COMMUNICATIONS),
  validateBody(replaceAttachmentSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof replaceAttachmentSchema>;
    try {
      sendData(
        res,
        await attachmentsService.replaceMessageAttachment({
          attachmentId: req.params.id!,
          ...body,
          url: body.url ?? '',
          actorUserId: req.session!.userId,
        }),
      );
    } catch (error) {
      mapServiceError(error);
    }
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
