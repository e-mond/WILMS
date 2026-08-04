import { beforeEach, describe, expect, it } from 'vitest';
import * as holidayService from '../../modules/organization-holidays/service.js';

describe('organization holidays service', () => {
  beforeEach(async () => {
    const holidays = await holidayService.listHolidays();
    await Promise.all(holidays.map((holiday) => holidayService.removeHoliday(holiday.id)));
  });

  it('creates and lists holidays in memory mode', async () => {
    const created = await holidayService.createHoliday({
      name: 'Independence Day',
      holidayDate: '2026-03-06',
      scope: 'NATIONAL',
    });

    const holidays = await holidayService.listHolidays();

    expect(created.name).toBe('Independence Day');
    expect(holidays).toHaveLength(1);
    expect(holidays[0]?.holidayDate).toBe('2026-03-06');
  });

  it('updates and deletes holidays', async () => {
    const created = await holidayService.createHoliday({
      name: 'Farmers Day',
      holidayDate: '2026-12-04',
    });

    const updated = await holidayService.updateHoliday(created.id, {
      name: 'National Farmers Day',
    });

    expect(updated.name).toBe('National Farmers Day');

    await holidayService.removeHoliday(created.id);
    expect(await holidayService.listHolidays()).toHaveLength(0);
  });
});
