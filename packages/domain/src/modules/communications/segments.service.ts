import { and, desc, eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import {
  communicationAudienceSegments,
  communicationMessageReads,
} from '../../db/schema/communications.js';
import type { AudienceType } from './audience.js';

export interface AudienceSegmentDto {
  id: string;
  name: string;
  description?: string;
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

const memorySegments: AudienceSegmentDto[] = [];

function mapSegment(
  row: typeof communicationAudienceSegments.$inferSelect,
): AudienceSegmentDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    audienceType: row.audienceType as AudienceType,
    audienceFilter: (row.audienceFilter as Record<string, unknown>) ?? undefined,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAudienceSegments(): Promise<AudienceSegmentDto[]> {
  if (!isDatabaseEnabled()) {
    return [...memorySegments];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(communicationAudienceSegments)
    .where(isNull(communicationAudienceSegments.deletedAt))
    .orderBy(desc(communicationAudienceSegments.updatedAt));

  return rows.map(mapSegment);
}

export async function createAudienceSegment(input: {
  name: string;
  description?: string;
  audienceType: AudienceType;
  audienceFilter?: Record<string, unknown>;
  createdByUserId: string;
}): Promise<AudienceSegmentDto> {
  const now = new Date();
  const id = uuidv7();

  if (!isDatabaseEnabled()) {
    const dto: AudienceSegmentDto = {
      id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      audienceType: input.audienceType,
      audienceFilter: input.audienceFilter,
      createdByUserId: input.createdByUserId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    memorySegments.unshift(dto);
    return dto;
  }

  const db = getDb();
  const [row] = await db
    .insert(communicationAudienceSegments)
    .values({
      id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      audienceType: input.audienceType,
      audienceFilter: input.audienceFilter ?? null,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return mapSegment(row!);
}

export async function updateAudienceSegment(
  segmentId: string,
  input: {
    name?: string;
    description?: string | null;
    audienceType?: AudienceType;
    audienceFilter?: Record<string, unknown> | null;
  },
): Promise<AudienceSegmentDto> {
  if (!isDatabaseEnabled()) {
    const index = memorySegments.findIndex((entry) => entry.id === segmentId);
    if (index < 0) {
      throw new Error('NOT_FOUND');
    }
    const existing = memorySegments[index]!;
    const updated: AudienceSegmentDto = {
      ...existing,
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === null
          ? undefined
          : (input.description?.trim() ?? existing.description),
      audienceType: input.audienceType ?? existing.audienceType,
      audienceFilter:
        input.audienceFilter === null
          ? undefined
          : (input.audienceFilter ?? existing.audienceFilter),
      updatedAt: new Date().toISOString(),
    };
    memorySegments[index] = updated;
    return updated;
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(communicationAudienceSegments)
    .where(
      and(
        eq(communicationAudienceSegments.id, segmentId),
        isNull(communicationAudienceSegments.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const [row] = await db
    .update(communicationAudienceSegments)
    .set({
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? existing.description
          : input.description?.trim() || null,
      audienceType: input.audienceType ?? existing.audienceType,
      audienceFilter:
        input.audienceFilter === undefined
          ? existing.audienceFilter
          : input.audienceFilter,
      updatedAt: new Date(),
    })
    .where(eq(communicationAudienceSegments.id, segmentId))
    .returning();

  return mapSegment(row!);
}

export async function deleteAudienceSegment(segmentId: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    const index = memorySegments.findIndex((entry) => entry.id === segmentId);
    if (index < 0) {
      throw new Error('NOT_FOUND');
    }
    memorySegments.splice(index, 1);
    return;
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: communicationAudienceSegments.id })
    .from(communicationAudienceSegments)
    .where(
      and(
        eq(communicationAudienceSegments.id, segmentId),
        isNull(communicationAudienceSegments.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  await db
    .update(communicationAudienceSegments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(communicationAudienceSegments.id, segmentId));
}

export async function markMessageRead(input: {
  messageId: string;
  userId: string;
}): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }

  const db = getDb();
  try {
    await db.insert(communicationMessageReads).values({
      id: uuidv7(),
      messageId: input.messageId,
      userId: input.userId,
      readAt: new Date(),
    });
  } catch {
    // Unique (message_id, user_id) — already read.
  }
}

export async function countMessageReads(messageId: string): Promise<number> {
  if (!isDatabaseEnabled()) {
    return 0;
  }

  const db = getDb();
  const rows = await db
    .select({ id: communicationMessageReads.id })
    .from(communicationMessageReads)
    .where(eq(communicationMessageReads.messageId, messageId));
  return rows.length;
}
