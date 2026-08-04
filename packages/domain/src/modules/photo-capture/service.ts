import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { logger } from '../../infrastructure/logging/logger.js';
import * as photoCaptureRepository from '../../repositories/photo-capture.repository.js';

export interface PhotoCaptureSession {
  sessionToken: string;
  captureUrl: string;
  expiresAt: string;
  status: 'PENDING' | 'CAPTURED' | 'EXPIRED';
  uploadId?: string;
  previewUrl?: string;
  capturedFileName?: string;
  capturedMimeType?: string;
  capturedDataUrl?: string;
}

export interface CreatePhotoCaptureSessionInput {
  registrationSessionId: string;
  officerId: string;
  target: 'borrower' | 'guarantor';
}

const DEFAULT_APP_URL = 'https://wilms.vercel.app';

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('DATABASE_REQUIRED');
  }
}

function resolveCaptureUrl(sessionToken: string): string {
  const base = (env.appUrl ?? DEFAULT_APP_URL).replace(/\/$/, '');
  return `${base}/capture/${sessionToken}`;
}

function createToken(): string {
  return `pcs_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function toApiSession(record: photoCaptureRepository.PhotoCaptureSessionRecord): PhotoCaptureSession {
  return {
    sessionToken: record.sessionToken,
    captureUrl: resolveCaptureUrl(record.sessionToken),
    expiresAt: record.expiresAt,
    status: record.status,
    uploadId: record.uploadId ?? undefined,
    previewUrl: record.previewUrl ?? undefined,
  };
}

function expireIfNeeded(session: PhotoCaptureSession): PhotoCaptureSession {
  if (session.status === 'PENDING' && new Date(session.expiresAt).getTime() <= Date.now()) {
    return { ...session, status: 'EXPIRED' };
  }

  return session;
}

export async function createSession(
  input: CreatePhotoCaptureSessionInput,
): Promise<PhotoCaptureSession> {
  requireDatabase();

  const sessionToken = createToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const record = await photoCaptureRepository.insertPhotoCaptureSession({
    sessionToken,
    registrationSessionId: input.registrationSessionId,
    officerId: input.officerId,
    target: input.target,
    expiresAt,
  });

  logger.info('photoCapture.session.created', {
    sessionToken,
    registrationSessionId: input.registrationSessionId,
    target: input.target,
    expiresAt: expiresAt.toISOString(),
  });

  return toApiSession(record);
}

export async function getSession(sessionToken: string): Promise<PhotoCaptureSession | null> {
  requireDatabase();

  const record = await photoCaptureRepository.getPhotoCaptureSession(sessionToken);

  if (!record) {
    logger.warn('photoCapture.session.notFound', { sessionToken });
    return null;
  }

  let session = expireIfNeeded(toApiSession(record));

  if (session.status === 'EXPIRED' && record.status === 'PENDING') {
    const expired = await photoCaptureRepository.updatePhotoCaptureSession(sessionToken, {
      status: 'EXPIRED',
    });
    session = expired ? expireIfNeeded(toApiSession(expired)) : session;
  }

  return session;
}

export async function completeSession(input: {
  sessionToken: string;
  uploadId: string;
  previewUrl: string;
  fileName?: string;
  mimeType?: string;
}): Promise<PhotoCaptureSession | null> {
  requireDatabase();

  const updated = await photoCaptureRepository.updatePhotoCaptureSession(input.sessionToken, {
    status: 'CAPTURED',
    uploadId: input.uploadId,
    previewUrl: input.previewUrl,
  });

  if (updated) {
    logger.info('photoCapture.session.completed', {
      sessionToken: input.sessionToken,
      uploadId: input.uploadId,
    });
  }

  return updated ? toApiSession(updated) : null;
}
