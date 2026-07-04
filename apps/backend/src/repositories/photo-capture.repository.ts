import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { photoCaptureSessions } from '../db/schema/photo-capture-sessions.js';

export interface PhotoCaptureSessionRecord {
  sessionToken: string;
  registrationSessionId: string;
  officerId: string;
  target: string;
  status: 'PENDING' | 'CAPTURED' | 'EXPIRED';
  uploadId: string | null;
  previewUrl: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: typeof photoCaptureSessions.$inferSelect): PhotoCaptureSessionRecord {
  return {
    sessionToken: row.sessionToken,
    registrationSessionId: row.registrationSessionId,
    officerId: row.officerId,
    target: row.target,
    status: row.status as PhotoCaptureSessionRecord['status'],
    uploadId: row.uploadId ?? null,
    previewUrl: row.previewUrl ?? null,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function insertPhotoCaptureSession(input: {
  sessionToken: string;
  registrationSessionId: string;
  officerId: string;
  target: string;
  expiresAt: Date;
}): Promise<PhotoCaptureSessionRecord> {
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .insert(photoCaptureSessions)
    .values({
      sessionToken: input.sessionToken,
      registrationSessionId: input.registrationSessionId,
      officerId: input.officerId,
      target: input.target,
      status: 'PENDING',
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rowToRecord(row!);
}

export async function getPhotoCaptureSession(
  sessionToken: string,
): Promise<PhotoCaptureSessionRecord | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(photoCaptureSessions)
    .where(eq(photoCaptureSessions.sessionToken, sessionToken))
    .limit(1);

  return row ? rowToRecord(row) : undefined;
}

export async function updatePhotoCaptureSession(
  sessionToken: string,
  patch: Partial<Pick<PhotoCaptureSessionRecord, 'status' | 'uploadId' | 'previewUrl'>>,
): Promise<PhotoCaptureSessionRecord | undefined> {
  const db = getDb();
  const [row] = await db
    .update(photoCaptureSessions)
    .set({
      status: patch.status,
      uploadId: patch.uploadId ?? undefined,
      previewUrl: patch.previewUrl ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(photoCaptureSessions.sessionToken, sessionToken))
    .returning();

  return row ? rowToRecord(row) : undefined;
}
