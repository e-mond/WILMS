import { eq } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { systemSettings } from '../db/schema/system-settings.js';

const DEFAULT_SETTINGS_ID = 'default';

export type SystemSettingsRow = typeof systemSettings.$inferSelect;
export type SystemSettingsUpdate = Partial<
  Omit<typeof systemSettings.$inferInsert, 'id' | 'updatedAt'>
>;

export async function ensureDefaultSettingsRow(): Promise<SystemSettingsRow> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, DEFAULT_SETTINGS_ID))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [inserted] = await db
    .insert(systemSettings)
    .values({ id: DEFAULT_SETTINGS_ID })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return inserted;
  }

  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.id, DEFAULT_SETTINGS_ID))
    .limit(1);

  if (!row) {
    throw new Error('SERVER');
  }

  return row;
}

export async function getSystemSettingsRow(): Promise<SystemSettingsRow> {
  return ensureDefaultSettingsRow();
}

export async function updateSystemSettingsRow(
  patch: SystemSettingsUpdate,
): Promise<SystemSettingsRow> {
  const db = getDb();
  await ensureDefaultSettingsRow();

  const [updated] = await db
    .update(systemSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(systemSettings.id, DEFAULT_SETTINGS_ID))
    .returning();

  if (!updated) {
    throw new Error('SERVER');
  }

  return updated;
}
