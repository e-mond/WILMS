import { asc, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { isUndefinedTableError } from '../lib/db-errors.js';
import { organizationHolidays } from '../db/schema/organization-holidays.js';

export interface OrganizationHolidayRecord {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  branch: string | null;
  source: string;
  enabled: boolean;
  year: number | null;
  externalKey: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: typeof organizationHolidays.$inferSelect): OrganizationHolidayRecord {
  return {
    id: row.id,
    name: row.name,
    holidayDate: row.holidayDate,
    scope: row.scope,
    branch: row.branch,
    source: row.source ?? 'MANUAL',
    enabled: row.enabled ?? true,
    year: row.year ?? null,
    externalKey: row.externalKey ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: (row.updatedAt ?? row.createdAt).toISOString(),
  };
}

export async function listOrganizationHolidays(options?: {
  includeDisabled?: boolean;
}): Promise<OrganizationHolidayRecord[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();

  try {
    const rows = await db
      .select()
      .from(organizationHolidays)
      .where(options?.includeDisabled ? undefined : eq(organizationHolidays.enabled, true))
      .orderBy(asc(organizationHolidays.holidayDate));

    return rows.map(mapRow);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      console.warn(
        '[organization-holidays] table missing — loan schedules will ignore holidays until migrations are applied.',
      );
      return [];
    }

    throw error;
  }
}

export async function insertOrganizationHoliday(input: {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  branch?: string | null;
  source?: string;
  enabled?: boolean;
  year?: number | null;
  externalKey?: string | null;
}): Promise<OrganizationHolidayRecord> {
  const db = getDb();
  const [row] = await db
    .insert(organizationHolidays)
    .values({
      id: input.id,
      name: input.name,
      holidayDate: input.holidayDate,
      scope: input.scope,
      branch: input.branch ?? null,
      source: input.source ?? 'MANUAL',
      enabled: input.enabled ?? true,
      year: input.year ?? null,
      externalKey: input.externalKey ?? null,
    })
    .returning();

  return mapRow(row!);
}

export async function upsertOrganizationHolidayByExternalKey(input: {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  source: string;
  year: number;
  externalKey: string;
}): Promise<'inserted' | 'updated' | 'skipped'> {
  const db = getDb();

  const existing = await db
    .select()
    .from(organizationHolidays)
    .where(eq(organizationHolidays.externalKey, input.externalKey))
    .limit(1);

  if (existing[0]) {
    // Do not overwrite manual edits to name/date when admin customized — only refresh if still provider-owned.
    if (existing[0].source !== 'GHANA_PROVIDER' && existing[0].source !== 'PROVIDER') {
      return 'skipped';
    }

    await db
      .update(organizationHolidays)
      .set({
        name: input.name,
        holidayDate: input.holidayDate,
        scope: input.scope,
        year: input.year,
        source: input.source,
        updatedAt: new Date(),
      })
      .where(eq(organizationHolidays.id, existing[0].id));

    return 'updated';
  }

  await db.insert(organizationHolidays).values({
    id: input.id,
    name: input.name,
    holidayDate: input.holidayDate,
    scope: input.scope,
    branch: null,
    source: input.source,
    enabled: true,
    year: input.year,
    externalKey: input.externalKey,
  });

  return 'inserted';
}

export async function updateOrganizationHoliday(
  id: string,
  input: Partial<
    Pick<
      OrganizationHolidayRecord,
      'name' | 'holidayDate' | 'scope' | 'branch' | 'enabled' | 'source'
    >
  >,
): Promise<OrganizationHolidayRecord | null> {
  const db = getDb();
  const [row] = await db
    .update(organizationHolidays)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.holidayDate !== undefined ? { holidayDate: input.holidayDate } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.branch !== undefined ? { branch: input.branch } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      updatedAt: new Date(),
    })
    .where(eq(organizationHolidays.id, id))
    .returning();

  if (!row) {
    return null;
  }

  return mapRow(row);
}

export async function deleteOrganizationHoliday(id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(organizationHolidays)
    .where(eq(organizationHolidays.id, id))
    .returning({ id: organizationHolidays.id });

  return deleted.length > 0;
}
