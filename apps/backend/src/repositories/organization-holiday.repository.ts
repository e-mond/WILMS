import { asc, eq } from 'drizzle-orm';
import { getDb, isDatabaseEnabled } from '../db/client.js';
import { organizationHolidays } from '../db/schema/organization-holidays.js';

export interface OrganizationHolidayRecord {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  branch: string | null;
  createdAt: string;
}

export async function listOrganizationHolidays(): Promise<OrganizationHolidayRecord[]> {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(organizationHolidays)
    .orderBy(asc(organizationHolidays.holidayDate));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    holidayDate: row.holidayDate,
    scope: row.scope,
    branch: row.branch,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function insertOrganizationHoliday(input: {
  id: string;
  name: string;
  holidayDate: string;
  scope: string;
  branch?: string | null;
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
    })
    .returning();

  return {
    id: row!.id,
    name: row!.name,
    holidayDate: row!.holidayDate,
    scope: row!.scope,
    branch: row!.branch,
    createdAt: row!.createdAt.toISOString(),
  };
}

export async function updateOrganizationHoliday(
  id: string,
  input: Partial<Pick<OrganizationHolidayRecord, 'name' | 'holidayDate' | 'scope' | 'branch'>>,
): Promise<OrganizationHolidayRecord | null> {
  const db = getDb();
  const [row] = await db
    .update(organizationHolidays)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.holidayDate !== undefined ? { holidayDate: input.holidayDate } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      ...(input.branch !== undefined ? { branch: input.branch } : {}),
    })
    .where(eq(organizationHolidays.id, id))
    .returning();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    holidayDate: row.holidayDate,
    scope: row.scope,
    branch: row.branch,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteOrganizationHoliday(id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(organizationHolidays)
    .where(eq(organizationHolidays.id, id))
    .returning({ id: organizationHolidays.id });

  return deleted.length > 0;
}
