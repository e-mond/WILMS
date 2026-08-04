import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { messageAttachments } from '../../db/schema/communication-platform.js';
import { validateAttachmentInput } from '../../infrastructure/notifications/attachment-validation.js';
import {
  deleteStoredUpload,
  getUploadRecord,
  resolveUploadAccessUrlById,
} from '../../infrastructure/uploads/index.js';

export interface MessageAttachmentDto {
  id: string;
  messageId: string | null;
  uploadId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdByUserId: string;
  createdAt: string;
}

const memoryAttachments: MessageAttachmentDto[] = [];

function mapRow(row: typeof messageAttachments.$inferSelect): MessageAttachmentDto {
  return {
    id: row.id,
    messageId: row.messageId,
    uploadId: row.uploadId,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: row.url,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listMessageAttachments(messageId: string): Promise<MessageAttachmentDto[]> {
  if (!isDatabaseEnabled()) {
    return memoryAttachments.filter((entry) => entry.messageId === messageId && entry);
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(messageAttachments)
    .where(and(eq(messageAttachments.messageId, messageId), isNull(messageAttachments.deletedAt)));

  return rows.map(mapRow);
}

export async function createMessageAttachment(input: {
  messageId?: string;
  uploadId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdByUserId: string;
  buffer?: Buffer;
}): Promise<MessageAttachmentDto> {
  validateAttachmentInput({
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    buffer: input.buffer,
  });

  const upload = await getUploadRecord(input.uploadId);
  if (!upload) {
    throw new Error('VALIDATION:Upload record not found.');
  }

  const id = uuidv7();
  const now = new Date();
  const url = input.url || (await resolveUploadAccessUrlById(input.uploadId)) || '';

  const dto: MessageAttachmentDto = {
    id,
    messageId: input.messageId ?? null,
    uploadId: input.uploadId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    url,
    createdByUserId: input.createdByUserId,
    createdAt: now.toISOString(),
  };

  if (!isDatabaseEnabled()) {
    memoryAttachments.push(dto);
    return dto;
  }

  const db = getDb();
  const [row] = await db
    .insert(messageAttachments)
    .values({
      id,
      messageId: input.messageId ?? null,
      uploadId: input.uploadId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      url,
      createdByUserId: input.createdByUserId,
      createdAt: now,
    })
    .returning();

  return mapRow(row!);
}

export async function deleteMessageAttachment(
  attachmentId: string,
  actorUserId: string,
): Promise<void> {
  if (!isDatabaseEnabled()) {
    const index = memoryAttachments.findIndex((entry) => entry.id === attachmentId);
    if (index >= 0) {
      memoryAttachments.splice(index, 1);
    }
    return;
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(messageAttachments)
    .where(and(eq(messageAttachments.id, attachmentId), isNull(messageAttachments.deletedAt)))
    .limit(1);

  if (!row) {
    throw new Error('NOT_FOUND');
  }

  if (row.createdByUserId !== actorUserId) {
    throw new Error('VALIDATION:You do not have permission to delete this attachment.');
  }

  await db
    .update(messageAttachments)
    .set({ deletedAt: new Date() })
    .where(eq(messageAttachments.id, attachmentId));

  try {
    await deleteStoredUpload(row.uploadId);
  } catch {
    // Upload cleanup is best-effort.
  }
}

export async function replaceMessageAttachment(input: {
  attachmentId: string;
  uploadId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  actorUserId: string;
  buffer?: Buffer;
}): Promise<MessageAttachmentDto> {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required.');
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(messageAttachments)
    .where(and(eq(messageAttachments.id, input.attachmentId), isNull(messageAttachments.deletedAt)))
    .limit(1);

  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  if (existing.createdByUserId !== input.actorUserId) {
    throw new Error('VALIDATION:You do not have permission to replace this attachment.');
  }

  validateAttachmentInput({
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    buffer: input.buffer,
  });

  const oldUploadId = existing.uploadId;
  const url = input.url || (await resolveUploadAccessUrlById(input.uploadId)) || '';

  const [row] = await db
    .update(messageAttachments)
    .set({
      uploadId: input.uploadId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      url,
    })
    .where(eq(messageAttachments.id, input.attachmentId))
    .returning();

  try {
    await deleteStoredUpload(oldUploadId);
  } catch {
    // Best-effort cleanup.
  }

  return mapRow(row!);
}

export async function linkAttachmentsToMessage(
  messageId: string,
  attachmentIds: string[],
): Promise<void> {
  if (!isDatabaseEnabled() || attachmentIds.length === 0) {
    return;
  }

  const db = getDb();
  for (const attachmentId of attachmentIds) {
    await db
      .update(messageAttachments)
      .set({ messageId })
      .where(eq(messageAttachments.id, attachmentId));
  }
}
