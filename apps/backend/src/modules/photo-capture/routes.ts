import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import { PERMISSION } from '../../infrastructure/permissions/matrix.js';
import {
  saveUpload,
  toUploadRecord,
  validateUploadInput,
} from '../../infrastructure/uploads/index.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { validateBody } from '../../middleware/validate-body.js';
import * as photoCaptureService from './service.js';

const uploadSchema = z.object({
  purpose: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  dataUrl: z.string().min(1),
});

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

  if (!match) {
    throw new AppError('Invalid upload payload.', ERROR_CODE.VALIDATION, 422);
  }

  return Buffer.from(match[2]!, 'base64');
}

export const photoCaptureRouter = Router();

photoCaptureRouter.post(
  '/registration/capture-sessions',
  requireAuth,
  requirePermission(PERMISSION.CAPTURE_DOCUMENTS),
  asyncHandler(async (req, res) => {
    sendData(res, await photoCaptureService.createSession(req.body), 201);
  }),
);

photoCaptureRouter.get(
  '/registration/capture-sessions/:token',
  requireAuth,
  requirePermission(PERMISSION.CAPTURE_DOCUMENTS),
  asyncHandler(async (req, res) => {
    const session = await photoCaptureService.getSession(req.params.token!);
    if (!session) {
      throw new AppError('Capture session not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    sendData(res, session);
  }),
);

photoCaptureRouter.get(
  '/photo-capture/sessions/:token',
  asyncHandler(async (req, res) => {
    const session = await photoCaptureService.getSession(req.params.token!);
    if (!session) {
      throw new AppError('Capture session not found.', ERROR_CODE.NOT_FOUND, 404);
    }
    sendData(res, session);
  }),
);

photoCaptureRouter.post(
  '/photo-capture/sessions/:token/upload',
  validateBody(uploadSchema),
  asyncHandler(async (req, res) => {
    const session = await photoCaptureService.getSession(req.params.token!);

    if (!session) {
      throw new AppError('Capture session not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    if (session.status === 'EXPIRED') {
      throw new AppError('Capture session has expired.', ERROR_CODE.VALIDATION, 422);
    }

    if (session.status === 'CAPTURED') {
      sendData(res, session);
      return;
    }

    const body = req.body as z.infer<typeof uploadSchema>;
    validateUploadInput(body);
    const buffer = decodeDataUrl(body.dataUrl);
    const stored = await saveUpload({
      purpose: body.purpose,
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      buffer,
      ownerUserId: undefined,
    });
    const record = toUploadRecord(stored);
    const previewUrl = `/uploads/${record.id}/content`;

    const completed = await photoCaptureService.completeSession({
      sessionToken: req.params.token!,
      uploadId: record.id,
      previewUrl,
      fileName: body.fileName,
      mimeType: body.mimeType,
    });

    sendData(res, completed, 201);
  }),
);
