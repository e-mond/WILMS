import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import type { OrganizationHolidayRecord } from '../../repositories/organization-holiday.repository.js';

const memoryHolidays: OrganizationHolidayRecord[] = [];

export async function listHolidays(): Promise<OrganizationHolidayRecord[]> {
  if (!isDatabaseEnabled()) {
    return [...memoryHolidays].sort((left, right) =>
      left.holidayDate.localeCompare(right.holidayDate),
    );
  }

  const { listOrganizationHolidays } = await import(
    '../../repositories/organization-holiday.repository.js'
  );
  return listOrganizationHolidays();
}

export async function createHoliday(input: {
  name: string;
  holidayDate: string;
  scope?: string;
  branch?: string | null;
}): Promise<OrganizationHolidayRecord> {
  const name = input.name.trim();
  const holidayDate = input.holidayDate.trim();

  if (!name || !holidayDate) {
    throw new Error('VALIDATION:Holiday name and date are required.');
  }

  const record: OrganizationHolidayRecord = {
    id: uuidv7(),
    name,
    holidayDate,
    scope: input.scope?.trim() || 'NATIONAL',
    branch: input.branch?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseEnabled()) {
    memoryHolidays.push(record);
    return record;
  }

  const { insertOrganizationHoliday } = await import(
    '../../repositories/organization-holiday.repository.js'
  );
  return insertOrganizationHoliday(record);
}

export async function updateHoliday(
  id: string,
  input: Partial<Pick<OrganizationHolidayRecord, 'name' | 'holidayDate' | 'scope' | 'branch'>>,
): Promise<OrganizationHolidayRecord> {
  if (!isDatabaseEnabled()) {
    const index = memoryHolidays.findIndex((entry) => entry.id === id);
    if (index < 0) {
      throw new Error('NOT_FOUND');
    }

    memoryHolidays[index] = {
      ...memoryHolidays[index]!,
      ...input,
      name: input.name?.trim() ?? memoryHolidays[index]!.name,
      holidayDate: input.holidayDate?.trim() ?? memoryHolidays[index]!.holidayDate,
      scope: input.scope?.trim() ?? memoryHolidays[index]!.scope,
      branch:
        input.branch === undefined ? memoryHolidays[index]!.branch : input.branch?.trim() || null,
    };

    return memoryHolidays[index]!;
  }

  const { updateOrganizationHoliday } = await import(
    '../../repositories/organization-holiday.repository.js'
  );
  const updated = await updateOrganizationHoliday(id, input);

  if (!updated) {
    throw new Error('NOT_FOUND');
  }

  return updated;
}

export async function removeHoliday(id: string): Promise<void> {
  if (!isDatabaseEnabled()) {
    const index = memoryHolidays.findIndex((entry) => entry.id === id);
    if (index < 0) {
      throw new Error('NOT_FOUND');
    }

    memoryHolidays.splice(index, 1);
    return;
  }

  const { deleteOrganizationHoliday } = await import(
    '../../repositories/organization-holiday.repository.js'
  );
  const deleted = await deleteOrganizationHoliday(id);

  if (!deleted) {
    throw new Error('NOT_FOUND');
  }
}
