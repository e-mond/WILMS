import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import {
  getUploadProvider,
  isCloudinaryConfigured,
  toUploadRecord,
  validateUploadInput,
} from '../../infrastructure/uploads/index.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate-body.js';

const uploadSchema = z.object({
  purpose: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  dataUrl: z.string().optional(),
  entityId: z.string().optional(),
});

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

  if (!match) {
    throw new AppError('Invalid upload payload.', ERROR_CODE.VALIDATION, 422);
  }

  return Buffer.from(match[2]!, 'base64');
}

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.get(
  '/uploads/signature',
  asyncHandler(async (_req, res) => {
    if (!isCloudinaryConfigured()) {
      throw new AppError('Cloudinary is not configured.', ERROR_CODE.NOT_FOUND, 404);
    }

    const provider = getUploadProvider();

    if (!provider.getSignedUploadParams) {
      throw new AppError('Signed uploads are not supported.', ERROR_CODE.NOT_FOUND, 404);
    }

    sendData(res, await provider.getSignedUploadParams());
  }),
);

uploadsRouter.post(
  '/uploads',
  validateBody(uploadSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof uploadSchema>;

    if (!input.dataUrl) {
      throw new AppError('Upload payload requires dataUrl until multipart is enabled.', ERROR_CODE.VALIDATION, 422);
    }

    try {
      validateUploadInput({ mimeType: input.mimeType, sizeBytes: input.sizeBytes });
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^VALIDATION:/, '') : 'Invalid upload.';
      throw new AppError(message, ERROR_CODE.VALIDATION, 422);
    }

    const buffer = decodeDataUrl(input.dataUrl);
    const stored = await getUploadProvider().save({
      purpose: input.purpose,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      entityId: input.entityId,
      buffer,
    });

    sendData(res, toUploadRecord(stored), 201);
  }),
);

uploadsRouter.get(
  '/uploads/:id',
  asyncHandler(async (req, res) => {
    const stored = await getUploadProvider().get(req.params.id!);

    if (!stored) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    sendData(res, toUploadRecord(stored));
  }),
);

uploadsRouter.post(
  '/uploads/:id/delete',
  asyncHandler(async (req, res) => {
    const deleted = await getUploadProvider().delete(req.params.id!);

    if (!deleted) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    res.status(204).end();
  }),
);

uploadsRouter.get(
  '/uploads/:id/content',
  asyncHandler(async (req, res) => {
    const stored = await getUploadProvider().get(req.params.id!);

    if (!stored) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    const buffer = await getUploadProvider().readBuffer(req.params.id!);

    if (!buffer) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    res.setHeader('Content-Type', stored.mimeType);
    res.send(buffer);
  }),
);
