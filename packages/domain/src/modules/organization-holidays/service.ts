import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import type { OrganizationHolidayRecord } from '../../repositories/organization-holiday.repository.js';
import { listGhanaPublicHolidaysForYear } from './ghana-provider.js';

const memoryHolidays: OrganizationHolidayRecord[] = [];

function withDefaults(
  partial: OrganizationHolidayRecord,
): OrganizationHolidayRecord {
  return {
    ...partial,
    source: partial.source ?? 'MANUAL',
    enabled: partial.enabled ?? true,
    year: partial.year ?? null,
    externalKey: partial.externalKey ?? null,
    updatedAt: partial.updatedAt ?? partial.createdAt,
  };
}

export async function listHolidays(options?: {
  includeDisabled?: boolean;
}): Promise<OrganizationHolidayRecord[]> {
  if (!isDatabaseEnabled()) {
    return [...memoryHolidays]
      .filter((entry) => (options?.includeDisabled ? true : entry.enabled))
      .sort((left, right) => left.holidayDate.localeCompare(right.holidayDate));
  }

  const { listOrganizationHolidays } = await import(
    '../../repositories/organization-holiday.repository.js'
  );
  return listOrganizationHolidays(options);
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

  const now = new Date().toISOString();
  const record = withDefaults({
    id: uuidv7(),
    name,
    holidayDate,
    scope: input.scope?.trim() || 'NATIONAL',
    branch: input.branch?.trim() || null,
    source: 'MANUAL',
    enabled: true,
    year: Number(holidayDate.slice(0, 4)) || null,
    externalKey: null,
    createdAt: now,
    updatedAt: now,
  });

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
  input: Partial<
    Pick<OrganizationHolidayRecord, 'name' | 'holidayDate' | 'scope' | 'branch' | 'enabled'>
  >,
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
      enabled: input.enabled ?? memoryHolidays[index]!.enabled,
      updatedAt: new Date().toISOString(),
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

export async function syncGhanaPublicHolidays(year = new Date().getUTCFullYear()): Promise<{
  year: number;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}> {
  const definitions = listGhanaPublicHolidaysForYear(year);

  if (!isDatabaseEnabled()) {
    let inserted = 0;
    for (const definition of definitions) {
      const exists = memoryHolidays.some((entry) => entry.externalKey === definition.key);
      if (exists) {
        continue;
      }
      const now = new Date().toISOString();
      memoryHolidays.push(
        withDefaults({
          id: uuidv7(),
          name: definition.name,
          holidayDate: definition.date,
          scope: definition.scope,
          branch: null,
          source: 'GHANA_PROVIDER',
          enabled: true,
          year,
          externalKey: definition.key,
          createdAt: now,
          updatedAt: now,
        }),
      );
      inserted += 1;
    }
    return { year, inserted, updated: 0, skipped: definitions.length - inserted, total: definitions.length };
  }

  const { upsertOrganizationHolidayByExternalKey } = await import(
    '../../repositories/organization-holiday.repository.js'
  );

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const definition of definitions) {
    const result = await upsertOrganizationHolidayByExternalKey({
      id: uuidv7(),
      name: definition.name,
      holidayDate: definition.date,
      scope: definition.scope,
      source: 'GHANA_PROVIDER',
      year,
      externalKey: definition.key,
    });
    if (result === 'inserted') inserted += 1;
    else if (result === 'updated') updated += 1;
    else skipped += 1;
  }

  return { year, inserted, updated, skipped, total: definitions.length };
}

/** Ensure current year Ghana holidays exist (idempotent). Call from list when empty provider set. */
export async function ensureCurrentYearGhanaHolidays(): Promise<void> {
  const year = new Date().getUTCFullYear();
  try {
    const holidays = await listHolidays({ includeDisabled: true });
    const hasProvider = holidays.some(
      (entry) => entry.source === 'GHANA_PROVIDER' && entry.year === year,
    );
    if (!hasProvider) {
      await syncGhanaPublicHolidays(year);
    }
  } catch {
    // Best-effort import — never break holiday reads.
  }
}
