import { describe, expect, it } from 'vitest';
import { easterSundayIso, listGhanaPublicHolidaysForYear } from '../../modules/organization-holidays/ghana-provider.js';

describe('Ghana holiday provider', () => {
  it('computes Easter Sunday for a known year', () => {
    expect(easterSundayIso(2026)).toBe('2026-04-05');
  });

  it('returns core Ghana public holidays for a year', () => {
    const holidays = listGhanaPublicHolidaysForYear(2026);
    const names = holidays.map((entry) => entry.name);
    expect(names).toContain('Independence Day');
    expect(names).toContain('Good Friday');
    expect(names).toContain('Easter Monday');
    expect(names).toContain('Christmas Day');
    expect(names).toContain('Boxing Day');
    expect(names).toContain("Farmers' Day");
    expect(holidays.every((entry) => entry.date.startsWith('2026-'))).toBe(true);
  });
});
