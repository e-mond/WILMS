/** Pure quiet-hours helpers (no DB) for preferences + unit tests. */

export interface QuietHoursPrefs {
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string;
}

/** Returns true when local time for the preference timezone falls inside quiet hours. */
export function isWithinQuietHours(prefs: QuietHoursPrefs, now = new Date()): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const start = prefs.quietHoursStart;
  const end = prefs.quietHoursEnd;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return false;
  }

  let hhmm: string;
  try {
    hhmm = new Intl.DateTimeFormat('en-GB', {
      timeZone: prefs.quietHoursTimezone || 'Africa/Accra',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
  } catch {
    hhmm = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
  }

  if (start <= end) {
    return hhmm >= start && hhmm < end;
  }
  return hhmm >= start || hhmm < end;
}
