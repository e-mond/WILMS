import { describe, expect, it } from 'vitest';
import {
  matchesAnySearchField,
  matchesSearchField,
  normalizePhoneForSearch,
  splitSearchHighlight,
} from '@/utils/search-match';

describe('search-match', () => {
  it('matches partial names case-insensitively', () => {
    expect(matchesSearchField('Ama Mensah', 'mens')).toBe(true);
  });

  it('matches phone numbers ignoring formatting', () => {
    expect(normalizePhoneForSearch('024 412 3456')).toBe('0244123456');
    expect(matchesSearchField('0244123456', '4123')).toBe(true);
  });

  it('matches any configured field', () => {
    expect(
      matchesAnySearchField('BR-001', ['Ama Mensah', '0244123456', 'BR-001']),
    ).toBe(true);
  });

  it('highlights matched segments', () => {
    expect(splitSearchHighlight('Ama Mensah', 'mens')).toEqual([
      { text: 'Ama ', match: false },
      { text: 'Mens', match: true },
      { text: 'ah', match: false },
    ]);
  });
});
