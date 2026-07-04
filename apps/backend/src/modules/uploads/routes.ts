import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../http/async-handler.js';
import { AppError, ERROR_CODE } from '../../http/errors.js';
import { sendData } from '../../http/response.js';
import {
  deleteStoredUpload,
  getUploadProvider,
  getUploadRecord,
  isCloudinaryConfigured,
  readUploadBuffer,
  resolveUploadAccessUrl,
  saveUpload,
  toUploadRecord,
  validateUploadInput,
} from '../../infrastructure/uploads/index.js';
import { PERMISSION, roleHasPermission } from '../../infrastructure/permissions/matrix.js';
import type { SessionUser } from '../../middleware/authenticate.js';
import { requireAuth } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate-body.js';
import { isDatabaseEnabled } from '../../db/client.js';
import * as uploadRepository from '../../repositories/upload.repository.js';

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

function isCloudinaryDeliveryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/');
}

async function assertUploadAccess(uploadId: string, session: SessionUser): Promise<void> {
  if (roleHasPermission(session.role, PERMISSION.ACCESS_ADMIN_PORTAL)) {
    return;
  }

  const stored = await getUploadRecord(uploadId);
  const reviewPurposes = new Set(['borrower-photo', 'guarantor-photo', 'profile-photo', 'document']);

  if (
    stored &&
    reviewPurposes.has(stored.purpose) &&
    (roleHasPermission(session.role, PERMISSION.ACCESS_APPROVER_PORTAL) ||
      roleHasPermission(session.role, PERMISSION.ACCESS_AUDITOR_PORTAL) ||
      roleHasPermission(session.role, PERMISSION.REGISTER_BORROWERS))
  ) {
    return;
  }

  if (!isDatabaseEnabled()) {
    return;
  }

  const ownerUserId = await uploadRepository.findUploadOwnerById(uploadId);

  if (ownerUserId === undefined) {
    throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
  }

  if (ownerUserId !== null && ownerUserId !== session.userId) {
    throw new AppError('You do not have access to this upload.', ERROR_CODE.UNAUTHORIZED, 403);
  }

  if (ownerUserId === null) {
    throw new AppError('You do not have access to this upload.', ERROR_CODE.UNAUTHORIZED, 403);
  }
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

    const params = await provider.getSignedUploadParams();
    sendData(res, {
      cloudName: params.cloudName,
      apiKey: params.apiKey,
      timestamp: params.timestamp,
      signature: params.signature,
      folder: params.folder,
    });
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
    const stored = await saveUpload({
      purpose: input.purpose,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      entityId: input.entityId,
      buffer,
      ownerUserId: req.session?.userId,
    });

    sendData(res, toUploadRecord(stored), 201);
  }),
);

uploadsRouter.get(
  '/uploads/:id',
  asyncHandler(async (req, res) => {
    await assertUploadAccess(req.params.id!, req.session!);
    const stored = await getUploadRecord(req.params.id!);

    if (!stored) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    const record = toUploadRecord(stored);
    sendData(res, {
      ...record,
      url: resolveUploadAccessUrl(stored) ?? record.url,
    });
  }),
);

uploadsRouter.post(
  '/uploads/:id/delete',
  asyncHandler(async (req, res) => {
    await assertUploadAccess(req.params.id!, req.session!);
    const deleted = await deleteStoredUpload(req.params.id!);

    if (!deleted) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    res.status(204).end();
  }),
);

uploadsRouter.get(
  '/uploads/:id/content',
  asyncHandler(async (req, res) => {
    await assertUploadAccess(req.params.id!, req.session!);
    const stored = await getUploadRecord(req.params.id!);

    if (!stored) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    if (isCloudinaryDeliveryUrl(stored.url)) {
      res.redirect(302, stored.url);
      return;
    }

    const buffer = await readUploadBuffer(req.params.id!);

    if (!buffer) {
      throw new AppError('Upload not found.', ERROR_CODE.NOT_FOUND, 404);
    }

    res.setHeader('Content-Type', stored.mimeType);
    res.send(buffer);
  }),
);
