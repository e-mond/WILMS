import { and, desc, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getDb } from '../db/client.js';
import { registrationDrafts } from '../db/schema/registration-drafts.js';

export interface RegistrationDraftRecord {
  id: string;
  officerUserId: string;
  draftPayload: Record<string, unknown>;
  lastCompletedStep: number;
  createdAt: string;
  updatedAt: string;
}

function rowToRecord(row: typeof registrationDrafts.$inferSelect): RegistrationDraftRecord {
  return {
    id: row.id,
    officerUserId: row.officerUserId,
    draftPayload: (row.draftPayload ?? {}) as Record<string, unknown>,
    lastCompletedStep: row.lastCompletedStep,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRegistrationDrafts(officerUserId: string): Promise<RegistrationDraftRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(registrationDrafts)
    .where(eq(registrationDrafts.officerUserId, officerUserId))
    .orderBy(desc(registrationDrafts.updatedAt));

  return rows.map(rowToRecord);
}

export async function getRegistrationDraft(
  id: string,
  officerUserId: string,
): Promise<RegistrationDraftRecord | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(registrationDrafts)
    .where(and(eq(registrationDrafts.id, id), eq(registrationDrafts.officerUserId, officerUserId)))
    .limit(1);

  return row ? rowToRecord(row) : undefined;
}

export async function createRegistrationDraft(
  officerUserId: string,
  draftPayload: Record<string, unknown> = {},
): Promise<RegistrationDraftRecord> {
  const db = getDb();
  const id = uuidv7();
  const now = new Date();

  const [row] = await db
    .insert(registrationDrafts)
    .values({
      id,
      officerUserId,
      draftPayload,
      lastCompletedStep: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return rowToRecord(row!);
}

export async function updateRegistrationDraft(
  id: string,
  officerUserId: string,
  draftPayload: Record<string, unknown>,
  lastCompletedStep: number,
): Promise<RegistrationDraftRecord | undefined> {
  const db = getDb();
  const now = new Date();

  const [row] = await db
    .update(registrationDrafts)
    .set({
      draftPayload,
      lastCompletedStep,
      updatedAt: now,
    })
    .where(and(eq(registrationDrafts.id, id), eq(registrationDrafts.officerUserId, officerUserId)))
    .returning();

  return row ? rowToRecord(row) : undefined;
}

export async function deleteRegistrationDraft(id: string, officerUserId: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(registrationDrafts)
    .where(and(eq(registrationDrafts.id, id), eq(registrationDrafts.officerUserId, officerUserId)))
    .returning({ id: registrationDrafts.id });

  return deleted.length > 0;
}
