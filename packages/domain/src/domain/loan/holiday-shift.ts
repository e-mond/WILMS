function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

export function normalizeHolidayDates(holidayDates?: Iterable<string>): Set<string> {
  return new Set(holidayDates ?? []);
}

export function adjustDueDateForHolidays(
  dueDate: string,
  holidayDates: ReadonlySet<string>,
  maxShiftDays = 14,
): string {
  if (holidayDates.size === 0 || !holidayDates.has(dueDate)) {
    return dueDate;
  }

  let candidate = dueDate;
  for (let shift = 0; shift < maxShiftDays; shift += 1) {
    candidate = addDays(candidate, 1);
    if (!holidayDates.has(candidate)) {
      return candidate;
    }
  }

  return candidate;
}
