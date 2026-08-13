import { describe, expect, it } from 'vitest';
import { buildLocationHierarchyRows, deriveCityTown } from '@/utils/location-hierarchy';

describe('buildLocationHierarchyRows', () => {
  it('renders the official Ghana cascade including community and city', () => {
    const rows = Object.fromEntries(
      buildLocationHierarchyRows({
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
        subDistrictUnit: 'Osu Sub-Metro',
        electoralArea: 'Osu Klottey Electoral Area',
        community: 'Osu',
        city: 'Accra',
      }),
    );

    expect(rows['Region']).toBe('Greater Accra');
    expect(rows['MMDA / District']).toBe('Accra Metropolitan');
    expect(rows['Sub-District Unit']).toBe('Osu Sub-Metro');
    expect(rows['Electoral Area']).toBe('Osu Klottey Electoral Area');
    expect(rows['Community / Suburb']).toBe('Osu');
    expect(rows['City / Town']).toBe('Accra');
  });

  it('does not duplicate city when it matches community', () => {
    const rows = Object.fromEntries(
      buildLocationHierarchyRows({
        region: 'Ashanti',
        district: 'Kumasi Metropolitan',
        community: 'Asafo',
        city: 'Asafo',
      }),
    );

    expect(rows['Community / Suburb']).toBe('Asafo');
    expect(rows['City / Town']).toBe('Not provided');
  });

  it('derives city or town from an MMDA name', () => {
    expect(deriveCityTown('Accra Metropolitan', 'Osu')).toBe('Accra');
    expect(deriveCityTown('Kumasi Metropolitan', 'Asafo')).toBe('Kumasi');
    expect(deriveCityTown('Accra Metropolitan', 'Accra')).toBe('');
  });
});
