/**
 * Curated Ghana statutory / public holiday provider.
 * Fixed-date holidays + computable Christian movable feasts.
 * Islamic (Eid) dates are year-specific curated entries (update annually).
 */

export interface GhanaHolidayDefinition {
  key: string;
  name: string;
  date: string; // YYYY-MM-DD
  scope: 'NATIONAL';
}

/** Anonymous Gregorian algorithm for Easter Sunday. */
export function easterSundayIso(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Curated Eid dates for near-term years (update via provider data each year). */
const EID_BY_YEAR: Record<number, { eidFitr: string; eidAdha: string }> = {
  2025: { eidFitr: '2025-03-31', eidAdha: '2025-06-07' },
  2026: { eidFitr: '2026-03-20', eidAdha: '2026-05-27' },
  2027: { eidFitr: '2027-03-10', eidAdha: '2027-05-17' },
  2028: { eidFitr: '2028-02-27', eidAdha: '2028-05-05' },
};

export function listGhanaPublicHolidaysForYear(year: number): GhanaHolidayDefinition[] {
  const easter = easterSundayIso(year);
  const goodFriday = addDaysIso(easter, -2);
  const easterMonday = addDaysIso(easter, 1);
  const eid = EID_BY_YEAR[year];

  const fixed: GhanaHolidayDefinition[] = [
    {
      key: `gh-${year}-new-year`,
      name: "New Year's Day",
      date: `${year}-01-01`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-independence`,
      name: 'Independence Day',
      date: `${year}-03-06`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-good-friday`,
      name: 'Good Friday',
      date: goodFriday,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-easter-monday`,
      name: 'Easter Monday',
      date: easterMonday,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-labour-day`,
      name: 'May Day (Labour Day)',
      date: `${year}-05-01`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-founders-day`,
      name: "Founders' Day",
      date: `${year}-08-04`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-nkrumah`,
      name: 'Kwame Nkrumah Memorial Day',
      date: `${year}-09-21`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-farmers-day`,
      // First Friday of December
      name: "Farmers' Day",
      date: firstFridayOfDecember(year),
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-christmas`,
      name: 'Christmas Day',
      date: `${year}-12-25`,
      scope: 'NATIONAL',
    },
    {
      key: `gh-${year}-boxing-day`,
      name: 'Boxing Day',
      date: `${year}-12-26`,
      scope: 'NATIONAL',
    },
  ];

  if (eid) {
    fixed.push(
      {
        key: `gh-${year}-eid-fitr`,
        name: 'Eid ul-Fitr',
        date: eid.eidFitr,
        scope: 'NATIONAL',
      },
      {
        key: `gh-${year}-eid-adha`,
        name: 'Eid ul-Adha',
        date: eid.eidAdha,
        scope: 'NATIONAL',
      },
    );
  }

  return fixed.sort((a, b) => a.date.localeCompare(b.date));
}

function firstFridayOfDecember(year: number): string {
  const date = new Date(Date.UTC(year, 11, 1));
  while (date.getUTCDay() !== 5) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}
