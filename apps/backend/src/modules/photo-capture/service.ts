import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { isDatabaseEnabled } from '../../db/client.js';
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

const memorySessions = new Map<string, PhotoCaptureSession>();

function buildSessionKey(input: CreatePhotoCaptureSessionInput): string {
  return `${input.registrationSessionId}:${input.target}`;
}

function createToken(): string {
  return `pcs_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function resolveCaptureUrl(sessionToken: string): string {
  const base = env.appUrl?.replace(/\/$/, '') ?? '';
  return base ? `${base}/capture/${sessionToken}` : `/capture/${sessionToken}`;
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
  if (session.status === 'PENDING' && new Date(session.expiresAt) < new Date()) {
    return { ...session, status: 'EXPIRED' };
  }

  return session;
}

export async function createSession(
  input: CreatePhotoCaptureSessionInput,
): Promise<PhotoCaptureSession> {
  const sessionToken = createToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  if (isDatabaseEnabled()) {
    const record = await photoCaptureRepository.insertPhotoCaptureSession({
      sessionToken,
      registrationSessionId: input.registrationSessionId,
      officerId: input.officerId,
      target: input.target,
      expiresAt,
    });

    return toApiSession(record);
  }

  const session: PhotoCaptureSession = {
    sessionToken,
    captureUrl: resolveCaptureUrl(sessionToken),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  memorySessions.set(buildSessionKey(input), session);
  memorySessions.set(sessionToken, session);
  return { ...session };
}

export async function getSession(sessionToken: string): Promise<PhotoCaptureSession | null> {
  if (isDatabaseEnabled()) {
    const record = await photoCaptureRepository.getPhotoCaptureSession(sessionToken);

    if (!record) {
      return null;
    }

    let session = toApiSession(record);

    if (session.status === 'PENDING' && new Date(session.expiresAt) < new Date()) {
      const expired = await photoCaptureRepository.updatePhotoCaptureSession(sessionToken, {
        status: 'EXPIRED',
      });
      session = expired ? toApiSession(expired) : { ...session, status: 'EXPIRED' };
    }

    return session;
  }

  const session = memorySessions.get(sessionToken);
  if (!session) {
    return null;
  }

  const next = expireIfNeeded(session);
  memorySessions.set(sessionToken, next);
  return { ...next };
}

export async function completeSession(input: {
  sessionToken: string;
  uploadId: string;
  previewUrl: string;
  fileName?: string;
  mimeType?: string;
}): Promise<PhotoCaptureSession | null> {
  if (isDatabaseEnabled()) {
    const updated = await photoCaptureRepository.updatePhotoCaptureSession(input.sessionToken, {
      status: 'CAPTURED',
      uploadId: input.uploadId,
      previewUrl: input.previewUrl,
    });

    return updated ? toApiSession(updated) : null;
  }

  const session = memorySessions.get(input.sessionToken);
  if (!session) {
    return null;
  }

  const updated: PhotoCaptureSession = {
    ...session,
    status: 'CAPTURED',
    uploadId: input.uploadId,
    previewUrl: input.previewUrl,
    capturedFileName: input.fileName,
    capturedMimeType: input.mimeType,
  };

  memorySessions.set(input.sessionToken, updated);
  return { ...updated };
}
