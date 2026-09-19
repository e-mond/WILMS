import { describe, expect, it } from 'vitest';
import {
  filterOccupations,
  GHANA_OCCUPATIONS,
  OTHER_OCCUPATION_VALUE,
  resolveOccupationLabel,
} from '@wilms/shared-contracts';

describe('Ghana occupation catalogue', () => {
  it('contains Fresh Fish Seller and related fish occupations', () => {
    const labels = GHANA_OCCUPATIONS.map((item) => item.label);
    expect(labels).toEqual(expect.arrayContaining([
      'Fresh Fish Seller',
      'Fried Fish Seller',
      'Smoked Fish Seller',
      'Fishmonger',
      'Fish Trader',
    ]));
  });

  it('filters occupations by search query', () => {
    const fishHits = filterOccupations('fish').map((item) => item.label);
    expect(fishHits).toEqual(
      expect.arrayContaining(['Fresh Fish Seller', 'Fishmonger', 'Fisherwoman']),
    );

    const sellerHits = filterOccupations('seller').map((item) => item.label);
    expect(sellerHits.some((label) => label.toLowerCase().includes('seller'))).toBe(true);

    const farmerHits = filterOccupations('farmer').map((item) => item.label);
    expect(farmerHits).toEqual(expect.arrayContaining(['Farmer', 'Cocoa Farmer']));

    const hairHits = filterOccupations('hair').map((item) => item.label);
    expect(hairHits).toEqual(expect.arrayContaining(['Hairdresser', 'Hair Braider']));
  });

  it('resolves catalogue keys and preserves legacy free-text', () => {
    expect(resolveOccupationLabel('mobile_money_vendor')).toBe('Mobile Money Vendor');
    expect(resolveOccupationLabel('Trader')).toBe('Trader');
    expect(resolveOccupationLabel(OTHER_OCCUPATION_VALUE, 'Charcoal Seller')).toBe(
      'Charcoal Seller',
    );
  });

  it('uses unique occupation values', () => {
    const values = GHANA_OCCUPATIONS.map((item) => item.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
