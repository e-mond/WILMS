import { and, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { WilmsDb } from '../db/client.js';
import { getDb } from '../db/client.js';
import { uploads } from '../db/schema/uploads.js';
import type { StoredUpload } from '../infrastructure/uploads/types.js';

function rowToStoredUpload(row: typeof uploads.$inferSelect): StoredUpload {
  return {
    id: row.id,
    purpose: row.purpose,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: row.url ?? '',
    entityId: row.entityId ?? undefined,
    uploadedAt: row.uploadedAt.toISOString(),
    storageKey: row.storageKey,
  };
}

export async function insertUpload(
  input: StoredUpload & { ownerUserId?: string; entityType?: string },
  tx: WilmsDb = getDb(),
): Promise<StoredUpload> {
  const id = input.id || uuidv7();
  const uploadedAt = new Date(input.uploadedAt);

  await tx.insert(uploads).values({
    id,
    purpose: input.purpose as typeof uploads.$inferInsert.purpose,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    storageKey: input.storageKey,
    url: input.url,
    entityType: input.entityType,
    entityId: input.entityId,
    ownerUserId: input.ownerUserId,
    uploadedAt,
  });

  return { ...input, id };
}

export async function findUploadById(id: string, tx: WilmsDb = getDb()) {
  const [row] = await tx
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, id), isNull(uploads.deletedAt)))
    .limit(1);

  return row ? rowToStoredUpload(row) : null;
}

export async function findUploadOwnerById(id: string, tx: WilmsDb = getDb()): Promise<string | null | undefined> {
  const [row] = await tx
    .select({ ownerUserId: uploads.ownerUserId })
    .from(uploads)
    .where(and(eq(uploads.id, id), isNull(uploads.deletedAt)))
    .limit(1);

  if (!row) {
    return undefined;
  }

  return row.ownerUserId ?? null;
}

export async function softDeleteUpload(id: string, tx: WilmsDb = getDb()) {
  const deletedAt = new Date();
  const result = await tx
    .update(uploads)
    .set({ deletedAt })
    .where(and(eq(uploads.id, id), isNull(uploads.deletedAt)));

  return (result.rowCount ?? 0) > 0;
}
