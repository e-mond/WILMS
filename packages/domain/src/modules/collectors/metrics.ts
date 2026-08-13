/**
 * Pure collector performance metric helpers (trend, streak, rolling months).
 * Kept free of I/O so unit tests can cover formulas without a database.
 */

export type CollectorTrendDirection = 'up' | 'down' | 'neutral';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** ISO date string (YYYY-MM-DD) for the first day of a month offset from `now`. */
export function monthStartIso(now: Date, monthsAgo: number): string {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() - monthsAgo;
  const d = new Date(Date.UTC(year, month, 1));
  return d.toISOString().slice(0, 10);
}

/** Last day of the calendar month containing `monthStart` (YYYY-MM-DD). */
export function monthEndIso(monthStart: string): string {
  const start = new Date(`${monthStart}T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  return end.toISOString().slice(0, 10);
}

export function rollingMonthKeys(now: Date, count = 6): Array<{ key: string; label: string }> {
  const keys: Array<{ key: string; label: string }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = monthStartIso(now, i);
    const monthIndex = Number(start.slice(5, 7)) - 1;
    keys.push({ key: start.slice(0, 7), label: MONTH_LABELS[monthIndex]! });
  }
  return keys;
}

export function collectionRatePercent(collectedPesewas: number, expectedPesewas: number): number {
  if (expectedPesewas <= 0) {
    return collectedPesewas > 0 ? 100 : 0;
  }
  return Math.min(100, Math.round((collectedPesewas / expectedPesewas) * 100));
}

/**
 * Trend compares the latest completed period rate with the previous period.
 * Neutral when the absolute difference is within `neutralBand` percentage points.
 */
export function resolveTrendDirection(
  currentRate: number,
  previousRate: number,
  neutralBand = 2,
): CollectorTrendDirection {
  const delta = currentRate - previousRate;
  if (Math.abs(delta) <= neutralBand) {
    return 'neutral';
  }
  return delta > 0 ? 'up' : 'down';
}

/**
 * Consecutive successful collection weeks counting backwards from the current ISO week.
 * A week is successful when `weekHasCollection` is true for that week key (YYYY-Www).
 */
export function calculateStreakWeeks(
  weekKeysNewestFirst: string[],
  weekHasCollection: ReadonlySet<string> | ReadonlyMap<string, boolean>,
): number {
  let streak = 0;
  for (const key of weekKeysNewestFirst) {
    const ok =
      weekHasCollection instanceof Set
        ? weekHasCollection.has(key)
        : Boolean(weekHasCollection.get(key));
    if (!ok) {
      break;
    }
    streak += 1;
  }
  return streak;
}

/** ISO week key (YYYY-Www) for a calendar date string YYYY-MM-DD. */
export function isoWeekKey(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00.000Z`);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Thursday in current week decides the year
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Newest-first list of ISO week keys covering the last `weekCount` weeks including current. */
export function recentIsoWeekKeys(now: Date, weekCount = 12): string[] {
  const keys: string[] = [];
  for (let i = 0; i < weekCount; i += 1) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    keys.push(isoWeekKey(d.toISOString().slice(0, 10)));
  }
  return keys;
}

export function expectedForMonthPesewas(weeklyExpectedPesewas: number, monthStartIsoDate: string): number {
  if (weeklyExpectedPesewas <= 0) {
    return 0;
  }
  const start = new Date(`${monthStartIsoDate}T00:00:00.000Z`);
  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  // Approximate collection weeks in the month (typically ~4–5).
  const weeks = Math.max(1, Math.round(daysInMonth / 7));
  return weeklyExpectedPesewas * weeks;
}
