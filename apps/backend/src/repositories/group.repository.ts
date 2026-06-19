import { eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb } from '../db/client.js';
import {
  groupFormationQueue,
  groupSequenceCounters,
  groups,
} from '../db/schema/groups.js';
import type { GroupRecord } from '../db/store.js';

function rowToRecord(row: typeof groups.$inferSelect, memberIds: string[]): GroupRecord {
  return {
    id: row.id,
    systemId: row.systemId,
    name: row.name,
    displayName: row.displayName,
    community: row.community,
    memberIds,
    formedAt: row.formedAt.toISOString(),
  };
}

export async function saveGroup(record: GroupRecord): Promise<GroupRecord> {
  const db = getDb();
  await db.insert(groups).values({
    id: record.id,
    systemId: record.systemId,
    name: record.name,
    displayName: record.displayName,
    community: record.community,
    formedAt: new Date(record.formedAt),
    status: 'ACTIVE',
  });

  return record;
}

export async function listGroups(): Promise<GroupRecord[]> {
  const db = getDb();
  const rows = await db.select().from(groups);
  return rows.map((row) => rowToRecord(row, []));
}

export async function getApprovedQueue(community: string) {
  const db = getDb();
  const key = community.trim().toLowerCase();
  const rows = await db
    .select()
    .from(groupFormationQueue)
    .where(eq(sql`lower(${groupFormationQueue.community})`, key));

  return rows.map((row) => ({
    borrowerId: row.borrowerId,
    fullName: row.fullName,
    community: row.community,
    approvedAt: row.approvedAt.toISOString(),
  }));
}

export async function setApprovedQueue(
  community: string,
  queue: { borrowerId: string; fullName: string; community: string; approvedAt: string }[],
): Promise<void> {
  const db = getDb();
  const key = community.trim().toLowerCase();

  await db.delete(groupFormationQueue).where(eq(sql`lower(${groupFormationQueue.community})`, key));

  if (queue.length === 0) {
    return;
  }

  await db.insert(groupFormationQueue).values(
    queue.map((entry) => ({
      community: entry.community,
      borrowerId: entry.borrowerId,
      fullName: entry.fullName,
      approvedAt: new Date(entry.approvedAt),
    })),
  );
}

export async function nextGroupSequence(monthKey: string): Promise<number> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(groupSequenceCounters)
    .where(eq(groupSequenceCounters.monthKey, monthKey))
    .limit(1);

  const next = (existing?.lastSequence ?? 0) + 1;

  if (existing) {
    await db
      .update(groupSequenceCounters)
      .set({ lastSequence: next })
      .where(eq(groupSequenceCounters.monthKey, monthKey));
  } else {
    await db.insert(groupSequenceCounters).values({ monthKey, lastSequence: next });
  }

  return next;
}

export function nextGroupId(): string {
  return uuidv7();
}
